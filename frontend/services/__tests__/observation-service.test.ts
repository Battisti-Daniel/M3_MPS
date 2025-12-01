import api from '@/lib/api';
import {
  createObservation,
  getObservation,
  fetchPatientObservations,
} from '../observation-service';

jest.mock('@/lib/api');
const mockedApi = api as jest.Mocked<typeof api>;

describe('observation-service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createObservation', () => {
    it('deve criar observação para consulta', async () => {
      const mockObservation = {
        id: 1,
        appointment_id: 123,
        anamnesis: 'Paciente relata dor de cabeça',
        prescription: 'Paracetamol 500mg',
      };
      mockedApi.post.mockResolvedValue({ data: mockObservation });

      const payload = {
        anamnesis: 'Paciente relata dor de cabeça',
        prescription: 'Paracetamol 500mg',
      };
      const result = await createObservation(123, payload);

      expect(mockedApi.post).toHaveBeenCalledWith('/appointments/123/observations', payload);
      expect(result.anamnesis).toBe('Paciente relata dor de cabeça');
    });
  });

  describe('getObservation', () => {
    it('deve buscar observação de consulta', async () => {
      const mockObservation = {
        id: 1,
        appointment_id: 123,
        anamnesis: 'Dor de cabeça',
        prescription: 'Repouso',
      };
      mockedApi.get.mockResolvedValue({ data: { data: mockObservation } });

      const result = await getObservation(123);

      expect(mockedApi.get).toHaveBeenCalledWith('/appointments/123/observations');
      expect(result.appointment_id).toBe(123);
    });
  });

  describe('fetchPatientObservations', () => {
    it('deve buscar observações do paciente', async () => {
      const mockData = {
        data: [{ id: 1, anamnesis: 'Obs 1' }, { id: 2, anamnesis: 'Obs 2' }],
        meta: { current_page: 1, total: 2 },
      };
      mockedApi.get.mockResolvedValue({ data: mockData });

      const result = await fetchPatientObservations();

      expect(mockedApi.get).toHaveBeenCalledWith('/patient/observations', { params: undefined });
      expect(result.data).toHaveLength(2);
    });

    it('deve buscar com parâmetros', async () => {
      const mockData = { data: [], meta: { current_page: 1, total: 0 } };
      mockedApi.get.mockResolvedValue({ data: mockData });

      const params = { page: 2, per_page: 10 };
      await fetchPatientObservations(params);

      expect(mockedApi.get).toHaveBeenCalledWith('/patient/observations', { params });
    });
  });
});
