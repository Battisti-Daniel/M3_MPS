import api from "@/lib/api";
import { Appointment, PaginatedResponse } from "@/types";

type AppointmentResourceResponse = {
  data: Appointment;
};

export interface SchedulingStatus {
  current_future_appointments: number;
  max_allowed: number;
  can_schedule: boolean;
  remaining_slots: number;
  is_blocked: boolean;
  blocked_reason: string | null;
  consecutive_no_shows: number;
}

export async function fetchSchedulingStatus(): Promise<SchedulingStatus> {
  const { data } = await api.get<SchedulingStatus>("/appointments/scheduling-status");
  return data;
}

export async function fetchAppointments(params?: Record<string, unknown>) {
  const { data } = await api.get<PaginatedResponse<Appointment>>("/appointments", { params });
  return data;
}

export async function fetchAppointment(id: number) {
  const { data } = await api.get<AppointmentResourceResponse>(`/appointments/${id}`);
  return data.data;
}

export async function createAppointment(payload: Record<string, unknown>) {
  const { data } = await api.post<AppointmentResourceResponse>("/appointments", payload);
  return data.data;
}

export async function createAdminAppointment(payload: Record<string, unknown>) {
  const { data } = await api.post<AppointmentResourceResponse>("/admin/appointments", payload);
  return data.data;
}

export async function confirmAppointment(id: number) {
  const { data } = await api.post<AppointmentResourceResponse>(`/appointments/${id}/confirm`);
  return data.data;
}

export async function cancelAppointment(id: number, reason?: string) {
  const { data } = await api.post<AppointmentResourceResponse>(`/appointments/${id}/cancel`, { reason });
  return data.data;
}

export async function rescheduleAppointment(id: number, payload: Record<string, unknown>) {
  const { data } = await api.post<AppointmentResourceResponse>(`/appointments/${id}/reschedule`, payload);
  return data.data;
}

export async function completeAppointment(id: number) {
  const { data } = await api.post<AppointmentResourceResponse>(`/appointments/${id}/complete`);
  return data.data;
}

export async function markNoShow(id: number) {
  const { data } = await api.post<AppointmentResourceResponse>(`/appointments/${id}/no-show`);
  return data.data;
}

