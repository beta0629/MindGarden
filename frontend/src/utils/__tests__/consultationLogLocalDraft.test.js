import {
  CONSULTATION_LOG_LEGACY_LOCAL_DRAFT_KEY_PREFIX,
  CONSULTATION_LOG_LOCAL_DRAFT_STORAGE_VERSION,
  CONSULTATION_LOG_LOCAL_DRAFT_TTL_MS
} from '../../constants/consultationLogAutosaveConstants';
import {
  buildConsultationLogDraftStorageKey,
  purgeAllLegacyConsultationLogLocalDrafts,
  readLegacyConsultationLogLocalDraft,
  removeConsultationLogLocalDraft
} from '../consultationLogLocalDraft';

/**
 * 레거시 평문 localStorage 초안 — 1회 읽기 + 전량 삭제만 남았는지 확인.
 */
describe('consultationLogLocalDraft (레거시 정리 전용)', () => {
  const tenantId = 'tenant-alpha';
  const scope = { type: 'session', id: 'log-42' };

  const writeLegacy = (savedAt, payload) => {
    localStorage.setItem(
      buildConsultationLogDraftStorageKey(tenantId, scope),
      JSON.stringify({
        v: CONSULTATION_LOG_LOCAL_DRAFT_STORAGE_VERSION,
        savedAt,
        formData: payload.formData,
        memoDraft: payload.memoDraft
      })
    );
  };

  beforeEach(() => {
    localStorage.clear();
    jest.restoreAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
    jest.restoreAllMocks();
  });

  test('쓰기 함수는 더 이상 제공하지 않는다 (평문 본문 저장 금지)', async() => {
    const moduleExports = await import('../consultationLogLocalDraft');
    expect(moduleExports.writeConsultationLogLocalDraft).toBeUndefined();
    expect(moduleExports.readConsultationLogLocalDraft).toBeUndefined();
  });

  test('buildConsultationLogDraftStorageKey는 레거시 키 형식을 유지한다', () => {
    expect(buildConsultationLogDraftStorageKey(tenantId, scope)).toBe(
      `${CONSULTATION_LOG_LEGACY_LOCAL_DRAFT_KEY_PREFIX}`
      + `.v${CONSULTATION_LOG_LOCAL_DRAFT_STORAGE_VERSION}:${tenantId}:${scope.type}:${scope.id}`
    );
  });

  test('TTL 내 레거시 값은 복구 후보로 1회 읽힌다', () => {
    jest.spyOn(Date, 'now').mockReturnValue(1_700_000_000_000);
    writeLegacy(1_700_000_000_000, { formData: { mainIssues: '내용' }, memoDraft: '메모' });

    const draft = readLegacyConsultationLogLocalDraft(tenantId, scope);

    expect(draft).toEqual({
      formData: { mainIssues: '내용' },
      memoDraft: '메모',
      savedAt: 1_700_000_000_000
    });
  });

  test('TTL 초과 레거시 값은 읽지 않고 즉시 삭제한다', () => {
    const savedAt = 1_700_000_000_000;
    jest.spyOn(Date, 'now').mockReturnValue(savedAt + CONSULTATION_LOG_LOCAL_DRAFT_TTL_MS + 1);
    writeLegacy(savedAt, { formData: { mainIssues: '내용' }, memoDraft: '' });

    expect(readLegacyConsultationLogLocalDraft(tenantId, scope)).toBeNull();
    expect(localStorage.getItem(buildConsultationLogDraftStorageKey(tenantId, scope))).toBeNull();
  });

  test('removeConsultationLogLocalDraft는 해당 키만 지운다', () => {
    writeLegacy(Date.now(), { formData: { a: 1 }, memoDraft: '' });
    localStorage.setItem('other.key', 'keep');

    removeConsultationLogLocalDraft(tenantId, scope);

    expect(localStorage.getItem(buildConsultationLogDraftStorageKey(tenantId, scope))).toBeNull();
    expect(localStorage.getItem('other.key')).toBe('keep');
  });

  test('purgeAllLegacyConsultationLogLocalDrafts는 접두어가 같은 키를 전부 지운다', () => {
    localStorage.setItem(`${CONSULTATION_LOG_LEGACY_LOCAL_DRAFT_KEY_PREFIX}.v1:t1:schedule:1`, '{}');
    localStorage.setItem(`${CONSULTATION_LOG_LEGACY_LOCAL_DRAFT_KEY_PREFIX}.v1:t2:record:9`, '{}');
    localStorage.setItem('unrelated', 'keep');

    const removed = purgeAllLegacyConsultationLogLocalDrafts();

    expect(removed).toBe(2);
    expect(localStorage.getItem(`${CONSULTATION_LOG_LEGACY_LOCAL_DRAFT_KEY_PREFIX}.v1:t1:schedule:1`)).toBeNull();
    expect(localStorage.getItem(`${CONSULTATION_LOG_LEGACY_LOCAL_DRAFT_KEY_PREFIX}.v1:t2:record:9`)).toBeNull();
    expect(localStorage.getItem('unrelated')).toBe('keep');
  });
});
