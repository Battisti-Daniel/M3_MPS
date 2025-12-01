import { SPACING, BREAKPOINTS } from "../spacing";

describe("spacing", () => {
  describe("SPACING", () => {
    it("should have card padding tokens", () => {
      expect(SPACING.card).toBe("p-6");
      expect(SPACING.cardCompact).toBe("p-4");
      expect(SPACING.cardLoose).toBe("p-8");
    });

    it("should have gap tokens", () => {
      expect(SPACING.xs).toBe("gap-2");
      expect(SPACING.sm).toBe("gap-3");
      expect(SPACING.md).toBe("gap-4");
      expect(SPACING.lg).toBe("gap-6");
      expect(SPACING.xl).toBe("gap-8");
    });

    it("should have section spacing tokens", () => {
      expect(SPACING.section).toBe("space-y-6");
      expect(SPACING.sectionCompact).toBe("space-y-4");
      expect(SPACING.sectionLoose).toBe("space-y-8");
    });

    it("should have container and page spacing", () => {
      expect(SPACING.container).toBe("mx-auto px-4 sm:px-6 lg:px-8");
      expect(SPACING.page).toBe("p-6");
    });
  });

  describe("BREAKPOINTS", () => {
    it("should have all breakpoints defined", () => {
      expect(BREAKPOINTS.sm).toBe("640px");
      expect(BREAKPOINTS.md).toBe("768px");
      expect(BREAKPOINTS.lg).toBe("1024px");
      expect(BREAKPOINTS.xl).toBe("1280px");
      expect(BREAKPOINTS["2xl"]).toBe("1536px");
    });

    it("should have breakpoints in ascending order", () => {
      const values = [
        parseInt(BREAKPOINTS.sm),
        parseInt(BREAKPOINTS.md),
        parseInt(BREAKPOINTS.lg),
        parseInt(BREAKPOINTS.xl),
        parseInt(BREAKPOINTS["2xl"]),
      ];
      
      for (let i = 0; i < values.length - 1; i++) {
        expect(values[i]).toBeLessThan(values[i + 1]);
      }
    });
  });
});
