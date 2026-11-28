/**
 * SCT 임시저장 debounce + 수동 저장
 * 답변 본문은 서버 암호화 draft만 사용. localStorage 평문 미러 없음.
 *
 * @author MindGarden
 * @since 2026-11-23
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { saveSctDraft } from '../utils/sctApi';
import { isSctLinkUnusableError } from '../utils/sctPublicVerifyError';
import { SCT_DEFAULTS, SCT_UI } from '../constants/sctOnline';

export const SCT_SAVE_STATUS = Object.freeze({
  IDLE: 'IDLE',
  SAVING: 'SAVING',
  SAVED: 'SAVED',
  OFFLINE: 'OFFLINE',
  /** 링크 사용 시간 초과·링크 없음(404/410) — 화면 입력은 유지 */
  LINK_EXPIRED: 'LINK_EXPIRED'
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
  const inFlightRef = useRef(null);
  const pendingRef = useRef(false);

  latestRef.current = { token, verifySessionId, answersMap };

  /**
   * 서버 임시저장. 오류를 삼키지 않고 상태로 드러내며 성공 여부를 돌려준다.
   * 실패해도 answersMap(화면 입력)은 건드리지 않는다. localStorage 미러 없음.
   * @returns {Promise<{ ok: boolean, status: string }>} 저장 성공(또는 저장할 것 없음) 여부·결과 상태
   */
  const persist = useCallback(async() => {
    const snap = latestRef.current;
    if (!snap.token || !enabled) {
      return { ok: true, status: SCT_SAVE_STATUS.IDLE };
    }
    // 로컬 답변 미러 비활성 — localSaved는 항상 false
    setLocalSaved(false);
    if (!snap.verifySessionId) {
      return { ok: true, status: SCT_SAVE_STATUS.IDLE };
    }
    if (inFlightRef.current) {
      pendingRef.current = true;
      return inFlightRef.current;
    }
    const run = (async() => {
      setStatus(SCT_SAVE_STATUS.SAVING);
      try {
        do {
          pendingRef.current = false;
          const current = latestRef.current;
          if (!current.token || !enabled || !current.verifySessionId) {
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
        return { ok: true, status: SCT_SAVE_STATUS.SAVED };
      } catch (error) {
        const failed = isSctLinkUnusableError(error)
          ? SCT_SAVE_STATUS.LINK_EXPIRED
          : SCT_SAVE_STATUS.OFFLINE;
        setStatus(failed);
        return { ok: false, status: failed };
      } finally {
        inFlightRef.current = null;
      }
    })();
    inFlightRef.current = run;
    return run;
  }, [enabled]);

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
    if (status === SCT_SAVE_STATUS.LINK_EXPIRED) return SCT_UI.LINK_SESSION_EXPIRED;
    if (status === SCT_SAVE_STATUS.SAVED && savedAtLabel) {
      return `${SCT_UI.SAVE_SAVED} ${savedAtLabel}`;
    }
    if (status === SCT_SAVE_STATUS.SAVED) return SCT_UI.SAVE_SAVED;
    return '';
  })();

  return { status, statusText, savedAtLabel, saveNow, localSaved };
}
