/**
 * 테넌트 코드 관리 관련 상수 정의
/**
 * - 코드 그룹 분류
/**
 * - UI 상수
/**
 * - 메시지 상수
/**
 * 
/**
 * @author Core Solution
/**
 * @version 1.0.0
/**
 * @since 2025-11-26
 */

// 테넌트 독립 코드 그룹 정의
export const TENANT_CODE_GROUPS = [
    'CONSULTATION_PACKAGE',
    'PACKAGE_TYPE', 
    'PAYMENT_METHOD',
    'SPECIALTY',
    'CONSULTATION_TYPE',
    'MAPPING_STATUS',
    'RESPONSIBILITY',
    'CONSULTANT_GRADE'
];

// 코어 코드 그룹 정의
export const CORE_CODE_GROUPS = [
    'USER_STATUS',
    'USER_ROLE',
    'ROLE',
    'CODE_GROUP_TYPE',
    'SYSTEM_STATUS',
    'NOTIFICATION_TYPE'
];

// 탭 타입 상수
export const TAB_TYPES = {
    TENANT: 'tenant',
    CORE: 'core'
};

// 모달 타입 상수
export const MODAL_TYPES = {
    ADD: 'add',
    EDIT: 'edit',
    VIEW: 'view'
};

// 폼 필드 기본값
export const DEFAULT_FORM_DATA = {
    codeValue: '',
    codeLabel: '',
    koreanName: '',
    codeDescription: '',
    sortOrder: 1,
    isActive: true,
    colorCode: '',
    icon: ''
};

// UI 텍스트 상수
export const UI_TEXT = {
    PAGE_TITLE: '🏢 테넌트 코드 관리',
    PAGE_DESCRIPTION: '테넌트별 독립 코드와 시스템 코어 코드를 관리합니다.',
    
    TAB_TENANT: '테넌트 코드',
    TAB_CORE: '코어 코드',
    
    TENANT_DESCRIPTION: '테넌트별로 독립적으로 관리되는 코드 그룹입니다.',
    CORE_DESCRIPTION: '시스템 전체에서 공통으로 사용되는 코드 그룹입니다.',
    
    SELECT_GROUP: '코드 그룹을 선택하세요',
    SELECT_GROUP_DESC: '왼쪽에서 관리할 코드 그룹을 선택해주세요.',
    
    LOADING_CODES: '코드 목록을 불러오는 중...',
    NO_CODES: '등록된 코드가 없습니다.',
    FIRST_CODE: '첫 번째 코드 추가하기',
    
    SEARCH_PLACEHOLDER: '코드 검색...',
    ADD_CODE: '코드 추가',
    
    TENANT_BADGE: '테넌트 독립 코드',
    CORE_BADGE: '시스템 코어 코드',
    TENANT_CODE: '테넌트 코드',
    CORE_CODE: '코어 코드',
    
    STATUS_ACTIVE: '활성',
    STATUS_INACTIVE: '비활성',
    
    SORT_ORDER: '순서',
    
    // 모달 텍스트
    MODAL_ADD_TITLE: '코드 추가',
    MODAL_EDIT_TITLE: '코드 수정',
    MODAL_VIEW_TITLE: '코드 상세',
    
    // 폼 라벨
    FORM_CODE_VALUE: '코드 값',
    FORM_CODE_LABEL: '코드 라벨',
    FORM_KOREAN_NAME: '한글명',
    FORM_DESCRIPTION: '설명',
    FORM_SORT_ORDER: '정렬 순서',
    FORM_ICON: '아이콘',
    FORM_COLOR: '색상 코드',
    FORM_ACTIVE: '활성 상태',
    
    // 플레이스홀더
    PLACEHOLDER_CODE_VALUE: '예: BASIC, PREMIUM',
    PLACEHOLDER_CODE_LABEL: '예: Basic Package',
    PLACEHOLDER_KOREAN_NAME: '예: 기본 패키지',
    PLACEHOLDER_DESCRIPTION: '코드에 대한 설명을 입력하세요',
    PLACEHOLDER_ICON: '예: 📦, 💎, ⭐',
    
    // 버튼 텍스트
    BTN_CANCEL: '취소',
    BTN_ADD: '추가',
    BTN_EDIT: '수정',
    BTN_SAVE: '저장',
    BTN_DELETE: '삭제',
    BTN_VIEW: '상세 보기',
    
    // 툴팁
    TOOLTIP_VIEW: '상세 보기',
    TOOLTIP_EDIT: '수정',
    TOOLTIP_DELETE: '삭제'
};

// 알림 메시지 상수
export const NOTIFICATION_MESSAGES = {
    LOAD_ERROR: '코드 목록을 불러오는데 실패했습니다.',
    SAVE_SUCCESS: '코드가 저장되었습니다.',
    SAVE_ERROR: '코드 저장에 실패했습니다.',
    UPDATE_SUCCESS: '코드가 수정되었습니다.',
    UPDATE_ERROR: '코드 수정에 실패했습니다.',
    DELETE_SUCCESS: '코드가 삭제되었습니다.',
    DELETE_ERROR: '코드 삭제에 실패했습니다.',
    DELETE_CONFIRM: '정말로 이 코드를 삭제하시겠습니까?'
};

// 그리드 및 레이아웃 상수
export const LAYOUT_CONSTANTS = {
    SIDEBAR_WIDTH: '350px',
    MODAL_MAX_WIDTH: '600px',
    MODAL_MAX_HEIGHT: '90vh',
    CARD_MIN_WIDTH: '300px',
    SEARCH_INPUT_WIDTH: '250px',
    
    // 그리드 설정
    GRID_COLUMNS: 'repeat(auto-fill, minmax(300px, 1fr))',
    GRID_GAP: '1rem',
    
    // 반응형 브레이크포인트
    BREAKPOINT_TABLET: '1024px',
    BREAKPOINT_MOBILE: '768px'
};

// 애니메이션 상수
export const ANIMATION_CONSTANTS = {
    TRANSITION_DURATION: '0.2s',
    TRANSITION_EASING: 'ease',
    SPIN_DURATION: '1s',
    HOVER_SCALE: '1.02'
};

// 색상 상수 (CSS 변수와 연동)
export const COLOR_CONSTANTS = {
    // 테넌트 코드 색상
    TENANT_PRIMARY: 'var(--mg-color-success-500)',
    TENANT_LIGHT: 'var(--mg-color-success-100)',
    TENANT_BORDER: 'var(--mg-color-success-300)',
    
    // 코어 코드 색상
    CORE_PRIMARY: 'var(--mg-color-warning-500)',
    CORE_LIGHT: 'var(--mg-color-warning-100)',
    CORE_BORDER: 'var(--mg-color-warning-300)',
    
    // 상태 색상
    STATUS_ACTIVE_BG: 'var(--mg-color-success-100)',
    STATUS_ACTIVE_TEXT: 'var(--mg-color-success-800)',
    STATUS_INACTIVE_BG: 'var(--mg-color-error-100)',
    STATUS_INACTIVE_TEXT: 'var(--mg-color-error-800)',
    
    // 기본 색상
    PRIMARY: 'var(--mg-color-primary-500)',
    SECONDARY: 'var(--mg-color-gray-500)',
    BACKGROUND: 'var(--mg-color-white)',
    SURFACE: 'var(--mg-color-gray-50)',
    BORDER: 'var(--mg-color-gray-200)',
    TEXT_PRIMARY: 'var(--mg-color-gray-900)',
    TEXT_SECONDARY: 'var(--mg-color-gray-600)',
    
    // 액션 버튼 색상
    ACTION_VIEW: 'var(--mg-color-primary-500)',
    ACTION_EDIT: 'var(--mg-color-success-500)',
    ACTION_DELETE: 'var(--mg-color-error-500)'
};

// 아이콘 크기 상수
export const ICON_SIZES = {
    SMALL: '1rem',
    MEDIUM: '1.25rem',
    LARGE: '1.5rem',
    XLARGE: '2rem',
    HERO: '3rem'
};

// Z-index 상수
export const Z_INDEX = {
    MODAL: 1000,
    DROPDOWN: 100,
    TOOLTIP: 50
};

// 폼 검증 상수
export const VALIDATION = {
    CODE_VALUE_MIN_LENGTH: 1,
    CODE_VALUE_MAX_LENGTH: 50,
    CODE_LABEL_MIN_LENGTH: 1,
    CODE_LABEL_MAX_LENGTH: 100,
    KOREAN_NAME_MIN_LENGTH: 1,
    KOREAN_NAME_MAX_LENGTH: 100,
    DESCRIPTION_MAX_LENGTH: 500,
    SORT_ORDER_MIN: 1,
    SORT_ORDER_MAX: 9999
};

// API 엔드포인트 상수
export const API_ENDPOINTS = {
    COMMON_CODES: '/api/v1/common-codes',
    TENANT_CODES: '/api/v1/common-codes/tenant',
    CORE_CODES: '/api/v1/common-codes/core',
    METADATA: '/api/v1/common-codes/metadata'
};

// 권한 상수
export const PERMISSIONS = {
    TENANT_CODE_EDIT: 'TENANT_CODE_EDIT',
    CORE_CODE_EDIT: 'CORE_CODE_EDIT',
    SYSTEM_ADMIN: 'HQ_ADMIN'
};
