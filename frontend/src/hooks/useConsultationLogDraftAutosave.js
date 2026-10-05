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
  readLegacyConsultationLogLocalDraft,
  removeConsultationLogLocalDraft
} from '../utils/consultationLogLocalDraft';
import {
  readDraftBackup,
  removeDraftBackup,
  saveDraftBackup
} from '../utils/consultationLogDraftBackupStore';
import {
  clearPendingLoginReturnUrl,
  redirectToLoginPageOnce,
  registerLoginRedirectRescue,
  setPendingLoginReturnUrl
} from '../utils/sessionRedirect';

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
 * 초안이 확정 저장본보다 과거인지 판단한다.
 *
 * <p>둘 중 하나라도 파싱할 수 없으면 "오래되지 않음"으로 본다 — 복구 기회를 없애는 쪽보다
 * 사용자에게 물어보는 쪽이 안전하다.</p>
 *
 * @param {string|number|null|undefined} draftUpdatedAt 초안 갱신 시각
 * @param {string|number|null|undefined} recordUpdatedAt 확정 저장본 갱신 시각
 * @returns {boolean} 초안이 확정본보다 오래되었으면 true
 */
export function isDraftStale(draftUpdatedAt, recordUpdatedAt) {
  const draftMs = draftUpdatedAt == null ? NaN : Date.parse(String(draftUpdatedAt));
  const recordMs = recordUpdatedAt == null ? NaN : Date.parse(String(recordUpdatedAt));
  if (!Number.isFinite(draftMs) || !Number.isFinite(recordMs)) return false;
  return draftMs < recordMs;
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
 * @param {string|number|null} [params.recordUpdatedAt] 확정 저장본 갱신 시각.
 *        서버 초안이 이 시각보다 과거면 복구 프롬프트를 띄우지 않는다(삭제하지 않음).
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
  recordUpdatedAt,
  onRestoreCandidate,
  onConflictDetected
}) {
  const [status, setStatus] = useState(DRAFT_AUTOSAVE_STATUS.IDLE);
  const [savedAtLabel, setSavedAtLabel] = useState('');
  const [conflictDetected, setConflictDetected] = useState(false);
  /** 확정본보다 오래되어 프롬프트를 띄우지 않은 초안의 저장 시각 (표시 전용) */
  const [staleDraftSavedAt, setStaleDraftSavedAt] = useState(null);
  /** 마지막 실패 때 브라우저 백업이 실제로 IndexedDB 에 남았는지 ('보관' 문구는 true 일 때만) */
  const [backupKept, setBackupKept] = useState(false);

  const debounceTimerRef = useRef(null);
  const retryTimerRef = useRef(null);
  const retryAttemptRef = useRef(0);
  const serverVersionRef = useRef(null);
  const serverUpdatedAtRef = useRef(null);
  const restoreCheckedKeyRef = useRef('');
  const channelRef = useRef(null);
  const editorInstanceIdRef = useRef(`${Date.now()}-${Math.random().toString(36).slice(2)}`);
  /** 레거시 평문 초안 정리 보류 — 사용자가 불러오기/버리기를 고른 뒤에 지운다 */
  const legacyPurgePendingRef = useRef(false);
  const recordUpdatedAtRef = useRef(recordUpdatedAt);
  recordUpdatedAtRef.current = recordUpdatedAt;
  /** 서버 초안에 아직 반영되지 않은 입력이 있는지 (저장 중·실패 포함) — 로그인 이동 직전 보관 여부 판단 */
  const unsavedRef = useRef(false);

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

  /**
   * 이 화면의 레거시 평문 키 정리. 복구 프롬프트에서 사용자가 선택(불러오기·버리기)을 끝낸 뒤에만 부른다.
   * 다른 화면의 레거시 키는 묻지 않고 지우지 않는다 — 전체 정리는 로그아웃·계정 전환({@code sessionManager})이 맡는다.
   */
  const purgeLegacyDrafts = useCallback(() => {
    if (tenantId && legacyScope) {
      removeConsultationLogLocalDraft(tenantId, legacyScope);
    }
  }, [tenantId, legacyScope]);

  /** 이 화면에 레거시 평문 초안이 남아 있으면, 지금 띄우는 프롬프트의 선택이 끝난 뒤 정리하도록 표시한다. */
  const markLegacyPurgeAfterChoice = useCallback(() => {
    if (legacyScope && tenantId && readLegacyConsultationLogLocalDraft(tenantId, legacyScope)) {
      legacyPurgePendingRef.current = true;
    }
  }, [tenantId, legacyScope]);

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
   * 1) 세션 재확인보다 <strong>먼저</strong> 401 보관 백업을 쓴다(재확인이 세션 정리·이동을 일으켜도 남도록).
   * 2) 세션 재확인(기존 메커니즘)이 살아 있으면 그대로 계속한다(백업은 다음 저장 성공 때 지워진다).
   * 3) 백업이 실제로 남았을 때만 returnUrl 을 붙여 로그인으로 보낸다. 재로그인 후 같은 일정을 열면
   *    복원을 제안한다. 백업이 남지 않았으면 이동하지 않는다(화면의 입력이 유일한 사본).
   */
  const handleUnauthorized = useCallback(async(payloadJson) => {
    const backup = await saveDraftBackup(backupScope, payloadJson, { rescue: true });
    const returnUrl = `${window.location.pathname}${window.location.search}`;
    // 세션 재확인이 먼저 /login 으로 보내도 같은 일정으로 돌아오게 복귀 경로를 예약한다(백업이 남았을 때만).
    if (backup.persisted) {
      setPendingLoginReturnUrl(returnUrl);
    }
    const checkSession = checkSessionRef.current;
    if (typeof checkSession === 'function') {
      try {
        const alive = await checkSession(true, { silent: true });
        if (alive) {
          clearPendingLoginReturnUrl();
          return false;
        }
      } catch {
        // 아래 이동 판단으로 진행
      }
    }
    setBackupKept(backup.persisted);
    setStatus(DRAFT_AUTOSAVE_STATUS.FAILED);
    if (!backup.persisted) {
      return true;
    }
    redirectToLoginPageOnce({ returnUrl });
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
      if (!dirtyRef.current) unsavedRef.current = false;
      await removeDraftBackup(backupScope);
      setBackupKept(false);
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
    if (result.notAuthenticated) {
      const redirected = await handleUnauthorized(payloadJson);
      if (redirected) return false;
    } else {
      const backup = await saveDraftBackup(backupScope, payloadJson);
      setBackupKept(backup.persisted);
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

  /**
   * 복구 프롬프트에서 사용자가 선택을 끝냈을 때 호출한다.
   *
   * <p>레거시 평문 초안은 프롬프트가 보이는 동안 남겨 두므로(중간 이탈 시 입력 보존),
   * 선택이 끝난 이 시점에 정리한다. "버리기"는 {@link discardDraft} 가 별도로 처리한다.</p>
   */
  const resolveRestoreCandidate = useCallback(() => {
    if (!legacyPurgePendingRef.current) return;
    legacyPurgePendingRef.current = false;
    purgeLegacyDrafts();
  }, [purgeLegacyDrafts]);

  /** 확정 저장·버리기 — 서버 초안과 브라우저 백업·레거시 키를 모두 지운다. */
  const discardDraft = useCallback(async() => {
    legacyPurgePendingRef.current = false;
    clearTimers();
    retryAttemptRef.current = 0;
    dirtyRef.current = false;
    unsavedRef.current = false;
    setStatus(DRAFT_AUTOSAVE_STATUS.IDLE);
    setSavedAtLabel('');
    setConflictDetected(false);
    setBackupKept(false);
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

  /** 진입 시 복구 후보 탐색: 서버 초안·브라우저 백업(같은 세션 또는 401 보관) 중 새것 → 레거시 평문 1회 */
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

      // 401 보관 백업은 서버 저장이 실패한 뒤에 쓰이므로 서버 초안보다 새로울 수 있다 — 더 새로운 쪽을 제안한다.
      const backup = await readDraftBackup(backupScope);
      if (cancelled) return;
      const serverUpdatedMs = server.ok && server.hasDraft && server.updatedAt ? Date.parse(server.updatedAt) : NaN;
      const backupIsNewer = Boolean(backup)
        && (!(server.ok && server.hasDraft && server.payloadJson)
          || !Number.isFinite(serverUpdatedMs)
          || backup.savedAt > serverUpdatedMs);

      if (!backupIsNewer && server.ok && server.hasDraft && server.payloadJson) {
        serverVersionRef.current = server.version ?? null;
        serverUpdatedAtRef.current = server.updatedAt ?? null;
        const snapshot = safeParse(server.payloadJson);
        // 확정 저장이 초안보다 나중이면 그 초안은 이미 반영된 과거 내용이다.
        // 복구 프롬프트를 띄우면 확정본을 옛 초안으로 되돌릴 위험이 있어 표시만 하고 묻지 않는다.
        // (#1409 후속: 삭제는 하지 않는다 — 데이터 보존)
        if (isDraftStale(server.updatedAt, recordUpdatedAtRef.current)) {
          setStaleDraftSavedAt(server.updatedAt ? Date.parse(server.updatedAt) : null);
          return;
        }
        if (snapshot) {
          // 레거시 키는 프롬프트 선택이 끝난 뒤에 정리한다 (묻지 않고 지우지 않음).
          markLegacyPurgeAfterChoice();
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
        serverUpdatedAtRef.current = server.updatedAt ?? null;
      }

      if (backup) {
        const snapshot = safeParse(backup.payloadJson);
        if (snapshot) {
          markLegacyPurgeAfterChoice();
          onRestoreCandidate?.({
            snapshot,
            savedAt: backup.savedAt,
            source: DRAFT_RESTORE_SOURCE.BACKUP
          });
        }
        return;
      }

      // 서버·백업 모두 없을 때만 레거시 평문 초안을 1회 제안한다.
      const legacy = legacyScope ? readLegacyConsultationLogLocalDraft(tenantId, legacyScope) : null;
      if (legacy) {
        // 프롬프트를 띄우는 순간 지우면, 사용자가 선택하기 전에 새로고침·탭 닫기가 일어나면
        // 입력이 영구히 사라진다. 불러오기·버리기 중 하나를 고른 뒤에 정리한다.
        legacyPurgePendingRef.current = true;
        onRestoreCandidate?.({
          snapshot: { formData: legacy.formData, memoDraft: legacy.memoDraft },
          savedAt: legacy.savedAt,
          source: DRAFT_RESTORE_SOURCE.LEGACY_LOCAL
        });
        return;
      }
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
    markLegacyPurgeAfterChoice
  ]);

  /** 디바운스 저장 — snapshotRef 는 ref 라 의존성에 넣을 수 없어 dirtySignal 로 트리거한다. */
  const [dirtySignal, setDirtySignal] = useState(0);
  const notifyDirty = useCallback(() => {
    dirtyRef.current = true;
    unsavedRef.current = true;
    setDirtySignal((n) => n + 1);
  }, [dirtyRef]);

  /**
   * 공용 로그인 이동(활동 ping·세션 확인·요청 401 등 모든 경로) 직전 보관 백업.
   * 이동이 확정되는 순간의 입력을 동기로 캡처해 디바운스 저장 전 마지막 입력까지 남기고,
   * 백업이 실제로 남았을 때만 같은 화면을 returnUrl 로 돌려준다.
   */
  useEffect(() => {
    if (!canSave) return undefined;
    return registerLoginRedirectRescue(() => {
      if (!unsavedRef.current && !dirtyRef.current) return { persisted: false };
      const payloadJson = safeStringify(snapshotRef.current);
      if (payloadJson == null) return { persisted: false };
      const returnUrl = `${window.location.pathname}${window.location.search}`;
      return saveDraftBackup(backupScope, payloadJson, { rescue: true })
        .then((backup) => ({ persisted: backup.persisted, returnUrl }));
    });
  }, [canSave, dirtyRef, snapshotRef, backupScope]);

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
    staleDraftSavedAt,
    backupKept,
    notifyDirty,
    saveNow,
    discardDraft,
    resolveRestoreCandidate,
    loadLatestFromServer,
    keepMineOnConflict
  };
}
