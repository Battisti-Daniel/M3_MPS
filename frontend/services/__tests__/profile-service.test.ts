import api from '@/lib/api';
import {
  fetchProfile,
  updateProfile,
  acceptPrivacyPolicy,
  requestDataErasure,
  exportUserData,
} from '../profile-service';

jest.mock('@/lib/api');
const mockedApi = api as jest.Mocked<typeof api>;

describe('profile-service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchProfile', () => {
    it('deve buscar perfil do usuário', async () => {
      const mockUser = { id: 1, name: 'Test User', email: 'test@test.com' };
      mockedApi.get.mockResolvedValue({ data: { data: mockUser } });

      const result = await fetchProfile();

      expect(mockedApi.get).toHaveBeenCalledWith('/profile');
      expect(result.name).toBe('Test User');
    });
  });

  describe('updateProfile', () => {
    it('deve atualizar perfil', async () => {
      const updatedUser = { id: 1, name: 'Updated Name', email: 'test@test.com' };
      mockedApi.put.mockResolvedValue({ data: { data: updatedUser } });

      const result = await updateProfile({ name: 'Updated Name' });

      expect(mockedApi.put).toHaveBeenCalledWith('/profile', { name: 'Updated Name' });
      expect(result.name).toBe('Updated Name');
    });
  });

  describe('acceptPrivacyPolicy', () => {
    it('deve aceitar política de privacidade', async () => {
      const mockResponse = { message: 'Política aceita', user: { id: 1 } };
      mockedApi.post.mockResolvedValue({ data: mockResponse });

      const result = await acceptPrivacyPolicy();

      expect(mockedApi.post).toHaveBeenCalledWith('/privacy/accept');
      expect(result.message).toBe('Política aceita');
    });
  });

  describe('requestDataErasure', () => {
    it('deve solicitar exclusão de dados', async () => {
      mockedApi.post.mockResolvedValue({ data: {} });

      await requestDataErasure();

      expect(mockedApi.post).toHaveBeenCalledWith('/privacy/request-erasure');
    });
  });

  describe('exportUserData', () => {
    it('deve exportar dados do usuário', async () => {
      const mockData = { user: { id: 1 }, appointments: [] };
      mockedApi.get.mockResolvedValue({ data: mockData });

      const result = await exportUserData();

      expect(mockedApi.get).toHaveBeenCalledWith('/privacy/export', { responseType: 'json' });
      expect(result).toEqual(mockData);
    });
  });
});
