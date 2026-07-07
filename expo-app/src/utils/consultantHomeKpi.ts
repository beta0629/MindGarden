/**
 * 상담사 홈 KPI selector·요약 문구 헬퍼
 *
 * @author MindGarden
 * @since 2026-05-22
 */
import { CONSULTANT_HOME_COPY } from '@/constants/consultantHomeCopy';

export type ConsultantHomeKpiId = 'today_sessions' | 'unread_messages' | 'new_clients';

export interface ConsultantHomeKpiItem {
  id: ConsultantHomeKpiId;
  label: string;
  value: number;
  unit: string;
}

export interface ConsultantHomeKpiInput {
  todayCount?: number | null;
  scheduleLength?: number | null;
  unreadMessageCount?: number | null;
  newClientsCount?: number | null;
}

function toNonNegativeInt(value: number | null | undefined): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return 0;
  }
  return Math.max(0, Math.trunc(value));
}

/**
 * 대시보드 `todayCount` 우선, 없으면 스케줄 목록 길이로 폴백한다.
 */
export function resolveTodayCount(
  todayCount: number | null | undefined,
  scheduleLength: number | null | undefined,
): number {
  const fromCount = toNonNegativeInt(todayCount);
  if (todayCount != null && Number.isFinite(todayCount)) {
    return fromCount;
  }
  return toNonNegativeInt(scheduleLength);
}

/**
 * 인사 블록 하단 오늘 상담 요약 문구
 */
export function buildConsultantTodaySummary(count: number): string {
  const safe = toNonNegativeInt(count);
  if (safe === 0) {
    return CONSULTANT_HOME_COPY.TODAY_SUMMARY_ZERO;
  }
  return `오늘 ${safe}건의 상담이 예정되어 있습니다.`;
}

/**
 * P0~P1 KPI 스트립 — 오늘 상담·안읽은 메시지·신규 내담
 */
export function selectConsultantHomeKpiItems(input: ConsultantHomeKpiInput): ConsultantHomeKpiItem[] {
  const todayCount = resolveTodayCount(input.todayCount, input.scheduleLength);
  const unreadMessageCount = toNonNegativeInt(input.unreadMessageCount);
  const newClientsCount = toNonNegativeInt(input.newClientsCount);

  return [
    {
      id: 'today_sessions',
      label: CONSULTANT_HOME_COPY.KPI_TODAY_SESSIONS,
      value: todayCount,
      unit: CONSULTANT_HOME_COPY.UNIT_SESSION,
    },
    {
      id: 'unread_messages',
      label: CONSULTANT_HOME_COPY.KPI_UNREAD_MESSAGES,
      value: unreadMessageCount,
      unit: CONSULTANT_HOME_COPY.UNIT_MESSAGE,
    },
    {
      id: 'new_clients',
      label: CONSULTANT_HOME_COPY.KPI_NEW_CLIENTS,
      value: newClientsCount,
      unit: CONSULTANT_HOME_COPY.UNIT_CLIENT,
    },
  ];
}
