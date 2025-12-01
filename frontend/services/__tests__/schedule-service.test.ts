import api from '@/lib/api';
import {
  fetchDoctorSchedules,
  createSchedule,
  updateSchedule,
  deleteSchedule,
} from '../schedule-service';

jest.mock('@/lib/api');
const mockedApi = api as jest.Mocked<typeof api>;

describe('schedule-service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchDoctorSchedules', () => {
    it('deve buscar horários do médico', async () => {
      const mockData = {
        data: [
          { id: 1, day_of_week: 1, start_time: '08:00', end_time: '12:00', slot_duration_minutes: 30 },
          { id: 2, day_of_week: 2, start_time: '14:00', end_time: '18:00', slot_duration_minutes: 30 },
        ],
        meta: { current_page: 1, total: 2 },
      };
      mockedApi.get.mockResolvedValue({ data: mockData });

      const result = await fetchDoctorSchedules();

      expect(mockedApi.get).toHaveBeenCalledWith('/doctor/schedules');
      expect(result.data).toHaveLength(2);
    });
  });

  describe('createSchedule', () => {
    it('deve criar horário', async () => {
      const newSchedule = {
        id: 3,
        day_of_week: 3,
        start_time: '09:00',
        end_time: '17:00',
        slot_duration_minutes: 30,
        is_blocked: false,
      };
      mockedApi.post.mockResolvedValue({ data: newSchedule });

      const payload = {
        day_of_week: 3,
        start_time: '09:00',
        end_time: '17:00',
        slot_duration_minutes: 30,
      };
      const result = await createSchedule(payload);

      expect(mockedApi.post).toHaveBeenCalledWith('/doctor/schedules', payload);
      expect(result.day_of_week).toBe(3);
    });
  });

  describe('updateSchedule', () => {
    it('deve atualizar horário', async () => {
      const updatedSchedule = {
        id: 1,
        day_of_week: 1,
        start_time: '07:00',
        end_time: '15:00',
        slot_duration_minutes: 45,
      };
      mockedApi.put.mockResolvedValue({ data: updatedSchedule });

      const payload = { start_time: '07:00', end_time: '15:00', slot_duration_minutes: 45 };
      const result = await updateSchedule(1, payload);

      expect(mockedApi.put).toHaveBeenCalledWith('/doctor/schedules/1', payload);
      expect(result.slot_duration_minutes).toBe(45);
    });

    it('deve bloquear horário', async () => {
      const blockedSchedule = {
        id: 1,
        is_blocked: true,
        blocked_reason: 'Férias',
      };
      mockedApi.put.mockResolvedValue({ data: blockedSchedule });

      const result = await updateSchedule(1, { is_blocked: true, blocked_reason: 'Férias' });

      expect(result.is_blocked).toBe(true);
      expect(result.blocked_reason).toBe('Férias');
    });
  });

  describe('deleteSchedule', () => {
    it('deve excluir horário', async () => {
      mockedApi.delete.mockResolvedValue({ data: {} });

      await deleteSchedule(1);

      expect(mockedApi.delete).toHaveBeenCalledWith('/doctor/schedules/1');
    });
  });
});
