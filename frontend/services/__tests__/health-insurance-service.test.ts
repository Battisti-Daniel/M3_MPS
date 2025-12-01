import api from '@/lib/api';
import {
  fetchHealthInsurances,
  createHealthInsurance,
  updateHealthInsurance,
  deleteHealthInsurance,
  fetchHealthInsuranceStatistics,
} from '../health-insurance-service';

jest.mock('@/lib/api');
const mockedApi = api as jest.Mocked<typeof api>;

describe('health-insurance-service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchHealthInsurances', () => {
    it('deve buscar lista de convênios', async () => {
      const mockData = {
        data: [
          { id: 1, name: 'Unimed', coverage_percentage: 80, is_active: true },
          { id: 2, name: 'Bradesco Saúde', coverage_percentage: 70, is_active: true },
        ],
      };
      mockedApi.get.mockResolvedValue({ data: mockData });

      const result = await fetchHealthInsurances();

      expect(mockedApi.get).toHaveBeenCalledWith('/health-insurances');
      expect(result).toHaveLength(2);
    });
  });

  describe('createHealthInsurance', () => {
    it('deve criar convênio', async () => {
      const newInsurance = { id: 3, name: 'SulAmérica', coverage_percentage: 75, is_active: true };
      mockedApi.post.mockResolvedValue({ data: { data: newInsurance } });

      const result = await createHealthInsurance({
        name: 'SulAmérica',
        coverage_percentage: 75,
      });

      expect(mockedApi.post).toHaveBeenCalledWith('/health-insurances', {
        name: 'SulAmérica',
        coverage_percentage: 75,
      });
      expect(result.name).toBe('SulAmérica');
    });

    it('deve criar convênio sem percentual de cobertura', async () => {
      const newInsurance = { id: 4, name: 'Particular', coverage_percentage: null, is_active: true };
      mockedApi.post.mockResolvedValue({ data: { data: newInsurance } });

      await createHealthInsurance({ name: 'Particular' });

      expect(mockedApi.post).toHaveBeenCalledWith('/health-insurances', {
        name: 'Particular',
        coverage_percentage: null,
      });
    });
  });

  describe('updateHealthInsurance', () => {
    it('deve atualizar convênio', async () => {
      const updatedInsurance = { id: 1, name: 'Unimed Atualizado', coverage_percentage: 85 };
      mockedApi.put.mockResolvedValue({ data: { data: updatedInsurance } });

      const result = await updateHealthInsurance(1, {
        name: 'Unimed Atualizado',
        coverage_percentage: 85,
      });

      expect(mockedApi.put).toHaveBeenCalledWith('/health-insurances/1', {
        name: 'Unimed Atualizado',
        coverage_percentage: 85,
      });
      expect(result.coverage_percentage).toBe(85);
    });

    it('deve inativar convênio', async () => {
      const updatedInsurance = { id: 1, name: 'Unimed', is_active: false };
      mockedApi.put.mockResolvedValue({ data: { data: updatedInsurance } });

      const result = await updateHealthInsurance(1, { is_active: false });

      expect(result.is_active).toBe(false);
    });
  });

  describe('deleteHealthInsurance', () => {
    it('deve excluir convênio', async () => {
      mockedApi.delete.mockResolvedValue({ data: {} });

      await deleteHealthInsurance(1);

      expect(mockedApi.delete).toHaveBeenCalledWith('/health-insurances/1');
    });
  });

  describe('fetchHealthInsuranceStatistics', () => {
    it('deve buscar estatísticas', async () => {
      const mockStats = {
        total_beneficiaries: 150,
        total_active_insurances: 5,
        average_beneficiaries_per_insurance: 30,
      };
      mockedApi.get.mockResolvedValue({ data: mockStats });

      const result = await fetchHealthInsuranceStatistics();

      expect(mockedApi.get).toHaveBeenCalledWith('/admin/health-insurances/statistics');
      expect(result.total_beneficiaries).toBe(150);
    });
  });
});
