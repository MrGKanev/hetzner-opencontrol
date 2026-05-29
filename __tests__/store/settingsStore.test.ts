import { useSettingsStore } from '../../src/store/settingsStore';

const reset = () =>
  useSettingsStore.setState({
    hapticsEnabled: true,
    refreshInterval: 0,
    notificationsEnabled: false,
  });

describe('useSettingsStore', () => {
  beforeEach(reset);

  it('has correct default state', () => {
    const s = useSettingsStore.getState();
    expect(s.hapticsEnabled).toBe(true);
    expect(s.refreshInterval).toBe(0);
    expect(s.notificationsEnabled).toBe(false);
  });

  it('setHapticsEnabled toggles haptics', () => {
    useSettingsStore.getState().setHapticsEnabled(false);
    expect(useSettingsStore.getState().hapticsEnabled).toBe(false);

    useSettingsStore.getState().setHapticsEnabled(true);
    expect(useSettingsStore.getState().hapticsEnabled).toBe(true);
  });

  it('setRefreshInterval updates the interval', () => {
    useSettingsStore.getState().setRefreshInterval(60);
    expect(useSettingsStore.getState().refreshInterval).toBe(60);
  });

  it('setNotificationsEnabled enables notifications', () => {
    useSettingsStore.getState().setNotificationsEnabled(true);
    expect(useSettingsStore.getState().notificationsEnabled).toBe(true);
  });
});
