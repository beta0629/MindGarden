/**
 * 상담사 오늘 일정 행 — 진행 중(「현재」+시각) / 이후 일정(시각) · 내담자 · 기관연계 배지.
 * 금액·결제 정보는 표시하지 않는다.
 *
 * @author MindGarden
 * @since 2026-11-06
 */
import type { Schedule } from '@/api/hooks/useSchedules';
import { CONSULTANT_COVER_COPY } from '@/constants/consultantHomeCopy';
import { toDisplayString } from '@/utils/safeDisplay';
import {
  buildCounselorRowDetail,
  formatClock,
  resolveDurationMinutes,
  resolveInstitutionBadgeLabel,
  resolveNameInitial,
} from '@/utils/coverChapterViewModel';
import { ScheduleListRow } from './ScheduleListSection';

export interface CounselorScheduleListRowProps {
  readonly schedule: Schedule;
  readonly inProgress?: boolean;
  readonly onPress: () => void;
}

export function CounselorScheduleListRow({
  schedule,
  inProgress = false,
  onPress,
}: CounselorScheduleListRowProps) {
  const name = toDisplayString(schedule.clientName, '').trim();
  const minutes = resolveDurationMinutes(schedule.startTime, schedule.endTime);
  const detail = inProgress
    ? [
        minutes != null ? CONSULTANT_COVER_COPY.durationLabel(minutes) : '',
        buildCounselorRowDetail(schedule),
      ]
        .filter(Boolean)
        .join(' · ')
    : buildCounselorRowDetail(schedule);
  const initial = resolveNameInitial(name);

  return (
    <ScheduleListRow
      leadPrimary={
        inProgress ? CONSULTANT_COVER_COPY.IN_PROGRESS_LEAD : formatClock(schedule.startTime)
      }
      leadSecondary={inProgress ? formatClock(schedule.startTime) : undefined}
      title={name ? CONSULTANT_COVER_COPY.clientLabel(name) : buildCounselorRowDetail(schedule)}
      detail={name ? detail : undefined}
      badgeLabel={resolveInstitutionBadgeLabel(schedule)}
      trailing={!inProgress && initial ? { kind: 'initial', initial } : { kind: 'chevron' }}
      onPress={onPress}
    />
  );
}
