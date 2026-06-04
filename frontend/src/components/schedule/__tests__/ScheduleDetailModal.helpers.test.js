/**
 * ScheduleDetailModal — 잔여/총 회기 표시 + 상담일지 deep link 회귀 가드.
 *
 * 단위 테스트 매트릭스:
 *  - resolveModalSessionInfo:
 *    · sessionSequence 가 있으면 total - sequence 우선
 *    · sessionSequence 없을 때 매핑 remainingSessions fallback
 *    · totalSessions 가 null/0/1 이면 표시 안 함
 *    · null/0 케이스 정상 처리 (회귀 가드)
 *  - shouldShowConsultationLogLink:
 *    · 과거 + CONFIRMED → true
 *    · 당일 + COMPLETED → true
 *    · 미래 일정 → false
 *    · TENTATIVE_PENDING_PAYMENT → false
 *    · CANCELLED → false
 *    · 휴가 이벤트 → false
 *    · sessionDate 없음 → false
 *
 * @author MindGarden
 * @since 2026-06-04
 */

import {
  resolveModalSessionInfo,
  shouldShowConsultationLogLink,
  toIsoDateString,
  CONSULTATION_LOG_LINK_VISIBLE_STATUSES
} from '../ScheduleDetailModal';

describe('resolveModalSessionInfo', () => {
  test('sessionSequence 가 있으면 total - sequence 가 우선 (캘린더 라벨과 동일 SSOT)', () => {
    const info = resolveModalSessionInfo({
      totalSessions: 20,
      remainingSessions: 8,
      sessionSequence: 5
    });
    expect(info).toEqual({ remaining: 15, total: 20 });
  });

  test('sessionSequence 가 없을 때 매핑 remainingSessions fallback', () => {
    const info = resolveModalSessionInfo({
      totalSessions: 20,
      remainingSessions: 15,
      sessionSequence: null
    });
    expect(info).toEqual({ remaining: 15, total: 20 });
  });

  test('totalSessions 가 1 이하면 단회기로 간주하여 null 반환 (라벨 미노출)', () => {
    expect(resolveModalSessionInfo({ totalSessions: 1, remainingSessions: 0 }))
      .toEqual({ remaining: null, total: null });
    expect(resolveModalSessionInfo({ totalSessions: 0, remainingSessions: 0 }))
      .toEqual({ remaining: null, total: null });
  });

  test('schedule null/undefined 입력 시 null 반환', () => {
    expect(resolveModalSessionInfo(null)).toEqual({ remaining: null, total: null });
    expect(resolveModalSessionInfo(undefined)).toEqual({ remaining: null, total: null });
  });

  test('remaining 0 회 (모두 사용) 도 정상 표시 가능', () => {
    const info = resolveModalSessionInfo({
      totalSessions: 10,
      sessionSequence: 10
    });
    expect(info).toEqual({ remaining: 0, total: 10 });
  });

  test('비정상 음수·문자열 등은 null 처리', () => {
    expect(resolveModalSessionInfo({ totalSessions: -1, remainingSessions: 5 }))
      .toEqual({ remaining: null, total: null });
    expect(resolveModalSessionInfo({ totalSessions: 'abc' }))
      .toEqual({ remaining: null, total: null });
  });

  test('sessionSequence 가 total 을 초과해도 0 으로 clamp', () => {
    const info = resolveModalSessionInfo({
      totalSessions: 10,
      sessionSequence: 99
    });
    expect(info).toEqual({ remaining: 0, total: 10 });
  });
});

describe('toIsoDateString', () => {
  test('Date 객체 → yyyy-MM-dd', () => {
    expect(toIsoDateString(new Date(2026, 5, 4))).toBe('2026-06-04');
  });

  test('yyyy-MM-dd 문자열 → 그대로', () => {
    expect(toIsoDateString('2026-06-04')).toBe('2026-06-04');
  });

  test('1자리 월/일도 정규화', () => {
    expect(toIsoDateString('2026-6-4')).toBe('2026-06-04');
  });

  test('빈값/잘못된 값 → null', () => {
    expect(toIsoDateString(null)).toBeNull();
    expect(toIsoDateString(undefined)).toBeNull();
    expect(toIsoDateString('')).toBeNull();
    expect(toIsoDateString('not-a-date')).toBeNull();
  });
});

describe('shouldShowConsultationLogLink', () => {
  const today = new Date(2026, 5, 4); // 2026-06-04

  test('과거 + CONFIRMED → true', () => {
    const result = shouldShowConsultationLogLink(
      { sessionDate: '2026-06-01', id: 1 },
      'CONFIRMED',
      false,
      today
    );
    expect(result).toBe(true);
  });

  test('당일 + COMPLETED → true', () => {
    const result = shouldShowConsultationLogLink(
      { sessionDate: '2026-06-04', id: 1 },
      'COMPLETED',
      false,
      today
    );
    expect(result).toBe(true);
  });

  test('과거 + BOOKED → true', () => {
    const result = shouldShowConsultationLogLink(
      { sessionDate: '2025-12-25', id: 1 },
      'BOOKED',
      false,
      today
    );
    expect(result).toBe(true);
  });

  test('미래 일정 → false', () => {
    const result = shouldShowConsultationLogLink(
      { sessionDate: '2026-06-05', id: 1 },
      'CONFIRMED',
      false,
      today
    );
    expect(result).toBe(false);
  });

  test('TENTATIVE_PENDING_PAYMENT → false (가예약 제외)', () => {
    const result = shouldShowConsultationLogLink(
      { sessionDate: '2026-06-01', id: 1 },
      'TENTATIVE_PENDING_PAYMENT',
      false,
      today
    );
    expect(result).toBe(false);
  });

  test('CANCELLED → false (취소 일정 제외)', () => {
    const result = shouldShowConsultationLogLink(
      { sessionDate: '2026-06-01', id: 1 },
      'CANCELLED',
      false,
      today
    );
    expect(result).toBe(false);
  });

  test('휴가 이벤트 → false', () => {
    const result = shouldShowConsultationLogLink(
      { sessionDate: '2026-06-01', id: 1 },
      'CONFIRMED',
      true,
      today
    );
    expect(result).toBe(false);
  });

  test('sessionDate 없음 → false', () => {
    const result = shouldShowConsultationLogLink(
      { id: 1 },
      'CONFIRMED',
      false,
      today
    );
    expect(result).toBe(false);
  });

  test('schedule null → false', () => {
    expect(shouldShowConsultationLogLink(null, 'CONFIRMED', false, today)).toBe(false);
  });
});

describe('CONSULTATION_LOG_LINK_VISIBLE_STATUSES', () => {
  test('BOOKED·CONFIRMED·COMPLETED 만 포함 (TENTATIVE/CANCELLED 제외)', () => {
    expect(CONSULTATION_LOG_LINK_VISIBLE_STATUSES).toContain('BOOKED');
    expect(CONSULTATION_LOG_LINK_VISIBLE_STATUSES).toContain('CONFIRMED');
    expect(CONSULTATION_LOG_LINK_VISIBLE_STATUSES).toContain('COMPLETED');
    expect(CONSULTATION_LOG_LINK_VISIBLE_STATUSES).not.toContain('TENTATIVE_PENDING_PAYMENT');
    expect(CONSULTATION_LOG_LINK_VISIBLE_STATUSES).not.toContain('CANCELLED');
    expect(CONSULTATION_LOG_LINK_VISIBLE_STATUSES).not.toContain('VACATION');
  });
});
