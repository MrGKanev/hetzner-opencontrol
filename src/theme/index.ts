export const darkColors = {
  background: '#0D0D0D',
  surface: '#1A1A1A',
  card: '#1E1E1E',
  cardBorder: '#2A2A2A',
  primary: '#E2001A',
  primaryDark: '#B0001A',
  textPrimary: '#FFFFFF',
  textSecondary: '#999999',
  textMuted: '#555555',
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  chartCpu: '#E2001A',
  chartDisk: '#F59E0B',
  chartNetwork: '#3B82F6',
} as const;

export const lightColors = {
  background: '#F2F2F7',
  surface: '#FFFFFF',
  card: '#FFFFFF',
  cardBorder: '#D1D1D6',
  primary: '#E2001A',
  primaryDark: '#B0001A',
  textPrimary: '#000000',
  textSecondary: '#555555',
  textMuted: '#AEAEB2',
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  chartCpu: '#E2001A',
  chartDisk: '#F59E0B',
  chartNetwork: '#3B82F6',
} as const;

export type ThemeColors = typeof darkColors;

// Static fallback used in non-component contexts (e.g. navigation theme config)
export const Colors = darkColors;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const BorderRadius = {
  sm: 6,
  md: 10,
  lg: 16,
  full: 999,
} as const;

// Typography without colors - components add their own color via ThemeColors
export const Typography = {
  h1: { fontSize: 28, fontWeight: '700' as const },
  h2: { fontSize: 22, fontWeight: '700' as const },
  h3: { fontSize: 18, fontWeight: '600' as const },
  body: { fontSize: 15, fontWeight: '400' as const },
  bodySmall: { fontSize: 13, fontWeight: '400' as const },
  caption: { fontSize: 11, fontWeight: '400' as const },
  label: { fontSize: 12, fontWeight: '600' as const, textTransform: 'uppercase' as const, letterSpacing: 0.8 },
} as const;
