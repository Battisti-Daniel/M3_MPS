import api from "@/lib/api";
import { Doctor, PaginatedResponse } from "@/types";

export async function fetchDoctors(params?: Record<string, unknown>) {
  const { data } = await api.get<PaginatedResponse<Doctor>>('/doctors', { params });
  return data;
}

export async function fetchDoctor(id: number) {
  const { data } = await api.get<Doctor>(`/doctors/${id}`);
  return data;
}

export interface SlotInfo {
  time: string;
  available: boolean;
}

export interface AvailableSlotsResponse {
  available_slots: string[];
  busy_slots: string[];
  all_slots: SlotInfo[];
  date: string;
  doctor_id: number;
  schedule?: {
    start_time: string;
    end_time: string;
  };
}

export async function fetchAvailableSlots(
  doctorId: number, 
  date: string, 
  duration: number = 30
): Promise<AvailableSlotsResponse> {
  const { data } = await api.get<AvailableSlotsResponse>(`/doctors/${doctorId}/available-slots`, {
    params: { date, duration },
  });
  return data;
}

export async function fetchAvailableDates(
  doctorId: number,
  month?: string
) {
  const { data } = await api.get<{
    available_dates: string[];
    month: string;
    message?: string;
    has_schedules?: boolean;
  }>(`/doctors/${doctorId}/available-dates`, {
    params: month ? { month } : {},
  });
  return data;
}


