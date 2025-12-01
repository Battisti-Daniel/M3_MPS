import api from '@/lib/api';
import { fetchPatientObservationHistory } from '../patient-observation-service';

jest.mock('@/lib/api');
const mockedApi = api as jest.Mocked<typeof api>;

describe('patient-observation-service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchPatientObservationHistory', () => {
    it('deve buscar histórico de observações do paciente', async () => {
      const mockObservations = [
        { id: 1, anamnesis: 'Consulta 1', appointment_id: 10 },
        { id: 2, anamnesis: 'Consulta 2', appointment_id: 20 },
      ];
      mockedApi.get.mockResolvedValue({ data: { data: mockObservations } });

      const result = await fetchPatientObservationHistory(5);

      expect(mockedApi.get).toHaveBeenCalledWith('/doctor/patients/5/observations');
      expect(result).toHaveLength(2);
      expect(result[0].anamnesis).toBe('Consulta 1');
    });

    it('deve retornar array vazio se data for undefined', async () => {
      mockedApi.get.mockResolvedValue({ data: { data: undefined } });

      const result = await fetchPatientObservationHistory(5);

      expect(result).toEqual([]);
    });

    it('deve retornar array vazio se data for null', async () => {
      mockedApi.get.mockResolvedValue({ data: { data: null } });

      const result = await fetchPatientObservationHistory(5);

      expect(result).toEqual([]);
    });
  });
});
