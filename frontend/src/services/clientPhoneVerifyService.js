/**
 * 결제 흐름 휴대폰 인증 — 기존 설정 화면과 같은 API 재사용 (새 SMS 연동 없음).
 * 발송: AUTH_API.SMS_SEND (purpose PHONE_CHANGE) · 확인: MYPAGE_API.CHANGE_PHONE
 *
 * @author MindGarden
 * @since 2026-09-29
 */

import StandardizedApi from '../utils/standardizedApi';
import { AUTH_API, MYPAGE_API } from '../constants/api';
import { parseOtpServerMeta } from '../utils/clientMallPhoneVerify';

const OTP_PURPOSE_PHONE_CHANGE = 'PHONE_CHANGE';

/**
 * @param {string} phoneDigits
 * @returns {Promise<{ deliveryChannel: string|null, meta: ReturnType<typeof parseOtpServerMeta> }>}
 */
export const sendPhoneVerificationCode = async(phoneDigits) => {
  const response = await StandardizedApi.post(AUTH_API.SMS_SEND, {
    phoneNumber: phoneDigits,
    purpose: OTP_PURPOSE_PHONE_CHANGE
  });
  if (!response || response.success === false) {
    const err = new Error(response?.message || '');
    err.response = { data: response };
    throw err;
  }
  return {
    deliveryChannel: response.deliveryChannel || null,
    meta: parseOtpServerMeta(response)
  };
};

/**
 * @param {string} phoneDigits
 * @param {string} code 6자리
 * @returns {Promise<{ phone?: string, phoneVerifiedAt?: string }>}
 */
export const confirmPhoneVerificationCode = async(phoneDigits, code) => {
  const response = await StandardizedApi.post(MYPAGE_API.CHANGE_PHONE, {
    newPhoneNumber: phoneDigits,
    verificationCode: code
  });
  if (response && response.success === false) {
    const err = new Error(response.message || '');
    err.response = { data: response };
    throw err;
  }
  return response || {};
};
