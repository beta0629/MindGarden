/**
 * 통합 스케줄 매칭 카드 — 스케줄 등록 상태 표시 SSOT
 * 스펙: docs/design-system/v2/INTEGRATED_SCHEDULE_CARD_SCHEDULE_STATUS_SPEC.md
 *
 * @author CoreSolution
 * @since 2026-07-18
 */

import { toDisplayString } from '../../../../../utils/safeDisplay';

/** ISO date(YYYY-MM-DD) → M/D (파싱 실패 시 원본) */
export const formatConsultationDateMonthDay = (raw) => {
  if (raw == null) {
    return '';
  }
  const str = toDisplayString(raw, '').trim();
  if (!str) {
    return '';
  }
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(str);
  if (!match) {
    return str;
  }
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (!Number.isFinite(month) || !Number.isFinite(day)) {
    return str;
  }
  return `${month}/${day}`;
};

export const MAPPING_SCHEDULE_STATUS_KIND = {
  REGISTERED: 'registered',
  HISTORY: 'history',
  NONE: 'none'
};

export const MAPPING_SCHEDULE_STATUS_LABEL = {
  HISTORY: '일정 이력 있음',
  NONE: '일정 미등록',
  REGISTERED_PREFIX: '일정 등록 · '
};

/**
 * mapping enrich 필드 → 표시 kind + label
 * @param {object} [mapping]
 * @returns {{ kind: string, label: string }}
 */
export const resolveMappingScheduleStatus = (mapping) => {
  const nextRaw = mapping?.nextConsultationDate;
  const nextMd = formatConsultationDateMonthDay(nextRaw);
  if (nextMd) {
    return {
      kind: MAPPING_SCHEDULE_STATUS_KIND.REGISTERED,
      label: `${MAPPING_SCHEDULE_STATUS_LABEL.REGISTERED_PREFIX}${nextMd}`
    };
  }
  if (mapping?.hasConsultationSchedule === true) {
    return {
      kind: MAPPING_SCHEDULE_STATUS_KIND.HISTORY,
      label: MAPPING_SCHEDULE_STATUS_LABEL.HISTORY
    };
  }
  return {
    kind: MAPPING_SCHEDULE_STATUS_KIND.NONE,
    label: MAPPING_SCHEDULE_STATUS_LABEL.NONE
  };
};
