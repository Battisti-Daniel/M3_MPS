import {
  PRIMARY_COLORS,
  SECONDARY_COLORS,
  STATUS_COLORS,
  BACKGROUND_COLORS,
  TEXT_COLORS,
  BORDER_COLORS,
  getStatusColors,
  getStatusBadgeClasses,
} from "../medical-colors";

describe("medical-colors", () => {
  describe("PRIMARY_COLORS", () => {
    it("should have all primary color shades", () => {
      expect(PRIMARY_COLORS[50]).toBe("blue-50");
      expect(PRIMARY_COLORS[100]).toBe("blue-100");
      expect(PRIMARY_COLORS[200]).toBe("blue-200");
      expect(PRIMARY_COLORS[300]).toBe("blue-300");
      expect(PRIMARY_COLORS[400]).toBe("blue-400");
      expect(PRIMARY_COLORS[500]).toBe("blue-500");
      expect(PRIMARY_COLORS[600]).toBe("blue-600");
      expect(PRIMARY_COLORS[700]).toBe("blue-700");
      expect(PRIMARY_COLORS[800]).toBe("blue-800");
      expect(PRIMARY_COLORS[900]).toBe("blue-900");
    });
  });

  describe("SECONDARY_COLORS", () => {
    it("should have all secondary color shades", () => {
      expect(SECONDARY_COLORS[50]).toBe("emerald-50");
      expect(SECONDARY_COLORS[100]).toBe("emerald-100");
      expect(SECONDARY_COLORS[200]).toBe("emerald-200");
      expect(SECONDARY_COLORS[300]).toBe("emerald-300");
      expect(SECONDARY_COLORS[400]).toBe("emerald-400");
      expect(SECONDARY_COLORS[500]).toBe("emerald-500");
      expect(SECONDARY_COLORS[600]).toBe("emerald-600");
      expect(SECONDARY_COLORS[700]).toBe("emerald-700");
      expect(SECONDARY_COLORS[800]).toBe("emerald-800");
      expect(SECONDARY_COLORS[900]).toBe("emerald-900");
    });
  });

  describe("STATUS_COLORS", () => {
    it("should have PENDING status colors", () => {
      expect(STATUS_COLORS.PENDING.bg).toBe("bg-amber-50");
      expect(STATUS_COLORS.PENDING.text).toBe("text-amber-800");
      expect(STATUS_COLORS.PENDING.border).toBe("border-amber-200");
      expect(STATUS_COLORS.PENDING.badge).toContain("bg-amber-100");
      expect(STATUS_COLORS.PENDING.icon).toBe("text-amber-600");
    });

    it("should have CONFIRMED status colors", () => {
      expect(STATUS_COLORS.CONFIRMED.bg).toBe("bg-emerald-50");
      expect(STATUS_COLORS.CONFIRMED.text).toBe("text-emerald-800");
      expect(STATUS_COLORS.CONFIRMED.border).toBe("border-emerald-200");
      expect(STATUS_COLORS.CONFIRMED.badge).toContain("bg-emerald-100");
      expect(STATUS_COLORS.CONFIRMED.icon).toBe("text-emerald-600");
    });

    it("should have COMPLETED status colors", () => {
      expect(STATUS_COLORS.COMPLETED.bg).toBe("bg-blue-50");
      expect(STATUS_COLORS.COMPLETED.text).toBe("text-blue-800");
      expect(STATUS_COLORS.COMPLETED.border).toBe("border-blue-200");
      expect(STATUS_COLORS.COMPLETED.badge).toContain("bg-blue-100");
      expect(STATUS_COLORS.COMPLETED.icon).toBe("text-blue-600");
    });

    it("should have CANCELLED status colors", () => {
      expect(STATUS_COLORS.CANCELLED.bg).toBe("bg-slate-100");
      expect(STATUS_COLORS.CANCELLED.text).toBe("text-slate-700");
      expect(STATUS_COLORS.CANCELLED.border).toBe("border-slate-200");
      expect(STATUS_COLORS.CANCELLED.badge).toContain("bg-slate-100");
      expect(STATUS_COLORS.CANCELLED.icon).toBe("text-slate-500");
    });

    it("should have BLOCKED status colors", () => {
      expect(STATUS_COLORS.BLOCKED.bg).toBe("bg-slate-100");
      expect(STATUS_COLORS.BLOCKED.text).toBe("text-slate-700");
      expect(STATUS_COLORS.BLOCKED.border).toBe("border-slate-200");
      expect(STATUS_COLORS.BLOCKED.badge).toContain("bg-slate-100");
      expect(STATUS_COLORS.BLOCKED.icon).toBe("text-slate-500");
    });
  });

  describe("BACKGROUND_COLORS", () => {
    it("should have all background colors", () => {
      expect(BACKGROUND_COLORS.primary).toBe("bg-white");
      expect(BACKGROUND_COLORS.secondary).toBe("bg-slate-50");
      expect(BACKGROUND_COLORS.tertiary).toBe("bg-slate-100");
      expect(BACKGROUND_COLORS.dark).toBe("bg-slate-900");
      expect(BACKGROUND_COLORS.paper).toBe("bg-white");
      expect(BACKGROUND_COLORS.subtle).toBe("bg-blue-50/30");
    });
  });

  describe("TEXT_COLORS", () => {
    it("should have all text colors", () => {
      expect(TEXT_COLORS.primary).toBe("text-slate-900");
      expect(TEXT_COLORS.secondary).toBe("text-slate-700");
      expect(TEXT_COLORS.tertiary).toBe("text-slate-600");
      expect(TEXT_COLORS.muted).toBe("text-slate-500");
      expect(TEXT_COLORS.inverse).toBe("text-white");
      expect(TEXT_COLORS.link).toContain("text-blue-600");
      expect(TEXT_COLORS.linkHover).toBe("text-blue-700");
      expect(TEXT_COLORS.accent).toBe("text-blue-600");
    });
  });

  describe("BORDER_COLORS", () => {
    it("should have all border colors", () => {
      expect(BORDER_COLORS.default).toBe("border-slate-200");
      expect(BORDER_COLORS.muted).toBe("border-slate-300");
      expect(BORDER_COLORS.focus).toBe("border-blue-500");
      expect(BORDER_COLORS.error).toBe("border-red-400");
      expect(BORDER_COLORS.success).toBe("border-emerald-500");
      expect(BORDER_COLORS.warning).toBe("border-amber-400");
    });
  });

  describe("getStatusColors", () => {
    it("should return correct colors for PENDING status", () => {
      const colors = getStatusColors("pending");
      expect(colors).toEqual(STATUS_COLORS.PENDING);
    });

    it("should return correct colors for CONFIRMED status", () => {
      const colors = getStatusColors("confirmed");
      expect(colors).toEqual(STATUS_COLORS.CONFIRMED);
    });

    it("should return correct colors for COMPLETED status", () => {
      const colors = getStatusColors("COMPLETED");
      expect(colors).toEqual(STATUS_COLORS.COMPLETED);
    });

    it("should return correct colors for CANCELLED status", () => {
      const colors = getStatusColors("cancelled");
      expect(colors).toEqual(STATUS_COLORS.CANCELLED);
    });

    it("should return correct colors for BLOCKED status", () => {
      const colors = getStatusColors("blocked");
      expect(colors).toEqual(STATUS_COLORS.BLOCKED);
    });

    it("should return BLOCKED colors for unknown status", () => {
      const colors = getStatusColors("unknown");
      expect(colors).toEqual(STATUS_COLORS.BLOCKED);
    });

    it("should be case insensitive", () => {
      expect(getStatusColors("PENDING")).toEqual(getStatusColors("pending"));
      expect(getStatusColors("Confirmed")).toEqual(getStatusColors("CONFIRMED"));
    });
  });

  describe("getStatusBadgeClasses", () => {
    it("should return badge classes for PENDING status", () => {
      const classes = getStatusBadgeClasses("pending");
      expect(classes).toContain("inline-flex");
      expect(classes).toContain("items-center");
      expect(classes).toContain("rounded-full");
      expect(classes).toContain("px-2.5");
      expect(classes).toContain("py-1");
      expect(classes).toContain("text-xs");
      expect(classes).toContain("font-medium");
      expect(classes).toContain(STATUS_COLORS.PENDING.badge);
    });

    it("should return badge classes for CONFIRMED status", () => {
      const classes = getStatusBadgeClasses("confirmed");
      expect(classes).toContain(STATUS_COLORS.CONFIRMED.badge);
    });

    it("should return badge classes for unknown status", () => {
      const classes = getStatusBadgeClasses("unknown");
      expect(classes).toContain(STATUS_COLORS.BLOCKED.badge);
    });

    it("should work with uppercase status", () => {
      const classes = getStatusBadgeClasses("COMPLETED");
      expect(classes).toContain(STATUS_COLORS.COMPLETED.badge);
    });

    it("should include all base classes", () => {
      const classes = getStatusBadgeClasses("pending");
      expect(classes).toMatch(/inline-flex items-center rounded-full px-2\.5 py-1 text-xs font-medium/);
    });
  });
});
