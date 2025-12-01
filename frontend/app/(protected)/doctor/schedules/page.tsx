'use client';

import { useCallback, useEffect, useState } from "react";
import { Calendar, Check, Clock, Plus, Trash2, Unlock } from "lucide-react";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { handleApiError } from "@/lib/handle-api-error";
import {
  createSchedule,
  deleteSchedule,
  fetchDoctorSchedules,
  Schedule,
} from "@/services/schedule-service";

// Backend usa 1-7 (ISO: 1=Segunda, 7=Domingo)
const days = [
  { label: "Segunda", shortLabel: "Seg", value: 1 },
  { label: "Terça", shortLabel: "Ter", value: 2 },
  { label: "Quarta", shortLabel: "Qua", value: 3 },
  { label: "Quinta", shortLabel: "Qui", value: 4 },
  { label: "Sexta", shortLabel: "Sex", value: 5 },
  { label: "Sábado", shortLabel: "Sáb", value: 6 },
  { label: "Domingo", shortLabel: "Dom", value: 7 },
];

interface TimeSlot {
  time: string;
  selected: boolean;
  hasSchedule: boolean;
  scheduleId?: number;
}

// Gerar todos os slots possíveis do dia (6:00 às 22:00)
function generateAllDaySlots(): string[] {
  const slots: string[] = [];
  for (let hour = 6; hour < 22; hour++) {
    slots.push(`${String(hour).padStart(2, '0')}:00`);
    slots.push(`${String(hour).padStart(2, '0')}:30`);
  }
  return slots;
}

const ALL_SLOTS = generateAllDaySlots();

export default function DoctorSchedulesPage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  
  // Dia selecionado (0-6, domingo a sábado)
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  
  // Slots do dia selecionado
  const [daySlots, setDaySlots] = useState<TimeSlot[]>([]);
  
  // Modo: 'add' ou 'remove'
  const [mode, setMode] = useState<'add' | 'remove'>('add');
  
  // Modal de confirmação
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [slotDuration, setSlotDuration] = useState(30);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadSchedules();
  }, []);

  const loadSchedules = async () => {
    try {
      const response = await fetchDoctorSchedules();
      setSchedules(response.data ?? []);
    } catch (error) {
      handleApiError(error, "Não foi possível carregar a agenda.");
    } finally {
      setLoading(false);
    }
  };

  // Gerar slots para um dia específico
  const generateSlotsForDay = useCallback((dayOfWeek: number) => {
    const daySchedules = schedules.filter(s => s.day_of_week === dayOfWeek);
    
    const slots: TimeSlot[] = ALL_SLOTS.map(time => {
      let hasSchedule = false;
      let scheduleId: number | undefined;
      
      for (const schedule of daySchedules) {
        const start = schedule.start_time.slice(0, 5);
        const end = schedule.end_time.slice(0, 5);
        if (time >= start && time < end) {
          hasSchedule = true;
          scheduleId = schedule.id;
          break;
        }
      }
      
      return {
        time,
        selected: false,
        hasSchedule,
        scheduleId,
      };
    });
    
    return slots;
  }, [schedules]);

  // Quando seleciona um dia
  const handleSelectDay = (dayValue: number) => {
    setSelectedDay(dayValue);
    setMode('add');
    const slots = generateSlotsForDay(dayValue);
    setDaySlots(slots);
  };

  // Toggle seleção de slot
  const toggleSlot = (index: number) => {
    const slot = daySlots[index];
    
    // Se está no modo adicionar, só permite selecionar slots livres
    // Se está no modo remover, só permite selecionar slots com agenda
    if (mode === 'add' && slot.hasSchedule) return;
    if (mode === 'remove' && !slot.hasSchedule) return;
    
    setDaySlots(prev => prev.map((s, i) => {
      if (i === index) {
        return { ...s, selected: !s.selected };
      }
      return s;
    }));
  };

  // Selecionar todos os slots livres
  const selectAllFreeSlots = () => {
    setMode('add');
    setDaySlots(prev => prev.map(slot => ({
      ...slot,
      selected: !slot.hasSchedule,
    })));
  };

  // Selecionar todos os slots com agenda
  const selectAllScheduledSlots = () => {
    setMode('remove');
    setDaySlots(prev => prev.map(slot => ({
      ...slot,
      selected: slot.hasSchedule,
    })));
  };

  // Limpar seleção
  const clearSelection = () => {
    setDaySlots(prev => prev.map(slot => ({
      ...slot,
      selected: false,
    })));
  };

  // Abrir modal de confirmação
  const openConfirmModal = () => {
    const selectedSlots = daySlots.filter(s => s.selected);
    if (selectedSlots.length === 0) {
      toast.error('Selecione pelo menos um horário');
      return;
    }
    setShowConfirmModal(true);
  };

  // Adicionar minutos a um horário
  const addMinutes = (time: string, minutes: number): string => {
    const [h, m] = time.split(':').map(Number);
    const totalMinutes = h * 60 + m + minutes;
    const newHour = Math.floor(totalMinutes / 60);
    const newMin = totalMinutes % 60;
    return `${String(newHour).padStart(2, '0')}:${String(newMin).padStart(2, '0')}`;
  };

  // Confirmar adição de horários
  const confirmAddSchedule = async () => {
    if (selectedDay === null) return;
    
    const selectedSlots = daySlots.filter(s => s.selected && !s.hasSchedule);
    if (selectedSlots.length === 0) return;
    
    setIsSubmitting(true);
    
    try {
      // Agrupar slots consecutivos
      const groups: { start: string; end: string }[] = [];
      let currentGroup: { start: string; end: string } | null = null;
      
      const sortedSlots = [...selectedSlots].sort((a, b) => a.time.localeCompare(b.time));
      
      for (let i = 0; i < sortedSlots.length; i++) {
        const slot = sortedSlots[i];
        const nextSlot = sortedSlots[i + 1];
        
        if (!currentGroup) {
          currentGroup = { start: slot.time, end: addMinutes(slot.time, 30) };
        }
        
        if (nextSlot && nextSlot.time === currentGroup.end) {
          currentGroup.end = addMinutes(nextSlot.time, 30);
        } else {
          groups.push(currentGroup);
          currentGroup = null;
        }
      }
      
      // Criar agendas
      for (const group of groups) {
        await createSchedule({
          day_of_week: selectedDay,
          start_time: group.start,
          end_time: group.end,
          slot_duration_minutes: slotDuration,
        });
      }
      
      toast.success(`${groups.length} período(s) de atendimento criado(s)`);
      setShowConfirmModal(false);
      setSelectedDay(null);
      setDaySlots([]);
      await loadSchedules();
    } catch (error) {
      handleApiError(error, 'Erro ao criar horários');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Confirmar remoção de horários
  const confirmRemoveSchedule = async () => {
    const selectedSlots = daySlots.filter(s => s.selected && s.hasSchedule);
    if (selectedSlots.length === 0) return;
    
    setIsSubmitting(true);
    
    try {
      // Coletar IDs únicos das agendas a deletar
      const scheduleIdsToDelete = [...new Set(selectedSlots.map(s => s.scheduleId).filter(Boolean))] as number[];
      
      for (const scheduleId of scheduleIdsToDelete) {
        await deleteSchedule(scheduleId);
      }
      
      toast.success(`${scheduleIdsToDelete.length} período(s) removido(s)`);
      setShowConfirmModal(false);
      setSelectedDay(null);
      setDaySlots([]);
      await loadSchedules();
    } catch (error) {
      handleApiError(error, 'Erro ao remover horários');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Contar slots
  const selectedCount = daySlots.filter(s => s.selected).length;
  const scheduledCount = daySlots.filter(s => s.hasSchedule).length;
  const freeCount = daySlots.filter(s => !s.hasSchedule).length;

  // Verificar status do dia
  const getDayStatus = (dayValue: number) => {
    const daySchedules = schedules.filter(s => s.day_of_week === dayValue);
    if (daySchedules.length === 0) return 'empty';
    return 'configured';
  };

  // Formatar horários do dia para exibição
  const getDaySchedulesSummary = (dayValue: number) => {
    const daySchedules = schedules.filter(s => s.day_of_week === dayValue);
    if (daySchedules.length === 0) return null;
    
    return daySchedules
      .sort((a, b) => a.start_time.localeCompare(b.start_time))
      .map(s => `${s.start_time.slice(0, 5)}-${s.end_time.slice(0, 5)}`)
      .join(', ');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Minha Agenda</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Configure os horários de atendimento para cada dia da semana
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_350px]">
        {/* Calendário semanal e slots */}
        <div className="space-y-6">
          {/* Dias da semana */}
          <Card className="p-4">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-4">
              Selecione um dia da semana
            </h3>
            <div className="grid grid-cols-7 gap-2">
              {days.map((day) => {
                const status = getDayStatus(day.value);
                const isSelected = selectedDay === day.value;
                const summary = getDaySchedulesSummary(day.value);
                
                return (
                  <button
                    key={day.value}
                    onClick={() => handleSelectDay(day.value)}
                    className={`
                      relative p-3 rounded-lg text-center transition-all
                      ${isSelected 
                        ? 'bg-blue-600 text-white ring-2 ring-blue-400' 
                        : status === 'configured'
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/50'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                      }
                    `}
                  >
                    <span className="text-xs font-medium block">{day.shortLabel}</span>
                    <span className="text-[10px] mt-1 block opacity-75">
                      {status === 'configured' ? '✓' : '—'}
                    </span>
                  </button>
                );
              })}
            </div>
            
            {/* Legenda */}
            <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 text-xs text-slate-500">
              <div className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-green-100 dark:bg-green-900/30 border border-green-300" />
                <span>Dia configurado</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-slate-100 dark:bg-slate-700 border border-slate-300" />
                <span>Sem horários</span>
              </div>
            </div>
          </Card>

          {/* Slots do dia selecionado */}
          {selectedDay !== null && (
            <Card className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white">
                    {days.find(d => d.value === selectedDay)?.label}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {selectedCount > 0 
                      ? `${selectedCount} horário(s) selecionado(s) para ${mode === 'add' ? 'adicionar' : 'remover'}` 
                      : 'Clique nos horários para selecionar'}
                  </p>
                </div>
                <div className="flex gap-2">
                  {scheduledCount > 0 && (
                    <Button 
                      variant={mode === 'remove' ? 'default' : 'outline'} 
                      size="sm" 
                      onClick={selectAllScheduledSlots}
                      className={mode === 'remove' ? 'bg-red-600 hover:bg-red-700' : ''}
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Remover
                    </Button>
                  )}
                  {freeCount > 0 && (
                    <Button 
                      variant={mode === 'add' ? 'default' : 'outline'} 
                      size="sm" 
                      onClick={selectAllFreeSlots}
                      className={mode === 'add' ? 'bg-green-600 hover:bg-green-700' : ''}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Adicionar
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" onClick={clearSelection}>
                    Limpar
                  </Button>
                </div>
              </div>

              {/* Indicador de modo */}
              {selectedCount > 0 && (
                <div className={`mb-4 p-2 rounded-lg text-sm text-center ${
                  mode === 'add' 
                    ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300' 
                    : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                }`}>
                  {mode === 'add' 
                    ? '➕ Modo: Adicionar horários de atendimento' 
                    : '➖ Modo: Remover horários de atendimento'}
                </div>
              )}

              {/* Grid de horários */}
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                {daySlots.map((slot, idx) => {
                  const canSelect = mode === 'add' ? !slot.hasSchedule : slot.hasSchedule;
                  
                  return (
                    <button
                      key={idx}
                      onClick={() => toggleSlot(idx)}
                      disabled={!canSelect}
                      className={`
                        relative p-2 rounded-lg text-sm font-medium transition-all
                        ${slot.hasSchedule && !slot.selected
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' 
                          : ''}
                        ${slot.hasSchedule && slot.selected
                          ? 'bg-red-600 text-white ring-2 ring-red-400' 
                          : ''}
                        ${!slot.hasSchedule && slot.selected
                          ? 'bg-green-600 text-white ring-2 ring-green-400'
                          : ''}
                        ${!slot.hasSchedule && !slot.selected
                          ? 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'
                          : ''}
                        ${!canSelect ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                      `}
                    >
                      {slot.time}
                      {slot.selected && (
                        <Check className="absolute top-0.5 right-0.5 h-3 w-3" />
                      )}
                    </button>
                  );
                })}
              </div>

              {selectedCount > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                  {mode === 'add' ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <Label htmlFor="duration" className="whitespace-nowrap">Duração da consulta:</Label>
                        <Input
                          id="duration"
                          type="number"
                          min={10}
                          max={120}
                          value={slotDuration}
                          onChange={(e) => setSlotDuration(Number(e.target.value))}
                          className="w-24"
                        />
                        <span className="text-sm text-slate-500">minutos</span>
                      </div>
                      <Button 
                        className="w-full bg-green-600 hover:bg-green-700"
                        onClick={openConfirmModal}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Adicionar {selectedCount} horário(s)
                      </Button>
                    </div>
                  ) : (
                    <Button 
                      className="w-full bg-red-600 hover:bg-red-700"
                      onClick={openConfirmModal}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Remover {selectedCount} horário(s)
                    </Button>
                  )}
                </div>
              )}
            </Card>
          )}
        </div>

        {/* Resumo das agendas */}
        <Card className="overflow-hidden h-fit">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-500" />
              Resumo da Semana
            </CardTitle>
            <CardDescription>Seus horários de atendimento</CardDescription>
          </CardHeader>
          <div className="max-h-[500px] overflow-y-auto border-t border-slate-200 dark:border-slate-700">
            {loading ? (
              <div className="space-y-3 p-6">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : schedules.length === 0 ? (
              <EmptyState className="m-4">
                Nenhum horário configurado.<br/>
                Selecione um dia para começar.
              </EmptyState>
            ) : (
              <ul className="divide-y divide-slate-200 dark:divide-slate-700">
                {days.map((day) => {
                  const daySchedules = schedules
                    .filter(s => s.day_of_week === day.value)
                    .sort((a, b) => a.start_time.localeCompare(b.start_time));
                  
                  if (daySchedules.length === 0) return null;
                  
                  return (
                    <li key={day.value} className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-green-100 dark:bg-green-900/30 p-2">
                          <Clock className="h-4 w-4 text-green-600 dark:text-green-400" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm text-slate-800 dark:text-slate-100">
                            {day.label}
                          </p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {daySchedules.map((schedule) => (
                              <span
                                key={schedule.id}
                                className="text-xs bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded text-slate-600 dark:text-slate-300"
                              >
                                {schedule.start_time.slice(0, 5)}-{schedule.end_time.slice(0, 5)}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </Card>
      </div>

      {/* Modal de Confirmação */}
      <Modal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title={mode === 'add' ? 'Confirmar Horários' : 'Confirmar Remoção'}
      >
        <div className="space-y-4">
          {mode === 'add' ? (
            <>
              <p className="text-slate-600 dark:text-slate-400">
                Você está prestes a adicionar{' '}
                <strong className="text-slate-900 dark:text-white">
                  {selectedCount} horário(s)
                </strong>{' '}
                de atendimento para{' '}
                <strong className="text-slate-900 dark:text-white">
                  {days.find(d => d.value === selectedDay)?.label}
                </strong>.
              </p>
              
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Duração de cada consulta: <strong>{slotDuration} minutos</strong>
              </p>

              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowConfirmModal(false)}
                >
                  Cancelar
                </Button>
                <Button
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  onClick={confirmAddSchedule}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Salvando...' : 'Confirmar'}
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className="text-slate-600 dark:text-slate-400">
                Você está prestes a remover{' '}
                <strong className="text-slate-900 dark:text-white">
                  {selectedCount} horário(s)
                </strong>{' '}
                de atendimento de{' '}
                <strong className="text-slate-900 dark:text-white">
                  {days.find(d => d.value === selectedDay)?.label}
                </strong>.
              </p>
              
              <p className="text-sm text-amber-600 dark:text-amber-400">
                ⚠️ Consultas já agendadas nesses horários não serão afetadas.
              </p>

              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowConfirmModal(false)}
                >
                  Cancelar
                </Button>
                <Button
                  className="flex-1 bg-red-600 hover:bg-red-700"
                  onClick={confirmRemoveSchedule}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Removendo...' : 'Confirmar remoção'}
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}
