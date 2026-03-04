import type { Appointment, AppointmentStatus } from "@/types";
import type { ApiAppointment } from "@/types/api";

export function adaptApiAppointmentToAppointment(a: ApiAppointment): Appointment {
  return {
    id: a.id,
    petId: a.pet_id,
    clientId: a.client_id,
    vetId: a.vet_id ?? undefined,
    serviceType: a.service_type,
    status: a.status as AppointmentStatus,
    date: a.date,
    startTime: a.start_time,
    endTime: a.end_time,
    duration: a.duration,
    notes: a.notes ?? undefined,
    recurring: a.recurring,
    recurringInterval: (a.recurring_interval as Appointment["recurringInterval"]) ?? undefined,
    observations: a.observations ?? undefined,
    createdAt: a.created_at,
    updatedAt: a.updated_at,
  };
}
