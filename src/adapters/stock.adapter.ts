import type { ApiStockMove } from "@/services/stock.service";
import type { StockMove } from "@/types";

export function adaptApiStockMoveToStockMove(
  apiMove: ApiStockMove,
): StockMove {
  return {
    id: apiMove.id,
    productId: apiMove.product_id,
    type: apiMove.type as StockMove["type"],
    quantity: typeof apiMove.quantity === "string"
      ? parseFloat(apiMove.quantity)
      : apiMove.quantity,
    reason: apiMove.reason ?? undefined,
    userId: apiMove.user_id,
    createdAt: apiMove.created_at,
  };
}
