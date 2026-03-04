import { apiClient } from "@/lib/api-client";
import type { ApiClient, StoreClientPayload } from "@/types/api";

export const clientService = {
  list: async (): Promise<ApiClient[]> => {
    const { data } = await apiClient.get<{ data: ApiClient[] }>("/clients");
    return data.data;
  },

  get: async (id: string): Promise<ApiClient> => {
    const { data } = await apiClient.get<{ data: ApiClient }>(`/clients/${id}`);
    return data.data;
  },

  create: async (payload: StoreClientPayload): Promise<ApiClient> => {
    const { data } = await apiClient.post<{ data: ApiClient }>(
      "/clients",
      payload,
    );
    return data.data;
  },

  update: async (
    id: string,
    payload: Partial<StoreClientPayload>,
  ): Promise<ApiClient> => {
    const { data } = await apiClient.put<{ data: ApiClient }>(
      `/clients/${id}`,
      payload,
    );
    return data.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/clients/${id}`);
  },
};
