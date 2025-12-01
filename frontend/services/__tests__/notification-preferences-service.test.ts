import api from '@/lib/api';
import {
  fetchNotificationPreferences,
  updateNotificationPreferences,
} from '../notification-preferences-service';

jest.mock('@/lib/api');
const mockedApi = api as jest.Mocked<typeof api>;

describe('notification-preferences-service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchNotificationPreferences', () => {
    it('deve buscar preferências de notificação', async () => {
      const mockPreferences = {
        email: {
          appointment_reminder: true,
          appointment_confirmed: true,
          appointment_cancelled: false,
        },
        database: {
          appointment_reminder: true,
          appointment_confirmed: true,
          appointment_cancelled: true,
        },
      };
      mockedApi.get.mockResolvedValue({ data: { data: mockPreferences } });

      const result = await fetchNotificationPreferences();

      expect(mockedApi.get).toHaveBeenCalledWith('/notifications/preferences');
      expect(result.email.appointment_reminder).toBe(true);
      expect(result.email.appointment_cancelled).toBe(false);
    });
  });

  describe('updateNotificationPreferences', () => {
    it('deve atualizar preferências', async () => {
      mockedApi.put.mockResolvedValue({ data: {} });

      const preferences = [
        { channel: 'email', type: 'appointment_reminder', enabled: true },
        { channel: 'email', type: 'appointment_cancelled', enabled: false },
      ];
      await updateNotificationPreferences(preferences);

      expect(mockedApi.put).toHaveBeenCalledWith('/notifications/preferences', { preferences });
    });

    it('deve atualizar múltiplos canais', async () => {
      mockedApi.put.mockResolvedValue({ data: {} });

      const preferences = [
        { channel: 'email', type: 'appointment_reminder', enabled: false },
        { channel: 'database', type: 'appointment_reminder', enabled: true },
        { channel: 'sms', type: 'appointment_reminder', enabled: false },
      ];
      await updateNotificationPreferences(preferences);

      expect(mockedApi.put).toHaveBeenCalledWith('/notifications/preferences', { preferences });
    });
  });
});
