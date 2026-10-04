/**
 * 로그아웃·계정 전환 시 상담일지 초안 잔존물 제거 검증.
 *
 * 레거시 평문 localStorage 키와 암호화 백업(IndexedDB·메모리)이 모두 지워져야,
 * 공용 PC 에서 다음 사용자가 이전 사용자의 상담 내용을 복구할 수 없다.
 */
jest.mock('../consultationLogLocalDraft', () => ({
  purgeAllLegacyConsultationLogLocalDrafts: jest.fn()
}));
jest.mock('../consultationLogDraftBackupStore', () => ({
  purgeAllDraftBackups: jest.fn().mockResolvedValue(undefined)
}));

const { purgeAllLegacyConsultationLogLocalDrafts } = require('../consultationLogLocalDraft');
const { purgeAllDraftBackups } = require('../consultationLogDraftBackupStore');
const sessionManager = require('../sessionManager').default;

describe('sessionManager — 상담일지 초안 잔존물 제거', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    sessionManager.user = null;
  });

  test('로그아웃 정리에서 레거시 평문 키와 암호화 백업을 모두 제거한다', () => {
    sessionManager.applyClientLogoutCleanupPreserveSubdomain();

    expect(purgeAllLegacyConsultationLogLocalDrafts).toHaveBeenCalledTimes(1);
    expect(purgeAllDraftBackups).toHaveBeenCalledTimes(1);
  });

  test('로그아웃 정리는 IndexedDB 삭제 Promise 를 반환해 호출자가 기다릴 수 있다', async() => {
    let resolvePurge;
    purgeAllDraftBackups.mockReturnValue(new Promise((resolve) => { resolvePurge = resolve; }));

    const pending = sessionManager.applyClientLogoutCleanupPreserveSubdomain();
    expect(typeof pending?.then).toBe('function');

    let settled = false;
    void pending.then(() => { settled = true; });
    await Promise.resolve();
    // 아직 끝나지 않았다 — 리다이렉트가 이 시점에 일어나면 백업이 남는다.
    expect(settled).toBe(false);

    resolvePurge();
    await pending;
    expect(settled).toBe(true);
  });

  test('다른 사용자로 전환하면 이전 사용자의 초안을 제거한다', () => {
    sessionManager.user = { id: 41 };
    sessionManager.setUser({ id: 42 });

    expect(purgeAllLegacyConsultationLogLocalDrafts).toHaveBeenCalledTimes(1);
    expect(purgeAllDraftBackups).toHaveBeenCalledTimes(1);
  });

  test('같은 사용자 정보 갱신은 초안을 지우지 않는다', () => {
    sessionManager.user = { id: 41 };
    sessionManager.setUser({ id: 41, name: '갱신' });

    expect(purgeAllLegacyConsultationLogLocalDrafts).not.toHaveBeenCalled();
    expect(purgeAllDraftBackups).not.toHaveBeenCalled();
  });
});
