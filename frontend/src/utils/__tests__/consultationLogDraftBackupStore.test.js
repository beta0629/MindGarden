import {
  __resetDraftBackupMemoryForTest,
  buildDraftBackupRecordKey,
  purgeAllDraftBackups,
  readDraftBackup,
  removeDraftBackup,
  saveDraftBackup
} from '../consultationLogDraftBackupStore';

const SCOPE = { userId: 41, tenantId: 'tenant-a', consultationId: 'schedule-30' };
const PAYLOAD = JSON.stringify({ formData: { mainIssues: '내담자가 불안을 호소' }, memoDraft: '' });

describe('consultationLogDraftBackupStore', () => {
  beforeEach(() => {
    __resetDraftBackupMemoryForTest();
    localStorage.clear();
    sessionStorage.clear();
  });

  test('레코드 키에 userId 와 tenantId 가 포함된다 (계정 전환 시 교차 복구 방지)', () => {
    expect(buildDraftBackupRecordKey(SCOPE)).toBe('u41:ttenant-a:cschedule-30');
    expect(buildDraftBackupRecordKey({ ...SCOPE, userId: 42 }))
      .not.toBe(buildDraftBackupRecordKey(SCOPE));
  });

  test('저장한 백업을 같은 세션에서 다시 읽을 수 있다', async() => {
    await saveDraftBackup(SCOPE, PAYLOAD);
    const restored = await readDraftBackup(SCOPE);

    expect(restored).not.toBeNull();
    expect(restored.payloadJson).toBe(PAYLOAD);
    expect(typeof restored.savedAt).toBe('number');
  });

  test('본문을 localStorage·sessionStorage 에 쓰지 않는다', async() => {
    const localSet = jest.spyOn(Storage.prototype, 'setItem');
    await saveDraftBackup(SCOPE, PAYLOAD);

    expect(localSet).not.toHaveBeenCalled();
    expect(JSON.stringify(Object.values(localStorage))).not.toContain('불안');
    expect(JSON.stringify(Object.values(sessionStorage))).not.toContain('불안');
    localSet.mockRestore();
  });

  test('다른 사용자 범위로는 읽히지 않는다', async() => {
    await saveDraftBackup(SCOPE, PAYLOAD);

    expect(await readDraftBackup({ ...SCOPE, userId: 42 })).toBeNull();
    expect(await readDraftBackup({ ...SCOPE, tenantId: 'tenant-b' })).toBeNull();
  });

  test('removeDraftBackup 은 해당 범위만, purgeAllDraftBackups 는 전량 삭제한다', async() => {
    const other = { ...SCOPE, consultationId: 'schedule-31' };
    await saveDraftBackup(SCOPE, PAYLOAD);
    await saveDraftBackup(other, PAYLOAD);

    await removeDraftBackup(SCOPE);
    expect(await readDraftBackup(SCOPE)).toBeNull();
    expect(await readDraftBackup(other)).not.toBeNull();

    await purgeAllDraftBackups();
    expect(await readDraftBackup(other)).toBeNull();
  });

  test('범위가 불완전하면 저장하지 않는다', async() => {
    expect(buildDraftBackupRecordKey({ ...SCOPE, userId: null })).toBeNull();
    await expect(saveDraftBackup({ ...SCOPE, userId: null }, PAYLOAD)).resolves.toBeTruthy();
    expect(await readDraftBackup({ ...SCOPE, userId: null })).toBeNull();
  });
});
