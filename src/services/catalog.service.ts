import { apiClient } from "@/lib/api-client";
import type { ApiProduct, StoreProductPayload } from "./product.service";
export type { ApiProduct, StoreProductPayload } from "./product.service";

export interface ApiService {
  id: string;
  name: string;
  category: string;
  price: number;
  duration: number | null;
  description: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface StoreServicePayload {
  name: string;
  category: string;
  price: number;
  duration?: number;
  description?: string;
  active?: boolean;
}

export interface ApiSaleItem {
  id: string;
  type: "product" | "service";
  item_id: string;
  quantity: number;
  price: number;
  discount: number;
  name?: string;
}

export interface ApiSale {
  id: string;
  client_id: string | null;
  pet_id: string | null;
  date: string;
  total: number;
  discount: number;
  status: string;
  notes: string | null;
  items: ApiSaleItem[];
  payments: Array<{ method: string; amount: number; installments?: number }>;
  client?: { id: string; name: string } | null;
  pet?: { id: string; name: string } | null;
  created_at: string;
  updated_at: string;
}

export interface StoreSalePayload {
  client_id?: string;
  pet_id?: string;
  date: string;
  total: number;
  discount?: number;
  status: string;
  notes?: string;
  items: Array<{
    type: "product" | "service";
    item_id: string;
    quantity: number;
    price: number;
    discount?: number;
  }>;
  payments?: Array<{
    method: string;
    amount: number;
    installments?: number;
  }>;
}

export const catalogService = {
  listProducts: async (): Promise<ApiProduct[]> => {
    const { data } = await apiClient.get<ApiProduct[]>("/products");
    return data;
  },

  createProduct: async (payload: StoreProductPayload): Promise<ApiProduct> => {
    const { data } = await apiClient.post<ApiProduct>("/products", payload);
    return data;
  },

  updateProduct: async (
    id: string,
    payload: Partial<StoreProductPayload>,
  ): Promise<ApiProduct> => {
    const { data } = await apiClient.put<ApiProduct>(
      `/products/${id}`,
      payload,
    );
    return data;
  },

  deleteProduct: async (id: string): Promise<void> => {
    await apiClient.delete(`/products/${id}`);
  },

  listServices: async (): Promise<ApiService[]> => {
    const { data } = await apiClient.get<ApiService[]>("/services");
    return data;
  },

  createService: async (payload: StoreServicePayload): Promise<ApiService> => {
    const { data } = await apiClient.post<ApiService>("/services", payload);
    return data;
  },

  updateService: async (
    id: string,
    payload: Partial<StoreServicePayload>,
  ): Promise<ApiService> => {
    const { data } = await apiClient.put<ApiService>(
      `/services/${id}`,
      payload,
    );
    return data;
  },

  deleteService: async (id: string): Promise<void> => {
    await apiClient.delete(`/services/${id}`);
  },

  createSale: async (payload: StoreSalePayload): Promise<ApiSale> => {
    const { data } = await apiClient.post<ApiSale>("/sales", payload);
    return data;
  },
};
