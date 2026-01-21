import { Injectable } from "@nestjs/common";
import Stripe from "stripe";
import {
  IPaymentProvider,
  PaymentResponse,
  PaymentStatus,
} from "../providers/payment.provider";

/**
 * Stripe Payment Adapter
 * Integrates with Stripe API for payment processing
 */
@Injectable()
export class StripePaymentAdapter implements IPaymentProvider {
  private stripe: Stripe;

  constructor() {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      throw new Error("STRIPE_SECRET_KEY is not configured");
    }
    this.stripe = new Stripe(secretKey, {
      apiVersion: "2025-12-15.clover" as any,
    });
  }

  /**
   * Create a Payment Intent with Stripe
   * @param amount Amount in decimal (will be converted to cents)
   * @param currency Currency code (usd, pen, etc.)
   * @param orderId Order identifier for reference
   * @param metadata Additional metadata
   */
  async createPayment(
    amount: number,
    currency: string,
    orderId: string,
    metadata?: Record<string, any>,
  ): Promise<PaymentResponse> {
    try {
      // Create a Payment Intent
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: currency.toLowerCase(),
        metadata: {
          orderId,
          ...metadata,
        },
        automatic_payment_methods: {
          enabled: true,
        },
      });

      return {
        transactionId: paymentIntent.id,
        orderId,
        status: this.mapStripeStatus(paymentIntent.status),
        amount: paymentIntent.amount / 100, // Convert back to decimal
        currency: paymentIntent.currency.toUpperCase(),
        provider: "stripe",
        timestamp: new Date(),
        metadata: {
          clientSecret: paymentIntent.client_secret, // Needed by frontend
          paymentIntentId: paymentIntent.id,
          ...metadata,
        },
      };
    } catch (error) {
      console.error("Stripe createPayment error:", error);
      return {
        transactionId: "",
        orderId,
        status: PaymentStatus.FAILED,
        amount,
        currency,
        provider: "stripe",
        timestamp: new Date(),
        errorMessage: error.message,
      };
    }
  }

  /**
   * Confirm a Payment Intent (usually done client-side with Stripe.js)
   * This method is for server-side confirmation if needed
   */
  async confirmPayment(
    transactionId: string,
    metadata?: Record<string, any>,
  ): Promise<PaymentResponse> {
    try {
      const paymentIntent =
        await this.stripe.paymentIntents.retrieve(transactionId);

      return {
        transactionId: paymentIntent.id,
        orderId: paymentIntent.metadata?.orderId || "unknown",
        status: this.mapStripeStatus(paymentIntent.status),
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency.toUpperCase(),
        provider: "stripe",
        timestamp: new Date(),
        metadata: {
          ...paymentIntent.metadata,
          ...metadata,
        },
      };
    } catch (error) {
      console.error("Stripe confirmPayment error:", error);
      return {
        transactionId,
        orderId: "unknown",
        status: PaymentStatus.FAILED,
        amount: 0,
        currency: "USD",
        provider: "stripe",
        timestamp: new Date(),
        errorMessage: error.message,
      };
    }
  }

  /**
   * Refund a payment
   */
  async refund(
    transactionId: string,
    amount?: number,
  ): Promise<PaymentResponse> {
    try {
      const refundParams: Stripe.RefundCreateParams = {
        payment_intent: transactionId,
      };

      if (amount) {
        refundParams.amount = Math.round(amount * 100);
      }

      const refund = await this.stripe.refunds.create(refundParams);

      const paymentIntent =
        await this.stripe.paymentIntents.retrieve(transactionId);

      return {
        transactionId: refund.id,
        orderId: paymentIntent.metadata?.orderId || "unknown",
        status: amount ? PaymentStatus.PARTIAL_REFUND : PaymentStatus.REFUNDED,
        amount: refund.amount / 100,
        currency: refund.currency.toUpperCase(),
        provider: "stripe",
        timestamp: new Date(),
        metadata: {
          refundId: refund.id,
          originalPaymentIntent: transactionId,
        },
      };
    } catch (error) {
      console.error("Stripe refund error:", error);
      return {
        transactionId,
        orderId: "unknown",
        status: PaymentStatus.FAILED,
        amount: amount || 0,
        currency: "USD",
        provider: "stripe",
        timestamp: new Date(),
        errorMessage: error.message,
      };
    }
  }

  /**
   * Get payment status from Stripe
   */
  async getPaymentStatus(transactionId: string): Promise<PaymentResponse> {
    try {
      const paymentIntent =
        await this.stripe.paymentIntents.retrieve(transactionId);

      return {
        transactionId: paymentIntent.id,
        orderId: paymentIntent.metadata?.orderId || "unknown",
        status: this.mapStripeStatus(paymentIntent.status),
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency.toUpperCase(),
        provider: "stripe",
        timestamp: new Date(paymentIntent.created * 1000),
        metadata: paymentIntent.metadata,
      };
    } catch (error) {
      console.error("Stripe getPaymentStatus error:", error);
      return {
        transactionId,
        orderId: "unknown",
        status: PaymentStatus.FAILED,
        amount: 0,
        currency: "USD",
        provider: "stripe",
        timestamp: new Date(),
        errorMessage: error.message,
      };
    }
  }

  /**
   * Map Stripe payment intent status to our PaymentStatus enum
   */
  private mapStripeStatus(stripeStatus: string): PaymentStatus {
    const statusMap: Record<string, PaymentStatus> = {
      requires_payment_method: PaymentStatus.PENDING,
      requires_confirmation: PaymentStatus.PENDING,
      requires_action: PaymentStatus.PROCESSING,
      processing: PaymentStatus.PROCESSING,
      requires_capture: PaymentStatus.PROCESSING,
      canceled: PaymentStatus.CANCELLED,
      succeeded: PaymentStatus.COMPLETED,
    };

    return statusMap[stripeStatus] || PaymentStatus.PENDING;
  }

  /**
   * Verify Stripe webhook signature
   */
  static verifyWebhookSignature(
    payload: string | Buffer,
    signature: string,
    webhookSecret: string,
  ): Stripe.Event {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2025-02-24.acacia",
    });

    return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  }
}
