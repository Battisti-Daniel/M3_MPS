'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge, getStatusLabel } from "@/components/ui/status-badge";
import {
  cancelAppointment,
  confirmAppointment,
  createAppointment,
  createAdminAppointment,
  fetchAppointment,
  fetchAppointments,
  rescheduleAppointment,
  fetchSchedulingStatus,
  SchedulingStatus,
} from "@/services/appointment-service";
import { fetchDoctors, fetchAvailableSlots, fetchAvailableDates, SlotInfo } from "@/services/doctor-service";
import { createObservation } from "@/services/observation-service";
import { fetchPatientObservationHistory } from "@/services/patient-observation-service";
import { fetchAdminPatients, createPatient } from "@/services/admin-patient-service";
import { Appointment, Doctor, Observation, Patient } from "@/types";
import { useAuthStore } from "@/store/auth-store";
import { handleApiError } from "@/lib/handle-api-error";
import { APPOINTMENT_STATUS_OPTIONS } from "@/constants/appointments";
import { Modal } from "@/components/ui/modal";
import { 
  Plus, Clock, Loader2, ChevronLeft, ChevronRight, Search, 
  Stethoscope, Award, Star, Shield, MapPin, Video, Calendar,
  ArrowLeft, Check, User, Briefcase, AlertTriangle, XCircle
} from "lucide-react";

// Schema base para criação de consultas
const baseAppointmentSchema = z.object({
  doctor_id: z.coerce.number().min(1, "Selecione um médico"),
  patient_id: z.coerce.number().optional(),
  scheduled_at: z.string().min(1, "Informe data e horário"),
  duration_minutes: z.coerce.number().min(15, "No mínimo 15 minutos").max(240, "Até 240 minutos"),
  type: z.enum(["PRESENTIAL", "ONLINE"]),
  notes: z.string().optional(),
});

type PatientForm = z.input<typeof baseAppointmentSchema>;

const observationSchema = z.object({
  anamnesis: z.string().min(1, "Informe a anamnese"),
  diagnosis: z.string().optional(),
  prescription: z.string().optional(),
  notes: z.string().optional(),
});

type ObservationForm = z.infer<typeof observationSchema>;

const rescheduleSchema = z.object({
  scheduled_at: z.string().min(1, "Informe a nova data"),
  duration_minutes: z.coerce.number().min(15).max(240),
});

type RescheduleForm = z.input<typeof rescheduleSchema>;

/**
 * Função utilitária para parsear datetime do backend sem problemas de timezone
 * O backend envia strings no formato "YYYY-MM-DD HH:MM:SS" que representam horário local
 * Usar new Date() diretamente interpreta como UTC, causando diferença de 3 horas
 */
function parseLocalDateTime(dateTimeStr: string): { 
  date: Date, 
  year: number, 
  month: number, 
  day: number, 
  hours: number, 
  minutes: number, 
  seconds: number 
} {
  // Formato esperado: "YYYY-MM-DD HH:MM:SS" ou "YYYY-MM-DDTHH:MM:SS"
  const [datePart, timePart] = dateTimeStr.includes('T') 
    ? dateTimeStr.split('T') 
    : dateTimeStr.split(' ');
  
  const [year, month, day] = datePart.split('-').map(Number);
  const [hours, minutes, seconds] = (timePart || '00:00:00').split(':').map(s => parseInt(s) || 0);
  
  // Criar Date usando componentes locais (não UTC)
  const date = new Date(year, month - 1, day, hours, minutes, seconds);
  
  return { date, year, month, day, hours, minutes, seconds };
}

/**
 * Formata data/hora do backend para exibição sem problemas de timezone
 */
function formatDateTime(dateTimeStr: string, options: Intl.DateTimeFormatOptions): string {
  const { date } = parseLocalDateTime(dateTimeStr);
  return date.toLocaleString('pt-BR', options);
}

/**
 * Formata apenas a hora do datetime do backend
 */
function formatTimeOnly(dateTimeStr: string): string {
  const { hours, minutes } = parseLocalDateTime(dateTimeStr);
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [selectedObservation, setSelectedObservation] = useState<Appointment | null>(null);
  const [selectedReschedule, setSelectedReschedule] = useState<Appointment | null>(null);
  const [detail, setDetail] = useState<Appointment | null>(null);
  const [detailLoadingId, setDetailLoadingId] = useState<number | null>(null);
  const [patientHistory, setPatientHistory] = useState<Observation[] | null>(null);
  const [patientHistoryLoading, setPatientHistoryLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showCreatePatientDialog, setShowCreatePatientDialog] = useState(false);
  const [patientSearch, setPatientSearch] = useState('');
  const [doctorSearch, setDoctorSearch] = useState('');
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [loadingDates, setLoadingDates] = useState(false);
  const [currentMonth, setCurrentMonth] = useState<string>(new Date().toISOString().slice(0, 7));
  const [doctorHasNoSchedules, setDoctorHasNoSchedules] = useState(false);
  
  // Estados para o modal de remarcação
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleSlot, setRescheduleSlot] = useState('');
  const [rescheduleAvailableDates, setRescheduleAvailableDates] = useState<string[]>([]);
  const [rescheduleAvailableSlots, setRescheduleAvailableSlots] = useState<string[]>([]);
  const [rescheduleLoadingDates, setRescheduleLoadingDates] = useState(false);
  const [rescheduleLoadingSlots, setRescheduleLoadingSlots] = useState(false);
  const [rescheduleMonth, setRescheduleMonth] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [showDeadlineWarning, setShowDeadlineWarning] = useState(false);
  
  // Estados para o limite de consultas e bloqueio do paciente
  const [schedulingStatus, setSchedulingStatus] = useState<SchedulingStatus | null>(null);
  const [showLimitWarning, setShowLimitWarning] = useState(false);
  const [showBlockedWarning, setShowBlockedWarning] = useState(false);
  
  const user = useAuthStore((state) => state.user);

  const isDoctor = user?.role === 'DOCTOR';
  const isPatient = user?.role === 'PATIENT';
  const isAdmin = user?.role === 'ADMIN';

  // Schema dinâmico baseado no role
  const appointmentSchema = useMemo(() => {
    if (isAdmin) {
      return baseAppointmentSchema.extend({
        patient_id: z.coerce.number().min(1, "Selecione um paciente"),
      });
    }
    return baseAppointmentSchema;
  }, [isAdmin]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<PatientForm>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      type: 'PRESENTIAL',
      duration_minutes: 30,
    },
  });

  const watchedDoctorId = watch('doctor_id');
  const watchedDuration = watch('duration_minutes') || 30;
  const watchedDate = watch('scheduled_at');

  // Carrega horários disponíveis quando médico e data são selecionados
  useEffect(() => {
    const loadAvailableSlots = async () => {
      if (!watchedDoctorId || !watchedDate) {
        setAvailableSlots([]);
        return;
      }

      try {
        // Extrai apenas a data (sem hora) do campo
        let dateOnly = '';
        if (watchedDate.includes('T')) {
          dateOnly = watchedDate.split('T')[0];
        } else if (watchedDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
          dateOnly = watchedDate;
        } else {
          setAvailableSlots([]);
          return;
        }

        if (!dateOnly) {
          setAvailableSlots([]);
          return;
        }

        setLoadingSlots(true);
        const response = await fetchAvailableSlots(
          Number(watchedDoctorId),
          dateOnly,
          Number(watchedDuration)
        );
        setAvailableSlots(response.available_slots || []);
      } catch (error) {
        console.error('Erro ao carregar horários disponíveis:', error);
        setAvailableSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    };

    loadAvailableSlots();
  }, [watchedDoctorId, watchedDate, watchedDuration]);

  // Função para carregar dias disponíveis do mês
  const loadAvailableDates = async (doctorId: number) => {
    if (!doctorId) {
      setAvailableDates([]);
      setDoctorHasNoSchedules(false);
      return;
    }

    try {
      setLoadingDates(true);
      const response = await fetchAvailableDates(doctorId, currentMonth);
      setAvailableDates(response.available_dates || []);
      setDoctorHasNoSchedules(response.has_schedules === false);
    } catch (error) {
      console.error('Erro ao carregar dias disponíveis:', error);
      setAvailableDates([]);
      setDoctorHasNoSchedules(false);
    } finally {
      setLoadingDates(false);
    }
  };

  const {
    register: registerObservation,
    handleSubmit: handleObservationSubmit,
    formState: { errors: observationErrors },
    reset: resetObservation,
  } = useForm<ObservationForm>({
    resolver: zodResolver(observationSchema),
  });

  const {
    register: registerReschedule,
    handleSubmit: handleRescheduleSubmit,
    formState: { errors: rescheduleErrors },
    reset: resetReschedule,
    setValue: setRescheduleValue,
  } = useForm<RescheduleForm>({
    resolver: zodResolver(rescheduleSchema),
    defaultValues: {
      duration_minutes: 30,
    },
  });

  useEffect(() => {
    async function load() {
      try {
        const appointmentsResponse = await fetchAppointments({ per_page: 20, status: statusFilter });
        setAppointments(appointmentsResponse.data ?? []);

        // Carrega médicos para pacientes ou admin
        if (isPatient || isAdmin) {
          const doctorResponse = await fetchDoctors({ per_page: 100 });
          setDoctors(doctorResponse.data ?? []);
        }

        // Carrega pacientes para admin
        if (isAdmin) {
          const patientResponse = await fetchAdminPatients({ per_page: 100 });
          setPatients(patientResponse.data ?? []);
        }
        
        // Carrega status de agendamento para pacientes
        if (isPatient) {
          try {
            const status = await fetchSchedulingStatus();
            console.log('Status carregado da API:', status);
            setSchedulingStatus(status);
          } catch (err) {
            console.error('Erro ao carregar scheduling status:', err);
            // Se falhar, não bloqueia o carregamento
          }
        }
      } catch (error) {
        handleApiError(error, 'Erro ao carregar consultas');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [isPatient, isAdmin, statusFilter]);

  const reloadAppointments = async () => {
    const response = await fetchAppointments({ per_page: 20, status: statusFilter });
    setAppointments(response.data ?? []);
    
    // Recarrega status de agendamento para pacientes
    if (isPatient) {
      try {
        const status = await fetchSchedulingStatus();
        setSchedulingStatus(status);
      } catch {
        // Ignora erro
      }
    }
  };
  
  // Função para verificar se pode agendar e abrir dialog
  const handleOpenCreateDialog = () => {
    console.log('schedulingStatus:', schedulingStatus);
    console.log('is_blocked value:', schedulingStatus?.is_blocked, 'type:', typeof schedulingStatus?.is_blocked);
    if (isPatient && schedulingStatus) {
      // Primeiro verifica se está bloqueado por faltas (verifica tanto boolean quanto número)
      if (schedulingStatus.is_blocked || schedulingStatus.consecutive_no_shows >= 3) {
        console.log('Mostrando modal de bloqueio');
        setShowBlockedWarning(true);
        return;
      }
      // Depois verifica limite de consultas
      if (!schedulingStatus.can_schedule) {
        console.log('Mostrando modal de limite');
        setShowLimitWarning(true);
        return;
      }
    }
    setShowCreateDialog(true);
  };

  const onCreateAppointment = async (values: PatientForm) => {
    try {
      // Parse os valores usando o schema para obter os valores transformados
      const parsed = appointmentSchema.parse(values);
      
      // Converte datetime para formato que o backend espera
      if (parsed.scheduled_at) {
        // Verifica se já está no formato correto do backend "YYYY-MM-DD HH:MM:SS"
        const backendFormatRegex = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;
        if (backendFormatRegex.test(parsed.scheduled_at)) {
          // Já está no formato correto, não precisa converter
        } else if (parsed.scheduled_at.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/)) {
          // Formato "YYYY-MM-DD HH:MM" - apenas adiciona segundos
          parsed.scheduled_at = parsed.scheduled_at + ':00';
        } else if (parsed.scheduled_at.includes('T')) {
          // Formato ISO com T - converter para formato do backend
          // Extrai data e hora diretamente da string, sem interpretar timezone
          const [datePart, timePart] = parsed.scheduled_at.split('T');
          const time = timePart.split('.')[0]; // Remove milissegundos se houver
          parsed.scheduled_at = `${datePart} ${time.length === 5 ? time + ':00' : time}`;
        } else {
          // Assume que é apenas data ou formato desconhecido - usa método antigo
          const dateTime = new Date(parsed.scheduled_at + 'T09:00:00');
          const year = dateTime.getFullYear();
          const month = String(dateTime.getMonth() + 1).padStart(2, '0');
          const day = String(dateTime.getDate()).padStart(2, '0');
          parsed.scheduled_at = `${year}-${month}-${day} 09:00:00`;
        }
      }
      
      if (isAdmin) {
        // Admin usa endpoint específico que aceita patient_id
        await createAdminAppointment(parsed);
      } else {
        // Remove patient_id se não for admin (pacientes não podem escolher outro paciente)
        if ('patient_id' in parsed) {
          delete parsed.patient_id;
        }
        await createAppointment(parsed);
      }
      
      toast.success('Consulta agendada com sucesso');
      reset({ type: 'PRESENTIAL', duration_minutes: 30 } as Partial<PatientForm>);
      setShowCreateDialog(false);
      setPatientSearch('');
      setDoctorSearch('');
      await reloadAppointments();
    } catch (error) {
      handleApiError(error, 'Não foi possível criar a consulta');
    }
  };

  const handleConfirm = async (id: number) => {
    setBusyId(id);
    try {
      await confirmAppointment(id);
      toast.success('Consulta confirmada');
      await reloadAppointments();
    } catch (error) {
      handleApiError(error, 'Falha ao confirmar');
    } finally {
      setBusyId(null);
    }
  };

  // Estado para controlar o modal de cancelamento
  const [showCancelWarning, setShowCancelWarning] = useState(false);
  const [appointmentToCancel, setAppointmentToCancel] = useState<Appointment | null>(null);

  // Verifica se pode cancelar (24h de antecedência)
  const canCancelWithin24h = (appointment: Appointment): boolean => {
    const { date: scheduledDate } = parseLocalDateTime(appointment.scheduled_at);
    const now = new Date();
    const hoursUntilAppointment = (scheduledDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    return hoursUntilAppointment >= 24;
  };

  const handleCancel = async (appointment: Appointment) => {
    // Verifica se está dentro do prazo de 24h
    if (!canCancelWithin24h(appointment)) {
      setAppointmentToCancel(appointment);
      setShowCancelWarning(true);
      return;
    }
    
    // Se está fora do prazo, pode cancelar
    await performCancel(appointment.id);
  };

  const performCancel = async (id: number) => {
    setBusyId(id);
    try {
      await cancelAppointment(id);
      toast.success('Consulta cancelada');
      await reloadAppointments();
    } catch (error) {
      handleApiError(error, 'Erro ao cancelar');
    } finally {
      setBusyId(null);
    }
  };

  const onCreateObservation = async (values: ObservationForm) => {
    if (!selectedObservation) return;
    setBusyId(selectedObservation.id);
    try {
      await createObservation(selectedObservation.id, values);
      toast.success('Observação registrada');
      resetObservation();
      setSelectedObservation(null);
      await reloadAppointments();
    } catch (error) {
      handleApiError(error, 'Erro ao registrar observação');
    } finally {
      setBusyId(null);
    }
  };

  // Verifica se a consulta pode ser remarcada (24h de antecedência)
  const canRescheduleWithin24h = (appointment: Appointment): boolean => {
    const { date: scheduledDate } = parseLocalDateTime(appointment.scheduled_at);
    const now = new Date();
    const hoursUntilAppointment = (scheduledDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    return hoursUntilAppointment >= 24;
  };

  // Handler para abrir modal de remarcação
  const handleOpenReschedule = (appointment: Appointment) => {
    if (!canRescheduleWithin24h(appointment)) {
      setSelectedReschedule(appointment);
      setShowDeadlineWarning(true);
      return;
    }
    
    setSelectedReschedule(appointment);
    setRescheduleDate('');
    setRescheduleSlot('');
    setRescheduleAvailableDates([]);
    setRescheduleAvailableSlots([]);
    setShowRescheduleModal(true);
    
    // Carregar datas disponíveis do médico
    if (appointment.doctor?.id) {
      loadRescheduleAvailableDates(appointment.doctor.id, rescheduleMonth);
    }
  };

  // Carregar datas disponíveis para remarcação
  const loadRescheduleAvailableDates = async (doctorId: number, month: string) => {
    setRescheduleLoadingDates(true);
    try {
      const response = await fetchAvailableDates(doctorId, month);
      setRescheduleAvailableDates(response.available_dates || []);
    } catch (error) {
      console.error('Erro ao carregar datas:', error);
      setRescheduleAvailableDates([]);
    } finally {
      setRescheduleLoadingDates(false);
    }
  };

  // Carregar slots disponíveis para remarcação
  const loadRescheduleAvailableSlots = async (doctorId: number, date: string) => {
    setRescheduleLoadingSlots(true);
    try {
      const response = await fetchAvailableSlots(doctorId, date, 30);
      setRescheduleAvailableSlots(response.available_slots || []);
    } catch (error) {
      console.error('Erro ao carregar horários:', error);
      setRescheduleAvailableSlots([]);
    } finally {
      setRescheduleLoadingSlots(false);
    }
  };

  // Handler para mudança de mês no calendário de remarcação
  const handleRescheduleMonthChange = (month: string) => {
    setRescheduleMonth(month);
    if (selectedReschedule?.doctor?.id) {
      loadRescheduleAvailableDates(selectedReschedule.doctor.id, month);
    }
  };

  // Handler para seleção de data de remarcação
  const handleRescheduleDateSelect = (date: string) => {
    setRescheduleDate(date);
    setRescheduleSlot('');
    if (selectedReschedule?.doctor?.id) {
      loadRescheduleAvailableSlots(selectedReschedule.doctor.id, date);
    }
  };

  // Confirmar remarcação
  const handleConfirmReschedule = async () => {
    if (!selectedReschedule || !rescheduleSlot) return;
    
    setBusyId(selectedReschedule.id);
    try {
      await rescheduleAppointment(selectedReschedule.id, {
        scheduled_at: rescheduleSlot,
        duration_minutes: selectedReschedule.duration_minutes || 30,
      });
      
      toast.success('Consulta remarcada com sucesso!');
      setShowRescheduleModal(false);
      setSelectedReschedule(null);
      setRescheduleDate('');
      setRescheduleSlot('');
      await reloadAppointments();
    } catch (error) {
      handleApiError(error, 'Erro ao remarcar consulta');
    } finally {
      setBusyId(null);
    }
  };

  // Função legada mantida por compatibilidade
  const onReschedule = async (values: RescheduleForm) => {
    if (!selectedReschedule) return;
    setBusyId(selectedReschedule.id);
    try {
      // Parse os valores usando o schema para obter os valores transformados
      const parsed = rescheduleSchema.parse(values);
      
      // Converte para formato que o backend espera
      if (parsed.scheduled_at) {
        // Verifica se já está no formato correto do backend "YYYY-MM-DD HH:MM:SS"
        const backendFormatRegex = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;
        if (!backendFormatRegex.test(parsed.scheduled_at)) {
          // Se não está no formato, extrai partes da string
          const [datePart, timePart] = parsed.scheduled_at.includes('T') 
            ? parsed.scheduled_at.split('T') 
            : parsed.scheduled_at.split(' ');
          const time = timePart ? timePart.split('.')[0] : '00:00:00';
          parsed.scheduled_at = `${datePart} ${time.length === 5 ? time + ':00' : time}`;
        }
      }
      
      await rescheduleAppointment(selectedReschedule.id, parsed);
      toast.success('Solicitação de remarcação enviada');
      resetReschedule();
      setSelectedReschedule(null);
      await reloadAppointments();
    } catch (error) {
      handleApiError(error, 'Erro ao remarcar');
    } finally {
      setBusyId(null);
    }
  };

  const handleViewDetail = async (appointment: Appointment) => {
    setDetailLoadingId(appointment.id);
    try {
      const response = await fetchAppointment(appointment.id);
      setDetail(response);
      setPatientHistory(null);
    } catch (error) {
      handleApiError(error, 'Não foi possível carregar detalhes');
    } finally {
      setDetailLoadingId(null);
    }
  };

  const filteredDoctors = useMemo(() => {
    if (!doctorSearch) return doctors;
    const search = doctorSearch.toLowerCase();
    return doctors.filter(
      (doctor) =>
        doctor.name.toLowerCase().includes(search) ||
        doctor.specialty?.toLowerCase().includes(search)
    );
  }, [doctors, doctorSearch]);

  const filteredPatients = useMemo(() => {
    if (!patientSearch) return patients;
    const search = patientSearch.toLowerCase();
    return patients.filter(
      (patient) =>
        patient.name.toLowerCase().includes(search) ||
        patient.cpf?.toLowerCase().includes(search) ||
        patient.user?.email?.toLowerCase().includes(search)
    );
  }, [patients, patientSearch]);

  const doctorOptions = useMemo(
    () =>
      filteredDoctors.map((doctor) => ({
        value: doctor.id,
        label: `${doctor.name} • ${doctor.specialty}`,
      })),
    [filteredDoctors]
  );

  const patientOptions = useMemo(
    () =>
      filteredPatients.map((patient) => ({
        value: patient.id,
        label: `${patient.name}${patient.cpf ? ` • CPF: ${patient.cpf}` : ''}`,
      })),
    [filteredPatients]
  );

  const loadPatientHistory = async (patientId: number) => {
    setPatientHistoryLoading(true);
    try {
      const history = await fetchPatientObservationHistory(patientId);
      setPatientHistory(history);
    } catch (error) {
      handleApiError(error, 'Não foi possível carregar o histórico do paciente');
    } finally {
      setPatientHistoryLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Novo fluxo de agendamento para paciente - escolha do médico primeiro */}
      {isPatient && (
        <PatientAppointmentWizard
          doctors={doctors}
          loading={loading}
          onCreateAppointment={onCreateAppointment}
          schedulingStatus={schedulingStatus}
        />
      )}

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>Consultas</CardTitle>
              <CardDescription>
                {isAdmin ? 'Gerencie todas as consultas do sistema' : 'Acompanhe todas as suas consultas agendadas.'}
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              {isAdmin && (
                <>
                  <Button onClick={() => setShowCreateDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Consulta
                  </Button>
                  <Modal
                    isOpen={showCreateDialog}
                    onClose={() => setShowCreateDialog(false)}
                    title="Agendar Nova Consulta"
                    size="lg"
                  >
                    <div className="space-y-4">
                      <p className="text-sm text-slate-600">
                        Preencha os dados para criar uma nova consulta no sistema.
                      </p>
                      <form onSubmit={handleSubmit(onCreateAppointment)} className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2 md:col-span-2">
                          <div className="flex items-center justify-between">
                            <Label htmlFor="admin_patient_id">Paciente *</Label>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setShowCreatePatientDialog(true)}
                              className="text-xs"
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              Novo Paciente
                            </Button>
                          </div>
                          <Input
                            id="patient_search"
                            placeholder="Buscar paciente por nome, CPF ou email..."
                            value={patientSearch}
                            onChange={(e) => setPatientSearch(e.target.value)}
                            className="mb-2"
                          />
                          <select
                            id="admin_patient_id"
                            className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            {...register('patient_id', { valueAsNumber: true })}
                          >
                            <option value="">Selecione um paciente</option>
                            {patientOptions.map((patient) => (
                              <option key={patient.value} value={patient.value}>
                                {patient.label}
                              </option>
                            ))}
                          </select>
                          {patientOptions.length === 0 && patientSearch && (
                            <p className="text-xs text-slate-500">Nenhum paciente encontrado. Clique em "Novo Paciente" para cadastrar.</p>
                          )}
                          {errors.patient_id && <p className="text-xs text-red-500">{errors.patient_id.message as string}</p>}
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <Label htmlFor="admin_doctor_id">Médico *</Label>
                          <Input
                            id="doctor_search"
                            placeholder="Buscar médico por nome ou especialidade..."
                            value={doctorSearch}
                            onChange={(e) => setDoctorSearch(e.target.value)}
                            className="mb-2"
                          />
                          <select
                            id="admin_doctor_id"
                            className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            {...register('doctor_id', {
                              onChange: (e) => {
                                const doctorId = e.target.value;
                                if (doctorId) {
                                  loadAvailableDates(Number(doctorId));
                                } else {
                                  setAvailableDates([]);
                                  setDoctorHasNoSchedules(false);
                                }
                              },
                            })}
                          >
                            <option value="">Selecione um médico</option>
                            {doctorOptions.map((doctor) => (
                              <option key={doctor.value} value={doctor.value}>
                                {doctor.label}
                              </option>
                            ))}
                          </select>
                          {doctorOptions.length === 0 && doctorSearch && (
                            <p className="text-xs text-slate-500">Nenhum médico encontrado.</p>
                          )}
                          {errors.doctor_id && <p className="text-xs text-red-500">{errors.doctor_id.message as string}</p>}
                        </div>
                        {!!watchedDoctorId && (
                          <div className="space-y-2 md:col-span-2">
                            <Label>Selecione a Data *</Label>
                            <AppointmentCalendar
                              availableDates={availableDates}
                              loadingDates={loadingDates}
                              currentMonth={currentMonth}
                              onMonthChange={(month) => {
                                setCurrentMonth(month);
                                if (watchedDoctorId) {
                                  fetchAvailableDates(Number(watchedDoctorId), month).then(response => {
                                    setAvailableDates(response.available_dates || []);
                                    setDoctorHasNoSchedules(response.has_schedules === false);
                                  }).catch(() => {
                                    setAvailableDates([]);
                                    setDoctorHasNoSchedules(false);
                                  });
                                }
                              }}
                              onDateSelect={(date) => {
                                setValue('scheduled_at', date);
                              }}
                              selectedDate={watchedDate?.split('T')[0] || watchedDate || ''}
                              doctorHasNoSchedules={doctorHasNoSchedules}
                            />
                            <input
                              type="hidden"
                              {...register('scheduled_at')}
                            />
                            {errors.scheduled_at && <p className="text-xs text-red-500">{errors.scheduled_at.message}</p>}
                          </div>
                        )}
                        {!watchedDoctorId && (
                          <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="admin_scheduled_date">Data *</Label>
                            <Input 
                              id="admin_scheduled_date" 
                              type="date" 
                              min={new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                              onChange={(e) => {
                                const dateOnly = e.target.value;
                                if (dateOnly) {
                                  setValue('scheduled_at', dateOnly);
                                }
                              }}
                              value={watchedDate?.split('T')[0] || watchedDate || ''}
                            />
                            <input
                              type="hidden"
                              {...register('scheduled_at')}
                            />
                            {errors.scheduled_at && <p className="text-xs text-red-500">{errors.scheduled_at.message}</p>}
                          </div>
                        )}
                        <div className="space-y-2">
                          <Label htmlFor="admin_duration_minutes">Duração (min) *</Label>
                          <Input 
                            id="admin_duration_minutes" 
                            type="number" 
                            min={15}
                            max={240}
                            {...register('duration_minutes', { valueAsNumber: true })} 
                          />
                          {errors.duration_minutes && <p className="text-xs text-red-500">{errors.duration_minutes.message}</p>}
                        </div>
                        {!!watchedDoctorId && !!watchedDate && (
                          <div className="space-y-2 md:col-span-2">
                            <Label>Horários Disponíveis</Label>
                            {loadingSlots ? (
                              <div className="flex items-center justify-center py-4">
                                <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                                <span className="ml-2 text-sm text-slate-600">Carregando horários...</span>
                              </div>
                            ) : availableSlots.length > 0 ? (
                              <div className="grid grid-cols-3 md:grid-cols-4 gap-2 max-h-48 overflow-y-auto p-2 border border-slate-200 rounded-md">
                                {availableSlots.map((slot) => {
                                  // Extrair hora diretamente da string sem converter para Date
                                  const timePart = slot.includes('T') ? slot.split('T')[1] : slot.split(' ')[1];
                                  const timeStr = timePart ? timePart.substring(0, 5) : slot;
                                  // Usar o slot original como valor (já está no formato do backend)
                                  const datetimeValue = slot;
                                  const currentScheduled = watch('scheduled_at');
                                  const isSelected = currentScheduled && currentScheduled === slot;
                                  
                                  return (
                                    <button
                                      key={slot}
                                      type="button"
                                      onClick={() => {
                                        setValue('scheduled_at', datetimeValue);
                                      }}
                                      className={`
                                        px-3 py-2 text-sm rounded-md border transition-colors
                                        ${isSelected 
                                          ? 'bg-blue-500 text-white border-blue-500' 
                                          : 'bg-white text-slate-700 border-slate-300 hover:border-blue-500 hover:bg-blue-50'
                                        }
                                      `}
                                    >
                                      <Clock className="h-3 w-3 inline mr-1" />
                                      {timeStr}
                                    </button>
                                  );
                                })}
                              </div>
                            ) : watchedDate ? (
                              <div className="p-4 text-center text-sm text-slate-500 border border-slate-200 rounded-md bg-slate-50">
                                <p>Nenhum horário disponível para esta data.</p>
                                <p className="text-xs mt-1">Selecione outra data ou verifique a agenda do médico.</p>
                              </div>
                            ) : null}
                          </div>
                        )}
                        <div className="space-y-2">
                          <Label htmlFor="admin_type">Tipo *</Label>
                          <select
                            id="admin_type"
                            className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            {...register('type')}
                          >
                            <option value="PRESENTIAL">Presencial</option>
                            <option value="ONLINE">Online</option>
                          </select>
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <Label htmlFor="admin_notes">Observações</Label>
                          <Textarea 
                            id="admin_notes" 
                            placeholder="Informações adicionais (opcional)" 
                            rows={3}
                            {...register('notes')} 
                          />
                        </div>
                        <div className="md:col-span-2 flex items-center justify-end gap-2 pt-2">
                          <Button type="button" variant="ghost" onClick={() => {
                            setShowCreateDialog(false);
                            setPatientSearch('');
                            setDoctorSearch('');
                          }}>
                            Cancelar
                          </Button>
                          <Button type="submit">Agendar Consulta</Button>
                        </div>
                      </form>
                    </div>
                  </Modal>

                  {/* Modal para criar paciente rapidamente */}
                  <CreatePatientModal
                    isOpen={showCreatePatientDialog}
                    onClose={() => setShowCreatePatientDialog(false)}
                    onSuccess={async (newPatient) => {
                      // Recarrega a lista de pacientes
                      const patientResponse = await fetchAdminPatients({ per_page: 100 });
                      setPatients(patientResponse.data ?? []);
                      
                      // Seleciona o paciente recém-criado no formulário
                      setValue('patient_id', newPatient.id);
                      setPatientSearch(newPatient.name);
                      
                      setShowCreatePatientDialog(false);
                      toast.success('Paciente cadastrado com sucesso! Agora você pode agendar a consulta.');
                    }}
                  />
                </>
              )}
              <div className="flex flex-wrap items-center gap-3">
                <Label className="text-xs uppercase text-slate-500 dark:text-slate-400" htmlFor="status_filter">
                  Status
                </Label>
                <select
                  id="status_filter"
                  className="h-9 rounded-md border border-slate-200 bg-white px-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                  value={statusFilter ?? ""}
                  onChange={(event) => setStatusFilter(event.target.value || undefined)}
                >
                  {APPOINTMENT_STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </CardHeader>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="space-y-2 p-6">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700 text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-slate-600 dark:text-slate-300">Data</th>
                  <th className="px-4 py-2 text-left font-medium text-slate-600 dark:text-slate-300">Médico</th>
                  <th className="px-4 py-2 text-left font-medium text-slate-600 dark:text-slate-300">Paciente</th>
                  <th className="px-4 py-2 text-left font-medium text-slate-600 dark:text-slate-300">Status</th>
                  <th className="px-4 py-2 text-right font-medium text-slate-600 dark:text-slate-300">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700 bg-white dark:bg-slate-900">
                {appointments.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-6">
                      <EmptyState className="border-none bg-transparent p-0">
                        Nenhuma consulta encontrada.
                      </EmptyState>
                    </td>
                  </tr>
                )}
                {appointments.map((appointment) => {
                const date = formatDateTime(appointment.scheduled_at, {
                  dateStyle: 'short',
                  timeStyle: 'short',
                });
                // Verifica se a data/hora da consulta já passou
                const hasAppointmentPassed = new Date(appointment.scheduled_at) < new Date();
                
                const canConfirm =
                  (isDoctor || isAdmin) && appointment.status === 'PENDING';
                // Não pode cancelar ou remarcar consultas concluídas, canceladas ou com falta
                const canCancel = !['CANCELLED', 'COMPLETED', 'NO_SHOW'].includes(appointment.status);
                const canReschedule = !['CANCELLED', 'COMPLETED', 'NO_SHOW'].includes(appointment.status);
                // Pode registrar observação: COMPLETED e é médico/admin
                const canObserve = (isDoctor || isAdmin) && appointment.status === 'COMPLETED';
                // Pode marcar falta: apenas CONFIRMED, é médico/admin, e data passou
                const canMarkNoShow = (isDoctor || isAdmin) && appointment.status === 'CONFIRMED' && hasAppointmentPassed;
                // Consultas finalizadas têm fundo mais escuro
                const isFinished = ['CANCELLED', 'COMPLETED', 'NO_SHOW'].includes(appointment.status);
                const rowClass = isFinished 
                  ? "bg-slate-50 dark:bg-slate-800/50" 
                  : "";

                return (
                  <tr key={appointment.id} className={rowClass}>
                    <td className="px-4 py-2 text-slate-700 dark:text-slate-300">{date}</td>
                    <td className="px-4 py-2 text-slate-700 dark:text-slate-300">{appointment.doctor?.name ?? '---'}</td>
                    <td className="px-4 py-2 text-slate-700 dark:text-slate-300">{appointment.patient?.name ?? '---'}</td>
                    <td className="px-4 py-2">
                      <StatusBadge status={appointment.status} />
                    </td>
                    <td className="px-4 py-2 text-right">
                      <div className="flex flex-wrap justify-end gap-2">
                        {canConfirm && (
                          <Button
                            variant="secondary"
                            onClick={() => handleConfirm(appointment.id)}
                            disabled={busyId === appointment.id}
                          >
                            Confirmar
                          </Button>
                        )}
                        {canCancel && (
                          <Button
                            variant="ghost"
                            onClick={() => handleCancel(appointment)}
                            disabled={busyId === appointment.id}
                          >
                            Cancelar
                          </Button>
                        )}
                        {canReschedule && (
                          <Button
                            variant="secondary"
                            onClick={() => handleOpenReschedule(appointment)}
                            disabled={busyId === appointment.id}
                          >
                            Remarcar
                          </Button>
                        )}
                        {canObserve && (
                          <Button
                            onClick={() => {
                              setSelectedObservation(appointment);
                              resetObservation();
                            }}
                          >
                            Registrar observação
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          onClick={() => handleViewDetail(appointment)}
                          disabled={detailLoadingId === appointment.id}
                        >
                          {detailLoadingId === appointment.id ? 'Carregando...' : 'Ver detalhes'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              </tbody>
            </table>
          )}
        </div>
      </Card>

      {/* Modal de Observação Clínica */}
      <Modal
        isOpen={!!selectedObservation}
        onClose={() => setSelectedObservation(null)}
        title="Registrar Observação Clínica"
      >
        {selectedObservation && (
          <div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              Paciente: <strong>{selectedObservation.patient?.name ?? 'Paciente'}</strong> • Consulta em{' '}
              {formatDateTime(selectedObservation.scheduled_at, {
                dateStyle: 'short',
                timeStyle: 'short',
              })}
            </p>
            <form onSubmit={handleObservationSubmit(onCreateObservation)} className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="anamnesis">Anamnese *</Label>
                <Textarea id="anamnesis" rows={3} {...registerObservation('anamnesis')} placeholder="Descreva os sintomas relatados, histórico..." />
                {observationErrors.anamnesis && (
                  <p className="text-xs text-red-500">{observationErrors.anamnesis.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="diagnosis">Diagnóstico</Label>
                <Textarea id="diagnosis" rows={2} {...registerObservation('diagnosis')} placeholder="Diagnóstico ou hipótese diagnóstica..." />
              </div>
              <div className="space-y-2">
                <Label htmlFor="prescription">Prescrição</Label>
                <Textarea id="prescription" rows={2} {...registerObservation('prescription')} placeholder="Medicamentos, exames solicitados..." />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notas adicionais</Label>
                <Textarea id="notes" rows={2} {...registerObservation('notes')} placeholder="Observações gerais..." />
              </div>
              <div className="flex items-center justify-end gap-2 pt-4">
                <Button type="button" variant="ghost" onClick={() => setSelectedObservation(null)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={busyId === selectedObservation.id}>
                  {busyId === selectedObservation.id ? 'Salvando...' : 'Salvar observação'}
                </Button>
              </div>
            </form>
          </div>
        )}
      </Modal>

      {/* Modal de aviso de limite de consultas */}
      <Modal
        isOpen={showLimitWarning}
        onClose={() => setShowLimitWarning(false)}
        title="Limite de Consultas"
        size="sm"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-6 w-6 text-amber-500" />
            </div>
            <div>
              <h4 className="font-medium text-amber-800 dark:text-amber-200">Limite atingido</h4>
              <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                Você já possui <strong>{schedulingStatus?.current_future_appointments} consultas</strong> futuras agendadas.
              </p>
            </div>
          </div>
          
          <p className="text-sm text-slate-600 dark:text-slate-400">
            O limite máximo é de <strong>{schedulingStatus?.max_allowed} consultas</strong> futuras por vez.
            Aguarde uma consulta ser realizada ou cancele uma existente para agendar uma nova.
          </p>
          
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
            <Shield className="h-4 w-4" />
            <span>Esta regra ajuda a garantir disponibilidade para todos os pacientes</span>
          </div>
          
          <div className="flex justify-end">
            <Button onClick={() => setShowLimitWarning(false)}>
              Entendi
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal de aviso de conta bloqueada por faltas */}
      <Modal
        isOpen={showBlockedWarning}
        onClose={() => setShowBlockedWarning(false)}
        title="Conta Bloqueada"
        size="sm"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-6 w-6 text-red-500" />
            </div>
            <div>
              <h4 className="font-medium text-red-800 dark:text-red-200">Agendamentos bloqueados</h4>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                Você possui <strong>{schedulingStatus?.consecutive_no_shows} faltas</strong> consecutivas registradas.
              </p>
            </div>
          </div>
          
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Devido ao histórico de faltas consecutivas, sua conta foi temporariamente bloqueada para novos agendamentos.
          </p>

          <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 space-y-2">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Como resolver?</p>
            <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1 list-disc list-inside">
              <li>Entre em contato com a administração da clínica</li>
              <li>Solicite a liberação do seu cadastro</li>
              <li>Comprometa-se a comparecer às próximas consultas</li>
            </ul>
          </div>
          
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3 border border-amber-200 dark:border-amber-800">
            <Shield className="h-4 w-4 text-amber-500" />
            <span>Faltas prejudicam outros pacientes que poderiam usar o horário. Agradecemos sua compreensão.</span>
          </div>
          
          <div className="flex justify-end">
            <Button onClick={() => setShowBlockedWarning(false)}>
              Entendi
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal de aviso de prazo de 24h */}
      <Modal
        isOpen={showDeadlineWarning}
        onClose={() => {
          setShowDeadlineWarning(false);
          setSelectedReschedule(null);
        }}
        title="Atenção"
        size="sm"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <h4 className="font-medium text-amber-800 dark:text-amber-200">Prazo excedido</h4>
              <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                Cancelamento ou remarcação de consultas deve ser feito com <strong>pelo menos 24 horas de antecedência</strong>.
              </p>
            </div>
          </div>
          
          {selectedReschedule && (
            <div className="text-sm text-slate-600 dark:text-slate-400">
              <p>Sua consulta está agendada para:</p>
              <p className="font-medium text-slate-800 dark:text-slate-200 mt-1">
                {formatDateTime(selectedReschedule.scheduled_at, {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          )}
          
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Entre em contato com a clínica para casos de emergência.
          </p>
          
          <div className="flex justify-end">
            <Button 
              onClick={() => {
                setShowDeadlineWarning(false);
                setSelectedReschedule(null);
              }}
            >
              Entendi
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal de aviso de prazo de 24h para Cancelamento */}
      <Modal
        isOpen={showCancelWarning}
        onClose={() => {
          setShowCancelWarning(false);
          setAppointmentToCancel(null);
        }}
        title="Atenção"
        size="sm"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <h4 className="font-medium text-amber-800 dark:text-amber-200">Prazo excedido</h4>
              <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                Cancelamento ou remarcação de consultas deve ser feito com <strong>pelo menos 24 horas de antecedência</strong>.
              </p>
            </div>
          </div>
          
          {appointmentToCancel && (
            <div className="text-sm text-slate-600 dark:text-slate-400">
              <p>Sua consulta está agendada para:</p>
              <p className="font-medium text-slate-800 dark:text-slate-200 mt-1">
                {formatDateTime(appointmentToCancel.scheduled_at, {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          )}
          
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Entre em contato com a clínica para casos de emergência.
          </p>
          
          <div className="flex justify-end">
            <Button 
              onClick={() => {
                setShowCancelWarning(false);
                setAppointmentToCancel(null);
              }}
            >
              Entendi
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal de Remarcação com Calendário */}
      <Modal
        isOpen={showRescheduleModal}
        onClose={() => {
          setShowRescheduleModal(false);
          setSelectedReschedule(null);
          setRescheduleDate('');
          setRescheduleSlot('');
        }}
        title="Remarcar Consulta"
        size="lg"
      >
        {selectedReschedule && (
          <div className="space-y-6">
            {/* Info da consulta atual */}
            <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
              <p className="text-sm text-slate-500 dark:text-slate-400">Consulta atual</p>
              <div className="mt-2 flex flex-wrap items-center gap-4">
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Médico</p>
                  <p className="font-medium text-slate-800 dark:text-slate-200">{selectedReschedule.doctor?.name}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Data atual</p>
                  <p className="font-medium text-slate-800 dark:text-slate-200">
                    {formatDateTime(selectedReschedule.scheduled_at, {
                      dateStyle: 'short',
                      timeStyle: 'short',
                    })}
                  </p>
                </div>
              </div>
            </div>

            {/* Calendário */}
            <div>
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Selecione a nova data
              </h3>
              <RescheduleCalendar
                currentMonth={rescheduleMonth}
                availableDates={rescheduleAvailableDates}
                selectedDate={rescheduleDate}
                loadingDates={rescheduleLoadingDates}
                onMonthChange={handleRescheduleMonthChange}
                onDateSelect={handleRescheduleDateSelect}
              />
            </div>

            {/* Slots de horário */}
            {rescheduleDate && (
              <div>
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Selecione o horário
                </h3>
                {rescheduleLoadingSlots ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                    <span className="ml-2 text-sm text-slate-500">Carregando horários...</span>
                  </div>
                ) : rescheduleAvailableSlots.length > 0 ? (
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                    {rescheduleAvailableSlots.map((slot) => {
                      // Extrair hora diretamente da string sem converter para Date
                      const timePart = slot.includes('T') ? slot.split('T')[1] : slot.split(' ')[1];
                      const time = timePart ? timePart.substring(0, 5) : slot;
                      const isSelected = rescheduleSlot === slot;
                      return (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => setRescheduleSlot(slot)}
                          className={`
                            py-2 px-3 rounded-lg text-sm font-medium transition-all
                            ${isSelected
                              ? 'bg-blue-500 text-white shadow-lg'
                              : 'bg-slate-100 text-slate-700 hover:bg-blue-100 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600'
                            }
                          `}
                        >
                          {time}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">
                    Nenhum horário disponível nesta data.
                  </p>
                )}
              </div>
            )}

            {/* Resumo e botões */}
            {rescheduleSlot && (
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
                <p className="text-sm text-green-700 dark:text-green-300">
                  <strong>Nova data:</strong>{' '}
                  {(() => {
                    // Extrair data e hora diretamente da string
                    const [datePart, timePart] = rescheduleSlot.includes('T') 
                      ? rescheduleSlot.split('T') 
                      : rescheduleSlot.split(' ');
                    const [year, month, day] = datePart.split('-');
                    const time = timePart ? timePart.substring(0, 5) : '';
                    const dateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
                    const weekday = dateObj.toLocaleDateString('pt-BR', { weekday: 'long' });
                    const monthName = dateObj.toLocaleDateString('pt-BR', { month: 'long' });
                    return `${weekday}, ${day} de ${monthName} às ${time}`;
                  })()}
                </p>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <Button 
                variant="ghost" 
                onClick={() => {
                  setShowRescheduleModal(false);
                  setSelectedReschedule(null);
                  setRescheduleDate('');
                  setRescheduleSlot('');
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleConfirmReschedule}
                disabled={!rescheduleSlot || busyId === selectedReschedule.id}
              >
                {busyId === selectedReschedule.id ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Remarcando...
                  </>
                ) : (
                  'Confirmar Remarcação'
                )}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {detailLoadingId && !detail && (
        <Card>
          <CardHeader>
            <CardTitle>Detalhes da consulta</CardTitle>
            <CardDescription>Carregando informações...</CardDescription>
          </CardHeader>
          <div className="space-y-2 p-6">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        </Card>
      )}

      {/* Modal de detalhes da consulta */}
      <Modal
        isOpen={!!detail}
        onClose={() => setDetail(null)}
        title="Detalhes da consulta"
        size="lg"
      >
        {detail && (
          <Tabs defaultValue="overview">
            <div className="space-y-4">
              <div className="border-b border-slate-200 dark:border-slate-700 pb-3">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  <span className="font-medium text-slate-800 dark:text-slate-200">{detail.patient?.name ?? 'Paciente'}</span>
                  {' • '}
                  <span className="font-medium text-slate-800 dark:text-slate-200">{detail.doctor?.name ?? 'Médico'}</span>
                </p>
              </div>
              
              <TabsList className="w-full grid grid-cols-3 lg:grid-cols-4">
                <TabsTrigger value="overview">Resumo</TabsTrigger>
                <TabsTrigger value="observations">Observações</TabsTrigger>
                <TabsTrigger value="history">Histórico</TabsTrigger>
                {detail.patient && isDoctor && <TabsTrigger value="patient-history">Paciente</TabsTrigger>}
              </TabsList>
              
              <TabsContent value="overview" className="mt-0">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-lg bg-slate-50 dark:bg-slate-800 p-3">
                    <p className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Status</p>
                    <div className="mt-1">
                      <StatusBadge status={detail.status} />
                    </div>
                  </div>
                  <div className="rounded-lg bg-slate-50 dark:bg-slate-800 p-3">
                    <p className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Data</p>
                    <p className="mt-1 text-sm font-medium text-slate-800 dark:text-slate-200">
                      {formatDateTime(detail.scheduled_at, {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      })}
                    </p>
                  </div>
                  <div className="rounded-lg bg-slate-50 dark:bg-slate-800 p-3">
                    <p className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Tipo</p>
                    <p className="mt-1 text-sm font-medium text-slate-800 dark:text-slate-200">
                      {detail.type === 'ONLINE' ? '🌐 Online' : '🏥 Presencial'}
                    </p>
                  </div>
                  <div className="rounded-lg bg-slate-50 dark:bg-slate-800 p-3">
                    <p className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Duração</p>
                    <p className="mt-1 text-sm font-medium text-slate-800 dark:text-slate-200">{detail.duration_minutes} minutos</p>
                  </div>
                </div>
                {detail.notes && (
                  <div className="mt-4 rounded-lg bg-slate-50 dark:bg-slate-800 p-3">
                    <p className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Notas</p>
                    <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">{detail.notes}</p>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="observations" className="mt-0">
                {detail.observations && detail.observations.length > 0 ? (
                  <ul className="space-y-3 max-h-64 overflow-y-auto">
                    {detail.observations.map((obs) => (
                      <li key={obs.id} className="rounded-lg border border-slate-200 dark:border-slate-700 p-3 bg-white dark:bg-slate-800">
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                          Registrado em {new Date(obs.created_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                        </p>
                        <p className="mt-2 text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Anamnese</p>
                        <p className="text-sm text-slate-700 dark:text-slate-300">{obs.anamnesis}</p>
                        {obs.diagnosis && (
                          <>
                            <p className="mt-2 text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Diagnóstico</p>
                            <p className="text-sm text-slate-700 dark:text-slate-300">{obs.diagnosis}</p>
                          </>
                        )}
                        {obs.prescription && (
                          <>
                            <p className="mt-2 text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Prescrição</p>
                            <p className="text-sm text-slate-700 dark:text-slate-300">{obs.prescription}</p>
                          </>
                        )}
                        {obs.notes && (
                          <>
                            <p className="mt-2 text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Notas adicionais</p>
                            <p className="text-sm text-slate-700 dark:text-slate-300">{obs.notes}</p>
                          </>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-8">Nenhuma observação registrada.</p>
                )}
              </TabsContent>
              
              <TabsContent value="history" className="mt-0">
                {detail.logs && detail.logs.length > 0 ? (
                  <ul className="space-y-2 max-h-64 overflow-y-auto">
                    {detail.logs.map((log) => (
                      <li key={log.id} className="rounded-lg border border-slate-200 dark:border-slate-700 p-3 text-sm bg-white dark:bg-slate-800">
                        <p className="font-medium text-slate-800 dark:text-slate-200">
                          {log.old_status ? getStatusLabel(log.old_status) : '—'} → {getStatusLabel(log.new_status)}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {new Date(log.changed_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                          {log.changed_by ? ` • ${log.changed_by.name}` : ''}
                        </p>
                        {log.reason && <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">Motivo: {log.reason}</p>}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-8">Sem histórico registrado.</p>
                )}
              </TabsContent>
              
              {detail.patient && isDoctor && (
                <TabsContent value="patient-history" className="mt-0 space-y-3">
                  <div className="flex justify-end">
                    <Button variant="secondary" size="sm" onClick={() => loadPatientHistory(detail.patient!.id)} disabled={patientHistoryLoading}>
                      {patientHistoryLoading ? 'Carregando...' : 'Atualizar histórico'}
                    </Button>
                  </div>
                  {patientHistory === null ? (
                    <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-8">Clique em “Atualizar histórico” para carregar todas as observações do paciente.
                    </p>
                  ) : patientHistory.length === 0 ? (
                    <EmptyState className="border-none bg-transparent p-0">
                      Nenhuma observação registrada para este paciente.
                    </EmptyState>
                  ) : (
                    <ul className="space-y-3 max-h-64 overflow-y-auto text-sm">
                      {patientHistory.map((obs) => (
                        <li key={obs.id} className="rounded-lg border border-slate-200 dark:border-slate-700 p-3 bg-white dark:bg-slate-800">
                          <p className="font-medium text-slate-800">
                            {new Date(obs.created_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">Responsável: {obs.doctor?.name ?? '---'}</p>
                          <p className="mt-2 text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Anamnese</p>
                          <p className="text-sm text-slate-700 dark:text-slate-300">{obs.anamnesis}</p>
                          {obs.diagnosis && (
                            <>
                              <p className="mt-2 text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Diagnóstico</p>
                              <p className="text-sm text-slate-700 dark:text-slate-300">{obs.diagnosis}</p>
                            </>
                          )}
                          {obs.prescription && (
                            <>
                              <p className="mt-2 text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Prescrição</p>
                              <p className="text-sm text-slate-700 dark:text-slate-300">{obs.prescription}</p>
                            </>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </TabsContent>
              )}
            </div>
          </Tabs>
        )}
      </Modal>
    </div>
  );
}

// Componente para criar paciente rapidamente
function CreatePatientModal({ 
  isOpen, 
  onClose, 
  onSuccess 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onSuccess: (patient: Patient) => void;
}) {
  const [loading, setLoading] = useState(false);
  const createPatientSchema = z.object({
    name: z.string().min(3, 'Nome completo é obrigatório'),
    email: z.string().email('E-mail inválido'),
    phone: z.string().min(10, 'Telefone é obrigatório'),
    cpf: z.string().min(11, 'CPF é obrigatório'),
    birth_date: z.string().min(1, 'Data de nascimento é obrigatória'),
    gender: z.enum(['M', 'F', 'OTHER'], { message: 'Selecione o sexo' }).optional(),
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<z.infer<typeof createPatientSchema>>({
    resolver: zodResolver(createPatientSchema),
  });

  const onSubmit = async (values: z.infer<typeof createPatientSchema>) => {
    setLoading(true);
    try {
      // Gera senha aleatória temporária
      const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
      
      const newPatient = await createPatient({
        name: values.name,
        email: values.email,
        phone: values.phone,
        cpf: values.cpf.replace(/\D/g, ''),
        birth_date: values.birth_date,
        gender: values.gender,
        password: tempPassword,
      });

      toast.success('Paciente criado com sucesso!');
      reset();
      onSuccess(newPatient);
    } catch (error) {
      handleApiError(error, 'Não foi possível criar o paciente');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Cadastrar Novo Paciente"
      size="lg"
    >
      <div className="space-y-4">
        <p className="text-sm text-slate-600">
          Preencha os dados básicos do paciente. Uma senha temporária será gerada automaticamente.
        </p>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="create_patient_name">Nome Completo *</Label>
            <Input 
              id="create_patient_name" 
              placeholder="João da Silva" 
              {...register('name')} 
            />
            {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="create_patient_email">E-mail *</Label>
            <Input 
              id="create_patient_email" 
              type="email" 
              placeholder="paciente@email.com" 
              {...register('email')} 
            />
            {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="create_patient_phone">Telefone *</Label>
            <Input 
              id="create_patient_phone" 
              placeholder="(11) 98765-4321" 
              {...register('phone')} 
            />
            {errors.phone && <p className="text-xs text-red-500">{errors.phone.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="create_patient_cpf">CPF *</Label>
            <Input 
              id="create_patient_cpf" 
              placeholder="000.000.000-00" 
              {...register('cpf')} 
            />
            {errors.cpf && <p className="text-xs text-red-500">{errors.cpf.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="create_patient_birth_date">Data de Nascimento *</Label>
            <Input 
              id="create_patient_birth_date" 
              type="date" 
              {...register('birth_date')} 
            />
            {errors.birth_date && <p className="text-xs text-red-500">{errors.birth_date.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="create_patient_gender">Sexo *</Label>
            <select
              id="create_patient_gender"
              className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              {...register('gender')}
            >
              <option value="">Selecione</option>
              <option value="M">Masculino</option>
              <option value="F">Feminino</option>
              <option value="OTHER">Outro</option>
            </select>
            {errors.gender && <p className="text-xs text-red-500">{errors.gender.message}</p>}
          </div>

          <div className="md:col-span-2 flex items-center justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Criando...' : 'Cadastrar Paciente'}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}

// Componente de Calendário para Seleção de Dias Disponíveis
function AppointmentCalendar({
  availableDates,
  loadingDates,
  currentMonth,
  onMonthChange,
  onDateSelect,
  selectedDate,
  doctorHasNoSchedules = false,
}: {
  availableDates: string[];
  loadingDates: boolean;
  currentMonth: string;
  onMonthChange: (month: string) => void;
  onDateSelect: (date: string) => void;
  selectedDate: string;
  doctorHasNoSchedules?: boolean;
}) {
  // Parse o mês diretamente para evitar problemas de timezone
  const [yearStr, monthStr] = currentMonth.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10) - 1; // JavaScript usa 0-11 para meses
  
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay(); // 0 = Domingo, 1 = Segunda, etc.
  
  // Helper para formatar data local como YYYY-MM-DD
  const formatDateLocal = (date: Date): string => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };
  
  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  
  const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  
  const handlePrevMonth = () => {
    let prevYear = year;
    let prevMonthValue = month - 1;
    
    if (prevMonthValue < 0) {
      prevMonthValue = 11;
      prevYear -= 1;
    }
    
    const monthStrNew = `${prevYear}-${String(prevMonthValue + 1).padStart(2, '0')}`;
    onMonthChange(monthStrNew);
  };
  
  const handleNextMonth = () => {
    let nextYear = year;
    let nextMonthValue = month + 1;
    
    if (nextMonthValue > 11) {
      nextMonthValue = 0;
      nextYear += 1;
    }
    
    const monthStr = `${nextYear}-${String(nextMonthValue + 1).padStart(2, '0')}`;
    onMonthChange(monthStr);
  };
  
  const isDateAvailable = (date: Date): boolean => {
    const dateStr = formatDateLocal(date);
    return availableDates.includes(dateStr);
  };
  
  const isDateSelected = (date: Date): boolean => {
    const dateStr = formatDateLocal(date);
    return selectedDate === dateStr;
  };
  
  const isDatePast = (date: Date): boolean => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return date < tomorrow;
  };
  
  const handleDateClick = (date: Date) => {
    if (isDatePast(date) || !isDateAvailable(date)) return;
    const dateStr = formatDateLocal(date);
    onDateSelect(dateStr);
  };
  
  const renderDays = () => {
    const days = [];
    
    // Dias vazios antes do primeiro dia do mês
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(
        <div key={`empty-${i}`} className="h-10"></div>
      );
    }
    
    // Dias do mês
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateStr = formatDateLocal(date);
      const available = isDateAvailable(date);
      const selected = isDateSelected(date);
      const past = isDatePast(date);
      
      days.push(
        <button
          key={day}
          type="button"
          onClick={() => handleDateClick(date)}
          disabled={past || !available}
          className={`
            h-10 w-10 rounded-md text-sm font-medium transition-colors
            ${selected
              ? 'bg-blue-500 text-white'
              : available && !past
              ? 'bg-white text-slate-700 hover:bg-blue-50 hover:border-blue-500 border border-slate-200'
              : past
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
              : 'bg-slate-50 text-slate-400 cursor-not-allowed'
            }
          `}
          title={past ? 'Data no passado' : !available ? 'Sem agenda disponível' : 'Clique para selecionar'}
        >
          {day}
        </button>
      );
    }
    
    return days;
  };
  
  return (
    <div className="border border-slate-200 rounded-lg p-4 bg-white">
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={handlePrevMonth}
          className="p-1 hover:bg-slate-100 rounded-md transition-colors"
        >
          <ChevronLeft className="h-5 w-5 text-slate-600" />
        </button>
        <h3 className="text-lg font-semibold text-slate-900">
          {monthNames[month]} {year}
        </h3>
        <button
          type="button"
          onClick={handleNextMonth}
          className="p-1 hover:bg-slate-100 rounded-md transition-colors"
        >
          <ChevronRight className="h-5 w-5 text-slate-600" />
        </button>
      </div>
      
      {loadingDates ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
          <span className="ml-2 text-sm text-slate-600">Carregando dias disponíveis...</span>
        </div>
      ) : doctorHasNoSchedules ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <p className="text-sm text-slate-600 mb-2">
            Este médico não possui agenda configurada.
          </p>
          <p className="text-xs text-slate-500">
            Configure os horários de atendimento na área do médico primeiro.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-7 gap-2 mb-2">
            {dayNames.map((day) => (
              <div key={day} className="text-center text-xs font-medium text-slate-500">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-2">
            {renderDays()}
          </div>
          <div className="mt-4 flex items-center gap-4 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-md bg-blue-500"></div>
              <span>Selecionado</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-md bg-white border border-slate-200"></div>
              <span>Disponível</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-md bg-slate-50"></div>
              <span>Indisponível</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// Componente Avatar do Médico para o Wizard
function DoctorAvatarWizard({ name }: { name: string }) {
  const getColorFromName = (name: string) => {
    const colors = [
      'from-blue-500 to-blue-600',
      'from-teal-500 to-teal-600',
      'from-indigo-500 to-indigo-600',
      'from-cyan-500 to-cyan-600',
      'from-emerald-500 to-emerald-600',
      'from-violet-500 to-violet-600',
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const gradientColor = getColorFromName(name);
  const initials = name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div className={`relative h-full w-full bg-gradient-to-br ${gradientColor} flex items-center justify-center overflow-hidden`}>
      <svg
        viewBox="0 0 100 100"
        className="absolute inset-0 h-full w-full opacity-20"
        fill="currentColor"
      >
        <circle cx="50" cy="30" r="18" className="text-white" />
        <ellipse cx="50" cy="85" rx="35" ry="30" className="text-white" />
        <path
          d="M30 70 L50 55 L70 70 L70 100 L30 100 Z"
          className="text-white opacity-40"
        />
      </svg>
      <span className="relative z-10 text-2xl font-bold text-white drop-shadow-lg">
        {initials}
      </span>
      <div className="absolute bottom-2 right-2 rounded-full bg-white/20 p-1 backdrop-blur-sm">
        <Stethoscope className="h-3 w-3 text-white" />
      </div>
    </div>
  );
}

// Badge de especialidade
function SpecialtyBadgeWizard({ specialty }: { specialty: string }) {
  const getSpecialtyColor = (spec: string) => {
    const lowerSpec = spec.toLowerCase();
    if (lowerSpec.includes('cardio')) return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
    if (lowerSpec.includes('neuro')) return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
    if (lowerSpec.includes('pediatr')) return 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400';
    if (lowerSpec.includes('dermato')) return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
    if (lowerSpec.includes('orto')) return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
    if (lowerSpec.includes('gineco') || lowerSpec.includes('obstet')) return 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400';
    if (lowerSpec.includes('psiq') || lowerSpec.includes('psico')) return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400';
    if (lowerSpec.includes('oftalmo')) return 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400';
    if (lowerSpec.includes('clínico') || lowerSpec.includes('geral')) return 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400';
    return 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300';
  };

  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${getSpecialtyColor(specialty)}`}>
      <Briefcase className="h-3 w-3" />
      {specialty}
    </span>
  );
}

// Componente Wizard de Agendamento para Pacientes
function PatientAppointmentWizard({
  doctors,
  loading,
  onCreateAppointment,
  schedulingStatus,
}: {
  doctors: Doctor[];
  loading: boolean;
  onCreateAppointment: (values: PatientForm) => Promise<void>;
  schedulingStatus: SchedulingStatus | null;
}) {
  // Estados do wizard
  const [step, setStep] = useState<'doctor' | 'schedule' | 'confirm'>('doctor');
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [appointmentType, setAppointmentType] = useState<'PRESENTIAL' | 'ONLINE'>('PRESENTIAL');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  // Estados do calendário - usando data local para evitar problemas de timezone
  const [currentMonth, setCurrentMonth] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [loadingDates, setLoadingDates] = useState(false);
  const [doctorHasNoSchedules, setDoctorHasNoSchedules] = useState(false);
  
  // Estados dos slots - agora com info de disponibilidade
  const [allSlots, setAllSlots] = useState<SlotInfo[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Filtra médicos pela busca
  const filteredDoctors = useMemo(() => {
    if (!searchQuery) return doctors;
    const query = searchQuery.toLowerCase();
    return doctors.filter(
      (doctor) =>
        doctor.name.toLowerCase().includes(query) ||
        doctor.specialty?.toLowerCase().includes(query) ||
        doctor.crm?.toLowerCase().includes(query)
    );
  }, [doctors, searchQuery]);

  // Carrega dias disponíveis quando seleciona médico
  const loadAvailableDates = async (doctorId: number, month: string) => {
    setLoadingDates(true);
    try {
      const response = await fetchAvailableDates(doctorId, month);
      setAvailableDates(response.available_dates || []);
      setDoctorHasNoSchedules(response.has_schedules === false);
    } catch (error) {
      console.error('Erro ao carregar dias disponíveis:', error);
      setAvailableDates([]);
      setDoctorHasNoSchedules(false);
    } finally {
      setLoadingDates(false);
    }
  };

  // Carrega slots quando seleciona uma data
  const loadAvailableSlots = async (doctorId: number, date: string) => {
    setLoadingSlots(true);
    try {
      const response = await fetchAvailableSlots(doctorId, date, 30);
      setAllSlots(response.all_slots || []);
    } catch (error) {
      console.error('Erro ao carregar horários:', error);
      setAllSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  // Ao selecionar um médico
  const handleSelectDoctor = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setSelectedDate('');
    setSelectedSlot('');
    setStep('schedule');
    loadAvailableDates(doctor.id, currentMonth);
  };

  // Ao mudar o mês do calendário
  const handleMonthChange = (month: string) => {
    setCurrentMonth(month);
    if (selectedDoctor) {
      loadAvailableDates(selectedDoctor.id, month);
    }
  };

  // Ao selecionar uma data
  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    setSelectedSlot('');
    if (selectedDoctor) {
      loadAvailableSlots(selectedDoctor.id, date);
    }
  };

  // Ao selecionar um horário
  const handleSlotSelect = (slot: string) => {
    setSelectedSlot(slot);
  };

  // Voltar para seleção de médico
  const handleBackToDoctor = () => {
    setStep('doctor');
    setSelectedDoctor(null);
    setSelectedDate('');
    setSelectedSlot('');
    setAvailableDates([]);
    setAllSlots([]);
  };

  // Ir para confirmação
  const handleProceedToConfirm = () => {
    if (selectedDoctor && selectedSlot) {
      setStep('confirm');
    }
  };

  // Finalizar agendamento
  const handleConfirmAppointment = async () => {
    if (!selectedDoctor || !selectedSlot) return;
    
    setSubmitting(true);
    try {
      await onCreateAppointment({
        doctor_id: selectedDoctor.id,
        scheduled_at: selectedSlot,
        duration_minutes: 30,
        type: appointmentType,
        notes: notes || undefined,
      });
      
      // Reset wizard
      setStep('doctor');
      setSelectedDoctor(null);
      setSelectedDate('');
      setSelectedSlot('');
      setAppointmentType('PRESENTIAL');
      setNotes('');
    } catch (error) {
      // erro tratado no pai
    } finally {
      setSubmitting(false);
    }
  };

  // Renderiza o calendário
  const renderCalendar = () => {
    // Parse o mês diretamente para evitar problemas de timezone
    const [yearStr, monthStr] = currentMonth.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10) - 1; // JavaScript usa 0-11 para meses
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const monthNames = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    
    const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    
    const handlePrevMonth = () => {
      let prevYear = year;
      let prevMonthValue = month - 1;
      
      if (prevMonthValue < 0) {
        prevMonthValue = 11;
        prevYear -= 1;
      }
      
      const monthStr = `${prevYear}-${String(prevMonthValue + 1).padStart(2, '0')}`;
      handleMonthChange(monthStr);
    };
    
    const handleNextMonth = () => {
      let nextYear = year;
      let nextMonthValue = month + 1;
      
      if (nextMonthValue > 11) {
        nextMonthValue = 0;
        nextYear += 1;
      }
      
      const monthStr = `${nextYear}-${String(nextMonthValue + 1).padStart(2, '0')}`;
      handleMonthChange(monthStr);
    };
    // Helper para formatar data local como YYYY-MM-DD
    const formatDateLocal = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    
    const isDateAvailable = (date: Date): boolean => {
      const dateStr = formatDateLocal(date);
      return availableDates.includes(dateStr);
    };
    
    const isDateSelected = (date: Date): boolean => {
      const dateStr = formatDateLocal(date);
      return selectedDate === dateStr;
    };
    
    const isDatePast = (date: Date): boolean => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return date < today;
    };
    
    const days = [];
    
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(<div key={`empty-${i}`} className="h-12"></div>);
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateStr = formatDateLocal(date);
      const available = isDateAvailable(date);
      const selected = isDateSelected(date);
      const past = isDatePast(date);
      
      days.push(
        <button
          key={day}
          type="button"
          onClick={() => !past && available && handleDateSelect(dateStr)}
          disabled={past || !available}
          className={`
            h-12 w-full rounded-lg text-sm font-medium transition-all duration-200
            ${selected
              ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30 scale-105'
              : available && !past
              ? 'bg-white text-slate-700 hover:bg-blue-50 hover:border-blue-400 border-2 border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-600 dark:hover:bg-slate-700'
              : past
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed dark:bg-slate-800/50 dark:text-slate-600'
              : 'bg-slate-50 text-slate-400 cursor-not-allowed dark:bg-slate-800/30 dark:text-slate-600'
            }
          `}
        >
          {day}
        </button>
      );
    }

    return (
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
        {/* Header do calendário */}
        <div className="flex items-center justify-between mb-6">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <ChevronLeft className="h-5 w-5 text-slate-600 dark:text-slate-400" />
          </button>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            {monthNames[month]} {year}
          </h3>
          <button
            type="button"
            onClick={handleNextMonth}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <ChevronRight className="h-5 w-5 text-slate-600 dark:text-slate-400" />
          </button>
        </div>
        
        {loadingDates ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            <span className="ml-3 text-slate-600 dark:text-slate-400">Carregando disponibilidade...</span>
          </div>
        ) : doctorHasNoSchedules ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Calendar className="h-12 w-12 text-slate-300 dark:text-slate-600 mb-4" />
            <p className="text-slate-600 dark:text-slate-400 mb-2">
              Este médico ainda não possui agenda configurada.
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-500">
              Por favor, tente outro profissional.
            </p>
          </div>
        ) : (
          <>
            {/* Dias da semana */}
            <div className="grid grid-cols-7 gap-2 mb-3">
              {dayNames.map((day) => (
                <div key={day} className="text-center text-xs font-semibold text-slate-500 dark:text-slate-400 py-2">
                  {day}
                </div>
              ))}
            </div>
            
            {/* Grid de dias */}
            <div className="grid grid-cols-7 gap-2">
              {days}
            </div>
            
            {/* Legenda */}
            <div className="mt-6 flex items-center justify-center gap-6 text-xs text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-blue-500"></div>
                <span>Selecionado</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-white border-2 border-slate-200 dark:bg-slate-800 dark:border-slate-600"></div>
                <span>Disponível</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-slate-100 dark:bg-slate-800/30"></div>
                <span>Indisponível</span>
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

  // Renderiza os slots de horário
  const renderTimeSlots = () => {
    if (!selectedDate) return null;

    const formatTime = (isoString: string) => {
      // Extrair hora diretamente da string sem converter para Date (evita problemas de timezone)
      // O formato esperado é "YYYY-MM-DD HH:MM:SS" ou "YYYY-MM-DDTHH:MM:SS"
      const timePart = isoString.includes('T') 
        ? isoString.split('T')[1] 
        : isoString.split(' ')[1];
      if (timePart) {
        return timePart.substring(0, 5); // Retorna HH:MM
      }
      // Fallback: se for apenas hora "HH:MM:SS" ou "HH:MM"
      if (isoString.match(/^\d{2}:\d{2}/)) {
        return isoString.substring(0, 5);
      }
      return isoString;
    };

    return (
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <Clock className="h-5 w-5 text-blue-500" />
          Horários do dia
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
          {new Date(selectedDate + 'T00:00:00').toLocaleDateString('pt-BR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
          })}
        </p>
        
        {loadingSlots ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
            <span className="ml-2 text-slate-600 dark:text-slate-400">Carregando horários...</span>
          </div>
        ) : allSlots.length > 0 ? (
          <>
            {/* Legenda */}
            <div className="flex items-center gap-4 mb-4 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span className="text-slate-600 dark:text-slate-400">Disponível</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-slate-300 dark:bg-slate-600"></div>
                <span className="text-slate-600 dark:text-slate-400">Reservado</span>
              </div>
            </div>
            
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {allSlots.map((slotInfo) => {
                const isSelected = selectedSlot === slotInfo.time;
                const isAvailable = slotInfo.available;
                
                return (
                  <button
                    key={slotInfo.time}
                    type="button"
                    onClick={() => isAvailable && handleSlotSelect(slotInfo.time)}
                    disabled={!isAvailable}
                    className={`
                      py-3 px-4 rounded-xl text-sm font-medium transition-all duration-200
                      ${!isAvailable
                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed dark:bg-slate-700 dark:text-slate-500 opacity-60'
                        : isSelected
                          ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30 scale-105'
                          : 'bg-slate-100 text-slate-700 hover:bg-blue-100 hover:text-blue-700 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600'
                      }
                    `}
                  >
                    <Clock className={`h-4 w-4 inline mr-1.5 ${!isAvailable ? 'opacity-50' : ''}`} />
                    {formatTime(slotInfo.time)}
                    {!isAvailable && (
                      <span className="block text-xs mt-0.5 opacity-75">Reservado</span>
                    )}
                  </button>
                );
              })}
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <Clock className="h-10 w-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <p className="text-slate-500 dark:text-slate-400">Nenhum horário disponível nesta data.</p>
            <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Tente selecionar outro dia.</p>
          </div>
        )}
      </div>
    );
  };

  // Loading
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 p-6">
          <Skeleton className="h-8 w-64 bg-white/20" />
          <Skeleton className="h-4 w-48 mt-2 bg-white/20" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-48 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  // Step 1: Seleção do médico
  if (step === 'doctor') {
    // Se está bloqueado por faltas, mostra aviso específico
    if (schedulingStatus && schedulingStatus.is_blocked) {
      return (
        <div className="space-y-6">
          {/* Header */}
          <div className="rounded-2xl bg-gradient-to-r from-red-500 to-rose-500 p-6 text-white shadow-lg dark:from-red-700 dark:to-rose-700">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-white/20 p-3 backdrop-blur-sm">
                <XCircle className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Agendamento Bloqueado</h1>
                <p className="text-red-100 dark:text-red-200">Seu acesso ao agendamento está temporariamente suspenso</p>
              </div>
            </div>
          </div>
          
          {/* Mensagem de bloqueio */}
          <div className="rounded-xl border-2 border-red-300 bg-red-50 shadow-sm dark:border-red-700 dark:bg-slate-900">
            <div className="p-6 text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/60 flex items-center justify-center mb-4">
                <XCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                Você possui {schedulingStatus.consecutive_no_shows} faltas consecutivas
              </h2>
              <p className="text-slate-600 dark:text-slate-300 mb-4">
                {schedulingStatus.blocked_reason || 'Seu acesso ao agendamento foi bloqueado devido a faltas consecutivas.'}
                <br />
                Entre em contato com a recepção para regularizar sua situação.
              </p>
              <div className="flex items-center justify-center gap-2 text-sm text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/50 rounded-lg p-3">
                <AlertTriangle className="h-4 w-4" />
                <span>Faltas prejudicam outros pacientes que precisam de atendimento</span>
              </div>
            </div>
          </div>
        </div>
      );
    }
    
    // Se atingiu o limite de consultas, mostra aviso
    if (schedulingStatus && !schedulingStatus.can_schedule) {
      return (
        <div className="space-y-6">
          {/* Header */}
          <div className="rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 p-6 text-white shadow-lg dark:from-amber-600 dark:to-orange-600">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-white/20 p-3 backdrop-blur-sm">
                <Calendar className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Limite de Consultas Atingido</h1>
                <p className="text-amber-100 dark:text-amber-200">Você possui o máximo de consultas futuras permitidas</p>
              </div>
            </div>
          </div>
          
          {/* Mensagem de limite */}
          <div className="rounded-xl border-2 border-amber-300 bg-amber-50 shadow-sm dark:border-amber-700 dark:bg-slate-900">
            <div className="p-6 text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/60 flex items-center justify-center mb-4">
                <Calendar className="h-8 w-8 text-amber-600 dark:text-amber-400" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                Você já possui {schedulingStatus.current_future_appointments} consultas agendadas
              </h2>
              <p className="text-slate-600 dark:text-slate-300 mb-4">
                O limite máximo é de {schedulingStatus.max_allowed} consultas futuras por vez.
                <br />
                Aguarde uma consulta ser realizada ou cancele uma existente para agendar uma nova.
              </p>
              <div className="flex items-center justify-center gap-2 text-sm text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/50 rounded-lg p-3">
                <Shield className="h-4 w-4" />
                <span>Esta regra ajuda a garantir disponibilidade para todos os pacientes</span>
              </div>
            </div>
          </div>
        </div>
      );
    }
    
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white shadow-lg dark:from-blue-700 dark:to-indigo-700">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-white/20 p-3 backdrop-blur-sm">
              <Stethoscope className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Agendar Consulta</h1>
              <p className="text-blue-100">Escolha um médico para ver a disponibilidade</p>
            </div>
          </div>
          
          {/* Info de slots restantes */}
          {schedulingStatus && schedulingStatus.remaining_slots > 0 && (
            <div className="mt-4 flex items-center gap-2 text-sm bg-white/10 rounded-lg px-3 py-2 backdrop-blur-sm">
              <Calendar className="h-4 w-4" />
              <span>
                Você pode agendar mais {schedulingStatus.remaining_slots} 
                {schedulingStatus.remaining_slots === 1 ? ' consulta' : ' consultas'}
              </span>
            </div>
          )}
          
          {/* Barra de busca */}
          <div className="relative mt-6">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nome, especialidade ou CRM..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-12 border-0 bg-white pl-12 pr-4 rounded-xl text-slate-900 shadow-lg placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-white/50 dark:bg-slate-800 dark:text-white"
            />
          </div>
        </div>

        {/* Steps indicator */}
        <div className="flex items-center justify-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-bold">1</div>
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Escolher Médico</span>
          </div>
          <div className="w-8 h-px bg-slate-300 dark:bg-slate-600"></div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center text-sm font-bold dark:bg-slate-700 dark:text-slate-400">2</div>
            <span className="text-sm text-slate-400 dark:text-slate-500">Data e Hora</span>
          </div>
          <div className="w-8 h-px bg-slate-300 dark:bg-slate-600"></div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center text-sm font-bold dark:bg-slate-700 dark:text-slate-400">3</div>
            <span className="text-sm text-slate-400 dark:text-slate-500">Confirmar</span>
          </div>
        </div>

        {/* Contagem */}
        <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2">
          <User className="h-4 w-4" />
          {filteredDoctors.length} {filteredDoctors.length === 1 ? 'médico encontrado' : 'médicos encontrados'}
        </p>

        {/* Grid de médicos */}
        {filteredDoctors.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 p-12 text-center">
            <Search className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
            <p className="text-slate-500 dark:text-slate-400">Nenhum médico encontrado.</p>
            <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Tente outra busca.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredDoctors.map((doctor) => (
              <button
                key={doctor.id}
                onClick={() => handleSelectDoctor(doctor)}
                className="group text-left overflow-hidden rounded-2xl border-2 border-slate-200 bg-white shadow-sm transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/10 hover:-translate-y-1 hover:border-blue-400 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-blue-500"
              >
                {/* Área da foto */}
                <div className="relative h-32 w-full overflow-hidden">
                  <DoctorAvatarWizard name={doctor.name} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h3 className="text-lg font-bold text-white drop-shadow-lg">{doctor.name}</h3>
                    <div className="flex items-center gap-1.5 text-white/90">
                      <Award className="h-3.5 w-3.5" />
                      <span className="text-sm">CRM {doctor.crm}</span>
                    </div>
                  </div>
                </div>

                {/* Conteúdo */}
                <div className="p-4 space-y-3">
                  <SpecialtyBadgeWizard specialty={doctor.specialty} />
                  
                  {/* Rating visual */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star 
                          key={star} 
                          className={`h-4 w-4 ${star <= 4 ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-slate-600'}`} 
                        />
                      ))}
                    </div>
                    <span className="text-sm text-slate-500 dark:text-slate-400">4.0</span>
                  </div>

                  {/* Convênios */}
                  {doctor.health_insurances && doctor.health_insurances.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {doctor.health_insurances.slice(0, 2).map((plan) => (
                        <span 
                          key={plan.id}
                          className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                        >
                          <Shield className="h-3 w-3" />
                          {plan.name}
                        </span>
                      ))}
                      {doctor.health_insurances.length > 2 && (
                        <span className="text-xs text-blue-500 dark:text-blue-400">
                          +{doctor.health_insurances.length - 2}
                        </span>
                      )}
                    </div>
                  )}

                  {/* CTA */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700">
                    <span className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      Disponível
                    </span>
                    <span className="text-sm font-medium text-blue-500 group-hover:text-blue-600 dark:text-blue-400 flex items-center gap-1">
                      Ver agenda
                      <ChevronRight className="h-4 w-4" />
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Step 2: Seleção de data e hora
  if (step === 'schedule') {
    return (
      <div className="space-y-6">
        {/* Header com médico selecionado */}
        <div className="rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white shadow-lg dark:from-blue-700 dark:to-indigo-700">
          <button
            onClick={handleBackToDoctor}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/20 hover:bg-white/30 text-white mb-4 transition-all duration-200 font-medium"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Trocar médico</span>
          </button>
          
          {selectedDoctor && (
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl overflow-hidden border-2 border-white/30">
                <DoctorAvatarWizard name={selectedDoctor.name} />
              </div>
              <div>
                <h2 className="text-xl font-bold">{selectedDoctor.name}</h2>
                <p className="text-blue-100">{selectedDoctor.specialty} • CRM {selectedDoctor.crm}</p>
              </div>
            </div>
          )}
        </div>

        {/* Steps indicator */}
        <div className="flex items-center justify-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center">
              <Check className="h-4 w-4" />
            </div>
            <span className="text-sm text-slate-500 dark:text-slate-400">Médico</span>
          </div>
          <div className="w-8 h-px bg-green-500"></div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-bold">2</div>
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Data e Hora</span>
          </div>
          <div className="w-8 h-px bg-slate-300 dark:bg-slate-600"></div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center text-sm font-bold dark:bg-slate-700 dark:text-slate-400">3</div>
            <span className="text-sm text-slate-400 dark:text-slate-500">Confirmar</span>
          </div>
        </div>

        {/* Calendário e Slots */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Calendário */}
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-500" />
              Selecione uma data
            </h3>
            {renderCalendar()}
          </div>
          
          {/* Horários */}
          <div>
            {selectedDate ? (
              renderTimeSlots()
            ) : (
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 p-12 text-center h-full flex flex-col items-center justify-center">
                <Clock className="h-12 w-12 text-slate-300 dark:text-slate-600 mb-4" />
                <p className="text-slate-500 dark:text-slate-400">Selecione uma data</p>
                <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">para ver os horários disponíveis</p>
              </div>
            )}
          </div>
        </div>

        {/* Botão de continuar */}
        {selectedSlot && (
          <div className="flex justify-end">
            <Button
              onClick={handleProceedToConfirm}
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-8 py-3 rounded-xl shadow-lg shadow-blue-500/30"
            >
              Continuar
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        )}
      </div>
    );
  }

  // Step 3: Confirmação
  if (step === 'confirm') {
    // Extrair data e hora diretamente da string sem converter para Date
    let formattedDate = '';
    let formattedTime = '';
    
    if (selectedSlot) {
      const [datePart, timePart] = selectedSlot.includes('T') 
        ? selectedSlot.split('T') 
        : selectedSlot.split(' ');
      const [year, month, day] = datePart.split('-');
      formattedTime = timePart ? timePart.substring(0, 5) : '';
      
      // Criar data apenas para formatar dia da semana e mês (sem hora)
      const dateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      const weekday = dateObj.toLocaleDateString('pt-BR', { weekday: 'long' });
      const monthName = dateObj.toLocaleDateString('pt-BR', { month: 'long' });
      formattedDate = `${weekday}, ${day} de ${monthName} de ${year}`;
    }

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="rounded-2xl bg-gradient-to-r from-green-600 to-emerald-600 p-6 text-white shadow-lg dark:from-green-700 dark:to-emerald-700">
          <button
            onClick={() => setStep('schedule')}
            className="flex items-center gap-2 text-green-100 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm">Voltar</span>
          </button>
          
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-white/20 p-3 backdrop-blur-sm">
              <Check className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Confirmar Agendamento</h1>
              <p className="text-green-100">Revise os dados antes de confirmar</p>
            </div>
          </div>
        </div>

        {/* Steps indicator */}
        <div className="flex items-center justify-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center">
              <Check className="h-4 w-4" />
            </div>
            <span className="text-sm text-slate-500 dark:text-slate-400">Médico</span>
          </div>
          <div className="w-8 h-px bg-green-500"></div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center">
              <Check className="h-4 w-4" />
            </div>
            <span className="text-sm text-slate-500 dark:text-slate-400">Data e Hora</span>
          </div>
          <div className="w-8 h-px bg-green-500"></div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-bold">3</div>
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Confirmar</span>
          </div>
        </div>

        {/* Resumo */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm space-y-6">
          {/* Médico */}
          {selectedDoctor && (
            <div className="flex items-center gap-4 pb-6 border-b border-slate-100 dark:border-slate-700">
              <div className="w-20 h-20 rounded-xl overflow-hidden">
                <DoctorAvatarWizard name={selectedDoctor.name} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{selectedDoctor.name}</h3>
                <p className="text-slate-500 dark:text-slate-400">{selectedDoctor.specialty}</p>
                <p className="text-sm text-slate-400 dark:text-slate-500">CRM {selectedDoctor.crm}</p>
              </div>
            </div>
          )}

          {/* Data e hora */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4">
              <p className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 mb-1">Data</p>
              <p className="text-lg font-medium text-slate-900 dark:text-white capitalize">{formattedDate}</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4">
              <p className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 mb-1">Horário</p>
              <p className="text-lg font-medium text-slate-900 dark:text-white">{formattedTime}</p>
            </div>
          </div>

          {/* Tipo de consulta */}
          <div>
            <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 block">
              Tipo de Consulta
            </Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setAppointmentType('PRESENTIAL')}
                className={`flex items-center justify-center gap-3 p-4 rounded-xl border-2 transition-all ${
                  appointmentType === 'PRESENTIAL'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600'
                }`}
              >
                <MapPin className={`h-5 w-5 ${appointmentType === 'PRESENTIAL' ? 'text-blue-500' : 'text-slate-400'}`} />
                <span className={`font-medium ${appointmentType === 'PRESENTIAL' ? 'text-blue-700 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400'}`}>
                  Presencial
                </span>
              </button>
              <button
                type="button"
                onClick={() => setAppointmentType('ONLINE')}
                className={`flex items-center justify-center gap-3 p-4 rounded-xl border-2 transition-all ${
                  appointmentType === 'ONLINE'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600'
                }`}
              >
                <Video className={`h-5 w-5 ${appointmentType === 'ONLINE' ? 'text-blue-500' : 'text-slate-400'}`} />
                <span className={`font-medium ${appointmentType === 'ONLINE' ? 'text-blue-700 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400'}`}>
                  Online
                </span>
              </button>
            </div>
          </div>

          {/* Observações */}
          <div>
            <Label htmlFor="notes" className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 block">
              Observações (opcional)
            </Label>
            <Textarea
              id="notes"
              placeholder="Descreva brevemente o motivo da consulta ou informações relevantes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>
        </div>

        {/* Botões de ação */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => setStep('schedule')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <Button
            onClick={handleConfirmAppointment}
            disabled={submitting}
            className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-8 py-3 rounded-xl shadow-lg shadow-green-500/30"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Agendando...
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                Confirmar Agendamento
              </>
            )}
          </Button>
        </div>
      </div>
    );
  }

  return null;
}

// Componente de Calendário para Remarcação
function RescheduleCalendar({
  currentMonth,
  availableDates,
  selectedDate,
  loadingDates,
  onMonthChange,
  onDateSelect,
}: {
  currentMonth: string;
  availableDates: string[];
  selectedDate: string;
  loadingDates: boolean;
  onMonthChange: (month: string) => void;
  onDateSelect: (date: string) => void;
}) {
  const [yearStr, monthStr] = currentMonth.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10) - 1;

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  const handlePrevMonth = () => {
    let prevYear = year;
    let prevMonthValue = month - 1;
    if (prevMonthValue < 0) {
      prevMonthValue = 11;
      prevYear -= 1;
    }
    onMonthChange(`${prevYear}-${String(prevMonthValue + 1).padStart(2, '0')}`);
  };

  const handleNextMonth = () => {
    let nextYear = year;
    let nextMonthValue = month + 1;
    if (nextMonthValue > 11) {
      nextMonthValue = 0;
      nextYear += 1;
    }
    onMonthChange(`${nextYear}-${String(nextMonthValue + 1).padStart(2, '0')}`);
  };

  const formatDateLocal = (date: Date): string => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const isDateAvailable = (date: Date): boolean => {
    return availableDates.includes(formatDateLocal(date));
  };

  const isDateSelected = (date: Date): boolean => {
    return selectedDate === formatDateLocal(date);
  };

  const isDatePast = (date: Date): boolean => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return date < tomorrow;
  };

  const days = [];
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(<div key={`empty-${i}`} className="h-10"></div>);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const dateStr = formatDateLocal(date);
    const available = isDateAvailable(date);
    const selected = isDateSelected(date);
    const past = isDatePast(date);

    days.push(
      <button
        key={day}
        type="button"
        onClick={() => !past && available && onDateSelect(dateStr)}
        disabled={past || !available}
        className={`
          h-10 w-full rounded-lg text-sm font-medium transition-all
          ${selected
            ? 'bg-blue-500 text-white shadow-md'
            : available && !past
            ? 'bg-white text-slate-700 hover:bg-blue-50 border border-slate-200 dark:bg-slate-700 dark:text-slate-200 dark:border-slate-600 dark:hover:bg-slate-600'
            : 'bg-slate-100 text-slate-400 cursor-not-allowed dark:bg-slate-800 dark:text-slate-600'
          }
        `}
      >
        {day}
      </button>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={handlePrevMonth}
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
        >
          <ChevronLeft className="h-5 w-5 text-slate-600 dark:text-slate-400" />
        </button>
        <h3 className="text-base font-bold text-slate-900 dark:text-white">
          {monthNames[month]} {year}
        </h3>
        <button
          type="button"
          onClick={handleNextMonth}
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
        >
          <ChevronRight className="h-5 w-5 text-slate-600 dark:text-slate-400" />
        </button>
      </div>

      {loadingDates ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
          <span className="ml-2 text-sm text-slate-500 dark:text-slate-400">Carregando...</span>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-7 gap-1 mb-2">
            {dayNames.map((day) => (
              <div key={day} className="text-center text-xs font-medium text-slate-500 dark:text-slate-400 py-2">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {days}
          </div>
        </>
      )}
    </div>
  );
}




