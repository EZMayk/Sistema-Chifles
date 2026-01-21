import { Injectable } from "@nestjs/common";
import { Logger } from "../utils/logger";

/**
 * Service to sync order status with Api-Rest
 * When payments are confirmed/failed/refunded, this service updates the order status
 */
@Injectable()
export class OrderSyncService {
  private logger = new Logger("OrderSyncService");
  private apiRestUrl: string;

  constructor() {
    this.apiRestUrl = process.env.API_REST_URL || "http://localhost:3000";
  }

  /**
   * Update order status in Api-Rest
   * Note: Api-Rest uses the global prefix 'chifles'
   * @param orderId - The order ID to update
   * @param estado - New status: 'pendiente', 'pagado', 'en proceso', 'listo', 'cancelado'
   */
  async updateOrderStatus(orderId: string, estado: string): Promise<boolean> {
    try {
      const url = `${this.apiRestUrl}/chifles/pedidos/${orderId}`;
      this.logger.log(`Updating order ${orderId} status to: ${estado}`);

      const response = await fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ estado }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(
          `Failed to update order status: ${response.status} - ${errorText}`,
        );
        return false;
      }

      const updatedOrder = await response.json();
      this.logger.log(
        `Order ${orderId} status updated successfully to: ${updatedOrder.estado}`,
      );
      return true;
    } catch (error) {
      this.logger.error(`Error updating order status: ${error.message}`);
      return false;
    }
  }

  /**
   * Mark order as paid
   * Called when payment is successfully confirmed
   */
  async markOrderAsPaid(orderId: string): Promise<boolean> {
    return this.updateOrderStatus(orderId, "pagado");
  }

  /**
   * Mark order as payment failed
   * Called when payment fails
   */
  async markOrderAsPaymentFailed(orderId: string): Promise<boolean> {
    return this.updateOrderStatus(orderId, "pago_fallido");
  }

  /**
   * Mark order as refunded/cancelled
   * Called when payment is refunded
   */
  async markOrderAsRefunded(orderId: string): Promise<boolean> {
    return this.updateOrderStatus(orderId, "reembolsado");
  }

  /**
   * Mark order as cancelled
   * Called when payment is cancelled
   */
  async markOrderAsCancelled(orderId: string): Promise<boolean> {
    return this.updateOrderStatus(orderId, "cancelado");
  }
}
