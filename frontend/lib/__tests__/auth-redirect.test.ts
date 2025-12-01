import { getRedirectPathByRole } from "../auth-redirect";
import { User } from "@/types";

describe("auth-redirect", () => {
  describe("getRedirectPathByRole", () => {
    it("should return /login/patient for null user", () => {
      const result = getRedirectPathByRole(null);
      expect(result).toBe("/login/patient");
    });

    it("should return /admin/doctors for ADMIN role", () => {
      const user: User = {
        id: 1,
        name: "Admin User",
        email: "admin@test.com",
        phone: "11999999999",
        role: "ADMIN",
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const result = getRedirectPathByRole(user);
      expect(result).toBe("/admin/doctors");
    });

    it("should return /doctor/dashboard for DOCTOR role", () => {
      const user: User = {
        id: 2,
        name: "Doctor User",
        email: "doctor@test.com",
        phone: "11999999999",
        role: "DOCTOR",
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const result = getRedirectPathByRole(user);
      expect(result).toBe("/doctor/dashboard");
    });

    it("should return /dashboard for PATIENT role", () => {
      const user: User = {
        id: 3,
        name: "Patient User",
        email: "patient@test.com",
        phone: "11999999999",
        role: "PATIENT",
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const result = getRedirectPathByRole(user);
      expect(result).toBe("/dashboard");
    });

    it("should return /dashboard for unknown role", () => {
      const user = {
        id: 4,
        name: "Unknown User",
        email: "unknown@test.com",
        phone: "11999999999",
        role: "UNKNOWN" as any,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const result = getRedirectPathByRole(user);
      expect(result).toBe("/dashboard");
    });

    it("should return /dashboard for empty role", () => {
      const user = {
        id: 5,
        name: "Empty Role User",
        email: "empty@test.com",
        phone: "11999999999",
        role: "" as any,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const result = getRedirectPathByRole(user);
      expect(result).toBe("/dashboard");
    });

    it("should handle user with additional properties", () => {
      const user: User & { extra: string } = {
        id: 6,
        name: "Extra Props User",
        email: "extra@test.com",
        phone: "11999999999",
        role: "ADMIN",
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        extra: "extra value",
      };

      const result = getRedirectPathByRole(user);
      expect(result).toBe("/admin/doctors");
    });
  });
});
