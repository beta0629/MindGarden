/**
 * 내담자 일정 행 — 커버 홈·일정 챕터 공용 (예정/지난, 기관연계 배지, 상담사 이니셜).
 *
 * @author MindGarden
 * @since 2026-11-06
 */
import type { Schedule } from '@/api/hooks/useSchedules';
import {
  buildPastRowDetail,
  buildSessionTitle,
  buildUpcomingRowDetail,
  formatListDateParts,
  resolveInstitutionBadgeLabel,
  resolveNameInitial,
} from '@/utils/coverChapterViewModel';
import { ScheduleListRow } from './ScheduleListSection';

export interface ClientScheduleListRowProps {
  readonly schedule: Schedule;
  readonly past?: boolean;
  /** true 면 우측에 상담사 이니셜, 아니면 셰브론 */
  readonly showInitial?: boolean;
  readonly onPress: () => void;
}

export function ClientScheduleListRow({
  schedule,
  past = false,
  showInitial = false,
  onPress,
}: ClientScheduleListRowProps) {
  const date = formatListDateParts(schedule.date);
  const initial = resolveNameInitial(schedule.consultantName);
  return (
    <ScheduleListRow
      leadPrimary={date.primary}
      leadSecondary={date.secondary}
      leadMuted={past}
      title={buildSessionTitle(schedule)}
      detail={past ? buildPastRowDetail(schedule) : buildUpcomingRowDetail(schedule)}
      badgeLabel={resolveInstitutionBadgeLabel(schedule)}
      trailing={showInitial && initial ? { kind: 'initial', initial } : { kind: 'chevron' }}
      onPress={onPress}
    />
  );
}
