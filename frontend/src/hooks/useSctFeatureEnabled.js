/**
 * SCT 기능 플래그(feature.sct.enabled) 조회 훅
 *
 * forms 또는 settings API로 게이트. 실패·404·403이면 OFF.
 *
 * @author MindGarden
 * @since 2026-11-23
 */

import { useCallback, useEffect, useState } from 'react';
import { fetchSctForms, fetchSctSettings } from '../utils/sctApi';
import { HTTP_STATUS } from '../constants/magicNumbers';

/**
 * @param {{ preferSettings?: boolean, enabled?: boolean }} [options]
 * @returns {{ enabled: boolean, loading: boolean, refresh: () => Promise<void> }}
 */
export default function useSctFeatureEnabled(options = {}) {
  const preferSettings = options.preferSettings === true;
  const forceEnabled = options.enabled;
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(forceEnabled == null);

  const refresh = useCallback(async() => {
    if (forceEnabled != null) {
      setEnabled(Boolean(forceEnabled));
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      if (preferSettings) {
        const settings = await fetchSctSettings();
        setEnabled(settings?.featureEnabled === true);
      } else {
        await fetchSctForms();
        setEnabled(true);
      }
    } catch (error) {
      const status = error?.status;
      if (
        status === HTTP_STATUS.NOT_FOUND
        || status === HTTP_STATUS.FORBIDDEN
        || status === HTTP_STATUS.UNAUTHORIZED
      ) {
        setEnabled(false);
      } else if (preferSettings) {
        try {
          await fetchSctForms();
          setEnabled(true);
        } catch {
          setEnabled(false);
        }
      } else {
        setEnabled(false);
      }
    } finally {
      setLoading(false);
    }
  }, [forceEnabled, preferSettings]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { enabled, loading, refresh };
}
