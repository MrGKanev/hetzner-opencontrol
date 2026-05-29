import { useFavoritesStore } from '../../src/store/favoritesStore';

beforeEach(() => useFavoritesStore.setState({ serverIds: [] }));

describe('useFavoritesStore', () => {
  it('starts with no favorites', () => {
    expect(useFavoritesStore.getState().serverIds).toEqual([]);
  });

  it('isFavorite returns false for an unknown server', () => {
    expect(useFavoritesStore.getState().isFavorite(1)).toBe(false);
  });

  it('toggle() adds a server to favorites', () => {
    useFavoritesStore.getState().toggle(1);
    expect(useFavoritesStore.getState().serverIds).toContain(1);
    expect(useFavoritesStore.getState().isFavorite(1)).toBe(true);
  });

  it('toggle() removes a server that is already a favorite', () => {
    useFavoritesStore.setState({ serverIds: [1, 2] });
    useFavoritesStore.getState().toggle(1);
    expect(useFavoritesStore.getState().serverIds).not.toContain(1);
    expect(useFavoritesStore.getState().serverIds).toContain(2);
  });

  it('toggle() on multiple different servers adds them all', () => {
    useFavoritesStore.getState().toggle(10);
    useFavoritesStore.getState().toggle(20);
    useFavoritesStore.getState().toggle(30);
    expect(useFavoritesStore.getState().serverIds).toEqual([10, 20, 30]);
  });

  it('isFavorite is independent per server id', () => {
    useFavoritesStore.setState({ serverIds: [5] });
    expect(useFavoritesStore.getState().isFavorite(5)).toBe(true);
    expect(useFavoritesStore.getState().isFavorite(6)).toBe(false);
  });
});
