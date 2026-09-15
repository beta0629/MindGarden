/**
 * 배정 카드 청구용 누적 진행·일정 행 표시 유틸
 * SSOT: docs/design-system/SCREEN_SPEC_MAPPING_CARD_BILLING_PROGRESS.md
 *
 * @author CoreSolution
 * @since 2026-09-15
 */

import { toDisplayString, toSafeNumber } from '../../../../../utils/safeDisplay';

export const CARD_BILLING_PROGRESS_TEST_ID = 'mapping-card-billing-progress';
export const CARD_BILLING_SCHEDULE_TOGGLE_TEST_ID = 'mapping-card-billing-schedule-toggle';
export const CARD_BILLING_SCHEDULE_LIST_TEST_ID = 'mapping-card-billing-schedule-list';
export const CARD_BILLING_SCHEDULE_OVERFLOW_TEST_ID = 'mapping-card-billing-schedule-overflow';

export const CARD_BILLING_SCHEDULE_LIMIT = 24;

export const CARD_BILLING_STATUS_LABELS = Object.freeze({
  COMPLETED: '완료',
  BOOKED: '예약',
  CONFIRMED: '확정',
  IN_PROGRESS: '진행중',
  TENTATIVE_PENDING_PAYMENT: '가예약'
});

const LABEL_PROGRESS_PREFIX = '누적 진행';
const LABEL_USED_SUFFIX = '회';
const LABEL_TOTAL_MID = ' / 총 ';
const LABEL_REMAINING_SEP = ' · 잔여 ';
const LABEL_SCHEDULE_TOGGLE = '일정';
const LABEL_SCHEDULE_TOGGLE_UNIT = '건';
const LABEL_SCHEDULE_COLLAPSE = '접기';
const LABEL_OVERFLOW_PREFIX = '외 ';
const LABEL_OVERFLOW_SUFFIX = '건';
const LABEL_SEQ_SUFFIX = '회차';
const LABEL_STATUS_FALLBACK = '일정';
const SEP = ' · ';

/**
 * @param {object|null|undefined} mappingOrCounts
 * @returns {{ used: number, total: number, remaining: number }}
 */
export const resolveMappingSessionCounts = (mappingOrCounts) => {
  const used = Math.max(0, toSafeNumber(mappingOrCounts?.usedSessions, 0) ?? 0);
  const total = Math.max(0, toSafeNumber(mappingOrCounts?.totalSessions, 0) ?? 0);
  const remaining = Math.max(0, toSafeNumber(mappingOrCounts?.remainingSessions, 0) ?? 0);
  return { used, total, remaining };
};

/**
 * @param {object|null|undefined} mappingOrCounts used/total/remainingSessions
 * @returns {string}
 */
export const buildBillingProgressSentence = (mappingOrCounts) => {
  const { used, total, remaining } = resolveMappingSessionCounts(mappingOrCounts);
  if (total > 0) {
    return `${LABEL_PROGRESS_PREFIX} ${used}${LABEL_USED_SUFFIX}${LABEL_TOTAL_MID}${total}${LABEL_USED_SUFFIX}${LABEL_REMAINING_SEP}${remaining}`;
  }
  // total≤0: 단회·미설정 패키지 — used만 (스펙 §3.1)
  return `${LABEL_PROGRESS_PREFIX} ${used}${LABEL_USED_SUFFIX}`;
};

/**
 * @param {number} totalCount
 * @param {boolean} expanded
 * @returns {string}
 */
export const buildBillingScheduleToggleLabel = (totalCount, expanded) => {
  const count = Math.max(0, toSafeNumber(totalCount, 0) ?? 0);
  const base = `${LABEL_SCHEDULE_TOGGLE} ${count}${LABEL_SCHEDULE_TOGGLE_UNIT}`;
  if (expanded) {
    return `${base} ${LABEL_SCHEDULE_COLLAPSE}`;
  }
  return base;
};

/**
 * @param {number} hiddenCount
 * @returns {string}
 */
export const buildBillingScheduleOverflowLabel = (hiddenCount) => {
  const count = Math.max(0, toSafeNumber(hiddenCount, 0) ?? 0);
  return `${LABEL_OVERFLOW_PREFIX}${count}${LABEL_OVERFLOW_SUFFIX}`;
};

/**
 * @param {string|null|undefined} status
 * @returns {string}
 */
export const resolveBillingScheduleStatusLabel = (status) => {
  const key = toDisplayString(status, '').trim().toUpperCase();
  if (!key) {
    return LABEL_STATUS_FALLBACK;
  }
  return CARD_BILLING_STATUS_LABELS[key] || key;
};

/**
 * @param {string|null|undefined} dateValue ISO date or datetime
 * @returns {string} e.g. 9/7
 */
export const formatBillingScheduleDate = (dateValue) => {
  const raw = toDisplayString(dateValue, '').trim();
  if (!raw) {
    return '';
  }
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(raw);
  if (!match) {
    return raw;
  }
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (!Number.isFinite(month) || !Number.isFinite(day)) {
    return raw;
  }
  return `${month}/${day}`;
};

/**
 * @param {string|null|undefined} timeValue HH:mm[:ss]
 * @returns {string} HH:mm or ''
 */
export const formatBillingScheduleTime = (timeValue) => {
  const raw = toDisplayString(timeValue, '').trim();
  if (!raw) {
    return '';
  }
  const match = /^(\d{1,2}):(\d{2})/.exec(raw);
  if (!match) {
    return raw;
  }
  const hour = String(Number(match[1])).padStart(2, '0');
  const minute = match[2];
  if (!Number.isFinite(Number(match[1]))) {
    return raw;
  }
  return `${hour}:${minute}`;
};

/**
 * @param {object} item
 * @returns {string} e.g. 9/7 · 14:00 · 완료 · 1회차
 */
export const buildBillingScheduleRowLabel = (item) => {
  const dateLabel = formatBillingScheduleDate(item?.date);
  const timeLabel = formatBillingScheduleTime(item?.startTime);
  const statusLabel = resolveBillingScheduleStatusLabel(item?.status);
  const seq = toSafeNumber(item?.sessionSequence, null);
  const parts = [];
  if (dateLabel) {
    parts.push(dateLabel);
  }
  if (timeLabel) {
    parts.push(timeLabel);
  }
  if (statusLabel) {
    parts.push(statusLabel);
  }
  if (seq != null && seq > 0) {
    parts.push(`${seq}${LABEL_SEQ_SUFFIX}`);
  }
  return parts.join(SEP) || LABEL_STATUS_FALLBACK;
};

/**
 * @param {unknown} schedules
 * @returns {object[]}
 */
export const normalizeConsultationSchedules = (schedules) => {
  if (!Array.isArray(schedules)) {
    return [];
  }
  return schedules.filter((item) => item != null && typeof item === 'object');
};

/**
 * 오름차순 목록에서 최근 limit건만 표시. 초과 시 hiddenCount.
 *
 * @param {unknown} schedules
 * @param {number} [limit]
 * @returns {{ items: object[], hiddenCount: number, totalCount: number }}
 */
export const sliceConsultationSchedulesForCard = (
  schedules,
  limit = CARD_BILLING_SCHEDULE_LIMIT
) => {
  const items = normalizeConsultationSchedules(schedules);
  const safeLimit = Math.max(
    0,
    toSafeNumber(limit, CARD_BILLING_SCHEDULE_LIMIT) ?? CARD_BILLING_SCHEDULE_LIMIT
  );
  if (items.length <= safeLimit) {
    return { items, hiddenCount: 0, totalCount: items.length };
  }
  return {
    items: items.slice(items.length - safeLimit),
    hiddenCount: items.length - safeLimit,
    totalCount: items.length
  };
};
