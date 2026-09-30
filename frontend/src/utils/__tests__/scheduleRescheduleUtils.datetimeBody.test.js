/**
 * scheduleRescheduleUtils — 드래그·재예약 PUT 본문 날짜가 로컬(KST) 기준인지 (UTC 전날 저장 회귀)
 */
import { DEFAULT_VALUES } from '../../constants/magicNumbers';
import {
  buildScheduleDatetimeUpdateBody,
  combineDateAndTimeHm
} from '../scheduleRescheduleUtils';

describe('buildScheduleDatetimeUpdateBody (로컬 날짜)', () => {
  const originalTz = process.env.TZ;

  beforeAll(() => {
    process.env.TZ = DEFAULT_VALUES.DEFAULT_TIMEZONE;
  });

  afterAll(() => {
    process.env.TZ = originalTz;
  });

  test('00:30 KST 드롭 → 같은 날짜로 저장', () => {
    const start = combineDateAndTimeHm('2026-10-01', '00:30');
    const end = combineDateAndTimeHm('2026-10-01', '01:20');

    expect(buildScheduleDatetimeUpdateBody(start, end)).toEqual({
      date: '2026-10-01',
      startTime: '00:30',
      endTime: '01:20'
    });
  });

  test('08:59 KST 드롭 → 같은 날짜로 저장', () => {
    const start = combineDateAndTimeHm('2026-10-01', '08:59');
    const end = combineDateAndTimeHm('2026-10-01', '09:49');

    expect(buildScheduleDatetimeUpdateBody(start, end)).toEqual({
      date: '2026-10-01',
      startTime: '08:59',
      endTime: '09:49'
    });
  });

  test('09:00 KST 이후 드롭 → 기존과 동일하게 같은 날짜', () => {
    const start = combineDateAndTimeHm('2026-10-01', '14:30');
    const end = combineDateAndTimeHm('2026-10-01', '15:20');

    expect(buildScheduleDatetimeUpdateBody(start, end).date).toBe('2026-10-01');
  });
});
