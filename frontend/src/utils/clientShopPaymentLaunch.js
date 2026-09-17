/**
 * 내담자 샵 prepare 응답 → PortOne SDK 또는 paymentUrl 결제 진입.
 *
 * @author MindGarden
 * @since 2026-09-17
 */

import {
  SHOP_CHECKOUT_ERROR_COPY,
  SHOP_PAYMENT_LAUNCH_COPY
} from '../constants/clientShopConstants';
import { verifyShopPayment } from '../services/clientShopService';
import {
  isValidKoreanMobileDigits,
  normalizeKoreanMobileDigits
} from './koreanMobilePhone';
import { requestPortOnePayment } from './portonePayment';

/**
 * BE simulate / 미연동 더미 paymentUrl 여부 (example.com 계열).
 *
 * @param {string} paymentUrl
 * @returns {boolean}
 */
const isDummyExamplePaymentUrl = (paymentUrl) => {
  if (!paymentUrl || typeof paymentUrl !== 'string') {
    return false;
  }
  const trimmed = paymentUrl.trim();
  if (!trimmed) {
    return false;
  }
  try {
    const host = new URL(trimmed).hostname.toLowerCase();
    return host === 'example.com' || host.endsWith('.example.com');
  } catch {
    return /example\.com/i.test(trimmed);
  }
};

/**
 * PortOne SDK 거절값(string / Error / {message,code} / 빈 메시지)을 Error로 정규화한다.
 *
 * @param {*} error
 * @param {string} fallback
 * @returns {Error}
 */
const toPortOneError = (error, fallback) => {
  if (error instanceof Error) {
    const msg = typeof error.message === 'string' ? error.message.trim() : '';
    return new Error(msg || fallback);
  }
  if (typeof error === 'string') {
    const msg = error.trim();
    return new Error(msg || fallback);
  }
  if (error && typeof error === 'object') {
    const msg = typeof error.message === 'string' ? error.message.trim() : '';
    if (msg) {
      return new Error(msg);
    }
    if (error.code != null && String(error.code).trim()) {
      return new Error(`결제 모듈 오류: ${error.code}`);
    }
  }
  return new Error(fallback);
};

/**
 * 비어 있지 않은 문자열만 반환한다.
 *
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
 * 결제용 이메일 형식의 최소 검증 (trim + local@domain).
 *
 * @param {*} value
 * @returns {boolean}
 */
export const isPortOneCustomerEmailFormat = (value) => {
  const email = nonBlankTrimmed(value);
  if (!email) {
    return false;
  }
  return /^[^\s@]+@[^\s@]+$/.test(email);
};

/**
 * 결제용 휴대폰 형식 검증 (한국 모바일 정규화 후).
 *
 * @param {*} value
 * @returns {boolean}
 */
export const isPortOneCustomerPhoneFormat = (value) =>
  Boolean(resolveValidKoreanMobile(value));

/**
 * PortOne V2 customer SSOT.
 * email / fullName / phoneNumber 모두 필수.
 * 우선순위: 세션 계정 필드 → checkout 입력. 하나라도 없으면 null (가짜 값 생성 금지).
 *
 * @param {{
 *   user?: object|null,
 *   checkoutEmail?: string|null,
 *   checkoutFullName?: string|null,
 *   checkoutPhone?: string|null
 * }} [params]
 * @returns {{ email: string, fullName: string, phoneNumber: string }|null}
 */
export const resolvePortOneCustomer = ({
  user,
  checkoutEmail,
  checkoutFullName,
  checkoutPhone
} = {}) => {
  const email =
    resolveSessionEmail(user) || nonBlankTrimmed(checkoutEmail);
  if (!email) {
    return null;
  }

  const fullName =
    resolveSessionFullName(user) || nonBlankTrimmed(checkoutFullName);
  if (!fullName) {
    return null;
  }

  const phoneNumber =
    resolveSessionPhoneNumber(user) || resolveValidKoreanMobile(checkoutPhone);
  if (!phoneNumber) {
    return null;
  }

  return { email, fullName, phoneNumber };
};

/**
 * 세션 user에서 PortOne V2 customer 객체를 만든다.
 * email·fullName·phoneNumber가 모두 없으면 null (가짜 값 생성 금지).
 *
 * @param {object|null|undefined} user
 * @returns {{ email: string, fullName: string, phoneNumber: string }|null}
 */
export const buildPortOneCustomerFromUser = (user) => resolvePortOneCustomer({ user });

/**
 * PortOne 요청용 customer.email 유효성 (fail-closed).
 *
 * @param {*} customer
 * @returns {string|null} trim된 email 또는 null
 */
const resolveCustomerEmail = (customer) => {
  if (!customer || typeof customer !== 'object') {
    return null;
  }
  return nonBlankTrimmed(customer.email);
};

/**
 * PortOne 요청용 customer.fullName 유효성 (fail-closed).
 *
 * @param {*} customer
 * @returns {string|null}
 */
const resolveCustomerFullName = (customer) => {
  if (!customer || typeof customer !== 'object') {
    return null;
  }
  return nonBlankTrimmed(customer.fullName);
};

/**
 * PortOne 요청용 customer.phoneNumber 유효성 (phone 별칭 허용).
 *
 * @param {*} customer
 * @returns {string|null}
 */
const resolveCustomerPhoneNumber = (customer) => {
  if (!customer || typeof customer !== 'object') {
    return null;
  }
  return (
    resolveValidKoreanMobile(customer.phoneNumber) ||
    resolveValidKoreanMobile(customer.phone)
  );
};

/**
 * prepare DTO로 결제 UI를 연다.
 *
 * @param {object|null|undefined} prepareResult prepareShopPayment 언랩 결과
 * @param {{
 *   orderName?: string,
 *   customer?: { email: string, fullName: string, phoneNumber?: string, phone?: string }
 * }} [options]
 * @returns {Promise<{ mode: 'portone'|'url', paymentUrl?: string }>}
 */
export const launchShopPaymentFromPrepare = async(prepareResult, options = {}) => {
  const orderName =
    (options.orderName && String(options.orderName).trim()) ||
    SHOP_PAYMENT_LAUNCH_COPY.ORDER_NAME;

  const rawCash = prepareResult?.cashAmount;
  if (rawCash != null && typeof rawCash === 'object') {
    throw new Error(SHOP_CHECKOUT_ERROR_COPY.INVALID_CASH_AMOUNT);
  }
  const cashAmount = Number(rawCash);
  const canUsePortOne =
    prepareResult?.pgReady === true &&
    prepareResult?.storeId &&
    prepareResult?.channelKey &&
    prepareResult?.paymentId &&
    Number.isFinite(cashAmount) &&
    cashAmount > 0;

  if (canUsePortOne) {
    // SSOT: PortOne 진입은 prepare.testMode === true 일 때만 허용 (fail-closed)
    if (prepareResult.testMode !== true) {
      throw new Error(SHOP_PAYMENT_LAUNCH_COPY.TEST_MODE_REQUIRED);
    }

    const customerEmail = resolveCustomerEmail(options.customer);
    if (!customerEmail) {
      throw new Error(SHOP_PAYMENT_LAUNCH_COPY.CUSTOMER_EMAIL_REQUIRED);
    }
    const customerFullName = resolveCustomerFullName(options.customer);
    if (!customerFullName) {
      throw new Error(SHOP_PAYMENT_LAUNCH_COPY.CUSTOMER_FULL_NAME_REQUIRED);
    }
    const customerPhoneNumber = resolveCustomerPhoneNumber(options.customer);
    if (!customerPhoneNumber) {
      throw new Error(SHOP_PAYMENT_LAUNCH_COPY.CUSTOMER_PHONE_REQUIRED);
    }

    let portOneResult;
    try {
      const paymentRequest = {
        storeId: prepareResult.storeId,
        channelKey: prepareResult.channelKey,
        paymentId: prepareResult.paymentId,
        orderName,
        totalAmount: cashAmount,
        currency: 'KRW',
        payMethod: (prepareResult.payMethod && String(prepareResult.payMethod).trim()) || 'CARD',
        customer: {
          ...options.customer,
          email: customerEmail,
          fullName: customerFullName,
          phoneNumber: customerPhoneNumber
        }
      };
      if (prepareResult.card && typeof prepareResult.card === 'object') {
        paymentRequest.card = prepareResult.card;
      }
      const orderPublicId = nonBlankTrimmed(prepareResult.orderPublicId);
      if (orderPublicId) {
        paymentRequest.customData = { orderPublicId };
      }
      portOneResult = await requestPortOnePayment(paymentRequest);
    } catch (error) {
      throw toPortOneError(error, SHOP_CHECKOUT_ERROR_COPY.PAYMENT_LAUNCH_FAILED);
    }
    if (portOneResult?.code) {
      throw new Error(
        (typeof portOneResult.message === 'string' && portOneResult.message.trim())
          || `결제 모듈 오류: ${portOneResult.code}`
      );
    }
    // P0: SDK 성공 후 BE verify 필수 (웹훅만 의존하면 PENDING_PAYMENT 잔존)
    await verifyShopPayment(prepareResult.paymentId, cashAmount);
    return { mode: 'portone' };
  }

  const paymentUrl = prepareResult?.paymentUrl;
  if (paymentUrl) {
    // BE simulate 더미(example.com)는 pgReady 여부와 관계없이 성공 경로로 열지 않음
    if (isDummyExamplePaymentUrl(paymentUrl)) {
      throw new Error(SHOP_PAYMENT_LAUNCH_COPY.MODULE_UNAVAILABLE);
    }
    window.open(
      paymentUrl,
      '_blank',
      SHOP_PAYMENT_LAUNCH_COPY.WINDOW_FEATURES
    );
    return { mode: 'url', paymentUrl };
  }

  throw new Error(SHOP_PAYMENT_LAUNCH_COPY.MODULE_UNAVAILABLE);
};
