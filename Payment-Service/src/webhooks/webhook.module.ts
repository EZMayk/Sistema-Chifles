import { Module, forwardRef } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { WebhookDispatch } from "../models/webhook-dispatch.entity";
import { Partner } from "../partners/partner.entity";
import { WebhookDispatcherService } from "./webhook-dispatcher.service";
import { WebhookReceiverService } from "./webhook-receiver.service";
import { WebhookReceiverController } from "./webhook-receiver.controller";
import { StripeWebhookController } from "./stripe-webhook.controller";
import { PaymentsModule } from "../payments/payment.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([WebhookDispatch, Partner]),
    forwardRef(() => PaymentsModule),
  ],
  providers: [WebhookDispatcherService, WebhookReceiverService],
  controllers: [WebhookReceiverController, StripeWebhookController],
  exports: [WebhookDispatcherService, WebhookReceiverService],
})
export class WebhookModule {}
