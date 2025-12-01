/**
 * Utilitários de tradução para valores que vêm do backend em inglês
 */

// Traduções de roles (perfis de usuário)
export const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Administrador',
  DOCTOR: 'Médico',
  PATIENT: 'Paciente',
};

// Versão plural
export const ROLE_LABELS_PLURAL: Record<string, string> = {
  ADMIN: 'Administradores',
  DOCTOR: 'Médicos',
  PATIENT: 'Pacientes',
};

/**
 * Traduz o role do usuário para português
 */
export function getRoleLabel(role: string | null | undefined, plural = false): string {
  if (!role) return 'Desconhecido';
  const labels = plural ? ROLE_LABELS_PLURAL : ROLE_LABELS;
  return labels[role.toUpperCase()] ?? role;
}

// Traduções de status de consulta
export const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendente',
  CONFIRMED: 'Confirmada',
  COMPLETED: 'Concluída',
  CANCELLED: 'Cancelada',
  NO_SHOW: 'Não compareceu',
};

/**
 * Traduz o status da consulta para português
 */
export function getAppointmentStatusLabel(status: string | null | undefined): string {
  if (!status) return 'Desconhecido';
  return STATUS_LABELS[status.toUpperCase()] ?? status;
}

// Traduções de tipo de consulta
export const APPOINTMENT_TYPE_LABELS: Record<string, string> = {
  PRESENTIAL: 'Presencial',
  TELEMEDICINE: 'Telemedicina',
  HOME_VISIT: 'Visita domiciliar',
};

/**
 * Traduz o tipo de consulta para português
 */
export function getAppointmentTypeLabel(type: string | null | undefined): string {
  if (!type) return 'Não informado';
  return APPOINTMENT_TYPE_LABELS[type.toUpperCase()] ?? type;
}

// Traduções de canal de notificação
export const NOTIFICATION_CHANNEL_LABELS: Record<string, string> = {
  EMAIL: 'E-mail',
  SMS: 'SMS',
  IN_APP: 'Notificação no app',
  WHATSAPP: 'WhatsApp',
};

/**
 * Traduz o canal de notificação para português
 */
export function getNotificationChannelLabel(channel: string | null | undefined): string {
  if (!channel) return 'Desconhecido';
  return NOTIFICATION_CHANNEL_LABELS[channel.toUpperCase()] ?? channel;
}

// Traduções de tipo de notificação
export const NOTIFICATION_TYPE_LABELS: Record<string, string> = {
  REMINDER: 'Lembrete',
  CONFIRMATION: 'Confirmação',
  CANCELLATION: 'Cancelamento',
  RESCHEDULING: 'Reagendamento',
  GENERAL: 'Geral',
};

/**
 * Traduz o tipo de notificação para português
 */
export function getNotificationTypeLabel(type: string | null | undefined): string {
  if (!type) return 'Desconhecido';
  return NOTIFICATION_TYPE_LABELS[type.toUpperCase()] ?? type;
}
