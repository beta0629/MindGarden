/**
 * 내담자 연계 유형·배정 교차 금지 SSOT.
 * 가예약(SAME_DAY_CARD)과 기관연계는 섞지 않는다.
 *
 * @author CoreSolution
 * @since 2026-09-14
 */

const PAYMENT_TIMING_ADVANCE = 'ADVANCE';
const PAYMENT_TIMING_SAME_DAY_CARD = 'SAME_DAY_CARD';
const PAYMENT_TIMING_INSTITUTION_LINK = 'INSTITUTION_LINK';

export const CLIENT_ENGAGEMENT_TYPE = Object.freeze({
  SESSION_TICKET: 'SESSION_TICKET',
  INSTITUTION_LINK: 'INSTITUTION_LINK'
});

export const CLIENT_ENGAGEMENT_TYPE_LABELS = Object.freeze({
  [CLIENT_ENGAGEMENT_TYPE.SESSION_TICKET]: '일반',
  [CLIENT_ENGAGEMENT_TYPE.INSTITUTION_LINK]: '타기관'
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

export const INSTITUTION_PREPAID_VALUE = Object.freeze({
  YES: 'YES',
  NO: 'NO'
});

export const INSTITUTION_PREPAID_OPTIONS = Object.freeze([
  { value: INSTITUTION_PREPAID_VALUE.YES, label: '선납함' },
  { value: INSTITUTION_PREPAID_VALUE.NO, label: '선납 안 함' }
]);

export const CLIENT_ENGAGEMENT_MESSAGES = Object.freeze({
  INSTITUTION_NAME_REQUIRED: '기관 이름을 입력하세요.',
  INSTITUTION_CONTACT_NAME_REQUIRED: '기관 담당자를 입력하세요.',
  INSTITUTION_CONTACT_PHONE_REQUIRED: '기관 담당 연락처를 입력하세요.',
  INSTITUTION_DOCUMENT_PHONE_REQUIRED: '문서 발송 연락처를 입력하세요.',
  INSTITUTION_DOCUMENT_EMAIL_REQUIRED: '문서 발송 이메일을 입력하세요.',
  PREPAID_REQUIRED: '선납 여부를 선택하세요.',
  PREPAID_DATE_REQUIRED: '선납 일자를 입력하세요.',
  PREPAID_AMOUNT_REQUIRED: '선납 금액을 입력하세요.',
  INSTITUTION_CLIENT_ONLY_ASSIGNMENT: '타기관 내담자는 기관연계만 배정할 수 있습니다.',
  SESSION_CLIENT_NOT_INSTITUTION: '일반 내담자는 회기·가예약만 배정할 수 있습니다.',
  FIXED_AMOUNT_REQUIRED: '고정 금액을 입력하세요.',
  INSTITUTION_LINK_PACKAGE_NAME: '기관연계'
});

export const ASSIGNMENT_PAYMENT_TIMING = Object.freeze({
  ADVANCE: PAYMENT_TIMING_ADVANCE,
  SAME_DAY_CARD: PAYMENT_TIMING_SAME_DAY_CARD,
  INSTITUTION_LINK: PAYMENT_TIMING_INSTITUTION_LINK
});

export const ASSIGNMENT_PAYMENT_TIMING_LABELS = Object.freeze({
  [PAYMENT_TIMING_ADVANCE]: '회기',
  [PAYMENT_TIMING_SAME_DAY_CARD]: '가예약',
  [PAYMENT_TIMING_INSTITUTION_LINK]: '기관연계'
});

export const CLIENT_ENGAGEMENT_FORM_DEFAULTS = Object.freeze({
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

const isBlank = (value) => value == null || String(value).trim() === '';

/**
 * @param {string|null|undefined} value
 * @returns {string}
 */
export function normalizeClientEngagementType(value) {
  if (isBlank(value)) {
    return CLIENT_ENGAGEMENT_TYPE.SESSION_TICKET;
  }
  const normalized = String(value).trim().toUpperCase();
  if (normalized === CLIENT_ENGAGEMENT_TYPE.INSTITUTION_LINK) {
    return CLIENT_ENGAGEMENT_TYPE.INSTITUTION_LINK;
  }
  return CLIENT_ENGAGEMENT_TYPE.SESSION_TICKET;
}

/**
 * @param {object|string|null|undefined} clientOrType
 * @returns {boolean}
 */
export function isInstitutionLinkClient(clientOrType) {
  if (typeof clientOrType === 'string') {
    return normalizeClientEngagementType(clientOrType) === CLIENT_ENGAGEMENT_TYPE.INSTITUTION_LINK;
  }
  return normalizeClientEngagementType(clientOrType?.engagementType)
    === CLIENT_ENGAGEMENT_TYPE.INSTITUTION_LINK;
}

/**
 * @param {object|null|undefined} client
 * @returns {string[]}
 */
export function allowedPaymentTimingsForClient(client) {
  if (isInstitutionLinkClient(client)) {
    return [PAYMENT_TIMING_INSTITUTION_LINK];
  }
  return [PAYMENT_TIMING_ADVANCE, PAYMENT_TIMING_SAME_DAY_CARD];
}

/**
 * 내담자 유형과 요청 배정 시점을 교차 없이 해석한다.
 *
 * @param {object|string|null|undefined} clientOrType
 * @param {string|null|undefined} requestedPaymentTiming
 * @returns {string}
 */
export function resolveAssignmentPaymentTiming(clientOrType, requestedPaymentTiming) {
  if (isInstitutionLinkClient(clientOrType)) {
    if (requestedPaymentTiming
        && String(requestedPaymentTiming).trim() !== ''
        && String(requestedPaymentTiming).toUpperCase() !== PAYMENT_TIMING_INSTITUTION_LINK) {
      throw new Error(CLIENT_ENGAGEMENT_MESSAGES.INSTITUTION_CLIENT_ONLY_ASSIGNMENT);
    }
    return PAYMENT_TIMING_INSTITUTION_LINK;
  }
  if (String(requestedPaymentTiming || '').toUpperCase() === PAYMENT_TIMING_INSTITUTION_LINK) {
    throw new Error(CLIENT_ENGAGEMENT_MESSAGES.SESSION_CLIENT_NOT_INSTITUTION);
  }
  return requestedPaymentTiming;
}

/**
 * @param {unknown} amount
 * @returns {string}
 */
export function formatAssignmentAmountKrw(amount) {
  const n = Number(amount);
  if (!Number.isFinite(n)) {
    return '';
  }
  return `${new Intl.NumberFormat('ko-KR', { maximumFractionDigits: 0 }).format(n)}원`;
}

/**
 * @param {object|null|undefined} client
 * @returns {object}
 */
export function clientEngagementFieldsFromEntity(client) {
  if (!client) {
    return { ...CLIENT_ENGAGEMENT_FORM_DEFAULTS };
  }
  let prepaid = '';
  if (client.institutionPrepaid === true || client.institutionPrepaid === INSTITUTION_PREPAID_VALUE.YES) {
    prepaid = INSTITUTION_PREPAID_VALUE.YES;
  } else if (client.institutionPrepaid === false || client.institutionPrepaid === INSTITUTION_PREPAID_VALUE.NO) {
    prepaid = INSTITUTION_PREPAID_VALUE.NO;
  }
  return {
    engagementType: normalizeClientEngagementType(client.engagementType),
    institutionName: client.institutionName || '',
    institutionContactName: client.institutionContactName || '',
    institutionContactPhone: client.institutionContactPhone || '',
    institutionDocumentPhone: client.institutionDocumentPhone || '',
    institutionDocumentEmail: client.institutionDocumentEmail || '',
    institutionPrepaid: prepaid,
    institutionPrepaidDate: client.institutionPrepaidDate || '',
    institutionPrepaidAmount: client.institutionPrepaidAmount != null
      ? String(client.institutionPrepaidAmount)
      : ''
  };
}

/**
 * @param {object} formData
 * @returns {object} field -> message
 */
export function validateClientEngagementForm(formData) {
  const errors = {};
  if (!isInstitutionLinkClient(formData)) {
    return errors;
  }
  if (isBlank(formData.institutionName)) {
    errors.institutionName = CLIENT_ENGAGEMENT_MESSAGES.INSTITUTION_NAME_REQUIRED;
  }
  if (isBlank(formData.institutionContactName)) {
    errors.institutionContactName = CLIENT_ENGAGEMENT_MESSAGES.INSTITUTION_CONTACT_NAME_REQUIRED;
  }
  if (isBlank(formData.institutionContactPhone)) {
    errors.institutionContactPhone = CLIENT_ENGAGEMENT_MESSAGES.INSTITUTION_CONTACT_PHONE_REQUIRED;
  }
  if (isBlank(formData.institutionDocumentPhone)) {
    errors.institutionDocumentPhone = CLIENT_ENGAGEMENT_MESSAGES.INSTITUTION_DOCUMENT_PHONE_REQUIRED;
  }
  if (isBlank(formData.institutionDocumentEmail)) {
    errors.institutionDocumentEmail = CLIENT_ENGAGEMENT_MESSAGES.INSTITUTION_DOCUMENT_EMAIL_REQUIRED;
  }
  if (isBlank(formData.institutionPrepaid)) {
    errors.institutionPrepaid = CLIENT_ENGAGEMENT_MESSAGES.PREPAID_REQUIRED;
  }
  if (formData.institutionPrepaid === INSTITUTION_PREPAID_VALUE.YES) {
    if (isBlank(formData.institutionPrepaidDate)) {
      errors.institutionPrepaidDate = CLIENT_ENGAGEMENT_MESSAGES.PREPAID_DATE_REQUIRED;
    }
    const amount = Number(formData.institutionPrepaidAmount);
    if (!Number.isFinite(amount) || amount < 0) {
      errors.institutionPrepaidAmount = CLIENT_ENGAGEMENT_MESSAGES.PREPAID_AMOUNT_REQUIRED;
    }
  }
  return errors;
}

/**
 * 저장 payload. 일반으로 되돌리면 기관 필드를 보내지 않는다.
 *
 * @param {object} formData
 * @returns {object}
 */
export function buildClientEngagementPayload(formData) {
  const engagementType = normalizeClientEngagementType(formData?.engagementType);
  if (engagementType !== CLIENT_ENGAGEMENT_TYPE.INSTITUTION_LINK) {
    return { engagementType: CLIENT_ENGAGEMENT_TYPE.SESSION_TICKET };
  }
  const prepaid = formData.institutionPrepaid === INSTITUTION_PREPAID_VALUE.YES;
  const payload = {
    engagementType,
    institutionName: String(formData.institutionName || '').trim(),
    institutionContactName: String(formData.institutionContactName || '').trim(),
    institutionContactPhone: String(formData.institutionContactPhone || '').trim(),
    institutionDocumentPhone: String(formData.institutionDocumentPhone || '').trim(),
    institutionDocumentEmail: String(formData.institutionDocumentEmail || '').trim(),
    institutionPrepaid: prepaid
  };
  if (prepaid) {
    payload.institutionPrepaidDate = String(formData.institutionPrepaidDate || '').trim();
    payload.institutionPrepaidAmount = Number(formData.institutionPrepaidAmount);
  }
  return payload;
}
