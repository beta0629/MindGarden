/**
 * resolveNotificationDuration — 타입별 기본값·긴 문구 가산·최대값·명시 override
 *
 * @author CoreSolution
 * @since 2026-10-04
 */

import { NOTIFICATION_DURATION } from '../../constants/notificationTiming';
import { getNotificationText, resolveNotificationDuration } from '../notificationDuration';

const textOf = (length) => '가'.repeat(length);

describe('resolveNotificationDuration', () => {
  test('타입별 기본값: error 5000 / warning 4000 / info 4000 / success 3000', () => {
    expect(resolveNotificationDuration('짧은 문구', 'error')).toBe(5000);
    expect(resolveNotificationDuration('짧은 문구', 'warning')).toBe(4000);
    expect(resolveNotificationDuration('짧은 문구', 'info')).toBe(4000);
    expect(resolveNotificationDuration('짧은 문구', 'success')).toBe(3000);
  });

  test('기본값은 NOTIFICATION_DURATION 한 곳에서 온다', () => {
    expect(resolveNotificationDuration('a', 'error')).toBe(NOTIFICATION_DURATION.BY_TYPE.error);
    expect(NOTIFICATION_DURATION.MAX_MS).toBe(8000);
  });

  test('모르는 타입·대문자 타입·타입 없음', () => {
    expect(resolveNotificationDuration('a', 'unknown')).toBe(4000);
    expect(resolveNotificationDuration('a', 'ERROR')).toBe(5000);
    expect(resolveNotificationDuration('a')).toBe(4000);
  });

  test('40자까지는 가산 없음, 41자부터 20자마다 1초 가산', () => {
    expect(resolveNotificationDuration(textOf(40), 'error')).toBe(5000);
    expect(resolveNotificationDuration(textOf(41), 'error')).toBe(6000);
    expect(resolveNotificationDuration(textOf(60), 'error')).toBe(6000);
    expect(resolveNotificationDuration(textOf(61), 'error')).toBe(7000);
    expect(resolveNotificationDuration(textOf(61), 'success')).toBe(5000);
  });

  test('긴 문구라도 최대 8000ms', () => {
    expect(resolveNotificationDuration(textOf(81), 'error')).toBe(8000);
    expect(resolveNotificationDuration(textOf(500), 'success')).toBe(8000);
  });

  test('명시 duration 은 그대로(최대값·타입 기본값 무시)', () => {
    expect(resolveNotificationDuration('a', 'error', 1500)).toBe(1500);
    expect(resolveNotificationDuration(textOf(500), 'error', 12000)).toBe(12000);
  });

  test('0·음수·NaN·문자열 duration 은 명시값으로 보지 않는다', () => {
    expect(resolveNotificationDuration('a', 'error', 0)).toBe(5000);
    expect(resolveNotificationDuration('a', 'error', -1)).toBe(5000);
    expect(resolveNotificationDuration('a', 'error', Number.NaN)).toBe(5000);
    expect(resolveNotificationDuration('a', 'error', '1000')).toBe(5000);
  });

  test('payload 객체는 message 길이로 계산, 이모지는 한 글자로 센다', () => {
    expect(resolveNotificationDuration({ message: textOf(41) }, 'info')).toBe(5000);
    expect(getNotificationText({ title: '제목' })).toBe('제목');
    expect(getNotificationText(null)).toBe('');
    expect(resolveNotificationDuration('😀'.repeat(41), 'error')).toBe(6000);
  });
});
