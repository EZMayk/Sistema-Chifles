import { Module, forwardRef } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Payment } from "../models/payment.entity";
import { PaymentController } from "./payment.controller";
import { PaymentService } from "./payment.service";
import { WebSocketModule } from "../websockets/websocket.module";
import { WebhookModule } from "../webhooks/webhook.module";
import { OrderSyncService } from "../services/order-sync.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([Payment]),
    WebSocketModule,
    forwardRef(() => WebhookModule),
  ],
  controllers: [PaymentController],
  providers: [PaymentService, OrderSyncService],
  exports: [PaymentService, OrderSyncService],
})
export class PaymentsModule {}
