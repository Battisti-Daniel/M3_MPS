import api from "@/lib/api";

interface DoctorData {
  id: number;
  specialty: string;
  is_active: boolean;
  created_at: string;
}

interface AppointmentData {
  id: number;
  doctor_id: number;
  doctor?: {
    id: number;
    specialty: string;
  };
  date_time: string;
  created_at: string;
}

interface PatientData {
  user?: {
    is_active: boolean;
  };
  created_at: string;
}

interface InsuranceData {
  is_active: boolean;
  created_at: string;
}

export interface DashboardStats {
  total_appointments: number;
  appointments_today: number;
  appointments_this_month: number;
  total_doctors: number;
  active_doctors: number;
  new_doctors: number;
  total_patients: number;
  active_patients: number;
  new_patients: number;
  total_health_insurances: number;
  active_health_insurances: number;
  new_health_insurances: number;
  appointments_growth: number;
  doctors_growth: number;
  patients_growth: number;
  health_insurances_growth: number;
}

export interface RecentActivity {
  id: number;
  type: "doctor_registered" | "patients_registered" | "insurance_activated" | "appointments_cancelled";
  title: string;
  description: string;
  icon: string;
  color: string;
  created_at: string;
}

export interface MonthlyAppointments {
  month: string;
  total: number;
}

export interface SpecialtyDistribution {
  specialty: string;
  total: number;
  percentage: number;
}

export async function fetchDashboardStats() {
  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();
  
  // Primeiro dia do mês atual (00:00:00)
  const firstDayThisMonth = new Date(thisYear, thisMonth, 1);
  firstDayThisMonth.setHours(0, 0, 0, 0);
  
  // Primeiro dia do mês anterior
  const firstDayLastMonth = new Date(thisYear, thisMonth - 1, 1);
  firstDayLastMonth.setHours(0, 0, 0, 0);
  
  // Último dia do mês anterior (23:59:59)
  const lastDayLastMonth = new Date(thisYear, thisMonth, 0);
  lastDayLastMonth.setHours(23, 59, 59, 999);

  // Busca todos os dados (sem filtros do backend que podem não existir)
  const [appointmentsResponse, doctorsResponse, patientsResponse, insurancesResponse] = await Promise.all([
    api.get("/admin/reports/appointments", {
      params: {
        start_date: firstDayLastMonth.toISOString().split("T")[0],
        end_date: now.toISOString().split("T")[0],
      },
    }),
    api.get("/admin/doctors"),
    api.get("/admin/patients"),
    api.get("/health-insurances"),
  ]);

  const appointmentsData = appointmentsResponse.data?.data || [];
  const doctorsData = (doctorsResponse.data?.data || []) as DoctorData[];
  const patientsData = (patientsResponse.data?.data || []) as PatientData[];
  const insurancesData = (insurancesResponse.data?.data || []) as InsuranceData[];

  // Calcular consultas de hoje
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const appointmentsToday = appointmentsData.filter((apt: AppointmentData) => {
    if (!apt.date_time) return false;
    const aptDate = new Date(apt.date_time);
    return aptDate >= today && aptDate < tomorrow;
  }).length;

  // Filtrar consultas do mês atual
  const appointmentsThisMonth = appointmentsData.filter((apt: AppointmentData) => {
    if (!apt.date_time) return false;
    const aptDate = new Date(apt.date_time);
    return aptDate >= firstDayThisMonth && aptDate <= now;
  }).length;

  // Filtrar consultas do mês anterior
  const appointmentsLastMonth = appointmentsData.filter((apt: AppointmentData) => {
    if (!apt.date_time) return false;
    const aptDate = new Date(apt.date_time);
    return aptDate >= firstDayLastMonth && aptDate <= lastDayLastMonth;
  }).length;

  // Calcular crescimento percentual
  const calculateGrowth = (current: number, previous: number): number => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100 * 10) / 10;
  };

  // Calcular médicos
  const activeDoctors = doctorsData.filter((d) => d.is_active).length;
  
  // Médicos novos do mês atual
  const newDoctors = doctorsData.filter((d) => {
    if (!d.created_at) return false;
    const created = new Date(d.created_at);
    return created >= firstDayThisMonth && created <= now;
  }).length;

  // Total de médicos antes do início do mês atual (para calcular crescimento)
  const doctorsBeforeThisMonth = doctorsData.filter((d) => {
    if (!d.created_at) return false;
    const created = new Date(d.created_at);
    return created < firstDayThisMonth;
  }).length;

  // Total de médicos no final do mês anterior (último dia do mês anterior)
  const doctorsAtEndOfLastMonth = doctorsBeforeThisMonth;
  const doctorsGrowth = calculateGrowth(doctorsData.length, doctorsAtEndOfLastMonth);

  // Calcular pacientes
  const activePatients = patientsData.filter((p) => p.user?.is_active !== false).length;
  
  // Pacientes novos do mês atual
  const newPatients = patientsData.filter((p) => {
    if (!p.created_at) return false;
    const created = new Date(p.created_at);
    return created >= firstDayThisMonth && created <= now;
  }).length;

  // Total de pacientes antes do início do mês atual
  const patientsBeforeThisMonth = patientsData.filter((p) => {
    if (!p.created_at) return false;
    const created = new Date(p.created_at);
    return created < firstDayThisMonth;
  }).length;

  const patientsAtEndOfLastMonth = patientsBeforeThisMonth;
  const patientsGrowth = calculateGrowth(patientsData.length, patientsAtEndOfLastMonth);

  // Calcular convênios
  const activeInsurances = insurancesData.filter((i) => i.is_active).length;
  
  // Convênios novos do mês atual
  const newInsurances = insurancesData.filter((i) => {
    if (!i.created_at) return false;
    const created = new Date(i.created_at);
    return created >= firstDayThisMonth && created <= now;
  }).length;

  // Total de convênios antes do início do mês atual
  const insurancesBeforeThisMonth = insurancesData.filter((i) => {
    if (!i.created_at) return false;
    const created = new Date(i.created_at);
    return created < firstDayThisMonth;
  }).length;

  const insurancesAtEndOfLastMonth = insurancesBeforeThisMonth;
  const insurancesGrowth = calculateGrowth(insurancesData.length, insurancesAtEndOfLastMonth);

  // Crescimento de consultas
  const appointmentsGrowth = calculateGrowth(appointmentsThisMonth, appointmentsLastMonth);

  // Total de consultas (todas)
  const totalAppointments = appointmentsResponse.data?.total || appointmentsData.length;

  return {
    total_appointments: totalAppointments,
    appointments_today: appointmentsToday,
    appointments_this_month: appointmentsThisMonth,
    total_doctors: doctorsData.length,
    active_doctors: activeDoctors,
    new_doctors: newDoctors,
    total_patients: patientsData.length,
    active_patients: activePatients,
    new_patients: newPatients,
    total_health_insurances: insurancesData.length,
    active_health_insurances: activeInsurances,
    new_health_insurances: newInsurances,
    appointments_growth: appointmentsGrowth,
    doctors_growth: doctorsGrowth,
    patients_growth: patientsGrowth,
    health_insurances_growth: insurancesGrowth,
  } as DashboardStats;
}

export async function fetchRecentActivities(): Promise<RecentActivity[]> {
  try {
    // Busca logs de auditoria reais do sistema
    const response = await api.get("/admin/activity-logs", {
      params: {
        per_page: 10,
        page: 1,
      },
    });

    const logs = response.data?.data || [];
    
    // Converte logs de auditoria para formato de atividades recentes
    return logs.map((log: any) => {
      const action = log.action || '';
      const user = log.user;
      let type: RecentActivity['type'] = 'appointments_cancelled';
      let title = action;
      let description = '';
      let icon = 'check';
      let color = 'gray';

      // Determina tipo e formatação baseado na ação
      if (action.includes('POST') && action.includes('doctors')) {
        type = 'doctor_registered';
        title = 'Novo médico cadastrado';
        description = user ? `${user.name || 'Médico'}` : 'Novo cadastro';
        icon = 'check';
        color = 'green';
      } else if (action.includes('POST') && action.includes('patients')) {
        type = 'patients_registered';
        title = 'Novo paciente cadastrado';
        description = user ? `${user.name || 'Paciente'}` : 'Novo cadastro';
        icon = 'users';
        color = 'blue';
      } else if (action.includes('POST') && action.includes('health-insurances')) {
        type = 'insurance_activated';
        title = 'Novo convênio ativado';
        description = log.route || 'Novo convênio';
        icon = 'trending-up';
        color = 'orange';
      } else if (action.includes('DELETE') || action.includes('cancel')) {
        type = 'appointments_cancelled';
        title = 'Consulta cancelada';
        description = user ? `Solicitado por ${user.name}` : 'Cancelamento';
        icon = 'x';
        color = 'red';
      } else {
        // Ação genérica
        description = user ? user.name : log.route || '';
        icon = 'check';
        color = 'gray';
      }

      return {
        id: log.id,
        type,
        title,
        description,
        icon,
        color,
        created_at: log.created_at || new Date().toISOString(),
      };
    });
  } catch (error) {
    // Em caso de erro, retorna array vazio
    console.error('Erro ao buscar atividades recentes:', error);
    return [];
  }
}

export async function fetchMonthlyAppointments(): Promise<MonthlyAppointments[]> {
  const response = await api.get("/admin/reports/appointments", {
    params: {
      start_date: new Date(new Date().setMonth(new Date().getMonth() - 5)).toISOString().split("T")[0],
      end_date: new Date().toISOString().split("T")[0],
    },
  });

  const trend = response.data?.trend || [];
  
  // Agrupar por mês
  const monthly: Record<string, number> = {};
  trend.forEach((item: { date: string; total: number }) => {
    const month = new Date(item.date).toLocaleDateString("pt-BR", { month: "short" });
    monthly[month] = (monthly[month] || 0) + item.total;
  });

  return Object.entries(monthly).map(([month, total]) => ({
    month,
    total,
  }));
}

export async function fetchSpecialtyDistribution(): Promise<SpecialtyDistribution[]> {
  try {
    // Busca todas as consultas com informações de médicos
    const now = new Date();
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(now.getMonth() - 6);

    const [appointmentsResponse, doctorsResponse] = await Promise.all([
      api.get("/admin/reports/appointments", {
        params: {
          start_date: sixMonthsAgo.toISOString().split("T")[0],
          end_date: now.toISOString().split("T")[0],
        },
      }),
      api.get("/admin/doctors"),
    ]);

    const appointments = appointmentsResponse.data?.data || [];
    const doctors = doctorsResponse.data?.data || [];

    // Cria um mapa de doctor_id -> specialty
    const doctorSpecialtyMap = new Map<number, string>();
    (doctors as DoctorData[]).forEach((doctor) => {
      if (doctor.specialty) {
        doctorSpecialtyMap.set(doctor.id, doctor.specialty);
      }
    });

    // Agrupa consultas por especialidade
    const specialtyCount: Record<string, number> = {};
    
    appointments.forEach((appointment: AppointmentData) => {
      const doctorId = appointment.doctor_id;
      const specialty = appointment.doctor?.specialty || doctorSpecialtyMap.get(doctorId) || 'Outras';
      
      specialtyCount[specialty] = (specialtyCount[specialty] || 0) + 1;
    });

    // Calcula total para percentuais
    const total = Object.values(specialtyCount).reduce((sum, count) => sum + count, 0);

    // Converte para array e ordena por total (decrescente)
    const distribution = Object.entries(specialtyCount)
      .map(([specialty, count]) => ({
        specialty,
        total: count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0,
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10); // Limita a 10 especialidades

    return distribution;
  } catch (error) {
    console.error('Erro ao buscar distribuição de especialidades:', error);
    // Retorna array vazio em caso de erro
    return [];
  }
}

