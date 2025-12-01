'use client';

import { useEffect, useState } from "react";

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { handleApiError } from "@/lib/handle-api-error";
import { fetchPatientObservations } from "@/services/observation-service";
import { Observation } from "@/types";

export default function PatientObservationsPage() {
  const [observations, setObservations] = useState<Observation[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const response = await fetchPatientObservations({ per_page: 50 });
        setObservations(response.data ?? []);
      } catch (error) {
        handleApiError(error, 'Não foi possível carregar o histórico');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const toggleExpand = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const getStatusBadge = (status?: string) => {
    const styles: Record<string, string> = {
      COMPLETED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      CONFIRMED: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      CANCELLED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    };
    const labels: Record<string, string> = {
      COMPLETED: 'Realizada',
      CONFIRMED: 'Confirmada',
      PENDING: 'Pendente',
      CANCELLED: 'Cancelada',
    };
    return {
      style: styles[status ?? 'COMPLETED'] ?? styles.COMPLETED,
      label: labels[status ?? 'COMPLETED'] ?? status,
    };
  };

  const getTypeBadge = (type?: string) => {
    if (type === 'TELEMEDICINE') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
          🖥️ Telemedicina
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
        🏥 Presencial
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Histórico Clínico</CardTitle>
          <CardDescription>
            Observações e registros médicos das suas consultas realizadas.
          </CardDescription>
        </CardHeader>
      </Card>

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      ) : observations.length === 0 ? (
        <Card>
          <div className="p-6">
            <EmptyState>
              Nenhuma observação médica registrada até o momento.
              <br />
              <span className="text-sm text-muted-foreground">
                Após suas consultas, os registros médicos aparecerão aqui.
              </span>
            </EmptyState>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {observations.map((observation) => {
            const status = getStatusBadge(observation.appointment?.status);
            const isExpanded = expandedId === observation.id;
            
            return (
              <Card 
                key={observation.id} 
                className="overflow-hidden transition-all hover:shadow-md cursor-pointer"
                onClick={() => toggleExpand(observation.id)}
              >
                {/* Cabeçalho */}
                <div className="p-4 md:p-6">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    {/* Info do médico e data */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <span className="text-lg">👨‍⚕️</span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground">
                            Dr(a). {observation.doctor?.user?.name ?? observation.doctor?.name ?? 'Profissional'}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {observation.doctor?.specialty ?? 'Especialidade não informada'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          📅 {observation.appointment
                            ? new Date(observation.appointment.scheduled_at).toLocaleDateString('pt-BR', {
                                weekday: 'long',
                                day: '2-digit',
                                month: 'long',
                                year: 'numeric',
                              })
                            : new Date(observation.created_at).toLocaleDateString('pt-BR')}
                        </span>
                        <span className="text-muted-foreground">•</span>
                        <span className="text-sm text-muted-foreground">
                          🕐 {observation.appointment
                            ? new Date(observation.appointment.scheduled_at).toLocaleTimeString('pt-BR', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : ''}
                        </span>
                      </div>
                    </div>

                    {/* Badges */}
                    <div className="flex flex-wrap items-center gap-2">
                      {getTypeBadge(observation.appointment?.type)}
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${status.style}`}>
                        {status.label}
                      </span>
                      <span className="text-muted-foreground">
                        {isExpanded ? '▲' : '▼'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Conteúdo expandido */}
                {isExpanded && (
                  <div className="border-t border-border bg-muted/30 p-4 md:p-6">
                    <div className="grid gap-4 md:grid-cols-2">
                      {/* Anamnese */}
                      {observation.anamnesis && (
                        <div className="rounded-lg border border-border bg-background p-4">
                          <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
                            <span className="text-blue-500">📋</span>
                            Anamnese
                          </h4>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {observation.anamnesis}
                          </p>
                        </div>
                      )}

                      {/* Diagnóstico */}
                      {observation.diagnosis && (
                        <div className="rounded-lg border border-border bg-background p-4">
                          <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
                            <span className="text-green-500">🔍</span>
                            Diagnóstico
                          </h4>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {observation.diagnosis}
                          </p>
                        </div>
                      )}

                      {/* Prescrição */}
                      {observation.prescription && (
                        <div className="rounded-lg border border-border bg-background p-4 md:col-span-2">
                          <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
                            <span className="text-orange-500">💊</span>
                            Prescrição Médica
                          </h4>
                          <p className="whitespace-pre-line text-sm text-muted-foreground leading-relaxed">
                            {observation.prescription}
                          </p>
                        </div>
                      )}

                      {/* Notas */}
                      {observation.notes && (
                        <div className="rounded-lg border border-border bg-background p-4 md:col-span-2">
                          <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
                            <span className="text-purple-500">📝</span>
                            Observações Adicionais
                          </h4>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {observation.notes}
                          </p>
                        </div>
                      )}

                      {/* Sem dados clínicos */}
                      {!observation.anamnesis && !observation.diagnosis && !observation.prescription && !observation.notes && (
                        <div className="md:col-span-2 text-center py-4">
                          <p className="text-sm text-muted-foreground">
                            Nenhum registro clínico disponível para esta consulta.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}


