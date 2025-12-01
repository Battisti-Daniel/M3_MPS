'use client';

import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { handleApiError } from "@/lib/handle-api-error";
import {
  fetchNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "@/services/notification-service";
import {
  fetchNotificationPreferences,
  updateNotificationPreferences,
} from "@/services/notification-preferences-service";
import { Notification } from "@/types";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [view, setView] = useState<"inbox" | "preferences">("inbox");
  const [preferences, setPreferences] = useState<Record<string, Record<string, boolean>>>({});
  const [loadingPreferences, setLoadingPreferences] = useState(true);
  const [savingPreferences, setSavingPreferences] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.dispatchEvent(new CustomEvent<number>("notifications:updated", { detail: unreadCount }));
  }, [unreadCount]);
  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetchNotifications({ per_page: 50 });
      const entries = response.data ?? [];
      setNotifications(entries);
      const unread = response.meta.unread_count ?? entries.filter((item) => !item.is_read).length;
      setUnreadCount(unread);
    } catch (error) {
      handleApiError(error, "Não foi possível carregar as notificações");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadNotifications();
  }, [loadNotifications]);

  const loadPreferences = useCallback(async () => {
    try {
      setLoadingPreferences(true);
      const data = await fetchNotificationPreferences();
      setPreferences(data);
    } catch (error) {
      handleApiError(error, "Não foi possível carregar as preferências");
    } finally {
      setLoadingPreferences(false);
    }
  }, []);

  useEffect(() => {
    void loadPreferences();
  }, [loadPreferences]);

  const handleMarkAsRead = async (notification: Notification) => {
    if (notification.is_read) {
      return;
    }

    try {
      setProcessingId(notification.id);
      const updated = await markNotificationAsRead(notification.id);
      const next = notifications.map((item) => (item.id === updated.id ? updated : item));
      setNotifications(next);
      setUnreadCount(next.filter((item) => !item.is_read).length);
    } catch (error) {
      handleApiError(error, "Não foi possível marcar como lida");
    } finally {
      setProcessingId(null);
    }
  };

  const handleMarkAll = async () => {
    try {
      setProcessingId(-1);
      await markAllNotificationsAsRead();
      await loadNotifications();
      toast.success("Todas as notificações foram marcadas como lidas");
    } catch (error) {
      handleApiError(error, "Não foi possível marcar todas como lidas");
    } finally {
      setProcessingId(null);
    }
  };

  const channelLabels = useMemo(
    () => ({
      EMAIL: "E-mail",
      SMS: "SMS",
      IN_APP: "Notificações in-app",
    }),
    [],
  );

  const typeLabels = useMemo(
    () => ({
      REMINDER: "Lembretes",
      CONFIRMATION: "Confirmações",
      CANCELLATION: "Cancelamentos",
      RESCHEDULING: "Remarcações",
    }),
    [],
  );

  const togglePreference = (channel: string, type: string) => {
    setPreferences((prev) => ({
      ...prev,
      [channel]: {
        ...prev[channel],
        [type]: !prev[channel]?.[type],
      },
    }));
  };

  const handleSavePreferences = async () => {
    try {
      setSavingPreferences(true);
      const payload = Object.entries(preferences).flatMap(([channel, types]) =>
        Object.entries(types).map(([type, enabled]) => ({
          channel,
          type,
          enabled,
        })),
      );
      await updateNotificationPreferences(payload);
      toast.success("Preferências salvas com sucesso");
    } catch (error) {
      handleApiError(error, "Não foi possível atualizar as preferências");
    } finally {
      setSavingPreferences(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Notificações</CardTitle>
            <CardDescription>
              Você possui {unreadCount} notificação{unreadCount !== 1 ? 's' : ''} não lida{unreadCount !== 1 ? 's' : ''}.
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={view === "inbox" ? "secondary" : "outline"}
              onClick={() => setView("inbox")}
            >
              Caixa de entrada
            </Button>
            <Button
              variant={view === "preferences" ? "secondary" : "outline"}
              onClick={() => setView("preferences")}
            >
              Preferências
            </Button>
          </div>
        </CardHeader>
      </Card>

      {view === "inbox" ? (
        <Card className="overflow-hidden">
          <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>Histórico</CardTitle>
              <CardDescription>Mensagens importantes sobre sua agenda.</CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => loadNotifications()} disabled={loading}>
                Atualizar
              </Button>
              <Button
                variant="secondary"
                onClick={handleMarkAll}
                disabled={processingId === -1 || unreadCount === 0}
              >
                Marcar todas como lidas
              </Button>
            </div>
          </CardHeader>
          <div className="max-h-[600px] overflow-y-auto border-t border-border">
            {loading ? (
              <div className="space-y-3 p-6">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            ) : notifications.length === 0 ? (
              <EmptyState className="m-6">Nenhuma notificação encontrada.</EmptyState>
            ) : (
              <ul className="divide-y divide-border">
                {notifications.map((notification) => (
                  <li 
                    key={notification.id} 
                    className={`p-4 md:p-6 transition-colors ${
                      !notification.is_read 
                        ? 'bg-blue-50/50 dark:bg-blue-950/20' 
                        : 'hover:bg-muted/50'
                    }`}
                  >
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      {/* Conteúdo principal */}
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex items-start gap-3">
                          {/* Ícone de status */}
                          <div className={`mt-0.5 flex-shrink-0 w-2 h-2 rounded-full ${
                            !notification.is_read ? 'bg-blue-500' : 'bg-green-500'
                          }`} />
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-foreground">
                              {notification.subject}
                            </h3>
                            <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                              {notification.message}
                            </p>
                          </div>
                        </div>
                        
                        {/* Metadados */}
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground pl-5">
                          <span>
                            {notification.is_suppressed
                              ? "⚠️ Envio suprimido"
                              : notification.sent_at
                                ? `📤 ${new Date(notification.sent_at).toLocaleString("pt-BR", {
                                    dateStyle: "short",
                                    timeStyle: "short",
                                  })}`
                                : "⏳ Processando..."}
                          </span>
                          {notification.is_read && notification.read_at && (
                            <span>
                              ✓ Lida em {new Date(notification.read_at).toLocaleString("pt-BR", {
                                dateStyle: "short",
                                timeStyle: "short",
                              })}
                            </span>
                          )}
                        </div>
                        
                        {notification.error_message && (
                          <p className="text-xs text-red-500 pl-5">
                            ❌ {notification.error_message}
                          </p>
                        )}
                      </div>
                      
                      {/* Ações */}
                      <div className="flex items-center gap-2 md:flex-col md:items-end pl-5 md:pl-0">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            notification.is_read
                              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                              : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                          }`}
                        >
                          {notification.is_read ? "Lida" : "Nova"}
                        </span>
                        {!notification.is_read && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleMarkAsRead(notification)}
                            disabled={processingId === notification.id}
                          >
                            Marcar como lida
                          </Button>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>
      ) : (
        <Card>
          <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>Preferências de notificações</CardTitle>
              <CardDescription>
                Escolha quais tipos de mensagens deseja receber em cada canal.
              </CardDescription>
            </div>
            <Button
              variant="secondary"
              onClick={handleSavePreferences}
              disabled={savingPreferences || loadingPreferences}
            >
              Salvar preferências
            </Button>
          </CardHeader>
          <div className="space-y-4 p-6 pt-0">
            {loadingPreferences ? (
              <div className="space-y-3">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            ) : (
              Object.entries(preferences).map(([channel, types]) => (
                <div key={channel} className="rounded-lg border border-border p-4">
                  <h3 className="text-sm font-semibold text-foreground">
                    {channelLabels[channel as keyof typeof channelLabels] ?? channel}
                  </h3>
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    {Object.entries(types).map(([type, enabled]) => (
                      <label
                        key={type}
                        className="flex items-center justify-between rounded-md border border-border bg-background px-3 py-2 text-sm cursor-pointer hover:bg-muted/50 transition-colors"
                      >
                        <span className="text-foreground">{typeLabels[type as keyof typeof typeLabels] ?? type}</span>
                        <input
                          type="checkbox"
                          checked={enabled}
                          onChange={() => togglePreference(channel, type)}
                          className="h-4 w-4 rounded border-input"
                        />
                      </label>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      )}
    </div>
  );
}


