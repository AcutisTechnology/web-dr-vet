import { apiClient } from "@/lib/api-client";

export interface ApiProduct {
  id: string;
  name: string;
  category: string;
  unit: string;
  cost_price: number;
  sale_price: number;
  stock: number;
  min_stock: number;
  barcode: string | null;
  notes: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface StoreProductPayload {
  name: string;
  category: string;
  unit: string;
  cost_price: number;
  sale_price: number;
  stock: number;
  min_stock?: number;
  barcode?: string;
  notes?: string;
  active?: boolean;
}

export const productService = {
  list: async (params?: Record<string, string>): Promise<ApiProduct[]> => {
    const { data } = await apiClient.get<ApiProduct[]>("/products", { params });
    return data;
  },

  get: async (id: string): Promise<ApiProduct> => {
    const { data } = await apiClient.get<ApiProduct>(`/products/${id}`);
    return data;
  },

  create: async (payload: StoreProductPayload): Promise<ApiProduct> => {
    const { data } = await apiClient.post<ApiProduct>("/products", payload);
    return data;
  },

  update: async (id: string, payload: Partial<StoreProductPayload>): Promise<ApiProduct> => {
    const { data } = await apiClient.put<ApiProduct>(`/products/${id}`, payload);
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/products/${id}`);
  },
};
