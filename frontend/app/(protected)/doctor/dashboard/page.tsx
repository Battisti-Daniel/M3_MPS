'use client';

import { useCallback, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Lock, Plus, CheckCircle2, Clock, User, Ban, FileText, XCircle, UserX } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { fetchAppointments, completeAppointment, cancelAppointment, markNoShow } from '@/services/appointment-service';
import { createObservation } from '@/services/observation-service';
import { Appointment } from '@/types';
import { handleApiError } from '@/lib/handle-api-error';
import { getStatusColors } from '@/constants/colors';
import {
  formatDate,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameWeek,
} from '@/lib/date-utils';

export default function DoctorDashboardPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'daily' | 'weekly'>('daily');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  
  // Modal states
  const [showObservationModal, setShowObservationModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [observationForm, setObservationForm] = useState({
    anamnesis: '',
    diagnosis: '',
    prescription: '',
    notes: '',
  });

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const daysInMonth = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const loadAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const startDate = viewMode === 'daily' 
        ? formatDate(selectedDate, 'yyyy-MM-dd')
        : formatDate(startOfWeek(selectedDate), 'yyyy-MM-dd');
      
      const endDate = viewMode === 'daily'
        ? formatDate(selectedDate, 'yyyy-MM-dd')
        : formatDate(endOfWeek(selectedDate), 'yyyy-MM-dd');

      const response = await fetchAppointments({
        start_date: startDate,
        end_date: endDate,
        per_page: 100,
      });
      setAppointments(response.data ?? []);
    } catch (error) {
      handleApiError(error, 'Erro ao carregar consultas');
    } finally {
      setLoading(false);
    }
  }, [selectedDate, viewMode]);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  const getDayAppointments = (date: Date) => {
    return appointments.filter((apt) => {
      const aptDate = new Date(apt.scheduled_at);
      return isSameDay(aptDate, date);
    });
  };

  const getDayStats = (date: Date) => {
    const dayAppointments = getDayAppointments(date);
    return {
      total: dayAppointments.length,
      confirmed: dayAppointments.filter((a) => a.status === 'CONFIRMED').length,
      pending: dayAppointments.filter((a) => a.status === 'PENDING').length,
      completed: dayAppointments.filter((a) => a.status === 'COMPLETED').length,
      cancelled: dayAppointments.filter((a) => a.status === 'CANCELLED').length,
      noShow: dayAppointments.filter((a) => a.status === 'NO_SHOW').length,
    };
  };

  const todayStats = getDayStats(selectedDate);
  const selectedDayAppointments = getDayAppointments(selectedDate).sort((a, b) => 
    new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()
  );

  const getStatusColor = (status: string) => {
    const colors = getStatusColors(status);
    return `${colors.bg} ${colors.text} ${colors.border}`;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return <CheckCircle2 className="h-4 w-4" />;
      case 'PENDING':
        return <Clock className="h-4 w-4" />;
      case 'NO_SHOW':
        return <UserX className="h-4 w-4" />;
      case 'CANCELLED':
        return <XCircle className="h-4 w-4" />;
      case 'COMPLETED':
        return <CheckCircle2 className="h-4 w-4" />;
      default:
        return null;
    }
  };

  // Ações do médico
  const handleComplete = async (appointment: Appointment) => {
    setBusyId(appointment.id);
    try {
      await completeAppointment(appointment.id);
      toast.success('Consulta marcada como concluída');
      setSelectedAppointment(appointment);
      setShowObservationModal(true);
      loadAppointments();
    } catch (error) {
      handleApiError(error, 'Erro ao concluir consulta');
    } finally {
      setBusyId(null);
    }
  };

  const handleNoShow = async (appointment: Appointment) => {
    setBusyId(appointment.id);
    try {
      await markNoShow(appointment.id);
      toast.success('Paciente marcado como não compareceu');
      loadAppointments();
    } catch (error) {
      handleApiError(error, 'Erro ao marcar não comparecimento');
    } finally {
      setBusyId(null);
    }
  };

  const handleCancel = async () => {
    if (!selectedAppointment) return;
    setBusyId(selectedAppointment.id);
    try {
      await cancelAppointment(selectedAppointment.id);
      toast.success('Consulta cancelada');
      setShowCancelModal(false);
      setSelectedAppointment(null);
      loadAppointments();
    } catch (error) {
      handleApiError(error, 'Erro ao cancelar consulta');
    } finally {
      setBusyId(null);
    }
  };

  const handleSaveObservation = async () => {
    if (!selectedAppointment) return;
    if (!observationForm.anamnesis.trim()) {
      toast.error('Anamnese é obrigatória');
      return;
    }
    setBusyId(selectedAppointment.id);
    try {
      await createObservation(selectedAppointment.id, observationForm);
      toast.success('Observação registrada com sucesso');
      setShowObservationModal(false);
      setSelectedAppointment(null);
      setObservationForm({ anamnesis: '', diagnosis: '', prescription: '', notes: '' });
      loadAppointments();
    } catch (error) {
      handleApiError(error, 'Erro ao salvar observação');
    } finally {
      setBusyId(null);
    }
  };

  const openObservationModal = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setObservationForm({ anamnesis: '', diagnosis: '', prescription: '', notes: '' });
    setShowObservationModal(true);
  };

  const openCancelModal = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setShowCancelModal(true);
  };

  // Componente de Visualização Semanal
  function WeeklyView({ 
    selectedDate, 
    appointments, 
    getStatusColor, 
    getStatusIcon 
  }: { 
    selectedDate: Date; 
    appointments: Appointment[];
    getStatusColor: (status: string) => string;
    getStatusIcon: (status: string) => React.ReactElement | null;
  }) {
    const weekStart = startOfWeek(selectedDate);
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
    // Semana começa na segunda-feira (DEFAULT_WEEK_START = 1)
    const weekDayNames = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

    const getDayAppointments = (date: Date) => {
      return appointments.filter((apt) => {
        const aptDate = new Date(apt.scheduled_at);
        return isSameDay(aptDate, date);
      }).sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());
    };

    return (
      <div className="space-y-4">
        {/* Cabeçalho da semana */}
        <div className="grid grid-cols-7 gap-2 mb-4">
          {weekDayNames.map((dayName, idx) => {
            const day = weekDays[idx];
            const isToday = isSameDay(day, new Date());
            const dayAppointments = getDayAppointments(day);
            
            return (
              <div
                key={idx}
                className={`text-center p-2 rounded-lg ${
                  isToday ? 'bg-purple-100 dark:bg-purple-900/50 border-2 border-purple-500' : 'bg-slate-50 dark:bg-slate-800'
                }`}
              >
                <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">{dayName}</p>
                <p className={`text-lg font-bold ${isToday ? 'text-purple-900 dark:text-purple-200' : 'text-slate-900 dark:text-slate-100'}`}>
                  {formatDate(day, 'd')}
                </p>
                {dayAppointments.length > 0 && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {dayAppointments.length} {dayAppointments.length === 1 ? 'consulta' : 'consultas'}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {/* Consultas por dia */}
        <div className="space-y-4">
          {weekDays.map((day, dayIdx) => {
            const dayAppointments = getDayAppointments(day);
            if (dayAppointments.length === 0) return null;

            return (
              <div key={dayIdx} className="border-l-4 border-l-purple-500 pl-4">
                <h4 className="font-semibold text-slate-900 dark:text-white mb-2">
                  {formatDate(day, "EEEE, d 'de' MMMM")}
                </h4>
                <div className="space-y-2">
                  {dayAppointments.map((appointment) => (
                    <div
                      key={appointment.id}
                      className={`rounded-lg border-2 p-3 ${getStatusColor(appointment.status)}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            {getStatusIcon(appointment.status)}
                            <span className="font-semibold">
                              {formatDate(new Date(appointment.scheduled_at), 'HH:mm')}
                            </span>
                            <User className="h-4 w-4 ml-2" />
                            <span className="font-medium text-sm">
                              {appointment.patient?.name ?? '---'}
                            </span>
                          </div>
                          <p className="text-xs opacity-90">
                            {appointment.type === 'FIRST' ? 'Primeira Consulta' :
                             appointment.type === 'RETURN' ? 'Retorno' :
                             appointment.type === 'EXAM_REVIEW' ? 'Avaliação de Exames' :
                             appointment.type === 'URGENCY' ? 'Urgência' :
                             appointment.type === 'PRESENTIAL' ? 'Presencial' :
                             appointment.type === 'ONLINE' ? 'Online' : appointment.type}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {appointments.filter(apt => {
          const aptDate = new Date(apt.scheduled_at);
          return isSameWeek(aptDate, selectedDate);
        }).length === 0 && (
          <div className="text-center py-12 text-slate-500 dark:text-slate-400">
            Nenhuma consulta agendada para esta semana.
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Minha Agenda</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {formatDate(selectedDate, "EEEE, d 'de' MMMM 'de' yyyy")}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant={viewMode === 'daily' ? 'default' : 'outline'}
            onClick={() => setViewMode('daily')}
            className={viewMode === 'daily' ? 'bg-purple-600 text-white dark:bg-purple-700' : ''}
          >
            Diária
          </Button>
          <Button
            variant={viewMode === 'weekly' ? 'default' : 'outline'}
            onClick={() => setViewMode('weekly')}
            className={viewMode === 'weekly' ? 'bg-purple-600 text-white dark:bg-purple-700' : ''}
          >
            Semanal
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[400px_1fr]">
        {/* Sidebar - Calendário e Estatísticas */}
        <div className="space-y-6">
          {/* Calendário */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-900 dark:text-white">
                {formatDate(currentDate, 'MMMM yyyy')}
              </h3>
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  onClick={() => setCurrentDate(subMonths(currentDate, 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setCurrentDate(addMonths(currentDate, 1))}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Dias da semana */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom'].map((day) => (
                <div key={day} className="text-center text-xs font-medium text-slate-500 dark:text-slate-400 py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendário */}
            <div className="grid grid-cols-7 gap-1">
              {daysInMonth.map((day, idx) => {
                const isCurrentMonth = isSameMonth(day, currentDate);
                const isSelected = isSameDay(day, selectedDate);
                const isToday = isSameDay(day, new Date());
                const dayAppointments = getDayAppointments(day);

                return (
                  <button
                    key={idx}
                    onClick={() => {
                      setSelectedDate(day);
                      if (!isSameMonth(day, currentDate)) {
                        setCurrentDate(day);
                      }
                    }}
                    className={`
                      aspect-square rounded-lg text-sm transition-colors
                      ${!isCurrentMonth ? 'text-slate-300 dark:text-slate-600' : 'text-slate-900 dark:text-slate-100'}
                      ${isSelected ? 'bg-purple-600 text-white font-bold' : ''}
                      ${isToday && !isSelected ? 'bg-purple-100 text-purple-900 dark:bg-purple-900/50 dark:text-purple-200' : ''}
                      ${!isSelected && !isToday && isCurrentMonth ? 'hover:bg-slate-100 dark:hover:bg-slate-700' : ''}
                      ${dayAppointments.length > 0 && !isSelected ? 'font-semibold' : ''}
                    `}
                  >
                    {formatDate(day, 'd')}
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Estatísticas do Dia */}
          <Card className="p-6">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Estatísticas do Dia</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-400">Total de Consultas</span>
                <span className="px-3 py-1 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-100 font-semibold">
                  {todayStats.total}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-400">Confirmadas</span>
                <span className="px-3 py-1 rounded-md bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300 font-semibold">
                  {todayStats.confirmed}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-400">Pendentes</span>
                <span className="px-3 py-1 rounded-md bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-300 font-semibold">
                  {todayStats.pending}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-400">Concluídas</span>
                <span className="px-3 py-1 rounded-md bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 font-semibold">
                  {todayStats.completed}
                </span>
              </div>
              {todayStats.cancelled > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Canceladas</span>
                  <span className="px-3 py-1 rounded-md bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-200 font-semibold">
                    {todayStats.cancelled}
                  </span>
                </div>
              )}
              {todayStats.noShow > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Não compareceu</span>
                  <span className="px-3 py-1 rounded-md bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300 font-semibold">
                    {todayStats.noShow}
                  </span>
                </div>
              )}
            </div>
          </Card>

          {/* Ações Rápidas */}
          <Card className="p-6">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Ações Rápidas</h3>
            <div className="space-y-2">
              <Link href="/doctor/schedules">
                <Button variant="outline" className="w-full justify-start" asChild>
                  <div>
                    <Lock className="h-4 w-4 mr-2" />
                    Gerenciar Horários
                  </div>
                </Button>
              </Link>
              <Link href="/doctor/blocks">
                <Button variant="outline" className="w-full justify-start text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/20" asChild>
                  <div>
                    <Ban className="h-4 w-4 mr-2" />
                    Bloquear Horários
                  </div>
                </Button>
              </Link>
              <Link href="/appointments">
                <Button variant="outline" className="w-full justify-start" asChild>
                  <div>
                    <Plus className="h-4 w-4 mr-2" />
                    Ver Todas Consultas
                  </div>
                </Button>
              </Link>
            </div>
          </Card>
        </div>

        {/* Main Content - Agenda */}
        <Card className="p-6">
          <h3 className="font-semibold text-slate-900 dark:text-white mb-4">
            {viewMode === 'daily' ? 'Agenda do Dia' : 'Agenda Semanal'}
          </h3>
          
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-slate-100 dark:bg-slate-700 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : viewMode === 'weekly' ? (
            <WeeklyView 
              selectedDate={selectedDate} 
              appointments={appointments}
              getStatusColor={getStatusColor}
              getStatusIcon={getStatusIcon}
            />
          ) : selectedDayAppointments.length === 0 ? (
            <div className="text-center py-12 text-slate-500 dark:text-slate-400">
              Nenhuma consulta agendada para este dia.
            </div>
          ) : (
            <div className="space-y-3">
              {selectedDayAppointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className={`rounded-lg border-2 p-4 ${getStatusColor(appointment.status)} ${
                    appointment.status === 'CANCELLED' || appointment.status === 'NO_SHOW' ? 'opacity-70' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        {getStatusIcon(appointment.status)}
                        <span className="font-semibold">
                          {formatDate(new Date(appointment.scheduled_at), 'HH:mm')}
                        </span>
                        <User className="h-4 w-4 ml-2" />
                        <span className="font-medium">
                          {appointment.patient?.name ?? '---'}
                        </span>
                        {/* Badge de status para CANCELLED e NO_SHOW */}
                        {appointment.status === 'CANCELLED' && (
                          <span className="px-2 py-0.5 text-xs rounded-full bg-slate-200 text-slate-700 dark:bg-slate-600 dark:text-slate-200">
                            Cancelada
                          </span>
                        )}
                        {appointment.status === 'NO_SHOW' && (
                          <span className="px-2 py-0.5 text-xs rounded-full bg-red-200 text-red-700 dark:bg-red-900/50 dark:text-red-200">
                            Não compareceu
                          </span>
                        )}
                        {appointment.status === 'COMPLETED' && (
                          <span className="px-2 py-0.5 text-xs rounded-full bg-blue-200 text-blue-700 dark:bg-blue-900/50 dark:text-blue-200">
                            Concluída
                          </span>
                        )}
                      </div>
                      <p className="text-sm opacity-90 mb-1">
                        {appointment.type === 'FIRST' ? 'Primeira Consulta' :
                         appointment.type === 'RETURN' ? 'Retorno' :
                         appointment.type === 'EXAM_REVIEW' ? 'Avaliação de Exames' :
                         appointment.type === 'URGENCY' ? 'Urgência' :
                         appointment.type === 'PRESENTIAL' ? 'Presencial' :
                         appointment.type === 'ONLINE' ? 'Online' : appointment.type}
                      </p>
                      {appointment.notes && (
                        <p className="text-sm italic opacity-75">
                          Obs: {appointment.notes}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Ações para consultas CONFIRMED */}
                      {appointment.status === 'CONFIRMED' && (
                        <>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800"
                            onClick={() => handleComplete(appointment)}
                            disabled={busyId === appointment.id}
                          >
                            <CheckCircle2 className="h-4 w-4 mr-1" />
                            Concluir
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800"
                            onClick={() => handleNoShow(appointment)}
                            disabled={busyId === appointment.id}
                          >
                            <UserX className="h-4 w-4 mr-1" />
                            Não compareceu
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="bg-red-50 text-red-700 border-red-200 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800"
                            onClick={() => openCancelModal(appointment)}
                            disabled={busyId === appointment.id}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Cancelar
                          </Button>
                        </>
                      )}
                      {/* Ações para consultas PENDING */}
                      {appointment.status === 'PENDING' && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="bg-red-50 text-red-700 border-red-200 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800"
                          onClick={() => openCancelModal(appointment)}
                          disabled={busyId === appointment.id}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Cancelar
                        </Button>
                      )}
                      {/* Ações para consultas COMPLETED */}
                      {appointment.status === 'COMPLETED' && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => openObservationModal(appointment)}
                          disabled={busyId === appointment.id}
                        >
                          <FileText className="h-4 w-4 mr-1" />
                          Adicionar observação
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Modal de Observação */}
      <Modal
        isOpen={showObservationModal}
        onClose={() => {
          setShowObservationModal(false);
          setSelectedAppointment(null);
        }}
        title="Registrar Observação Clínica"
        size="lg"
      >
        <div className="space-y-4">
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Paciente:</strong> {selectedAppointment?.patient?.name}
            </p>
            <p className="text-xs text-blue-600 dark:text-blue-300">
              Consulta em {selectedAppointment && formatDate(new Date(selectedAppointment.scheduled_at), "d 'de' MMMM 'às' HH:mm")}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="anamnesis">Anamnese *</Label>
            <Textarea 
              id="anamnesis" 
              rows={3}
              placeholder="Queixa principal, histórico..."
              value={observationForm.anamnesis}
              onChange={(e) => setObservationForm(prev => ({ ...prev, anamnesis: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="diagnosis">Diagnóstico</Label>
            <Textarea 
              id="diagnosis" 
              rows={2}
              placeholder="Diagnóstico ou hipótese diagnóstica..."
              value={observationForm.diagnosis}
              onChange={(e) => setObservationForm(prev => ({ ...prev, diagnosis: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="prescription">Prescrição</Label>
            <Textarea 
              id="prescription" 
              rows={2}
              placeholder="Medicamentos, exames solicitados..."
              value={observationForm.prescription}
              onChange={(e) => setObservationForm(prev => ({ ...prev, prescription: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notas adicionais</Label>
            <Textarea 
              id="notes" 
              rows={2}
              placeholder="Observações gerais, retorno..."
              value={observationForm.notes}
              onChange={(e) => setObservationForm(prev => ({ ...prev, notes: e.target.value }))}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t dark:border-slate-700">
            <Button 
              variant="ghost" 
              onClick={() => {
                setShowObservationModal(false);
                setSelectedAppointment(null);
              }}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleSaveObservation}
              disabled={busyId !== null}
            >
              Salvar observação
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal de Cancelamento */}
      <Modal
        isOpen={showCancelModal}
        onClose={() => {
          setShowCancelModal(false);
          setSelectedAppointment(null);
        }}
        title="Cancelar Consulta"
        size="sm"
      >
        <div className="space-y-4">
          <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
            <p className="text-sm text-red-800 dark:text-red-200">
              Tem certeza que deseja cancelar esta consulta?
            </p>
            <p className="text-xs text-red-600 dark:text-red-300 mt-2">
              <strong>Paciente:</strong> {selectedAppointment?.patient?.name}<br/>
              <strong>Data:</strong> {selectedAppointment && formatDate(new Date(selectedAppointment.scheduled_at), "d 'de' MMMM 'às' HH:mm")}
            </p>
          </div>

          <div className="flex justify-end gap-2">
            <Button 
              variant="ghost" 
              onClick={() => {
                setShowCancelModal(false);
                setSelectedAppointment(null);
              }}
            >
              Voltar
            </Button>
            <Button 
              variant="destructive"
              onClick={handleCancel}
              disabled={busyId !== null}
            >
              Confirmar cancelamento
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

