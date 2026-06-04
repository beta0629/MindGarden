/**
 * ScheduleDetailModal — 사용/총 회기 표시 + 과거 회기 합산 + 상담일지 deep link 회귀 가드.
 *
 * 단위 테스트 매트릭스:
 *  - resolveModalSessionInfo:
 *    · 백엔드 합산값(combinedUsedSessions/combinedTotalSessions)이 있으면 SSOT 로 우선
 *    · sessionSequence 가 있으면 합산 사용 = past + sequence
 *    · sessionSequence 없을 때 매핑 (total - remaining) fallback + past 합산
 *    · pastSessionCount null → 0 으로 안전 처리 (신규 내담자 정책)
 *    · pastSessionCount 5, total 20, sequence 6 → used=11, total=25
 *    · totalSessions 가 null/0/1 이면 표시 안 함 (단회기)
 *    · null/undefined 케이스 정상 처리 (회귀 가드)
 *  - shouldShowConsultationLogLink:
 *    · 과거/당일 + 유효 상태 → true
 *    · 미래·TENTATIVE_PENDING_PAYMENT·CANCELLED·휴가 → false
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
  test('백엔드 combinedUsedSessions/combinedTotalSessions 가 있으면 그대로 SSOT', () => {
    const info = resolveModalSessionInfo({
      totalSessions: 20,
      remainingSessions: 8,
      sessionSequence: 12,
      pastSessionCount: 5,
      combinedUsedSessions: 17,
      combinedTotalSessions: 25
    });
    expect(info).toEqual({ used: 17, total: 25 });
  });

  test('백엔드 합산값 미존재 + sessionSequence 가 있으면 past + sequence (캘린더 라벨과 동일 SSOT)', () => {
    const info = resolveModalSessionInfo({
      totalSessions: 20,
      remainingSessions: 8,
      sessionSequence: 5,
      pastSessionCount: 3
    });
    expect(info).toEqual({ used: 8, total: 23 });
  });

  test('sessionSequence 가 없을 때 매핑 (total - remaining) fallback + past 합산', () => {
    const info = resolveModalSessionInfo({
      totalSessions: 20,
      remainingSessions: 15,
      sessionSequence: null,
      pastSessionCount: 4
    });
    expect(info).toEqual({ used: 9, total: 24 });
  });

  test('pastSessionCount null → 0 으로 안전 처리 (신규 내담자 정책)', () => {
    const info = resolveModalSessionInfo({
      totalSessions: 20,
      sessionSequence: 5,
      pastSessionCount: null
    });
    expect(info).toEqual({ used: 5, total: 20 });
  });

  test('pastSessionCount 0 도 정상 처리', () => {
    const info = resolveModalSessionInfo({
      totalSessions: 10,
      sessionSequence: 3,
      pastSessionCount: 0
    });
    expect(info).toEqual({ used: 3, total: 10 });
  });

  test('pastSessionCount 5, total 20, sequence 6 → used=11, total=25 (사용자 시나리오)', () => {
    const info = resolveModalSessionInfo({
      totalSessions: 20,
      sessionSequence: 6,
      pastSessionCount: 5
    });
    expect(info).toEqual({ used: 11, total: 25 });
  });

  test('단회기(total=1) 도 표시 (사용자 요구 "누적과 잔여 둘 다 노출")', () => {
    expect(resolveModalSessionInfo({ totalSessions: 1, remainingSessions: 0, pastSessionCount: 5 }))
      .toEqual({ used: 6, total: 6 });
  });

  test('totalSessions 가 0 이하 또는 null 이면 라벨 미노출', () => {
    expect(resolveModalSessionInfo({ totalSessions: 0, remainingSessions: 0 }))
      .toEqual({ used: null, total: null });
    expect(resolveModalSessionInfo({ totalSessions: null, pastSessionCount: 5 }))
      .toEqual({ used: null, total: null });
  });

  test('schedule null/undefined 입력 시 null 반환', () => {
    expect(resolveModalSessionInfo(null)).toEqual({ used: null, total: null });
    expect(resolveModalSessionInfo(undefined)).toEqual({ used: null, total: null });
  });

  test('used 가 total 을 초과해도 백엔드 합산값 보호: clamp(used, 0, total)', () => {
    const info = resolveModalSessionInfo({
      combinedUsedSessions: 999,
      combinedTotalSessions: 25
    });
    expect(info).toEqual({ used: 25, total: 25 });
  });

  test('비정상 음수·문자열 등은 null 처리', () => {
    expect(resolveModalSessionInfo({ totalSessions: -1, remainingSessions: 5 }))
      .toEqual({ used: null, total: null });
    expect(resolveModalSessionInfo({ totalSessions: 'abc' }))
      .toEqual({ used: null, total: null });
  });

  test('sessionSequence 가 total 을 초과해도 total 로 clamp + past 합산', () => {
    const info = resolveModalSessionInfo({
      totalSessions: 10,
      sessionSequence: 99,
      pastSessionCount: 2
    });
    expect(info).toEqual({ used: 12, total: 12 });
  });

  test('remainingSessions 도 sequence 도 없으면 used=past+0 (안전 fallback)', () => {
    const info = resolveModalSessionInfo({
      totalSessions: 20,
      pastSessionCount: 4
    });
    expect(info).toEqual({ used: 4, total: 24 });
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
