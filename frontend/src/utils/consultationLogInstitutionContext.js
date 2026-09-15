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

/**
 * 일정 상세 모달 — 작성/보기 버튼 상호배타.
 *
 * @param {boolean|null|undefined} hasConsultationRecord
 * @returns {{ showWrite: boolean, showView: boolean }}
 */
export function resolveConsultationLogActionVisibility(hasConsultationRecord) {
  return {
    showWrite: hasConsultationRecord === false,
    showView: hasConsultationRecord === true
  };
}

/**
 * 타기관 latest 응답에 활성 일지가 있는지.
 *
 * @param {object|null|undefined} response StandardizedApi 언랩 결과 또는 envelope
 * @returns {boolean}
 */
export function hasInstitutionLinkLatestLog(response) {
  const raw = response?.data ?? response;
  return raw != null && raw.id != null;
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
