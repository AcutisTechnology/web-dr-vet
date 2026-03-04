import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { appointmentService } from "@/services/appointment.service";
import { adaptApiAppointmentToAppointment } from "@/adapters/appointment.adapter";
import type { StoreAppointmentPayload } from "@/types/api";
import { format } from "date-fns";

export const appointmentKeys = {
  all: () => ["appointments"] as const,
  byWeek: (date: string) => ["appointments", "week", date] as const,
  byDate: (date: string) => ["appointments", "date", date] as const,
};

export function useAppointmentsByWeek(date: Date) {
  const dateStr = format(date, "yyyy-MM-dd");
  return useQuery({
    queryKey: appointmentKeys.byWeek(dateStr),
    queryFn: () => appointmentService.byWeek(dateStr),
    select: (data) => data.map(adaptApiAppointmentToAppointment),
    staleTime: 1000 * 60,
  });
}

export function useAppointmentsByDate(date: Date) {
  const dateStr = format(date, "yyyy-MM-dd");
  return useQuery({
    queryKey: appointmentKeys.byDate(dateStr),
    queryFn: () => appointmentService.byDate(dateStr),
    select: (data) => data.map(adaptApiAppointmentToAppointment),
    staleTime: 1000 * 60,
  });
}

export function useCreateAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: StoreAppointmentPayload) => appointmentService.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: appointmentKeys.all() });
    },
  });
}

export function useUpdateAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<StoreAppointmentPayload> }) =>
      appointmentService.update(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: appointmentKeys.all() });
    },
  });
}

export function useDeleteAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => appointmentService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: appointmentKeys.all() });
    },
  });
}
