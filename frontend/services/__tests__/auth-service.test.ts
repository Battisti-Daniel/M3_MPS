import api from '@/lib/api';
import {
  login,
  registerPatient,
  registerDoctor,
  checkAvailability,
  logout,
} from '../auth-service';

jest.mock('@/lib/api');
const mockedApi = api as jest.Mocked<typeof api>;

describe('auth-service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('deve fazer login com sucesso', async () => {
      const mockResponse = {
        data: {
          token: 'jwt-token-123',
          user: { id: 1, name: 'Test User', email: 'test@test.com' },
        },
      };
      mockedApi.post.mockResolvedValue(mockResponse);

      const result = await login({ email: 'test@test.com', password: 'password123' });

      expect(mockedApi.post).toHaveBeenCalledWith('/auth/login', {
        email: 'test@test.com',
        password: 'password123',
      });
      expect(result.token).toBe('jwt-token-123');
      expect(result.user.email).toBe('test@test.com');
    });

    it('deve propagar erro de login', async () => {
      mockedApi.post.mockRejectedValue(new Error('Invalid credentials'));

      await expect(login({ email: 'test@test.com', password: 'wrong' }))
        .rejects.toThrow('Invalid credentials');
    });
  });

  describe('registerPatient', () => {
    it('deve registrar paciente com sucesso', async () => {
      const mockResponse = {
        data: {
          message: 'Paciente registrado com sucesso',
          user: { id: 2, name: 'New Patient' },
          token: 'new-token',
        },
      };
      mockedApi.post.mockResolvedValue(mockResponse);

      const payload = { name: 'New Patient', email: 'patient@test.com', password: '12345678' };
      const result = await registerPatient(payload);

      expect(mockedApi.post).toHaveBeenCalledWith('/auth/register', payload);
      expect(result.message).toBe('Paciente registrado com sucesso');
    });
  });

  describe('registerDoctor', () => {
    it('deve registrar médico com sucesso', async () => {
      const mockResponse = {
        data: {
          message: 'Médico registrado com sucesso',
          user: { id: 3, name: 'Dr. Test' },
        },
      };
      mockedApi.post.mockResolvedValue(mockResponse);

      const payload = { name: 'Dr. Test', email: 'doctor@test.com', crm: '12345-SP' };
      const result = await registerDoctor(payload);

      expect(mockedApi.post).toHaveBeenCalledWith('/auth/register/doctor', payload);
      expect(result.message).toBe('Médico registrado com sucesso');
    });
  });

  describe('checkAvailability', () => {
    it('deve verificar disponibilidade de email', async () => {
      const mockResponse = {
        data: { email_available: true },
      };
      mockedApi.post.mockResolvedValue(mockResponse);

      const result = await checkAvailability({ email: 'new@test.com' });

      expect(mockedApi.post).toHaveBeenCalledWith('/auth/check-availability', { email: 'new@test.com' });
      expect(result.email_available).toBe(true);
    });

    it('deve verificar disponibilidade de CPF', async () => {
      const mockResponse = {
        data: { cpf_available: false },
      };
      mockedApi.post.mockResolvedValue(mockResponse);

      const result = await checkAvailability({ cpf: '123.456.789-00' });

      expect(result.cpf_available).toBe(false);
    });
  });

  describe('logout', () => {
    it('deve fazer logout', async () => {
      mockedApi.post.mockResolvedValue({ data: {} });

      await logout();

      expect(mockedApi.post).toHaveBeenCalledWith('/auth/logout');
    });
  });
});
