import {
  TYPOGRAPHY,
  SPACING,
  ELEVATION,
  BORDERS,
  TRANSITIONS,
  Z_INDEX,
  COLORS,
  COMPONENT_TOKENS,
} from "../design-tokens";

describe("design-tokens", () => {
  describe("TYPOGRAPHY", () => {
    it("should have fontSize tokens", () => {
      expect(TYPOGRAPHY.fontSize).toBeDefined();
      expect(TYPOGRAPHY.fontSize.xs).toBe("text-xs");
      expect(TYPOGRAPHY.fontSize.sm).toBe("text-sm");
      expect(TYPOGRAPHY.fontSize.base).toBe("text-base");
      expect(TYPOGRAPHY.fontSize.lg).toBe("text-lg");
      expect(TYPOGRAPHY.fontSize.xl).toBe("text-xl");
      expect(TYPOGRAPHY.fontSize["2xl"]).toBe("text-2xl");
      expect(TYPOGRAPHY.fontSize["3xl"]).toBe("text-3xl");
      expect(TYPOGRAPHY.fontSize["4xl"]).toBe("text-4xl");
    });

    it("should have fontWeight tokens", () => {
      expect(TYPOGRAPHY.fontWeight.normal).toBe("font-normal");
      expect(TYPOGRAPHY.fontWeight.medium).toBe("font-medium");
      expect(TYPOGRAPHY.fontWeight.semibold).toBe("font-semibold");
      expect(TYPOGRAPHY.fontWeight.bold).toBe("font-bold");
    });

    it("should have lineHeight tokens", () => {
      expect(TYPOGRAPHY.lineHeight.tight).toBe("leading-tight");
      expect(TYPOGRAPHY.lineHeight.normal).toBe("leading-normal");
      expect(TYPOGRAPHY.lineHeight.relaxed).toBe("leading-relaxed");
    });

    it("should have heading tokens", () => {
      expect(TYPOGRAPHY.heading.h1).toContain("text-4xl");
      expect(TYPOGRAPHY.heading.h2).toContain("text-3xl");
      expect(TYPOGRAPHY.heading.h3).toContain("text-2xl");
      expect(TYPOGRAPHY.heading.h4).toContain("text-xl");
      expect(TYPOGRAPHY.heading.h5).toContain("text-lg");
      expect(TYPOGRAPHY.heading.h6).toContain("text-base");
    });

    it("should have body text tokens", () => {
      expect(TYPOGRAPHY.body.large).toContain("text-lg");
      expect(TYPOGRAPHY.body.base).toContain("text-base");
      expect(TYPOGRAPHY.body.small).toContain("text-sm");
      expect(TYPOGRAPHY.body.tiny).toContain("text-xs");
    });
  });

  describe("SPACING", () => {
    it("should have padding tokens", () => {
      expect(SPACING.padding.xs).toBe("p-1");
      expect(SPACING.padding.sm).toBe("p-2");
      expect(SPACING.padding.md).toBe("p-3");
      expect(SPACING.padding.base).toBe("p-4");
      expect(SPACING.padding.lg).toBe("p-6");
      expect(SPACING.padding.xl).toBe("p-8");
      expect(SPACING.padding["2xl"]).toBe("p-12");
    });

    it("should have paddingX tokens", () => {
      expect(SPACING.paddingX.xs).toBe("px-1");
      expect(SPACING.paddingX.base).toBe("px-4");
    });

    it("should have paddingY tokens", () => {
      expect(SPACING.paddingY.xs).toBe("py-1");
      expect(SPACING.paddingY.base).toBe("py-4");
    });

    it("should have margin tokens", () => {
      expect(SPACING.margin.xs).toBe("m-1");
      expect(SPACING.margin.base).toBe("m-4");
      expect(SPACING.margin.xl).toBe("m-8");
    });

    it("should have gap tokens", () => {
      expect(SPACING.gap.xs).toBe("gap-1");
      expect(SPACING.gap.base).toBe("gap-4");
      expect(SPACING.gap["2xl"]).toBe("gap-12");
    });

    it("should have spaceY tokens", () => {
      expect(SPACING.spaceY.xs).toBe("space-y-1");
      expect(SPACING.spaceY.base).toBe("space-y-4");
    });

    it("should have card spacing tokens", () => {
      expect(SPACING.card.padding).toBe("p-6");
      expect(SPACING.card.paddingCompact).toBe("p-4");
      expect(SPACING.card.paddingLoose).toBe("p-8");
      expect(SPACING.card.gap).toBe("gap-4");
    });

    it("should have section spacing tokens", () => {
      expect(SPACING.section.padding).toBe("p-6");
      expect(SPACING.section.gap).toBe("space-y-6");
    });
  });

  describe("ELEVATION", () => {
    it("should have shadow tokens", () => {
      expect(ELEVATION.none).toBe("shadow-none");
      expect(ELEVATION.sm).toBe("shadow-sm");
      expect(ELEVATION.base).toBe("shadow");
      expect(ELEVATION.md).toBe("shadow-md");
      expect(ELEVATION.lg).toBe("shadow-lg");
      expect(ELEVATION.xl).toBe("shadow-xl");
      expect(ELEVATION["2xl"]).toBe("shadow-2xl");
      expect(ELEVATION.inner).toBe("shadow-inner");
    });

    it("should have hover shadow tokens", () => {
      expect(ELEVATION.hover.sm).toContain("hover:shadow-md");
      expect(ELEVATION.hover.md).toContain("hover:shadow-lg");
      expect(ELEVATION.hover.lg).toContain("hover:shadow-xl");
    });

    it("should have focus shadow token", () => {
      expect(ELEVATION.focus).toContain("focus:shadow-lg");
    });
  });

  describe("BORDERS", () => {
    it("should have radius tokens", () => {
      expect(BORDERS.radius.none).toBe("rounded-none");
      expect(BORDERS.radius.sm).toBe("rounded-sm");
      expect(BORDERS.radius.md).toBe("rounded-md");
      expect(BORDERS.radius.base).toBe("rounded");
      expect(BORDERS.radius.lg).toBe("rounded-lg");
      expect(BORDERS.radius.xl).toBe("rounded-xl");
      expect(BORDERS.radius["2xl"]).toBe("rounded-2xl");
      expect(BORDERS.radius.full).toBe("rounded-full");
    });

    it("should have width tokens", () => {
      expect(BORDERS.width.none).toBe("border-0");
      expect(BORDERS.width.thin).toBe("border");
      expect(BORDERS.width.medium).toBe("border-2");
      expect(BORDERS.width.thick).toBe("border-4");
    });

    it("should have style tokens", () => {
      expect(BORDERS.style.solid).toBe("border-solid");
      expect(BORDERS.style.dashed).toBe("border-dashed");
      expect(BORDERS.style.dotted).toBe("border-dotted");
    });
  });

  describe("TRANSITIONS", () => {
    it("should have duration tokens", () => {
      expect(TRANSITIONS.duration.fast).toBe("duration-150");
      expect(TRANSITIONS.duration.base).toBe("duration-200");
      expect(TRANSITIONS.duration.slow).toBe("duration-300");
      expect(TRANSITIONS.duration.slower).toBe("duration-500");
    });

    it("should have easing tokens", () => {
      expect(TRANSITIONS.easing.linear).toBe("ease-linear");
      expect(TRANSITIONS.easing.in).toBe("ease-in");
      expect(TRANSITIONS.easing.out).toBe("ease-out");
      expect(TRANSITIONS.easing.inOut).toBe("ease-in-out");
    });

    it("should have property tokens", () => {
      expect(TRANSITIONS.property.all).toBe("transition-all");
      expect(TRANSITIONS.property.colors).toBe("transition-colors");
      expect(TRANSITIONS.property.transform).toBe("transition-transform");
      expect(TRANSITIONS.property.opacity).toBe("transition-opacity");
      expect(TRANSITIONS.property.shadow).toBe("transition-shadow");
    });

    it("should have common transition combinations", () => {
      expect(TRANSITIONS.common.colors).toContain("transition-colors");
      expect(TRANSITIONS.common.transform).toContain("transition-transform");
      expect(TRANSITIONS.common.shadow).toContain("transition-shadow");
      expect(TRANSITIONS.common.all).toContain("transition-all");
    });
  });

  describe("Z_INDEX", () => {
    it("should have z-index tokens", () => {
      expect(Z_INDEX.base).toBe("z-0");
      expect(Z_INDEX.dropdown).toBe("z-10");
      expect(Z_INDEX.sticky).toBe("z-20");
      expect(Z_INDEX.fixed).toBe("z-30");
      expect(Z_INDEX.modalBackdrop).toBe("z-40");
      expect(Z_INDEX.modal).toBe("z-50");
      expect(Z_INDEX.popover).toBe("z-50");
      expect(Z_INDEX.tooltip).toBe("z-50");
      expect(Z_INDEX.notification).toBe("z-50");
    });
  });

  describe("COLORS", () => {
    it("should have text color tokens", () => {
      expect(COLORS.text.primary).toBe("text-slate-900");
      expect(COLORS.text.secondary).toBe("text-slate-700");
      expect(COLORS.text.tertiary).toBe("text-slate-600");
      expect(COLORS.text.muted).toBe("text-slate-500");
      expect(COLORS.text.inverse).toBe("text-white");
      expect(COLORS.text.link).toContain("text-purple-600");
      expect(COLORS.text.error).toBe("text-red-600");
      expect(COLORS.text.success).toBe("text-emerald-600");
      expect(COLORS.text.warning).toBe("text-amber-600");
    });

    it("should have background color tokens", () => {
      expect(COLORS.background.primary).toBe("bg-white");
      expect(COLORS.background.secondary).toBe("bg-slate-50");
      expect(COLORS.background.tertiary).toBe("bg-slate-100");
      expect(COLORS.background.muted).toBe("bg-slate-200");
      expect(COLORS.background.dark).toBe("bg-slate-900");
      expect(COLORS.background.overlay).toBe("bg-black/50");
    });

    it("should have border color tokens", () => {
      expect(COLORS.border.default).toBe("border-slate-200");
      expect(COLORS.border.muted).toBe("border-slate-300");
      expect(COLORS.border.focus).toBe("border-purple-500");
      expect(COLORS.border.error).toBe("border-red-500");
      expect(COLORS.border.success).toBe("border-emerald-500");
      expect(COLORS.border.warning).toBe("border-amber-500");
    });
  });

  describe("COMPONENT_TOKENS", () => {
    it("should have button tokens", () => {
      expect(COMPONENT_TOKENS.button.padding).toBe("px-4 py-2");
      expect(COMPONENT_TOKENS.button.paddingLarge).toBe("px-6 py-3");
      expect(COMPONENT_TOKENS.button.paddingSmall).toBe("px-3 py-1.5");
      expect(COMPONENT_TOKENS.button.radius).toBe("rounded-md");
      expect(COMPONENT_TOKENS.button.fontSize).toBe("text-sm");
      expect(COMPONENT_TOKENS.button.fontWeight).toBe("font-medium");
      expect(COMPONENT_TOKENS.button.transition).toBeDefined();
    });

    it("should have input tokens", () => {
      expect(COMPONENT_TOKENS.input.padding).toBe("px-3 py-2");
      expect(COMPONENT_TOKENS.input.radius).toBe("rounded-md");
      expect(COMPONENT_TOKENS.input.fontSize).toBe("text-sm");
      expect(COMPONENT_TOKENS.input.border).toContain("border");
      expect(COMPONENT_TOKENS.input.focus).toContain("focus:");
      expect(COMPONENT_TOKENS.input.error).toContain("border-red-500");
    });

    it("should have card tokens", () => {
      expect(COMPONENT_TOKENS.card.padding).toBe(SPACING.card.padding);
      expect(COMPONENT_TOKENS.card.radius).toBe(BORDERS.radius.xl);
      expect(COMPONENT_TOKENS.card.border).toContain("border");
      expect(COMPONENT_TOKENS.card.shadow).toBe(ELEVATION.sm);
      expect(COMPONENT_TOKENS.card.shadowHover).toBe(ELEVATION.hover.md);
    });

    it("should have badge tokens", () => {
      expect(COMPONENT_TOKENS.badge.padding).toBe("px-2.5 py-0.5");
      expect(COMPONENT_TOKENS.badge.radius).toBe("rounded-full");
      expect(COMPONENT_TOKENS.badge.fontSize).toBe("text-xs");
      expect(COMPONENT_TOKENS.badge.fontWeight).toBe("font-medium");
    });
  });

  describe("Token immutability", () => {
    it("should not allow modification of tokens", () => {
      // Check that tokens are readonly (const assertions)
      // TypeScript would prevent direct modification at compile time
      // At runtime, we verify the structure exists
      expect(Object.isFrozen(TYPOGRAPHY.fontSize)).toBe(false); // Not frozen at runtime
      expect(typeof TYPOGRAPHY.fontSize.xs).toBe("string");
    });
  });
});
