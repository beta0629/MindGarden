/**
 * 내담자 "내 상담" 화면 — 탭 매칭/정렬 유틸리티.
 *
 * BE(`ScheduleServiceImpl.findSchedulesWithNamesByUserRolePaged`) 가 CLIENT 분기에서
 * `date·startTime DESC` 로 결정적 페이징을 보장하지만, FE 에서도 한 번 더 정렬해
 * OTA·캐시 환경에서 "완료 = 최근 순", "예정 = 가까운 순" UX 를 일관되게 유지한다.
 *
 * @author MindGarden
 * @since 2026-06-13
 */
import type { Schedule } from '@/api/hooks/useSchedules';

export type ClientSessionsTab = 'SCHEDULED' | 'COMPLETED';

/** 내 상담 화면 탭 — `Schedule` 카드 상태 기준 */
export function matchesClientSessionsTab(
  schedule: Schedule,
  tab: ClientSessionsTab,
): boolean {
  if (tab === 'COMPLETED') {
    return schedule.status === 'COMPLETED';
  }
  return schedule.status !== 'COMPLETED' && schedule.status !== 'CANCELLED';
}

function clientSessionSortKey(s: Schedule): string {
  return `${s.date ?? ''}T${(s.startTime ?? '00:00').slice(0, 5)}:00`;
}

/**
 * 탭별 정렬
 * - 완료(COMPLETED): 최근 상담이 위로 (DESC)
 * - 예정(SCHEDULED/BOOKED 등): 가까운 일정이 위로 (ASC)
 */
export function sortClientSessions(
  schedules: Schedule[],
  tab: ClientSessionsTab,
): Schedule[] {
  const desc = tab === 'COMPLETED';
  const sorted = [...schedules];
  sorted.sort((a, b) => {
    const keyA = clientSessionSortKey(a);
    const keyB = clientSessionSortKey(b);
    return desc ? keyB.localeCompare(keyA) : keyA.localeCompare(keyB);
  });
  return sorted;
}
