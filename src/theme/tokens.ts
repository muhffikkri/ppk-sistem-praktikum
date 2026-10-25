// Design tokens — single source of truth.
// Raw source: spec/design-sticker-sheet.md (LabPresensi v1.2 sticker sheet,
// "Sebenza" visual language). Component names mirror the sticker sheet
// sections. Update here and the sticker sheet together.

export const colors = {
  // Brand — "Sebenza" violet family
  violet: '#5B3BE8', // primary
  violetDark: '#4427C6', // pressed / hover of violet
  violetLight: '#7356F5',
  lime: '#D3F36B', // high-visibility accent
  limeHover: '#C0E255',
  lavender: '#E4DBFF', // soft tint
  lavenderSubtle: '#F3EFFF',
  pink: '#FFC2D9', // decorative accent (late / warning tint)
  ink: '#17141F', // primary text, dark surface, bottom dock
  inkMuted: '#5D586C', // secondary text
  onPrimary: '#FFFFFF', // text/icons on violet & ink blocks
  surface: '#F4F2F9', // app canvas
  panel: '#FFFFFF', // cards, inputs, modals
  border: '#E7E3F2',
  borderSubtle: '#F0EDF7',

  // Semantic
  success: '#22C55E',
  successSoft: '#F0FDF4',
  successBorder: '#BBF7D0',
  successInk: '#15803D',
  danger: '#EF4444',
  dangerSoft: '#FEF2F2',
  dangerBorder: '#FCA5A5',
  dangerInk: '#DC2626',
  onSite: '#166534',
  onSiteSoft: '#DCFCE7',
  onSiteBorder: '#86EFAC',

  // Compat aliases used by pre-refactor components
  primary: '#5B3BE8',
  primaryDark: '#4427C6',
  muted: '#5D586C',
  background: '#F4F2F9',
  panelColor: '#FFFFFF',
  primarySoft: '#E4DBFF',
  primaryPressed: '#4427C6',
  warningSoft: '#FDEBC8',
  disabled: '#ECEAF2',
} as const;

// Named tokens matching the sticker sheet's semantic roles.
export const token = {
  primary: colors.violet,
  primaryPressed: colors.violetDark,
  accent: colors.lime,
  accentPressed: colors.limeHover,
  soft: colors.lavender,
  softSubtle: colors.lavenderSubtle,
  tint: colors.pink,
  ink: colors.ink,
  inkMuted: colors.inkMuted,
  surface: colors.surface,
  panel: colors.panel,
  border: colors.border,
  borderSubtle: colors.borderSubtle,
  success: colors.success,
  danger: colors.danger,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
} as const;

// Sticker sheet radius scale: 2xl 18 / 3xl 24 / 4xl 32.
export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  '2xl': 18,
  '3xl': 24,
  '4xl': 32,
  full: 999,
} as const;

export const shadow = {
  // 0 4px 20px -2px rgba(23,20,31,.05)
  subtle: {
    shadowColor: '#17141F',
    shadowOpacity: 0.05,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  // 0 12px 32px -4px rgba(91,59,232,.12)
  elevated: {
    shadowColor: '#5B3BE8',
    shadowOpacity: 0.12,
    shadowRadius: 32,
    shadowOffset: { width: 0, height: 12 },
    elevation: 6,
  },
  // 0 2px 10px rgba(0,0,0,.02), 0 0 1px rgba(0,0,0,.06)
  card: {
    shadowColor: '#000000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
} as const;

export const fontFamily = {
  display: 'Fraunces', // editorial serif, headings & numerals
  sans: 'Plus Jakarta Sans', // clean modern sans, UI body
} as const;

// Sticker sheet type scale (px).
export const typography = {
  display: {
    fontFamily: fontFamily.display,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '700',
    letterSpacing: -0.84, // -0.03em editorial
  },
  displayHero: {
    fontFamily: fontFamily.display,
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '400',
    letterSpacing: -0.6, // hero time "08:00 — 10:30"
  },
  title: {
    fontFamily: fontFamily.display,
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '600',
  },
  subtitle: {
    fontFamily: fontFamily.display,
    fontSize: 18,
    lineHeight: 26,
    fontWeight: '400',
    letterSpacing: -0.36,
  },
  body: {
    fontFamily: fontFamily.sans,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
  },
  bodyStrong: {
    fontFamily: fontFamily.sans,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
  },
  label: {
    fontFamily: fontFamily.sans,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
  caption: {
    fontFamily: fontFamily.sans,
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '400',
  },
  overline: {
    fontFamily: fontFamily.sans,
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '700',
    letterSpacing: 0.8, // 0.08em uppercase spec labels
  },
} as const;
