export type UserRole = "ADMIN" | "DOCTOR" | "PATIENT";

export interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  is_active: boolean;
  failed_login_attempts?: number;
  locked_until?: string | null;
  privacy_policy_accepted_at?: string | null;
  privacy_policy_version?: string | null;
  data_erasure_requested_at?: string | null;
  created_at?: string;
  updated_at?: string;
  doctor?: {
    id: number;
    crm: string;
    specialty: string;
    is_active: boolean;
    qualification?: string | null;
  } | null;
  patient?: {
    id: number;
    cpf: string;
    birth_date: string;
    gender?: string | null;
    address?: string | null;
    health_insurance_id?: number | null;
    health_insurance?: HealthInsurance | null;
  } | null;
}

export interface HealthInsurance {
  id: number;
  name: string;
  description?: string | null;
  coverage_percentage: number | string | null;
  is_active: boolean;
  beneficiaries_count?: number;
  doctors_count?: number;
  pivot?: {
    policy_number?: string | null;
    is_active?: boolean;
  };
  pivot_doctor?: {
    is_active?: boolean;
  };
}

export interface Doctor {
  id: number;
  name: string;
  crm: string;
  specialty: string;
  qualification?: string | null;
  is_active: boolean;
  health_insurances?: HealthInsurance[];
  user?: User;
}

export interface Patient {
  id: number;
  name: string;
  cpf: string;
  birth_date: string;
  gender?: string | null;
  address?: string | null;
  health_insurance_id?: number | null;
  health_insurance?: HealthInsurance | null;
  health_insurances?: HealthInsurance[];
  profile_completed_at?: string | null;
  user?: User;
}

export interface Appointment {
  id: number;
  status: string;
  type: string;
  scheduled_at: string;
  duration_minutes: number;
  price?: number | null;
  notes?: string | null;
  doctor?: Doctor;
  patient?: Patient;
  observations?: Observation[];
  logs?: AppointmentLog[];
  created_by?: User | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    unread_count?: number;
  };
}

export interface Observation {
  id: number;
  appointment_id: number;
  doctor_id: number;
  patient_id: number;
  anamnesis: string;
  diagnosis?: string | null;
  prescription?: string | null;
  notes?: string | null;
  attachments?: unknown;
  created_at: string;
  doctor?: Doctor;
  patient?: Patient;
  appointment?: {
    id: number;
    scheduled_at: string;
    status: string;
    type?: string;
    doctor?: Doctor;
  };
}

export interface AppointmentLog {
  id: number;
  old_status?: string | null;
  new_status: string;
  reason?: string | null;
  metadata?: Record<string, unknown> | null;
  changed_at: string;
  changed_by?: User;
}

export interface Notification {
  id: number;
  type: string;
  subject: string;
  message: string;
  channel: string;
  is_suppressed: boolean;
  is_read: boolean;
  sent_at: string | null;
  read_at?: string | null;
  sent_attempts: number;
  last_attempt_at?: string | null;
  error_message?: string | null;
  metadata?: Record<string, unknown> | null;
}

export type NotificationPreferenceMap = Record<string, Record<string, boolean>>;

export interface ActivityLog {
  id: number;
  action: string;
  route: string | null;
  method: string | null;
  ip_address: string | null;
  user_agent: string | null;
  context?: Record<string, unknown> | null;
  created_at: string;
  user?: User | null;
}


