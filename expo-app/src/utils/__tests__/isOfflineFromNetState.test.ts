import { isOfflineFromNetState } from '../isOfflineFromNetState';

describe('isOfflineFromNetState', () => {
  it('treats unknown isConnected (null) as not offline when reachability unknown', () => {
    expect(
      isOfflineFromNetState({ isConnected: null, isInternetReachable: null }),
    ).toBe(false);
  });

  it('treats unknown isConnected with reachable true as not offline', () => {
    expect(
      isOfflineFromNetState({ isConnected: null, isInternetReachable: true }),
    ).toBe(false);
  });

  it('is offline when isConnected is explicitly false', () => {
    expect(
      isOfflineFromNetState({ isConnected: false, isInternetReachable: null }),
    ).toBe(true);
    expect(
      isOfflineFromNetState({ isConnected: false, isInternetReachable: true }),
    ).toBe(true);
  });

  it('is offline when isInternetReachable is explicitly false', () => {
    expect(
      isOfflineFromNetState({ isConnected: true, isInternetReachable: false }),
    ).toBe(true);
    expect(
      isOfflineFromNetState({ isConnected: null, isInternetReachable: false }),
    ).toBe(true);
  });

  it('is online when connected and reachability unknown or true', () => {
    expect(
      isOfflineFromNetState({ isConnected: true, isInternetReachable: null }),
    ).toBe(false);
    expect(
      isOfflineFromNetState({ isConnected: true, isInternetReachable: true }),
    ).toBe(false);
  });
});
