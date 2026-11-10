import { useEffect, useRef, useSyncExternalStore } from 'react';
import * as Network from 'expo-network';

const { NetworkStateType } = Network;

// UNKNOWN is reported while the OS is still resolving the connection; it is treated as online
// so an uncertain reading never shows an "offline" state by mistake.
export const isOfflineState = (state) => {
  if (!state || !state.type || state.type === NetworkStateType.UNKNOWN) return false;
  if (state.type === NetworkStateType.NONE) return true;
  return state.isConnected === false || state.isInternetReachable === false;
};

let offline = false;
// No usable network interface at all: any "successful" response can only come from a cache.
let hardOffline = false;
let monitoring = false;
let receivedEvent = false;
const listeners = new Set();

const setOffline = (value) => {
  if (value === offline) return;
  offline = value;
  listeners.forEach((listener) => listener(offline));
};

const applyState = (state) => {
  hardOffline =
    !!state?.type &&
    state.type !== NetworkStateType.UNKNOWN &&
    (state.type === NetworkStateType.NONE || state.isConnected === false);
  setOffline(isOfflineState(state));
};

const startMonitoring = () => {
  if (monitoring) return;
  monitoring = true;
  try {
    Network.addNetworkStateListener((state) => {
      receivedEvent = true;
      applyState(state);
    });
    Network.getNetworkStateAsync()
      .then((state) => {
        // A listener event is more recent than this initial snapshot.
        if (!receivedEvent) applyState(state);
      })
      .catch(() => {});
  } catch (error) {
    console.warn('Network monitoring is unavailable:', error?.message);
  }
};

export const isDeviceOffline = () => offline;

// Some networks block the OS internet check while the internet still works, so a successful
// request overrides an "internet not reachable" reading (but not a missing connection).
export const reportOnline = () => {
  if (!hardOffline) setOffline(false);
};

/** Subscribes to offline/online transitions; the listener receives `isOffline`. */
export const subscribeToConnectivity = (listener) => {
  startMonitoring();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const useIsOffline = () => useSyncExternalStore(subscribeToConnectivity, isDeviceOffline);

/** Calls `callback` each time the device goes from offline back to online. */
export const useOnReconnect = (callback, enabled = true) => {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled) return undefined;
    return subscribeToConnectivity((isOffline) => {
      if (!isOffline) callbackRef.current?.();
    });
  }, [enabled]);
};
