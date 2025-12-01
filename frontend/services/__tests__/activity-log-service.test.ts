import api from '@/lib/api';
import {
  fetchActivityLogs,
  exportActivityLogs,
} from '../activity-log-service';

jest.mock('@/lib/api');
const mockedApi = api as jest.Mocked<typeof api>;

describe('activity-log-service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchActivityLogs', () => {
    it('deve buscar logs de atividade', async () => {
      const mockData = {
        data: [
          { id: 1, action: 'login', user_id: 1, created_at: '2025-11-30' },
          { id: 2, action: 'appointment_created', user_id: 1, created_at: '2025-11-30' },
        ],
        meta: { current_page: 1, total: 2 },
      };
      mockedApi.get.mockResolvedValue({ data: mockData });

      const result = await fetchActivityLogs();

      expect(mockedApi.get).toHaveBeenCalledWith('/admin/activity-logs', { params: undefined });
      expect(result.data).toHaveLength(2);
    });

    it('deve buscar logs com filtros', async () => {
      const mockData = { data: [], meta: { current_page: 1, total: 0 } };
      mockedApi.get.mockResolvedValue({ data: mockData });

      const params = { user_id: 1, action: 'login', page: 1 };
      await fetchActivityLogs(params);

      expect(mockedApi.get).toHaveBeenCalledWith('/admin/activity-logs', { params });
    });
  });

  describe('exportActivityLogs', () => {
    it('deve exportar logs como blob', async () => {
      const mockBlob = new Blob(['csv,data'], { type: 'text/csv' });
      mockedApi.get.mockResolvedValue({ data: mockBlob });

      const result = await exportActivityLogs();

      expect(mockedApi.get).toHaveBeenCalledWith('/admin/activity-logs/export', {
        params: undefined,
        responseType: 'blob',
      });
      expect(result).toEqual(mockBlob);
    });

    it('deve exportar com parâmetros de filtro', async () => {
      const mockBlob = new Blob(['filtered,data'], { type: 'text/csv' });
      mockedApi.get.mockResolvedValue({ data: mockBlob });

      const params = { start_date: '2025-11-01', end_date: '2025-11-30' };
      await exportActivityLogs(params);

      expect(mockedApi.get).toHaveBeenCalledWith('/admin/activity-logs/export', {
        params,
        responseType: 'blob',
      });
    });
  });
});
