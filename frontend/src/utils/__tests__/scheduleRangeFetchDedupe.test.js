import {
  buildScheduleRangeFetchKey,
  createInFlightRequestDeduper
} from '../scheduleRangeFetchDedupe';

const deferred = () => {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};

describe('buildScheduleRangeFetchKey', () => {
  test('역할·대상·범위·추가 조건이 다르면 다른 키, null/undefined 는 빈 값', () => {
    const base = { role: 'CONSULTANT', targetId: 3, startDate: '2026-09-27', endDate: '2026-11-07' };
    expect(buildScheduleRangeFetchKey(base)).toBe(buildScheduleRangeFetchKey({ ...base, targetId: '3' }));
    expect(buildScheduleRangeFetchKey(base)).not.toBe(buildScheduleRangeFetchKey({ ...base, role: 'ADMIN' }));
    expect(buildScheduleRangeFetchKey(base)).not.toBe(buildScheduleRangeFetchKey({ ...base, endDate: '2026-10-31' }));
    expect(buildScheduleRangeFetchKey({ ...base, extra: [0] }))
      .not.toBe(buildScheduleRangeFetchKey({ ...base, extra: [1] }));
    expect(buildScheduleRangeFetchKey({ role: 'ADMIN', targetId: null, extra: [undefined] })).toBe('ADMIN||||');
  });
});

describe('createInFlightRequestDeduper', () => {
  test('진행 중 같은 키는 요청 1회·같은 결과 공유, 끝나면 새 요청', async() => {
    const deduper = createInFlightRequestDeduper();
    const pending = deferred();
    const request = jest.fn(() => pending.promise);

    const first = deduper.run('k', request);
    const second = deduper.run('k', request);
    expect(request).toHaveBeenCalledTimes(1);
    expect(deduper.isInFlight('k')).toBe(true);

    pending.resolve('rows');
    await expect(first).resolves.toBe('rows');
    await expect(second).resolves.toBe('rows');
    expect(deduper.isInFlight('k')).toBe(false);

    request.mockImplementation(() => Promise.resolve('fresh'));
    await expect(deduper.run('k', request)).resolves.toBe('fresh');
    expect(request).toHaveBeenCalledTimes(2);
  });

  test('다른 키는 각각 요청, 실패한 요청은 해제되어 재시도 가능', async() => {
    const deduper = createInFlightRequestDeduper();
    const failing = deferred();
    const a = jest.fn(() => failing.promise);
    const b = jest.fn(() => Promise.resolve('b'));

    const runA = deduper.run('a', a);
    await expect(deduper.run('b', b)).resolves.toBe('b');
    failing.reject(new Error('boom'));
    await expect(runA).rejects.toThrow('boom');
    expect(deduper.isInFlight('a')).toBe(false);

    a.mockImplementation(() => Promise.resolve('retry'));
    await expect(deduper.run('a', a)).resolves.toBe('retry');
  });
});
