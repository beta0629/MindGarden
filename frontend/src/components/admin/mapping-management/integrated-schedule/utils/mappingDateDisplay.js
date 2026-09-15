/**
 * 매핑 시작일 vs 최초 상담일 표시 SSOT.
 * 최초 상담일 = MIN(schedules.date). mapping.startDate 를 최초 상담으로 쓰지 않는다.
 *
 * 사실 합류(PROD client 78 최가을, 배정vs스케줄 선후):
 * - 8/31 13:04:12 mapping 242 SAME_DAY (배정 먼저)
 * - 8/31 13:04:35 schedule 373 mapping_id=242 (22초 후) — 스케줄만 먼저 아님
 * - 9/1 mapping 245 IL = 이후 기관연동 배정 (첫 상담/첫 배정 아님)
 * - 최초 상담일 = schedule 373 date 8/31
 * 표시 전용 — DATAFIX/SQL/금액 변경 없음.
 *
 * @author CoreSolution
 * @since 2026-09-15
 */

import { toDisplayString } from '../../../../../utils/safeDisplay';
import { isInstitutionLinkEngagement } from '../../../../../constants/mappingEngagementType';
import {
  normalizeConsultationSchedules,
  parseBillingScheduleYmd
} from './cardBillingProgressDisplay';

export const MAPPING_DATE_LABEL = Object.freeze({
  MAPPING_START: '매핑 시작일',
  FIRST_CONSULTATION: '최초 상담일',
  /** 매핑 레코드 생성 시각 — 「최초 등록」으로 오인하지 않도록 명시 */
  MAPPING_CREATED: '매핑 생성일',
  FALLBACK: '날짜'
});

export const MAPPING_DATE_KIND = Object.freeze({
  MAPPING_START: 'mappingStart',
  FIRST_CONSULTATION: 'firstConsultation',
  NONE: 'none'
});

/**
 * @param {object|null|undefined} mapping
 * @returns {boolean}
 */
export const isInstitutionLinkMappingForDate = (mapping) => {
  if (mapping == null || typeof mapping !== 'object') {
    return false;
  }
  return isInstitutionLinkEngagement(mapping.paymentTiming)
    || isInstitutionLinkEngagement(mapping.clientEngagementType)
    || isInstitutionLinkEngagement(mapping.engagementType)
    || isInstitutionLinkEngagement(mapping.mappingEngagementType);
};

/**
 * @param {unknown} schedules
 * @returns {string|null} YYYY-MM-DD
 */
export const resolveFirstConsultationDateFromSchedules = (schedules) => {
  const items = normalizeConsultationSchedules(schedules);
  let minKey = null;
  let minRaw = null;
  items.forEach((item) => {
    const ymd = parseBillingScheduleYmd(item?.date);
    if (!ymd) {
      return;
    }
    const key = `${ymd.year}-${String(ymd.month).padStart(2, '0')}-${String(ymd.day).padStart(2, '0')}`;
    if (minKey == null || key < minKey) {
      minKey = key;
      minRaw = key;
    }
  });
  return minRaw;
};

/**
 * 기관연동은 clientConsultationSchedules 우선(lifetime). 그다음 consultationSchedules.
 *
 * @param {object|null|undefined} mapping
 * @returns {string|null} YYYY-MM-DD
 */
export const resolveFirstConsultationDate = (mapping) => {
  if (mapping == null || typeof mapping !== 'object') {
    return null;
  }
  const institutionLink = isInstitutionLinkMappingForDate(mapping);
  if (institutionLink) {
    const fromClient = resolveFirstConsultationDateFromSchedules(
      mapping.clientConsultationSchedules
    );
    if (fromClient) {
      return fromClient;
    }
  }
  const fromMapping = resolveFirstConsultationDateFromSchedules(
    mapping.consultationSchedules
  );
  if (fromMapping) {
    return fromMapping;
  }
  if (!institutionLink) {
    return resolveFirstConsultationDateFromSchedules(
      mapping.clientConsultationSchedules
    );
  }
  return null;
};

/**
 * @param {object|null|undefined} mapping
 * @returns {string|null}
 */
export const resolveMappingStartDate = (mapping) => {
  if (mapping == null || typeof mapping !== 'object') {
    return null;
  }
  const start = toDisplayString(mapping.startDate, '').trim();
  if (start) {
    return start;
  }
  const created = toDisplayString(mapping.createdAt, '').trim();
  return created || null;
};

/**
 * 목록·테이블 1차 날짜: 일정 MIN 이 있으면 최초 상담일, 없으면 매핑 시작일.
 * IL 최가을형(매핑 start 9/1, schedule 8/31) → 8/31.
 *
 * @param {object|null|undefined} mapping
 * @returns {{ date: string|null, label: string, kind: string, mappingStartDate: string|null, firstConsultationDate: string|null }}
 */
export const resolveMappingPrimaryDateDisplay = (mapping) => {
  const firstConsultationDate = resolveFirstConsultationDate(mapping);
  const mappingStartDate = resolveMappingStartDate(mapping);
  if (firstConsultationDate) {
    return {
      date: firstConsultationDate,
      label: MAPPING_DATE_LABEL.FIRST_CONSULTATION,
      kind: MAPPING_DATE_KIND.FIRST_CONSULTATION,
      mappingStartDate,
      firstConsultationDate
    };
  }
  if (mappingStartDate) {
    return {
      date: mappingStartDate,
      label: MAPPING_DATE_LABEL.MAPPING_START,
      kind: MAPPING_DATE_KIND.MAPPING_START,
      mappingStartDate,
      firstConsultationDate: null
    };
  }
  return {
    date: null,
    label: MAPPING_DATE_LABEL.FALLBACK,
    kind: MAPPING_DATE_KIND.NONE,
    mappingStartDate: null,
    firstConsultationDate: null
  };
};
