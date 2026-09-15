/**
 * 배정 계약 유형 SSOT. 회기권·타기관 연계·바우처를 섞지 않는다.
 *
 * <p>형제 슬라이스는 이 파일만 import 하면 라벨·판별·배지 variant 를 공유한다.
 * {@code remainingSessions} / {@code sessionSequence} 로 추정하지 않는다.</p>
 *
 * @author CoreSolution
 * @since 2026-09-14
 */

export const MAPPING_ENGAGEMENT_TYPE = Object.freeze({
  SESSION_TICKET: 'SESSION_TICKET',
  INSTITUTION_LINK: 'INSTITUTION_LINK',
  VOUCHER: 'VOUCHER'
});

export const MAPPING_ENGAGEMENT_TYPE_LABELS = Object.freeze({
  [MAPPING_ENGAGEMENT_TYPE.SESSION_TICKET]: '회기권',
  [MAPPING_ENGAGEMENT_TYPE.INSTITUTION_LINK]: '기관연동',
  [MAPPING_ENGAGEMENT_TYPE.VOUCHER]: '바우처'
});

export const MAPPING_ENGAGEMENT_BADGE_STATUS_VARIANT = Object.freeze({
  [MAPPING_ENGAGEMENT_TYPE.SESSION_TICKET]: 'neutral',
  [MAPPING_ENGAGEMENT_TYPE.INSTITUTION_LINK]: 'info',
  [MAPPING_ENGAGEMENT_TYPE.VOUCHER]: 'success'
});

/** 배지로 그리는 유형. 회기권은 기본값이라 배지를 그리지 않는다. */
export const MAPPING_ENGAGEMENT_BADGE_TYPES = Object.freeze([
  MAPPING_ENGAGEMENT_TYPE.INSTITUTION_LINK,
  MAPPING_ENGAGEMENT_TYPE.VOUCHER
]);

export const ENGAGEMENT_TYPE_BADGE_TEST_ID = 'engagement-type-badge';
export const ENGAGEMENT_TYPE_BADGE_CLASS = 'mg-engagement-type-badge';

const INSTITUTION_LINK_VALUE = MAPPING_ENGAGEMENT_TYPE.INSTITUTION_LINK;
const VOUCHER_VALUE = MAPPING_ENGAGEMENT_TYPE.VOUCHER;
const SESSION_TICKET_VALUE = MAPPING_ENGAGEMENT_TYPE.SESSION_TICKET;

/**
 * 계약 유형 문자열을 정규화한다. rem 은 보지 않는다.
 *
 * @param {*} value paymentTiming / engagementType / mappingEngagementType
 * @returns {string|null}
 */
export function normalizeEngagementTypeValue(value) {
  if (value == null) {
    return null;
  }
  const normalized = String(value).trim().toUpperCase();
  if (!normalized) {
    return null;
  }
  if (normalized === INSTITUTION_LINK_VALUE) {
    return INSTITUTION_LINK_VALUE;
  }
  if (normalized === VOUCHER_VALUE) {
    return VOUCHER_VALUE;
  }
  if (normalized === SESSION_TICKET_VALUE) {
    return SESSION_TICKET_VALUE;
  }
  return null;
}

/**
 * @param {*} value
 * @returns {boolean}
 */
export function isInstitutionLinkEngagement(value) {
  return normalizeEngagementTypeValue(value) === INSTITUTION_LINK_VALUE;
}

/**
 * @param {*} value
 * @returns {boolean}
 */
export function isVoucherEngagement(value) {
  return normalizeEngagementTypeValue(value) === VOUCHER_VALUE;
}

const collectEngagementCandidates = (source) => {
  if (source == null || typeof source !== 'object') {
    return [];
  }
  const ext = source.extendedProps && typeof source.extendedProps === 'object'
    ? source.extendedProps
    : null;
  const mapping = source.mapping && typeof source.mapping === 'object'
    ? source.mapping
    : null;
  const mappingInfo = source.mappingInfo && typeof source.mappingInfo === 'object'
    ? source.mappingInfo
    : null;
  return [
    source.engagementType,
    source.mappingEngagementType,
    source.clientEngagementType,
    source.paymentTiming,
    ext && ext.engagementType,
    ext && ext.mappingEngagementType,
    ext && ext.clientEngagementType,
    ext && ext.paymentTiming,
    mapping && mapping.engagementType,
    mapping && mapping.mappingEngagementType,
    mapping && mapping.clientEngagementType,
    mapping && mapping.paymentTiming,
    mappingInfo && mappingInfo.engagementType,
    mappingInfo && mappingInfo.mappingEngagementType,
    mappingInfo && mappingInfo.clientEngagementType,
    mappingInfo && mappingInfo.paymentTiming
  ];
};

/**
 * 매핑·이벤트에서 계약 유형을 해석한다. rem=0 으로는 추정하지 않는다.
 *
 * @param {object|string|null|undefined} source
 * @returns {string|null} INSTITUTION_LINK | VOUCHER | SESSION_TICKET | null
 */
export function resolveMappingEngagementType(source) {
  if (typeof source === 'string') {
    return normalizeEngagementTypeValue(source);
  }
  const candidates = collectEngagementCandidates(source);
  for (let i = 0; i < candidates.length; i += 1) {
    const resolved = normalizeEngagementTypeValue(candidates[i]);
    if (resolved === INSTITUTION_LINK_VALUE || resolved === VOUCHER_VALUE) {
      return resolved;
    }
  }
  for (let i = 0; i < candidates.length; i += 1) {
    const resolved = normalizeEngagementTypeValue(candidates[i]);
    if (resolved === SESSION_TICKET_VALUE) {
      return SESSION_TICKET_VALUE;
    }
  }
  return null;
}

/**
 * 배지를 그릴 유형인지. 회기권·데이터 없음은 false.
 *
 * @param {object|string|null|undefined} typeOrSource
 * @returns {boolean}
 */
export function shouldRenderEngagementTypeBadge(typeOrSource) {
  const resolved = typeof typeOrSource === 'string'
    ? normalizeEngagementTypeValue(typeOrSource)
    : resolveMappingEngagementType(typeOrSource);
  return resolved === INSTITUTION_LINK_VALUE || resolved === VOUCHER_VALUE;
}

/**
 * @param {object|null|undefined} source
 * @returns {string|null}
 */
export function resolveScheduleMappingId(source) {
  if (source == null || typeof source !== 'object') {
    return null;
  }
  const ext = source.extendedProps && typeof source.extendedProps === 'object'
    ? source.extendedProps
    : {};
  const mappingId = ext.mappingId
    ?? ext.scheduleMappingId
    ?? ext.mapping_id
    ?? source.mappingId
    ?? source.scheduleMappingId
    ?? null;
  if (mappingId == null || mappingId === '') {
    return null;
  }
  return mappingId;
}

/**
 * @param {Map|object|null|undefined} lookupInput
 * @param {string|number|null|undefined} mappingId
 * @returns {*|null}
 */
export function lookupPaymentTimingByMappingId(lookupInput, mappingId) {
  if (lookupInput == null || mappingId == null) {
    return null;
  }
  const key = String(mappingId);
  if (lookupInput instanceof Map) {
    if (lookupInput.has(mappingId)) {
      return lookupInput.get(mappingId);
    }
    if (lookupInput.has(key)) {
      return lookupInput.get(key);
    }
    return null;
  }
  if (typeof lookupInput === 'object') {
    if (Object.prototype.hasOwnProperty.call(lookupInput, mappingId)) {
      return lookupInput[mappingId];
    }
    if (Object.prototype.hasOwnProperty.call(lookupInput, key)) {
      return lookupInput[key];
    }
  }
  return null;
}

/**
 * 캘린더 이벤트에 매핑 paymentTiming 을 복사한다. remaining 필드는 건드리지 않는다.
 *
 * @param {Array<object>} events
 * @param {Map|object|null|undefined} mappingPaymentTimingByMappingId
 * @returns {Array<object>}
 */
export function stampPaymentTimingOnScheduleEvents(events, mappingPaymentTimingByMappingId) {
  if (!Array.isArray(events) || events.length === 0) {
    return Array.isArray(events) ? events : [];
  }
  if (mappingPaymentTimingByMappingId == null) {
    return events;
  }
  return events.map((event) => {
    if (!event || typeof event !== 'object') {
      return event;
    }
    const ext = event.extendedProps && typeof event.extendedProps === 'object'
      ? event.extendedProps
      : {};
    if (ext.paymentTiming != null || ext.engagementType != null || ext.mappingEngagementType != null) {
      return event;
    }
    const mappingId = resolveScheduleMappingId(event);
    const timing = lookupPaymentTimingByMappingId(mappingPaymentTimingByMappingId, mappingId);
    if (timing == null) {
      return event;
    }
    return {
      ...event,
      extendedProps: {
        ...ext,
        paymentTiming: timing
      }
    };
  });
}
