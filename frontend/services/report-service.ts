import api from "@/lib/api";

export interface AppointmentSummary {
  start_date: string;
  end_date: string;
  total: number;
  by_status: Record<string, { total: number; percentage: number }>;
  trend: Array<{ date: string; total: number }>;
}

export interface DoctorOccupancyItem {
  doctor_id: number;
  doctor_name: string;
  total_appointments: number;
  confirmed: number;
  completed: number;
  occupancy_rate: number;
}

export interface InsuranceUsageItem {
  health_insurance_id: number;
  name: string;
  total_appointments: number;
}

// Novos tipos para os relatórios adicionais
export interface DoctorAppointmentItem {
  doctor_id: number;
  doctor_name: string;
  specialty: string;
  crm: string;
  total: number;
  completed: number;
  cancelled: number;
  no_show: number;
  pending: number;
  confirmed: number;
  scheduled: number;
  completion_rate: number;
  total_revenue: number;
  pending_revenue: number;
}

export interface SpecialtyAppointmentItem {
  specialty: string;
  doctors_count: number;
  total: number;
  completed: number;
  cancelled: number;
  no_show: number;
  scheduled: number;
  completion_rate: number;
  total_revenue: number;
}

export interface AppointmentsByDoctorSummary {
  total_appointments: number;
  completed: number;
  scheduled: number;
  total_revenue: number;
  pending_revenue: number;
}

export interface AppointmentsByDoctorReport {
  start_date: string;
  end_date: string;
  summary: AppointmentsByDoctorSummary;
  by_doctor: DoctorAppointmentItem[];
  by_specialty: SpecialtyAppointmentItem[];
}

export interface CancellationSummary {
  total_appointments: number;
  completed: number;
  scheduled: number;
  cancelled: number;
  no_show: number;
  rescheduled: number;
  cancellation_rate: number;
  no_show_rate: number;
  reschedule_rate: number;
}

export interface CancellationByDoctor {
  doctor_id: number;
  doctor_name: string;
  specialty: string;
  total: number;
  completed: number;
  scheduled: number;
  cancelled: number;
  no_show: number;
  cancellation_rate: number;
}

export interface CancellationsReport {
  start_date: string;
  end_date: string;
  summary: CancellationSummary;
  cancellation_reasons: Array<{ reason: string; count: number }>;
  by_day_of_week: Record<string, number>;
  by_doctor: CancellationByDoctor[];
}

export interface TopPatient {
  patient_id: number;
  patient_name: string;
  patient_email: string;
  patient_phone: string;
  total_appointments: number;
  completed: number;
  cancelled: number;
  no_show: number;
  pending: number;
  confirmed: number;
  scheduled: number;
  attendance_rate: number;
  total_spent: number;
  pending_revenue: number;
  first_appointment: string;
  last_appointment: string;
}

export interface TopPatientsSummary {
  total_patients: number;
  total_appointments: number;
  avg_appointments_per_patient: number;
  completed: number;
  cancelled: number;
  no_show: number;
  pending: number;
  confirmed: number;
  scheduled: number;
  attendance_rate: number;
  total_revenue: number;
  pending_revenue: number;
}

export interface TopPatientsReport {
  start_date: string;
  end_date: string;
  summary: TopPatientsSummary;
  frequency_distribution: Record<string, number>;
  top_patients: TopPatient[];
}

export async function fetchAppointmentSummary(params?: Record<string, unknown>) {
  const { data } = await api.get<AppointmentSummary>("/admin/reports/appointments", { params });
  return data;
}

export async function fetchDoctorOccupancy(params?: Record<string, unknown>) {
  const { data } = await api.get<{ data: DoctorOccupancyItem[] }>("/admin/reports/doctor-occupancy", {
    params,
  });
  return data.data;
}

export async function fetchInsuranceUsage(params?: Record<string, unknown>) {
  const { data } = await api.get<{ data: InsuranceUsageItem[] }>("/admin/reports/insurance-usage", {
    params,
  });
  return data.data;
}

// Novos endpoints de relatório
export async function fetchAppointmentsByDoctor(params?: Record<string, unknown>) {
  const { data } = await api.get<AppointmentsByDoctorReport>("/admin/reports/appointments-by-doctor", { params });
  return data;
}

export async function fetchCancellations(params?: Record<string, unknown>) {
  const { data } = await api.get<CancellationsReport>("/admin/reports/cancellations", { params });
  return data;
}

export async function fetchTopPatients(params?: Record<string, unknown>) {
  const { data } = await api.get<TopPatientsReport>("/admin/reports/top-patients", { params });
  return data;
}

// Funções para download de PDF
export async function downloadAppointmentsByDoctorPdf(params?: Record<string, unknown>) {
  const response = await api.get("/admin/reports/appointments-by-doctor/pdf", {
    params,
    responseType: 'blob',
  });
  return response.data;
}

export async function downloadCancellationsPdf(params?: Record<string, unknown>) {
  const response = await api.get("/admin/reports/cancellations/pdf", {
    params,
    responseType: 'blob',
  });
  return response.data;
}

export async function downloadTopPatientsPdf(params?: Record<string, unknown>) {
  const response = await api.get("/admin/reports/top-patients/pdf", {
    params,
    responseType: 'blob',
  });
  return response.data;
}


