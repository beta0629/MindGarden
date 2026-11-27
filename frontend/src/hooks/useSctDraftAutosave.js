/**
 * SCT 임시저장 debounce + 수동 저장
 *
 * @author MindGarden
 * @since 2026-11-23
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { saveSctDraft } from '../utils/sctApi';
import { saveSctPublicDraft } from '../utils/sctPublicDraftStorage';
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
  const [localSaved, setLocalSaved] = useState(false);
  const timerRef = useRef(null);
  const latestRef = useRef({ token, verifySessionId, answersMap });
  const inFlightRef = useRef(false);
  const pendingRef = useRef(false);

  latestRef.current = { token, verifySessionId, answersMap };

  const mirrorLocal = useCallback((snap) => {
    if (!snap?.token) {
      return false;
    }
    const ok = saveSctPublicDraft(snap.token, snap.answersMap);
    setLocalSaved(ok);
    return ok;
  }, []);

  const persist = useCallback(async() => {
    const snap = latestRef.current;
    if (!snap.token || !enabled) {
      return;
    }
    // 서버 성공/실패와 무관하게 기기 로컬에 미러 (세션 만료·재시작 대비)
    mirrorLocal(snap);
    if (!snap.verifySessionId) {
      return;
    }
    if (inFlightRef.current) {
      pendingRef.current = true;
      return;
    }
    inFlightRef.current = true;
    setStatus(SCT_SAVE_STATUS.SAVING);
    try {
      do {
        pendingRef.current = false;
        const current = latestRef.current;
        if (!current.token || !enabled) {
          break;
        }
        mirrorLocal(current);
        if (!current.verifySessionId) {
          break;
        }
        const answers = Object.values(current.answersMap || {})
          .filter((a) => a && a.formItemId != null);
        await saveSctDraft(current.token, {
          verifySessionId: current.verifySessionId,
          answers
        });
        const now = new Date();
        const label = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        setSavedAtLabel(label);
        setStatus(SCT_SAVE_STATUS.SAVED);
      } while (pendingRef.current);
    } catch (error) {
      mirrorLocal(latestRef.current);
      setStatus(SCT_SAVE_STATUS.OFFLINE);
    } finally {
      inFlightRef.current = false;
    }
  }, [enabled, mirrorLocal]);

  const saveNow = useCallback(() => persist(), [persist]);

  useEffect(() => {
    if (!enabled || !token) {
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

  return { status, statusText, savedAtLabel, saveNow, localSaved };
}
