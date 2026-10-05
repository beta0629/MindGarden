/**
 * 수동 발송 수신자 상한을 서버 설정(GET config)에서 읽는다. 실패하면 폴백 값을 쓴다.
 *
 * @author MindGarden
 * @since 2026-10-05
 */

import { useEffect, useState } from 'react';
import {
  MANUAL_NOTIFICATION_FALLBACK_MAX_RECIPIENTS,
  fetchManualNotificationConfig
} from '../api/admin/manualNotificationApi';

const toPositiveInt = (value) => {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : null;
};

/**
 * @returns {{ maxRecipients: number, maxExclusions: (number|null), loaded: boolean, fromServer: boolean }}
 */
const useManualNotificationLimit = () => {
  const [state, setState] = useState({
    maxRecipients: MANUAL_NOTIFICATION_FALLBACK_MAX_RECIPIENTS,
    maxExclusions: null,
    loaded: false,
    fromServer: false
  });

  useEffect(() => {
    let cancelled = false;
    (async() => {
      try {
        const config = await fetchManualNotificationConfig();
        if (cancelled) {
          return;
        }
        const max = toPositiveInt(config?.maxRecipients);
        setState({
          maxRecipients: max ?? MANUAL_NOTIFICATION_FALLBACK_MAX_RECIPIENTS,
          maxExclusions: toPositiveInt(config?.maxExclusions),
          loaded: true,
          fromServer: max != null
        });
      } catch (err) {
        if (!cancelled) {
          setState((prev) => ({ ...prev, loaded: true, fromServer: false }));
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
};

export default useManualNotificationLimit;
