import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  CONSULTATION_LOG_AUTOSAVE_DEBOUNCE_MS,
  CONSULTATION_LOG_AUTOSAVE_MAX_INTERVAL_MS,
  CONSULTATION_LOG_AUTOSAVE_RETRY_BACKOFF_MS,
  CONSULTATION_LOG_DRAFT_BROADCAST_CHANNEL,
  CONSULTATION_LOG_DRAFT_TIME_LOCALE,
  CONSULTATION_LOG_DRAFT_TIME_ZONE
} from '../constants/consultationLogAutosaveConstants';
import { SessionContext } from '../contexts/SessionContext';
import {
  deleteConsultationLogDraftOnServer,
  fetchConsultationLogDraftFromServer,
  flushConsultationLogDraftWithKeepalive,
  pushConsultationLogDraftToServer
} from '../utils/consultationLogDraftServerAdapter';
import {
  purgeAllLegacyConsultationLogLocalDrafts,
  readLegacyConsultationLogLocalDraft,
  removeConsultationLogLocalDraft
} from '../utils/consultationLogLocalDraft';
import {
  readDraftBackup,
  removeDraftBackup,
  saveDraftBackup
} from '../utils/consultationLogDraftBackupStore';
import { redirectToLoginPageOnce } from '../utils/sessionRedirect';

/** 자동저장 상태 머신 값 */
export const DRAFT_AUTOSAVE_STATUS = {
  IDLE: 'idle',
  SAVING: 'saving',
  SAVED: 'saved',
  RETRYING: 'retrying',
  FAILED: 'failed'
};

/** 복구 후보 출처 */
export const DRAFT_RESTORE_SOURCE = {
  SERVER: 'server',
  BACKUP: 'backup',
  LEGACY_LOCAL: 'legacyLocal'
};

/** 레거시 평문 키 정리는 앱 수명 중 1회만 */
let legacyPurgeDone = false;

/**
 * KST 기준 "H:mm" 라벨.
 *
 * @param {number} epochMs
 * @returns {string}
 */
export function formatDraftSavedAtLabel(epochMs) {
  return new Date(epochMs).toLocaleTimeString(CONSULTATION_LOG_DRAFT_TIME_LOCALE, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: false,
    timeZone: CONSULTATION_LOG_DRAFT_TIME_ZONE
  });
}

function safeStringify(value) {
  try {
    return JSON.stringify(value);
  } catch {
    return null;
  }
}

function safeParse(json) {
  try {
    const parsed = JSON.parse(json);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * 상담일지 작성·수정 화면 공통 초안 자동저장 훅 (모달·전체화면 공용).
 *
 * <p>저장 우선순위는 <strong>서버 초안</strong>이다. 서버 저장이 실패하거나 오프라인일
 * 때만 세션 키로 암호화된 IndexedDB 백업에 쓴다. 본문을 localStorage 에 쓰지 않는다.</p>
 *
 * <ul>
 *   <li>입력 멈춤 {@code 3s} 디바운스 + 더티 상태면 최소 {@code 30s} 마다 저장</li>
 *   <li>{@code visibilitychange(hidden)} · {@code pagehide} 에서 keepalive flush</li>
 *   <li>실패 시 상수 백오프 재시도, 401 이면 입력을 보존한 뒤 returnUrl 로 로그인 이동</li>
 *   <li>다른 탭·기기 편집은 서버 {@code version}/{@code updatedAt} 과 BroadcastChannel 로 감지</li>
 * </ul>
 *
 * @param {object} params
 * @param {boolean} params.enabled 화면이 열려 있고 저장 가능한 상태인지
 * @param {string} params.tenantId
 * @param {number|string|null} params.userId 로그인 사용자 ID (백업 레코드 키용)
 * @param {string} params.consultationId 서버 초안 consultationId (숫자 또는 schedule- 접두)
 * @param {number|null} params.consultantId
 * @param {{ type: string, id: string }|null} params.legacyScope 레거시 localStorage 키 스코프
 * @param {import('react').MutableRefObject<object>} params.snapshotRef 저장할 스냅샷 ref
 * @param {import('react').MutableRefObject<boolean>} params.dirtyRef 미저장 변경 여부 ref
 * @param {(candidate: { snapshot: object, savedAt: number, source: string }) => void} [params.onRestoreCandidate]
 * @param {() => void} [params.onConflictDetected]
 * @returns {object} 상태·조작 API
 * @author CoreSolution
 * @since 2026-10-04
 */
export function useConsultationLogDraftAutosave({
  enabled,
  tenantId,
  userId,
  consultationId,
  consultantId,
  legacyScope,
  snapshotRef,
  dirtyRef,
  onRestoreCandidate,
  onConflictDetected
}) {
  const [status, setStatus] = useState(DRAFT_AUTOSAVE_STATUS.IDLE);
  const [savedAtLabel, setSavedAtLabel] = useState('');
  const [conflictDetected, setConflictDetected] = useState(false);

  const debounceTimerRef = useRef(null);
  const retryTimerRef = useRef(null);
  const retryAttemptRef = useRef(0);
  const serverVersionRef = useRef(null);
  const serverUpdatedAtRef = useRef(null);
  const restoreCheckedKeyRef = useRef('');
  const channelRef = useRef(null);
  const editorInstanceIdRef = useRef(`${Date.now()}-${Math.random().toString(36).slice(2)}`);

  const sessionCtx = useContext(SessionContext);
  const checkSessionRef = useRef(sessionCtx?.checkSession);
  useEffect(() => {
    checkSessionRef.current = sessionCtx?.checkSession;
  }, [sessionCtx?.checkSession]);

  const normalizedConsultationId = useMemo(
    () => (consultationId != null ? String(consultationId).trim() : ''),
    [consultationId]
  );
  const normalizedConsultantId = useMemo(() => {
    const n = consultantId != null ? Number(consultantId) : NaN;
    return Number.isFinite(n) ? n : null;
  }, [consultantId]);

  const backupScope = useMemo(
    () => ({ userId, tenantId, consultationId: normalizedConsultationId }),
    [userId, tenantId, normalizedConsultationId]
  );

  const canSave = Boolean(enabled && tenantId && normalizedConsultationId && normalizedConsultantId != null);

  /** 배포 후 첫 로드 — 평문 레거시 키 전량 삭제 (복구 제안에 쓴 값은 그 전에 읽는다) */
  const purgeLegacyOnce = useCallback(() => {
    if (legacyPurgeDone) return;
    legacyPurgeDone = true;
    purgeAllLegacyConsultationLogLocalDrafts();
  }, []);

  const clearTimers = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
  }, []);

  const markSaved = useCallback(() => {
    retryAttemptRef.current = 0;
    setSavedAtLabel(formatDraftSavedAtLabel(Date.now()));
    setStatus(DRAFT_AUTOSAVE_STATUS.SAVED);
  }, []);

  /**
   * 401 처리 — 입력을 절대 버리지 않는다.
   * 1) 세션 재확인(기존 메커니즘)을 한 번 시도하고, 2) 실패 시 백업에 즉시 쓰고,
   * 3) returnUrl 을 붙여 로그인으로 보낸다. 재로그인 후 서버 초안으로 복구된다.
   */
  const handleUnauthorized = useCallback(async(payloadJson) => {
    const checkSession = checkSessionRef.current;
    if (typeof checkSession === 'function') {
      try {
        const alive = await checkSession(true, { silent: true });
        if (alive) {
          return false;
        }
      } catch {
        // 아래 백업·리다이렉트로 진행
      }
    }
    await saveDraftBackup(backupScope, payloadJson);
    setStatus(DRAFT_AUTOSAVE_STATUS.FAILED);
    redirectToLoginPageOnce({ returnUrl: `${window.location.pathname}${window.location.search}` });
    return true;
  }, [backupScope]);

  const scheduleRetry = useCallback((runner) => {
    const attempt = retryAttemptRef.current;
    if (attempt >= CONSULTATION_LOG_AUTOSAVE_RETRY_BACKOFF_MS.length) {
      setStatus(DRAFT_AUTOSAVE_STATUS.FAILED);
      return;
    }
    const delay = CONSULTATION_LOG_AUTOSAVE_RETRY_BACKOFF_MS[attempt];
    retryAttemptRef.current = attempt + 1;
    setStatus(DRAFT_AUTOSAVE_STATUS.RETRYING);
    if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
    retryTimerRef.current = setTimeout(() => {
      retryTimerRef.current = null;
      void runner();
    }, delay);
  }, []);

  /**
   * 서버 초안 저장 1회. 실패하면 암호화 백업 후 백오프 재시도를 예약한다.
   *
   * @param {{ force?: boolean }} [options]
   * @returns {Promise<boolean>} 서버 저장 성공 여부
   */
  const saveNow = useCallback(async(options = {}) => {
    if (!canSave) return false;
    if (!options.force && !dirtyRef.current) return false;
    const payloadJson = safeStringify(snapshotRef.current);
    if (payloadJson == null) return false;

    setStatus(DRAFT_AUTOSAVE_STATUS.SAVING);
    dirtyRef.current = false;

    const result = await pushConsultationLogDraftToServer({
      consultationId: normalizedConsultationId,
      consultantId: normalizedConsultantId,
      payloadJson,
      expectedVersion: serverVersionRef.current
    });

    if (result.ok) {
      if (result.version != null) serverVersionRef.current = result.version;
      if (result.updatedAt != null) serverUpdatedAtRef.current = result.updatedAt;
      await removeDraftBackup(backupScope);
      markSaved();
      const channel = channelRef.current;
      if (channel) {
        try {
          channel.postMessage({
            consultationId: normalizedConsultationId,
            consultantId: normalizedConsultantId,
            editorInstanceId: editorInstanceIdRef.current,
            version: serverVersionRef.current
          });
        } catch {
          // 채널 전송 실패는 저장과 무관
        }
      }
      const checkSession = checkSessionRef.current;
      if (typeof checkSession === 'function') {
        void checkSession(true, { silent: true });
      }
      return true;
    }

    if (result.skipped) {
      setStatus(DRAFT_AUTOSAVE_STATUS.IDLE);
      return false;
    }

    // 실패 — 입력 보존이 최우선
    await saveDraftBackup(backupScope, payloadJson);
    if (result.notAuthenticated) {
      const redirected = await handleUnauthorized(payloadJson);
      if (redirected) return false;
    }
    if (result.versionConflict) {
      setConflictDetected(true);
      onConflictDetected?.();
      setStatus(DRAFT_AUTOSAVE_STATUS.FAILED);
      return false;
    }
    scheduleRetry(() => saveNow({ force: true }));
    return false;
  }, [
    canSave,
    dirtyRef,
    snapshotRef,
    normalizedConsultationId,
    normalizedConsultantId,
    backupScope,
    markSaved,
    handleUnauthorized,
    scheduleRetry,
    onConflictDetected
  ]);

  /** 확정 저장·버리기 — 서버 초안과 브라우저 백업·레거시 키를 모두 지운다. */
  const discardDraft = useCallback(async() => {
    clearTimers();
    retryAttemptRef.current = 0;
    dirtyRef.current = false;
    setStatus(DRAFT_AUTOSAVE_STATUS.IDLE);
    setSavedAtLabel('');
    setConflictDetected(false);
    if (legacyScope && tenantId) {
      removeConsultationLogLocalDraft(tenantId, legacyScope);
    }
    await removeDraftBackup(backupScope);
    if (canSave) {
      await deleteConsultationLogDraftOnServer({
        consultationId: normalizedConsultationId,
        consultantId: normalizedConsultantId
      });
      serverVersionRef.current = null;
      serverUpdatedAtRef.current = null;
    }
  }, [
    clearTimers,
    dirtyRef,
    legacyScope,
    tenantId,
    backupScope,
    canSave,
    normalizedConsultationId,
    normalizedConsultantId
  ]);

  /** 진입 시 복구 후보 탐색: 서버 초안 → 같은 세션 백업 → 레거시 평문 1회 */
  useEffect(() => {
    if (!canSave) return undefined;
    const key = `${tenantId}:${normalizedConsultationId}:${normalizedConsultantId}`;
    if (restoreCheckedKeyRef.current === key) return undefined;
    restoreCheckedKeyRef.current = key;
    let cancelled = false;

    void (async() => {
      const server = await fetchConsultationLogDraftFromServer({
        consultationId: normalizedConsultationId,
        consultantId: normalizedConsultantId
      });
      if (cancelled) return;

      if (server.ok && server.hasDraft && server.payloadJson) {
        serverVersionRef.current = server.version ?? null;
        serverUpdatedAtRef.current = server.updatedAt ?? null;
        const snapshot = safeParse(server.payloadJson);
        purgeLegacyOnce();
        if (snapshot) {
          onRestoreCandidate?.({
            snapshot,
            savedAt: server.updatedAt ? Date.parse(server.updatedAt) : Date.now(),
            source: DRAFT_RESTORE_SOURCE.SERVER
          });
        }
        return;
      }
      if (server.ok) {
        serverVersionRef.current = server.version ?? null;
      }

      const backup = await readDraftBackup(backupScope);
      if (cancelled) return;
      if (backup) {
        const snapshot = safeParse(backup.payloadJson);
        purgeLegacyOnce();
        if (snapshot) {
          onRestoreCandidate?.({
            snapshot,
            savedAt: backup.savedAt,
            source: DRAFT_RESTORE_SOURCE.BACKUP
          });
        }
        return;
      }

      // 서버·백업 모두 없을 때만 레거시 평문 초안을 1회 제안하고 즉시 정리한다.
      const legacy = legacyScope ? readLegacyConsultationLogLocalDraft(tenantId, legacyScope) : null;
      if (legacy) {
        onRestoreCandidate?.({
          snapshot: { formData: legacy.formData, memoDraft: legacy.memoDraft },
          savedAt: legacy.savedAt,
          source: DRAFT_RESTORE_SOURCE.LEGACY_LOCAL
        });
      }
      purgeLegacyOnce();
    })();

    return () => { cancelled = true; };
  }, [
    canSave,
    tenantId,
    normalizedConsultationId,
    normalizedConsultantId,
    backupScope,
    legacyScope,
    onRestoreCandidate,
    purgeLegacyOnce
  ]);

  /** 디바운스 저장 — snapshotRef 는 ref 라 의존성에 넣을 수 없어 dirtySignal 로 트리거한다. */
  const [dirtySignal, setDirtySignal] = useState(0);
  const notifyDirty = useCallback(() => {
    dirtyRef.current = true;
    setDirtySignal((n) => n + 1);
  }, [dirtyRef]);

  useEffect(() => {
    if (!canSave || !dirtyRef.current) return undefined;
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      debounceTimerRef.current = null;
      void saveNow();
    }, CONSULTATION_LOG_AUTOSAVE_DEBOUNCE_MS);
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
    };
  }, [dirtySignal, canSave, dirtyRef, saveNow]);

  /** 더티 상태면 최대 간격마다 1회 저장 */
  useEffect(() => {
    if (!canSave) return undefined;
    const id = setInterval(() => {
      if (dirtyRef.current) void saveNow();
    }, CONSULTATION_LOG_AUTOSAVE_MAX_INTERVAL_MS);
    return () => clearInterval(id);
  }, [canSave, dirtyRef, saveNow]);

  /** 화면 이탈 flush — visibilitychange(hidden) · pagehide */
  useEffect(() => {
    if (!canSave) return undefined;
    const flush = () => {
      if (!dirtyRef.current) return;
      const payloadJson = safeStringify(snapshotRef.current);
      if (payloadJson == null) return;
      dirtyRef.current = false;
      void flushConsultationLogDraftWithKeepalive({
        consultationId: normalizedConsultationId,
        consultantId: normalizedConsultantId,
        payloadJson,
        expectedVersion: serverVersionRef.current
      });
    };
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') flush();
    };
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', flush);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', flush);
    };
  }, [canSave, dirtyRef, snapshotRef, normalizedConsultationId, normalizedConsultantId]);

  /** 같은 브라우저의 다른 탭이 같은 일지를 저장하면 충돌 경고 */
  useEffect(() => {
    if (!canSave || typeof BroadcastChannel === 'undefined') return undefined;
    let channel;
    try {
      channel = new BroadcastChannel(CONSULTATION_LOG_DRAFT_BROADCAST_CHANNEL);
    } catch {
      return undefined;
    }
    channelRef.current = channel;
    channel.onmessage = (event) => {
      const data = event?.data;
      if (!data || data.editorInstanceId === editorInstanceIdRef.current) return;
      if (String(data.consultationId) !== normalizedConsultationId) return;
      setConflictDetected(true);
      onConflictDetected?.();
    };
    return () => {
      channelRef.current = null;
      channel.close();
    };
  }, [canSave, normalizedConsultationId, onConflictDetected]);

  useEffect(() => () => clearTimers(), [clearTimers]);

  /** 충돌 해소 — 서버 최신본을 읽어 돌려준다(내 것 유지/최신 불러오기 선택용) */
  const loadLatestFromServer = useCallback(async() => {
    if (!canSave) return null;
    const server = await fetchConsultationLogDraftFromServer({
      consultationId: normalizedConsultationId,
      consultantId: normalizedConsultantId
    });
    if (!server.ok || !server.hasDraft || !server.payloadJson) return null;
    serverVersionRef.current = server.version ?? null;
    serverUpdatedAtRef.current = server.updatedAt ?? null;
    setConflictDetected(false);
    return safeParse(server.payloadJson);
  }, [canSave, normalizedConsultationId, normalizedConsultantId]);

  /** 충돌 경고에서 "내 것 유지"를 고른 경우 — 서버 버전을 다시 맞추고 즉시 덮어쓴다 */
  const keepMineOnConflict = useCallback(async() => {
    if (!canSave) return false;
    const server = await fetchConsultationLogDraftFromServer({
      consultationId: normalizedConsultationId,
      consultantId: normalizedConsultantId
    });
    serverVersionRef.current = server.ok ? (server.version ?? null) : null;
    setConflictDetected(false);
    dirtyRef.current = true;
    return saveNow({ force: true });
  }, [canSave, normalizedConsultationId, normalizedConsultantId, dirtyRef, saveNow]);

  return {
    status,
    savedAtLabel,
    conflictDetected,
    notifyDirty,
    saveNow,
    discardDraft,
    loadLatestFromServer,
    keepMineOnConflict
  };
}
