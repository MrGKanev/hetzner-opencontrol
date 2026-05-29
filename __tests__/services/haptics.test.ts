import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import { useSettingsStore } from '../../src/store/settingsStore';
import { Haptics } from '../../src/services/haptics';

const triggerMock = ReactNativeHapticFeedback.trigger as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  useSettingsStore.setState({ hapticsEnabled: true });
});

describe('Haptics', () => {
  const cases: [keyof typeof Haptics, string][] = [
    ['light', 'impactLight'],
    ['medium', 'impactMedium'],
    ['heavy', 'impactHeavy'],
    ['success', 'notificationSuccess'],
    ['error', 'notificationError'],
    ['warning', 'notificationWarning'],
  ];

  it.each(cases)('%s() triggers "%s"', (method, expectedType) => {
    Haptics[method]();
    expect(triggerMock).toHaveBeenCalledWith(
      expectedType,
      expect.objectContaining({ enableVibrateFallback: true }),
    );
  });

  it('does nothing when hapticsEnabled is false', () => {
    useSettingsStore.setState({ hapticsEnabled: false });
    Haptics.light();
    expect(triggerMock).not.toHaveBeenCalled();
  });

  it('fires again after re-enabling haptics', () => {
    useSettingsStore.setState({ hapticsEnabled: false });
    Haptics.light();
    expect(triggerMock).not.toHaveBeenCalled();

    useSettingsStore.setState({ hapticsEnabled: true });
    Haptics.light();
    expect(triggerMock).toHaveBeenCalledTimes(1);
  });
});
