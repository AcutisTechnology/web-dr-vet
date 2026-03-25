import { apiClient } from "@/lib/api-client";
import type { ApiMedicalEvent, StoreMedicalEventPayload } from "@/types/api";

export interface UploadMedicalEventAttachmentResponse {
  id: string;
  name: string;
  size: number;
  mime_type: string;
  created_at: string;
  storage_path: string;
}

export interface MedicalEventAttachmentSignedUrlResponse {
  url: string;
  expires_in: number;
}

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

  uploadAttachment: async (
    medicalEventId: string,
    file: File,
  ): Promise<UploadMedicalEventAttachmentResponse> => {
    const formData = new FormData();
    formData.append("file", file);

    const { data } = await apiClient.post<{ data: UploadMedicalEventAttachmentResponse }>(
      `/medical-events/${medicalEventId}/attachments`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );

    return data.data;
  },

  getAttachmentSignedUrl: async (
    medicalEventId: string,
    mediaFileId: string,
  ): Promise<MedicalEventAttachmentSignedUrlResponse> => {
    const { data } = await apiClient.get<{ data: MedicalEventAttachmentSignedUrlResponse }>(
      `/medical-events/${medicalEventId}/attachments/${mediaFileId}/signed-url`,
    );
    return data.data;
  },
};
