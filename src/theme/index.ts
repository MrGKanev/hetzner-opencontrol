export const Colors = {
  // Backgrounds
  background: '#0D0D0D',
  surface: '#1A1A1A',
  card: '#1E1E1E',
  cardBorder: '#2A2A2A',

  // Accent
  primary: '#E2001A',
  primaryDark: '#B0001A',

  // Text
  textPrimary: '#FFFFFF',
  textSecondary: '#999999',
  textMuted: '#555555',

  // Status
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',

  // Chart colors
  chartCpu: '#E2001A',
  chartDisk: '#F59E0B',
  chartNetwork: '#3B82F6',
} as const;

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

export const Typography = {
  h1: { fontSize: 28, fontWeight: '700' as const, color: Colors.textPrimary },
  h2: { fontSize: 22, fontWeight: '700' as const, color: Colors.textPrimary },
  h3: { fontSize: 18, fontWeight: '600' as const, color: Colors.textPrimary },
  body: { fontSize: 15, fontWeight: '400' as const, color: Colors.textPrimary },
  bodySmall: { fontSize: 13, fontWeight: '400' as const, color: Colors.textSecondary },
  caption: { fontSize: 11, fontWeight: '400' as const, color: Colors.textMuted },
  label: { fontSize: 12, fontWeight: '600' as const, color: Colors.textSecondary, textTransform: 'uppercase' as const, letterSpacing: 0.8 },
} as const;
