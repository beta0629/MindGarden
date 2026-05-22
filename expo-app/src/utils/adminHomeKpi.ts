/**
 * 어드민·스태프 홈 KPI — 스케줄 미리보기·요약 문구
 *
 * @author MindGarden
 * @since 2026-05-22
 */
import type { Schedule } from '@/api/hooks/useSchedules';
import { ADMIN_MOBILE_HOME_COPY } from '@/constants/adminHomeCopy';
import { toDisplayString } from '@/utils/safeDisplay';

export const ADMIN_HOME_SCHEDULE_PREVIEW_LIMIT = 3;

/**
 * 홈 오늘 일정 미리보기 — 상위 N건
 */
export function sliceTodaySchedulePreview(
  schedules: Schedule[] | undefined | null,
  limit = ADMIN_HOME_SCHEDULE_PREVIEW_LIMIT,
): Schedule[] {
  return (schedules ?? []).slice(0, limit);
}

/**
 * ScheduleCard clientName — 내담자 · 상담사 병기
 */
export function formatAdminScheduleParticipantLabel(
  clientName: string | null | undefined,
  consultantName: string | null | undefined,
): string {
  return `${toDisplayString(clientName, '내담자')} · ${toDisplayString(consultantName, '상담사')}`;
}

/**
 * ScheduleCard time — 시작–종료
 */
export function formatAdminScheduleTimeRange(
  startTime: string | null | undefined,
  endTime: string | null | undefined,
): string {
  return `${toDisplayString(startTime, '—')} - ${toDisplayString(endTime, '—')}`;
}

function formatSummaryTodayPart(todayScheduleCount: number): string {
  return ADMIN_MOBILE_HOME_COPY.SUMMARY_TODAY_SCHEDULES.replace(
    '{count}',
    String(Math.max(0, todayScheduleCount)),
  );
}

function formatSummaryPendingPart(pendingOpsCount: number): string {
  return ADMIN_MOBILE_HOME_COPY.SUMMARY_PENDING_OPS.replace(
    '{count}',
    String(Math.max(0, pendingOpsCount)),
  );
}

/**
 * 인사 하단 운영 요약 — P0: 오늘 일정 + 처리 대기(0 허용)
 */
export function buildAdminHomeSummaryLine(
  todayScheduleCount: number,
  pendingOpsCount = 0,
): string {
  const todayPart = formatSummaryTodayPart(todayScheduleCount);
  const pendingPart = formatSummaryPendingPart(pendingOpsCount);
  return `${todayPart}${ADMIN_MOBILE_HOME_COPY.SUMMARY_CONNECTOR}${pendingPart}`;
}

/**
 * 오늘 일정 섹션 헤더 — "오늘 일정 (N건)"
 */
export function formatAdminTodayScheduleSectionTitle(totalCount: number): string {
  return `${ADMIN_MOBILE_HOME_COPY.TODAY_SCHEDULE_PREVIEW_TITLE} (${Math.max(0, totalCount)}${ADMIN_MOBILE_HOME_COPY.UNIT_COUNT})`;
}
