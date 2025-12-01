import api from '@/lib/api';
import { fetchAdminUsers, exportAdminUsers } from '../admin-user-service';

jest.mock('@/lib/api');
const mockedApi = api as jest.Mocked<typeof api>;

describe('admin-user-service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchAdminUsers', () => {
    it('deve buscar usuários com resumo', async () => {
      const mockData = {
        data: [
          { id: 1, name: 'Admin', role: 'ADMIN' },
          { id: 2, name: 'Doctor', role: 'DOCTOR' },
        ],
        meta: { current_page: 1, last_page: 1, per_page: 15, total: 2 },
        summary: {
          total: 50,
          active: 45,
          inactive: 5,
          by_role: { ADMIN: 2, DOCTOR: 10, PATIENT: 38 },
        },
      };
      mockedApi.get.mockResolvedValue({ data: mockData });

      const result = await fetchAdminUsers();

      expect(mockedApi.get).toHaveBeenCalledWith('/admin/users', { params: undefined });
      expect(result.data).toHaveLength(2);
      expect(result.summary.total).toBe(50);
    });

    it('deve buscar com filtros', async () => {
      const mockData = {
        data: [],
        meta: { current_page: 1, last_page: 1, per_page: 15, total: 0 },
        summary: { total: 0, active: 0, inactive: 0, by_role: { ADMIN: 0, DOCTOR: 0, PATIENT: 0 } },
      };
      mockedApi.get.mockResolvedValue({ data: mockData });

      const params = { role: 'DOCTOR', search: 'silva', page: 1 };
      await fetchAdminUsers(params);

      expect(mockedApi.get).toHaveBeenCalledWith('/admin/users', { params });
    });
  });

  describe('exportAdminUsers', () => {
    it('deve exportar usuários como blob', async () => {
      const mockBlob = new Blob(['id,name,email\n1,Test,test@test.com'], { type: 'text/csv' });
      mockedApi.get.mockResolvedValue({ data: mockBlob });

      const result = await exportAdminUsers();

      expect(mockedApi.get).toHaveBeenCalledWith('/admin/users/export', {
        params: undefined,
        responseType: 'blob',
      });
      expect(result).toBeInstanceOf(Blob);
    });

    it('deve converter string para blob se necessário', async () => {
      const csvString = 'id,name,email\n1,Test,test@test.com';
      mockedApi.get.mockResolvedValue({ data: csvString });

      const result = await exportAdminUsers();

      expect(result).toBeInstanceOf(Blob);
    });
  });
});
