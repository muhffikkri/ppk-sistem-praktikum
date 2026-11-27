// Design tokens — single source of truth.
// Raw source: spec/design-sticker-sheet.md (LabPresensi v1.2 sticker sheet,
// "Sebenza" visual language). Component names mirror the sticker sheet
// sections. Update here and the sticker sheet together.

export const colors = {
  // Brand — "Sebenza" violet family
  violet: '#5B3BE8', // primary
  violetDark: '#482CD4', // pressed / hover of violet
  violetLight: '#7356F5',
  lime: '#D3F36B', // high-visibility accent
  limeHover: '#A3E635',
  lavender: '#EDE7FF', // soft tint
  lavenderSubtle: '#F3EEFF', // very soft tint (logo tile)
  pink: '#FFC2D9', // decorative accent (late / warning tint)
  ink: '#161522', // primary text, dark surface, bottom dock
  inkMuted: '#64748B', // secondary text
  inkSubtle: '#9A95A8', // placeholder / disabled text
  pinkInk: '#8A0F41', // text on pink chips
  onPrimary: '#FFFFFF', // text/icons on violet & ink blocks
  onInkMuted: 'rgba(255,255,255,0.7)', // secondary text on violet & ink
  onInkSubtle: 'rgba(255,255,255,0.08)', // tint panels on ink (white/5–10)
  onInkRaised: 'rgba(255,255,255,0.18)', // raised tint panel on violet/ink (white/18)
  onLightSubtle: 'rgba(22,21,34,0.1)', // subtle ink tint on light/lime fills
  scrim: 'rgba(22,21,34,0.45)', // sheet / modal backdrop
  surface: '#F8F7FD', // app canvas (HTML reference: brand.surface)
  panel: '#FFFFFF', // cards, inputs, modals
  border: '#E8E5F3',
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

  // Accent / Map user marker & transparent radius circles
  blue: '#2563EB',
  blueSoft: '#EFF6FF',
  mapCircleOccupied: 'rgba(91, 59, 232, 0.15)',
  mapCircleOccupiedBorder: 'rgba(91, 59, 232, 0.5)',
  mapCircleAvailable: 'rgba(34, 197, 94, 0.15)',
  mapCircleAvailableBorder: 'rgba(34, 197, 94, 0.5)',

  // Disabled control fill (Button disabled state).
  disabled: '#ECEAF2',

  // Neutral fill for non-selected sentiment score bars.
  scoreNeutral: '#e0e0e0',

  // Google brand colors, dipakai hanya untuk logo pihak ketiga.
  googleBlue: '#4285F4',
  googleGreen: '#34A853',
  googleYellow: '#FBBC05',
  googleRed: '#EB4335',
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

// Android press ripple colors (drawn natively, so feedback appears on the
// touch frame even while the JS thread is busy).
export const ripple = {
  // ink at 8% for panel, surface, lavender and lime fills
  onLight: 'rgba(23,20,31,0.08)',
  // white at 18% for violet and ink fills
  onDark: 'rgba(255,255,255,0.18)',
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
  // 0 12px 32px -4px rgba(23,20,31,.08) — neutral soft shadow (unslop: no violet glow).
  elevated: {
    shadowColor: '#17141F',
    shadowOpacity: 0.08,
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
  // Tekan: bayangan mengikuti borderRadius elemen, bukan kotak pembungkus.
  pressed: {
    shadowColor: '#000000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
} as const;

// Registered family names — one per weight. Keys in src/theme/fonts.ts must
// match. Android cannot pick a weight from `fontWeight` for custom fonts, so
// typography tokens select the weight through the family and never set
// `fontWeight`.
export const fontFamily = {
  display: 'Fraunces_400Regular', // editorial serif, headings & numerals
  displayItalic: 'Fraunces_400Regular_Italic',
  displaySemibold: 'Fraunces_600SemiBold',
  displayBold: 'Fraunces_700Bold',
  sans: 'PlusJakartaSans_400Regular', // clean modern sans, UI body
  sansMedium: 'PlusJakartaSans_500Medium',
  sansSemibold: 'PlusJakartaSans_600SemiBold',
  sansBold: 'PlusJakartaSans_700Bold',
} as const;

// Sticker sheet type scale (px).
export const typography = {
  display: {
    fontFamily: fontFamily.displayBold,
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: -0.84, // -0.03em editorial
  },
  // Italic accent fragment inside a display title (max once per screen).
  displayAccent: {
    fontFamily: fontFamily.displayItalic,
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: -0.84,
  },
  displayHero: {
    fontFamily: fontFamily.display,
    fontSize: 30,
    lineHeight: 36,
    letterSpacing: -0.6, // hero time "08:00 — 10:30"
  },
  // Ukuran hero editorial pada landing screen, dipakai sebagai override
  // fontSize pada variant display/displayAccent.
  displayLanding: {
    fontSize: 50,
  },
  title: {
    fontFamily: fontFamily.displaySemibold,
    fontSize: 24,
    lineHeight: 30,
    letterSpacing: -0.48,
  },
  subtitle: {
    fontFamily: fontFamily.display,
    fontSize: 18,
    lineHeight: 26,
    letterSpacing: -0.36, // -0.02em
  },
  body: {
    fontFamily: fontFamily.sans,
    fontSize: 14,
    lineHeight: 20,
  },
  bodyStrong: {
    fontFamily: fontFamily.sansSemibold,
    fontSize: 14,
    lineHeight: 20,
  },
  // Product mark in the root top bar (HTML reference: text-lg font-bold).
  brandTitle: {
    fontFamily: fontFamily.sansBold,
    fontSize: 18,
    lineHeight: 22,
    letterSpacing: -0.3,
  },
  label: {
    fontFamily: fontFamily.sansMedium,
    fontSize: 13,
    lineHeight: 18,
  },
  caption: {
    fontFamily: fontFamily.sans,
    fontSize: 12,
    lineHeight: 16,
  },
  captionStrong: {
    fontFamily: fontFamily.sansSemibold,
    fontSize: 12,
    lineHeight: 16,
  },
  overline: {
    fontFamily: fontFamily.sansBold,
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 0.8, // 0.08em
    textTransform: 'uppercase',
  },
} as const;
