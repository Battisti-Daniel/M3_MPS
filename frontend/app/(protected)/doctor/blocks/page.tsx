'use client';

import { useCallback, useEffect, useState } from 'react';
import { Ban, Calendar, ChevronLeft, ChevronRight, Clock, Trash2, Check, Unlock } from 'lucide-react';
import toast from 'react-hot-toast';

import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Modal } from '@/components/ui/modal';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { handleApiError } from '@/lib/handle-api-error';
import { 
  fetchScheduleBlocks, 
  createScheduleBlock, 
  deleteScheduleBlock,
  ScheduleBlock 
} from '@/services/schedule-block-service';
import { fetchDoctorSchedules, Schedule } from '@/services/schedule-service';
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
  getDay,
} from '@/lib/date-utils';

interface TimeSlot {
  time: string;
  selected: boolean;
  blocked: boolean;
  blockId?: number; // ID do bloqueio para poder deletar
}

export default function ScheduleBlocksPage() {
  const [blocks, setBlocks] = useState<ScheduleBlock[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  
  // Calendário
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  
  // Slots do dia selecionado
  const [daySlots, setDaySlots] = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  
  // Modo: 'block' ou 'unblock'
  const [mode, setMode] = useState<'block' | 'unblock'>('block');
  // Modal de confirmação
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dias do calendário
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const weekDayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [blocksResponse, schedulesResponse] = await Promise.all([
        fetchScheduleBlocks({ start_date: formatDate(new Date(), 'yyyy-MM-dd') }),
        fetchDoctorSchedules(),
      ]);
      setBlocks(blocksResponse.data ?? []);
      setSchedules(schedulesResponse.data ?? []);
    } catch (error) {
      handleApiError(error, 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  // Gerar slots baseado nos horários de trabalho do médico
  const generateSlotsForDay = useCallback((date: Date) => {
    // Converter de JavaScript (0=Dom, 6=Sáb) para ISO (1=Seg, 7=Dom)
    const jsDay = getDay(date);
    const dayOfWeek = jsDay === 0 ? 7 : jsDay; // Domingo: 0 -> 7
    const daySchedule = schedules.find(s => s.day_of_week === dayOfWeek);
    
    if (!daySchedule) {
      return [];
    }

    const slots: TimeSlot[] = [];
    const dateStr = formatDate(date, 'yyyy-MM-dd');
    
    // Bloqueios existentes para este dia
    const dayBlocks = blocks.filter(b => b.blocked_date === dateStr);
    
    // Gerar slots de 30 em 30 minutos
    const [startHour, startMin] = daySchedule.start_time.split(':').map(Number);
    const [endHour, endMin] = daySchedule.end_time.split(':').map(Number);
    
    let currentHour = startHour;
    let currentMin = startMin;
    
    while (currentHour < endHour || (currentHour === endHour && currentMin < endMin)) {
      const timeStr = `${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}`;
      
      // Verificar se está bloqueado e qual o ID do bloqueio
      let isBlocked = false;
      let blockId: number | undefined;
      
      for (const block of dayBlocks) {
        if (block.is_full_day) {
          isBlocked = true;
          blockId = block.id;
          break;
        }
        if (block.start_time && block.end_time) {
          const blockStart = block.start_time.slice(0, 5);
          const blockEnd = block.end_time.slice(0, 5);
          if (timeStr >= blockStart && timeStr < blockEnd) {
            isBlocked = true;
            blockId = block.id;
            break;
          }
        }
      }
      
      slots.push({
        time: timeStr,
        selected: false,
        blocked: isBlocked,
        blockId,
      });
      
      // Incrementar 30 minutos
      currentMin += 30;
      if (currentMin >= 60) {
        currentMin = 0;
        currentHour++;
      }
    }
    
    return slots;
  }, [schedules, blocks]);

  // Quando seleciona um dia
  const handleSelectDate = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (date < today) {
      toast.error('Não é possível bloquear datas passadas');
      return;
    }
    
    setSelectedDate(date);
    setLoadingSlots(true);
    setMode('block'); // Reset para modo bloquear
    
    const slots = generateSlotsForDay(date);
    setDaySlots(slots);
    setLoadingSlots(false);
  };

  // Toggle seleção de slot - funciona tanto para bloquear quanto desbloquear
  const toggleSlot = (index: number) => {
    const slot = daySlots[index];
    
    // Se está no modo bloquear, só permite selecionar slots livres
    // Se está no modo desbloquear, só permite selecionar slots bloqueados
    if (mode === 'block' && slot.blocked) return;
    if (mode === 'unblock' && !slot.blocked) return;
    
    setDaySlots(prev => prev.map((s, i) => {
      if (i === index) {
        return { ...s, selected: !s.selected };
      }
      return s;
    }));
  };

  // Selecionar todos os slots disponíveis (para bloquear)
  const selectAllFreeSlots = () => {
    setMode('block');
    setDaySlots(prev => prev.map(slot => ({
      ...slot,
      selected: !slot.blocked,
    })));
  };

  // Selecionar todos os slots bloqueados (para desbloquear)
  const selectAllBlockedSlots = () => {
    setMode('unblock');
    setDaySlots(prev => prev.map(slot => ({
      ...slot,
      selected: slot.blocked,
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

  // Confirmar bloqueio
  const confirmBlock = async () => {
    if (!selectedDate) return;
    
    const selectedSlots = daySlots.filter(s => s.selected);
    if (selectedSlots.length === 0) return;
    
    setIsSubmitting(true);
    
    try {
      const dateStr = formatDate(selectedDate, 'yyyy-MM-dd');
      
      // Agrupar slots consecutivos
      const groups: { start: string; end: string }[] = [];
      let currentGroup: { start: string; end: string } | null = null;
      
      // Ordenar por horário
      const sortedSlots = [...selectedSlots].sort((a, b) => a.time.localeCompare(b.time));
      
      for (let i = 0; i < sortedSlots.length; i++) {
        const slot = sortedSlots[i];
        const nextSlot = sortedSlots[i + 1];
        
        if (!currentGroup) {
          currentGroup = { start: slot.time, end: addMinutes(slot.time, 30) };
        }
        
        if (nextSlot && nextSlot.time === currentGroup.end) {
          // Slot consecutivo, estender o grupo
          currentGroup.end = addMinutes(nextSlot.time, 30);
        } else {
          // Finalizar grupo atual
          groups.push(currentGroup);
          currentGroup = null;
        }
      }
      
      // Criar bloqueios
      for (const group of groups) {
        await createScheduleBlock({
          blocked_date: dateStr,
          start_time: group.start,
          end_time: group.end,
          reason: reason || null,
        });
      }
      
      toast.success(`${groups.length} bloqueio(s) criado(s) com sucesso`);
      setShowConfirmModal(false);
      setReason('');
      setSelectedDate(null);
      setDaySlots([]);
      await loadData();
    } catch (error) {
      handleApiError(error, 'Erro ao criar bloqueio');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Bloquear dia inteiro
  const blockFullDay = async () => {
    if (!selectedDate) return;
    
    setIsSubmitting(true);
    
    try {
      await createScheduleBlock({
        blocked_date: formatDate(selectedDate, 'yyyy-MM-dd'),
        start_time: null,
        end_time: null,
        reason: reason || 'Dia inteiro bloqueado',
      });
      
      toast.success('Dia inteiro bloqueado com sucesso');
      setShowConfirmModal(false);
      setReason('');
      setSelectedDate(null);
      setDaySlots([]);
      await loadData();
    } catch (error) {
      handleApiError(error, 'Erro ao bloquear dia');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Desbloquear slots selecionados
  const confirmUnblock = async () => {
    const selectedSlots = daySlots.filter(s => s.selected && s.blocked);
    if (selectedSlots.length === 0) return;
    
    setIsSubmitting(true);
    
    try {
      // Coletar IDs únicos dos bloqueios a deletar
      const blockIdsToDelete = [...new Set(selectedSlots.map(s => s.blockId).filter(Boolean))] as number[];
      
      for (const blockId of blockIdsToDelete) {
        await deleteScheduleBlock(blockId);
      }
      
      toast.success(`${blockIdsToDelete.length} bloqueio(s) removido(s) com sucesso`);
      setShowConfirmModal(false);
      setSelectedDate(null);
      setDaySlots([]);
      await loadData();
    } catch (error) {
      handleApiError(error, 'Erro ao desbloquear horários');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Adicionar minutos a um horário
  const addMinutes = (time: string, minutes: number): string => {
    const [h, m] = time.split(':').map(Number);
    const totalMinutes = h * 60 + m + minutes;
    const newHour = Math.floor(totalMinutes / 60);
    const newMin = totalMinutes % 60;
    return `${String(newHour).padStart(2, '0')}:${String(newMin).padStart(2, '0')}`;
  };

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    try {
      await deleteScheduleBlock(id);
      toast.success('Bloqueio removido.');
      await loadData();
    } catch (error) {
      handleApiError(error, 'Erro ao remover bloqueio');
    } finally {
      setDeletingId(null);
    }
  };

  // Verificar se um dia tem horário de trabalho
  const hasSchedule = (date: Date) => {
    // Converter de JavaScript (0=Dom, 6=Sáb) para ISO (1=Seg, 7=Dom)
    const jsDay = getDay(date);
    const dayOfWeek = jsDay === 0 ? 7 : jsDay;
    return schedules.some(s => s.day_of_week === dayOfWeek);
  };

  // Verificar se um dia está bloqueado (parcial ou total)
  const getDayBlockStatus = (date: Date) => {
    const dateStr = formatDate(date, 'yyyy-MM-dd');
    const dayBlocks = blocks.filter(b => b.blocked_date === dateStr);
    
    if (dayBlocks.length === 0) return 'free';
    if (dayBlocks.some(b => b.is_full_day)) return 'full';
    return 'partial';
  };

  const selectedCount = daySlots.filter(s => s.selected).length;
  const blockedCount = daySlots.filter(s => s.blocked).length;
  const freeCount = daySlots.filter(s => !s.blocked).length;
  const availableCount = daySlots.filter(s => !s.blocked).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Bloquear Horários</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Selecione um dia no calendário e escolha os horários que deseja bloquear
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
        {/* Calendário e Slots */}
        <div className="space-y-6">
          {/* Calendário */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <Button variant="ghost" size="sm" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h3 className="font-semibold text-slate-900 dark:text-white">
                {formatDate(currentMonth, "MMMM 'de' yyyy")}
              </h3>
              <Button variant="ghost" size="sm" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Dias da semana */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {weekDayNames.map((day) => (
                <div key={day} className="text-center text-xs font-medium text-slate-500 dark:text-slate-400 py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Dias do mês */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, idx) => {
                const isCurrentMonth = isSameMonth(day, currentMonth);
                const isToday = isSameDay(day, new Date());
                const isSelected = selectedDate && isSameDay(day, selectedDate);
                const hasSched = hasSchedule(day);
                const blockStatus = getDayBlockStatus(day);
                const isPast = day < new Date(new Date().setHours(0, 0, 0, 0));

                return (
                  <button
                    key={idx}
                    onClick={() => handleSelectDate(day)}
                    disabled={!isCurrentMonth || isPast || !hasSched}
                    className={`
                      relative p-2 h-12 rounded-lg text-sm font-medium transition-all
                      ${!isCurrentMonth ? 'text-slate-300 dark:text-slate-600 cursor-not-allowed' : ''}
                      ${isPast && isCurrentMonth ? 'text-slate-400 dark:text-slate-500 cursor-not-allowed' : ''}
                      ${!hasSched && isCurrentMonth && !isPast ? 'text-slate-400 dark:text-slate-500 cursor-not-allowed' : ''}
                      ${isCurrentMonth && !isPast && hasSched ? 'hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer' : ''}
                      ${isSelected ? 'bg-blue-600 text-white hover:bg-blue-700' : ''}
                      ${isToday && !isSelected ? 'ring-2 ring-blue-500' : ''}
                      ${blockStatus === 'full' && !isSelected ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' : ''}
                      ${blockStatus === 'partial' && !isSelected ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300' : ''}
                    `}
                  >
                    {formatDate(day, 'd')}
                    {blockStatus === 'full' && !isSelected && (
                      <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-red-500" />
                    )}
                    {blockStatus === 'partial' && !isSelected && (
                      <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-amber-500" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Legenda */}
            <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 text-xs text-slate-500">
              <div className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-red-100 dark:bg-red-900/30 border border-red-300" />
                <span>Dia bloqueado</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-amber-100 dark:bg-amber-900/30 border border-amber-300" />
                <span>Parcialmente bloqueado</span>
              </div>
            </div>
          </Card>

          {/* Slots do dia selecionado */}
          {selectedDate && (
            <Card className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white">
                    {formatDate(selectedDate, "EEEE, d 'de' MMMM")}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {selectedCount > 0 
                      ? `${selectedCount} horário(s) selecionado(s) para ${mode === 'block' ? 'bloquear' : 'desbloquear'}` 
                      : 'Clique nos horários para selecionar'}
                  </p>
                </div>
                <div className="flex gap-2">
                  {blockedCount > 0 && (
                    <Button 
                      variant={mode === 'unblock' ? 'default' : 'outline'} 
                      size="sm" 
                      onClick={selectAllBlockedSlots}
                      className={mode === 'unblock' ? 'bg-green-600 hover:bg-green-700' : ''}
                    >
                      <Unlock className="h-3 w-3 mr-1" />
                      Desbloquear
                    </Button>
                  )}
                  {freeCount > 0 && (
                    <Button 
                      variant={mode === 'block' ? 'default' : 'outline'} 
                      size="sm" 
                      onClick={selectAllFreeSlots}
                      className={mode === 'block' ? 'bg-red-600 hover:bg-red-700' : ''}
                    >
                      <Ban className="h-3 w-3 mr-1" />
                      Bloquear
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
                  mode === 'block' 
                    ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300' 
                    : 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                }`}>
                  {mode === 'block' 
                    ? '🔒 Modo: Bloquear horários livres' 
                    : '🔓 Modo: Desbloquear horários bloqueados'}
                </div>
              )}

              {loadingSlots ? (
                <div className="grid grid-cols-4 gap-2">
                  {[...Array(8)].map((_, i) => (
                    <Skeleton key={i} className="h-10" />
                  ))}
                </div>
              ) : daySlots.length === 0 ? (
                <EmptyState>Nenhum horário de trabalho configurado para este dia.</EmptyState>
              ) : (
                <>
                  <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                    {daySlots.map((slot, idx) => {
                      const canSelect = mode === 'block' ? !slot.blocked : slot.blocked;
                      
                      return (
                        <button
                          key={idx}
                          onClick={() => toggleSlot(idx)}
                          disabled={!canSelect}
                          className={`
                            relative p-2 rounded-lg text-sm font-medium transition-all
                            ${slot.blocked && !slot.selected
                              ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' 
                              : ''}
                            ${slot.blocked && slot.selected
                              ? 'bg-green-600 text-white ring-2 ring-green-400' 
                              : ''}
                            ${!slot.blocked && slot.selected
                              ? 'bg-blue-600 text-white'
                              : ''}
                            ${!slot.blocked && !slot.selected
                              ? 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
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
                    <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 flex gap-2">
                      {mode === 'block' ? (
                        <>
                          <Button 
                            className="flex-1 bg-red-600 hover:bg-red-700"
                            onClick={openConfirmModal}
                          >
                            <Ban className="h-4 w-4 mr-2" />
                            Bloquear {selectedCount} horário(s)
                          </Button>
                          {selectedCount === freeCount && (
                            <Button 
                              variant="outline"
                              className="text-red-600 border-red-600 hover:bg-red-50 dark:hover:bg-red-900/30"
                              onClick={() => setShowConfirmModal(true)}
                            >
                              Bloquear dia inteiro
                            </Button>
                          )}
                        </>
                      ) : (
                        <Button 
                          className="flex-1 bg-green-600 hover:bg-green-700"
                          onClick={openConfirmModal}
                        >
                          <Unlock className="h-4 w-4 mr-2" />
                          Desbloquear {selectedCount} horário(s)
                        </Button>
                      )}
                    </div>
                  )}
                </>
              )}
            </Card>
          )}
        </div>

        {/* Lista de bloqueios */}
        <Card className="overflow-hidden h-fit">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ban className="h-5 w-5 text-red-500" />
              Bloqueios futuros
            </CardTitle>
            <CardDescription>Horários bloqueados a partir de hoje</CardDescription>
          </CardHeader>
          <div className="max-h-[500px] overflow-y-auto border-t border-slate-200 dark:border-slate-700">
            {loading ? (
              <div className="space-y-3 p-6">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : blocks.length === 0 ? (
              <EmptyState className="m-4">Nenhum bloqueio programado.</EmptyState>
            ) : (
              <ul className="divide-y divide-slate-200 dark:divide-slate-700">
                {blocks.map((block) => (
                  <li key={block.id} className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-start gap-3">
                      <div className="rounded-lg bg-red-100 dark:bg-red-900/30 p-2">
                        {block.is_full_day ? (
                          <Calendar className="h-4 w-4 text-red-600 dark:text-red-400" />
                        ) : (
                          <Clock className="h-4 w-4 text-red-600 dark:text-red-400" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-sm text-slate-800 dark:text-slate-100">
                          {formatDate(new Date(block.blocked_date + 'T12:00:00'), "dd/MM/yyyy")}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {block.is_full_day ? (
                            'Dia inteiro'
                          ) : (
                            `${block.start_time?.slice(0, 5)} - ${block.end_time?.slice(0, 5)}`
                          )}
                        </p>
                        {block.reason && (
                          <p className="text-xs text-slate-400 dark:text-slate-500 italic">
                            {block.reason}
                          </p>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30"
                      onClick={() => handleDelete(block.id)}
                      disabled={deletingId === block.id}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>
      </div>

      {/* Modal de Confirmação */}
      <Modal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title={mode === 'block' ? 'Confirmar Bloqueio' : 'Confirmar Desbloqueio'}
      >
        <div className="space-y-4">
          {mode === 'block' ? (
            <>
              <p className="text-slate-600 dark:text-slate-400">
                Você está prestes a bloquear{' '}
                <strong className="text-slate-900 dark:text-white">
                  {selectedCount === freeCount ? 'o dia inteiro' : `${selectedCount} horário(s)`}
                </strong>{' '}
                em{' '}
                <strong className="text-slate-900 dark:text-white">
                  {selectedDate && formatDate(selectedDate, "dd/MM/yyyy")}
                </strong>.
              </p>

              <div className="space-y-2">
                <Label htmlFor="reason">Motivo (opcional)</Label>
                <Input
                  id="reason"
                  placeholder="Ex: Congresso médico, férias..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowConfirmModal(false)}
                >
                  Cancelar
                </Button>
                {selectedCount === freeCount ? (
                  <Button
                    className="flex-1 bg-red-600 hover:bg-red-700"
                    onClick={blockFullDay}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Bloqueando...' : 'Bloquear dia inteiro'}
                  </Button>
                ) : (
                  <Button
                    className="flex-1 bg-red-600 hover:bg-red-700"
                    onClick={confirmBlock}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Bloqueando...' : 'Confirmar bloqueio'}
                  </Button>
                )}
              </div>
            </>
          ) : (
            <>
              <p className="text-slate-600 dark:text-slate-400">
                Você está prestes a desbloquear{' '}
                <strong className="text-slate-900 dark:text-white">
                  {selectedCount} horário(s)
                </strong>{' '}
                em{' '}
                <strong className="text-slate-900 dark:text-white">
                  {selectedDate && formatDate(selectedDate, "dd/MM/yyyy")}
                </strong>.
              </p>
              
              <p className="text-sm text-amber-600 dark:text-amber-400">
                ⚠️ Os horários ficarão disponíveis para agendamento.
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
                  onClick={confirmUnblock}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Desbloqueando...' : 'Confirmar desbloqueio'}
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}
