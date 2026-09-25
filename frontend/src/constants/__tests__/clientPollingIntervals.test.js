import { TIME_CONSTANTS } from '../magicNumbers';
import { SESSION_CHECK_INTERVAL } from '../session';
import {
  SESSION_CHECK_INTERVAL_MS,
  UNREAD_POLLING_INTERVAL_MS
} from '../clientPollingIntervals';

describe('clientPollingIntervals', () => {
  test('세션 확인 간격은 5분이고 session 상수가 같은 값을 쓴다', () => {
    expect(SESSION_CHECK_INTERVAL_MS).toBe(5 * 60 * 1000);
    expect(SESSION_CHECK_INTERVAL).toBe(SESSION_CHECK_INTERVAL_MS);
  });

  test('unread 폴링 간격은 10초이고 TIME_CONSTANTS 가 같은 값을 쓴다', () => {
    expect(UNREAD_POLLING_INTERVAL_MS).toBe(10000);
    expect(TIME_CONSTANTS.POLLING_INTERVAL).toBe(UNREAD_POLLING_INTERVAL_MS);
  });
});
