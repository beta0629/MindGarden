import {
  CONSULTATION_LOG_LOCAL_DRAFT_STORAGE_VERSION,
  CONSULTATION_LOG_LOCAL_DRAFT_TTL_MS
} from '../../constants/consultationLogAutosaveConstants';
import {
  buildConsultationLogDraftStorageKey,
  readConsultationLogLocalDraft,
  removeConsultationLogLocalDraft,
  writeConsultationLogLocalDraft
} from '../consultationLogLocalDraft';

describe('consultationLogLocalDraft', () => {
  const tenantId = 'tenant-alpha';
  const scope = { type: 'session', id: 'log-42' };

  beforeEach(() => {
    localStorage.clear();
    jest.restoreAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
    jest.restoreAllMocks();
  });

  test('buildConsultationLogDraftStorageKey combines tenantId, scope.type, scope.id and version', () => {
    const key = buildConsultationLogDraftStorageKey(tenantId, scope);
    expect(key).toBe(
      `mg.cl.localDraft.v${CONSULTATION_LOG_LOCAL_DRAFT_STORAGE_VERSION}:${tenantId}:${scope.type}:${scope.id}`
    );
  });

  test('writeConsultationLogLocalDraft then readConsultationLogLocalDraft roundtrip', () => {
    const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(1_700_000_000_000);
    const payload = {
      formData: { title: '일지', note: '내용' },
      memoDraft: '메모 초안'
    };

    writeConsultationLogLocalDraft(tenantId, scope, payload);
    const read = readConsultationLogLocalDraft(tenantId, scope);

    expect(read).toEqual({
      formData: payload.formData,
      memoDraft: payload.memoDraft
    });
    expect(nowSpy).toHaveBeenCalled();
  });

  test('readConsultationLogLocalDraft returns null after TTL and removes stored draft', () => {
    const savedAt = 1_700_000_000_000;
    const afterTtl = savedAt + CONSULTATION_LOG_LOCAL_DRAFT_TTL_MS + 1;

    jest.spyOn(Date, 'now').mockReturnValueOnce(savedAt);
    writeConsultationLogLocalDraft(tenantId, scope, {
      formData: { a: 1 },
      memoDraft: 'x'
    });

    const storageKey = buildConsultationLogDraftStorageKey(tenantId, scope);
    expect(localStorage.getItem(storageKey)).not.toBeNull();

    jest.spyOn(Date, 'now').mockReturnValue(afterTtl);
    const read = readConsultationLogLocalDraft(tenantId, scope);

    expect(read).toBeNull();
    expect(localStorage.getItem(storageKey)).toBeNull();
  });

  test('invalid tenant or scope: read returns null and write is no-op', () => {
    const setSpy = jest.spyOn(Storage.prototype, 'setItem');
    const payload = { formData: { x: 1 }, memoDraft: '' };

    expect(readConsultationLogLocalDraft('', scope)).toBeNull();
    expect(readConsultationLogLocalDraft('   ', scope)).toBeNull();
    expect(readConsultationLogLocalDraft(tenantId, { type: '', id: '1' })).toBeNull();
    expect(readConsultationLogLocalDraft(tenantId, { type: 't', id: '' })).toBeNull();
    expect(readConsultationLogLocalDraft(tenantId, { type: 't', id: '  ' })).toBeNull();
    expect(readConsultationLogLocalDraft(tenantId, { type: 't', id: null })).toBeNull();

    writeConsultationLogLocalDraft('', scope, payload);
    writeConsultationLogLocalDraft(tenantId, { type: '', id: '1' }, payload);
    writeConsultationLogLocalDraft(tenantId, { type: 't', id: '  ' }, payload);

    expect(setSpy).not.toHaveBeenCalled();
    setSpy.mockRestore();
  });

  test('removeConsultationLogLocalDraft then readConsultationLogLocalDraft is null', () => {
    jest.spyOn(Date, 'now').mockReturnValue(1_700_000_000_000);
    writeConsultationLogLocalDraft(tenantId, scope, {
      formData: { k: 'v' },
      memoDraft: ''
    });
    expect(readConsultationLogLocalDraft(tenantId, scope)).not.toBeNull();

    removeConsultationLogLocalDraft(tenantId, scope);
    expect(readConsultationLogLocalDraft(tenantId, scope)).toBeNull();
  });
});
