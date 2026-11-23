/**
 * 샵 PortOne V2 customer — 세션 필드 매핑·fail-closed 해석.
 * 결제 게이트 fail-closed = 휴대폰 OTP verified ONLY.
 *
 * @author MindGarden
 * @since 2026-05-20
 */
import {
  PORTONE_CUSTOMER_DISPLAY_NAME_FALLBACK,
  SHOP_PAYMENT_LAUNCH_COPY,
} from '@/constants/clientShopConstants';
import { normalizeKoreanMobileDigits } from '@/utils/phoneNormalize';

export type PortOneCustomerSessionUser = {
  email?: string | null;
  userEmail?: string | null;
  name?: string | null;
  nickname?: string | null;
  phone?: string | null;
  phoneNumber?: string | null;
  mobile?: string | null;
  isPhoneVerified?: boolean | null;
  phoneVerified?: boolean | null;
};

export type PortOneCustomer = {
  email: string | null;
  fullName: string;
  phoneNumber: string;
  phoneVerified: true;
};

export type PortOneCompleteCustomer = {
  email: string;
  fullName: string;
  phoneNumber: string;
  phoneVerified: true;
};

const nonBlankTrimmed = (value: unknown): string | null => {
  if (value == null) {
    return null;
  }
  const trimmed = String(value).trim();
  return trimmed || null;
};

const isValidKoreanMobileDigits = (digits: string | null | undefined): boolean => {
  if (!digits) {
    return false;
  }
  return /^01[016789]\d{8}$/.test(digits);
};

const resolveValidKoreanMobile = (value: unknown): string | null => {
  const raw = nonBlankTrimmed(value);
  if (!raw) {
    return null;
  }
  const digits = normalizeKoreanMobileDigits(raw);
  if (!digits || !isValidKoreanMobileDigits(digits)) {
    return null;
  }
  return digits;
};

/**
 * @param user 세션 user
 */
export const resolveSessionEmail = (
  user: PortOneCustomerSessionUser | null | undefined,
): string | null => {
  if (!user || typeof user !== 'object') {
    return null;
  }
  return nonBlankTrimmed(user.email) || nonBlankTrimmed(user.userEmail);
};

/**
 * @param user 세션 user
 */
export const resolveSessionFullName = (
  user: PortOneCustomerSessionUser | null | undefined,
): string | null => {
  if (!user || typeof user !== 'object') {
    return null;
  }
  return nonBlankTrimmed(user.name) || nonBlankTrimmed(user.nickname);
};

/**
 * @param user 세션 user
 */
export const resolveSessionPhoneNumber = (
  user: PortOneCustomerSessionUser | null | undefined,
): string | null => {
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
 * @param user 세션 user
 */
export const resolveSessionPhoneVerified = (
  user: PortOneCustomerSessionUser | null | undefined,
): boolean => {
  if (!user || typeof user !== 'object') {
    return false;
  }
  return user.isPhoneVerified === true || user.phoneVerified === true;
};

/**
 * @param user 세션 user
 */
export const resolveSessionVerifiedPhoneNumber = (
  user: PortOneCustomerSessionUser | null | undefined,
): string | null => {
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
 * @param params.user 세션 user
 */
export const resolvePortOneCustomer = ({
  user,
}: {
  user?: PortOneCustomerSessionUser | null;
} = {}): PortOneCustomer | null => {
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
 * @param user 세션 user
 */
export const buildPortOneCustomerFromUser = (
  user: PortOneCustomerSessionUser | null | undefined,
): PortOneCustomer | null => resolvePortOneCustomer({ user });

/**
 * preparePayment 응답 customerEmail·customerName 병합.
 *
 * @param customer 세션 customer
 * @param prepareResult prepare 응답
 */
export const mergePortOneCustomerFromPrepare = (
  customer: PortOneCustomer | Record<string, unknown> | null | undefined,
  prepareResult: { customerEmail?: string | null; customerName?: string | null } | null | undefined,
): PortOneCustomer | null => {
  if (!customer || typeof customer !== 'object') {
    return null;
  }
  const preparedEmail =
    prepareResult && typeof prepareResult === 'object'
      ? nonBlankTrimmed(prepareResult.customerEmail)
      : null;
  const preparedName =
    prepareResult && typeof prepareResult === 'object'
      ? nonBlankTrimmed(prepareResult.customerName)
      : null;
  const base = customer as PortOneCustomer;
  return {
    ...base,
    email: nonBlankTrimmed(base.email) || preparedEmail,
    fullName:
      nonBlankTrimmed(base.fullName) ||
      preparedName ||
      PORTONE_CUSTOMER_DISPLAY_NAME_FALLBACK,
    phoneNumber: base.phoneNumber,
    phoneVerified: true,
  };
};

/**
 * @param user 세션 user
 */
export const resolvePortOneCustomerFailMessage = (
  user: PortOneCustomerSessionUser | null | undefined,
): string | null => {
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
 *
 * @param customer customer 후보
 */
export const requireCompletePortOneCustomer = (
  customer: PortOneCustomer | Record<string, unknown> | null | undefined,
): PortOneCompleteCustomer => {
  if (!customer || typeof customer !== 'object') {
    throw new Error(SHOP_PAYMENT_LAUNCH_COPY.CUSTOMER_PHONE_REQUIRED);
  }
  const rec = customer as Record<string, unknown>;
  const phoneNumber =
    nonBlankTrimmed(rec.phoneNumber) || nonBlankTrimmed(rec.phone);
  if (!phoneNumber) {
    throw new Error(SHOP_PAYMENT_LAUNCH_COPY.CUSTOMER_PHONE_REQUIRED);
  }
  const digits = normalizeKoreanMobileDigits(phoneNumber);
  if (!digits || !isValidKoreanMobileDigits(digits)) {
    throw new Error(SHOP_PAYMENT_LAUNCH_COPY.CUSTOMER_PHONE_REQUIRED);
  }
  const verified = rec.phoneVerified === true || rec.isPhoneVerified === true;
  if (!verified) {
    throw new Error(SHOP_PAYMENT_LAUNCH_COPY.CUSTOMER_PHONE_UNVERIFIED);
  }
  const fullName =
    nonBlankTrimmed(rec.fullName) || PORTONE_CUSTOMER_DISPLAY_NAME_FALLBACK;
  const email = nonBlankTrimmed(rec.email);
  if (!email) {
    throw new Error(SHOP_PAYMENT_LAUNCH_COPY.MODULE_UNAVAILABLE);
  }
  return {
    email,
    fullName,
    phoneNumber: digits,
    phoneVerified: true,
  };
};

/**
 * 체크아웃(create) 전 PortOne customer 준비 여부.
 *
 * @param user 세션 user
 */
export const assertPortOneCustomerReadyBeforeCheckout = (
  user: PortOneCustomerSessionUser | null | undefined,
): {
  ready: boolean;
  customer: PortOneCustomer | null;
  message: string | null;
} => {
  const customer = buildPortOneCustomerFromUser(user);
  if (!customer) {
    return {
      ready: false,
      customer: null,
      message:
        resolvePortOneCustomerFailMessage(user) ||
        SHOP_PAYMENT_LAUNCH_COPY.CUSTOMER_PHONE_REQUIRED,
    };
  }
  return { ready: true, customer, message: null };
};
