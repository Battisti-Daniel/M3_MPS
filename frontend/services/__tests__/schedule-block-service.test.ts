import api from '@/lib/api';
import {
  fetchScheduleBlocks,
  createScheduleBlock,
  deleteScheduleBlock,
} from '../schedule-block-service';

jest.mock('@/lib/api');
const mockedApi = api as jest.Mocked<typeof api>;

describe('schedule-block-service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchScheduleBlocks', () => {
    it('deve buscar bloqueios de agenda', async () => {
      const mockData = {
        data: [
          { id: 1, blocked_date: '2025-12-01', is_full_day: true, reason: 'Férias' },
          { id: 2, blocked_date: '2025-12-15', start_time: '14:00', end_time: '18:00', is_full_day: false },
        ],
        meta: { current_page: 1, total: 2 },
      };
      mockedApi.get.mockResolvedValue({ data: mockData });

      const result = await fetchScheduleBlocks();

      expect(mockedApi.get).toHaveBeenCalledWith('/doctor/schedule-blocks', { params: undefined });
      expect(result.data).toHaveLength(2);
    });

    it('deve buscar com parâmetros', async () => {
      const mockData = { data: [], meta: { current_page: 1, total: 0 } };
      mockedApi.get.mockResolvedValue({ data: mockData });

      const params = { month: '2025-12' };
      await fetchScheduleBlocks(params);

      expect(mockedApi.get).toHaveBeenCalledWith('/doctor/schedule-blocks', { params });
    });
  });

  describe('createScheduleBlock', () => {
    it('deve criar bloqueio de dia inteiro', async () => {
      const mockBlock = {
        id: 3,
        blocked_date: '2025-12-25',
        is_full_day: true,
        reason: 'Natal',
      };
      mockedApi.post.mockResolvedValue({ data: { data: mockBlock } });

      const payload = { blocked_date: '2025-12-25', reason: 'Natal' };
      const result = await createScheduleBlock(payload);

      expect(mockedApi.post).toHaveBeenCalledWith('/doctor/schedule-blocks', payload);
      expect(result.data.reason).toBe('Natal');
    });

    it('deve criar bloqueio parcial', async () => {
      const mockBlock = {
        id: 4,
        blocked_date: '2025-12-26',
        start_time: '08:00',
        end_time: '12:00',
        is_full_day: false,
        reason: 'Consulta médica',
      };
      mockedApi.post.mockResolvedValue({ data: { data: mockBlock } });

      const payload = {
        blocked_date: '2025-12-26',
        start_time: '08:00',
        end_time: '12:00',
        reason: 'Consulta médica',
      };
      const result = await createScheduleBlock(payload);

      expect(mockedApi.post).toHaveBeenCalledWith('/doctor/schedule-blocks', payload);
      expect(result.data.is_full_day).toBe(false);
    });
  });

  describe('deleteScheduleBlock', () => {
    it('deve excluir bloqueio', async () => {
      mockedApi.delete.mockResolvedValue({ data: {} });

      await deleteScheduleBlock(1);

      expect(mockedApi.delete).toHaveBeenCalledWith('/doctor/schedule-blocks/1');
    });
  });
});
