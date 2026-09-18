/**
 * 샵 PortOne V2 customer — 세션 필드 매핑·fail-closed 해석.
 * 휴대폰은 번호 존재 ≠ verified. OTP 소유 확인(isPhoneVerified) 필수.
 * SNS OAuth claim 은 인증 대체 불가.
 *
 * @author MindGarden
 * @since 2026-09-18
 */

import { SHOP_PAYMENT_LAUNCH_COPY } from '../constants/clientShopConstants';
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
 * 세션 user에서 유효한 한국 휴대폰 번호를 꺼낸다 (phone → phoneNumber).
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
    resolveValidKoreanMobile(user.phoneNumber)
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
 * PortOne V2 customer SSOT.
 * email / fullName / verified phone 모두 필수. 하나라도 없으면 null (가짜 값 생성 금지).
 *
 * @param {{ user?: object|null }} [params]
 * @returns {{ email: string, fullName: string, phoneNumber: string, phoneVerified: true }|null}
 */
export const resolvePortOneCustomer = ({ user } = {}) => {
  const email = resolveSessionEmail(user);
  if (!email) {
    return null;
  }
  const fullName = resolveSessionFullName(user);
  if (!fullName) {
    return null;
  }
  const phoneNumber = resolveSessionVerifiedPhoneNumber(user);
  if (!phoneNumber) {
    return null;
  }
  return { email, fullName, phoneNumber, phoneVerified: true };
};

/**
 * 세션 user에서 PortOne V2 customer 객체를 만든다.
 *
 * @param {object|null|undefined} user
 * @returns {{ email: string, fullName: string, phoneNumber: string, phoneVerified: true }|null}
 */
export const buildPortOneCustomerFromUser = (user) => resolvePortOneCustomer({ user });

/**
 * 세션 customer가 불완전할 때 fail-closed 한글 메시지 (완전하면 null).
 * 우선순위: email → fullName → phone missing → phone unverified.
 *
 * @param {object|null|undefined} user
 * @returns {string|null}
 */
export const resolvePortOneCustomerFailMessage = (user) => {
  if (!resolveSessionEmail(user)) {
    return SHOP_PAYMENT_LAUNCH_COPY.CUSTOMER_EMAIL_REQUIRED;
  }
  if (!resolveSessionFullName(user)) {
    return SHOP_PAYMENT_LAUNCH_COPY.CUSTOMER_FULL_NAME_REQUIRED;
  }
  if (!resolveSessionPhoneNumber(user)) {
    return SHOP_PAYMENT_LAUNCH_COPY.CUSTOMER_PHONE_REQUIRED;
  }
  if (!resolveSessionPhoneVerified(user)) {
    return SHOP_PAYMENT_LAUNCH_COPY.CUSTOMER_PHONE_UNVERIFIED;
  }
  return null;
};

/**
 * PortOne 요청용 customer 객체가 완전한지 (email·fullName·phone + phoneVerified).
 * shopPortOneCheckout / portonePayment 공통 SSOT.
 *
 * @param {*} customer
 * @returns {{ email: string, fullName: string, phoneNumber: string, phoneVerified: true }}
 */
export const requireCompletePortOneCustomer = (customer) => {
  if (!customer || typeof customer !== 'object') {
    throw new Error(SHOP_PAYMENT_LAUNCH_COPY.CUSTOMER_EMAIL_REQUIRED);
  }
  const email = nonBlankTrimmed(customer.email);
  if (!email) {
    throw new Error(SHOP_PAYMENT_LAUNCH_COPY.CUSTOMER_EMAIL_REQUIRED);
  }
  const fullName = nonBlankTrimmed(customer.fullName);
  if (!fullName) {
    throw new Error(SHOP_PAYMENT_LAUNCH_COPY.CUSTOMER_FULL_NAME_REQUIRED);
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
  return {
    ...customer,
    email,
    fullName,
    phoneNumber: digits,
    phoneVerified: true
  };
};

/**
 * 체크아웃(create) 전에 PortOne customer 준비 여부를 판정한다.
 * 불완전·미인증이면 ready=false — postShopCheckout 호출 금지(고아 CREATED 주문 방지).
 *
 * @param {object|null|undefined} user
 * @returns {{
 *   ready: boolean,
 *   customer: { email: string, fullName: string, phoneNumber: string, phoneVerified: true }|null,
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
        || SHOP_PAYMENT_LAUNCH_COPY.CUSTOMER_EMAIL_REQUIRED
    };
  }
  return { ready: true, customer, message: null };
};
