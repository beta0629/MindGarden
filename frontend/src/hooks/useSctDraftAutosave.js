/**
 * SCT 임시저장 debounce + 수동 저장
 *
 * @author MindGarden
 * @since 2026-11-23
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { saveSctDraft } from '../utils/sctApi';
import { SCT_DEFAULTS, SCT_UI } from '../constants/sctOnline';

export const SCT_SAVE_STATUS = Object.freeze({
  IDLE: 'IDLE',
  SAVING: 'SAVING',
  SAVED: 'SAVED',
  OFFLINE: 'OFFLINE'
});

/**
 * @param {{
 *   token: string,
 *   verifySessionId: string,
 *   answersMap: Record<string, { formItemId: number, answerText?: string, notApplicable?: boolean }>,
 *   enabled?: boolean
 * }} params
 */
export default function useSctDraftAutosave({
  token,
  verifySessionId,
  answersMap,
  enabled = true
}) {
  const [status, setStatus] = useState(SCT_SAVE_STATUS.IDLE);
  const [savedAtLabel, setSavedAtLabel] = useState('');
  const timerRef = useRef(null);
  const latestRef = useRef({ token, verifySessionId, answersMap });

  latestRef.current = { token, verifySessionId, answersMap };

  const persist = useCallback(async() => {
    const snap = latestRef.current;
    if (!snap.token || !snap.verifySessionId || !enabled) {
      return;
    }
    const answers = Object.values(snap.answersMap || {}).filter((a) => a && a.formItemId != null);
    setStatus(SCT_SAVE_STATUS.SAVING);
    try {
      await saveSctDraft(snap.token, {
        verifySessionId: snap.verifySessionId,
        answers
      });
      const now = new Date();
      const label = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      setSavedAtLabel(label);
      setStatus(SCT_SAVE_STATUS.SAVED);
    } catch (error) {
      if (typeof navigator !== 'undefined' && navigator.onLine === false) {
        setStatus(SCT_SAVE_STATUS.OFFLINE);
      } else {
        setStatus(SCT_SAVE_STATUS.OFFLINE);
      }
    }
  }, [enabled]);

  const saveNow = useCallback(() => persist(), [persist]);

  useEffect(() => {
    if (!enabled || !token || !verifySessionId) {
      return undefined;
    }
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(() => {
      persist();
    }, SCT_DEFAULTS.DRAFT_DEBOUNCE_MS);
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [answersMap, enabled, persist, token, verifySessionId]);

  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === 'hidden') {
        persist();
      }
    };
    document.addEventListener('visibilitychange', onHide);
    return () => document.removeEventListener('visibilitychange', onHide);
  }, [persist]);

  const statusText = (() => {
    if (status === SCT_SAVE_STATUS.SAVING) return SCT_UI.SAVE_SAVING;
    if (status === SCT_SAVE_STATUS.OFFLINE) return SCT_UI.SAVE_OFFLINE;
    if (status === SCT_SAVE_STATUS.SAVED && savedAtLabel) {
      return `${SCT_UI.SAVE_SAVED} ${savedAtLabel}`;
    }
    if (status === SCT_SAVE_STATUS.SAVED) return SCT_UI.SAVE_SAVED;
    return '';
  })();

  return { status, statusText, savedAtLabel, saveNow };
}
