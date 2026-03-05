import type { ApiProduct } from "@/services/product.service";
import type { Product } from "@/types";

export function adaptApiProductToProduct(apiProduct: ApiProduct): Product {
  return {
    id: apiProduct.id,
    name: apiProduct.name,
    sku: apiProduct.barcode ?? undefined,
    category: apiProduct.category as Product["category"],
    unit: apiProduct.unit,
    costPrice: typeof apiProduct.cost_price === "string" 
      ? parseFloat(apiProduct.cost_price) 
      : apiProduct.cost_price,
    salePrice: typeof apiProduct.sale_price === "string"
      ? parseFloat(apiProduct.sale_price)
      : apiProduct.sale_price,
    stock: typeof apiProduct.stock === "string"
      ? parseFloat(apiProduct.stock)
      : apiProduct.stock,
    minStock: typeof apiProduct.min_stock === "string"
      ? parseFloat(apiProduct.min_stock)
      : apiProduct.min_stock,
    supplier: apiProduct.notes ?? undefined,
    active: apiProduct.active,
    createdAt: apiProduct.created_at,
    updatedAt: apiProduct.updated_at,
  };
}
