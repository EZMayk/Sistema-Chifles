import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Payment } from "../models/payment.entity";
import { CreatePaymentDto, PaymentResponseDto } from "../models/payment.dto";
import { PaymentAdapterFactory } from "../adapters/payment.adapter.factory";
import { PaymentStatus } from "../providers/payment.provider";
import { PaymentEvent, PaymentEventType } from "../models/payment-event.model";
import { WebhookDispatcherService } from "../webhooks/webhook-dispatcher.service";
import { PaymentGateway } from "../websockets/payment.gateway";
import { OrderSyncService } from "../services/order-sync.service";
import { Logger } from "../utils/logger";

@Injectable()
export class PaymentService {
  private logger = new Logger("PaymentService");

  constructor(
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    private webhookDispatcher: WebhookDispatcherService,
    private paymentGateway: PaymentGateway,
    private orderSyncService: OrderSyncService,
  ) {}

  /**
   * Create a new payment
   * @param createPaymentDto Payment data to create
   * @returns Created payment object
   */
  async createPayment(
    createPaymentDto: CreatePaymentDto,
  ): Promise<PaymentResponseDto> {
    try {
      const {
        orderId,
        amount,
        currency,
        provider = "mock",
        metadata,
      } = createPaymentDto;

      // Get the appropriate payment adapter
      const paymentAdapter = PaymentAdapterFactory.createAdapter(provider);

      // Call provider to create payment
      const providerResponse = await paymentAdapter.createPayment(
        amount,
        currency,
        orderId,
        metadata,
      );

      // Save payment to database
      const payment = this.paymentRepository.create({
        orderId,
        transactionId: providerResponse.transactionId,
        amount,
        currency,
        status: providerResponse.status,
        provider,
        metadata: providerResponse.metadata || {},
      });

      const savedPayment = await this.paymentRepository.save(payment);

      this.logger.log(
        `Payment created: ${savedPayment.id} (Order: ${orderId})`,
      );

      return this.mapToResponseDto(savedPayment);
    } catch (error) {
      this.logger.error("Error creating payment", error);
      throw error;
    }
  }

  /**
   * Confirm a payment
   * Triggers: webhook dispatch to partners + WebSocket notifications
   * @param transactionId Transaction ID to confirm
   * @param metadata Additional metadata
   * @returns Confirmed payment object
   */
  async confirmPayment(
    transactionId: string,
    metadata?: Record<string, any>,
  ): Promise<PaymentResponseDto> {
    try {
      const payment = await this.paymentRepository.findOne({
        where: { transactionId },
      });

      if (!payment) {
        throw new Error(`Payment not found: ${transactionId}`);
      }

      // Get provider from payment
      const paymentAdapter = PaymentAdapterFactory.createAdapter(
        payment.provider,
      );

      // Confirm with provider
      const providerResponse = await paymentAdapter.confirmPayment(
        transactionId,
        metadata,
      );

      // Update payment in database
      payment.status = providerResponse.status;
      payment.metadata = {
        ...payment.metadata,
        ...providerResponse.metadata,
      };

      const updatedPayment = await this.paymentRepository.save(payment);

      this.logger.log(`Payment confirmed: ${transactionId}`);

      // === INTEGRATION: Create normalized PaymentEvent ===
      const paymentEvent = PaymentEvent.fromMockAdapter({
        paymentId: updatedPayment.id,
        transactionId: updatedPayment.transactionId,
        amount: updatedPayment.amount,
        currency: updatedPayment.currency,
        status: updatedPayment.status,
        timestamp: new Date(),
        metadata: {
          orderId: updatedPayment.orderId,
          ...updatedPayment.metadata,
        },
      });

      // === INTEGRATION: Dispatch webhook to partners ===
      await this.webhookDispatcher
        .dispatchEvent({
          event_type: "payment.confirmed",
          transaction_id: transactionId,
          payload: paymentEvent.toJSON(),
        })
        .catch((error) => {
          this.logger.error("Failed to dispatch webhook", error);
          // Emit error notification via WebSocket
          this.paymentGateway.notifyStatusUpdate({
            type: "webhook_dispatch_error",
            message: `Failed to dispatch payment confirmed webhook for transaction ${transactionId}`,
            level: "error",
            metadata: { transactionId, error: error.message },
          });
        });

      // === INTEGRATION: Update order status in Api-Rest ===
      await this.orderSyncService
        .markOrderAsPaid(updatedPayment.orderId)
        .catch((error) => {
          this.logger.error("Failed to update order status", error);
        });

      // === INTEGRATION: Notify via WebSocket ===
      this.paymentGateway.notifyPaymentConfirmed({
        paymentId: updatedPayment.id,
        transactionId: updatedPayment.transactionId,
        amount: updatedPayment.amount,
        currency: updatedPayment.currency,
        orderId: updatedPayment.orderId,
        customerId: updatedPayment.metadata?.customerId,
        timestamp: new Date(),
      });

      return this.mapToResponseDto(updatedPayment);
    } catch (error) {
      this.logger.error("Error confirming payment", error);
      throw error;
    }
  }

  /**
   * Get payment by ID
   * @param paymentId Payment ID
   * @returns Payment object
   */
  async getPayment(paymentId: string): Promise<PaymentResponseDto> {
    try {
      const payment = await this.paymentRepository.findOne({
        where: { id: paymentId },
      });

      if (!payment) {
        throw new Error(`Payment not found: ${paymentId}`);
      }

      return this.mapToResponseDto(payment);
    } catch (error) {
      this.logger.error("Error fetching payment", error);
      throw error;
    }
  }

  /**
   * Get payment by transaction ID
   * @param transactionId Transaction ID
   * @returns Payment object
   */
  async getPaymentByTransactionId(
    transactionId: string,
  ): Promise<PaymentResponseDto> {
    try {
      const payment = await this.paymentRepository.findOne({
        where: { transactionId },
      });

      if (!payment) {
        throw new Error(`Payment not found: ${transactionId}`);
      }

      return this.mapToResponseDto(payment);
    } catch (error) {
      this.logger.error("Error fetching payment by transaction ID", error);
      throw error;
    }
  }

  /**
   * Refund a payment
   * @param transactionId Transaction ID to refund
   * @param amount Optional refund amount (partial refunds)
   * @returns Refunded payment object
   */
  async refundPayment(
    transactionId: string,
    amount?: number,
  ): Promise<PaymentResponseDto> {
    try {
      const payment = await this.paymentRepository.findOne({
        where: { transactionId },
      });

      if (!payment) {
        throw new Error(`Payment not found: ${transactionId}`);
      }

      // Get provider adapter
      const paymentAdapter = PaymentAdapterFactory.createAdapter(
        payment.provider,
      );

      // Call provider refund
      const providerResponse = await paymentAdapter.refund(
        transactionId,
        amount,
      );

      // Update payment status
      payment.status = providerResponse.status;
      payment.metadata = {
        ...payment.metadata,
        refundedAmount: amount || payment.amount,
        refundedAt: new Date().toISOString(),
      };

      const updatedPayment = await this.paymentRepository.save(payment);

      this.logger.log(`Payment refunded: ${transactionId}`);

      // === INTEGRATION: Notify via WebSocket ===
      this.paymentGateway.notifyStatusUpdate({
        type: "payment_refunded",
        message: `Payment refunded: ${transactionId}`,
        level: "info",
        metadata: {
          transactionId,
          refundedAmount: amount || payment.amount,
          orderId: updatedPayment.orderId,
        },
      });

      return this.mapToResponseDto(updatedPayment);
    } catch (error) {
      this.logger.error("Error refunding payment", error);
      throw error;
    }
  }

  /**
   * Get all payments for an order
   * @param orderId Order ID
   * @returns Array of payments
   */
  async getPaymentsByOrderId(orderId: string): Promise<PaymentResponseDto[]> {
    try {
      const payments = await this.paymentRepository.find({
        where: { orderId },
        order: { createdAt: "DESC" },
      });

      return payments.map((payment) => this.mapToResponseDto(payment));
    } catch (error) {
      this.logger.error("Error fetching payments by order ID", error);
      throw error;
    }
  }

  /**
   * Update payment status (used by webhooks)
   * @param transactionId Transaction ID
   * @param status New status
   * @param metadata Additional metadata
   */
  async updatePaymentStatus(
    transactionId: string,
    status: string,
    metadata?: Record<string, any>,
  ): Promise<PaymentResponseDto> {
    try {
      const payment = await this.paymentRepository.findOne({
        where: { transactionId },
      });

      if (!payment) {
        throw new Error(`Payment not found: ${transactionId}`);
      }

      payment.status = status;
      payment.metadata = {
        ...payment.metadata,
        ...metadata,
      };

      const updatedPayment = await this.paymentRepository.save(payment);

      this.logger.log(`Payment status updated: ${transactionId} -> ${status}`);

      // Notify via WebSocket
      this.paymentGateway.notifyStatusUpdate({
        type: "payment_status_update",
        message: `Payment ${transactionId} status: ${status}`,
        level: status === "failed" ? "error" : "info",
        metadata: {
          transactionId,
          orderId: updatedPayment.orderId,
          status,
        },
      });

      // === INTEGRATION: Update order status based on payment status ===
      if (status === "failed") {
        await this.orderSyncService
          .markOrderAsPaymentFailed(updatedPayment.orderId)
          .catch((error) => {
            this.logger.error("Failed to update order status to failed", error);
          });
      } else if (status === "refunded") {
        await this.orderSyncService
          .markOrderAsRefunded(updatedPayment.orderId)
          .catch((error) => {
            this.logger.error("Failed to update order status to refunded", error);
          });
      } else if (status === "cancelled") {
        await this.orderSyncService
          .markOrderAsCancelled(updatedPayment.orderId)
          .catch((error) => {
            this.logger.error("Failed to update order status to cancelled", error);
          });
      }

      return this.mapToResponseDto(updatedPayment);
    } catch (error) {
      this.logger.error("Error updating payment status", error);
      throw error;
    }
  }

  /**
   * Map payment entity to response DTO
   */
  private mapToResponseDto(payment: Payment): PaymentResponseDto {
    return {
      id: payment.id,
      orderId: payment.orderId,
      transactionId: payment.transactionId,
      amount: payment.amount,
      currency: payment.currency,
      status: payment.status,
      provider: payment.provider,
      metadata: payment.metadata,
      errorMessage: payment.errorMessage,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
    };
  }
}
