import { apiClient } from "@/lib/api-client";
import type { ApiBox } from "@/types/api";

export interface StoreBoxPayload {
  name: string;
  size: string;
  location?: string;
  notes?: string;
}

export const boxService = {
  list: async (): Promise<ApiBox[]> => {
    const { data } = await apiClient.get<ApiBox[]>("/boxes");
    return data;
  },

  create: async (payload: StoreBoxPayload): Promise<ApiBox> => {
    const { data } = await apiClient.post<ApiBox>("/boxes", payload);
    return data;
  },

  update: async (
    id: string,
    payload: Partial<StoreBoxPayload & { active: boolean }>,
  ): Promise<ApiBox> => {
    const { data } = await apiClient.put<ApiBox>(`/boxes/${id}`, payload);
    return data;
  },

  toggleActive: async (id: string): Promise<ApiBox> => {
    const { data } = await apiClient.patch<ApiBox>(
      `/boxes/${id}/toggle-active`,
    );
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/boxes/${id}`);
  },
};
