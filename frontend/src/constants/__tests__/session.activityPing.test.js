import {
  SESSION_ACTIVITY_EVENTS,
  SESSION_ACTIVITY_PING_INTERVAL_MS,
  SESSION_CHECK_COOLDOWN_MS
} from '../session';

describe('SESSION_ACTIVITY_PING_INTERVAL_MS', () => {
  test('키보드·마우스 체감용 30–60초 구간이며 세션 체크 쿨다운보다 길다', () => {
    expect(SESSION_ACTIVITY_PING_INTERVAL_MS).toBeGreaterThanOrEqual(30 * 1000);
    expect(SESSION_ACTIVITY_PING_INTERVAL_MS).toBeLessThanOrEqual(60 * 1000);
    expect(SESSION_ACTIVITY_PING_INTERVAL_MS).toBeGreaterThan(SESSION_CHECK_COOLDOWN_MS);
  });
});

describe('SESSION_ACTIVITY_EVENTS', () => {
  test('키보드·마우스·터치·스크롤·휠·이동 실질 활동을 모두 포함한다', () => {
    const required = [
      'keydown',
      'input',
      'pointerdown',
      'click',
      'scroll',
      'wheel',
      'touchstart',
      'mousemove',
      'pointermove'
    ];
    required.forEach((type) => {
      expect(SESSION_ACTIVITY_EVENTS).toContain(type);
    });
    expect(SESSION_ACTIVITY_EVENTS).toHaveLength(required.length);
  });

  test('이벤트 목록은 동결되어 공유 스로틀 SSOT로 쓰인다', () => {
    expect(Object.isFrozen(SESSION_ACTIVITY_EVENTS)).toBe(true);
  });
});
