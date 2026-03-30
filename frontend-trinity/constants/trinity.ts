/**
 * Trinity 홈페이지 비즈니스 로직 상수
 * 하드코딩 금지 - 모든 값은 여기에 정의
 */

export const TRINITY_CONSTANTS = {
  // 회사 정보
  COMPANY: {
    NAME: 'Trinity',
    NAME_FULL: 'Trinity - CoreSolution',
    DESCRIPTION: '소상공인을 위한 통합 솔루션',
    EMAIL: 'admin@e-trinity.co.kr',
    WEBSITE: 'https://e-trinity.co.kr',
    COPYRIGHT: '© 2025 Trinity. All rights reserved.',
  },
  
  // CoreSolution 브랜딩
  BRANDING: {
    CORESOLUTION_NAME: 'CoreSolution',
    CORESOLUTION_TAGLINE: '소상공인을 위한 통합 솔루션 플랫폼',
    CORESOLUTION_DESCRIPTION: '대기업 수준의 ERP 시스템을 저렴한 비용으로 제공하는 CoreSolution 플랫폼',
    POWERED_BY: 'Powered by CoreSolution',
  },
  
  // 서비스 정보
  SERVICES: [
    {
      id: 'erp',
      title: 'ERP 시스템',
      description: '소상공인 맞춤형 재무/회계/정산 시스템으로 자동화된 급여, 정산, 세금 계산을 제공합니다.',
      icon: '📊',
      color: 'primary',
    },
    {
      id: 'permission',
      title: '권한 관리',
      description: '업종별, 역할별 세밀한 권한 관리와 템플릿 기반 간편한 권한 설정을 제공합니다.',
      icon: '🔐',
      color: 'success',
    },
    {
      id: 'usability',
      title: '쉬운 사용',
      description: '직관적인 UI/UX로 누구나 쉽게 사용할 수 있으며, 최소한의 입력으로 최대한의 자동화를 제공합니다.',
      icon: '🚀',
      color: 'warning',
    },
  ],
  
  // 요금제 정보
  PRICING_PLANS: [
    {
      id: 'starter',
      name: '스타터',
      price: 100000,
      currency: 'KRW',
      features: [
        '기본 기능',
        '최대 10명 사용자',
        '기본 지원',
      ],
    },
    {
      id: 'pro',
      name: '프로',
      price: 300000,
      currency: 'KRW',
      features: [
        'ERP 포함',
        '최대 50명 사용자',
        '우선 지원',
      ],
      popular: true,
    },
    {
      id: 'enterprise',
      name: '엔터프라이즈',
      price: 500000,
      currency: 'KRW',
      features: [
        '모든 기능',
        '무제한 사용자',
        '전담 지원',
      ],
    },
  ],
  
  // 온보딩 단계
  ONBOARDING_STEPS: [
    { id: 1, label: '기본 정보', description: '기본 정보 입력' },
    { id: 2, label: '업종 선택', description: '업종 선택' },
    { id: 3, label: '요금제 선택', description: '요금제 선택' },
    { id: 4, label: '결제 수단', description: '결제 수단 등록' },
    { id: 5, label: '신청 완료', description: '신청 완료' },
  ],
  
  // 온보딩 단계 상수
  ONBOARDING_STEP: {
    BASIC_INFO: 1,
    BUSINESS_TYPE: 2,
    PRICING_PLAN: 3,
    PAYMENT_METHOD: 4,
    COMPLETION: 5,
  },
  
  // 업종 옵션
  BUSINESS_TYPES: [
    { id: 'academy', label: '학원' },
    { id: 'restaurant', label: '요식업' },
    { id: 'beauty', label: '미용' },
    { id: 'other', label: '기타' },
  ],
  
  // API 엔드포인트
  API_ENDPOINTS: {
    ONBOARDING_REQUEST: '/api/v1/onboarding/requests',
    PRICING_PLANS: '/api/v1/ops/plans/active',
  },
  
  // 메시지
  MESSAGES: {
    ONBOARDING_SUCCESS: '신청이 완료되었습니다. 검토 후 연락드리겠습니다.',
    ONBOARDING_ERROR: '신청 처리 중 오류가 발생했습니다.',
    LOADING: '처리 중...',
    LOADING_PRICING: '요금제 정보를 불러오는 중...',
    LOADING_PRICING_HOMEPAGE: '요금제 정보를 불러오는 중...',
    LOADING_CATEGORIES: '업종 정보를 불러오는 중...',
    ERROR_PRICING: '요금제 정보를 불러오는데 실패했습니다.',
    WARNING_PRICING_PARTIAL: '일부 요금제 정보를 불러오지 못했습니다.',
    ERROR_CATEGORIES: '업종 정보를 불러오는데 실패했습니다.',
    ERROR_PAYMENT: '결제 수단 등록 중 오류가 발생했습니다.',
    NO_PRICING_PLANS: '현재 활성화된 요금제가 없습니다.',
    NO_CATEGORY_ITEMS: '선택한 카테고리에 세부 업종이 없습니다.',
    RETRY: '다시 시도',
    SUBMIT: '제출하기',
    PROCESSING: '처리 중...',
    SUBMITTING: '제출 중...',
    NEXT: '다음',
    PREVIOUS: '이전',
    GO_HOME: '홈으로 돌아가기',
    PLACEHOLDER_COMPANY_NAME: '회사명을 입력하세요',
    PLACEHOLDER_EMAIL: '이메일을 입력하세요',
    PLACEHOLDER_EMAIL_LOCAL: '이메일 아이디',
    PLACEHOLDER_PHONE: '연락처를 입력하세요',
    // 결제 수단 관련
    ERROR_PAYMENT_METHOD_REQUIRED: '결제 수단을 등록해주세요.',
    PAYMENT_METHOD_REGISTERED: '✅ 결제 수단이 등록되었습니다.',
    // 이메일 관련 에러
    ERROR_EMAIL_REQUIRED: '이메일을 입력해주세요.',
    ERROR_EMAIL_INVALID: '올바른 이메일 형식이 아닙니다. (예: user@example.com)',
    ERROR_EMAIL_LOCAL_REQUIRED: '이메일 아이디를 입력해주세요.',
    ERROR_EMAIL_LOCAL_TOO_LONG: '이메일 아이디는 64자 이하여야 합니다.',
    ERROR_EMAIL_LOCAL_INVALID: '이메일 아이디에 사용할 수 없는 문자가 포함되어 있습니다.',
    ERROR_EMAIL_DOMAIN_REQUIRED: '이메일 도메인을 입력해주세요.',
    ERROR_EMAIL_DOMAIN_TOO_LONG: '이메일 도메인은 255자 이하여야 합니다.',
    ERROR_EMAIL_DOMAIN_INVALID: '올바른 도메인 형식이 아닙니다. (예: example.com)',
    ERROR_REQUIRED_FIELDS: '모든 필수 항목을 입력해주세요.',
    AUTO_BILLING_ENABLED: '자동 과금이 활성화되었습니다.',
    AUTO_BILLING_INFO: '승인 시 첫 결제가 자동으로 진행되며, 이후 매월 자동으로 결제됩니다.',
    AUTO_BILLING_SUCCESS_INFO: '승인 시 첫 결제가 자동으로 진행되고 서비스가 활성화됩니다.\n이후 매월 자동으로 결제되며, 결제 전 이메일로 안내드립니다.',
    PAYMENT_METHOD_SKIP_INFO: '카드 등록 없이 신청하셨습니다. 승인 후 서비스 이용이 가능하며, 결제 수단은 나중에 등록하실 수 있습니다.',
    PAYMENT_METHOD_VERIFICATION_PENDING: '결제 수단 검증 중...',
    PAYMENT_METHOD_VERIFIED: '✅ 결제 수단 검증 완료',
    PAYMENT_METHOD_VERIFICATION_FAILED: '결제 수단 검증에 실패했습니다. 다시 시도해주세요.',
  },
  
  // 결제 관련 상수
  PAYMENT: {
    CARD_NUMBER_PLACEHOLDER: '1234 5678 9012 3456',
    CARD_EXPIRY_PLACEHOLDER: '12/25',
    CVC_PLACEHOLDER: '123',
    CARDHOLDER_PLACEHOLDER: '홍길동',
    CARD_NUMBER_MAX_LENGTH: 19,
    CARD_EXPIRY_MAX_LENGTH: 5,
    CVC_MAX_LENGTH: 4,
    CARD_NUMBER_MIN_LENGTH: 16,
    DEFAULT_PG_PROVIDER: 'TOSS',
    DEFAULT_CARD_BRAND: 'VISA',
    DEFAULT_CARD_LAST4: '1234',
    DEFAULT_EXP_MONTH: 12,
    DEFAULT_EXP_YEAR: 2025,
    DEFAULT_BILLING_CYCLE: 'MONTHLY',
    // 테스트 모드 (PG 콜백 검증 우회)
    TEST_MODE: true, // TODO: 프로덕션에서는 false로 변경
    // PG 콜백 검증 (추후 구현)
    ENABLE_PG_CALLBACK_VERIFICATION: false, // TODO: 프로덕션에서는 true로 변경
  },
  
  // 기능 코드 한글 매핑
  FEATURE_NAMES: {
    CONSULTATION: '상담 관리',
    APPOINTMENT: '예약 관리',
    PAYMENT: '결제 관리',
    NOTIFICATION: '알림 기능',
    ATTENDANCE: '출결 관리',
    CRM: 'CRM 기능',
    STATISTICS: '통계 분석',
    ORDER_MANAGEMENT: '주문 관리',
  },
  
  // 이메일 도메인 목록
  EMAIL_DOMAINS: [
    '@gmail.com',
    '@naver.com',
    '@daum.net',
    '@kakao.com',
    '@outlook.com',
    '@yahoo.com',
    '@hanmail.net',
    '@nate.com',
    '@icloud.com',
    '@company.co.kr',
    '@직접입력',
  ],
};

