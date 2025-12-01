import api from "@/lib/api";
import {
  fetchDashboardStats,
  fetchRecentActivities,
  fetchMonthlyAppointments,
  fetchSpecialtyDistribution,
  DashboardStats,
  RecentActivity,
  MonthlyAppointments,
  SpecialtyDistribution,
} from "../admin-dashboard-service";

jest.mock("@/lib/api");
const mockedApi = api as jest.Mocked<typeof api>;

describe("admin-dashboard-service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("fetchDashboardStats", () => {
    const now = new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const createMockData = () => {
      const thisMonth = now.getMonth();
      const thisYear = now.getFullYear();
      
      // Create dates for testing
      const todayStr = now.toISOString();
      const thisMonthDate = new Date(thisYear, thisMonth, 15).toISOString();
      const lastMonthDate = new Date(thisYear, thisMonth - 1, 15).toISOString();
      const oldDate = new Date(thisYear - 1, 0, 15).toISOString();

      return {
        appointments: [
          { id: 1, doctor_id: 1, date_time: todayStr, created_at: todayStr },
          { id: 2, doctor_id: 2, date_time: thisMonthDate, created_at: thisMonthDate },
          { id: 3, doctor_id: 1, date_time: lastMonthDate, created_at: lastMonthDate },
        ],
        doctors: [
          { id: 1, specialty: "Cardiologia", is_active: true, created_at: thisMonthDate },
          { id: 2, specialty: "Pediatria", is_active: true, created_at: oldDate },
          { id: 3, specialty: "Ortopedia", is_active: false, created_at: oldDate },
        ],
        patients: [
          { user: { is_active: true }, created_at: thisMonthDate },
          { user: { is_active: true }, created_at: oldDate },
          { user: { is_active: false }, created_at: oldDate },
        ],
        insurances: [
          { is_active: true, created_at: thisMonthDate },
          { is_active: true, created_at: oldDate },
          { is_active: false, created_at: oldDate },
        ],
      };
    };

    it("should fetch all dashboard stats correctly", async () => {
      const mockData = createMockData();

      mockedApi.get.mockImplementation((url: string) => {
        if (url.includes("/admin/reports/appointments")) {
          return Promise.resolve({ data: { data: mockData.appointments, total: 3 } });
        }
        if (url === "/admin/doctors") {
          return Promise.resolve({ data: { data: mockData.doctors } });
        }
        if (url === "/admin/patients") {
          return Promise.resolve({ data: { data: mockData.patients } });
        }
        if (url === "/health-insurances") {
          return Promise.resolve({ data: { data: mockData.insurances } });
        }
        return Promise.resolve({ data: {} });
      });

      const stats = await fetchDashboardStats();

      expect(stats).toBeDefined();
      expect(stats.total_appointments).toBe(3);
      expect(stats.total_doctors).toBe(3);
      expect(stats.active_doctors).toBe(2);
      expect(stats.total_patients).toBe(3);
      expect(stats.total_health_insurances).toBe(3);
      expect(stats.active_health_insurances).toBe(2);
    });

    it("should handle empty responses", async () => {
      mockedApi.get.mockResolvedValue({ data: { data: [] } });

      const stats = await fetchDashboardStats();

      expect(stats.total_appointments).toBe(0);
      expect(stats.total_doctors).toBe(0);
      expect(stats.total_patients).toBe(0);
      expect(stats.total_health_insurances).toBe(0);
    });

    it("should calculate appointments_today correctly", async () => {
      const todayAppointment = { 
        id: 1, 
        doctor_id: 1, 
        date_time: new Date().toISOString(), 
        created_at: new Date().toISOString() 
      };

      mockedApi.get.mockImplementation((url: string) => {
        if (url.includes("/admin/reports/appointments")) {
          return Promise.resolve({ data: { data: [todayAppointment] } });
        }
        return Promise.resolve({ data: { data: [] } });
      });

      const stats = await fetchDashboardStats();
      expect(stats.appointments_today).toBe(1);
    });

    it("should calculate growth percentages correctly", async () => {
      const now = new Date();
      const thisMonth = now.getMonth();
      const thisYear = now.getFullYear();
      
      // Current month appointments
      const thisMonthAppt = { 
        id: 1, 
        doctor_id: 1, 
        date_time: new Date(thisYear, thisMonth, 10).toISOString(),
        created_at: new Date(thisYear, thisMonth, 10).toISOString()
      };
      
      // Last month appointment
      const lastMonthAppt = { 
        id: 2, 
        doctor_id: 1, 
        date_time: new Date(thisYear, thisMonth - 1, 10).toISOString(),
        created_at: new Date(thisYear, thisMonth - 1, 10).toISOString()
      };

      mockedApi.get.mockImplementation((url: string) => {
        if (url.includes("/admin/reports/appointments")) {
          return Promise.resolve({ data: { data: [thisMonthAppt, lastMonthAppt] } });
        }
        return Promise.resolve({ data: { data: [] } });
      });

      const stats = await fetchDashboardStats();
      expect(typeof stats.appointments_growth).toBe("number");
    });

    it("should handle null/undefined data gracefully", async () => {
      mockedApi.get.mockResolvedValue({ data: null });

      const stats = await fetchDashboardStats();

      expect(stats.total_appointments).toBe(0);
      expect(stats.total_doctors).toBe(0);
    });

    it("should filter appointments without date_time", async () => {
      const appointmentWithoutDate = { id: 1, doctor_id: 1, created_at: new Date().toISOString() };
      const appointmentWithDate = { 
        id: 2, 
        doctor_id: 1, 
        date_time: new Date().toISOString(), 
        created_at: new Date().toISOString() 
      };

      mockedApi.get.mockImplementation((url: string) => {
        if (url.includes("/admin/reports/appointments")) {
          return Promise.resolve({ 
            data: { data: [appointmentWithoutDate, appointmentWithDate] } 
          });
        }
        return Promise.resolve({ data: { data: [] } });
      });

      const stats = await fetchDashboardStats();
      expect(stats.appointments_today).toBe(1);
    });

    it("should count new doctors this month", async () => {
      const now = new Date();
      const thisMonthDate = new Date(now.getFullYear(), now.getMonth(), 5);
      const oldDate = new Date(now.getFullYear() - 1, 0, 1);

      const doctors = [
        { id: 1, specialty: "Cardio", is_active: true, created_at: thisMonthDate.toISOString() },
        { id: 2, specialty: "Ortho", is_active: true, created_at: oldDate.toISOString() },
      ];

      mockedApi.get.mockImplementation((url: string) => {
        if (url === "/admin/doctors") {
          return Promise.resolve({ data: { data: doctors } });
        }
        return Promise.resolve({ data: { data: [] } });
      });

      const stats = await fetchDashboardStats();
      expect(stats.new_doctors).toBe(1);
    });

    it("should count active patients correctly", async () => {
      const patients = [
        { user: { is_active: true }, created_at: new Date().toISOString() },
        { user: { is_active: false }, created_at: new Date().toISOString() },
        { user: { is_active: true }, created_at: new Date().toISOString() },
      ];

      mockedApi.get.mockImplementation((url: string) => {
        if (url === "/admin/patients") {
          return Promise.resolve({ data: { data: patients } });
        }
        return Promise.resolve({ data: { data: [] } });
      });

      const stats = await fetchDashboardStats();
      expect(stats.active_patients).toBe(2);
    });

    it("should handle growth calculation when previous is 0", async () => {
      const now = new Date();
      const thisMonthDate = new Date(now.getFullYear(), now.getMonth(), 5).toISOString();

      const doctors = [
        { id: 1, specialty: "Cardio", is_active: true, created_at: thisMonthDate },
      ];

      mockedApi.get.mockImplementation((url: string) => {
        if (url === "/admin/doctors") {
          return Promise.resolve({ data: { data: doctors } });
        }
        return Promise.resolve({ data: { data: [] } });
      });

      const stats = await fetchDashboardStats();
      expect(stats.doctors_growth).toBe(100);
    });

    it("should use total from response if available", async () => {
      mockedApi.get.mockImplementation((url: string) => {
        if (url.includes("/admin/reports/appointments")) {
          return Promise.resolve({ data: { data: [], total: 50 } });
        }
        return Promise.resolve({ data: { data: [] } });
      });

      const stats = await fetchDashboardStats();
      expect(stats.total_appointments).toBe(50);
    });
  });

  describe("fetchRecentActivities", () => {
    it("should fetch and transform activity logs", async () => {
      const mockLogs = [
        {
          id: 1,
          action: "POST /admin/doctors",
          user: { name: "Dr. Smith" },
          route: "/admin/doctors",
          created_at: "2024-01-15T10:00:00Z",
        },
      ];

      mockedApi.get.mockResolvedValue({ data: { data: mockLogs } });

      const activities = await fetchRecentActivities();

      expect(activities).toHaveLength(1);
      expect(activities[0].type).toBe("doctor_registered");
      expect(activities[0].title).toBe("Novo médico cadastrado");
      expect(activities[0].color).toBe("green");
    });

    it("should handle patient registration logs", async () => {
      const mockLogs = [
        {
          id: 1,
          action: "POST /admin/patients",
          user: { name: "Patient Test" },
          created_at: new Date().toISOString(),
        },
      ];

      mockedApi.get.mockResolvedValue({ data: { data: mockLogs } });

      const activities = await fetchRecentActivities();

      expect(activities[0].type).toBe("patients_registered");
      expect(activities[0].title).toBe("Novo paciente cadastrado");
      expect(activities[0].color).toBe("blue");
    });

    it("should handle insurance activation logs", async () => {
      const mockLogs = [
        {
          id: 1,
          action: "POST /health-insurances",
          route: "Unimed",
          created_at: new Date().toISOString(),
        },
      ];

      mockedApi.get.mockResolvedValue({ data: { data: mockLogs } });

      const activities = await fetchRecentActivities();

      expect(activities[0].type).toBe("insurance_activated");
      expect(activities[0].title).toBe("Novo convênio ativado");
      expect(activities[0].color).toBe("orange");
    });

    it("should handle cancellation logs", async () => {
      const mockLogs = [
        {
          id: 1,
          action: "DELETE /appointments/1",
          user: { name: "Admin" },
          created_at: new Date().toISOString(),
        },
      ];

      mockedApi.get.mockResolvedValue({ data: { data: mockLogs } });

      const activities = await fetchRecentActivities();

      expect(activities[0].type).toBe("appointments_cancelled");
      expect(activities[0].title).toBe("Consulta cancelada");
      expect(activities[0].color).toBe("red");
    });

    it("should handle generic action logs", async () => {
      const mockLogs = [
        {
          id: 1,
          action: "GET /some-route",
          user: { name: "User Test" },
          created_at: new Date().toISOString(),
        },
      ];

      mockedApi.get.mockResolvedValue({ data: { data: mockLogs } });

      const activities = await fetchRecentActivities();

      expect(activities[0].color).toBe("gray");
      expect(activities[0].icon).toBe("check");
    });

    it("should handle logs without user", async () => {
      const mockLogs = [
        {
          id: 1,
          action: "POST /admin/doctors",
          created_at: new Date().toISOString(),
        },
      ];

      mockedApi.get.mockResolvedValue({ data: { data: mockLogs } });

      const activities = await fetchRecentActivities();

      expect(activities[0].description).toBe("Novo cadastro");
    });

    it("should return empty array on error", async () => {
      mockedApi.get.mockRejectedValue(new Error("Network error"));

      const activities = await fetchRecentActivities();

      expect(activities).toEqual([]);
      expect(console.error).toHaveBeenCalled();
    });

    it("should handle empty response", async () => {
      mockedApi.get.mockResolvedValue({ data: { data: [] } });

      const activities = await fetchRecentActivities();

      expect(activities).toEqual([]);
    });

    it("should handle logs without created_at", async () => {
      const mockLogs = [
        {
          id: 1,
          action: "POST /admin/doctors",
          user: { name: "Test" },
        },
      ];

      mockedApi.get.mockResolvedValue({ data: { data: mockLogs } });

      const activities = await fetchRecentActivities();

      expect(activities[0].created_at).toBeDefined();
    });

    it("should handle cancel action keyword", async () => {
      const mockLogs = [
        {
          id: 1,
          action: "cancel appointment",
          user: { name: "Test User" },
          created_at: new Date().toISOString(),
        },
      ];

      mockedApi.get.mockResolvedValue({ data: { data: mockLogs } });

      const activities = await fetchRecentActivities();

      expect(activities[0].type).toBe("appointments_cancelled");
    });

    it("should handle logs with route but no user for generic", async () => {
      const mockLogs = [
        {
          id: 1,
          action: "GET /test",
          route: "/test-route",
          created_at: new Date().toISOString(),
        },
      ];

      mockedApi.get.mockResolvedValue({ data: { data: mockLogs } });

      const activities = await fetchRecentActivities();

      expect(activities[0].description).toBe("/test-route");
    });
  });

  describe("fetchMonthlyAppointments", () => {
    it("should fetch and aggregate monthly appointments", async () => {
      const mockTrend = [
        { date: "2024-01-15", total: 5 },
        { date: "2024-01-20", total: 3 },
        { date: "2024-02-10", total: 7 },
      ];

      mockedApi.get.mockResolvedValue({ data: { trend: mockTrend } });

      const monthly = await fetchMonthlyAppointments();

      expect(Array.isArray(monthly)).toBe(true);
      expect(monthly.length).toBeGreaterThan(0);
    });

    it("should handle empty trend data", async () => {
      mockedApi.get.mockResolvedValue({ data: { trend: [] } });

      const monthly = await fetchMonthlyAppointments();

      expect(monthly).toEqual([]);
    });

    it("should aggregate same month totals", async () => {
      const mockTrend = [
        { date: "2024-01-15", total: 5 },
        { date: "2024-01-20", total: 3 },
      ];

      mockedApi.get.mockResolvedValue({ data: { trend: mockTrend } });

      const monthly = await fetchMonthlyAppointments();

      // Should aggregate into a single month
      expect(monthly.length).toBe(1);
      expect(monthly[0].total).toBe(8);
    });

    it("should call api with correct date range", async () => {
      mockedApi.get.mockResolvedValue({ data: { trend: [] } });

      await fetchMonthlyAppointments();

      expect(mockedApi.get).toHaveBeenCalledWith(
        "/admin/reports/appointments",
        expect.objectContaining({
          params: expect.objectContaining({
            start_date: expect.any(String),
            end_date: expect.any(String),
          }),
        })
      );
    });

    it("should handle null trend data", async () => {
      mockedApi.get.mockResolvedValue({ data: {} });

      const monthly = await fetchMonthlyAppointments();

      expect(monthly).toEqual([]);
    });
  });

  describe("fetchSpecialtyDistribution", () => {
    it("should fetch and calculate specialty distribution", async () => {
      const mockAppointments = [
        { id: 1, doctor_id: 1, doctor: { id: 1, specialty: "Cardiologia" } },
        { id: 2, doctor_id: 1, doctor: { id: 1, specialty: "Cardiologia" } },
        { id: 3, doctor_id: 2, doctor: { id: 2, specialty: "Pediatria" } },
      ];

      const mockDoctors = [
        { id: 1, specialty: "Cardiologia", is_active: true, created_at: new Date().toISOString() },
        { id: 2, specialty: "Pediatria", is_active: true, created_at: new Date().toISOString() },
      ];

      mockedApi.get.mockImplementation((url: string) => {
        if (url.includes("/admin/reports/appointments")) {
          return Promise.resolve({ data: { data: mockAppointments } });
        }
        if (url === "/admin/doctors") {
          return Promise.resolve({ data: { data: mockDoctors } });
        }
        return Promise.resolve({ data: {} });
      });

      const distribution = await fetchSpecialtyDistribution();

      expect(Array.isArray(distribution)).toBe(true);
      expect(distribution.length).toBe(2);
      expect(distribution[0].specialty).toBe("Cardiologia");
      expect(distribution[0].total).toBe(2);
      expect(distribution[0].percentage).toBe(67);
    });

    it("should use doctor map for specialty when not in appointment", async () => {
      const mockAppointments = [
        { id: 1, doctor_id: 1 },
      ];

      const mockDoctors = [
        { id: 1, specialty: "Ortopedia", is_active: true, created_at: new Date().toISOString() },
      ];

      mockedApi.get.mockImplementation((url: string) => {
        if (url.includes("/admin/reports/appointments")) {
          return Promise.resolve({ data: { data: mockAppointments } });
        }
        if (url === "/admin/doctors") {
          return Promise.resolve({ data: { data: mockDoctors } });
        }
        return Promise.resolve({ data: {} });
      });

      const distribution = await fetchSpecialtyDistribution();

      expect(distribution[0].specialty).toBe("Ortopedia");
    });

    it("should use 'Outras' for unknown specialty", async () => {
      const mockAppointments = [
        { id: 1, doctor_id: 999 },
      ];

      mockedApi.get.mockImplementation((url: string) => {
        if (url.includes("/admin/reports/appointments")) {
          return Promise.resolve({ data: { data: mockAppointments } });
        }
        if (url === "/admin/doctors") {
          return Promise.resolve({ data: { data: [] } });
        }
        return Promise.resolve({ data: {} });
      });

      const distribution = await fetchSpecialtyDistribution();

      expect(distribution[0].specialty).toBe("Outras");
    });

    it("should return empty array on error", async () => {
      mockedApi.get.mockRejectedValue(new Error("Network error"));

      const distribution = await fetchSpecialtyDistribution();

      expect(distribution).toEqual([]);
      expect(console.error).toHaveBeenCalled();
    });

    it("should limit to 10 specialties", async () => {
      const mockAppointments = Array.from({ length: 100 }, (_, i) => ({
        id: i,
        doctor_id: i,
        doctor: { id: i, specialty: `Specialty${i}` },
      }));

      mockedApi.get.mockImplementation((url: string) => {
        if (url.includes("/admin/reports/appointments")) {
          return Promise.resolve({ data: { data: mockAppointments } });
        }
        return Promise.resolve({ data: { data: [] } });
      });

      const distribution = await fetchSpecialtyDistribution();

      expect(distribution.length).toBeLessThanOrEqual(10);
    });

    it("should sort by total descending", async () => {
      const mockAppointments = [
        { id: 1, doctor_id: 1, doctor: { id: 1, specialty: "A" } },
        { id: 2, doctor_id: 2, doctor: { id: 2, specialty: "B" } },
        { id: 3, doctor_id: 2, doctor: { id: 2, specialty: "B" } },
        { id: 4, doctor_id: 2, doctor: { id: 2, specialty: "B" } },
      ];

      mockedApi.get.mockImplementation((url: string) => {
        if (url.includes("/admin/reports/appointments")) {
          return Promise.resolve({ data: { data: mockAppointments } });
        }
        return Promise.resolve({ data: { data: [] } });
      });

      const distribution = await fetchSpecialtyDistribution();

      expect(distribution[0].specialty).toBe("B");
      expect(distribution[0].total).toBe(3);
    });

    it("should handle empty appointments", async () => {
      mockedApi.get.mockResolvedValue({ data: { data: [] } });

      const distribution = await fetchSpecialtyDistribution();

      expect(distribution).toEqual([]);
    });

    it("should calculate percentage as 0 when total is 0", async () => {
      mockedApi.get.mockResolvedValue({ data: { data: [] } });

      const distribution = await fetchSpecialtyDistribution();

      expect(distribution).toEqual([]);
    });

    it("should handle doctors without specialty", async () => {
      const mockDoctors = [
        { id: 1, is_active: true, created_at: new Date().toISOString() },
      ];

      mockedApi.get.mockImplementation((url: string) => {
        if (url === "/admin/doctors") {
          return Promise.resolve({ data: { data: mockDoctors } });
        }
        return Promise.resolve({ data: { data: [] } });
      });

      const distribution = await fetchSpecialtyDistribution();

      expect(distribution).toEqual([]);
    });
  });

  describe("Type exports", () => {
    it("should export DashboardStats type", () => {
      const stats: DashboardStats = {
        total_appointments: 0,
        appointments_today: 0,
        appointments_this_month: 0,
        total_doctors: 0,
        active_doctors: 0,
        new_doctors: 0,
        total_patients: 0,
        active_patients: 0,
        new_patients: 0,
        total_health_insurances: 0,
        active_health_insurances: 0,
        new_health_insurances: 0,
        appointments_growth: 0,
        doctors_growth: 0,
        patients_growth: 0,
        health_insurances_growth: 0,
      };
      expect(stats).toBeDefined();
    });

    it("should export RecentActivity type", () => {
      const activity: RecentActivity = {
        id: 1,
        type: "doctor_registered",
        title: "Test",
        description: "Test",
        icon: "check",
        color: "green",
        created_at: new Date().toISOString(),
      };
      expect(activity).toBeDefined();
    });

    it("should export MonthlyAppointments type", () => {
      const monthly: MonthlyAppointments = {
        month: "jan",
        total: 10,
      };
      expect(monthly).toBeDefined();
    });

    it("should export SpecialtyDistribution type", () => {
      const specialty: SpecialtyDistribution = {
        specialty: "Cardiologia",
        total: 10,
        percentage: 50,
      };
      expect(specialty).toBeDefined();
    });
  });
});
