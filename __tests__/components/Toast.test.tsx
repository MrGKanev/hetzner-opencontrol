import React from 'react';
import { Animated } from 'react-native';
import { render, screen, act } from '@testing-library/react-native';
import { useToastStore } from '../../src/store/toastStore';
import Toast from '../../src/components/common/Toast';

// useColors returns darkColors (from jest.setup.js mock of themeStore — not mocked there,
// but the store starts in dark mode, so the real store works fine here)

beforeEach(() => {
  jest.useFakeTimers();
  useToastStore.setState({ message: null });
  // Animated.timing with useNativeDriver=true crashes in the jest environment due to
  // a react/react-native-renderer version mismatch. Spy on it to call the callback immediately.
  jest.spyOn(Animated, 'timing').mockImplementation(
    () => ({
      start: jest.fn((cb?: (r: { finished: boolean }) => void) => cb?.({ finished: true })),
    }) as any,
  );
});

afterEach(() => {
  jest.clearAllTimers();
  jest.useRealTimers();
  jest.restoreAllMocks();
});

it('renders nothing when there is no message', () => {
  render(<Toast />);
  expect(screen.queryByText(/.+/)).toBeNull();
});

it('renders the message text when message is set', () => {
  useToastStore.setState({ message: 'Server deleted' });
  render(<Toast />);
  expect(screen.getByText('Server deleted')).toBeTruthy();
});

it('renders updated message text when store message changes', () => {
  const { rerender } = render(<Toast />);
  act(() => useToastStore.getState().show('Hello'));
  rerender(<Toast />);
  expect(screen.getByText('Hello')).toBeTruthy();
});

it('calls hide() after 3 seconds', () => {
  const hideSpy = jest.spyOn(useToastStore.getState(), 'hide');
  useToastStore.setState({ message: 'Auto-hide me' });
  render(<Toast />);

  // Advance past the 3-second display timer
  act(() => { jest.advanceTimersByTime(3_100); });

  // Animated.timing calls hide as its completion callback after fade-out
  // Verify hide was invoked (the animation completes synchronously in tests)
  expect(hideSpy).toHaveBeenCalled();
});

it('replaces the timer when message changes quickly', () => {
  useToastStore.setState({ message: 'First' });
  const { rerender } = render(<Toast />);

  act(() => { jest.advanceTimersByTime(1_000); });

  act(() => useToastStore.getState().show('Second'));
  rerender(<Toast />);

  // After another 3s the second message should auto-dismiss
  const hideSpy = jest.spyOn(useToastStore.getState(), 'hide');
  act(() => { jest.advanceTimersByTime(3_100); });
  expect(hideSpy).toHaveBeenCalled();
});
