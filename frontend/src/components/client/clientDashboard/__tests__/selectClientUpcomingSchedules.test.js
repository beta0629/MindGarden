/**
 * selectClientUpcomingSchedules / isClientUpcomingScheduleStatus — Home·일정 SSOT
 *
 * @author CoreSolution
 * @since 2026-09-18
 */

import { STATUS } from '../../../../constants/schedule';
import {
  isClientUpcomingScheduleStatus,
  selectClientUpcomingSchedules
} from '../scheduleUtils';

const FIXED_NOW = new Date('2026-09-18T12:00:00.000Z');

function makeSchedule(overrides = {}) {
  return {
    id: overrides.id ?? 1,
    date: overrides.date ?? '2026-09-20',
    startTime: overrides.startTime ?? '10:00',
    status: overrides.status ?? STATUS.BOOKED,
    ...overrides
  };
}

describe('isClientUpcomingScheduleStatus', () => {
  test('includes BOOKED, CONFIRMED, TENTATIVE_PENDING_PAYMENT, IN_PROGRESS', () => {
    expect(isClientUpcomingScheduleStatus(STATUS.BOOKED)).toBe(true);
    expect(isClientUpcomingScheduleStatus(STATUS.CONFIRMED)).toBe(true);
    expect(isClientUpcomingScheduleStatus('TENTATIVE_PENDING_PAYMENT')).toBe(true);
    expect(isClientUpcomingScheduleStatus('IN_PROGRESS')).toBe(true);
  });

  test('excludes COMPLETED, CANCELLED, VACATION, AVAILABLE', () => {
    expect(isClientUpcomingScheduleStatus(STATUS.COMPLETED)).toBe(false);
    expect(isClientUpcomingScheduleStatus(STATUS.CANCELLED)).toBe(false);
    expect(isClientUpcomingScheduleStatus(STATUS.VACATION)).toBe(false);
    expect(isClientUpcomingScheduleStatus(STATUS.AVAILABLE)).toBe(false);
  });

  test('rejects null/empty status', () => {
    expect(isClientUpcomingScheduleStatus(null)).toBe(false);
    expect(isClientUpcomingScheduleStatus('')).toBe(false);
    expect(isClientUpcomingScheduleStatus('   ')).toBe(false);
  });
});

describe('selectClientUpcomingSchedules', () => {
  test('BOOKED future is included', () => {
    const result = selectClientUpcomingSchedules(
      [makeSchedule({ id: 1, status: STATUS.BOOKED, date: '2026-09-25' })],
      { now: FIXED_NOW }
    );
    expect(result).toHaveLength(1);
    expect(result[0].status).toBe(STATUS.BOOKED);
  });

  test('CONFIRMED future is included', () => {
    const result = selectClientUpcomingSchedules(
      [makeSchedule({ id: 2, status: STATUS.CONFIRMED, date: '2026-09-25' })],
      { now: FIXED_NOW }
    );
    expect(result).toHaveLength(1);
    expect(result[0].status).toBe(STATUS.CONFIRMED);
  });

  test('COMPLETED and CANCELLED are excluded even if future', () => {
    const result = selectClientUpcomingSchedules(
      [
        makeSchedule({ id: 3, status: STATUS.COMPLETED, date: '2026-09-25' }),
        makeSchedule({ id: 4, status: STATUS.CANCELLED, date: '2026-09-26' })
      ],
      { now: FIXED_NOW }
    );
    expect(result).toHaveLength(0);
  });

  test('past date is excluded', () => {
    const result = selectClientUpcomingSchedules(
      [makeSchedule({ id: 5, status: STATUS.BOOKED, date: '2026-09-10' })],
      { now: FIXED_NOW }
    );
    expect(result).toHaveLength(0);
  });

  test('today ISO date is included (date >= today)', () => {
    const result = selectClientUpcomingSchedules(
      [makeSchedule({ id: 6, status: STATUS.BOOKED, date: '2026-09-18' })],
      { now: FIXED_NOW }
    );
    expect(result).toHaveLength(1);
  });

  test('when list has BOOKED future, home selector must not return empty', () => {
    const list = [
      makeSchedule({ id: 10, status: STATUS.COMPLETED, date: '2026-09-01' }),
      makeSchedule({ id: 11, status: STATUS.BOOKED, date: '2026-09-22', startTime: '14:00' }),
      makeSchedule({ id: 12, status: STATUS.CANCELLED, date: '2026-09-30' })
    ];
    const homeUpcoming = selectClientUpcomingSchedules(list, {
      now: FIXED_NOW,
      limit: 5
    });
    expect(homeUpcoming.length).toBeGreaterThan(0);
    expect(homeUpcoming[0].id).toBe(11);
    expect(homeUpcoming[0].status).toBe(STATUS.BOOKED);
  });

  test('optional limit works and sort is by scheduleSortKey ASC', () => {
    const list = [
      makeSchedule({ id: 21, status: STATUS.CONFIRMED, date: '2026-09-28', startTime: '09:00' }),
      makeSchedule({ id: 22, status: 'IN_PROGRESS', date: '2026-09-20', startTime: '11:00' }),
      makeSchedule({
        id: 23,
        status: 'TENTATIVE_PENDING_PAYMENT',
        date: '2026-09-20',
        startTime: '09:00'
      }),
      makeSchedule({ id: 24, status: STATUS.BOOKED, date: '2026-09-21', startTime: '10:00' })
    ];
    const result = selectClientUpcomingSchedules(list, { now: FIXED_NOW, limit: 2 });
    expect(result).toHaveLength(2);
    expect(result.map((s) => s.id)).toEqual([23, 22]);
  });

  test('non-array input returns empty array', () => {
    expect(selectClientUpcomingSchedules(null)).toEqual([]);
    expect(selectClientUpcomingSchedules(undefined)).toEqual([]);
  });
});
