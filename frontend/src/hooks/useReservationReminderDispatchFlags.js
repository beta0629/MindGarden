/**
 * 예약 D-1·D-2 리마인더 SMS 종목 발송 게이트 로드·패치 훅.
 *
 * SSOT: SMS 템플릿 {@code extra_data.dispatch_enabled}
 * (API: getSmsTemplates / patchTemplateDispatchFlag).
 * system_config 키를 새로 만들지 않는다.
 *
 * @author MindGarden
 * @since 2026-09-26
 */

import { useCallback, useEffect, useState } from 'react';
import {
  getSmsTemplates,
  patchTemplateDispatchFlag
} from '../api/admin/smsTemplateApi';
import { BATCH_NOTIFICATION_TEMPLATE_CODES } from '../constants/batchNotificationCodes';
import {
  findSmsTemplateByKey,
  getTemplateDispatchEnabled,
  normalizeSmsTemplateList
} from '../utils/smsDispatchHelpers';
import { runResourceLoad, softRefresh } from '../utils/softRefresh';

const D1_KEY = BATCH_NOTIFICATION_TEMPLATE_CODES.RESERVATION_IMMEDIATE_LATE;
const D2_KEY = BATCH_NOTIFICATION_TEMPLATE_CODES.RESERVATION_REMINDER_D2;

const EMPTY_FLAGS = Object.freeze({
  d1Enabled: false,
  d2Enabled: false,
  d1Found: false,
  d2Found: false
});

/**
 * @param {object} [options]
 * @param {boolean} [options.enabled=true] false 이면 로드하지 않음
 * @param {(error: unknown) => void} [options.onLoadError]
 * @returns {{
 *   flags: typeof EMPTY_FLAGS,
 *   loading: boolean,
 *   d1TemplateKey: string,
 *   d2TemplateKey: string,
 *   reload: (opts?: { silent?: boolean }) => Promise<void>,
 *   softReload: () => Promise<void>,
 *   patchD1: (enabled: boolean) => Promise<void>,
 *   patchD2: (enabled: boolean) => Promise<void>
 * }}
 */
export const useReservationReminderDispatchFlags = ({
  enabled = true,
  onLoadError
} = {}) => {
  const [flags, setFlags] = useState(EMPTY_FLAGS);
  const [loading, setLoading] = useState(Boolean(enabled));

  const loadFlags = useCallback(async(options = {}) => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    try {
      await runResourceLoad(options, setLoading, async() => {
        const response = await getSmsTemplates();
        const items = normalizeSmsTemplateList(response);
        const d1Item = findSmsTemplateByKey(items, D1_KEY);
        const d2Item = findSmsTemplateByKey(items, D2_KEY);
        setFlags({
          d1Enabled: getTemplateDispatchEnabled(d1Item),
          d2Enabled: getTemplateDispatchEnabled(d2Item),
          d1Found: Boolean(d1Item),
          d2Found: Boolean(d2Item)
        });
      });
    } catch (error) {
      setFlags(EMPTY_FLAGS);
      throw error;
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    loadFlags().catch((error) => {
      if (typeof onLoadError === 'function') {
        onLoadError(error);
      }
    });
  }, [enabled, loadFlags, onLoadError]);

  const softReload = useCallback(() => softRefresh(loadFlags), [loadFlags]);

  const patchD1 = useCallback(async(nextEnabled) => {
    await patchTemplateDispatchFlag(D1_KEY, { enabled: nextEnabled });
  }, []);

  const patchD2 = useCallback(async(nextEnabled) => {
    await patchTemplateDispatchFlag(D2_KEY, { enabled: nextEnabled });
  }, []);

  return {
    flags,
    loading,
    d1TemplateKey: D1_KEY,
    d2TemplateKey: D2_KEY,
    reload: loadFlags,
    softReload,
    patchD1,
    patchD2
  };
};

export default useReservationReminderDispatchFlags;
