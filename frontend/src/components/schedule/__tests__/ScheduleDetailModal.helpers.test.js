/**
 * ScheduleDetailModal — 회기/누적 라벨 표시 + 상담일지 deep link 회귀 가드.
 *
 * 사용자 정의 (2026-06-05):
 *  - 회기 라벨 = 현재 매핑의 raw 사용/총. 과거 회기수 합산 금지.
 *    · sessionSequence 있으면 used = sequence, total = totalSessions
 *    · sessionSequence 없으면 used = total - remaining
 *    · 매핑 NULL → 라벨 미노출
 *  - 누적 라벨은 별도 resolveModalLifetimeSessionInfo (past + sessionSequence) 가 담당.
 *
 * @author MindGarden
 * @since 2026-06-05
 */

import {
  resolveModalSessionInfo,
  resolveModalLifetimeSessionInfo,
  shouldShowConsultationLogLink,
  shouldShowRescheduleAction,
  toIsoDateString,
  CONSULTATION_LOG_LINK_VISIBLE_STATUSES,
  RESCHEDULE_ACTION_ELIGIBLE_STATUSES
} from '../ScheduleDetailModal';

describe('resolveModalSessionInfo (회기 라벨 = 매핑 raw, past 합산 금지)', () => {
  test('sessionSequence 가 있으면 used=sequence, total=totalSessions (past 무관)', () => {
    const info = resolveModalSessionInfo({
      totalSessions: 10,
      remainingSessions: 9,
      sessionSequence: 1,
      pastSessionCount: 10
    });
    expect(info).toEqual({ used: 1, total: 10 });
  });

  test('백엔드 combinedUsedSessions/combinedTotalSessions 가 있어도 무시 (raw 매핑 SSOT)', () => {
    const info = resolveModalSessionInfo({
      totalSessions: 20,
      remainingSessions: 8,
      sessionSequence: 12,
      pastSessionCount: 5,
      combinedUsedSessions: 17,
      combinedTotalSessions: 25
    });
    expect(info).toEqual({ used: 12, total: 20 });
  });

  test('sessionSequence 가 없을 때 매핑 (total - remaining) fallback', () => {
    const info = resolveModalSessionInfo({
      totalSessions: 20,
      remainingSessions: 15,
      sessionSequence: null,
      pastSessionCount: 4
    });
    expect(info).toEqual({ used: 5, total: 20 });
  });

  test('pastSessionCount null → 무관 (raw 매핑만)', () => {
    const info = resolveModalSessionInfo({
      totalSessions: 20,
      sessionSequence: 5,
      pastSessionCount: null
    });
    expect(info).toEqual({ used: 5, total: 20 });
  });

  test('단회기(total=1) 도 raw 표시', () => {
    expect(resolveModalSessionInfo({ totalSessions: 1, remainingSessions: 0, sessionSequence: 1, pastSessionCount: 5 }))
      .toEqual({ used: 1, total: 1 });
  });

  test('totalSessions 가 0 이하 또는 null 이면 라벨 미노출 (매핑 없음)', () => {
    expect(resolveModalSessionInfo({ totalSessions: 0, remainingSessions: 0 }))
      .toEqual({ used: null, total: null });
    expect(resolveModalSessionInfo({ totalSessions: null, pastSessionCount: 5 }))
      .toEqual({ used: null, total: null });
  });

  test('schedule null/undefined 입력 시 null 반환', () => {
    expect(resolveModalSessionInfo(null)).toEqual({ used: null, total: null });
    expect(resolveModalSessionInfo(undefined)).toEqual({ used: null, total: null });
  });

  test('비정상 음수·문자열 등은 null 처리', () => {
    expect(resolveModalSessionInfo({ totalSessions: -1, remainingSessions: 5 }))
      .toEqual({ used: null, total: null });
    expect(resolveModalSessionInfo({ totalSessions: 'abc' }))
      .toEqual({ used: null, total: null });
  });

  test('sessionSequence 가 total 을 초과해도 total 로 clamp (past 무관)', () => {
    const info = resolveModalSessionInfo({
      totalSessions: 10,
      sessionSequence: 99,
      pastSessionCount: 2
    });
    expect(info).toEqual({ used: 10, total: 10 });
  });

  test('remainingSessions 도 sequence 도 없으면 라벨 미노출', () => {
    const info = resolveModalSessionInfo({
      totalSessions: 20,
      pastSessionCount: 4
    });
    expect(info).toEqual({ used: null, total: null });
  });
});

describe('resolveModalLifetimeSessionInfo (누적 라벨 = past + sessionSequence)', () => {
  test('사용자 시나리오 (5/29 일정): past=10, sessionSequence=1 → 과거 10 + 누적 1 = 총 11', () => {
    const info = resolveModalLifetimeSessionInfo({
      pastSessionCount: 10,
      clientLifetimeSessionCount: 11
    });
    expect(info).toEqual({ past: 10, current: 1, total: 11 });
  });

  test('past=0, sessionSequence=3 → 과거 0 + 누적 3 = 총 3', () => {
    const info = resolveModalLifetimeSessionInfo({
      pastSessionCount: 0,
      clientLifetimeSessionCount: 3
    });
    expect(info).toEqual({ past: 0, current: 3, total: 3 });
  });

  test('clientLifetimeSessionCount 없고 past 만 있으면 누적=0, total=past', () => {
    const info = resolveModalLifetimeSessionInfo({
      pastSessionCount: 5,
      clientLifetimeSessionCount: null
    });
    expect(info).toEqual({ past: 5, current: 0, total: 5 });
  });

  test('past=null + lifetime=null → 라벨 미노출 (total=null)', () => {
    const info = resolveModalLifetimeSessionInfo({
      pastSessionCount: null,
      clientLifetimeSessionCount: null
    });
    expect(info).toEqual({ past: 0, current: 0, total: null });
  });

  test('schedule null/undefined → 라벨 미노출', () => {
    expect(resolveModalLifetimeSessionInfo(null)).toEqual({ past: 0, current: 0, total: null });
    expect(resolveModalLifetimeSessionInfo(undefined)).toEqual({ past: 0, current: 0, total: null });
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

describe('shouldShowConsultationLogLink (COMPLETED 단일 상태 가드)', () => {
  const today = new Date(2026, 5, 4); // 2026-06-04

  test('당일 + CONFIRMED → false (진행 중은 "작성" 버튼만 노출)', () => {
    const result = shouldShowConsultationLogLink(
      { sessionDate: '2026-06-04', id: 1 },
      'CONFIRMED',
      false,
      today
    );
    expect(result).toBe(false);
  });

  test('당일 + BOOKED → false (회기 차감 전, "작성" 버튼만 노출)', () => {
    const result = shouldShowConsultationLogLink(
      { sessionDate: '2026-06-04', id: 1 },
      'BOOKED',
      false,
      today
    );
    expect(result).toBe(false);
  });

  test('과거(어제) + CONFIRMED → false', () => {
    const result = shouldShowConsultationLogLink(
      { sessionDate: '2026-06-03', id: 1 },
      'CONFIRMED',
      false,
      today
    );
    expect(result).toBe(false);
  });

  test('과거(어제) + BOOKED → false', () => {
    const result = shouldShowConsultationLogLink(
      { sessionDate: '2026-06-03', id: 1 },
      'BOOKED',
      false,
      today
    );
    expect(result).toBe(false);
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

  test('과거(어제) + COMPLETED → true', () => {
    const result = shouldShowConsultationLogLink(
      { sessionDate: '2026-06-03', id: 1 },
      'COMPLETED',
      false,
      today
    );
    expect(result).toBe(true);
  });

  test('미래(내일) + COMPLETED → false (날짜 가드)', () => {
    const result = shouldShowConsultationLogLink(
      { sessionDate: '2026-06-05', id: 1 },
      'COMPLETED',
      false,
      today
    );
    expect(result).toBe(false);
  });

  test('미래(내일) + CONFIRMED → false (운영 신고 핵심 케이스)', () => {
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

  test('당일 + COMPLETED + isVacation=true → false (휴가 가드 유지)', () => {
    const result = shouldShowConsultationLogLink(
      { sessionDate: '2026-06-04', id: 1 },
      'COMPLETED',
      true,
      today
    );
    expect(result).toBe(false);
  });

  test('휴가 이벤트(상태 무관) → false', () => {
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
      'COMPLETED',
      false,
      today
    );
    expect(result).toBe(false);
  });

  test('schedule null → false', () => {
    expect(shouldShowConsultationLogLink(null, 'COMPLETED', false, today)).toBe(false);
  });
});

describe('CONSULTATION_LOG_LINK_VISIBLE_STATUSES (COMPLETED 단일)', () => {
  test('COMPLETED 만 포함 (BOOKED·CONFIRMED·TENTATIVE·CANCELLED 모두 제외)', () => {
    expect(CONSULTATION_LOG_LINK_VISIBLE_STATUSES).toContain('COMPLETED');
    expect(CONSULTATION_LOG_LINK_VISIBLE_STATUSES).not.toContain('BOOKED');
    expect(CONSULTATION_LOG_LINK_VISIBLE_STATUSES).not.toContain('CONFIRMED');
    expect(CONSULTATION_LOG_LINK_VISIBLE_STATUSES).not.toContain('TENTATIVE_PENDING_PAYMENT');
    expect(CONSULTATION_LOG_LINK_VISIBLE_STATUSES).not.toContain('CANCELLED');
    expect(CONSULTATION_LOG_LINK_VISIBLE_STATUSES).not.toContain('VACATION');
  });

  test('상수 길이는 1 (COMPLETED 단일 SSOT)', () => {
    expect(CONSULTATION_LOG_LINK_VISIBLE_STATUSES).toHaveLength(1);
  });
});

describe('shouldShowRescheduleAction (예약 변경 버튼 노출)', () => {
  test('CONFIRMED + ADMIN → true (운영 신고 핵심 케이스)', () => {
    expect(shouldShowRescheduleAction('CONFIRMED', true, false, false)).toBe(true);
  });

  test('BOOKED + ADMIN → true', () => {
    expect(shouldShowRescheduleAction('BOOKED', true, false, false)).toBe(true);
  });

  test('TENTATIVE_PENDING_PAYMENT + ADMIN → true', () => {
    expect(shouldShowRescheduleAction('TENTATIVE_PENDING_PAYMENT', true, false, false)).toBe(true);
  });

  test('CONFIRMED + 비관리자 → false (상담사 status-only PUT 정책과 정합)', () => {
    expect(shouldShowRescheduleAction('CONFIRMED', false, false, false)).toBe(false);
  });

  test('COMPLETED → false', () => {
    expect(shouldShowRescheduleAction('COMPLETED', true, false, false)).toBe(false);
  });

  test('CANCELLED → false', () => {
    expect(shouldShowRescheduleAction('CANCELLED', true, false, false)).toBe(false);
  });

  test('내담자 포털 → false', () => {
    expect(shouldShowRescheduleAction('CONFIRMED', true, false, true)).toBe(false);
  });

  test('휴가 이벤트 → false', () => {
    expect(shouldShowRescheduleAction('CONFIRMED', true, true, false)).toBe(false);
  });
});

describe('RESCHEDULE_ACTION_ELIGIBLE_STATUSES', () => {
  test('BOOKED·가예약·CONFIRMED 포함, COMPLETED·CANCELLED 제외', () => {
    expect(RESCHEDULE_ACTION_ELIGIBLE_STATUSES).toContain('BOOKED');
    expect(RESCHEDULE_ACTION_ELIGIBLE_STATUSES).toContain('TENTATIVE_PENDING_PAYMENT');
    expect(RESCHEDULE_ACTION_ELIGIBLE_STATUSES).toContain('CONFIRMED');
    expect(RESCHEDULE_ACTION_ELIGIBLE_STATUSES).not.toContain('COMPLETED');
    expect(RESCHEDULE_ACTION_ELIGIBLE_STATUSES).not.toContain('CANCELLED');
  });
});
