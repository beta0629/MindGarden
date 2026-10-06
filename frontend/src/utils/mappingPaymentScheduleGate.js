/**
 * 매핑 결제 상태·결제 시점 게이트.
 * 백엔드 `MappingPaymentScheduleGate` 와 같은 판정이다.
 *
 * 결제 대기 매핑의 일정도 확정할 수 있다. 회기 차감·다른 매핑 대체 차감은 결제 후에만 한다.
 * 선납(ADVANCE) 결제 대기는 가예약을 새로 만들 수 없고, 사후 카드(SAME_DAY_CARD) 결제 대기는 가예약을 허용한다.
 * 회기 표시(usedSessions / sessionSequence)는 이 모듈의 책임이 아니다.
 *
 * @author CoreSolution
 * @since 2026-10-05
 */

import {
  PAYMENT_METHOD_CODE_BANK_TRANSFER,
  PAYMENT_METHOD_CODE_CREDIT_CARD,
  PAYMENT_METHOD_LEGACY_ALIAS_CARD,
  isCardPaymentMethod
} from './paymentMethodSsot';

/** 백엔드 MappingStatus.PENDING_PAYMENT */
export const GATE_STATUS_PENDING_PAYMENT = 'PENDING_PAYMENT';

/** 백엔드 MappingStatus.ACTIVE */
export const GATE_STATUS_ACTIVE = 'ACTIVE';

/** 백엔드 PaymentTimingConstants.SAME_DAY_CARD */
export const GATE_TIMING_SAME_DAY_CARD = 'SAME_DAY_CARD';

/** 백엔드 PaymentTimingConstants.INSTITUTION_LINK */
export const GATE_TIMING_INSTITUTION_LINK = 'INSTITUTION_LINK';

const normalizeCode = (value) => {
  if (value == null || value === '') {
    return '';
  }
  return String(value).trim().toUpperCase();
};

/**
 * 결제 대기(미입금) 상태인지.
 *
 * @param {string|null|undefined} status
 * @returns {boolean}
 */
export const isUnpaidPendingPaymentStatus = (status) =>
  normalizeCode(status) === GATE_STATUS_PENDING_PAYMENT;

/**
 * PENDING_PAYMENT + SAME_DAY_CARD.
 *
 * @param {object|null|undefined} mapping
 * @returns {boolean}
 */
export const isSameDayCardPendingPayment = (mapping) => {
  if (!mapping || typeof mapping !== 'object') {
    return false;
  }
  return isUnpaidPendingPaymentStatus(mapping.status)
    && normalizeCode(mapping.paymentTiming) === GATE_TIMING_SAME_DAY_CARD;
};

/**
 * 입금 전 가예약 허용. ACTIVE(기관연계 제외) 또는 사후 카드 결제 대기.
 *
 * @param {object|null|undefined} mapping
 * @returns {boolean}
 */
export const allowsTentativeBeforeDeposit = (mapping) => {
  if (!mapping || typeof mapping !== 'object') {
    return false;
  }
  const timing = normalizeCode(mapping.paymentTiming);
  if (timing === GATE_TIMING_INSTITUTION_LINK) {
    return false;
  }
  if (normalizeCode(mapping.status) === GATE_STATUS_ACTIVE) {
    return true;
  }
  return isSameDayCardPendingPayment(mapping);
};

/**
 * 일정 확정 허용. 상태가 있는 매핑이면 결제 대기여도 허용한다(차감은 결제 후).
 *
 * @param {object|null|undefined} mapping
 * @returns {boolean}
 */
export const allowsScheduleConfirm = (mapping) =>
  Boolean(mapping && typeof mapping === 'object' && mapping.status);

/**
 * 이 매핑의 회기를 다른 매핑으로 대체 차감하면 안 되는지.
 *
 * @param {object|null|undefined} mapping
 * @returns {boolean}
 */
export const blocksSessionConsumeFallback = (mapping) => {
  if (!mapping || typeof mapping !== 'object') {
    return false;
  }
  return isUnpaidPendingPaymentStatus(mapping.status);
};

/**
 * 사후 카드 매칭 생성 시 결제 수단 기본값.
 * 공통코드에 카드 행이 있으면 그 codeValue, 없으면 모달 폴백 옵션 `CARD`.
 *
 * @param {Array<{codeValue?: string, extraData?: string}>|null|undefined} [codes]
 * @returns {string}
 */
export const defaultSameDayCardPaymentMethod = (codes) => {
  if (Array.isArray(codes) && codes.length > 0) {
    const credit = codes.find((row) =>
      normalizeCode(row?.codeValue) === PAYMENT_METHOD_CODE_CREDIT_CARD);
    if (credit?.codeValue) {
      return credit.codeValue;
    }
    const card = codes.find((row) => isCardPaymentMethod(row?.codeValue, codes));
    if (card?.codeValue) {
      return card.codeValue;
    }
  }
  return PAYMENT_METHOD_LEGACY_ALIAS_CARD;
};

/**
 * 매칭 생성 결제 수단을 결제 시점에 맞춘다.
 * 사후 카드를 골랐는데 수단이 선납 기본값(계좌이체)이면 카드로 바꾼다.
 * 사용자가 고른 다른 수단은 유지한다. 사후 카드에서 벗어나면 자동 카드 기본값만 계좌이체로 되돌린다.
 *
 * @param {object} input
 * @param {string|null|undefined} input.nextTiming
 * @param {string|null|undefined} [input.paymentMethod]
 * @param {string|null|undefined} [input.previousTiming]
 * @param {Array<{codeValue?: string, extraData?: string}>|null|undefined} [input.codes]
 * @returns {string}
 */
export const alignMappingCreatePaymentMethod = ({
  nextTiming,
  paymentMethod,
  previousTiming,
  codes
} = {}) => {
  const next = normalizeCode(nextTiming);
  const previous = normalizeCode(previousTiming);
  const method = paymentMethod || PAYMENT_METHOD_CODE_BANK_TRANSFER;
  const cardDefault = defaultSameDayCardPaymentMethod(codes);
  // 시점을 사후 카드로 바꾸는 순간에만 선납 기본값(계좌이체)을 카드로 맞춘다.
  // 이미 사후 카드인 상태에서 계좌이체를 다시 고른 값은 유지한다.
  if (next === GATE_TIMING_SAME_DAY_CARD
      && previous !== GATE_TIMING_SAME_DAY_CARD
      && normalizeCode(method) === PAYMENT_METHOD_CODE_BANK_TRANSFER) {
    return cardDefault;
  }
  if (next !== GATE_TIMING_SAME_DAY_CARD
      && previous === GATE_TIMING_SAME_DAY_CARD
      && normalizeCode(method) === normalizeCode(cardDefault)) {
    return PAYMENT_METHOD_CODE_BANK_TRANSFER;
  }
  return method;
};
