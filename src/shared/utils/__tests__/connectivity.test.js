jest.mock('expo-network', () => {
  const listeners = [];
  return {
    NetworkStateType: { NONE: 'NONE', UNKNOWN: 'UNKNOWN', CELLULAR: 'CELLULAR', WIFI: 'WIFI' },
    addNetworkStateListener: jest.fn((listener) => {
      listeners.push(listener);
      return { remove: jest.fn() };
    }),
    getNetworkStateAsync: jest.fn(() =>
      Promise.resolve({ type: 'WIFI', isConnected: true, isInternetReachable: true })
    ),
    emit: (state) => listeners.forEach((listener) => listener(state)),
  };
});

// Each test gets a fresh module so the connectivity state does not leak between tests.
const load = () => {
  jest.resetModules();
  return {
    Network: require('expo-network'),
    connectivity: require('@shared/utils/connectivity'),
  };
};

const flushPromises = () => new Promise((resolve) => setImmediate(resolve));

describe('isOfflineState', () => {
  const { isOfflineState } = require('@shared/utils/connectivity');

  it('detects a missing or unusable connection', () => {
    expect(isOfflineState({ type: 'NONE', isConnected: false })).toBe(true);
    expect(isOfflineState({ type: 'WIFI', isConnected: true, isInternetReachable: false })).toBe(true);
    expect(isOfflineState({ type: 'CELLULAR', isConnected: false })).toBe(true);
  });

  it('treats connected or uncertain readings as online', () => {
    expect(isOfflineState({ type: 'WIFI', isConnected: true, isInternetReachable: true })).toBe(false);
    expect(isOfflineState({ type: 'UNKNOWN', isConnected: false, isInternetReachable: false })).toBe(false);
    expect(isOfflineState(null)).toBe(false);
  });
});

describe('connectivity store', () => {
  it('notifies subscribers of offline/online transitions only', async () => {
    const { Network, connectivity } = load();
    const listener = jest.fn();
    connectivity.subscribeToConnectivity(listener);
    await flushPromises();
    expect(connectivity.isDeviceOffline()).toBe(false);

    Network.emit({ type: 'NONE', isConnected: false });
    Network.emit({ type: 'NONE', isConnected: false });
    expect(connectivity.isDeviceOffline()).toBe(true);
    Network.emit({ type: 'WIFI', isConnected: true, isInternetReachable: true });

    expect(listener.mock.calls).toEqual([[true], [false]]);
    expect(Network.addNetworkStateListener).toHaveBeenCalledTimes(1);
  });

  it('applies the initial network snapshot', async () => {
    const { Network, connectivity } = load();
    Network.getNetworkStateAsync.mockResolvedValueOnce({ type: 'NONE', isConnected: false });
    connectivity.subscribeToConnectivity(jest.fn());
    await flushPromises();
    expect(connectivity.isDeviceOffline()).toBe(true);
  });

  it('ignores an initial snapshot older than a live event', async () => {
    const { Network, connectivity } = load();
    Network.getNetworkStateAsync.mockResolvedValueOnce({ type: 'NONE', isConnected: false });
    connectivity.subscribeToConnectivity(jest.fn());
    Network.emit({ type: 'WIFI', isConnected: true, isInternetReachable: true });
    await flushPromises();
    expect(connectivity.isDeviceOffline()).toBe(false);
  });

  it('lets a successful request override an offline reading', () => {
    const { Network, connectivity } = load();
    const listener = jest.fn();
    connectivity.subscribeToConnectivity(listener);
    Network.emit({ type: 'WIFI', isConnected: true, isInternetReachable: false });
    expect(connectivity.isDeviceOffline()).toBe(true);

    connectivity.reportOnline();
    expect(connectivity.isDeviceOffline()).toBe(false);
    expect(listener).toHaveBeenLastCalledWith(false);
  });

  it('keeps a missing connection offline even if a (cached) request succeeds', () => {
    const { Network, connectivity } = load();
    connectivity.subscribeToConnectivity(jest.fn());
    Network.emit({ type: 'NONE', isConnected: false, isInternetReachable: false });
    connectivity.reportOnline();
    expect(connectivity.isDeviceOffline()).toBe(true);
  });

  it('stops notifying after unsubscribing', () => {
    const { Network, connectivity } = load();
    const listener = jest.fn();
    const unsubscribe = connectivity.subscribeToConnectivity(listener);
    unsubscribe();
    Network.emit({ type: 'NONE', isConnected: false });
    expect(listener).not.toHaveBeenCalled();
  });
});
