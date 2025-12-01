import api from '@/lib/api';
import {
  fetchAdminPatients,
  createPatient,
  updatePatient,
  togglePatientStatus,
} from '../admin-patient-service';

jest.mock('@/lib/api');
const mockedApi = api as jest.Mocked<typeof api>;

describe('admin-patient-service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchAdminPatients', () => {
    it('deve buscar lista de pacientes', async () => {
      const mockData = {
        data: [
          { id: 1, name: 'João Silva', cpf: '123.456.789-00', birth_date: '1990-01-15' },
          { id: 2, name: 'Maria Santos', cpf: '987.654.321-00', birth_date: '1985-06-20' },
        ],
        meta: { current_page: 1, last_page: 1, per_page: 15, total: 2 },
      };
      mockedApi.get.mockResolvedValue({ data: mockData });

      const result = await fetchAdminPatients();

      expect(mockedApi.get).toHaveBeenCalledWith('/admin/patients', { params: undefined });
      expect(result.data).toHaveLength(2);
    });

    it('deve buscar com filtros', async () => {
      const mockData = { data: [], meta: { current_page: 1, total: 0 } };
      mockedApi.get.mockResolvedValue({ data: mockData });

      const params = { search: 'joão', is_active: true, page: 1 };
      await fetchAdminPatients(params);

      expect(mockedApi.get).toHaveBeenCalledWith('/admin/patients', { params });
    });
  });

  describe('createPatient', () => {
    it('deve criar paciente', async () => {
      const newPatient = {
        id: 3,
        name: 'Novo Paciente',
        email: 'novo@email.com',
        cpf: '111.222.333-44',
        birth_date: '2000-03-10',
      };
      mockedApi.post.mockResolvedValue({ data: { data: newPatient } });

      const payload = {
        name: 'Novo Paciente',
        email: 'novo@email.com',
        password: 'senha123',
        cpf: '111.222.333-44',
        birth_date: '2000-03-10',
      };
      const result = await createPatient(payload);

      expect(mockedApi.post).toHaveBeenCalledWith('/admin/patients', payload);
      expect(result.name).toBe('Novo Paciente');
    });

    it('deve criar paciente com convênios', async () => {
      const newPatient = { id: 4, name: 'Paciente Convênio' };
      mockedApi.post.mockResolvedValue({ data: { data: newPatient } });

      const payload = {
        name: 'Paciente Convênio',
        email: 'convenio@email.com',
        cpf: '555.666.777-88',
        health_insurance_ids: [1, 2],
        health_insurance_policy_numbers: { 1: '12345', 2: '67890' },
      };
      await createPatient(payload);

      expect(mockedApi.post).toHaveBeenCalledWith('/admin/patients', payload);
    });
  });

  describe('updatePatient', () => {
    it('deve atualizar paciente', async () => {
      const updatedPatient = {
        id: 1,
        name: 'João Silva Atualizado',
        phone: '11999887766',
      };
      mockedApi.put.mockResolvedValue({ data: { data: updatedPatient } });

      const payload = { name: 'João Silva Atualizado', phone: '11999887766' };
      const result = await updatePatient(1, payload);

      expect(mockedApi.put).toHaveBeenCalledWith('/admin/patients/1', payload);
      expect(result.name).toBe('João Silva Atualizado');
    });

    it('deve atualizar endereço do paciente', async () => {
      const updatedPatient = { id: 1, address: 'Rua Nova, 123' };
      mockedApi.put.mockResolvedValue({ data: { data: updatedPatient } });

      const payload = { address: 'Rua Nova, 123' };
      await updatePatient(1, payload);

      expect(mockedApi.put).toHaveBeenCalledWith('/admin/patients/1', payload);
    });
  });

  describe('togglePatientStatus', () => {
    it('deve alternar status do paciente', async () => {
      const toggledPatient = { id: 1, name: 'João', is_active: false };
      mockedApi.post.mockResolvedValue({ data: { data: toggledPatient } });

      const result = await togglePatientStatus(1);

      expect(mockedApi.post).toHaveBeenCalledWith('/admin/patients/1/toggle-active');
      expect((result as unknown as { is_active: boolean }).is_active).toBe(false);
    });
  });
});
