export const LABEL_SPEC = {
  // Logical label size used by the visual renderers.
  // This represents a 3:4 label.
  width: 288,
  height: 384,

  padding: 16,

  header: {
    height: 72,
    logoWidthPercent: 92,
  },

  divider: {
    height: 1,
  },

  field: {
    paddingVertical: 16,
  },

  fieldLabel: {
    fontSize: 10,
    fontWeight: "800" as const,
    color: "#333333",
    letterSpacing: 0.8,
    marginBottom: 6,
  },

  docket: {
    fontSize: 27,
    lineHeight: 32,
    fontWeight: "900" as const,
    color: "#000000",
  },

  location: {
    fontSize: 20,
    lineHeight: 25,
    fontWeight: "800" as const,
    color: "#000000",
  },

  box: {
    paddingTop: 12,
    paddingBottom: 4,

    labelFontSize: 10,
    labelFontWeight: "800" as const,
    labelColor: "#333333",
    labelLetterSpacing: 0.8,
    labelMarginBottom: 2,

    fontSize: 34,
    lineHeight: 40,
    fontWeight: "900" as const,
    letterSpacing: 0.5,
    color: "#000000",
  },

  colors: {
    background: "#FFFFFF",
    border: "#000000",
    text: "#000000",
    secondaryText: "#333333",
  },

  logo: require("@/assets/images/RudraxLogisticsLogo-Thermal-Header.png"),

  pdf: {
    widthPoints: 216,
    heightPoints: 288,

    // 216pt × 288pt = 3" × 4"
    cssWidth: 288,
    cssHeight: 384,
  },
} as const;
