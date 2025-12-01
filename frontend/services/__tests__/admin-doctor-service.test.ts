import api from '@/lib/api';
import {
  fetchAdminDoctors,
  createDoctor,
  updateDoctor,
  toggleDoctorStatus,
} from '../admin-doctor-service';

jest.mock('@/lib/api');
const mockedApi = api as jest.Mocked<typeof api>;

describe('admin-doctor-service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchAdminDoctors', () => {
    it('deve buscar lista de médicos', async () => {
      const mockData = {
        data: [
          { id: 1, name: 'Dr. Silva', crm: '12345-SP', specialty: 'Cardiologia' },
          { id: 2, name: 'Dra. Santos', crm: '67890-SP', specialty: 'Dermatologia' },
        ],
        meta: { current_page: 1, last_page: 1, per_page: 15, total: 2 },
      };
      mockedApi.get.mockResolvedValue({ data: mockData });

      const result = await fetchAdminDoctors();

      expect(mockedApi.get).toHaveBeenCalledWith('/admin/doctors', { params: undefined });
      expect(result.data).toHaveLength(2);
    });

    it('deve buscar com filtros', async () => {
      const mockData = { data: [], meta: { current_page: 1, total: 0 } };
      mockedApi.get.mockResolvedValue({ data: mockData });

      const params = { specialty: 'Cardiologia', is_active: true };
      await fetchAdminDoctors(params);

      expect(mockedApi.get).toHaveBeenCalledWith('/admin/doctors', { params });
    });
  });

  describe('createDoctor', () => {
    it('deve criar médico', async () => {
      const newDoctor = {
        id: 3,
        name: 'Dr. Novo',
        email: 'novo@clinica.com',
        crm: '11111-SP',
        specialty: 'Ortopedia',
      };
      mockedApi.post.mockResolvedValue({ data: { data: newDoctor } });

      const payload = {
        name: 'Dr. Novo',
        email: 'novo@clinica.com',
        password: 'senha123',
        crm: '11111-SP',
        specialty: 'Ortopedia',
      };
      const result = await createDoctor(payload);

      expect(mockedApi.post).toHaveBeenCalledWith('/admin/doctors', payload);
      expect(result.name).toBe('Dr. Novo');
    });
  });

  describe('updateDoctor', () => {
    it('deve atualizar médico', async () => {
      const updatedDoctor = {
        id: 1,
        name: 'Dr. Silva Atualizado',
        specialty: 'Cardiologia Intervencionista',
      };
      mockedApi.put.mockResolvedValue({ data: { data: updatedDoctor } });

      const payload = { name: 'Dr. Silva Atualizado', specialty: 'Cardiologia Intervencionista' };
      const result = await updateDoctor(1, payload);

      expect(mockedApi.put).toHaveBeenCalledWith('/admin/doctors/1', payload);
      expect(result.specialty).toBe('Cardiologia Intervencionista');
    });

    it('deve atualizar convênios do médico', async () => {
      const updatedDoctor = { id: 1, health_insurance_ids: [1, 2, 3] };
      mockedApi.put.mockResolvedValue({ data: { data: updatedDoctor } });

      const payload = { health_insurance_ids: [1, 2, 3] };
      await updateDoctor(1, payload);

      expect(mockedApi.put).toHaveBeenCalledWith('/admin/doctors/1', payload);
    });
  });

  describe('toggleDoctorStatus', () => {
    it('deve alternar status do médico', async () => {
      const toggledDoctor = { id: 1, name: 'Dr. Silva', is_active: false };
      mockedApi.post.mockResolvedValue({ data: { data: toggledDoctor } });

      const result = await toggleDoctorStatus(1);

      expect(mockedApi.post).toHaveBeenCalledWith('/admin/doctors/1/toggle-active');
      expect(result.is_active).toBe(false);
    });
  });
});
