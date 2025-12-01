import api from '@/lib/api';
import {
  fetchDoctors,
  fetchDoctor,
  fetchAvailableSlots,
  fetchAvailableDates,
} from '../doctor-service';

jest.mock('@/lib/api');
const mockedApi = api as jest.Mocked<typeof api>;

describe('doctor-service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchDoctors', () => {
    it('deve buscar lista de médicos', async () => {
      const mockData = {
        data: [
          { id: 1, name: 'Dr. Silva', specialty: 'Cardiologia' },
          { id: 2, name: 'Dra. Santos', specialty: 'Dermatologia' },
        ],
        meta: { current_page: 1, total: 2 },
      };
      mockedApi.get.mockResolvedValue({ data: mockData });

      const result = await fetchDoctors();

      expect(mockedApi.get).toHaveBeenCalledWith('/doctors', { params: undefined });
      expect(result.data).toHaveLength(2);
    });

    it('deve buscar médicos com filtros', async () => {
      const mockData = { data: [], meta: { current_page: 1, total: 0 } };
      mockedApi.get.mockResolvedValue({ data: mockData });

      const params = { specialty: 'Cardiologia', active: true };
      await fetchDoctors(params);

      expect(mockedApi.get).toHaveBeenCalledWith('/doctors', { params });
    });
  });

  describe('fetchDoctor', () => {
    it('deve buscar médico por ID', async () => {
      const mockDoctor = { id: 1, name: 'Dr. Silva', crm: '12345-SP' };
      mockedApi.get.mockResolvedValue({ data: mockDoctor });

      const result = await fetchDoctor(1);

      expect(mockedApi.get).toHaveBeenCalledWith('/doctors/1');
      expect(result.name).toBe('Dr. Silva');
    });
  });

  describe('fetchAvailableSlots', () => {
    it('deve buscar horários disponíveis', async () => {
      const mockSlots = {
        available_slots: ['09:00', '09:30', '10:00'],
        busy_slots: ['10:30', '11:00'],
        all_slots: [
          { time: '09:00', available: true },
          { time: '09:30', available: true },
          { time: '10:00', available: true },
          { time: '10:30', available: false },
          { time: '11:00', available: false },
        ],
        date: '2025-12-01',
        doctor_id: 1,
        schedule: { start_time: '09:00', end_time: '17:00' },
      };
      mockedApi.get.mockResolvedValue({ data: mockSlots });

      const result = await fetchAvailableSlots(1, '2025-12-01');

      expect(mockedApi.get).toHaveBeenCalledWith('/doctors/1/available-slots', {
        params: { date: '2025-12-01', duration: 30 },
      });
      expect(result.available_slots).toHaveLength(3);
    });

    it('deve buscar horários com duração personalizada', async () => {
      const mockSlots = {
        available_slots: ['09:00', '10:00'],
        busy_slots: [],
        all_slots: [],
        date: '2025-12-01',
        doctor_id: 1,
      };
      mockedApi.get.mockResolvedValue({ data: mockSlots });

      await fetchAvailableSlots(1, '2025-12-01', 60);

      expect(mockedApi.get).toHaveBeenCalledWith('/doctors/1/available-slots', {
        params: { date: '2025-12-01', duration: 60 },
      });
    });
  });

  describe('fetchAvailableDates', () => {
    it('deve buscar datas disponíveis', async () => {
      const mockDates = {
        available_dates: ['2025-12-01', '2025-12-02', '2025-12-03'],
        month: '2025-12',
        has_schedules: true,
      };
      mockedApi.get.mockResolvedValue({ data: mockDates });

      const result = await fetchAvailableDates(1);

      expect(mockedApi.get).toHaveBeenCalledWith('/doctors/1/available-dates', { params: {} });
      expect(result.available_dates).toHaveLength(3);
    });

    it('deve buscar datas para mês específico', async () => {
      const mockDates = {
        available_dates: [],
        month: '2026-01',
        has_schedules: false,
        message: 'Médico sem agenda configurada',
      };
      mockedApi.get.mockResolvedValue({ data: mockDates });

      const result = await fetchAvailableDates(1, '2026-01');

      expect(mockedApi.get).toHaveBeenCalledWith('/doctors/1/available-dates', {
        params: { month: '2026-01' },
      });
      expect(result.has_schedules).toBe(false);
    });
  });
});
