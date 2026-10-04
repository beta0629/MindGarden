import React, { useRef } from 'react';
import { act, render } from '@testing-library/react';
import {
  CONSULTATION_LOG_AUTOSAVE_DEBOUNCE_MS,
  CONSULTATION_LOG_AUTOSAVE_MAX_INTERVAL_MS,
  CONSULTATION_LOG_AUTOSAVE_RETRY_BACKOFF_MS,
  CONSULTATION_LOG_LEGACY_LOCAL_DRAFT_KEY_PREFIX,
  CONSULTATION_LOG_LOCAL_DRAFT_STORAGE_VERSION
} from '../../constants/consultationLogAutosaveConstants';
import {
  DRAFT_AUTOSAVE_STATUS,
  DRAFT_RESTORE_SOURCE,
  useConsultationLogDraftAutosave
} from '../useConsultationLogDraftAutosave';
import * as adapter from '../../utils/consultationLogDraftServerAdapter';
import * as backupStore from '../../utils/consultationLogDraftBackupStore';
import * as sessionRedirect from '../../utils/sessionRedirect';

jest.mock('../../utils/consultationLogDraftServerAdapter', () => ({
  fetchConsultationLogDraftFromServer: jest.fn(),
  pushConsultationLogDraftToServer: jest.fn(),
  deleteConsultationLogDraftOnServer: jest.fn(),
  flushConsultationLogDraftWithKeepalive: jest.fn()
}));
jest.mock('../../utils/consultationLogDraftBackupStore', () => ({
  readDraftBackup: jest.fn(),
  removeDraftBackup: jest.fn(),
  saveDraftBackup: jest.fn()
}));
jest.mock('../../utils/sessionRedirect', () => ({
  redirectToLoginPageOnce: jest.fn()
}));

const BASE_PARAMS = {
  enabled: true,
  tenantId: 'tenant-a',
  userId: 41,
  consultationId: 'schedule-30',
  consultantId: 41,
  legacyScope: { type: 'schedule', id: '30' }
};

let latest = null;

/** 훅 노출 API 를 캡처하는 테스트 하네스 */
const Harness = ({ snapshot, ...params }) => {
  const snapshotRef = useRef(snapshot);
  const dirtyRef = useRef(false);
  snapshotRef.current = snapshot;
  latest = { api: useConsultationLogDraftAutosave({ ...params, snapshotRef, dirtyRef }), dirtyRef };
  return null;
};

const renderHook = (overrides = {}) => render(
  <Harness
    {...BASE_PARAMS}
    snapshot={{ formData: { mainIssues: '초안' }, memoDraft: '' }}
    {...overrides}
  />
);

const flushMicrotasks = async() => {
  await act(async() => {
    await Promise.resolve();
    await Promise.resolve();
  });
};

describe('useConsultationLogDraftAutosave', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    localStorage.clear();
    latest = null;
    adapter.fetchConsultationLogDraftFromServer.mockResolvedValue({ ok: true, hasDraft: false });
    adapter.pushConsultationLogDraftToServer.mockResolvedValue({ ok: true, version: 1 });
    adapter.deleteConsultationLogDraftOnServer.mockResolvedValue({ ok: true });
    adapter.flushConsultationLogDraftWithKeepalive.mockResolvedValue({ ok: true });
    backupStore.readDraftBackup.mockResolvedValue(null);
    backupStore.removeDraftBackup.mockResolvedValue(undefined);
    backupStore.saveDraftBackup.mockResolvedValue({ memory: true, persisted: true });
  });

  afterEach(() => {
    jest.useRealTimers();
    localStorage.clear();
  });

  test('입력 멈춤 3초 뒤에 서버 초안으로 1회 저장한다', async() => {
    renderHook();
    await flushMicrotasks();

    act(() => { latest.api.notifyDirty(); });
    act(() => { jest.advanceTimersByTime(CONSULTATION_LOG_AUTOSAVE_DEBOUNCE_MS - 1); });
    expect(adapter.pushConsultationLogDraftToServer).not.toHaveBeenCalled();

    act(() => { jest.advanceTimersByTime(1); });
    await flushMicrotasks();

    expect(adapter.pushConsultationLogDraftToServer).toHaveBeenCalledTimes(1);
    const call = adapter.pushConsultationLogDraftToServer.mock.calls[0][0];
    expect(call.consultationId).toBe('schedule-30');
    expect(call.consultantId).toBe(41);
    expect(JSON.parse(call.payloadJson)).toEqual({ formData: { mainIssues: '초안' }, memoDraft: '' });
    expect(latest.api.status).toBe(DRAFT_AUTOSAVE_STATUS.SAVED);
    expect(latest.api.savedAtLabel).toMatch(/\d{1,2}:\d{2}/);
  });

  test('더티 상태가 유지되면 최대 간격(30초)마다 저장한다', async() => {
    renderHook();
    await flushMicrotasks();

    // 디바운스가 끝나기 전에 계속 더티인 상태를 유지하기 위해 push 는 성공하지만 다시 더티로 만든다
    act(() => { latest.dirtyRef.current = true; });
    act(() => { jest.advanceTimersByTime(CONSULTATION_LOG_AUTOSAVE_MAX_INTERVAL_MS); });
    await flushMicrotasks();

    expect(adapter.pushConsultationLogDraftToServer).toHaveBeenCalledTimes(1);
  });

  test('visibilitychange(hidden) 과 pagehide 에서 keepalive flush 한다', async() => {
    renderHook();
    await flushMicrotasks();

    act(() => { latest.dirtyRef.current = true; });
    Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });
    act(() => { document.dispatchEvent(new Event('visibilitychange')); });
    await flushMicrotasks();
    expect(adapter.flushConsultationLogDraftWithKeepalive).toHaveBeenCalledTimes(1);

    act(() => { latest.dirtyRef.current = true; });
    act(() => { window.dispatchEvent(new Event('pagehide')); });
    await flushMicrotasks();
    expect(adapter.flushConsultationLogDraftWithKeepalive).toHaveBeenCalledTimes(2);
  });

  test('저장 실패 시 암호화 백업에 보관하고 백오프로 재시도한다', async() => {
    adapter.pushConsultationLogDraftToServer
      .mockResolvedValueOnce({ ok: false, skipped: false })
      .mockResolvedValueOnce({ ok: true, version: 2 });
    renderHook();
    await flushMicrotasks();

    act(() => { latest.api.notifyDirty(); });
    act(() => { jest.advanceTimersByTime(CONSULTATION_LOG_AUTOSAVE_DEBOUNCE_MS); });
    await flushMicrotasks();

    expect(backupStore.saveDraftBackup).toHaveBeenCalledTimes(1);
    expect(latest.api.status).toBe(DRAFT_AUTOSAVE_STATUS.RETRYING);

    act(() => { jest.advanceTimersByTime(CONSULTATION_LOG_AUTOSAVE_RETRY_BACKOFF_MS[0]); });
    await flushMicrotasks();

    expect(adapter.pushConsultationLogDraftToServer).toHaveBeenCalledTimes(2);
    expect(latest.api.status).toBe(DRAFT_AUTOSAVE_STATUS.SAVED);
  });

  test('401 이면 입력을 버리지 않고 백업 후 returnUrl 로 로그인 이동한다', async() => {
    adapter.pushConsultationLogDraftToServer.mockResolvedValue({ ok: false, notAuthenticated: true });
    renderHook();
    await flushMicrotasks();

    act(() => { latest.api.notifyDirty(); });
    act(() => { jest.advanceTimersByTime(CONSULTATION_LOG_AUTOSAVE_DEBOUNCE_MS); });
    await flushMicrotasks();

    expect(backupStore.saveDraftBackup).toHaveBeenCalled();
    const [, payloadJson] = backupStore.saveDraftBackup.mock.calls[0];
    expect(JSON.parse(payloadJson).formData.mainIssues).toBe('초안');
    expect(sessionRedirect.redirectToLoginPageOnce).toHaveBeenCalledWith(
      expect.objectContaining({ returnUrl: expect.any(String) })
    );
  });

  test('401 이면 세션 정리 전에 401 보관 백업(rescue)으로 쓰고, 실제로 남았을 때만 "보관" 상태다', async() => {
    adapter.pushConsultationLogDraftToServer.mockResolvedValue({ ok: false, notAuthenticated: true });
    renderHook();
    await flushMicrotasks();

    act(() => { latest.api.notifyDirty(); });
    act(() => { jest.advanceTimersByTime(CONSULTATION_LOG_AUTOSAVE_DEBOUNCE_MS); });
    await flushMicrotasks();

    expect(backupStore.saveDraftBackup).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 41, tenantId: 'tenant-a', consultationId: 'schedule-30' }),
      expect.any(String),
      { rescue: true }
    );
    expect(latest.api.backupKept).toBe(true);
    expect(latest.api.status).toBe(DRAFT_AUTOSAVE_STATUS.FAILED);
  });

  test('401 인데 백업이 남지 않으면(persisted=false) 로그인으로 이동하지 않고 "보관" 이라고 하지 않는다', async() => {
    adapter.pushConsultationLogDraftToServer.mockResolvedValue({ ok: false, notAuthenticated: true });
    backupStore.saveDraftBackup.mockResolvedValue({ memory: true, persisted: false });
    renderHook();
    await flushMicrotasks();

    act(() => { latest.api.notifyDirty(); });
    act(() => { jest.advanceTimersByTime(CONSULTATION_LOG_AUTOSAVE_DEBOUNCE_MS); });
    await flushMicrotasks();

    expect(sessionRedirect.redirectToLoginPageOnce).not.toHaveBeenCalled();
    expect(latest.api.backupKept).toBe(false);
    expect(latest.api.status).toBe(DRAFT_AUTOSAVE_STATUS.FAILED);
  });

  test('재로그인 후 401 보관 백업이 서버 초안보다 새로우면 백업 복원을 제안한다', async() => {
    adapter.fetchConsultationLogDraftFromServer.mockResolvedValue({
      ok: true,
      hasDraft: true,
      version: 3,
      payloadJson: JSON.stringify({ formData: { mainIssues: '오래된 서버 초안' }, memoDraft: '' }),
      updatedAt: '2026-10-04T01:00:00Z'
    });
    backupStore.readDraftBackup.mockResolvedValue({
      payloadJson: JSON.stringify({ formData: { mainIssues: '401 직전 입력' }, memoDraft: '' }),
      savedAt: Date.parse('2026-10-04T01:05:00Z')
    });
    const onRestoreCandidate = jest.fn();
    renderHook({ onRestoreCandidate });
    await flushMicrotasks();
    await flushMicrotasks();

    expect(onRestoreCandidate).toHaveBeenCalledTimes(1);
    const candidate = onRestoreCandidate.mock.calls[0][0];
    expect(candidate.source).toBe(DRAFT_RESTORE_SOURCE.BACKUP);
    expect(candidate.snapshot.formData.mainIssues).toBe('401 직전 입력');
  });

  test('백업이 서버 초안보다 오래되면 서버 초안을 제안한다', async() => {
    adapter.fetchConsultationLogDraftFromServer.mockResolvedValue({
      ok: true,
      hasDraft: true,
      version: 3,
      payloadJson: JSON.stringify({ formData: { mainIssues: '최신 서버 초안' }, memoDraft: '' }),
      updatedAt: '2026-10-04T01:10:00Z'
    });
    backupStore.readDraftBackup.mockResolvedValue({
      payloadJson: JSON.stringify({ formData: { mainIssues: '예전 백업' }, memoDraft: '' }),
      savedAt: Date.parse('2026-10-04T01:05:00Z')
    });
    const onRestoreCandidate = jest.fn();
    renderHook({ onRestoreCandidate });
    await flushMicrotasks();
    await flushMicrotasks();

    expect(onRestoreCandidate).toHaveBeenCalledTimes(1);
    expect(onRestoreCandidate.mock.calls[0][0].source).toBe(DRAFT_RESTORE_SOURCE.SERVER);
  });

  test('본문을 localStorage 에 쓰지 않는다', async() => {
    const setItem = jest.spyOn(Storage.prototype, 'setItem');
    renderHook();
    await flushMicrotasks();

    act(() => { latest.api.notifyDirty(); });
    act(() => { jest.advanceTimersByTime(CONSULTATION_LOG_AUTOSAVE_DEBOUNCE_MS); });
    await flushMicrotasks();

    expect(setItem).not.toHaveBeenCalled();
    setItem.mockRestore();
  });

  test('서버 초안이 있으면 복구 후보로 제안한다', async() => {
    adapter.fetchConsultationLogDraftFromServer.mockResolvedValue({
      ok: true,
      hasDraft: true,
      version: 7,
      payloadJson: JSON.stringify({ formData: { mainIssues: '서버 초안' }, memoDraft: 'm' }),
      updatedAt: '2026-10-04T01:03:00'
    });
    const onRestoreCandidate = jest.fn();
    renderHook({ onRestoreCandidate });
    await flushMicrotasks();

    expect(onRestoreCandidate).toHaveBeenCalledTimes(1);
    const candidate = onRestoreCandidate.mock.calls[0][0];
    expect(candidate.source).toBe(DRAFT_RESTORE_SOURCE.SERVER);
    expect(candidate.snapshot.formData.mainIssues).toBe('서버 초안');
  });

  test('레거시 평문 키는 제안 시점에 지우지 않고, 선택을 끝낸 뒤에 정리한다', async() => {
    const legacyKey = `${CONSULTATION_LOG_LEGACY_LOCAL_DRAFT_KEY_PREFIX}`
      + `.v${CONSULTATION_LOG_LOCAL_DRAFT_STORAGE_VERSION}:tenant-a:schedule:30`;
    localStorage.setItem(legacyKey, JSON.stringify({
      v: CONSULTATION_LOG_LOCAL_DRAFT_STORAGE_VERSION,
      savedAt: Date.now(),
      formData: { mainIssues: '레거시 평문' },
      memoDraft: ''
    }));
    const onRestoreCandidate = jest.fn();
    renderHook({ onRestoreCandidate });
    await flushMicrotasks();

    expect(onRestoreCandidate).toHaveBeenCalledTimes(1);
    expect(onRestoreCandidate.mock.calls[0][0].source).toBe(DRAFT_RESTORE_SOURCE.LEGACY_LOCAL);
    // 프롬프트가 떠 있는 동안은 보존 — 선택 전 이탈·새로고침에도 입력이 남아야 한다.
    expect(localStorage.getItem(legacyKey)).not.toBeNull();

    // 사용자가 불러오기/덮어쓰기 취소 중 하나를 고른 뒤에 정리한다.
    act(() => { latest.api.resolveRestoreCandidate(); });
    expect(localStorage.getItem(legacyKey)).toBeNull();
  });

  describe('레거시 평문 키 — 사용자가 고른 뒤에만 삭제 (K 후속)', () => {
    const legacyKeyFor = (scopeId) => `${CONSULTATION_LOG_LEGACY_LOCAL_DRAFT_KEY_PREFIX}`
      + `.v${CONSULTATION_LOG_LOCAL_DRAFT_STORAGE_VERSION}:tenant-a:schedule:${scopeId}`;
    const seedLegacy = (scopeId) => {
      localStorage.setItem(legacyKeyFor(scopeId), JSON.stringify({
        v: CONSULTATION_LOG_LOCAL_DRAFT_STORAGE_VERSION,
        savedAt: Date.now(),
        formData: { mainIssues: `레거시 ${scopeId}` },
        memoDraft: ''
      }));
    };

    test('서버 초안이 있어도 레거시 키는 제안 시점에 남고, 선택 뒤에 지운다', async() => {
      seedLegacy('30');
      adapter.fetchConsultationLogDraftFromServer.mockResolvedValue({
        ok: true,
        hasDraft: true,
        payloadJson: JSON.stringify({ formData: { mainIssues: '서버 초안' }, memoDraft: '' }),
        version: 2,
        updatedAt: '2026-10-03T00:00:00Z'
      });
      const onRestoreCandidate = jest.fn();
      renderHook({ onRestoreCandidate });
      await flushMicrotasks();

      expect(onRestoreCandidate.mock.calls[0][0].source).toBe(DRAFT_RESTORE_SOURCE.SERVER);
      expect(localStorage.getItem(legacyKeyFor('30'))).not.toBeNull();
      act(() => { latest.api.resolveRestoreCandidate(); });
      expect(localStorage.getItem(legacyKeyFor('30'))).toBeNull();
    });

    test('브라우저 백업이 있어도 레거시 키는 선택 전까지 남는다', async() => {
      seedLegacy('30');
      backupStore.readDraftBackup.mockResolvedValue({
        payloadJson: JSON.stringify({ formData: { mainIssues: '백업' }, memoDraft: '' }),
        savedAt: Date.now()
      });
      const onRestoreCandidate = jest.fn();
      renderHook({ onRestoreCandidate });
      await flushMicrotasks();

      expect(onRestoreCandidate.mock.calls[0][0].source).toBe(DRAFT_RESTORE_SOURCE.BACKUP);
      expect(localStorage.getItem(legacyKeyFor('30'))).not.toBeNull();
      await act(async() => { await latest.api.discardDraft(); });
      expect(localStorage.getItem(legacyKeyFor('30'))).toBeNull();
    });

    test('프롬프트가 없으면(오래된 서버 초안) 레거시 키를 지우지 않는다', async() => {
      seedLegacy('30');
      adapter.fetchConsultationLogDraftFromServer.mockResolvedValue({
        ok: true,
        hasDraft: true,
        payloadJson: JSON.stringify({ formData: { mainIssues: '옛 초안' }, memoDraft: '' }),
        version: 3,
        updatedAt: '2026-10-01T00:00:00Z'
      });
      renderHook({ recordUpdatedAt: '2026-10-02T00:00:00Z' });
      await flushMicrotasks();

      expect(localStorage.getItem(legacyKeyFor('30'))).not.toBeNull();
    });

    test('복구 후보가 없는 화면을 열어도 다른 화면의 레거시 키는 묻지 않고 지우지 않는다', async() => {
      seedLegacy('99');
      const onRestoreCandidate = jest.fn();
      renderHook({ onRestoreCandidate });
      await flushMicrotasks();

      expect(onRestoreCandidate).not.toHaveBeenCalled();
      expect(localStorage.getItem(legacyKeyFor('99'))).not.toBeNull();
    });
  });

  test('초안이 확정 저장본보다 오래되면 복구 프롬프트를 띄우지 않는다 (삭제도 하지 않음)', async() => {
    adapter.fetchConsultationLogDraftFromServer.mockResolvedValue({
      ok: true,
      hasDraft: true,
      payloadJson: JSON.stringify({ formData: { mainIssues: '옛 초안' }, memoDraft: '' }),
      version: 3,
      updatedAt: '2026-10-01T00:00:00Z'
    });
    const onRestoreCandidate = jest.fn();
    renderHook({ onRestoreCandidate, recordUpdatedAt: '2026-10-02T00:00:00Z' });
    await flushMicrotasks();

    expect(onRestoreCandidate).not.toHaveBeenCalled();
    expect(latest.api.staleDraftSavedAt).toBe(Date.parse('2026-10-01T00:00:00Z'));
    // 보고만 하고 지우지 않는다
    expect(adapter.deleteConsultationLogDraftOnServer).not.toHaveBeenCalled();
  });

  test('초안이 확정 저장본보다 최신이면 복구 프롬프트를 띄운다', async() => {
    adapter.fetchConsultationLogDraftFromServer.mockResolvedValue({
      ok: true,
      hasDraft: true,
      payloadJson: JSON.stringify({ formData: { mainIssues: '최신 초안' }, memoDraft: '' }),
      version: 4,
      updatedAt: '2026-10-03T00:00:00Z'
    });
    const onRestoreCandidate = jest.fn();
    renderHook({ onRestoreCandidate, recordUpdatedAt: '2026-10-02T00:00:00Z' });
    await flushMicrotasks();

    expect(onRestoreCandidate).toHaveBeenCalledTimes(1);
    expect(latest.api.staleDraftSavedAt).toBeNull();
  });

  test('확정 저장본 시각을 모르면 복구 프롬프트를 띄운다 (복구 기회 우선)', async() => {
    adapter.fetchConsultationLogDraftFromServer.mockResolvedValue({
      ok: true,
      hasDraft: true,
      payloadJson: JSON.stringify({ formData: { mainIssues: '초안' }, memoDraft: '' }),
      version: 2,
      updatedAt: '2026-10-01T00:00:00Z'
    });
    const onRestoreCandidate = jest.fn();
    renderHook({ onRestoreCandidate, recordUpdatedAt: null });
    await flushMicrotasks();

    expect(onRestoreCandidate).toHaveBeenCalledTimes(1);
  });

  test('discardDraft 는 서버 초안·브라우저 백업을 모두 삭제한다', async() => {
    renderHook();
    await flushMicrotasks();

    await act(async() => { await latest.api.discardDraft(); });

    expect(adapter.deleteConsultationLogDraftOnServer).toHaveBeenCalledWith({
      consultationId: 'schedule-30',
      consultantId: 41
    });
    expect(backupStore.removeDraftBackup).toHaveBeenCalled();
    expect(latest.api.status).toBe(DRAFT_AUTOSAVE_STATUS.IDLE);
  });

  test('버전 충돌이면 충돌 콜백을 호출하고 조용히 덮어쓰지 않는다', async() => {
    adapter.pushConsultationLogDraftToServer.mockResolvedValue({ ok: false, versionConflict: true });
    const onConflictDetected = jest.fn();
    renderHook({ onConflictDetected });
    await flushMicrotasks();

    act(() => { latest.api.notifyDirty(); });
    act(() => { jest.advanceTimersByTime(CONSULTATION_LOG_AUTOSAVE_DEBOUNCE_MS); });
    await flushMicrotasks();

    expect(onConflictDetected).toHaveBeenCalledTimes(1);
    expect(latest.api.conflictDetected).toBe(true);
    expect(adapter.pushConsultationLogDraftToServer).toHaveBeenCalledTimes(1);
  });

  test('enabled=false 이면 저장하지 않는다', async() => {
    renderHook({ enabled: false });
    await flushMicrotasks();

    act(() => { latest.api.notifyDirty(); });
    act(() => { jest.advanceTimersByTime(CONSULTATION_LOG_AUTOSAVE_MAX_INTERVAL_MS); });
    await flushMicrotasks();

    expect(adapter.pushConsultationLogDraftToServer).not.toHaveBeenCalled();
  });
});
