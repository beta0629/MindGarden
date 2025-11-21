/**
 * 결제 및 구독 관련 상수 정의
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-20
 */

// ============================================
// CSS 클래스 상수
// ============================================

export const BILLING_CSS = {
  // 결제 수단 등록
  PAYMENT_METHOD_REGISTRATION: {
    CONTAINER: 'payment-method-registration',
    HEADER: 'payment-method-registration__header',
    CONTENT: 'payment-method-registration__content',
    DESCRIPTION: 'payment-method-registration__description',
    ERROR: 'payment-method-registration__error',
    INFO: 'payment-method-registration__info',
    INFO_ITEM: 'payment-method-registration__info-item',
    CUSTOMER_KEY: 'payment-method-registration__customer-key',
    FOOTER: 'payment-method-registration__footer',
  },

  // 결제 콜백
  BILLING_CALLBACK: {
    CONTAINER: 'billing-callback',
    LOADING: 'billing-callback__loading',
    SPINNER: 'billing-callback__spinner',
    SUCCESS: 'billing-callback__success',
    FAIL: 'billing-callback__fail',
    ICON: 'billing-callback__icon',
    INFO: 'billing-callback__info',
    INFO_ITEM: 'billing-callback__info-item',
    ERROR_DETAILS: 'billing-callback__error-details',
    ERROR_ITEM: 'billing-callback__error-item',
    ACTIONS: 'billing-callback__actions',
  },

  // 구독 관리
  SUBSCRIPTION_MANAGEMENT: {
    CONTAINER: 'subscription-management',
    HEADER: 'subscription-management__header',
    SECTION: 'subscription-management__section',
    SECTION_HEADER: 'subscription-management__section-header',
    EMPTY: 'subscription-management__empty',
    ERROR: 'subscription-management__error',
    PAYMENT_METHODS: 'subscription-management__payment-methods',
    PAYMENT_METHOD: 'subscription-management__payment-method',
    PAYMENT_METHOD_INFO: 'subscription-management__payment-method-info',
    BADGE: 'subscription-management__badge',
    PLANS: 'subscription-management__plans',
    PLAN_GRID: 'subscription-management__plan-grid',
    PLAN_CARD: 'subscription-management__plan-card',
    PLAN_CARD_SELECTED: 'subscription-management__plan-card selected',
    PLAN_PRICE: 'subscription-management__plan-price',
    PLAN_DESCRIPTION: 'subscription-management__plan-description',
    WARNING: 'subscription-management__warning',
    SUBSCRIPTIONS: 'subscription-management__subscriptions',
    SUBSCRIPTION: 'subscription-management__subscription',
    SUBSCRIPTION_HEADER: 'subscription-management__subscription-header',
    SUBSCRIPTION_INFO: 'subscription-management__subscription-info',
    SUBSCRIPTION_ACTIONS: 'subscription-management__subscription-actions',
    STATUS: 'subscription-management__status',
    STATUS_ACTIVE: 'subscription-management__status--active',
    STATUS_PENDING_ACTIVATION: 'subscription-management__status--pending_activation',
    STATUS_CANCELLED: 'subscription-management__status--cancelled',
  },
};

// ============================================
// 아이콘 크기 상수
// ============================================

export const ICON_SIZES = {
  SMALL: 16,
  MEDIUM: 20,
  LARGE: 24,
  XLARGE: 48,
  XXLARGE: 64,
};

// ============================================
// 구독 관련 상수
// ============================================

/**
 * @deprecated 공통 코드에서 동적으로 조회하세요. getSubscriptionStatusCodes() 사용
 * 하위 호환성을 위해 유지되지만, 공통 코드 조회를 우선 사용하세요.
 */
export const SUBSCRIPTION_CONSTANTS = {
  // 구독 상태 (공통 코드에서 조회 권장)
  STATUS: {
    DRAFT: 'DRAFT',
    PENDING_ACTIVATION: 'PENDING_ACTIVATION',
    ACTIVE: 'ACTIVE',
    SUSPENDED: 'SUSPENDED',
    CANCELLED: 'CANCELLED',
    TERMINATED: 'TERMINATED',
  },

  // 결제 주기 (공통 코드에서 조회 권장)
  BILLING_CYCLE: {
    MONTHLY: 'MONTHLY',
    QUARTERLY: 'QUARTERLY',
    YEARLY: 'YEARLY',
  },

  // 기본값
  DEFAULT_BILLING_CYCLE: 'MONTHLY',
  DEFAULT_AUTO_RENEWAL: true,
};

// ============================================
// 공통 코드 그룹 상수
// ============================================

export const COMMON_CODE_GROUPS = {
  SUBSCRIPTION_STATUS: 'SUBSCRIPTION_STATUS',
  BILLING_CYCLE: 'BILLING_CYCLE',
  PG_PROVIDER: 'PG_PROVIDER',
};

// ============================================
// 통화 관련 상수
// ============================================

export const CURRENCY_CONSTANTS = {
  DEFAULT: 'KRW',
  LOCALE: 'ko-KR',
  FORMAT_OPTIONS: {
    style: 'currency',
    minimumFractionDigits: 0,
  },
};

// ============================================
// 메시지 상수
// ============================================

export const BILLING_MESSAGES = {
  // 결제 수단 등록
  REGISTRATION: {
    TITLE: '결제 수단 등록',
    DESCRIPTION: '정기 결제를 위한 결제 수단을 등록하세요.',
    DESCRIPTION_SECONDARY: '카드 정보는 안전하게 암호화되어 저장됩니다.',
    PG_PROVIDER_LABEL: 'PG 제공자',
    CUSTOMER_ID_LABEL: '고객 ID',
    GENERATING: '생성 중...',
    REGISTER_BUTTON: '결제 수단 등록',
    REGISTERING: '등록 중...',
    CANCEL_BUTTON: '취소',
    ERROR_TENANT_NOT_FOUND: '테넌트 정보를 찾을 수 없습니다.',
    ERROR_CUSTOMER_KEY_GENERATION: '고객 정보를 생성할 수 없습니다.',
    ERROR_REGISTRATION_FAILED: '결제 수단 등록 중 오류가 발생했습니다.',
  },

  // 콜백
  CALLBACK: {
    PROCESSING: '결제 수단 등록 처리 중...',
    PROCESSING_DESCRIPTION: '잠시만 기다려주세요.',
    SUCCESS_TITLE: '결제 수단 등록 완료',
    SUCCESS_DESCRIPTION: '결제 수단이 성공적으로 등록되었습니다.',
    FAIL_TITLE: '결제 수단 등록 실패',
    FAIL_DESCRIPTION: '결제 수단 등록에 실패했습니다.',
    ERROR_MISSING_STATUS: '콜백 상태 정보가 없습니다.',
    ERROR_MISSING_PARAMS: '필수 파라미터가 누락되었습니다.',
    PAYMENT_METHOD_ID_LABEL: '결제 수단 ID',
    CARD_BRAND_LABEL: '카드 브랜드',
    CARD_LAST4_LABEL: '카드 마지막 4자리',
    CARD_LAST4_FORMAT: '**** **** ****',
    ERROR_CODE_LABEL: '에러 코드',
    GO_TO_DASHBOARD: '대시보드로 이동',
    RETRY: '다시 시도',
  },

  // 구독 관리
  SUBSCRIPTION: {
    TITLE: '구독 관리',
    PAYMENT_METHODS_TITLE: '등록된 결제 수단',
    ADD_PAYMENT_METHOD: '결제 수단 추가',
    REGISTER_PAYMENT_METHOD: '결제 수단 등록하기',
    NO_PAYMENT_METHODS: '등록된 결제 수단이 없습니다.',
    SUBSCRIPTIONS_TITLE: '구독 목록',
    NO_SUBSCRIPTIONS: '활성 구독이 없습니다.',
    PLAN_SELECTION_TITLE: '요금제 선택',
    CREATE_SUBSCRIPTION: '구독 생성',
    ACTIVATE: '활성화',
    CANCEL: '구독 취소',
    CANCEL_CONFIRM: '구독을 취소하시겠습니까?',
    NO_PAYMENT_METHOD_FOR_SUBSCRIPTION: '구독을 생성하려면 먼저 결제 수단을 등록해주세요.',
    BILLING_CYCLE_LABEL: '결제 주기',
    MONTHLY_LABEL: '월',
    DEFAULT_PLAN_NAME: '구독',
    STATUS_UNKNOWN: 'UNKNOWN',
  },

  // 성공/실패 메시지
  SUCCESS: {
    PAYMENT_METHOD_REGISTERED: '결제 수단이 성공적으로 등록되었습니다.',
    SUBSCRIPTION_CREATED: '구독이 생성되었습니다.',
    SUBSCRIPTION_ACTIVATED: '구독이 활성화되었습니다.',
    SUBSCRIPTION_CANCELLED: '구독이 취소되었습니다.',
  },

  ERROR: {
    LOAD_SUBSCRIPTIONS: '구독 목록을 불러오는데 실패했습니다.',
    LOAD_PAYMENT_METHODS: '결제 수단 목록을 불러오는데 실패했습니다.',
    LOAD_PRICING_PLANS: '요금제 목록을 불러오는데 실패했습니다.',
    CREATE_SUBSCRIPTION: '구독 생성에 실패했습니다.',
    ACTIVATE_SUBSCRIPTION: '구독 활성화에 실패했습니다.',
    CANCEL_SUBSCRIPTION: '구독 취소에 실패했습니다.',
    TENANT_NOT_FOUND: '테넌트 정보를 찾을 수 없습니다.',
    REGISTRATION_FAILED: '결제 수단 등록 처리 중 오류가 발생했습니다.',
  },
};

// ============================================
// API 엔드포인트 상수
// ============================================

export const BILLING_API = {
  PAYMENT_METHODS: {
    CREATE: '/api/v1/billing/payment-methods',
    GET: (paymentMethodId) => `/api/v1/billing/payment-methods/${paymentMethodId}`,
    LIST: (tenantId) => `/api/v1/billing/payment-methods?tenantId=${tenantId}`,
  },
  SUBSCRIPTIONS: {
    CREATE: '/api/v1/billing/subscriptions',
    GET: (subscriptionId) => `/api/v1/billing/subscriptions/${subscriptionId}`,
    LIST: (tenantId) => `/api/v1/billing/subscriptions?tenantId=${tenantId}`,
    ACTIVATE: (subscriptionId) => `/api/v1/billing/subscriptions/${subscriptionId}/activate`,
    CANCEL: (subscriptionId) => `/api/v1/billing/subscriptions/${subscriptionId}/cancel`,
  },
  PRICING_PLANS: {
    LIST_ACTIVE: '/api/v1/ops/plans/active',
  },
};

// ============================================
// 라우트 경로 상수
// ============================================

export const BILLING_ROUTES = {
  CALLBACK: '/billing/callback',
  PAYMENT_METHODS: '/billing/payment-methods',
  SUBSCRIPTIONS: '/billing/subscriptions',
  DASHBOARD: '/dashboard',
};

// ============================================
// URL 파라미터 상수
// ============================================

export const CALLBACK_PARAMS = {
  STATUS: 'status',
  CUSTOMER_KEY: 'customerKey',
  TENANT_ID: 'tenantId',
  AUTH_KEY: 'authKey',
  ERROR_CODE: 'errorCode',
  ERROR_MESSAGE: 'errorMessage',
};

// ============================================
// 콜백 상태 상수
// ============================================

export const CALLBACK_STATUS = {
  SUCCESS: 'success',
  FAIL: 'fail',
  PROCESSING: 'processing',
};

// ============================================
// PG 제공자 이름 매핑
// ============================================

export const PG_PROVIDER_NAMES = {
  TOSS: '토스페이먼츠',
  STRIPE: '스트라이프',
  IAMPORT: '아임포트',
  KAKAO: '카카오페이',
  NAVER: '네이버페이',
  PAYPAL: '페이팔',
  OTHER: '기타',
};

