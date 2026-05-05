import { getStatusColor, capitalizeFirst } from '../../src/utils/serverStatus';
import { darkColors } from '../../src/theme';

describe('capitalizeFirst', () => {
  it('capitalizes the first letter', () => {
    expect(capitalizeFirst('running')).toBe('Running');
    expect(capitalizeFirst('off')).toBe('Off');
    expect(capitalizeFirst('starting')).toBe('Starting');
  });

  it('handles single character', () => {
    expect(capitalizeFirst('a')).toBe('A');
  });

  it('handles already capitalized', () => {
    expect(capitalizeFirst('Running')).toBe('Running');
  });
});

describe('getStatusColor', () => {
  const c = darkColors;

  it('returns success for running', () => {
    expect(getStatusColor('running', c)).toBe(c.success);
  });

  it('returns textMuted for off', () => {
    expect(getStatusColor('off', c)).toBe(c.textMuted);
  });

  it('returns warning for starting and stopping', () => {
    expect(getStatusColor('starting', c)).toBe(c.warning);
    expect(getStatusColor('stopping', c)).toBe(c.warning);
  });

  it('returns info for rebuilding and migrating', () => {
    expect(getStatusColor('rebuilding', c)).toBe(c.info);
    expect(getStatusColor('migrating', c)).toBe(c.info);
  });

  it('returns textMuted for unknown statuses', () => {
    expect(getStatusColor('deleting' as any, c)).toBe(c.textMuted);
  });
});
