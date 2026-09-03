/**
 * consultantScheduleCardUi — Expo 포팅 단위 테스트
 *
 * @author MindGarden
 * @since 2026-09-03
 */

import { getConsultantScheduleListRowActions } from '../consultantScheduleCardUi';

describe('getConsultantScheduleListRowActions', () => {
  test('IN_PROGRESS → 상담 완료', () => {
    const result = getConsultantScheduleListRowActions({
      status: 'IN_PROGRESS',
      date: '2099-01-01',
      startTime: '10:00',
      endTime: '11:00'
    });
    expect(result.primaryActionLabel).toBe('상담 완료');
    expect(result.primaryActionKind).toBe('complete');
  });

  test('BOOKED · 종료 전 → 상담 시작', () => {
    const result = getConsultantScheduleListRowActions({
      status: 'BOOKED',
      date: '2099-01-01',
      startTime: '10:00',
      endTime: '11:00'
    });
    expect(result.primaryActionLabel).toBe('상담 시작');
    expect(result.primaryActionKind).toBe('start');
  });

  test('CONFIRMED · 종료 전 → 상담 시작', () => {
    const result = getConsultantScheduleListRowActions({
      status: 'CONFIRMED',
      date: '2099-01-01',
      startTime: '10:00',
      endTime: '11:00'
    });
    expect(result.primaryActionLabel).toBe('상담 시작');
  });

  test('과거 종료 슬롯 BOOKED → 시작 숨김', () => {
    const result = getConsultantScheduleListRowActions({
      status: 'BOOKED',
      date: '2000-01-01',
      startTime: '10:00',
      endTime: '11:00'
    });
    expect(result.primaryActionLabel).toBeUndefined();
    expect(result.primaryActionKind).toBeUndefined();
  });

  test('COMPLETED → 액션 없음', () => {
    const result = getConsultantScheduleListRowActions({
      status: 'COMPLETED',
      date: '2099-01-01',
      startTime: '10:00',
      endTime: '11:00'
    });
    expect(result.primaryActionLabel).toBeUndefined();
  });
});
