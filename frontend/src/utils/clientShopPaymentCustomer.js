/**
 * 샵 PortOne V2 customer — 세션 필드 매핑·fail-closed 해석.
 * 결제 게이트 fail-closed = 휴대폰 OTP verified ONLY.
 * 이메일·이름은 SDK용 soft fill (BE prepare synthetic email SSOT).
 * SNS OAuth claim 은 휴대폰 인증 대체 불가.
 *
 * @author MindGarden
 * @since 2026-09-18
 */

import {
  PORTONE_CUSTOMER_DISPLAY_NAME_FALLBACK,
  SHOP_PAYMENT_LAUNCH_COPY
} from '../constants/clientShopConstants';
import {
  isValidKoreanMobileDigits,
  normalizeKoreanMobileDigits
} from './koreanMobilePhone';

/**
 * @param {*} value
 * @returns {string|null}
 */
const nonBlankTrimmed = (value) => {
  if (value == null) {
    return null;
  }
  const trimmed = String(value).trim();
  return trimmed || null;
};

/**
 * 한국 휴대폰이면 정규화된 숫자열, 아니면 null.
 *
 * @param {*} value
 * @returns {string|null}
 */
const resolveValidKoreanMobile = (value) => {
  const raw = nonBlankTrimmed(value);
  if (!raw) {
    return null;
  }
  const digits = normalizeKoreanMobileDigits(raw);
  if (!isValidKoreanMobileDigits(digits)) {
    return null;
  }
  return digits;
};

/**
 * 세션 user에서 계정 이메일을 꺼낸다 (email → userEmail).
 *
 * @param {object|null|undefined} user
 * @returns {string|null}
 */
export const resolveSessionEmail = (user) => {
  if (!user || typeof user !== 'object') {
    return null;
  }
  return nonBlankTrimmed(user.email) || nonBlankTrimmed(user.userEmail);
};

/**
 * 세션 user에서 표시 이름(fullName)을 꺼낸다 (name → nickname).
 *
 * @param {object|null|undefined} user
 * @returns {string|null}
 */
export const resolveSessionFullName = (user) => {
  if (!user || typeof user !== 'object') {
    return null;
  }
  return nonBlankTrimmed(user.name) || nonBlankTrimmed(user.nickname);
};

/**
 * 세션 user에서 유효한 한국 휴대폰 번호를 꺼낸다 (phone → phoneNumber → mobile).
 *
 * @param {object|null|undefined} user
 * @returns {string|null}
 */
export const resolveSessionPhoneNumber = (user) => {
  if (!user || typeof user !== 'object') {
    return null;
  }
  return (
    resolveValidKoreanMobile(user.phone) ||
    resolveValidKoreanMobile(user.phoneNumber) ||
    resolveValidKoreanMobile(user.mobile)
  );
};

/**
 * 세션 user의 휴대폰 OTP 소유 확인 여부 (boolean true 만 통과).
 *
 * @param {object|null|undefined} user
 * @returns {boolean}
 */
export const resolveSessionPhoneVerified = (user) => {
  if (!user || typeof user !== 'object') {
    return false;
  }
  return user.isPhoneVerified === true || user.phoneVerified === true;
};

/**
 * 결제용 휴대폰: 유효 KR 번호 + OTP verified.
 * verified 플래그가 있어도 세션 번호와 불일치하면 fail-closed.
 *
 * @param {object|null|undefined} user
 * @returns {string|null} 정규화된 휴대폰 숫자열
 */
export const resolveSessionVerifiedPhoneNumber = (user) => {
  const phoneNumber = resolveSessionPhoneNumber(user);
  if (!phoneNumber) {
    return null;
  }
  if (!resolveSessionPhoneVerified(user)) {
    return null;
  }
  return phoneNumber;
};

/**
 * PortOne V2 customer — 게이트 SSOT는 verified phone ONLY.
 * email은 세션 OAuth가 있으면 채우고, 없으면 null( BE prepare 응답이 SSOT ).
 * fullName은 세션 이름 또는 SDK soft fallback.
 *
 * @param {{ user?: object|null }} [params]
 * @returns {{
 *   email: string|null,
 *   fullName: string,
 *   phoneNumber: string,
 *   phoneVerified: true
 * }|null}
 */
export const resolvePortOneCustomer = ({ user } = {}) => {
  const phoneNumber = resolveSessionVerifiedPhoneNumber(user);
  if (!phoneNumber) {
    return null;
  }
  const email = resolveSessionEmail(user);
  const fullName =
    resolveSessionFullName(user) || PORTONE_CUSTOMER_DISPLAY_NAME_FALLBACK;
  return { email, fullName, phoneNumber, phoneVerified: true };
};

/**
 * 세션 user에서 PortOne V2 customer 객체를 만든다.
 *
 * @param {object|null|undefined} user
 * @returns {{
 *   email: string|null,
 *   fullName: string,
 *   phoneNumber: string,
 *   phoneVerified: true
 * }|null}
 */
export const buildPortOneCustomerFromUser = (user) => resolvePortOneCustomer({ user });

/**
 * preparePayment 응답의 customerEmail·customerName 을 PortOne customer에 병합.
 * 세션 값이 있으면 유지하고, 비어 있을 때만 BE 값을 채운다 (합성 이메일은 BE SSOT).
 *
 * @param {object|null|undefined} customer
 * @param {object|null|undefined} prepareResult
 * @returns {object|null}
 */
export const mergePortOneCustomerFromPrepare = (customer, prepareResult) => {
  if (!customer || typeof customer !== 'object') {
    return customer || null;
  }
  const preparedEmail =
    prepareResult && typeof prepareResult === 'object'
      ? nonBlankTrimmed(prepareResult.customerEmail)
      : null;
  const preparedName =
    prepareResult && typeof prepareResult === 'object'
      ? nonBlankTrimmed(prepareResult.customerName)
      : null;
  return {
    ...customer,
    email: nonBlankTrimmed(customer.email) || preparedEmail,
    fullName:
      nonBlankTrimmed(customer.fullName)
      || preparedName
      || PORTONE_CUSTOMER_DISPLAY_NAME_FALLBACK
  };
};

/**
 * 세션 customer가 결제 게이트 미충족일 때 한글 메시지 (충족이면 null).
 * 우선순위: phone missing → phone unverified. 이메일·이름은 게이트 아님.
 *
 * @param {object|null|undefined} user
 * @returns {string|null}
 */
export const resolvePortOneCustomerFailMessage = (user) => {
  if (!resolveSessionPhoneNumber(user)) {
    return SHOP_PAYMENT_LAUNCH_COPY.CUSTOMER_PHONE_REQUIRED;
  }
  if (!resolveSessionPhoneVerified(user)) {
    return SHOP_PAYMENT_LAUNCH_COPY.CUSTOMER_PHONE_UNVERIFIED;
  }
  return null;
};

/**
 * PortOne 요청용 customer — verified phone 필수.
 * fullName은 soft fallback. email은 호출 전 prepare 병합 권장(BE SSOT).
 * 이메일 부재는 설정 입력을 요구하지 않으며 모듈 안내로만 실패한다.
 *
 * @param {*} customer
 * @returns {{ email: string, fullName: string, phoneNumber: string, phoneVerified: true }}
 */
export const requireCompletePortOneCustomer = (customer) => {
  if (!customer || typeof customer !== 'object') {
    throw new Error(SHOP_PAYMENT_LAUNCH_COPY.CUSTOMER_PHONE_REQUIRED);
  }
  const phoneNumber =
    nonBlankTrimmed(customer.phoneNumber) || nonBlankTrimmed(customer.phone);
  if (!phoneNumber) {
    throw new Error(SHOP_PAYMENT_LAUNCH_COPY.CUSTOMER_PHONE_REQUIRED);
  }
  const digits = normalizeKoreanMobileDigits(phoneNumber);
  if (!isValidKoreanMobileDigits(digits)) {
    throw new Error(SHOP_PAYMENT_LAUNCH_COPY.CUSTOMER_PHONE_REQUIRED);
  }
  const verified =
    customer.phoneVerified === true || customer.isPhoneVerified === true;
  if (!verified) {
    throw new Error(SHOP_PAYMENT_LAUNCH_COPY.CUSTOMER_PHONE_UNVERIFIED);
  }
  const fullName =
    nonBlankTrimmed(customer.fullName) || PORTONE_CUSTOMER_DISPLAY_NAME_FALLBACK;
  const email = nonBlankTrimmed(customer.email);
  if (!email) {
    // FE는 합성 도메인을 만들지 않음 — BE prepare customerEmail 병합 누락 시
    throw new Error(SHOP_PAYMENT_LAUNCH_COPY.MODULE_UNAVAILABLE);
  }
  return {
    ...customer,
    email,
    fullName,
    phoneNumber: digits,
    phoneVerified: true
  };
};

/**
 * 체크아웃(create) 전에 PortOne customer 준비 여부 — phone verified ONLY.
 *
 * @param {object|null|undefined} user
 * @returns {{
 *   ready: boolean,
 *   customer: {
 *     email: string|null,
 *     fullName: string,
 *     phoneNumber: string,
 *     phoneVerified: true
 *   }|null,
 *   message: string|null
 * }}
 */
export const assertPortOneCustomerReadyBeforeCheckout = (user) => {
  const customer = buildPortOneCustomerFromUser(user);
  if (!customer) {
    return {
      ready: false,
      customer: null,
      message:
        resolvePortOneCustomerFailMessage(user)
        || SHOP_PAYMENT_LAUNCH_COPY.CUSTOMER_PHONE_REQUIRED
    };
  }
  return { ready: true, customer, message: null };
};
