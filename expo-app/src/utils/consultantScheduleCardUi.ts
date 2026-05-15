/**
 * 상담사 스케줄 카드·목록의 표시 상태·허용 액션 SSOT (홈·스케줄 탭·상세 공통).
 *
 * @author MindGarden
 * @since 2026-05-15
 * @see docs/design-system/v2/EXPO_APP_SCHEDULE_CARD_STATUS_SPEC.md
 */
import type { Schedule } from '@/api/hooks/useSchedules';

export type ConsultantScheduleCardStatus = Schedule['status'];

function normalizeHm(v: string): string {
  const s = (v ?? '').trim();
  return s.length >= 5 ? s.slice(0, 5) : s;
}

function parseLocalDateTimeMs(dateYmd: string, hm: string): number | null {
  const d = String(dateYmd ?? '').slice(0, 10);
  const t = normalizeHm(hm);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d) || t.length < 4) {
    return null;
  }
  const ms = Date.parse(`${d}T${t}:00`);
  return Number.isFinite(ms) ? ms : null;
}

/** 슬롯 종료 시각이 지났는지(로컬 날짜·시각 기준). */
export function isConsultantSchedulePastSlotEnd(dateYmd: string, endTime: string): boolean {
  const ms = parseLocalDateTimeMs(dateYmd, endTime);
  if (ms == null) return false;
  return Date.now() > ms;
}

/** 슬롯 시작 시각이 지났는지(로컬). */
export function isConsultantSchedulePastSlotStart(dateYmd: string, startTime: string): boolean {
  const ms = parseLocalDateTimeMs(dateYmd, startTime);
  if (ms == null) return false;
  return Date.now() > ms;
}

export interface ConsultantScheduleListRowActions {
  readonly primaryActionLabel: string | undefined;
  readonly onPrimaryAction: (() => void) | undefined;
}

/**
 * 목록 카드의 주 액션(상담 시작/완료 → 상세로 이동). 과거 종료 슬롯은 시작 버튼 숨김.
 */
export function getConsultantScheduleListRowActions(
  schedule: Pick<Schedule, 'status' | 'date' | 'startTime' | 'endTime'>,
  navigateToDetail: () => void,
): ConsultantScheduleListRowActions {
  const pastEnd = isConsultantSchedulePastSlotEnd(schedule.date, schedule.endTime);
  if (schedule.status === 'IN_PROGRESS') {
    return { primaryActionLabel: '상담 완료', onPrimaryAction: navigateToDetail };
  }
  const canStart =
    (schedule.status === 'BOOKED' ||
      schedule.status === 'CONFIRMED' ||
      schedule.status === 'SCHEDULED') &&
    !pastEnd;
  if (canStart) {
    return { primaryActionLabel: '상담 시작', onPrimaryAction: navigateToDetail };
  }
  return { primaryActionLabel: undefined, onPrimaryAction: undefined };
}

export interface ConsultantScheduleCardFooterHint {
  readonly text: string | undefined;
}

/**
 * 미시작·시간 경과 안내(PII 없음). 종료 시각 이후에는 보조 문구 생략.
 */
export function getConsultantScheduleCardFooterHint(
  schedule: Pick<Schedule, 'status' | 'date' | 'startTime' | 'endTime'>,
): ConsultantScheduleCardFooterHint {
  if (isConsultantSchedulePastSlotEnd(schedule.date, schedule.endTime)) {
    return { text: undefined };
  }
  const pastStart = isConsultantSchedulePastSlotStart(schedule.date, schedule.startTime);
  if (
    pastStart &&
    (schedule.status === 'BOOKED' ||
      schedule.status === 'CONFIRMED' ||
      schedule.status === 'SCHEDULED')
  ) {
    return { text: '예정 시간이 지났습니다. 상담 시작 여부를 확인해 주세요.' };
  }
  return { text: undefined };
}

/** 카드 컨테이너 강조: 진행 중만 보더·틴트, 그 외는 기본 서피스. */
export type ConsultantScheduleCardContainerVariant = 'inProgress' | 'default';

/**
 * `IN_PROGRESS`일 때만 컨테이너 보더·배경 틴트 적용.
 * 시간 경과·미시작(`footerHint`)은 동 상태가 아니므로 기본 톤 유지.
 */
export function getConsultantScheduleCardContainerVariant(
  status: ConsultantScheduleCardStatus,
): ConsultantScheduleCardContainerVariant {
  return status === 'IN_PROGRESS' ? 'inProgress' : 'default';
}

export interface ConsultantScheduleCardVisualTone {
  /** 카드 컨테이너 불투명도(과거·종료·완료 톤). */
  readonly containerOpacity: number;
}

export function getConsultantScheduleCardVisualTone(
  schedule: Pick<Schedule, 'status' | 'date' | 'endTime'>,
): ConsultantScheduleCardVisualTone {
  const pastEnd = isConsultantSchedulePastSlotEnd(schedule.date, schedule.endTime);
  if (
    schedule.status === 'COMPLETED' ||
    schedule.status === 'CANCELLED' ||
    schedule.status === 'NO_SHOW'
  ) {
    return { containerOpacity: 0.78 };
  }
  if (
    pastEnd &&
    (schedule.status === 'BOOKED' ||
      schedule.status === 'CONFIRMED' ||
      schedule.status === 'SCHEDULED' ||
      schedule.status === 'IN_PROGRESS')
  ) {
    return { containerOpacity: 0.82 };
  }
  return { containerOpacity: 1 };
}

/** 상세 화면에서 상담 시작 버튼 노출 여부(종료 시각 이후 숨김). */
export function canShowConsultantScheduleStartButton(
  schedule: Pick<Schedule, 'status' | 'date' | 'endTime'>,
): boolean {
  if (
    schedule.status !== 'BOOKED' &&
    schedule.status !== 'CONFIRMED' &&
    schedule.status !== 'SCHEDULED'
  ) {
    return false;
  }
  return !isConsultantSchedulePastSlotEnd(schedule.date, schedule.endTime);
}
