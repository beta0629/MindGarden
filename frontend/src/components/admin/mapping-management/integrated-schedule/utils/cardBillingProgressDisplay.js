/**
 * 배정 카드 청구용 누적 진행·일정 행 표시 유틸
 * SSOT: docs/design-system/SCREEN_SPEC_MAPPING_CARD_BILLING_PROGRESS.md
 *
 * @author CoreSolution
 * @since 2026-09-15
 */

import { toDisplayString, toSafeNumber } from '../../../../../utils/safeDisplay';

export const CARD_BILLING_PROGRESS_TEST_ID = 'mapping-card-billing-progress';
/** @deprecated 카드 접이식 제거 — Side Peek 아코디언 test id 사용 */
export const CARD_BILLING_SCHEDULE_TOGGLE_TEST_ID = 'mapping-card-billing-schedule-toggle';
/** @deprecated 카드 접이식 제거 — Side Peek 아코디언 test id 사용 */
export const CARD_BILLING_SCHEDULE_LIST_TEST_ID = 'mapping-card-billing-schedule-list';
/** @deprecated 카드 접이식 제거 — Side Peek 아코디언 test id 사용 */
export const CARD_BILLING_SCHEDULE_OVERFLOW_TEST_ID = 'mapping-card-billing-schedule-overflow';
/** @deprecated 카드 한눈 제거 — Side Peek glance test id 사용 */
export const CARD_BILLING_SCHEDULE_GLANCE_TEST_ID = 'mapping-card-billing-schedule-glance';

export const SIDE_PEEK_BILLING_SCHEDULE_ACCORDION_TEST_ID = 'side-peek-billing-schedule-accordion';
export const SIDE_PEEK_BILLING_SCHEDULE_GLANCE_TEST_ID = 'side-peek-billing-schedule-glance';
export const SIDE_PEEK_BILLING_SCHEDULE_LIST_TEST_ID = 'side-peek-billing-schedule-list';
export const SIDE_PEEK_BILLING_SCHEDULE_OVERFLOW_TEST_ID = 'side-peek-billing-schedule-overflow';

export const CARD_BILLING_SCHEDULE_LIMIT = 24;
/** 접기 전 한눈 스캔용 최근 일자 상한 */
export const CARD_BILLING_GLANCE_DATE_LIMIT = 12;

export const CARD_BILLING_STATUS_LABELS = Object.freeze({
  COMPLETED: '완료',
  BOOKED: '예약',
  CONFIRMED: '확정',
  IN_PROGRESS: '진행중',
  TENTATIVE_PENDING_PAYMENT: '가예약'
});

const LABEL_PROGRESS_PREFIX = '누적 진행';
/** 기관연동 카드 = mappingId 스코프 (client lifetime / 형제 IL 매핑 제외) */
const LABEL_IL_CUMULATIVE_PREFIX = '이 연동 누적';
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
const LABEL_MONTH_SUFFIX = '월';
const LABEL_DAY_SUFFIX = '일';
const STATUS_COMPLETED = 'COMPLETED';
const SEP = ' · ';
const MONTH_GROUP_SEP = ' · ';
const UNKNOWN_MONTH_KEY = 'unknown';

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
 * 점유 일정 목록에서 COMPLETED 건수.
 *
 * @param {unknown} schedules
 * @returns {number}
 */
export const countCompletedConsultationSchedules = (schedules) => {
  return normalizeConsultationSchedules(schedules).filter((item) => {
    const status = toDisplayString(item?.status, '').trim().toUpperCase();
    return status === STATUS_COMPLETED;
  }).length;
};

/**
 * 기관연동 완료 상담 수 — **mappingId(카드) 스코프**.
 * `consultationSchedules`(mapping enrich) 의 COMPLETED 를 SSOT 로 쓴다.
 * client lifetime / 형제 IL·SAME_DAY 매핑 일정은 포함하지 않는다.
 *
 * @param {object|number|string|null|undefined} mappingOrCount
 * @returns {number}
 */
export const resolveClientCompletedConsultationCount = (mappingOrCount) => {
  if (mappingOrCount == null || typeof mappingOrCount !== 'object') {
    return Math.max(0, toSafeNumber(mappingOrCount, 0) ?? 0);
  }
  if (Array.isArray(mappingOrCount.consultationSchedules)) {
    return countCompletedConsultationSchedules(mappingOrCount.consultationSchedules);
  }
  // 하위 호환: 카드가 숫자만 넘긴 경우 (테스트·Peek 직접 props)
  return Math.max(
    0,
    toSafeNumber(mappingOrCount.clientCompletedConsultationCount, 0) ?? 0
  );
};

/**
 * 기관연동 카드 누적 문구 — used/total/잔여 금지. mapping 스코프 라벨.
 *
 * @param {object|number|string|null|undefined} mappingOrCount
 * @returns {string} e.g. 이 연동 누적 1회
 */
export const buildInstitutionLinkCumulativeSentence = (mappingOrCount) => {
  const count = resolveClientCompletedConsultationCount(mappingOrCount);
  return `${LABEL_IL_CUMULATIVE_PREFIX} ${count}${LABEL_USED_SUFFIX}`;
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
 * 카드에 넣을 일정 목록.
 * 기관연동·회기권 모두 **mappingId** {@code consultationSchedules} SSOT.
 * clientConsultationSchedules(client lifetime) 는 카드/청구 스캔에 쓰지 않는다
 * (형제 IL·종료 SAME_DAY 일정 혼입 방지). 월 그룹은 glance/group 유틸.
 *
 * @param {object|null|undefined} mapping
 * @param {boolean} [_institutionLink] 호환용(스코프는 매핑 고정)
 * @returns {object[]}
 */
export const resolveConsultationSchedulesForCard = (mapping, _institutionLink = false) => {
  if (!mapping || typeof mapping !== 'object') {
    return [];
  }
  return normalizeConsultationSchedules(mapping.consultationSchedules);
};

/**
 * Side Peek 일정 아코디언용 목록.
 * 기관연동: 월 청구를 위해 내담자 IL 관련 union
 * ({@code institutionLinkConsultationSchedules} 우선, 없으면
 * {@code clientConsultationSchedules}). 카드 lifetime prefer 회귀 금지 —
 * {@link resolveConsultationSchedulesForCard} 는 건드리지 않는다.
 * 회기권·기타: mapping {@code consultationSchedules} 유지.
 *
 * @param {object|null|undefined} mapping
 * @param {boolean} [institutionLink]
 * @returns {object[]}
 */
export const resolveConsultationSchedulesForSidePeek = (
  mapping,
  institutionLink = false
) => {
  if (!mapping || typeof mapping !== 'object') {
    return [];
  }
  if (!institutionLink) {
    return normalizeConsultationSchedules(mapping.consultationSchedules);
  }
  if (Array.isArray(mapping.institutionLinkConsultationSchedules)) {
    return normalizeConsultationSchedules(mapping.institutionLinkConsultationSchedules);
  }
  if (Array.isArray(mapping.clientConsultationSchedules)) {
    return normalizeConsultationSchedules(mapping.clientConsultationSchedules);
  }
  return normalizeConsultationSchedules(mapping.consultationSchedules);
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
 * @returns {{ year: number, month: number, day: number }|null}
 */
export const parseBillingScheduleYmd = (dateValue) => {
  const raw = toDisplayString(dateValue, '').trim();
  if (!raw) {
    return null;
  }
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(raw);
  if (!match) {
    return null;
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return null;
  }
  return { year, month, day };
};

/**
 * @param {string|null|undefined} dateValue ISO date or datetime
 * @returns {string} e.g. 9/7
 */
export const formatBillingScheduleDate = (dateValue) => {
  const ymd = parseBillingScheduleYmd(dateValue);
  if (!ymd) {
    const raw = toDisplayString(dateValue, '').trim();
    return raw;
  }
  return `${ymd.month}/${ymd.day}`;
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

/**
 * 월별 그룹 (연·월 오름차순). 한눈 스캔·mute 공통.
 * dateLabels 는 파싱 성공 시 일(day)만 담아 `N월` 접두와 M/D 가 겹치지 않게 한다.
 *
 * @param {unknown} schedules
 * @param {number} [limit]
 * @returns {{ monthKey: string, monthLabel: string, dateLabels: string[] }[]}
 */
export const groupConsultationSchedulesByMonth = (
  schedules,
  limit = CARD_BILLING_GLANCE_DATE_LIMIT
) => {
  const { items } = sliceConsultationSchedulesForCard(schedules, limit);
  const groups = [];
  const indexByKey = new Map();
  items.forEach((item) => {
    const ymd = parseBillingScheduleYmd(item?.date);
    // 파싱 성공: day만. 실패: formatBillingScheduleDate 폴백(원본/M/D)
    const dateLabel = ymd
      ? String(ymd.day)
      : formatBillingScheduleDate(item?.date);
    if (!dateLabel) {
      return;
    }
    const monthKey = ymd
      ? `${ymd.year}-${String(ymd.month).padStart(2, '0')}`
      : UNKNOWN_MONTH_KEY;
    const monthLabel = ymd
      ? `${ymd.month}${LABEL_MONTH_SUFFIX}`
      : LABEL_STATUS_FALLBACK;
    let group = indexByKey.get(monthKey);
    if (!group) {
      group = { monthKey, monthLabel, dateLabels: [] };
      indexByKey.set(monthKey, group);
      groups.push(group);
    }
    if (!group.dateLabels.includes(dateLabel)) {
      group.dateLabels.push(dateLabel);
    }
  });
  return groups;
};

/**
 * 접기 전 한눈 일시 — 예: `8월 31일 · 9월 7일 · 14일`
 * (`N월` + `M/D` 중복 금지. boolean 「이력 있음」 대체 SSOT.)
 *
 * @param {unknown} schedules
 * @param {number} [limit]
 * @returns {string}
 */
export const buildBillingScheduleGlanceSummary = (
  schedules,
  limit = CARD_BILLING_GLANCE_DATE_LIMIT
) => {
  const groups = groupConsultationSchedulesByMonth(schedules, limit);
  if (groups.length === 0) {
    return '';
  }
  return groups
    .map((group) => {
      const parsedMonth = group.monthKey !== UNKNOWN_MONTH_KEY;
      return group.dateLabels
        .map((dayLabel, index) => {
          if (!parsedMonth) {
            return dayLabel;
          }
          const dayPart = `${dayLabel}${LABEL_DAY_SUFFIX}`;
          if (index === 0) {
            return `${group.monthLabel} ${dayPart}`;
          }
          return dayPart;
        })
        .join(MONTH_GROUP_SEP);
    })
    .join(SEP);
};
