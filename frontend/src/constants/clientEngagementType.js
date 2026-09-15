/**
 * 내담자 연계 유형 SSOT. 등록 화면과 배정이 같은 값을 읽는다.
 * remainingSessions 로 추정하지 않는다. 바우처는 선택지에 넣지 않는다.
 *
 * @author CoreSolution
 * @since 2026-09-14
 */

export const CLIENT_ENGAGEMENT_TYPE = Object.freeze({
  SESSION_TICKET: 'SESSION_TICKET',
  INSTITUTION_LINK: 'INSTITUTION_LINK'
});

export const CLIENT_ENGAGEMENT_TYPE_LABELS = Object.freeze({
  [CLIENT_ENGAGEMENT_TYPE.SESSION_TICKET]: '일반 회기',
  [CLIENT_ENGAGEMENT_TYPE.INSTITUTION_LINK]: '타기관 연계'
});

export const INSTITUTION_LINK_BADGE_LABEL = '기관연동';

export const CLIENT_PREPAID_CHOICE = Object.freeze({
  YES: 'PREPAID',
  NO: 'NOT_PREPAID'
});

export const ENGAGEMENT_TYPE_BADGE_TEST_ID = 'engagement-type-badge';

export const DEFAULT_CLIENT_ENGAGEMENT_FORM = Object.freeze({
  engagementType: CLIENT_ENGAGEMENT_TYPE.SESSION_TICKET,
  institutionName: '',
  institutionContactName: '',
  institutionContactPhone: '',
  institutionDocumentPhone: '',
  institutionDocumentEmail: '',
  institutionPrepaid: '',
  institutionPrepaidDate: '',
  institutionPrepaidAmount: ''
});

export const CLIENT_ENGAGEMENT_TYPE_OPTIONS = Object.freeze([
  {
    value: CLIENT_ENGAGEMENT_TYPE.SESSION_TICKET,
    label: CLIENT_ENGAGEMENT_TYPE_LABELS[CLIENT_ENGAGEMENT_TYPE.SESSION_TICKET]
  },
  {
    value: CLIENT_ENGAGEMENT_TYPE.INSTITUTION_LINK,
    label: CLIENT_ENGAGEMENT_TYPE_LABELS[CLIENT_ENGAGEMENT_TYPE.INSTITUTION_LINK]
  }
]);

export const CLIENT_PREPAID_OPTIONS = Object.freeze([
  { value: CLIENT_PREPAID_CHOICE.YES, label: '선납함' },
  { value: CLIENT_PREPAID_CHOICE.NO, label: '선납 안 함' }
]);

/**
 * @param {*} value
 * @returns {boolean}
 */
export function isInstitutionLinkEngagement(value) {
  if (value == null || value === '') {
    return false;
  }
  return String(value).trim().toUpperCase() === CLIENT_ENGAGEMENT_TYPE.INSTITUTION_LINK;
}

/**
 * 내담자(등록 유형)가 타기관인지. rem 은 보지 않는다.
 *
 * @param {object|null|undefined} client
 * @returns {boolean}
 */
export function isInstitutionLinkClient(client) {
  if (!client || typeof client !== 'object') {
    return false;
  }
  return isInstitutionLinkEngagement(client.engagementType)
    || isInstitutionLinkEngagement(client.clientEngagementType);
}

/**
 * 배정·내담자에서 기관연동 배지를 그릴지.
 *
 * @param {object|null|undefined} source
 * @returns {boolean}
 */
export function shouldRenderInstitutionLinkBadge(source) {
  if (source == null) {
    return false;
  }
  if (typeof source === 'string') {
    return isInstitutionLinkEngagement(source);
  }
  return isInstitutionLinkClient(source)
    || isInstitutionLinkEngagement(source.paymentTiming)
    || isInstitutionLinkEngagement(source.clientEngagementType)
    || isInstitutionLinkEngagement(source.engagementType);
}

/**
 * 일반 회기로 되돌릴 때 기관·선납 값을 비운다.
 *
 * @param {object} form
 * @returns {object}
 */
export function clearInstitutionFormFields(form) {
  return {
    ...form,
    engagementType: CLIENT_ENGAGEMENT_TYPE.SESSION_TICKET,
    institutionName: '',
    institutionContactName: '',
    institutionContactPhone: '',
    institutionDocumentPhone: '',
    institutionDocumentEmail: '',
    institutionPrepaid: '',
    institutionPrepaidDate: '',
    institutionPrepaidAmount: ''
  };
}
