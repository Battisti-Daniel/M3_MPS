import api from "@/lib/api";
import { Doctor, PaginatedResponse } from "@/types";

type DoctorPayload = {
  name?: string;
  email?: string;
  phone?: string | null;
  password?: string | null;
  crm?: string;
  specialty?: string;
  qualification?: string | null;
  is_active?: boolean;
  health_insurance_ids?: number[];
};

type DoctorResourceResponse = {
  data: Doctor;
};

export async function fetchAdminDoctors(params?: Record<string, unknown>) {
  const { data } = await api.get<PaginatedResponse<Doctor>>("/admin/doctors", { params });
  return data;
}

export async function createDoctor(payload: DoctorPayload) {
  const { data } = await api.post<DoctorResourceResponse>("/admin/doctors", payload);
  return data.data;
}

export async function updateDoctor(id: number, payload: DoctorPayload) {
  const { data } = await api.put<DoctorResourceResponse>(`/admin/doctors/${id}`, payload);
  return data.data;
}

export async function toggleDoctorStatus(id: number) {
  const { data } = await api.post<DoctorResourceResponse>(`/admin/doctors/${id}/toggle-active`);
  return data.data;
}


