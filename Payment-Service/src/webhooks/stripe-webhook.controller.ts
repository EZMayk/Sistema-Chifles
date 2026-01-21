import {
  Controller,
  Post,
  Req,
  Res,
  Headers,
  HttpStatus,
} from "@nestjs/common";
import type { RawBodyRequest } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import type { Request, Response } from "express";
import Stripe from "stripe";
import { PaymentService } from "../payments/payment.service";
import { Logger } from "../utils/logger";

@ApiTags("Stripe Webhooks")
@Controller("webhooks/stripe")
export class StripeWebhookController {
  private logger = new Logger("StripeWebhookController");
  private stripe: Stripe;

  constructor(private readonly paymentService: PaymentService) {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2025-12-15.clover" as any,
    });
  }

  /**
   * Handle Stripe webhook events
   * POST /webhooks/stripe
   */
  @Post()
  @ApiOperation({ summary: "Handle Stripe webhook events" })
  @ApiResponse({ status: 200, description: "Webhook processed successfully" })
  @ApiResponse({ status: 400, description: "Invalid webhook signature" })
  async handleStripeWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Res() res: Response,
    @Headers("stripe-signature") signature: string,
  ) {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      this.logger.error("STRIPE_WEBHOOK_SECRET is not configured");
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        error: "Webhook secret not configured",
      });
    }

    // Get raw body - try multiple approaches
    let rawBody: Buffer | string | undefined = req.rawBody;
    
    if (!rawBody && req.body) {
      // If rawBody is not available, try to use body directly
      rawBody = Buffer.isBuffer(req.body) ? req.body : JSON.stringify(req.body);
    }

    if (!rawBody) {
      this.logger.error("No raw body available for webhook verification");
      return res.status(HttpStatus.BAD_REQUEST).json({
        error: "No webhook payload was provided",
      });
    }

    this.logger.log(`Received webhook with signature: ${signature?.substring(0, 20)}...`);

    let event: Stripe.Event;

    try {
      // Verify webhook signature
      event = this.stripe.webhooks.constructEvent(
        rawBody,
        signature,
        webhookSecret,
      );
      this.logger.log(`Webhook verified successfully: ${event.type}`);
    } catch (err: any) {
      this.logger.error(`Webhook signature verification failed: ${err.message}`);
      return res.status(HttpStatus.BAD_REQUEST).json({
        error: `Webhook Error: ${err.message}`,
      });
    }

    // Handle the event
    try {
      switch (event.type) {
        case "payment_intent.succeeded":
          await this.handlePaymentIntentSucceeded(
            event.data.object as Stripe.PaymentIntent,
          );
          break;

        case "payment_intent.payment_failed":
          await this.handlePaymentIntentFailed(
            event.data.object as Stripe.PaymentIntent,
          );
          break;

        case "payment_intent.canceled":
          await this.handlePaymentIntentCanceled(
            event.data.object as Stripe.PaymentIntent,
          );
          break;

        case "charge.refunded":
          await this.handleChargeRefunded(event.data.object as Stripe.Charge);
          break;

        default:
          this.logger.log(`Unhandled event type: ${event.type}`);
      }

      return res.status(HttpStatus.OK).json({ received: true });
    } catch (error) {
      this.logger.error(`Error processing webhook: ${error.message}`);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        error: "Failed to process webhook",
      });
    }
  }

  /**
   * Handle successful payment
   */
  private async handlePaymentIntentSucceeded(
    paymentIntent: Stripe.PaymentIntent,
  ) {
    this.logger.log(
      `Payment succeeded: ${paymentIntent.id} for order ${paymentIntent.metadata?.orderId}`,
    );

    // Confirm the payment in our system
    await this.paymentService.confirmPayment(paymentIntent.id, {
      stripeStatus: paymentIntent.status,
      confirmedAt: new Date().toISOString(),
    });
  }

  /**
   * Handle failed payment
   */
  private async handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
    this.logger.log(
      `Payment failed: ${paymentIntent.id} - ${paymentIntent.last_payment_error?.message}`,
    );

    // Update payment status in our system
    await this.paymentService.updatePaymentStatus(paymentIntent.id, "failed", {
      errorMessage: paymentIntent.last_payment_error?.message,
      failedAt: new Date().toISOString(),
    });
  }

  /**
   * Handle canceled payment
   */
  private async handlePaymentIntentCanceled(
    paymentIntent: Stripe.PaymentIntent,
  ) {
    this.logger.log(`Payment canceled: ${paymentIntent.id}`);

    await this.paymentService.updatePaymentStatus(
      paymentIntent.id,
      "cancelled",
      {
        canceledAt: new Date().toISOString(),
      },
    );
  }

  /**
   * Handle refund
   */
  private async handleChargeRefunded(charge: Stripe.Charge) {
    this.logger.log(`Charge refunded: ${charge.id}`);

    if (charge.payment_intent) {
      await this.paymentService.updatePaymentStatus(
        charge.payment_intent as string,
        "refunded",
        {
          refundedAt: new Date().toISOString(),
          refundAmount: charge.amount_refunded / 100,
        },
      );
    }
  }
}
