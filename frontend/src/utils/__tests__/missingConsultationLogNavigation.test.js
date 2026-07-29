/**
 * missingConsultationLogNavigation 단위 테스트.
 *
 * @author MindGarden core-coder
 * @since 2026-07-29
 */

import {
  buildConsultantSchedulesByDateEndpoint,
  buildMissingConsultationLogFallbackRoute,
  lookupMissingLogIdsForDate,
  pickMissingLogScheduleFromList,
  resolveMissingLogSchedule,
  unwrapScheduleList
} from '../missingConsultationLogNavigation';
import StandardizedApi from '../standardizedApi';
import { ADMIN_ROUTES } from '../../constants/adminRoutes';

jest.mock('../standardizedApi', () => ({
  __esModule: true,
  default: { get: jest.fn() }
}));

beforeEach(() => {
  StandardizedApi.get.mockReset();
});

describe('missingConsultationLogNavigation', () => {
  test('buildConsultantSchedulesByDateEndpoint — 상수 경로 + consultantId', () => {
    expect(buildConsultantSchedulesByDateEndpoint(41)).toBe(
      '/api/v1/schedules/consultant/41/date'
    );
  });

  test('buildMissingConsultationLogFallbackRoute — date·consultantId 쿼리', () => {
    expect(buildMissingConsultationLogFallbackRoute({
      consultantId: 3,
      date: '2026-05-08'
    })).toBe(`${ADMIN_ROUTES.CONSULTATION_LOGS}?date=2026-05-08&consultantId=3`);
  });

  test('buildMissingConsultationLogFallbackRoute — scheduleId·clientId 포함', () => {
    expect(buildMissingConsultationLogFallbackRoute({
      consultantId: 3,
      date: '2026-05-08',
      scheduleId: 99,
      clientId: 7
    })).toBe(
      `${ADMIN_ROUTES.CONSULTATION_LOGS}?date=2026-05-08&consultantId=3&scheduleId=99&clientId=7`
    );
  });

  test('pickMissingLogScheduleFromList — CANCELLED 제외 후 첫 건', () => {
    const picked = pickMissingLogScheduleFromList([
      { id: 1, status: 'CANCELLED' },
      { id: 2, status: 'COMPLETED', consultantId: 3 }
    ]);
    expect(picked.id).toBe(2);
  });

  test('unwrapScheduleList — data 배열 / 직접 배열', () => {
    expect(unwrapScheduleList([{ id: 1 }])).toEqual([{ id: 1 }]);
    expect(unwrapScheduleList({ data: [{ id: 2 }] })).toEqual([{ id: 2 }]);
    expect(unwrapScheduleList(null)).toEqual([]);
  });

  test('lookupMissingLogIdsForDate — scheduleIdsByDate / missingEntries', () => {
    expect(lookupMissingLogIdsForDate({
      scheduleIdsByDate: { '2026-05-08': 55 }
    }, '2026-05-08')).toEqual({ scheduleId: 55, clientId: null });

    expect(lookupMissingLogIdsForDate({
      missingEntries: [{ date: '2026-07-07', scheduleId: 88, clientId: 12 }]
    }, '2026-07-07')).toEqual({ scheduleId: 88, clientId: 12 });
  });

  test('resolveMissingLogSchedule — scheduleId 있으면 API 미호출', async() => {
    const result = await resolveMissingLogSchedule({
      consultantId: 3,
      date: '2026-05-08',
      scheduleId: 99,
      clientId: 7
    });
    expect(StandardizedApi.get).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      id: 99,
      consultantId: 3,
      clientId: 7,
      date: '2026-05-08'
    });
  });

  test('resolveMissingLogSchedule — API 조회로 스케줄 선택', async() => {
    StandardizedApi.get.mockResolvedValue([
      { id: 10, status: 'CANCELLED' },
      { id: 11, status: 'CONFIRMED', consultantId: 3, clientId: 4, date: '2026-05-08' }
    ]);
    const result = await resolveMissingLogSchedule({
      consultantId: 3,
      date: '2026-05-08'
    });
    expect(StandardizedApi.get).toHaveBeenCalledWith(
      '/api/v1/schedules/consultant/3/date',
      { date: '2026-05-08' }
    );
    expect(result.id).toBe(11);
    expect(result.clientId).toBe(4);
  });
});
