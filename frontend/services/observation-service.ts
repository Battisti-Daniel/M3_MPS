import api from "@/lib/api";
import { Observation } from "@/types";

export async function createObservation(appointmentId: number, payload: Record<string, unknown>) {
  const { data } = await api.post(`/appointments/${appointmentId}/observations`, payload);
  return data;
}

export async function getObservation(appointmentId: number): Promise<Observation> {
  const { data } = await api.get<{ data: Observation }>(`/appointments/${appointmentId}/observations`);
  return data.data;
}

export async function fetchPatientObservations(params?: Record<string, unknown>) {
  const { data } = await api.get('/patient/observations', { params });
  return data;
}


