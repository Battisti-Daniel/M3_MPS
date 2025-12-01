import api from '@/lib/api';
import {
  fetchSchedulingStatus,
  fetchAppointments,
  fetchAppointment,
  createAppointment,
  createAdminAppointment,
  confirmAppointment,
  cancelAppointment,
  rescheduleAppointment,
  completeAppointment,
  markNoShow,
} from '../appointment-service';

jest.mock('@/lib/api');
const mockedApi = api as jest.Mocked<typeof api>;

describe('appointment-service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchSchedulingStatus', () => {
    it('deve buscar status de agendamento', async () => {
      const mockStatus = {
        current_future_appointments: 2,
        max_allowed: 5,
        can_schedule: true,
        remaining_slots: 3,
        is_blocked: false,
        blocked_reason: null,
        consecutive_no_shows: 0,
      };
      mockedApi.get.mockResolvedValue({ data: mockStatus });

      const result = await fetchSchedulingStatus();

      expect(mockedApi.get).toHaveBeenCalledWith('/appointments/scheduling-status');
      expect(result.can_schedule).toBe(true);
      expect(result.remaining_slots).toBe(3);
    });
  });

  describe('fetchAppointments', () => {
    it('deve buscar consultas com parâmetros', async () => {
      const mockData = {
        data: [{ id: 1, status: 'PENDING' }],
        meta: { current_page: 1, total: 1 },
      };
      mockedApi.get.mockResolvedValue({ data: mockData });

      const params = { status: 'PENDING', page: 1 };
      const result = await fetchAppointments(params);

      expect(mockedApi.get).toHaveBeenCalledWith('/appointments', { params });
      expect(result.data).toHaveLength(1);
    });

    it('deve buscar consultas sem parâmetros', async () => {
      const mockData = { data: [], meta: { current_page: 1, total: 0 } };
      mockedApi.get.mockResolvedValue({ data: mockData });

      const result = await fetchAppointments();

      expect(mockedApi.get).toHaveBeenCalledWith('/appointments', { params: undefined });
      expect(result.data).toHaveLength(0);
    });
  });

  describe('fetchAppointment', () => {
    it('deve buscar consulta por ID', async () => {
      const mockAppointment = { id: 123, status: 'CONFIRMED' };
      mockedApi.get.mockResolvedValue({ data: { data: mockAppointment } });

      const result = await fetchAppointment(123);

      expect(mockedApi.get).toHaveBeenCalledWith('/appointments/123');
      expect(result.id).toBe(123);
    });
  });

  describe('createAppointment', () => {
    it('deve criar consulta', async () => {
      const newAppointment = { id: 1, status: 'PENDING' };
      mockedApi.post.mockResolvedValue({ data: { data: newAppointment } });

      const payload = { doctor_id: 1, scheduled_at: '2025-12-01 10:00:00' };
      const result = await createAppointment(payload);

      expect(mockedApi.post).toHaveBeenCalledWith('/appointments', payload);
      expect(result.status).toBe('PENDING');
    });
  });

  describe('createAdminAppointment', () => {
    it('deve criar consulta como admin', async () => {
      const newAppointment = { id: 2, status: 'CONFIRMED' };
      mockedApi.post.mockResolvedValue({ data: { data: newAppointment } });

      const payload = { doctor_id: 1, patient_id: 2, scheduled_at: '2025-12-01 10:00:00' };
      const result = await createAdminAppointment(payload);

      expect(mockedApi.post).toHaveBeenCalledWith('/admin/appointments', payload);
      expect(result.id).toBe(2);
    });
  });

  describe('confirmAppointment', () => {
    it('deve confirmar consulta', async () => {
      const confirmedAppointment = { id: 1, status: 'CONFIRMED' };
      mockedApi.post.mockResolvedValue({ data: { data: confirmedAppointment } });

      const result = await confirmAppointment(1);

      expect(mockedApi.post).toHaveBeenCalledWith('/appointments/1/confirm');
      expect(result.status).toBe('CONFIRMED');
    });
  });

  describe('cancelAppointment', () => {
    it('deve cancelar consulta com motivo', async () => {
      const cancelledAppointment = { id: 1, status: 'CANCELLED' };
      mockedApi.post.mockResolvedValue({ data: { data: cancelledAppointment } });

      const result = await cancelAppointment(1, 'Motivo do cancelamento');

      expect(mockedApi.post).toHaveBeenCalledWith('/appointments/1/cancel', { reason: 'Motivo do cancelamento' });
      expect(result.status).toBe('CANCELLED');
    });

    it('deve cancelar consulta sem motivo', async () => {
      const cancelledAppointment = { id: 1, status: 'CANCELLED' };
      mockedApi.post.mockResolvedValue({ data: { data: cancelledAppointment } });

      const result = await cancelAppointment(1);

      expect(mockedApi.post).toHaveBeenCalledWith('/appointments/1/cancel', { reason: undefined });
      expect(result.status).toBe('CANCELLED');
    });
  });

  describe('rescheduleAppointment', () => {
    it('deve remarcar consulta', async () => {
      const rescheduledAppointment = { id: 1, status: 'PENDING' };
      mockedApi.post.mockResolvedValue({ data: { data: rescheduledAppointment } });

      const payload = { scheduled_at: '2025-12-02 14:00:00' };
      const result = await rescheduleAppointment(1, payload);

      expect(mockedApi.post).toHaveBeenCalledWith('/appointments/1/reschedule', payload);
      expect(result.id).toBe(1);
    });
  });

  describe('completeAppointment', () => {
    it('deve completar consulta', async () => {
      const completedAppointment = { id: 1, status: 'COMPLETED' };
      mockedApi.post.mockResolvedValue({ data: { data: completedAppointment } });

      const result = await completeAppointment(1);

      expect(mockedApi.post).toHaveBeenCalledWith('/appointments/1/complete');
      expect(result.status).toBe('COMPLETED');
    });
  });

  describe('markNoShow', () => {
    it('deve marcar como não compareceu', async () => {
      const noShowAppointment = { id: 1, status: 'NO_SHOW' };
      mockedApi.post.mockResolvedValue({ data: { data: noShowAppointment } });

      const result = await markNoShow(1);

      expect(mockedApi.post).toHaveBeenCalledWith('/appointments/1/no-show');
      expect(result.status).toBe('NO_SHOW');
    });
  });
});
