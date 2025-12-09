/**
 * Trinity 프론트엔드 API 유틸리티
 * 백엔드 API 호출을 위한 공통 함수
 * 
 * @author CoreSolution
 * @version 1.0.0
 */

// 환경 변수가 없으면 상대 경로 사용 (프로덕션 환경에서 Nginx 프록시 사용)
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';

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
  // API_BASE_URL이 비어있으면 상대 경로 사용 (프로덕션)
  // API_BASE_URL이 있으면 절대 경로 사용 (로컬 개발)
  const url = API_BASE_URL ? `${API_BASE_URL}${endpoint}` : endpoint;
  
  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
  };

  let response: Response;
  let jsonData: any;
  
  try {
    response = await fetch(url, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
      credentials: 'include', // 세션 쿠키 포함
    });
    
    jsonData = await response.json();
  } catch (fetchError) {
    // 네트워크 오류 (연결 실패 등)
    const isOnboardingEndpoint = endpoint.includes('/auth/current-user') || 
                                  endpoint.includes('/common-codes') ||
                                  endpoint.includes('/business-categories') ||
                                  endpoint.includes('/pricing-plans');
    if (isOnboardingEndpoint) {
      // 온보딩 관련 API는 조용히 처리 (에러 로그 출력 안 함)
      if (process.env.NODE_ENV === 'development') {
        console.error('[DEBUG] Onboarding API connection failed:', endpoint, fetchError);
      }
      throw new Error('Connection failed');
    }
    throw fetchError;
  }
  
  // 온보딩 관련 API의 인증 오류는 정상적인 상황 (로그인 불필요)
  const isOnboardingEndpoint = endpoint.includes('/auth/current-user') || 
                                endpoint.includes('/common-codes') ||
                                endpoint.includes('/business-categories') ||
                                endpoint.includes('/pricing-plans');
  
  if (!response.ok) {
    // 개발 환경에서 에러 응답 로그
    if (process.env.NODE_ENV === 'development' && endpoint.includes('/business-categories')) {
      console.error('[DEBUG] API Error Response:', {
        endpoint,
        status: response.status,
        statusText: response.statusText,
        jsonData,
      });
    }
    
    if (isOnboardingEndpoint && (response.status === 400 || response.status === 401 || response.status === 403)) {
      // 온보딩 페이지는 로그인 없이도 접근 가능하므로 인증 오류는 정상적인 상황
      // 배열을 반환하는 API의 경우 빈 배열 반환 (무한 루프 방지)
      if (endpoint.includes('/business-categories') || endpoint.includes('/pricing-plans')) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('[DEBUG] Returning empty array for business-categories/pricing-plans endpoint (status:', response.status, '):', endpoint);
        }
        // 400 에러도 조용히 빈 배열 반환 (무한 루프 방지)
        return [] as T;
      }
      // /auth/current-user는 로그인되지 않은 경우 빈 객체 반환
      if (endpoint.includes('/auth/current-user')) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('[DEBUG] User not logged in, returning empty user object for:', endpoint);
        }
        return { success: false, data: {} } as T;
      }
      // 그 외에는 실패한 응답 객체 반환
      return { success: false } as T;
    }
    
    // ApiResponse 래퍼 처리
    const errorData = (jsonData as ApiResponse<any>)?.error || jsonData;
    const errorMessage = errorData.message || errorData.error || errorData.details || `API 요청 실패: ${response.status} ${response.statusText}`;
    
    if (!isOnboardingEndpoint) {
      console.error('API Error:', {
        status: response.status,
        statusText: response.statusText,
        endpoint,
        errorData,
        fullError: JSON.stringify(jsonData, null, 2),
      });
    }
    throw new Error(errorMessage);
  }

  // ApiResponse 래퍼 처리: { success: true, data: T } 형태면 data 추출
  if (jsonData && typeof jsonData === 'object' && 'success' in jsonData && 'data' in jsonData) {
    const apiResponse = jsonData as ApiResponse<T>;
    // 개발 환경에서 디버깅 로그
    if (process.env.NODE_ENV === 'development' && endpoint.includes('/business-categories')) {
      console.log('[DEBUG] API Response:', {
        endpoint,
        success: apiResponse.success,
        hasData: !!apiResponse.data,
        dataType: typeof apiResponse.data,
        isArray: Array.isArray(apiResponse.data),
        data: apiResponse.data,
      });
    }
    return apiResponse.data as T;
  }
  
  // ApiResponse 래퍼가 없으면 그대로 반환
  if (process.env.NODE_ENV === 'development' && endpoint.includes('/business-categories')) {
    console.log('[DEBUG] No ApiResponse wrapper, returning jsonData as-is:', {
      endpoint,
      jsonData,
      jsonDataType: typeof jsonData,
      isArray: Array.isArray(jsonData),
    });
  }
  return jsonData as T;
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
  regionCode?: string; // 지역 코드 (테넌트 ID 생성 시 사용, 선택적)
  brandName?: string; // 브랜드명 (상호, 브랜딩 적용 시 사용, 선택적)
  adminPassword?: string; // 관리자 계정 비밀번호 (승인 시 계정 생성에 사용)
}

export interface OnboardingRequest {
  id: string; // UUID 문자열 (BINARY(16)을 HEX로 변환한 값)
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
  try {
    // apiGet은 이미 ApiResponse 래퍼를 처리하므로 직접 data를 반환
    const data = await apiGet<{ 
      email: string; 
      isDuplicate: boolean; 
      available: boolean;
      message: string;
      status: string | null;
    }>(
      `/api/v1/onboarding/email-check?email=${encodeURIComponent(email)}`
    );
    
    // data가 이미 객체인지 확인
    if (data && typeof data === 'object' && 'email' in data) {
      return data as { 
        email: string; 
        isDuplicate: boolean; 
        available: boolean;
        message: string;
        status: string | null;
      };
    }
    
    // ApiResponse 래퍼가 있는 경우
    if (data && typeof data === 'object' && 'success' in data && 'data' in data) {
      const wrapped = data as ApiResponse<{ 
        email: string; 
        isDuplicate: boolean; 
        available: boolean;
        message: string;
        status: string | null;
      }>;
      if (wrapped.success && wrapped.data) {
        return wrapped.data;
      }
    }
    
    console.warn('이메일 중복 확인 응답 형식 오류:', data);
    throw new Error('이메일 중복 확인에 실패했습니다.');
  } catch (error) {
    console.error('이메일 중복 확인 API 호출 실패:', error);
    throw error instanceof Error ? error : new Error('이메일 중복 확인에 실패했습니다.');
  }
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
  try {
    // apiGet은 이미 ApiResponse의 data를 추출하므로,
    // response는 OnboardingRequest[] 배열을 직접 받음
    const response = await apiGet<OnboardingRequest[]>(`/api/v1/onboarding/requests/public?email=${encodeURIComponent(email)}`);
    
    // response가 배열인 경우
    if (Array.isArray(response)) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[DEBUG] Onboarding requests loaded:', response.length, response);
      }
      return response;
    }
    
    // null 또는 undefined인 경우 빈 배열 반환
    if (!response) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[DEBUG] Onboarding requests response is null or undefined');
      }
      return [];
    }
    
    // 하위 호환성: ApiResponse 래퍼가 있는 경우
    if (typeof response === 'object' && 'success' in response && 'data' in response) {
      const apiResponse = response as ApiResponse<OnboardingRequest[]>;
      if (apiResponse.success && apiResponse.data && Array.isArray(apiResponse.data)) {
        return apiResponse.data;
      }
    }
    
    if (process.env.NODE_ENV === 'development') {
      console.warn('[DEBUG] Unexpected response format for onboarding requests:', response);
    }
    return [];
  } catch (error) {
    // 개발 환경에서만 에러 로그 출력
    if (process.env.NODE_ENV === 'development') {
      console.error('[DEBUG] Failed to load onboarding requests:', error);
    }
    // 에러 발생 시 빈 배열 반환 (무한 로딩 방지)
    return [];
  }
}

/**
 * 공개 온보딩 요청 상세 조회 (ID + 이메일로 본인 확인)
 * 
 * @param id 온보딩 요청 ID (UUID 문자열 - HEX 형식 또는 하이픈 포함 형식)
 * @param email 요청자 이메일
 */
export async function getPublicOnboardingRequest(
  id: string,
  email: string
): Promise<OnboardingRequest> {
  try {
    // UUID 형식 변환: HEX 형식 (32자)을 하이픈 포함 형식으로 변환
    // 예: CB1057B0AF8A47A69CE80671405213F4 -> cb1057b0-af8a-47a6-9ce8-0671405213f4
    let uuidString = id.trim();
    if (uuidString.length === 32 && !uuidString.includes('-')) {
      // HEX 형식을 UUID 형식으로 변환
      uuidString = [
        uuidString.substring(0, 8),
        uuidString.substring(8, 12),
        uuidString.substring(12, 16),
        uuidString.substring(16, 20),
        uuidString.substring(20, 32)
      ].join('-').toLowerCase();
    }
    
    // apiGet은 이미 ApiResponse의 data를 추출하므로,
    // response는 OnboardingRequest 객체를 직접 받음
    const response = await apiGet<OnboardingRequest>(`/api/v1/onboarding/requests/public/${encodeURIComponent(uuidString)}?email=${encodeURIComponent(email)}`);
    
    // response가 객체인 경우
    if (response && typeof response === 'object' && 'id' in response) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[DEBUG] Onboarding request loaded:', response);
      }
      return response;
    }
    
    // null 또는 undefined인 경우
    if (!response) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[DEBUG] Onboarding request response is null or undefined');
      }
      throw new Error('온보딩 요청을 찾을 수 없습니다.');
    }
    
    // 하위 호환성: ApiResponse 래퍼가 있는 경우
    if (typeof response === 'object' && 'success' in response && 'data' in response) {
      const apiResponse = response as ApiResponse<OnboardingRequest>;
      if (apiResponse.success && apiResponse.data) {
        return apiResponse.data;
      }
      throw new Error(apiResponse.message || '온보딩 요청 조회에 실패했습니다.');
    }
    
    throw new Error('온보딩 요청 조회에 실패했습니다.');
  } catch (error) {
    // 개발 환경에서만 에러 로그 출력
    if (process.env.NODE_ENV === 'development') {
      console.error('[DEBUG] Failed to load onboarding request:', error);
    }
    // 에러를 다시 throw하여 호출자가 처리할 수 있도록 함
    throw error;
  }
}

// ============================================
// 요금제 API
// ============================================

export interface PricingPlan {
  id?: string; // 하위 호환성을 위한 별칭 (planId와 동일)
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
    // apiGet은 이미 ApiResponse의 data를 추출하므로,
    // response는 BusinessCategory[] 배열을 직접 받음
    // 표준화: /api/v1/ 경로 사용
    const response = await apiGet<BusinessCategory[]>(
      '/api/v1/business-categories/root'
    );
    
    // response가 배열인 경우
    if (Array.isArray(response)) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[DEBUG] Business categories loaded:', response.length, response);
      }
      return response;
    }
    
    // null 또는 undefined인 경우 빈 배열 반환
    if (!response) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[DEBUG] Business categories response is null or undefined');
      }
      return [];
    }
    
    // 하위 호환성: ApiResponse 래퍼가 있는 경우
    if (typeof response === 'object' && 'success' in response && 'data' in response) {
      const apiResponse = response as ApiResponse<BusinessCategory[]>;
      if (apiResponse.success && apiResponse.data && Array.isArray(apiResponse.data)) {
        return apiResponse.data;
      }
    }
    
    if (process.env.NODE_ENV === 'development') {
      console.warn('[DEBUG] Unexpected response format for business categories:', response);
    }
    return [];
  } catch (error) {
    // 개발 환경에서만 에러 로그 출력
    if (process.env.NODE_ENV === 'development') {
      console.error('[DEBUG] Failed to load business categories:', error);
    }
    // 에러 발생 시 빈 배열 반환 (무한 로딩 방지)
    return [];
  }
}

/**
 * 카테고리 아이템 조회 (categoryId로)
 */
export async function getBusinessCategoryItems(
  categoryId?: string
): Promise<BusinessCategoryItem[]> {
  try {
    // 표준화: /api/v1/ 경로 사용
    const endpoint = categoryId
      ? `/api/v1/business-categories/items?categoryId=${encodeURIComponent(categoryId)}`
      : '/api/v1/business-categories/items';
    
    // apiGet은 이미 ApiResponse의 data를 추출하므로,
    // response는 BusinessCategoryItem[] 배열을 직접 받음
    const response = await apiGet<BusinessCategoryItem[]>(endpoint);
    
    // response가 배열인 경우
    if (Array.isArray(response)) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[DEBUG] Business category items loaded:', response.length, response);
      }
      return response;
    }
    
    // 하위 호환성: ApiResponse 래퍼가 있는 경우
    if (response && typeof response === 'object' && 'success' in response && 'data' in response) {
      const apiResponse = response as ApiResponse<BusinessCategoryItem[]>;
      if (apiResponse.success && apiResponse.data) {
        return apiResponse.data;
      }
    }
    
    if (process.env.NODE_ENV === 'development') {
      console.warn('[DEBUG] Unexpected response format for business category items:', response);
    }
    return [];
  } catch (error) {
    // 개발 환경에서만 에러 로그 출력
    if (process.env.NODE_ENV === 'development') {
      console.error('[DEBUG] Failed to load business category items:', error);
    }
    // 에러 발생 시 빈 배열 반환 (무한 로딩 방지)
    // 세부 항목이 없는 경우도 정상적인 상황이므로 에러를 throw하지 않음
    return [];
  }
}

/**
 * business_type으로 카테고리 아이템 조회
 */
export async function getCategoryItemByBusinessType(
  businessType: string
): Promise<BusinessCategoryItem | null> {
  try {
    // 표준화: /api/v1/ 경로 사용
    const response = await apiGet<{ success: boolean; data: BusinessCategoryItem }>(
      `/api/v1/business-categories/items/by-business-type/${businessType}`
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

