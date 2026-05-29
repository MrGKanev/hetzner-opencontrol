import { darkColors, lightColors, Colors, Spacing, BorderRadius, Typography } from '../../src/theme';

describe('darkColors', () => {
  it('has a dark background', () => {
    expect(darkColors.background).toBe('#0D0D0D');
  });

  it('uses Hetzner red as primary', () => {
    expect(darkColors.primary).toBe('#E2001A');
  });

  it('has white text primary', () => {
    expect(darkColors.textPrimary).toBe('#FFFFFF');
  });

  it('has all required color keys', () => {
    const requiredKeys = [
      'background', 'surface', 'card', 'cardBorder',
      'primary', 'primaryDark', 'textPrimary', 'textSecondary', 'textMuted',
      'success', 'warning', 'error', 'info',
      'chartCpu', 'chartDisk', 'chartNetwork',
    ];
    for (const key of requiredKeys) {
      expect(darkColors).toHaveProperty(key);
    }
  });
});

describe('lightColors', () => {
  it('has a light background', () => {
    expect(lightColors.background).toBe('#F2F2F7');
  });

  it('uses the same Hetzner red as primary', () => {
    expect(lightColors.primary).toBe('#E2001A');
  });

  it('has black text primary', () => {
    expect(lightColors.textPrimary).toBe('#000000');
  });

  it('has all required color keys', () => {
    const requiredKeys = [
      'background', 'surface', 'card', 'cardBorder',
      'primary', 'primaryDark', 'textPrimary', 'textSecondary', 'textMuted',
      'success', 'warning', 'error', 'info',
      'chartCpu', 'chartDisk', 'chartNetwork',
    ];
    for (const key of requiredKeys) {
      expect(lightColors).toHaveProperty(key);
    }
  });
});

describe('Colors (static fallback)', () => {
  it('equals darkColors', () => {
    expect(Colors).toEqual(darkColors);
  });
});

describe('Spacing', () => {
  it('has xs < sm < md < lg < xl < xxl', () => {
    expect(Spacing.xs).toBeLessThan(Spacing.sm);
    expect(Spacing.sm).toBeLessThan(Spacing.md);
    expect(Spacing.md).toBeLessThan(Spacing.lg);
    expect(Spacing.lg).toBeLessThan(Spacing.xl);
    expect(Spacing.xl).toBeLessThan(Spacing.xxl);
  });

  it('has expected values', () => {
    expect(Spacing.xs).toBe(4);
    expect(Spacing.sm).toBe(8);
    expect(Spacing.md).toBe(16);
    expect(Spacing.lg).toBe(24);
    expect(Spacing.xl).toBe(32);
    expect(Spacing.xxl).toBe(48);
  });
});

describe('BorderRadius', () => {
  it('has sm < md < lg < full', () => {
    expect(BorderRadius.sm).toBeLessThan(BorderRadius.md);
    expect(BorderRadius.md).toBeLessThan(BorderRadius.lg);
    expect(BorderRadius.lg).toBeLessThan(BorderRadius.full);
  });

  it('full is a large pill value', () => {
    expect(BorderRadius.full).toBe(999);
  });
});

describe('Typography', () => {
  it('h1 has the largest font size', () => {
    expect(Typography.h1.fontSize).toBeGreaterThan(Typography.h2.fontSize);
    expect(Typography.h2.fontSize).toBeGreaterThan(Typography.h3.fontSize);
  });

  it('headings have bold font weight', () => {
    expect(Typography.h1.fontWeight).toBe('700');
    expect(Typography.h2.fontWeight).toBe('700');
    expect(Typography.h3.fontWeight).toBe('600');
  });

  it('body text has a readable font size', () => {
    expect(Typography.body.fontSize).toBeGreaterThanOrEqual(13);
  });

  it('label has uppercase transform', () => {
    expect(Typography.label.textTransform).toBe('uppercase');
  });
});
