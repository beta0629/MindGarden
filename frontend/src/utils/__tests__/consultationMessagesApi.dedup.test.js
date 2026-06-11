/**
 * `consultationMessagesApi.getConsultationMessagesList` in-flight dedup wrapper 검증.
 *
 * <p>B6 묶음 A (2026-06-12): NotificationContext / NotificationDropdown / UnifiedNotifications
 * / ClientMessageWidget / MessageWidget / ClientMessageSection / AdminMessageListBlock 이 동시
 * mount 시 동일 endpoint 를 다중 fetch 하던 회귀를 dedup 으로 단일 fetch 화한다.</p>
 *
 * <p>대상 행동:
 * <ul>
 *   <li>같은 user + 같은 params 동시 호출 N=5 → apiGet 1회 호출, 모든 호출자가 동일 결과 수신</li>
 *   <li>완료 후 다시 호출하면 신규 fetch 1회 발생 (Map 정리)</li>
 *   <li>다른 params 동시 호출 (page=0 vs page=1) → 각각 1회 fetch (총 2회)</li>
 *   <li>다른 user (CLIENT vs CONSULTANT) → 각각 1회 fetch</li>
 *   <li>view 파라미터 동시 호출 (admin_ops) → 단일 fetch dedup</li>
 *   <li>path 없음(user null) → null 반환, fetch 호출 없음</li>
 * </ul>
 * </p>
 */

jest.mock('../ajax', () => ({
  apiGet: jest.fn()
}));

const { apiGet } = require('../ajax');
const {
  getConsultationMessagesList,
  getConsultationMessagesListPath,
  _resetConsultationMessagesListInflightForTest
} = require('../consultationMessagesApi');

const adminUser = { id: 10, role: 'ADMIN' };
const clientUser = { id: 7, role: 'CLIENT' };
const consultantUser = { id: 3, role: 'CONSULTANT' };

const deferred = () => {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};

describe('consultationMessagesApi.getConsultationMessagesList — in-flight dedup', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    _resetConsultationMessagesListInflightForTest();
  });

  it('동시 호출 N=5 동일 user+params → apiGet 1회 호출, 모두 동일 결과', async() => {
    const d = deferred();
    apiGet.mockReturnValue(d.promise);

    const calls = Array.from({ length: 5 }, () =>
      getConsultationMessagesList(clientUser, { page: 0, size: 50 })
    );

    expect(apiGet).toHaveBeenCalledTimes(1);
    expect(apiGet).toHaveBeenCalledWith(
      '/api/v1/consultation-messages/client/7',
      { page: 0, size: 50 }
    );

    const payload = { messages: [{ id: 1 }] };
    d.resolve(payload);
    const results = await Promise.all(calls);
    results.forEach((r) => expect(r).toBe(payload));
  });

  it('완료 후 다시 호출하면 신규 fetch 1회 발생 — Map 정리 검증', async() => {
    apiGet.mockResolvedValueOnce({ messages: [] });
    await getConsultationMessagesList(clientUser, { page: 0, size: 50 });
    expect(apiGet).toHaveBeenCalledTimes(1);

    apiGet.mockResolvedValueOnce({ messages: [{ id: 2 }] });
    const second = await getConsultationMessagesList(clientUser, { page: 0, size: 50 });
    expect(apiGet).toHaveBeenCalledTimes(2);
    expect(second).toEqual({ messages: [{ id: 2 }] });
  });

  it('다른 params (page=0 vs page=1) 동시 호출 → 각각 1회 fetch', async() => {
    const d1 = deferred();
    const d2 = deferred();
    apiGet
      .mockReturnValueOnce(d1.promise)
      .mockReturnValueOnce(d2.promise);

    const p0 = getConsultationMessagesList(clientUser, { page: 0, size: 50 });
    const p1 = getConsultationMessagesList(clientUser, { page: 1, size: 50 });

    expect(apiGet).toHaveBeenCalledTimes(2);

    d1.resolve({ messages: ['page-0'] });
    d2.resolve({ messages: ['page-1'] });
    expect(await p0).toEqual({ messages: ['page-0'] });
    expect(await p1).toEqual({ messages: ['page-1'] });
  });

  it('다른 user (CLIENT vs CONSULTANT) → path 자체가 달라 각각 1회 fetch', async() => {
    const d1 = deferred();
    const d2 = deferred();
    apiGet
      .mockReturnValueOnce(d1.promise)
      .mockReturnValueOnce(d2.promise);

    const clientCall = getConsultationMessagesList(clientUser, { page: 0, size: 50 });
    const consultantCall = getConsultationMessagesList(consultantUser, { page: 0, size: 50 });

    expect(apiGet).toHaveBeenCalledTimes(2);
    expect(apiGet).toHaveBeenNthCalledWith(
      1,
      '/api/v1/consultation-messages/client/7',
      { page: 0, size: 50 }
    );
    expect(apiGet).toHaveBeenNthCalledWith(
      2,
      '/api/v1/consultation-messages/consultant/3',
      { page: 0, size: 50 }
    );

    d1.resolve({ messages: [] });
    d2.resolve({ messages: [] });
    await clientCall;
    await consultantCall;
  });

  it('admin user + view=admin_ops 동시 호출 N=3 → /all 엔드포인트로 단일 fetch dedup', async() => {
    const d = deferred();
    apiGet.mockReturnValue(d.promise);

    const calls = [
      getConsultationMessagesList(adminUser, { view: 'admin_ops' }),
      getConsultationMessagesList(adminUser, { view: 'admin_ops' }),
      getConsultationMessagesList(adminUser, { view: 'admin_ops' })
    ];

    expect(apiGet).toHaveBeenCalledTimes(1);
    expect(apiGet).toHaveBeenCalledWith(
      '/api/v1/consultation-messages/all',
      { view: 'admin_ops' }
    );

    d.resolve({ content: [] });
    const results = await Promise.all(calls);
    results.forEach((r) => expect(r).toEqual({ content: [] }));
  });

  it('user 가 null 이거나 id 가 없으면 null 반환 + apiGet 미호출', async() => {
    expect(await getConsultationMessagesList(null)).toBeNull();
    expect(await getConsultationMessagesList({ role: 'CLIENT' })).toBeNull();
    expect(await getConsultationMessagesList({ id: '', role: 'CLIENT' })).toBeNull();
    expect(apiGet).not.toHaveBeenCalled();
  });

  it('apiGet 실패 시 같은 키의 다음 호출은 신규 fetch 를 시도 (Map 정리 검증)', async() => {
    apiGet.mockRejectedValueOnce(new Error('boom'));
    await expect(
      getConsultationMessagesList(clientUser, { page: 0, size: 50 })
    ).rejects.toThrow('boom');

    apiGet.mockResolvedValueOnce({ messages: [{ id: 99 }] });
    const retry = await getConsultationMessagesList(clientUser, { page: 0, size: 50 });
    expect(apiGet).toHaveBeenCalledTimes(2);
    expect(retry).toEqual({ messages: [{ id: 99 }] });
  });

  it('getConsultationMessagesListPath 기본 동작 (회귀)', () => {
    expect(getConsultationMessagesListPath(clientUser)).toBe('/api/v1/consultation-messages/client/7');
    expect(getConsultationMessagesListPath(consultantUser)).toBe(
      '/api/v1/consultation-messages/consultant/3'
    );
    expect(getConsultationMessagesListPath(adminUser)).toBe('/api/v1/consultation-messages/all');
    expect(getConsultationMessagesListPath(null)).toBeNull();
  });
});
