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
 * PortOne V2 customer SSOT.
 * 이메일: 세션(user.email|userEmail) 우선, 없으면 checkoutEmail.
 * 이메일이 없으면 null (가짜 이메일 생성 금지).
 *
 * @param {{ user?: object|null, checkoutEmail?: string|null }} [params]
 * @returns {{ email: string, fullName?: string, phoneNumber?: string }|null}
 */
export const resolvePortOneCustomer = ({ user, checkoutEmail } = {}) => {
  const sessionEmail = resolveSessionEmail(user);
  const email = sessionEmail || nonBlankTrimmed(checkoutEmail);
  if (!email) {
    return null;
  }

  const customer = { email };
  if (user && typeof user === 'object') {
    const fullName = nonBlankTrimmed(user.name) || nonBlankTrimmed(user.nickname);
    if (fullName) {
      customer.fullName = fullName;
    }
    const phoneNumber = nonBlankTrimmed(user.phone) || nonBlankTrimmed(user.phoneNumber);
    if (phoneNumber) {
      customer.phoneNumber = phoneNumber;
    }
  }
  return customer;
};

/**
 * 세션 user에서 PortOne V2 customer 객체를 만든다.
 * 이메일이 없으면 null (가짜 이메일 생성 금지).
 *
 * @param {object|null|undefined} user
 * @returns {{ email: string, fullName?: string, phoneNumber?: string }|null}
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
 * prepare DTO로 결제 UI를 연다.
 *
 * @param {object|null|undefined} prepareResult prepareShopPayment 언랩 결과
 * @param {{ orderName?: string, customer?: { email: string, fullName?: string, phoneNumber?: string } }} [options]
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
    const customerEmail = resolveCustomerEmail(options.customer);
    if (!customerEmail) {
      throw new Error(SHOP_PAYMENT_LAUNCH_COPY.CUSTOMER_EMAIL_REQUIRED);
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
          email: customerEmail
        }
      };
      if (prepareResult.card && typeof prepareResult.card === 'object') {
        paymentRequest.card = prepareResult.card;
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
