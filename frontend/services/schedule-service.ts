import api from "@/lib/api";
import { PaginatedResponse } from "@/types";

export interface Schedule {
  id: number;
  doctor_id: number;
  day_of_week: number;
  start_time: string;
  end_time: string;
  slot_duration_minutes: number;
  is_blocked: boolean;
  blocked_reason?: string | null;
}

export async function fetchDoctorSchedules() {
  const { data } = await api.get<PaginatedResponse<Schedule>>('/doctor/schedules');
  return data;
}

export async function createSchedule(payload: Record<string, unknown>) {
  const { data } = await api.post<Schedule>('/doctor/schedules', payload);
  return data;
}

export async function updateSchedule(id: number, payload: Record<string, unknown>) {
  const { data } = await api.put<Schedule>(`/doctor/schedules/${id}`, payload);
  return data;
}

export async function deleteSchedule(id: number) {
  await api.delete(`/doctor/schedules/${id}`);
}


