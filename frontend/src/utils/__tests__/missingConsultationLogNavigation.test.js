/**
 * missingConsultationLogNavigation 단위 테스트.
 *
 * @author MindGarden core-coder
 * @since 2026-07-29
 */

import {
  buildConsultantSchedulesByDateEndpoint,
  buildConsultantMissingConsultationLogFallbackRoute,
  buildMissingConsultationLogFallbackRoute,
  buildScheduleDetailEndpoint,
  findScheduleInListById,
  lookupMissingLogIdsForDate,
  normalizeMissingLogScheduleId,
  pickMissingLogScheduleFromList,
  resolveMissingLogSchedule,
  unwrapScheduleDetail,
  unwrapScheduleList
} from '../missingConsultationLogNavigation';
import StandardizedApi from '../standardizedApi';
import { ADMIN_ROUTES } from '../../constants/adminRoutes';
import { CONSULTANT_DASHBOARD_ROUTES } from '../../constants/consultantDashboardRoutes';

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

  test('buildScheduleDetailEndpoint — 단건 경로', () => {
    expect(buildScheduleDetailEndpoint(386)).toBe('/api/v1/schedules/386');
  });

  test('normalizeMissingLogScheduleId — schedule- 접두 제거', () => {
    expect(normalizeMissingLogScheduleId('schedule-386')).toBe(386);
    expect(normalizeMissingLogScheduleId(386)).toBe(386);
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

  test('buildConsultantMissingConsultationLogFallbackRoute — incomplete 필터 + date', () => {
    expect(buildConsultantMissingConsultationLogFallbackRoute({
      date: '2026-08-18',
      scheduleId: 99,
      clientId: 7
    })).toBe(
      `${CONSULTANT_DASHBOARD_ROUTES.CONSULTATION_RECORDS}?filter=incomplete&date=2026-08-18&scheduleId=99&clientId=7`
    );
  });

  test('pickMissingLogScheduleFromList — CANCELLED 제외 후 첫 건', () => {
    const picked = pickMissingLogScheduleFromList([
      { id: 1, status: 'CANCELLED' },
      { id: 2, status: 'COMPLETED', consultantId: 3 }
    ]);
    expect(picked.id).toBe(2);
  });

  test('pickMissingLogScheduleFromList — 일지 미작성 필드 있으면 우선 (목록 숨김 아님)', () => {
    const picked = pickMissingLogScheduleFromList([
      { id: 1, status: 'COMPLETED', hasConsultationRecord: true },
      { id: 2, status: 'COMPLETED', hasConsultationRecord: false },
      { id: 3, status: 'CONFIRMED' }
    ]);
    expect(picked.id).toBe(2);
  });

  test('pickMissingLogScheduleFromList — consultationRecordId 없으면 우선', () => {
    const picked = pickMissingLogScheduleFromList([
      { id: 1, status: 'COMPLETED', consultationRecordId: 77 },
      { id: 2, status: 'COMPLETED', consultationRecordId: null },
      { id: 3, status: 'CONFIRMED' }
    ]);
    expect(picked.id).toBe(2);
  });

  test('unwrapScheduleList — data 배열 / 직접 배열', () => {
    expect(unwrapScheduleList([{ id: 1 }])).toEqual([{ id: 1 }]);
    expect(unwrapScheduleList({ data: [{ id: 2 }] })).toEqual([{ id: 2 }]);
    expect(unwrapScheduleList(null)).toEqual([]);
  });

  test('unwrapScheduleDetail — data 래퍼 / 직접 객체', () => {
    expect(unwrapScheduleDetail({ id: 5, sessionSequence: 15 })).toMatchObject({ id: 5 });
    expect(unwrapScheduleDetail({ data: { id: 6, sessionSequence: 2 } })).toMatchObject({ id: 6 });
    expect(unwrapScheduleDetail(null)).toBeNull();
  });

  test('findScheduleInListById — id 매칭', () => {
    expect(findScheduleInListById([
      { id: 1 },
      { id: 386, sessionSequence: 15 }
    ], 386).sessionSequence).toBe(15);
  });

  test('lookupMissingLogIdsForDate — scheduleIdsByDate / missingEntries', () => {
    expect(lookupMissingLogIdsForDate({
      scheduleIdsByDate: { '2026-05-08': 55 }
    }, '2026-05-08')).toEqual({ scheduleId: 55, clientId: null });

    expect(lookupMissingLogIdsForDate({
      scheduleIdsByDate: {
        '2026-05-08': { scheduleId: 55, clientId: 9 }
      }
    }, '2026-05-08')).toEqual({ scheduleId: 55, clientId: 9 });

    expect(lookupMissingLogIdsForDate({
      missingEntries: [{ date: '2026-07-07', scheduleId: 88, clientId: 12 }]
    }, '2026-07-07')).toEqual({ scheduleId: 88, clientId: 12 });
  });

  test('lookupMissingLogIdsForDate — scheduleIdsByDate 가 missingEntries 보다 우선', () => {
    expect(lookupMissingLogIdsForDate({
      scheduleIdsByDate: { '2026-09-01': { scheduleId: 902, clientId: 2 } },
      missingEntries: [
        { date: '2026-09-01', scheduleId: 901, clientId: 1 },
        { date: '2026-09-01', scheduleId: 902, clientId: 2 }
      ]
    }, '2026-09-01')).toEqual({ scheduleId: 902, clientId: 2 });
  });

  test('resolveMissingLogSchedule — scheduleId 있으면 목록 조회로 sessionSequence 채움', async() => {
    StandardizedApi.get.mockResolvedValue([
      { id: 98, status: 'COMPLETED', sessionSequence: 2, clientId: 1 },
      {
        id: 99,
        status: 'COMPLETED',
        sessionSequence: 15,
        consultantId: 3,
        clientId: 7,
        date: '2026-05-08'
      }
    ]);
    const result = await resolveMissingLogSchedule({
      consultantId: 3,
      date: '2026-05-08',
      scheduleId: 99,
      clientId: 7
    });
    expect(StandardizedApi.get).toHaveBeenCalledWith(
      '/api/v1/schedules/consultant/3/date',
      { date: '2026-05-08' }
    );
    expect(result).toMatchObject({
      id: 99,
      consultantId: 3,
      clientId: 7,
      date: '2026-05-08',
      sessionSequence: 15,
      sessionNumber: 15
    });
  });

  test('resolveMissingLogSchedule — 목록에 없으면 단건 조회로 sessionSequence 채움', async() => {
    StandardizedApi.get
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce({
        id: 386,
        sessionSequence: 15,
        consultantId: 22,
        clientId: 10,
        date: '2026-09-01'
      });
    const result = await resolveMissingLogSchedule({
      consultantId: 22,
      date: '2026-09-01',
      scheduleId: 386,
      userId: 22,
      userRole: 'CONSULTANT'
    });
    expect(StandardizedApi.get).toHaveBeenNthCalledWith(
      2,
      '/api/v1/schedules/386',
      { userId: '22', userRole: 'CONSULTANT' }
    );
    expect(result.sessionNumber).toBe(15);
    expect(result.sessionSequence).toBe(15);
  });

  test('resolveMissingLogSchedule — scheduleId 조회 실패 시 null (최소 객체 금지)', async() => {
    StandardizedApi.get.mockResolvedValue([]);
    const result = await resolveMissingLogSchedule({
      consultantId: 3,
      date: '2026-05-08',
      scheduleId: 99
    });
    expect(result).toBeNull();
  });

  test('resolveMissingLogSchedule — API 조회로 스케줄 선택', async() => {
    StandardizedApi.get.mockResolvedValue([
      { id: 10, status: 'CANCELLED' },
      { id: 11, status: 'CONFIRMED', consultantId: 3, clientId: 4, date: '2026-05-08', sessionSequence: 4 }
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
    expect(result.sessionNumber).toBe(4);
  });

  test('resolveMissingLogSchedule — 날짜-only 폴백 시 미작성 스케줄 우선', async() => {
    StandardizedApi.get.mockResolvedValue([
      { id: 901, status: 'COMPLETED', hasConsultationRecord: true, clientId: 1 },
      { id: 902, status: 'COMPLETED', hasConsultationRecord: false, clientId: 2, sessionSequence: 8 }
    ]);
    const result = await resolveMissingLogSchedule({
      consultantId: 3,
      date: '2026-09-01'
    });
    expect(result.id).toBe(902);
    expect(result.clientId).toBe(2);
    expect(result.sessionNumber).toBe(8);
  });

  test('resolveMissingLogSchedule — API 실패 시 null 삼키지 않고 throw (호출부 fallback)', async() => {
    StandardizedApi.get.mockRejectedValue(new Error('network'));
    await expect(resolveMissingLogSchedule({
      consultantId: 3,
      date: '2026-09-01'
    })).rejects.toThrow('network');
  });
});
