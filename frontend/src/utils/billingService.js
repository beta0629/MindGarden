/**
 * 결제 및 구독 관련 비즈니스 로직 유틸리티
 * 
 * @author CoreSolution
 * @version 2.0.0
 * @since 2025-11-20
 */

import { apiGet, apiPost } from './ajax';
import { getCommonCodes } from './commonCodeUtils';
import { BILLING_API, SUBSCRIPTION_CONSTANTS, CURRENCY_CONSTANTS } from '../constants/billing';
import notificationManager from './notification';

// ============================================
// 공통 코드 그룹 상수
// ============================================

export const COMMON_CODE_GROUPS = {
  SUBSCRIPTION_STATUS: 'SUBSCRIPTION_STATUS',
  BILLING_CYCLE: 'BILLING_CYCLE',
  PG_PROVIDER: 'PG_PROVIDER',
};

// ============================================
// UUID 생성 유틸리티
// ============================================

/**
 * UUID v4 생성
 * @returns {string} UUID 문자열
 */
export function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// ============================================
// 콜백 URL 생성
// ============================================

/**
 * 결제 수단 등록 콜백 URL 생성
 * @param {string} status - 콜백 상태 ('success' | 'fail')
 * @param {string} customerKey - 고객 고유 ID
 * @param {string} tenantId - 테넌트 ID
 * @returns {string} 콜백 URL
 */
export function generateCallbackUrl(status, customerKey, tenantId) {
  const baseUrl = window.location.origin;
  const params = new URLSearchParams({
    status,
    customerKey,
    tenantId,
  });
  return `${baseUrl}/billing/callback?${params.toString()}`;
}

// ============================================
// 결제 수단 관련 서비스
// ============================================

/**
 * 결제 수단 목록 조회
 * @param {string} tenantId - 테넌트 ID
 * @returns {Promise<Array>} 결제 수단 목록
 */
export async function getPaymentMethods(tenantId) {
  try {
    const response = await apiGet(BILLING_API.PAYMENT_METHODS.LIST(tenantId));
    if (response && response.success) {
      return response.data || [];
    }
    return [];
  } catch (err) {
    console.error('결제 수단 목록 조회 실패:', err);
    throw err;
  }
}

/**
 * 결제 수단 등록 (콜백에서 사용)
 * @param {Object} params - 결제 수단 등록 파라미터
 * @param {string} params.paymentMethodToken - PG 토큰
 * @param {string} params.pgProvider - PG 제공자
 * @param {string} params.customerKey - 고객 고유 ID
 * @param {string} params.tenantId - 테넌트 ID
 * @returns {Promise<Object>} 등록된 결제 수단 정보
 */
export async function registerPaymentMethod(params) {
  try {
    const response = await apiPost(BILLING_API.PAYMENT_METHODS.CREATE, params);
    if (response && response.success) {
      return response.data;
    }
    throw new Error(response?.message || '결제 수단 등록에 실패했습니다.');
  } catch (err) {
    console.error('결제 수단 등록 실패:', err);
    throw err;
  }
}

// ============================================
// 구독 관련 서비스
// ============================================

/**
 * 구독 목록 조회
 * @param {string} tenantId - 테넌트 ID
 * @returns {Promise<Array>} 구독 목록
 */
export async function getSubscriptions(tenantId) {
  try {
    const response = await apiGet(BILLING_API.SUBSCRIPTIONS.LIST(tenantId));
    if (response && response.success) {
      return response.data || [];
    }
    return [];
  } catch (err) {
    console.error('구독 목록 조회 실패:', err);
    throw err;
  }
}

/**
 * 구독 생성
 * @param {Object} params - 구독 생성 파라미터
 * @param {string} params.tenantId - 테넌트 ID
 * @param {string} params.planId - 요금제 ID
 * @param {string} params.paymentMethodId - 결제 수단 ID
 * @param {string} [params.billingCycle] - 결제 주기 (기본값: MONTHLY)
 * @param {boolean} [params.autoRenewal] - 자동 갱신 여부 (기본값: true)
 * @returns {Promise<Object>} 생성된 구독 정보
 */
export async function createSubscription(params) {
  try {
    const requestData = {
      tenantId: params.tenantId,
      planId: params.planId,
      paymentMethodId: params.paymentMethodId,
      billingCycle: params.billingCycle || SUBSCRIPTION_CONSTANTS.DEFAULT_BILLING_CYCLE,
      autoRenewal: params.autoRenewal !== undefined ? params.autoRenewal : SUBSCRIPTION_CONSTANTS.DEFAULT_AUTO_RENEWAL,
    };

    const response = await apiPost(BILLING_API.SUBSCRIPTIONS.CREATE, requestData);
    if (response && response.success) {
      return response.data;
    }
    throw new Error(response?.message || '구독 생성에 실패했습니다.');
  } catch (err) {
    console.error('구독 생성 실패:', err);
    throw err;
  }
}

/**
 * 구독 활성화
 * @param {string} subscriptionId - 구독 ID
 * @returns {Promise<Object>} 활성화된 구독 정보
 */
export async function activateSubscription(subscriptionId) {
  try {
    const response = await apiPost(BILLING_API.SUBSCRIPTIONS.ACTIVATE(subscriptionId));
    if (response && response.success) {
      return response.data;
    }
    throw new Error(response?.message || '구독 활성화에 실패했습니다.');
  } catch (err) {
    console.error('구독 활성화 실패:', err);
    throw err;
  }
}

/**
 * 구독 취소
 * @param {string} subscriptionId - 구독 ID
 * @returns {Promise<Object>} 취소된 구독 정보
 */
export async function cancelSubscription(subscriptionId) {
  try {
    const response = await apiPost(BILLING_API.SUBSCRIPTIONS.CANCEL(subscriptionId));
    if (response && response.success) {
      return response.data;
    }
    throw new Error(response?.message || '구독 취소에 실패했습니다.');
  } catch (err) {
    console.error('구독 취소 실패:', err);
    throw err;
  }
}

// ============================================
// 요금제 관련 서비스
// ============================================

/**
 * 활성화된 요금제 목록 조회
 * @returns {Promise<Array>} 요금제 목록
 */
export async function getActivePricingPlans() {
  try {
    const response = await apiGet(BILLING_API.PRICING_PLANS.LIST_ACTIVE);
    if (Array.isArray(response)) {
      return response;
    }
    if (response && response.success) {
      return response.data || [];
    }
    return [];
  } catch (err) {
    console.error('요금제 목록 조회 실패:', err);
    throw err;
  }
}

// ============================================
// 공통 코드 조회 유틸리티
// ============================================

/**
 * 구독 상태 코드 목록 조회
 * @returns {Promise<Array>} 구독 상태 코드 목록
 */
export async function getSubscriptionStatusCodes() {
  try {
    const codes = await getCommonCodes(COMMON_CODE_GROUPS.SUBSCRIPTION_STATUS);
    return codes || [];
  } catch (err) {
    console.error('구독 상태 코드 조회 실패:', err);
    return [];
  }
}

/**
 * 결제 주기 코드 목록 조회
 * @returns {Promise<Array>} 결제 주기 코드 목록
 */
export async function getBillingCycleCodes() {
  try {
    const codes = await getCommonCodes(COMMON_CODE_GROUPS.BILLING_CYCLE);
    return codes || [];
  } catch (err) {
    console.error('결제 주기 코드 조회 실패:', err);
    return [];
  }
}

/**
 * PG 제공자 코드 목록 조회
 * @returns {Promise<Array>} PG 제공자 코드 목록
 */
export async function getPgProviderCodes() {
  try {
    const codes = await getCommonCodes(COMMON_CODE_GROUPS.PG_PROVIDER);
    return codes || [];
  } catch (err) {
    console.error('PG 제공자 코드 조회 실패:', err);
    return [];
  }
}

/**
 * 코드 값으로 코드 라벨 조회
 * @param {string} codeGroup - 코드 그룹
 * @param {string} codeValue - 코드 값
 * @returns {Promise<string>} 코드 라벨 (한글명 우선)
 */
export async function getCodeLabel(codeGroup, codeValue) {
  try {
    const codes = await getCommonCodes(codeGroup);
    const code = codes.find(c => c.codeValue === codeValue);
    return code ? (code.koreanName || code.codeLabel || codeValue) : codeValue;
  } catch (err) {
    console.error(`코드 라벨 조회 실패 (${codeGroup}.${codeValue}):`, err);
    return codeValue;
  }
}

// ============================================
// 포맷팅 유틸리티
// ============================================

/**
 * 금액 포맷팅
 * @param {number} amount - 금액
 * @param {string} [currency] - 통화 (기본값: KRW)
 * @returns {string} 포맷팅된 금액 문자열
 */
export function formatCurrency(amount, currency = CURRENCY_CONSTANTS.DEFAULT) {
  return new Intl.NumberFormat(CURRENCY_CONSTANTS.LOCALE, {
    ...CURRENCY_CONSTANTS.FORMAT_OPTIONS,
    currency,
  }).format(amount);
}

/**
 * 카드 마지막 4자리 포맷팅
 * @param {string} last4 - 카드 마지막 4자리
 * @returns {string} 포맷팅된 카드 번호
 */
export function formatCardLast4(last4) {
  return `**** **** **** ${last4}`;
}

/**
 * 카드 만료일 포맷팅
 * @param {number} month - 만료 월
 * @param {number} year - 만료 년도
 * @returns {string} 포맷팅된 만료일 (MM/YYYY)
 */
export function formatCardExpiry(month, year) {
  const formattedMonth = String(month).padStart(2, '0');
  const formattedYear = String(year).length === 2 ? `20${year}` : String(year);
  return `${formattedMonth}/${formattedYear}`;
}

// ============================================
// 에러 처리 유틸리티
// ============================================

/**
 * 에러 메시지 추출
 * @param {Error|Object} error - 에러 객체
 * @param {string} defaultMessage - 기본 에러 메시지
 * @returns {string} 에러 메시지
 */
export function getErrorMessage(error, defaultMessage) {
  if (error instanceof Error) {
    return error.message;
  }
  if (error && typeof error === 'object' && error.message) {
    return error.message;
  }
  return defaultMessage || '오류가 발생했습니다.';
}

