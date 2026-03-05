import { apiClient } from "@/lib/api-client";

export interface ApiStockMove {
  id: string;
  product_id: string;
  type: string;
  quantity: number;
  reason: string | null;
  notes: string | null;
  user_id: string;
  date: string;
  product?: {
    id: string;
    name: string;
  };
  user?: {
    id: string;
    name: string;
  };
  created_at: string;
  updated_at: string;
}

export interface StoreStockMovePayload {
  product_id: string;
  type: string;
  quantity: number;
  reason?: string;
  notes?: string;
}

export const stockService = {
  listMoves: async (): Promise<ApiStockMove[]> => {
    const { data } = await apiClient.get<ApiStockMove[]>("/stock-moves");
    return data;
  },

  getMovesByProduct: async (productId: string): Promise<ApiStockMove[]> => {
    const { data } = await apiClient.get<ApiStockMove[]>(
      `/stock-moves/product/${productId}`,
    );
    return data;
  },

  createMove: async (payload: StoreStockMovePayload): Promise<ApiStockMove> => {
    const { data } = await apiClient.post<ApiStockMove>("/stock-moves", payload);
    return data;
  },
};
