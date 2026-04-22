import { useCallback, useEffect, useRef, useState } from 'react';
import {
  CONSULTATION_LOG_LOCAL_AUTOSAVE_DEBOUNCE_MS,
  CONSULTATION_LOG_LOCAL_AUTOSAVE_MAX_INTERVAL_MS
} from '../constants/consultationLogAutosaveConstants';
import {
  fetchConsultationLogDraftFromServer,
  pushConsultationLogDraftToServer
} from '../utils/consultationLogDraftServerAdapter';
import {
  readConsultationLogLocalDraft,
  writeConsultationLogLocalDraft
} from '../utils/consultationLogLocalDraft';

/**
 * 상담일지 모달 — 로컬 초안 디바운스·visibility flush·주기 flush 및 복구 후보 탐지.
 *
 * @param {object} params
 * @param {boolean} params.isOpen
 * @param {boolean} params.loading
 * @param {string} params.tenantIdStr
 * @param {{ type: string, id: string }|null} params.draftScope
 * @param {string} params.draftQueryConsultationId 백엔드 consultationId 쿼리(숫자 또는 schedule- 접두)
 * @param {number|null|undefined} params.consultantId 상담사 ID
 * @param {object} params.formData
 * @param {string} params.memoDraft
 * @param {import('react').MutableRefObject<object>} params.formDataRef
 * @param {import('react').MutableRefObject<string>} params.memoDraftRef
 * @param {import('react').MutableRefObject<boolean>} params.contentDirtyRef
 * @param {(draft: { formData: object, memoDraft: string }) => void} params.onRestoreDraftCandidate
 * @returns {{
 *   localAutosaveUi: 'idle'|'saving'|'saved'|'failed',
 *   localSavedAtLabel: string,
 *   serverDraftSyncFailed: boolean,
 *   resetLocalAutosaveState: () => void,
 *   markRestoreHandled: () => void
 * }}
 * @author CoreSolution
 * @since 2026-04-22
 */
export function useConsultationLogLocalAutosave({
  isOpen,
  loading,
  tenantIdStr,
  draftScope,
  draftQueryConsultationId,
  consultantId,
  formData,
  memoDraft,
  formDataRef,
  memoDraftRef,
  contentDirtyRef,
  onRestoreDraftCandidate
}) {
  const [localAutosaveUi, setLocalAutosaveUi] = useState('idle');
  const [localSavedAtLabel, setLocalSavedAtLabel] = useState('');
  const [serverDraftSyncFailed, setServerDraftSyncFailed] = useState(false);
  const debounceTimerRef = useRef(null);
  const restoreHandledKeyRef = useRef('');
  const serverDraftVersionRef = useRef(null);
  const draftVersionSeedDoneKeyRef = useRef('');

  const persistLocalDraftSnapshot = useCallback(() => {
    if (!tenantIdStr || !draftScope) return false;
    if (!contentDirtyRef.current) return false;
    setLocalAutosaveUi('saving');
    try {
      writeConsultationLogLocalDraft(tenantIdStr, draftScope, {
        formData: formDataRef.current,
        memoDraft: memoDraftRef.current
      });
      contentDirtyRef.current = false;
      const timeStr = new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
      setLocalSavedAtLabel(timeStr);
      setLocalAutosaveUi('saved');
      const qid = draftQueryConsultationId != null ? String(draftQueryConsultationId).trim() : '';
      const consNum = consultantId != null ? Number(consultantId) : NaN;
      if (qid && Number.isFinite(consNum)) {
        const snapForm = formDataRef.current;
        const snapMemo = memoDraftRef.current;
        const expected = serverDraftVersionRef.current;
        void (async() => {
          const res = await pushConsultationLogDraftToServer({
            consultationId: qid,
            consultantId: consNum,
            formData: snapForm,
            memoDraft: snapMemo,
            expectedVersion: expected != null && Number.isFinite(Number(expected)) ? Number(expected) : undefined
          });
          if (res.ok) {
            if (res.version != null && Number.isFinite(Number(res.version))) {
              serverDraftVersionRef.current = Number(res.version);
            }
            setServerDraftSyncFailed(false);
          } else if (!res.skipped) {
            setServerDraftSyncFailed(true);
          }
        })();
      }
      return true;
    } catch {
      setLocalAutosaveUi('failed');
      return false;
    }
  }, [
    tenantIdStr,
    draftScope,
    draftQueryConsultationId,
    consultantId,
    contentDirtyRef,
    formDataRef,
    memoDraftRef
  ]);

  const resetLocalAutosaveState = useCallback(() => {
    setLocalAutosaveUi('idle');
    setLocalSavedAtLabel('');
    setServerDraftSyncFailed(false);
  }, []);

  const markRestoreHandled = useCallback(() => {
    if (!tenantIdStr || !draftScope) return;
    restoreHandledKeyRef.current = `${tenantIdStr}:${draftScope.type}:${draftScope.id}`;
  }, [tenantIdStr, draftScope]);

  useEffect(() => {
    if (!isOpen) {
      restoreHandledKeyRef.current = '';
      draftVersionSeedDoneKeyRef.current = '';
      serverDraftVersionRef.current = null;
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
      return undefined;
    }
    return undefined;
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return undefined;
    if (loading || !tenantIdStr || !draftScope) return undefined;
    const qid = draftQueryConsultationId != null ? String(draftQueryConsultationId).trim() : '';
    const consNum = consultantId != null ? Number(consultantId) : NaN;
    if (!qid || !Number.isFinite(consNum)) return undefined;
    const seedKey = `${qid}:${consNum}`;
    if (draftVersionSeedDoneKeyRef.current === seedKey) return undefined;
    let cancelled = false;
    void (async() => {
      const res = await fetchConsultationLogDraftFromServer({
        consultationId: qid,
        consultantId: consNum
      });
      if (cancelled) return;
      draftVersionSeedDoneKeyRef.current = seedKey;
      if (
        res.ok &&
        res.hasDraft &&
        res.version != null &&
        Number.isFinite(Number(res.version)) &&
        serverDraftVersionRef.current == null
      ) {
        serverDraftVersionRef.current = Number(res.version);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [
    isOpen,
    loading,
    tenantIdStr,
    draftScope,
    draftQueryConsultationId,
    consultantId
  ]);

  useEffect(() => {
    if (!isOpen) return undefined;
    if (loading || !tenantIdStr || !draftScope) return undefined;
    const sessionKey = `${tenantIdStr}:${draftScope.type}:${draftScope.id}`;
    if (restoreHandledKeyRef.current === sessionKey) return undefined;
    let rafId = 0;
    rafId = requestAnimationFrame(() => {
      const draft = readConsultationLogLocalDraft(tenantIdStr, draftScope);
      if (!draft) {
        restoreHandledKeyRef.current = sessionKey;
        return;
      }
      const cur = JSON.stringify({ f: formDataRef.current, m: memoDraftRef.current });
      const dr = JSON.stringify({ f: draft.formData, m: draft.memoDraft });
      if (cur === dr) {
        restoreHandledKeyRef.current = sessionKey;
        return;
      }
      onRestoreDraftCandidate?.(draft);
    });
    return () => cancelAnimationFrame(rafId);
  }, [
    isOpen,
    loading,
    tenantIdStr,
    draftScope,
    onRestoreDraftCandidate,
    formDataRef,
    memoDraftRef
  ]);

  useEffect(() => {
    if (!isOpen || loading || !tenantIdStr || !draftScope) return undefined;
    if (!contentDirtyRef.current) return undefined;
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      debounceTimerRef.current = null;
      if (contentDirtyRef.current) persistLocalDraftSnapshot();
    }, CONSULTATION_LOG_LOCAL_AUTOSAVE_DEBOUNCE_MS);
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
    };
  }, [
    formData,
    memoDraft,
    isOpen,
    loading,
    tenantIdStr,
    draftScope,
    persistLocalDraftSnapshot,
    contentDirtyRef
  ]);

  useEffect(() => {
    if (!isOpen || !tenantIdStr || !draftScope) return undefined;
    const flushOnHide = () => {
      if (document.visibilityState !== 'hidden') return;
      persistLocalDraftSnapshot();
    };
    document.addEventListener('visibilitychange', flushOnHide);
    return () => document.removeEventListener('visibilitychange', flushOnHide);
  }, [isOpen, tenantIdStr, draftScope, persistLocalDraftSnapshot]);

  useEffect(() => {
    if (!isOpen || loading || !tenantIdStr || !draftScope) return undefined;
    const id = setInterval(() => {
      if (contentDirtyRef.current) persistLocalDraftSnapshot();
    }, CONSULTATION_LOG_LOCAL_AUTOSAVE_MAX_INTERVAL_MS);
    return () => clearInterval(id);
  }, [isOpen, loading, tenantIdStr, draftScope, persistLocalDraftSnapshot, contentDirtyRef]);

  return {
    localAutosaveUi,
    localSavedAtLabel,
    serverDraftSyncFailed,
    resetLocalAutosaveState,
    markRestoreHandled
  };
}
