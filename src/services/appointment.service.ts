import { apiClient } from "@/lib/api-client";
import type { ApiAppointment, StoreAppointmentPayload } from "@/types/api";

export const appointmentService = {
  list: async (params?: Record<string, string>): Promise<ApiAppointment[]> => {
    const { data } = await apiClient.get<{ data: ApiAppointment[] }>("/appointments", { params });
    return data.data;
  },

  byDate: async (date: string): Promise<ApiAppointment[]> => {
    const { data } = await apiClient.get<{ data: ApiAppointment[] }>(`/appointments/date/${date}`);
    return data.data;
  },

  byWeek: async (date: string): Promise<ApiAppointment[]> => {
    const { data } = await apiClient.get<{ data: ApiAppointment[] }>(`/appointments/week/${date}`);
    return data.data;
  },

  create: async (payload: StoreAppointmentPayload): Promise<ApiAppointment> => {
    const { data } = await apiClient.post<{ data: ApiAppointment }>("/appointments", payload);
    return data.data;
  },

  update: async (id: string, payload: Partial<StoreAppointmentPayload>): Promise<ApiAppointment> => {
    const { data } = await apiClient.put<{ data: ApiAppointment }>(`/appointments/${id}`, payload);
    return data.data;
  },

  updateStatus: async (id: string, status: string): Promise<ApiAppointment> => {
    const { data } = await apiClient.patch<{ data: ApiAppointment }>(`/appointments/${id}/status`, { status });
    return data.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/appointments/${id}`);
  },

  byMonth: async (year: number, month: number): Promise<{
    total: number;
    by_status: Record<string, number>;
    by_service: Record<string, number>;
    by_week: Record<string, number>;
    completed_rate: number;
    cancelled_rate: number;
  }> => {
    const { data } = await apiClient.get(`/appointments/month/${year}/${month}`);
    return data;
  },
};
