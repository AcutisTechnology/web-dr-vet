import { apiClient } from "@/lib/api-client";
import type {
  ApiHospitalization,
  ApiHospPrescription,
  StoreHospitalizationPayload,
} from "@/types/api";

export const hospitalizationService = {
  list: async (
    params?: Record<string, string>,
  ): Promise<ApiHospitalization[]> => {
    const { data } = await apiClient.get<ApiHospitalization[]>(
      "/hospitalizations",
      { params },
    );
    return data;
  },

  get: async (id: string): Promise<ApiHospitalization> => {
    const { data } = await apiClient.get<ApiHospitalization>(
      `/hospitalizations/${id}`,
    );
    return data;
  },

  create: async (
    payload: StoreHospitalizationPayload,
  ): Promise<ApiHospitalization> => {
    const { data } = await apiClient.post<ApiHospitalization>(
      "/hospitalizations",
      payload,
    );
    return data;
  },

  update: async (
    id: string,
    payload: Partial<StoreHospitalizationPayload>,
  ): Promise<ApiHospitalization> => {
    const { data } = await apiClient.put<ApiHospitalization>(
      `/hospitalizations/${id}`,
      payload,
    );
    return data;
  },

  updateStatus: async (
    id: string,
    status: string,
  ): Promise<ApiHospitalization> => {
    const { data } = await apiClient.patch<ApiHospitalization>(
      `/hospitalizations/${id}/status`,
      { status },
    );
    return data;
  },

  addPrescription: async (
    hospId: string,
    payload: {
      medication: string;
      dosage: string;
      frequency: string;
      route?: string;
      start_date: string;
      end_date?: string;
      notes?: string;
    },
  ): Promise<ApiHospPrescription> => {
    const { data } = await apiClient.post<ApiHospPrescription>(
      `/hospitalizations/${hospId}/prescriptions`,
      payload,
    );
    return data;
  },

  deletePrescription: async (
    hospId: string,
    prescId: string,
  ): Promise<void> => {
    await apiClient.delete(
      `/hospitalizations/${hospId}/prescriptions/${prescId}`,
    );
  },

  addAdministration: async (
    hospId: string,
    prescId: string,
    payload: {
      scheduled_time: string;
      administered_at: string;
      administered_by: string;
      notes?: string;
    },
  ): Promise<void> => {
    await apiClient.post(
      `/hospitalizations/${hospId}/prescriptions/${prescId}/administrations`,
      payload,
    );
  },

  addChecklistItem: async (
    hospId: string,
    payload: { description: string; frequency: string; completed?: boolean },
  ) => {
    const { data } = await apiClient.post(
      `/hospitalizations/${hospId}/checklist`,
      payload,
    );
    return data;
  },

  updateChecklistItem: async (
    hospId: string,
    itemId: string,
    payload: {
      completed?: boolean;
      completed_at?: string;
      completed_by?: string;
      description?: string;
      frequency?: string;
    },
  ) => {
    const { data } = await apiClient.patch(
      `/hospitalizations/${hospId}/checklist/${itemId}`,
      payload,
    );
    return data;
  },

  deleteChecklistItem: async (
    hospId: string,
    itemId: string,
  ): Promise<void> => {
    await apiClient.delete(`/hospitalizations/${hospId}/checklist/${itemId}`);
  },
};
