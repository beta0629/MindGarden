/**
 * Trinity 프론트엔드 API 유틸리티
 * 백엔드 API 호출을 위한 공통 함수
 * 
 * @author CoreSolution
 * @version 1.0.0
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

/**
 * API 요청 기본 함수
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
  };

  const response = await fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
    credentials: 'include', // 세션 쿠키 포함
  });

  if (!response.ok) {
    let errorData: any = {};
    try {
      const text = await response.text();
      if (text) {
        errorData = JSON.parse(text);
      }
    } catch (e) {
      // JSON 파싱 실패 시 빈 객체 사용
      errorData = {};
    }
    
    const errorMessage = errorData.message || errorData.error || errorData.details || `API 요청 실패: ${response.status} ${response.statusText}`;
    console.error('API Error:', {
      status: response.status,
      statusText: response.statusText,
      endpoint,
      errorData,
      fullError: JSON.stringify(errorData, null, 2), // 전체 에러 응답 출력
    });
    throw new Error(errorMessage);
  }

  return response.json();
}

/**
 * GET 요청
 */
export async function apiGet<T>(endpoint: string): Promise<T> {
  return apiRequest<T>(endpoint, { method: 'GET' });
}

/**
 * POST 요청
 */
export async function apiPost<T>(
  endpoint: string,
  data?: unknown
): Promise<T> {
  return apiRequest<T>(endpoint, {
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  });
}

/**
 * PUT 요청
 */
export async function apiPut<T>(
  endpoint: string,
  data?: unknown
): Promise<T> {
  return apiRequest<T>(endpoint, {
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined,
  });
}

/**
 * DELETE 요청
 */
export async function apiDelete<T>(endpoint: string): Promise<T> {
  return apiRequest<T>(endpoint, { method: 'DELETE' });
}

// ============================================
// 온보딩 API
// ============================================

export interface OnboardingCreateRequest {
  tenantId?: string | null; // 옵션: 신규 생성 시 null
  tenantName: string;
  requestedBy: string; // 이메일 주소
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  checklistJson?: string;
  businessType: string;
  adminPassword?: string; // 관리자 계정 비밀번호 (승인 시 계정 생성에 사용)
}

export interface OnboardingRequest {
  id: number;
  tenantId?: string;
  tenantName: string;
  requestedBy: string;
  status: 'PENDING' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED' | 'ON_HOLD';
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  checklistJson?: string;
  businessType: string;
  decidedBy?: string;
  decisionAt?: string;
  decisionNote?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * 이메일 중복 확인
 */
export async function checkEmailDuplicate(email: string): Promise<{ 
  email: string; 
  isDuplicate: boolean; 
  available: boolean;
  message: string;
  status: string | null;
}> {
  const response = await apiGet<ApiResponse<{ 
    email: string; 
    isDuplicate: boolean; 
    available: boolean;
    message: string;
    status: string | null;
  }>>(
    `/api/v1/onboarding/email-check?email=${encodeURIComponent(email)}`
  );
  if (response && response.success && response.data) {
    return response.data as { 
      email: string; 
      isDuplicate: boolean; 
      available: boolean;
      message: string;
      status: string | null;
    };
  }
  console.warn('이메일 중복 확인 응답 형식 오류:', response);
  throw new Error('이메일 중복 확인에 실패했습니다.');
}

/**
 * 온보딩 요청 생성
 */
export async function createOnboardingRequest(
  data: OnboardingCreateRequest
): Promise<OnboardingRequest> {
  return apiPost<OnboardingRequest>('/api/v1/onboarding/requests', data);
}

/**
 * 온보딩 요청 조회 (관리자용)
 */
export async function getOnboardingRequest(
  id: number
): Promise<OnboardingRequest> {
  return apiGet<OnboardingRequest>(`/api/v1/onboarding/requests/${id}`);
}

/**
 * 공개 온보딩 요청 조회 (이메일로 조회)
 */
export async function getPublicOnboardingRequests(
  email: string
): Promise<OnboardingRequest[]> {
  const response = await apiGet<ApiResponse<OnboardingRequest[]>>(`/api/v1/onboarding/requests/public?email=${encodeURIComponent(email)}`);
  if (!response.success || !response.data) {
    throw new Error(response.message || '온보딩 요청 조회에 실패했습니다.');
  }
  return response.data;
}

/**
 * 공개 온보딩 요청 상세 조회 (ID + 이메일로 본인 확인)
 */
export async function getPublicOnboardingRequest(
  id: number,
  email: string
): Promise<OnboardingRequest> {
  const response = await apiGet<ApiResponse<OnboardingRequest>>(`/api/v1/onboarding/requests/public/${id}?email=${encodeURIComponent(email)}`);
  if (!response.success || !response.data) {
    throw new Error(response.message || '온보딩 요청 조회에 실패했습니다.');
  }
  return response.data;
}

// ============================================
// 요금제 API
// ============================================

export interface PricingPlan {
  id?: string;
  planId?: string;
  planId: string;
  planCode: string;
  name: string; // 백엔드 필드명과 일치 (필수)
  nameKo?: string; // 백엔드 필드명과 일치
  nameEn?: string; // 백엔드 필드명과 일치
  displayName?: string; // 하위 호환성 (name의 별칭)
  displayNameKo?: string; // 하위 호환성 (nameKo의 별칭)
  baseFee: number;
  currency: string;
  description?: string;
  descriptionKo?: string;
  descriptionEn?: string;
  isActive: boolean;
  displayOrder?: number;
  featuresJson?: string | string[]; // JSON 문자열 또는 배열
  limitsJson?: string; // JSON 문자열
  billingCycle?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * 활성 요금제 목록 조회
 */
export async function getActivePricingPlans(): Promise<PricingPlan[]> {
  return apiGet<PricingPlan[]>('/api/v1/ops/plans/active');
}

/**
 * 요금제 상세 조회
 */
export async function getPricingPlan(planId: string): Promise<PricingPlan> {
  return apiGet<PricingPlan>(`/api/ops/plans/${planId}`);
}

// ============================================
// 업종 카테고리 API
// ============================================

export interface BusinessCategory {
  id?: number; // BaseEntity의 id (옵션)
  categoryId: string; // UUID (필수)
  categoryCode: string;
  nameKo: string; // 백엔드 필드명과 일치
  nameEn?: string; // 백엔드 필드명과 일치
  categoryName?: string; // 하위 호환성 (nameEn의 별칭)
  categoryNameKo?: string; // 하위 호환성 (nameKo의 별칭)
  descriptionKo?: string;
  descriptionEn?: string;
  parentCategoryId?: string; // UUID (String)
  displayOrder?: number;
  isActive?: boolean;
  level?: number;
}

export interface BusinessCategoryItem {
  id?: number; // BaseEntity의 id (옵션)
  itemId: string; // UUID (필수)
  itemCode: string;
  nameKo: string; // 백엔드 필드명과 일치
  nameEn?: string; // 백엔드 필드명과 일치
  itemName?: string; // 하위 호환성 (nameEn의 별칭)
  itemNameKo?: string; // 하위 호환성 (nameKo의 별칭)
  categoryId: string; // UUID (String)
  displayOrder?: number;
  isActive?: boolean;
}

/**
 * 루트 업종 카테고리 조회
 */
export async function getRootBusinessCategories(): Promise<BusinessCategory[]> {
  try {
    const response = await apiGet<ApiResponse<BusinessCategory[]>>(
      '/api/business-categories/root'
    );
    if (response && response.success && response.data) {
      return response.data;
    }
    console.warn('업종 카테고리 응답 형식 오류:', response);
    return [];
  } catch (error) {
    console.error('업종 카테고리 조회 실패:', error);
    throw error;
  }
}

/**
 * 카테고리 아이템 조회 (categoryId로)
 */
export async function getBusinessCategoryItems(
  categoryId?: string
): Promise<BusinessCategoryItem[]> {
  try {
    const endpoint = categoryId
      ? `/api/business-categories/items?categoryId=${encodeURIComponent(categoryId)}`
      : '/api/business-categories/items';
    const response = await apiGet<ApiResponse<BusinessCategoryItem[]>>(endpoint);
    if (response && response.success && response.data) {
      return response.data;
    }
    console.warn('업종 카테고리 아이템 응답 형식 오류:', response);
    return [];
  } catch (error) {
    console.error('업종 카테고리 아이템 조회 실패:', error);
    throw error;
  }
}

/**
 * business_type으로 카테고리 아이템 조회
 */
export async function getCategoryItemByBusinessType(
  businessType: string
): Promise<BusinessCategoryItem | null> {
  try {
    const response = await apiGet<{ success: boolean; data: BusinessCategoryItem }>(
      `/api/business-categories/items/by-business-type/${businessType}`
    );
    return response.data || null;
  } catch (error) {
    console.warn('업종 카테고리 아이템 조회 실패:', error);
    return null;
  }
}

// ============================================
// 결제 및 구독 API
// ============================================

export interface PaymentMethodRequest {
  paymentMethodToken: string; // PG에서 받은 토큰
  pgProvider: 'TOSS' | 'STRIPE' | 'OTHER';
  cardBrand?: string; // 카드 브랜드 (예: VISA, MASTERCARD)
  cardLast4?: string; // 카드 마지막 4자리
  cardExpMonth?: number; // 만료 월
  cardExpYear?: number; // 만료 년도
  cardholderName?: string; // 카드 소유자 이름
}

export interface PaymentMethod {
  paymentMethodId: string;
  tenantId?: string;
  pgProvider: string;
  cardBrand?: string;
  cardLast4?: string;
  cardExpMonth?: number;
  cardExpYear?: number;
  cardholderName?: string;
  isDefault: boolean;
  createdAt?: string;
}

/**
 * 결제 수단 토큰 저장 및 검증
 */
export async function createPaymentMethod(
  data: PaymentMethodRequest
): Promise<PaymentMethod> {
  const response = await apiPost<ApiResponse<PaymentMethod>>('/api/v1/billing/payment-methods', data);
  if (!response.success || !response.data) {
    throw new Error(response.message || '결제 수단 등록에 실패했습니다.');
  }
  return response.data;
}

/**
 * 결제 수단 조회
 */
export async function getPaymentMethod(paymentMethodId: string): Promise<PaymentMethod> {
  const response = await apiGet<ApiResponse<PaymentMethod>>(`/api/v1/billing/payment-methods/${paymentMethodId}`);
  if (!response.success || !response.data) {
    throw new Error(response.message || '결제 수단 조회에 실패했습니다.');
  }
  return response.data;
}

/**
 * 테넌트의 결제 수단 목록 조회
 */
export async function getPaymentMethodsByTenant(tenantId: string): Promise<PaymentMethod[]> {
  const response = await apiGet<ApiResponse<PaymentMethod[]>>(`/api/v1/billing/payment-methods?tenantId=${tenantId}`);
  if (!response.success || !response.data) {
    throw new Error(response.message || '결제 수단 목록 조회에 실패했습니다.');
  }
  return response.data;
}

/**
 * 결제 수단 삭제
 */
export async function deletePaymentMethod(paymentMethodId: string): Promise<void> {
  const response = await apiDelete<ApiResponse<void>>(`/api/v1/billing/payment-methods/${paymentMethodId}`);
  if (!response.success) {
    throw new Error(response.message || '결제 수단 삭제에 실패했습니다.');
  }
}

/**
 * 결제 수단 업데이트 (새 토큰으로 교체)
 */
export async function updatePaymentMethod(
  paymentMethodId: string,
  data: PaymentMethodRequest
): Promise<PaymentMethod> {
  const response = await apiPut<ApiResponse<PaymentMethod>>(`/api/v1/billing/payment-methods/${paymentMethodId}`, data);
  if (!response.success || !response.data) {
    throw new Error(response.message || '결제 수단 업데이트에 실패했습니다.');
  }
  return response.data;
}

export interface SubscriptionCreateRequest {
  tenantId?: string; // 온보딩 중이면 null
  planId: string;
  paymentMethodId: string;
  billingCycle?: 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
  autoRenewal?: boolean;
}

export interface Subscription {
  subscriptionId: string;
  tenantId: string;
  planId: string;
  status: 'DRAFT' | 'PENDING_ACTIVATION' | 'ACTIVE' | 'SUSPENDED' | 'CANCELLED' | 'TERMINATED';
  effectiveFrom?: string;
  effectiveTo?: string;
  billingCycle: string;
  paymentMethod?: string;
  autoRenewal: boolean;
  nextBillingDate?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * 구독 생성
 */
export async function createSubscription(
  data: SubscriptionCreateRequest
): Promise<Subscription> {
  const response = await apiPost<ApiResponse<Subscription>>('/api/v1/billing/subscriptions', data);
  if (!response.success || !response.data) {
    throw new Error(response.message || '구독 생성에 실패했습니다.');
  }
  return response.data;
}

/**
 * 구독 활성화 (첫 결제 수행)
 */
export async function activateSubscription(
  subscriptionId: string
): Promise<Subscription> {
  const response = await apiPost<ApiResponse<Subscription>>(`/api/v1/billing/subscriptions/${subscriptionId}/activate`, {});
  if (!response.success || !response.data) {
    throw new Error(response.message || '구독 활성화에 실패했습니다.');
  }
  return response.data;
}

/**
 * 이메일 인증 코드 발송
 */
export async function sendEmailVerificationCode(email: string): Promise<void> {
  const response = await apiPost<ApiResponse<void>>(
    `/api/v1/accounts/integration/send-verification-code?email=${encodeURIComponent(email)}`
  );
  if (!response.success) {
    throw new Error(response.message || '인증 코드 발송에 실패했습니다.');
  }
}

/**
 * 이메일 인증 코드 검증
 */
export async function verifyEmailCode(email: string, code: string): Promise<void> {
  const response = await apiPost<ApiResponse<void>>(
    `/api/v1/accounts/integration/verify-code?email=${encodeURIComponent(email)}&code=${encodeURIComponent(code)}`
  );
  if (!response.success) {
    throw new Error(response.message || '인증 코드가 올바르지 않습니다.');
  }
}

/**
 * 구독 정보 조회
 */
export async function getSubscription(
  subscriptionId: string
): Promise<Subscription> {
  const response = await apiGet<ApiResponse<Subscription>>(`/api/v1/billing/subscriptions/${subscriptionId}`);
  if (!response.success || !response.data) {
    throw new Error(response.message || '구독 정보 조회에 실패했습니다.');
  }
  return response.data;
}

/**
 * 테넌트별 구독 정보 조회
 */
export async function getSubscriptionByTenant(
  tenantId: string
): Promise<Subscription | null> {
  try {
    const response = await apiGet<ApiResponse<Subscription>>(`/api/subscriptions/${tenantId}`);
    if (!response.success || !response.data) {
      return null;
    }
    return response.data;
  } catch (error) {
    console.warn('구독 정보 조회 실패:', error);
    return null;
  }
}

