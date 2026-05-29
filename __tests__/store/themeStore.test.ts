import { useThemeStore, useColors } from '../../src/store/themeStore';
import { darkColors, lightColors } from '../../src/theme';
import { renderHook, act } from '@testing-library/react-native';

beforeEach(() => useThemeStore.setState({ isDark: true, colors: darkColors }));

describe('useThemeStore', () => {
  it('starts in dark mode', () => {
    expect(useThemeStore.getState().isDark).toBe(true);
    expect(useThemeStore.getState().colors).toEqual(darkColors);
  });

  it('toggle() switches to light mode', () => {
    useThemeStore.getState().toggle();
    expect(useThemeStore.getState().isDark).toBe(false);
    expect(useThemeStore.getState().colors).toEqual(lightColors);
  });

  it('toggle() twice returns to dark mode', () => {
    useThemeStore.getState().toggle();
    useThemeStore.getState().toggle();
    expect(useThemeStore.getState().isDark).toBe(true);
    expect(useThemeStore.getState().colors).toEqual(darkColors);
  });
});

describe('useColors hook', () => {
  it('returns dark colors in dark mode', () => {
    useThemeStore.setState({ isDark: true, colors: darkColors });
    const { result } = renderHook(() => useColors());
    expect(result.current).toEqual(darkColors);
  });

  it('returns light colors after toggling', async () => {
    useThemeStore.setState({ isDark: true, colors: darkColors });
    const { result } = renderHook(() => useColors());

    await act(async () => { useThemeStore.getState().toggle(); });

    expect(result.current).toEqual(lightColors);
  });
});
