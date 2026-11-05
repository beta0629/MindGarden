/**
 * 상담일지 모달 — 타기관 연계 컨텍스트 판별 SSOT.
 * rem=0·sessionNumber null 로 추정하지 않는다.
 */

import {
  CLIENT_ENGAGEMENT_TYPE,
  isInstitutionLinkClient,
  isInstitutionLinkEngagement
} from '../constants/clientEngagementType';

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
