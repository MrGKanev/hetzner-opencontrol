import { useToastStore } from '../../src/store/toastStore';

beforeEach(() => useToastStore.setState({ message: null }));

describe('useToastStore', () => {
  it('starts with no message', () => {
    expect(useToastStore.getState().message).toBeNull();
  });

  it('show() sets the message', () => {
    useToastStore.getState().show('Server deleted');
    expect(useToastStore.getState().message).toBe('Server deleted');
  });

  it('hide() clears the message', () => {
    useToastStore.getState().show('hello');
    useToastStore.getState().hide();
    expect(useToastStore.getState().message).toBeNull();
  });

  it('show() replaces an existing message', () => {
    useToastStore.getState().show('first');
    useToastStore.getState().show('second');
    expect(useToastStore.getState().message).toBe('second');
  });
});
