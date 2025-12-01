import api from "@/lib/api";
import { Observation } from "@/types";

export async function fetchPatientObservationHistory(patientId: number) {
  const { data } = await api.get<{ data: Observation[] }>(`/doctor/patients/${patientId}/observations`);
  return data.data ?? [];
}


