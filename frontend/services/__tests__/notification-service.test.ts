import api from '@/lib/api';
import {
  fetchNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '../notification-service';

jest.mock('@/lib/api');
const mockedApi = api as jest.Mocked<typeof api>;

describe('notification-service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchNotifications', () => {
    it('deve buscar notificações', async () => {
      const mockData = {
        data: [
          { id: 1, type: 'appointment_reminder', read_at: null },
          { id: 2, type: 'appointment_confirmed', read_at: '2025-11-30' },
        ],
        meta: { current_page: 1, total: 2 },
      };
      mockedApi.get.mockResolvedValue({ data: mockData });

      const result = await fetchNotifications();

      expect(mockedApi.get).toHaveBeenCalledWith('/notifications', { params: undefined });
      expect(result.data).toHaveLength(2);
    });

    it('deve buscar notificações com parâmetros', async () => {
      const mockData = { data: [], meta: { current_page: 1, total: 0 } };
      mockedApi.get.mockResolvedValue({ data: mockData });

      const params = { unread: true, page: 1 };
      await fetchNotifications(params);

      expect(mockedApi.get).toHaveBeenCalledWith('/notifications', { params });
    });
  });

  describe('markNotificationAsRead', () => {
    it('deve marcar notificação como lida', async () => {
      const mockNotification = { id: 1, read_at: '2025-11-30T10:00:00' };
      mockedApi.post.mockResolvedValue({ data: { data: mockNotification } });

      const result = await markNotificationAsRead(1);

      expect(mockedApi.post).toHaveBeenCalledWith('/notifications/1/read');
      expect(result.read_at).toBeTruthy();
    });
  });

  describe('markAllNotificationsAsRead', () => {
    it('deve marcar todas as notificações como lidas', async () => {
      mockedApi.post.mockResolvedValue({ data: {} });

      await markAllNotificationsAsRead();

      expect(mockedApi.post).toHaveBeenCalledWith('/notifications/read-all');
    });
  });
});
