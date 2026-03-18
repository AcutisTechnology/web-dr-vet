import { apiClient } from "@/lib/api-client";
import type { ApiPet, StorePetPayload, AiDiagnosisResult, AiDiagnosisSavePayload } from "@/types/api";

export const petService = {
  list: async (params?: Record<string, string>): Promise<ApiPet[]> => {
    const { data } = await apiClient.get<{ data: ApiPet[] }>("/pets", {
      params,
    });
    return data.data;
  },

  get: async (id: string): Promise<ApiPet> => {
    const { data } = await apiClient.get<{ data: ApiPet }>(`/pets/${id}`);
    return data.data;
  },

  byClient: async (clientId: string): Promise<ApiPet[]> => {
    const { data } = await apiClient.get<{ data: ApiPet[] }>(
      `/clients/${clientId}/pets`,
    );
    return data.data;
  },

  create: async (payload: StorePetPayload): Promise<ApiPet> => {
    const { data } = await apiClient.post<{ data: ApiPet }>("/pets", payload);
    return data.data;
  },

  update: async (
    id: string,
    payload: Partial<StorePetPayload>,
  ): Promise<ApiPet> => {
    const { data } = await apiClient.patch<{ data: ApiPet }>(
      `/pets/${id}`,
      payload,
    );
    return data.data;
  },

  updateAnamnesis: async (
    id: string,
    anamnesis: Record<string, unknown>,
  ): Promise<void> => {
    await apiClient.patch(`/pets/${id}/anamnesis`, { anamnesis });
  },

  aiDiagnosis: async (id: string): Promise<AiDiagnosisResult> => {
    const { data } = await apiClient.post<{ data: AiDiagnosisResult }>(
      `/pets/${id}/ai-diagnosis`,
    );
    return data.data;
  },

  saveAiDiagnosis: async (
    id: string,
    payload: AiDiagnosisSavePayload,
  ): Promise<void> => {
    await apiClient.post(`/pets/${id}/ai-diagnosis/save`, payload);
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/pets/${id}`);
  },
};
