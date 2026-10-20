/**
 * 서버 시각 SSOT 훅·Provider.
 * 앱 시작·visibility/focus·online·주기(10분) 동기화.
 *
 * @author CoreSolution
 * @since 2026-10-14
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react';
import PropTypes from 'prop-types';
import { SERVER_CLOCK_SYNC_INTERVAL_MS } from '../constants/api';
import {
  getNow as getServerNow,
  isServerClockSynced,
  syncServerClock
} from '../utils/serverClock';

const ServerClockContext = createContext(null);

/**
 * @param {{ children: React.ReactNode }} props
 */
export const ServerClockProvider = ({ children }) => {
  const [syncGeneration, setSyncGeneration] = useState(0);

  const runSync = useCallback(async () => {
    const ok = await syncServerClock();
    if (ok) {
      setSyncGeneration((n) => n + 1);
    }
    return ok;
  }, []);

  useEffect(() => {
    runSync();

    const onVisibility = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        runSync();
      }
    };
    const onFocus = () => {
      runSync();
    };
    const onOnline = () => {
      runSync();
    };

    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('focus', onFocus);
    window.addEventListener('online', onOnline);

    const intervalId = setInterval(() => {
      runSync();
    }, SERVER_CLOCK_SYNC_INTERVAL_MS);

    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('online', onOnline);
      clearInterval(intervalId);
    };
  }, [runSync]);

  const value = useMemo(
    () => ({
      getNow: getServerNow,
      syncNow: runSync,
      synced: isServerClockSynced(),
      syncGeneration
    }),
    [runSync, syncGeneration]
  );

  return (
    <ServerClockContext.Provider value={value}>
      {children}
    </ServerClockContext.Provider>
  );
};

ServerClockProvider.propTypes = {
  children: PropTypes.node
};

/**
 * @returns {{ getNow: () => Date, syncNow: () => Promise<boolean>, synced: boolean, syncGeneration: number }}
 */
export const useServerClock = () => {
  const ctx = useContext(ServerClockContext);
  if (ctx) {
    return ctx;
  }
  return {
    getNow: getServerNow,
    syncNow: syncServerClock,
    synced: isServerClockSynced(),
    syncGeneration: 0
  };
};

export default useServerClock;
