/**
 * 샵 PortOne V2 customer — 세션 필드 매핑·fail-closed 해석.
 * (prod clientShopPaymentLaunch 패턴을 이 브랜치에 맞게 분리)
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
 * PortOne V2 customer SSOT.
 * email / fullName / phoneNumber 모두 필수. 하나라도 없으면 null (가짜 값 생성 금지).
 *
 * @param {{ user?: object|null }} [params]
 * @returns {{ email: string, fullName: string, phoneNumber: string }|null}
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
  const phoneNumber = resolveSessionPhoneNumber(user);
  if (!phoneNumber) {
    return null;
  }
  return { email, fullName, phoneNumber };
};

/**
 * 세션 user에서 PortOne V2 customer 객체를 만든다.
 *
 * @param {object|null|undefined} user
 * @returns {{ email: string, fullName: string, phoneNumber: string }|null}
 */
export const buildPortOneCustomerFromUser = (user) => resolvePortOneCustomer({ user });

/**
 * 세션 customer가 불완전할 때 fail-closed 한글 메시지 (완전하면 null).
 * 우선순위: email → fullName → phone.
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
  return null;
};
