import { apiClient } from "@/lib/api-client";
import type { ApiMedicalEvent, StoreMedicalEventPayload } from "@/types/api";

export const medicalEventService = {
  byPet: async (petId: string): Promise<ApiMedicalEvent[]> => {
    const { data } = await apiClient.get<{ data: ApiMedicalEvent[] }>(
      `/pets/${petId}/medical-events`,
    );
    return data.data;
  },

  create: async (payload: StoreMedicalEventPayload): Promise<ApiMedicalEvent> => {
    const { data } = await apiClient.post<{ data: ApiMedicalEvent }>(
      "/medical-events",
      payload,
    );
    return data.data;
  },

  update: async (
    id: string,
    payload: Partial<StoreMedicalEventPayload>,
  ): Promise<ApiMedicalEvent> => {
    const { data } = await apiClient.put<{ data: ApiMedicalEvent }>(
      `/medical-events/${id}`,
      payload,
    );
    return data.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/medical-events/${id}`);
  },
};
