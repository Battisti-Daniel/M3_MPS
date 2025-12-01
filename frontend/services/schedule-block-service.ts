import api from "@/lib/api";
import { PaginatedResponse } from "@/types";

export interface ScheduleBlock {
  id: number;
  doctor_id: number;
  blocked_date: string;
  start_time: string | null;
  end_time: string | null;
  reason: string | null;
  is_full_day: boolean;
  created_at: string;
}

export interface CreateScheduleBlockPayload {
  blocked_date: string;
  start_time?: string | null;
  end_time?: string | null;
  reason?: string | null;
}

export async function fetchScheduleBlocks(params?: Record<string, unknown>) {
  const { data } = await api.get<PaginatedResponse<ScheduleBlock>>('/doctor/schedule-blocks', { params });
  return data;
}

export async function createScheduleBlock(payload: CreateScheduleBlockPayload) {
  const { data } = await api.post<{ data: ScheduleBlock }>('/doctor/schedule-blocks', payload);
  return data;
}

export async function deleteScheduleBlock(id: number) {
  await api.delete(`/doctor/schedule-blocks/${id}`);
}
