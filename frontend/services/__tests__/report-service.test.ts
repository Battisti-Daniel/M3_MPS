import api from '@/lib/api';
import {
  fetchAppointmentSummary,
  fetchDoctorOccupancy,
  fetchInsuranceUsage,
  fetchAppointmentsByDoctor,
  fetchCancellations,
  fetchTopPatients,
  downloadAppointmentsByDoctorPdf,
  downloadCancellationsPdf,
  downloadTopPatientsPdf,
} from '../report-service';

jest.mock('@/lib/api');
const mockedApi = api as jest.Mocked<typeof api>;

describe('report-service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchAppointmentSummary', () => {
    it('deve buscar resumo de consultas', async () => {
      const mockSummary = {
        start_date: '2025-11-01',
        end_date: '2025-11-30',
        total: 150,
        by_status: {
          COMPLETED: { total: 100, percentage: 66.67 },
          CANCELLED: { total: 30, percentage: 20 },
          PENDING: { total: 20, percentage: 13.33 },
        },
        trend: [
          { date: '2025-11-01', total: 5 },
          { date: '2025-11-02', total: 8 },
        ],
      };
      mockedApi.get.mockResolvedValue({ data: mockSummary });

      const result = await fetchAppointmentSummary();

      expect(mockedApi.get).toHaveBeenCalledWith('/admin/reports/appointments', { params: undefined });
      expect(result.total).toBe(150);
    });

    it('deve buscar com parâmetros de data', async () => {
      const mockSummary = { total: 50 };
      mockedApi.get.mockResolvedValue({ data: mockSummary });

      const params = { start_date: '2025-11-01', end_date: '2025-11-15' };
      await fetchAppointmentSummary(params);

      expect(mockedApi.get).toHaveBeenCalledWith('/admin/reports/appointments', { params });
    });
  });

  describe('fetchDoctorOccupancy', () => {
    it('deve buscar ocupação de médicos', async () => {
      const mockData = [
        { doctor_id: 1, doctor_name: 'Dr. Silva', total_appointments: 50, occupancy_rate: 75 },
        { doctor_id: 2, doctor_name: 'Dra. Santos', total_appointments: 40, occupancy_rate: 60 },
      ];
      mockedApi.get.mockResolvedValue({ data: { data: mockData } });

      const result = await fetchDoctorOccupancy();

      expect(mockedApi.get).toHaveBeenCalledWith('/admin/reports/doctor-occupancy', { params: undefined });
      expect(result).toHaveLength(2);
      expect(result[0].occupancy_rate).toBe(75);
    });
  });

  describe('fetchInsuranceUsage', () => {
    it('deve buscar uso de convênios', async () => {
      const mockData = [
        { health_insurance_id: 1, name: 'Unimed', total_appointments: 80 },
        { health_insurance_id: 2, name: 'Particular', total_appointments: 40 },
      ];
      mockedApi.get.mockResolvedValue({ data: { data: mockData } });

      const result = await fetchInsuranceUsage();

      expect(mockedApi.get).toHaveBeenCalledWith('/admin/reports/insurance-usage', { params: undefined });
      expect(result).toHaveLength(2);
    });
  });

  describe('fetchAppointmentsByDoctor', () => {
    it('deve buscar consultas por médico', async () => {
      const mockReport = {
        start_date: '2025-11-01',
        end_date: '2025-11-30',
        summary: {
          total_appointments: 200,
          completed: 150,
          scheduled: 30,
          total_revenue: 50000,
          pending_revenue: 10000,
        },
        by_doctor: [
          { doctor_id: 1, doctor_name: 'Dr. Silva', total: 100, completion_rate: 80 },
        ],
        by_specialty: [
          { specialty: 'Cardiologia', total: 80, completion_rate: 85 },
        ],
      };
      mockedApi.get.mockResolvedValue({ data: mockReport });

      const result = await fetchAppointmentsByDoctor();

      expect(mockedApi.get).toHaveBeenCalledWith('/admin/reports/appointments-by-doctor', { params: undefined });
      expect(result.summary.total_appointments).toBe(200);
    });
  });

  describe('fetchCancellations', () => {
    it('deve buscar relatório de cancelamentos', async () => {
      const mockReport = {
        start_date: '2025-11-01',
        end_date: '2025-11-30',
        summary: {
          total_appointments: 100,
          cancelled: 15,
          no_show: 5,
          cancellation_rate: 15,
          no_show_rate: 5,
          reschedule_rate: 10,
        },
        cancellation_reasons: [
          { reason: 'Imprevisto pessoal', count: 10 },
          { reason: 'Doença', count: 5 },
        ],
        by_day_of_week: { Monday: 3, Tuesday: 2 },
        by_doctor: [],
      };
      mockedApi.get.mockResolvedValue({ data: mockReport });

      const result = await fetchCancellations();

      expect(mockedApi.get).toHaveBeenCalledWith('/admin/reports/cancellations', { params: undefined });
      expect(result.summary.cancellation_rate).toBe(15);
    });
  });

  describe('fetchTopPatients', () => {
    it('deve buscar top pacientes', async () => {
      const mockReport = {
        start_date: '2025-11-01',
        end_date: '2025-11-30',
        summary: {
          total_patients: 50,
          total_appointments: 200,
          avg_appointments_per_patient: 4,
          attendance_rate: 85,
          total_revenue: 30000,
        },
        frequency_distribution: { '1-5': 30, '6-10': 15, '11+': 5 },
        top_patients: [
          { patient_id: 1, patient_name: 'João Silva', total_appointments: 15, attendance_rate: 93 },
        ],
      };
      mockedApi.get.mockResolvedValue({ data: mockReport });

      const result = await fetchTopPatients();

      expect(mockedApi.get).toHaveBeenCalledWith('/admin/reports/top-patients', { params: undefined });
      expect(result.summary.total_patients).toBe(50);
    });
  });

  describe('download PDFs', () => {
    it('deve baixar PDF de consultas por médico', async () => {
      const mockBlob = new Blob(['pdf content'], { type: 'application/pdf' });
      mockedApi.get.mockResolvedValue({ data: mockBlob });

      const result = await downloadAppointmentsByDoctorPdf();

      expect(mockedApi.get).toHaveBeenCalledWith('/admin/reports/appointments-by-doctor/pdf', {
        params: undefined,
        responseType: 'blob',
      });
      expect(result).toBe(mockBlob);
    });

    it('deve baixar PDF de cancelamentos', async () => {
      const mockBlob = new Blob(['pdf content'], { type: 'application/pdf' });
      mockedApi.get.mockResolvedValue({ data: mockBlob });

      const result = await downloadCancellationsPdf({ start_date: '2025-11-01' });

      expect(mockedApi.get).toHaveBeenCalledWith('/admin/reports/cancellations/pdf', {
        params: { start_date: '2025-11-01' },
        responseType: 'blob',
      });
      expect(result).toBe(mockBlob);
    });

    it('deve baixar PDF de top pacientes', async () => {
      const mockBlob = new Blob(['pdf content'], { type: 'application/pdf' });
      mockedApi.get.mockResolvedValue({ data: mockBlob });

      const result = await downloadTopPatientsPdf();

      expect(mockedApi.get).toHaveBeenCalledWith('/admin/reports/top-patients/pdf', {
        params: undefined,
        responseType: 'blob',
      });
      expect(result).toBe(mockBlob);
    });
  });
});
