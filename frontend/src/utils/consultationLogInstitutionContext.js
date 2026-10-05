/**
 * 상담일지 모달 — 타기관 연계 컨텍스트 판별 SSOT.
 * rem=0·sessionNumber null 로 추정하지 않는다.
 */

import {
  CLIENT_ENGAGEMENT_TYPE,
  isInstitutionLinkClient,
  isInstitutionLinkEngagement
} from '../constants/clientEngagementType';

/** 타기관 일지 API (회기권 schedules/consultation-records 와 분리) */
export const INSTITUTION_LINK_CONSULTATION_RECORDS_API =
  '/api/v1/institution-link/consultation-records';

/**
 * @param {object|null|undefined} scheduleData
 * @param {object|null|undefined} client
 * @param {object|null|undefined} clientWithStats
 * @returns {boolean}
 */
export function isInstitutionLinkConsultationLogContext(scheduleData, client, clientWithStats) {
  if (isInstitutionLinkEngagement(scheduleData?.paymentTiming)
      || isInstitutionLinkEngagement(scheduleData?.mappingPaymentTiming)
      || isInstitutionLinkEngagement(scheduleData?.clientEngagementType)
      || isInstitutionLinkEngagement(scheduleData?.engagementType)) {
    return true;
  }
  if (isInstitutionLinkClient(client) || isInstitutionLinkClient(clientWithStats?.client)) {
    return true;
  }
  if (isInstitutionLinkEngagement(clientWithStats?.engagementType)
      || isInstitutionLinkEngagement(clientWithStats?.clientEngagementType)) {
    return true;
  }
  return false;
}

/**
 * 타기관 일지 저장 payload 에 넣을 라우팅 필드.
 *
 * @param {object|null|undefined} scheduleData
 * @param {object|null|undefined} client
 * @returns {{ mappingId: number|null, paymentTiming: string|null, engagementType: string }}
 */
export function buildInstitutionLinkLogRoutingFields(scheduleData, client) {
  const mappingIdRaw = scheduleData?.mappingId
    ?? scheduleData?.consultantClientMappingId
    ?? null;
  const mappingId = mappingIdRaw != null && mappingIdRaw !== ''
    ? Number(mappingIdRaw)
    : null;
  const paymentTiming = scheduleData?.paymentTiming
    ?? scheduleData?.mappingPaymentTiming
    ?? null;
  const engagementType = isInstitutionLinkClient(client)
    || isInstitutionLinkEngagement(scheduleData?.clientEngagementType)
    || isInstitutionLinkEngagement(scheduleData?.engagementType)
    || isInstitutionLinkEngagement(paymentTiming)
    ? CLIENT_ENGAGEMENT_TYPE.INSTITUTION_LINK
    : null;
  return {
    mappingId: Number.isFinite(mappingId) ? mappingId : null,
    paymentTiming: paymentTiming != null ? String(paymentTiming) : null,
    engagementType
  };
}

/**
 * 스케줄 ID 정규화 (schedule-436 → 436).
 *
 * @param {object|null|undefined} scheduleData
 * @returns {number|null}
 */
export function resolveConsultationScheduleId(scheduleData) {
  if (scheduleData?.id == null || scheduleData.id === '') {
    return null;
  }
  const raw = String(scheduleData.id);
  const normalized = raw.startsWith('schedule-') ? raw.replace('schedule-', '') : raw;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * 타기관 최신 일지 조회 URL.
 *
 * @param {object|null|undefined} scheduleData
 * @returns {string|null}
 */
export function buildInstitutionLinkLatestLogUrl(scheduleData) {
  const scheduleId = resolveConsultationScheduleId(scheduleData);
  const mappingIdRaw = scheduleData?.mappingId ?? scheduleData?.consultantClientMappingId ?? null;
  const mappingId = mappingIdRaw != null && mappingIdRaw !== '' ? Number(mappingIdRaw) : null;
  const params = new URLSearchParams();
  if (scheduleId != null) {
    params.set('scheduleId', String(scheduleId));
  }
  if (Number.isFinite(mappingId)) {
    params.set('mappingId', String(mappingId));
  }
  if (![...params.keys()].length) {
    return null;
  }
  return `${INSTITUTION_LINK_CONSULTATION_RECORDS_API}/latest?${params.toString()}`;
}

/** 일정 상세에서 상담일지 진입 버튼을 두는 상태 코드 (예약 BOOKED·취소 제외). */
export const CONSULTATION_LOG_ENTRY_STATUSES = Object.freeze([
  'CONFIRMED',
  'IN_PROGRESS',
  'COMPLETED',
  'TENTATIVE_PENDING_PAYMENT'
]);

/** 상담일지 진입 버튼 모드 — 일지 있으면 보기/수정, 없거나 미조회면 작성. */
export const CONSULTATION_LOG_ENTRY_MODE = Object.freeze({
  WRITE: 'write',
  VIEW: 'view'
});

/**
 * 일정 상세 상담일지 진입 버튼 하나의 노출·모드 (상담사·관리자 화면 공통).
 *
 * <p>본문 권한은 canAccessConsultationLogBody(사무원·내담자 제외)로만 거른다. 수정 가능 여부는
 * 서버(작성 상담사·같은 테넌트 관리자)가 판정하므로 화면에서 따로 판정하지 않는다.
 * 일지가 있으면 상태(CONFIRMED·COMPLETED 등)와 무관하게 보기/수정, 없거나 조회 전·실패(null)면 작성
 * (일지 모달이 기존 기록을 다시 불러오므로 진입점은 유지한다).</p>
 *
 * @param {{
 *   statusCode: string|null|undefined,
 *   hasConsultationRecord: boolean|null|undefined,
 *   isVacation?: boolean,
 *   canAccessBody: boolean
 * }} params
 * @returns {{ visible: boolean, mode: string|null }}
 */
export function resolveScheduleConsultationLogEntry({
  statusCode,
  hasConsultationRecord,
  isVacation = false,
  canAccessBody
}) {
  if (isVacation || !canAccessBody || !CONSULTATION_LOG_ENTRY_STATUSES.includes(statusCode)) {
    return { visible: false, mode: null };
  }
  return {
    visible: true,
    mode: hasConsultationRecord === true
      ? CONSULTATION_LOG_ENTRY_MODE.VIEW
      : CONSULTATION_LOG_ENTRY_MODE.WRITE
  };
}

/**
 * 타기관 latest 응답에 활성 일지가 있는지.
 * scheduleData 가 있으면 응답 scheduleId 가 요청 스케줄과 일치할 때만 true
 * (같은 mapping 과거 회기 일지로 현재 스케줄 CTA 를 숨기지 않음).
 *
 * @param {object|null|undefined} response StandardizedApi 언랩 결과 또는 envelope
 * @param {object|null|undefined} [scheduleData] 요청 스케줄(선택, defense in depth)
 * @returns {boolean}
 */
export function hasInstitutionLinkLatestLog(response, scheduleData) {
  const raw = response?.data ?? response;
  if (raw == null || raw.id == null) {
    return false;
  }
  if (scheduleData == null) {
    return true;
  }
  const expectedScheduleId = resolveConsultationScheduleId(scheduleData);
  if (expectedScheduleId == null) {
    return true;
  }
  const responseScheduleId = resolveConsultationScheduleId({ id: raw.scheduleId });
  if (responseScheduleId == null) {
    return false;
  }
  return responseScheduleId === expectedScheduleId;
}

/**
 * 타기관 API 응답 → 모달 form/record 호환 객체.
 * 회기권 전용 필드(riskAssessment 등)는 비워 둔다.
 *
 * @param {object|null|undefined} record
 * @returns {object|null}
 */
export function mapInstitutionLinkLogToConsultationRecord(record) {
  if (!record || record.id == null) {
    return null;
  }
  return {
    ...record,
    consultationId: record.scheduleId ?? record.consultationId ?? null,
    sessionNumber: record.monthlyOccurrence != null ? Number(record.monthlyOccurrence) : null,
    clientCondition: record.clientCondition || '',
    mainIssues: record.mainIssues || '',
    interventionMethods: record.interventionMethods || '',
    clientResponse: record.clientResponse || '',
    nextSessionPlan: record.nextSessionPlan || '',
    homeworkAssigned: record.homeworkAssigned || '',
    consultantObservations: record.consultantObservations || '',
    consultantAssessment: record.consultantAssessment || '',
    progressEvaluation: record.progressEvaluation || '',
    specialConsiderations: record.specialConsiderations || '',
    isSessionCompleted: record.isSessionCompleted ?? false,
    _institutionLinkLog: true
  };
}
