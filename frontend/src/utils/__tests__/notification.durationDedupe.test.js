/**
 * notificationManager — 기본 표시 시간 해석·같은 메시지+타입 dedupe 창
 *
 * @author CoreSolution
 * @since 2026-10-04
 */

import { NOTIFICATION_DEDUPE_WINDOW_MS } from '../../constants/notificationTiming';

jest.mock('../apiCache', () => ({
  __esModule: true,
  cachedApiCall: jest.fn().mockResolvedValue({}),
  CACHE_CONFIG: { COMMON_CODES: { ttl: 0 } }
}));

jest.mock('../ajax', () => ({
  __esModule: true,
  apiGet: jest.fn()
}));

// eslint-disable-next-line import/first
import notificationManager, { showError } from '../notification';

describe('notificationManager duration·dedupe', () => {
  let received;
  let unsubscribe;
  let now;
  let nowSpy;

  beforeEach(() => {
    received = [];
    now = 1_000_000;
    nowSpy = jest.spyOn(Date, 'now').mockImplementation(() => now);
    notificationManager.recentByKey.clear();
    unsubscribe = notificationManager.addListener((n) => received.push(n));
  });

  afterEach(() => {
    unsubscribe();
    nowSpy.mockRestore();
  });

  test('duration 생략 show(msg, "error") 는 5000ms', () => {
    notificationManager.show('오류', 'error');
    expect(received[0].duration).toBe(5000);
  });

  test('error()/success()/warning()/info() 기본값도 타입별 SSOT', () => {
    notificationManager.error('e');
    notificationManager.success('s');
    notificationManager.warning('w');
    notificationManager.info('i');
    expect(received.map((n) => n.duration)).toEqual([5000, 3000, 4000, 4000]);
  });

  test('showError 편의 함수도 같은 기본값', () => {
    showError('편의 오류');
    expect(received[0].duration).toBe(5000);
  });

  test('명시 duration 은 유지', () => {
    notificationManager.show('명시', 'error', 4000);
    expect(received[0].duration).toBe(4000);
  });

  test('같은 메시지+타입이 창 안에 다시 오면 한 번만 내보내고 같은 id 를 돌려준다', () => {
    const first = notificationManager.show('중복 메시지', 'error');
    now += NOTIFICATION_DEDUPE_WINDOW_MS - 1;
    const second = notificationManager.show('중복 메시지', 'error');
    expect(received).toHaveLength(1);
    expect(second).toBe(first);
  });

  test('창이 지나면 다시 표시', () => {
    notificationManager.show('중복 메시지', 'error');
    now += NOTIFICATION_DEDUPE_WINDOW_MS;
    notificationManager.show('중복 메시지', 'error');
    expect(received).toHaveLength(2);
  });

  test('타입이나 문구가 다르면 합치지 않는다', () => {
    notificationManager.show('같은 문구', 'error');
    notificationManager.show('같은 문구', 'warning');
    notificationManager.show('다른 문구', 'error');
    expect(received).toHaveLength(3);
  });

  test('CustomEvent showNotification 경로도 dedupe', () => {
    const fire = () => window.dispatchEvent(new CustomEvent('showNotification', {
      detail: { message: '네트워크', type: 'warning' }
    }));
    fire();
    fire();
    expect(received).toHaveLength(1);
    expect(received[0].duration).toBe(4000);
  });
});
