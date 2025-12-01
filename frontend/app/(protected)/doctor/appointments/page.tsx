'use client';

import { useCallback, useEffect, useState } from 'react';
import { Calendar, Clock, User, CheckCircle2, XCircle, UserX, Search, Filter, Eye, FileText } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Modal } from '@/components/ui/modal';
import { Textarea } from '@/components/ui/textarea';
import { fetchAppointments, completeAppointment, cancelAppointment, markNoShow } from '@/services/appointment-service';
import { createObservation, getObservation } from '@/services/observation-service';
import { Appointment, Observation } from '@/types';
import { handleApiError } from '@/lib/handle-api-error';
import { getStatusColors, getStatusLabel } from '@/constants/colors';
import { formatDate } from '@/lib/date-utils';

export default function DoctorAppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [filters, setFilters] = useState({
    status: '',
    period: 'all',
    search: '',
  });
  
  // Modal states
  const [showObservationModal, setShowObservationModal] = useState(false);
  const [showViewObservationModal, setShowViewObservationModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [currentObservation, setCurrentObservation] = useState<Observation | null>(null);
  const [observationForm, setObservationForm] = useState({
    anamnesis: '',
    diagnosis: '',
    prescription: '',
    notes: '',
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    lastPage: 1,
    total: 0,
  });

  const loadAppointments = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = {
        per_page: 20,
        page,
      };
      
      if (filters.status) params.status = filters.status;
      if (filters.period && filters.period !== 'all') params.period = filters.period;

      const response = await fetchAppointments(params);
      setAppointments(response.data ?? []);
      setPagination({
        currentPage: response.meta?.current_page ?? 1,
        lastPage: response.meta?.last_page ?? 1,
        total: response.meta?.total ?? 0,
      });
    } catch (error) {
      handleApiError(error, 'Erro ao carregar consultas');
    } finally {
      setLoading(false);
    }
  }, [filters.status, filters.period]);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  const filteredAppointments = appointments.filter((apt) => {
    if (!filters.search) return true;
    const searchLower = filters.search.toLowerCase();
    return (
      apt.patient?.name?.toLowerCase().includes(searchLower) ||
      apt.notes?.toLowerCase().includes(searchLower)
    );
  });

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

  const getStatusColor = (status: string) => {
    const colors = getStatusColors(status);
    return `${colors.bg} ${colors.text} ${colors.border}`;
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'FIRST': return 'Primeira Consulta';
      case 'RETURN': return 'Retorno';
      case 'EXAM_REVIEW': return 'Avaliação de Exames';
      case 'URGENCY': return 'Urgência';
      case 'PRESENTIAL': return 'Presencial';
      case 'ONLINE': return 'Online';
      default: return type;
    }
  };

  // Ações
  const handleComplete = async (appointment: Appointment) => {
    setBusyId(appointment.id);
    try {
      await completeAppointment(appointment.id);
      toast.success('Consulta marcada como concluída');
      setSelectedAppointment(appointment);
      setShowObservationModal(true);
      loadAppointments(pagination.currentPage);
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
      loadAppointments(pagination.currentPage);
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
      loadAppointments(pagination.currentPage);
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
      loadAppointments(pagination.currentPage);
    } catch (error) {
      handleApiError(error, 'Erro ao salvar observação');
    } finally {
      setBusyId(null);
    }
  };

  const openDetails = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setShowDetailsModal(true);
  };

  const openCancelModal = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setShowCancelModal(true);
  };

  const openObservationModal = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setObservationForm({ anamnesis: '', diagnosis: '', prescription: '', notes: '' });
    setShowObservationModal(true);
  };

  const viewObservation = async (appointment: Appointment) => {
    try {
      const observation = await getObservation(appointment.id);
      setCurrentObservation(observation);
      setSelectedAppointment(appointment);
      setShowViewObservationModal(true);
    } catch {
      // Se não encontrou observação, abre o modal para criar
      openObservationModal(appointment);
    }
  };

  // Verifica se a data/hora da consulta já passou
  const hasAppointmentPassed = (appointment: Appointment) => {
    const scheduledDate = new Date(appointment.scheduled_at);
    return scheduledDate < new Date();
  };

  // Pode concluir: PENDING ou CONFIRMED, e a data já passou
  const canComplete = (appointment: Appointment) => {
    return (appointment.status === 'PENDING' || appointment.status === 'CONFIRMED') && hasAppointmentPassed(appointment);
  };

  // Pode marcar falta: apenas CONFIRMED e a data já passou
  const canMarkNoShow = (appointment: Appointment) => {
    return appointment.status === 'CONFIRMED' && hasAppointmentPassed(appointment);
  };

  // Pode cancelar: PENDING ou CONFIRMED (antes ou depois)
  const canCancel = (appointment: Appointment) => {
    return appointment.status === 'PENDING' || appointment.status === 'CONFIRMED';
  };

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Minhas Consultas
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Gerencie todas as suas consultas
        </p>
      </div>

      {/* Filtros */}
      <Card className="p-4 mb-6 bg-white dark:bg-slate-800">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <Label htmlFor="search">Buscar paciente</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                id="search"
                type="text"
                placeholder="Nome do paciente..."
                className="pl-10"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              />
            </div>
          </div>
          
          <div className="min-w-[150px]">
            <Label htmlFor="status">Status</Label>
            <select
              id="status"
              className="w-full h-10 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            >
              <option value="">Todos</option>
              <option value="PENDING">Pendente</option>
              <option value="CONFIRMED">Confirmado</option>
              <option value="COMPLETED">Concluído</option>
              <option value="CANCELLED">Cancelado</option>
              <option value="NO_SHOW">Não Compareceu</option>
            </select>
          </div>
          
          <div className="min-w-[150px]">
            <Label htmlFor="period">Período</Label>
            <select
              id="period"
              className="w-full h-10 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              value={filters.period}
              onChange={(e) => setFilters({ ...filters, period: e.target.value })}
            >
              <option value="all">Todos</option>
              <option value="future">Futuras</option>
              <option value="past">Passadas</option>
            </select>
          </div>
          
          <Button
            variant="outline"
            onClick={() => {
              setFilters({ status: '', period: 'all', search: '' });
            }}
          >
            <Filter className="h-4 w-4 mr-2" />
            Limpar
          </Button>
        </div>
      </Card>

      {/* Lista de Consultas */}
      <Card className="bg-white dark:bg-slate-800">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {pagination.total} consulta{pagination.total !== 1 ? 's' : ''} encontrada{pagination.total !== 1 ? 's' : ''}
          </p>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-2 text-slate-600 dark:text-slate-400">Carregando...</p>
          </div>
        ) : filteredAppointments.length === 0 ? (
          <div className="p-8 text-center">
            <Calendar className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-600 dark:text-slate-400">Nenhuma consulta encontrada</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200 dark:divide-slate-700">
            {filteredAppointments.map((appointment) => (
              <div
                key={appointment.id}
                className="p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Info Principal */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(appointment.status)}`}>
                        {getStatusIcon(appointment.status)}
                        {getStatusLabel(appointment.status)}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">
                        {getTypeLabel(appointment.type)}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                        <User className="h-4 w-4" />
                        <span className="font-medium">{appointment.patient?.name ?? '---'}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(new Date(appointment.scheduled_at), "dd/MM/yyyy")}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                        <Clock className="h-4 w-4" />
                        <span>{formatDate(new Date(appointment.scheduled_at), "HH:mm")}</span>
                      </div>
                    </div>
                  </div>

                  {/* Ações */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openDetails(appointment)}
                      title="Ver detalhes"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    
                    {appointment.status === 'COMPLETED' && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-blue-600 border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                        onClick={() => viewObservation(appointment)}
                        title={appointment.observations?.length ? "Ver observação" : "Registrar observação"}
                      >
                        <FileText className="h-4 w-4 mr-1" />
                        Observação
                      </Button>
                    )}
                    
                    {/* Botão Concluir: PENDING/CONFIRMED e data passou */}
                    {canComplete(appointment) && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-green-600 border-green-600 hover:bg-green-50 dark:hover:bg-green-900/30"
                        onClick={() => handleComplete(appointment)}
                        disabled={busyId === appointment.id}
                      >
                        {busyId === appointment.id ? '...' : 'Concluir'}
                      </Button>
                    )}
                    
                    {/* Botão Faltou: apenas CONFIRMED e data passou */}
                    {canMarkNoShow(appointment) && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-amber-600 border-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/30"
                        onClick={() => handleNoShow(appointment)}
                        disabled={busyId === appointment.id}
                      >
                        {busyId === appointment.id ? '...' : 'Faltou'}
                      </Button>
                    )}
                    
                    {/* Botão Cancelar: PENDING/CONFIRMED (antes ou depois) */}
                    {canCancel(appointment) && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 border-red-600 hover:bg-red-50 dark:hover:bg-red-900/30"
                        onClick={() => openCancelModal(appointment)}
                        disabled={busyId === appointment.id}
                      >
                        Cancelar
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Paginação */}
        {pagination.lastPage > 1 && (
          <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Página {pagination.currentPage} de {pagination.lastPage}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.currentPage === 1}
                onClick={() => loadAppointments(pagination.currentPage - 1)}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.currentPage === pagination.lastPage}
                onClick={() => loadAppointments(pagination.currentPage + 1)}
              >
                Próxima
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Modal de Detalhes */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedAppointment(null);
        }}
        title="Detalhes da Consulta"
      >
        {selectedAppointment && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-500">Paciente</Label>
                <p className="font-medium text-slate-900 dark:text-white">
                  {selectedAppointment.patient?.name}
                </p>
              </div>
              <div>
                <Label className="text-slate-500">Status</Label>
                <p className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-sm font-medium ${getStatusColor(selectedAppointment.status)}`}>
                  {getStatusIcon(selectedAppointment.status)}
                  {getStatusLabel(selectedAppointment.status)}
                </p>
              </div>
              <div>
                <Label className="text-slate-500">Data</Label>
                <p className="font-medium text-slate-900 dark:text-white">
                  {formatDate(new Date(selectedAppointment.scheduled_at), "dd/MM/yyyy")}
                </p>
              </div>
              <div>
                <Label className="text-slate-500">Horário</Label>
                <p className="font-medium text-slate-900 dark:text-white">
                  {formatDate(new Date(selectedAppointment.scheduled_at), "HH:mm")}
                </p>
              </div>
              <div>
                <Label className="text-slate-500">Tipo</Label>
                <p className="font-medium text-slate-900 dark:text-white">
                  {getTypeLabel(selectedAppointment.type)}
                </p>
              </div>
              <div>
                <Label className="text-slate-500">Duração</Label>
                <p className="font-medium text-slate-900 dark:text-white">
                  {selectedAppointment.duration_minutes} minutos
                </p>
              </div>
            </div>
            
            {selectedAppointment.notes && (
              <div>
                <Label className="text-slate-500">Notas do Agendamento</Label>
                <p className="text-slate-900 dark:text-white mt-1">
                  {selectedAppointment.notes}
                </p>
              </div>
            )}
            
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowDetailsModal(false)}>
                Fechar
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal de Cancelamento */}
      <Modal
        isOpen={showCancelModal}
        onClose={() => {
          setShowCancelModal(false);
          setSelectedAppointment(null);
        }}
        title="Cancelar Consulta"
      >
        <div className="space-y-4">
          <p className="text-slate-600 dark:text-slate-400">
            Tem certeza que deseja cancelar a consulta de{' '}
            <span className="font-semibold text-slate-900 dark:text-white">
              {selectedAppointment?.patient?.name}
            </span>{' '}
            agendada para{' '}
            <span className="font-semibold text-slate-900 dark:text-white">
              {selectedAppointment && formatDate(new Date(selectedAppointment.scheduled_at), "dd/MM/yyyy 'às' HH:mm")}
            </span>
            ?
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowCancelModal(false)}>
              Não, manter
            </Button>
            <Button
              variant="danger"
              onClick={handleCancel}
              disabled={busyId === selectedAppointment?.id}
            >
              {busyId === selectedAppointment?.id ? 'Cancelando...' : 'Sim, cancelar'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal de Observação (criar) */}
      <Modal
        isOpen={showObservationModal}
        onClose={() => {
          setShowObservationModal(false);
          setSelectedAppointment(null);
          setObservationForm({ anamnesis: '', diagnosis: '', prescription: '', notes: '' });
        }}
        title="Registrar Observação da Consulta"
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="anamnesis">Anamnese *</Label>
            <Textarea
              id="anamnesis"
              placeholder="Descreva os sintomas relatados, histórico..."
              rows={3}
              value={observationForm.anamnesis}
              onChange={(e) => setObservationForm({ ...observationForm, anamnesis: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="diagnosis">Diagnóstico</Label>
            <Textarea
              id="diagnosis"
              placeholder="Diagnóstico ou hipótese diagnóstica..."
              rows={2}
              value={observationForm.diagnosis}
              onChange={(e) => setObservationForm({ ...observationForm, diagnosis: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="prescription">Prescrição</Label>
            <Textarea
              id="prescription"
              placeholder="Medicamentos, exames solicitados..."
              rows={2}
              value={observationForm.prescription}
              onChange={(e) => setObservationForm({ ...observationForm, prescription: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="notes">Notas Adicionais</Label>
            <Textarea
              id="notes"
              placeholder="Observações gerais..."
              rows={2}
              value={observationForm.notes}
              onChange={(e) => setObservationForm({ ...observationForm, notes: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowObservationModal(false);
                setSelectedAppointment(null);
              }}
            >
              Pular por agora
            </Button>
            <Button
              onClick={handleSaveObservation}
              disabled={busyId === selectedAppointment?.id}
            >
              {busyId === selectedAppointment?.id ? 'Salvando...' : 'Salvar Observação'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal de Observação (visualizar) */}
      <Modal
        isOpen={showViewObservationModal}
        onClose={() => {
          setShowViewObservationModal(false);
          setCurrentObservation(null);
          setSelectedAppointment(null);
        }}
        title="Observação da Consulta"
      >
        {currentObservation && (
          <div className="space-y-4">
            <div>
              <Label className="text-slate-500">Anamnese</Label>
              <p className="text-slate-900 dark:text-white mt-1 whitespace-pre-wrap">
                {currentObservation.anamnesis || '-'}
              </p>
            </div>
            {currentObservation.diagnosis && (
              <div>
                <Label className="text-slate-500">Diagnóstico</Label>
                <p className="text-slate-900 dark:text-white mt-1 whitespace-pre-wrap">
                  {currentObservation.diagnosis}
                </p>
              </div>
            )}
            {currentObservation.prescription && (
              <div>
                <Label className="text-slate-500">Prescrição</Label>
                <p className="text-slate-900 dark:text-white mt-1 whitespace-pre-wrap">
                  {currentObservation.prescription}
                </p>
              </div>
            )}
            {currentObservation.notes && (
              <div>
                <Label className="text-slate-500">Notas</Label>
                <p className="text-slate-900 dark:text-white mt-1 whitespace-pre-wrap">
                  {currentObservation.notes}
                </p>
              </div>
            )}
            <div className="flex justify-end pt-4">
              <Button variant="outline" onClick={() => setShowViewObservationModal(false)}>
                Fechar
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
