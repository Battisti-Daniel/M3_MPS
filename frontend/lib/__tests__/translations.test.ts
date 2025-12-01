import {
  getRoleLabel,
  getAppointmentStatusLabel,
  getAppointmentTypeLabel,
  getNotificationChannelLabel,
  getNotificationTypeLabel,
  ROLE_LABELS,
  ROLE_LABELS_PLURAL,
  STATUS_LABELS,
  APPOINTMENT_TYPE_LABELS,
  NOTIFICATION_CHANNEL_LABELS,
  NOTIFICATION_TYPE_LABELS,
} from '../translations';

describe('translations', () => {
  describe('getRoleLabel', () => {
    it('deve traduzir ADMIN para Administrador', () => {
      expect(getRoleLabel('ADMIN')).toBe('Administrador');
    });

    it('deve traduzir DOCTOR para Médico', () => {
      expect(getRoleLabel('DOCTOR')).toBe('Médico');
    });

    it('deve traduzir PATIENT para Paciente', () => {
      expect(getRoleLabel('PATIENT')).toBe('Paciente');
    });

    it('deve retornar Desconhecido para null', () => {
      expect(getRoleLabel(null)).toBe('Desconhecido');
    });

    it('deve retornar Desconhecido para undefined', () => {
      expect(getRoleLabel(undefined)).toBe('Desconhecido');
    });

    it('deve funcionar com lowercase', () => {
      expect(getRoleLabel('admin')).toBe('Administrador');
    });

    it('deve retornar plural quando solicitado', () => {
      expect(getRoleLabel('ADMIN', true)).toBe('Administradores');
      expect(getRoleLabel('DOCTOR', true)).toBe('Médicos');
      expect(getRoleLabel('PATIENT', true)).toBe('Pacientes');
    });

    it('deve retornar o valor original se não encontrar tradução', () => {
      expect(getRoleLabel('UNKNOWN_ROLE')).toBe('UNKNOWN_ROLE');
    });
  });

  describe('getAppointmentStatusLabel', () => {
    it('deve traduzir PENDING para Pendente', () => {
      expect(getAppointmentStatusLabel('PENDING')).toBe('Pendente');
    });

    it('deve traduzir CONFIRMED para Confirmada', () => {
      expect(getAppointmentStatusLabel('CONFIRMED')).toBe('Confirmada');
    });

    it('deve traduzir COMPLETED para Concluída', () => {
      expect(getAppointmentStatusLabel('COMPLETED')).toBe('Concluída');
    });

    it('deve traduzir CANCELLED para Cancelada', () => {
      expect(getAppointmentStatusLabel('CANCELLED')).toBe('Cancelada');
    });

    it('deve traduzir NO_SHOW para Não compareceu', () => {
      expect(getAppointmentStatusLabel('NO_SHOW')).toBe('Não compareceu');
    });

    it('deve retornar Desconhecido para null', () => {
      expect(getAppointmentStatusLabel(null)).toBe('Desconhecido');
    });

    it('deve funcionar com lowercase', () => {
      expect(getAppointmentStatusLabel('pending')).toBe('Pendente');
    });
  });

  describe('getAppointmentTypeLabel', () => {
    it('deve traduzir PRESENTIAL para Presencial', () => {
      expect(getAppointmentTypeLabel('PRESENTIAL')).toBe('Presencial');
    });

    it('deve traduzir TELEMEDICINE para Telemedicina', () => {
      expect(getAppointmentTypeLabel('TELEMEDICINE')).toBe('Telemedicina');
    });

    it('deve traduzir HOME_VISIT para Visita domiciliar', () => {
      expect(getAppointmentTypeLabel('HOME_VISIT')).toBe('Visita domiciliar');
    });

    it('deve retornar Não informado para null', () => {
      expect(getAppointmentTypeLabel(null)).toBe('Não informado');
    });
  });

  describe('getNotificationChannelLabel', () => {
    it('deve traduzir EMAIL para E-mail', () => {
      expect(getNotificationChannelLabel('EMAIL')).toBe('E-mail');
    });

    it('deve traduzir SMS para SMS', () => {
      expect(getNotificationChannelLabel('SMS')).toBe('SMS');
    });

    it('deve traduzir IN_APP para Notificação no app', () => {
      expect(getNotificationChannelLabel('IN_APP')).toBe('Notificação no app');
    });

    it('deve retornar Desconhecido para null', () => {
      expect(getNotificationChannelLabel(null)).toBe('Desconhecido');
    });
  });

  describe('getNotificationTypeLabel', () => {
    it('deve traduzir REMINDER para Lembrete', () => {
      expect(getNotificationTypeLabel('REMINDER')).toBe('Lembrete');
    });

    it('deve traduzir CONFIRMATION para Confirmação', () => {
      expect(getNotificationTypeLabel('CONFIRMATION')).toBe('Confirmação');
    });

    it('deve traduzir CANCELLATION para Cancelamento', () => {
      expect(getNotificationTypeLabel('CANCELLATION')).toBe('Cancelamento');
    });

    it('deve retornar Desconhecido para null', () => {
      expect(getNotificationTypeLabel(null)).toBe('Desconhecido');
    });
  });

  describe('constantes de tradução', () => {
    it('ROLE_LABELS deve ter todas as roles', () => {
      expect(ROLE_LABELS).toHaveProperty('ADMIN');
      expect(ROLE_LABELS).toHaveProperty('DOCTOR');
      expect(ROLE_LABELS).toHaveProperty('PATIENT');
    });

    it('ROLE_LABELS_PLURAL deve ter todas as roles no plural', () => {
      expect(ROLE_LABELS_PLURAL.ADMIN).toBe('Administradores');
      expect(ROLE_LABELS_PLURAL.DOCTOR).toBe('Médicos');
      expect(ROLE_LABELS_PLURAL.PATIENT).toBe('Pacientes');
    });

    it('STATUS_LABELS deve ter todos os status', () => {
      expect(Object.keys(STATUS_LABELS)).toEqual(
        expect.arrayContaining(['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'])
      );
    });

    it('APPOINTMENT_TYPE_LABELS deve ter todos os tipos', () => {
      expect(Object.keys(APPOINTMENT_TYPE_LABELS)).toEqual(
        expect.arrayContaining(['PRESENTIAL', 'TELEMEDICINE', 'HOME_VISIT'])
      );
    });

    it('NOTIFICATION_CHANNEL_LABELS deve ter todos os canais', () => {
      expect(Object.keys(NOTIFICATION_CHANNEL_LABELS)).toEqual(
        expect.arrayContaining(['EMAIL', 'SMS', 'IN_APP', 'WHATSAPP'])
      );
    });

    it('NOTIFICATION_TYPE_LABELS deve ter todos os tipos', () => {
      expect(Object.keys(NOTIFICATION_TYPE_LABELS)).toEqual(
        expect.arrayContaining(['REMINDER', 'CONFIRMATION', 'CANCELLATION', 'RESCHEDULING', 'GENERAL'])
      );
    });
  });
});
