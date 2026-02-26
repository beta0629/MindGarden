/**
 * 매칭 관련 상수 정의 (동적 처리 지원)
/**
 * 
/**
 * @author Core Solution
/**
 * @version 2.0.0
/**
 * @since 2024-12-19
/**
 * @updated 2025-09-14 - 하드코딩된 색상/아이콘 매칭을 동적 처리로 변경
 */

export const MAPPING_STATUS = {
    PENDING_PAYMENT: 'PENDING_PAYMENT',
    PAYMENT_CONFIRMED: 'PAYMENT_CONFIRMED',
    // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
    ACTIVE: 'ACTIVE',
    // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
    INACTIVE: 'INACTIVE',
    // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
    SUSPENDED: 'SUSPENDED',
    TERMINATED: 'TERMINATED',
    SESSIONS_EXHAUSTED: 'SESSIONS_EXHAUSTED'
};

export const MAPPING_STATUS_LABELS = {
    [MAPPING_STATUS.PENDING_PAYMENT]: '결제 대기',
    [MAPPING_STATUS.PAYMENT_CONFIRMED]: '결제 확인',
    // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
    [MAPPING_STATUS.ACTIVE]: '활성',
    // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
    [MAPPING_STATUS.INACTIVE]: '비활성',
    // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
    [MAPPING_STATUS.SUSPENDED]: '일시정지',
    [MAPPING_STATUS.TERMINATED]: '종료',
    [MAPPING_STATUS.SESSIONS_EXHAUSTED]: '회기 소진'
};

export const MAPPING_STATUS_COLORS = {
    [MAPPING_STATUS.PENDING_PAYMENT]: 'var(--mg-warning-500)',
    [MAPPING_STATUS.PAYMENT_CONFIRMED]: 'var(--mg-info-500)',
    // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
    [MAPPING_STATUS.ACTIVE]: 'var(--mg-success-500)',
    // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
    [MAPPING_STATUS.INACTIVE]: 'var(--mg-secondary-500)',
    // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
    [MAPPING_STATUS.SUSPENDED]: '#fd7e14',
    [MAPPING_STATUS.TERMINATED]: 'var(--mg-error-500)',
    [MAPPING_STATUS.SESSIONS_EXHAUSTED]: '#6f42c1'
};

export const MAPPING_STATUS_BG_COLORS = {
    [MAPPING_STATUS.PENDING_PAYMENT]: '#fff3cd',
    [MAPPING_STATUS.PAYMENT_CONFIRMED]: '#d1ecf1',
    // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
    [MAPPING_STATUS.ACTIVE]: '#d4edda',
    // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
    [MAPPING_STATUS.INACTIVE]: 'var(--mg-gray-100)',
    // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
    [MAPPING_STATUS.SUSPENDED]: '#ffeaa7',
    [MAPPING_STATUS.TERMINATED]: '#f8d7da',
    [MAPPING_STATUS.SESSIONS_EXHAUSTED]: '#e2e3f1'
};

export const PAYMENT_STATUS = {
    // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
    PENDING: 'PENDING',
    // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
    CONFIRMED: 'CONFIRMED',
    // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
    APPROVED: 'APPROVED',
    // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
    REJECTED: 'REJECTED',
    REFUNDED: 'REFUNDED'
};

export const PAYMENT_STATUS_LABELS = {
    // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
    [PAYMENT_STATUS.PENDING]: '대기',
    // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
    [PAYMENT_STATUS.CONFIRMED]: '확인됨',
    // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
    [PAYMENT_STATUS.APPROVED]: '승인됨',
    // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
    [PAYMENT_STATUS.REJECTED]: '거부됨',
    [PAYMENT_STATUS.REFUNDED]: '환불됨'
};

export const MAPPING_ACTIONS = {
    APPROVE: 'approve',
    REJECT: 'reject',
    EDIT: 'edit',
    DELETE: 'delete',
    VIEW: 'view',
    EXTEND: 'extend',
    SUSPEND: 'suspend',
    ACTIVATE: 'activate'
};

export const MAPPING_ACTION_BUTTONS = {
    [MAPPING_ACTIONS.APPROVE]: {
        label: '승인',
        icon: 'bi-check-circle',
        className: 'btn-success'
    },
    [MAPPING_ACTIONS.REJECT]: {
        label: '거부',
        icon: 'bi-x-circle',
        className: 'btn-danger'
    },
    [MAPPING_ACTIONS.EDIT]: {
        label: '수정',
        icon: 'bi-pencil',
        className: 'btn-warning'
    },
    [MAPPING_ACTIONS.DELETE]: {
        label: '삭제',
        icon: 'bi-trash',
        className: 'btn-outline-danger'
    },
    [MAPPING_ACTIONS.VIEW]: {
        label: '상세보기',
        icon: 'bi-eye',
        className: 'btn-info'
    },
    [MAPPING_ACTIONS.EXTEND]: {
        label: '연장',
        icon: 'bi-plus-circle',
        className: 'btn-info'
    },
    [MAPPING_ACTIONS.SUSPEND]: {
        label: '중단',
        icon: 'bi-pause-circle',
        className: 'btn-secondary'
    },
    [MAPPING_ACTIONS.ACTIVATE]: {
        label: '재개',
        icon: 'bi-play-circle',
        className: 'btn-success'
    }
};

export const MAPPING_STAT_ICONS = {
    // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
    PENDING: '⏳',
    // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
    ACTIVE: '✅',
    PAYMENT_CONFIRMED: '💰',
    TOTAL: '📊',
    TERMINATED: '❌',
    SESSIONS_EXHAUSTED: '🔚'
};

export const MAPPING_STAT_LABELS = {
    // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
    PENDING: '결제 대기',
    // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
    ACTIVE: '활성 매칭',
    PAYMENT_CONFIRMED: '결제 확인',
    TOTAL: '전체 매칭',
    TERMINATED: '종료',
    SESSIONS_EXHAUSTED: '회기 소진'
};

export const MAPPING_STAT_COLORS = {
    // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
    PENDING: 'var(--mg-warning-500)',
    // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
    ACTIVE: 'var(--mg-success-500)',
    PAYMENT_CONFIRMED: 'var(--mg-info-500)',
    TOTAL: '#6f42c1',
    TERMINATED: 'var(--mg-error-500)',
    SESSIONS_EXHAUSTED: '#fd7e14'
};

export const MAPPING_STAT_BG_COLORS = {
    // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
    PENDING: '#fff3cd',
    // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
    ACTIVE: '#d4edda',
    PAYMENT_CONFIRMED: '#d1ecf1',
    TOTAL: '#e2e3f1',
    TERMINATED: '#f8d7da',
    SESSIONS_EXHAUSTED: '#ffeaa7'
};

export const MAPPING_FILTER_OPTIONS = [
    { value: 'ALL', label: '전체' },
    { value: MAPPING_STATUS.PENDING_PAYMENT, label: MAPPING_STATUS_LABELS[MAPPING_STATUS.PENDING_PAYMENT] },
    { value: MAPPING_STATUS.PAYMENT_CONFIRMED, label: MAPPING_STATUS_LABELS[MAPPING_STATUS.PAYMENT_CONFIRMED] },
    // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
    { value: MAPPING_STATUS.ACTIVE, label: MAPPING_STATUS_LABELS[MAPPING_STATUS.ACTIVE] },
    // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
    { value: MAPPING_STATUS.INACTIVE, label: MAPPING_STATUS_LABELS[MAPPING_STATUS.INACTIVE] },
    // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
    { value: MAPPING_STATUS.SUSPENDED, label: MAPPING_STATUS_LABELS[MAPPING_STATUS.SUSPENDED] },
    { value: MAPPING_STATUS.TERMINATED, label: MAPPING_STATUS_LABELS[MAPPING_STATUS.TERMINATED] },
    { value: MAPPING_STATUS.SESSIONS_EXHAUSTED, label: MAPPING_STATUS_LABELS[MAPPING_STATUS.SESSIONS_EXHAUSTED] }
];

export const MAPPING_CREATION_STEPS = {
    CONSULTANT_SELECTION: 1,
    CLIENT_SELECTION: 2,
    PAYMENT_INFO: 3,
    COMPLETION: 4
};

export const MAPPING_CREATION_STEP_LABELS = {
    [MAPPING_CREATION_STEPS.CONSULTANT_SELECTION]: '상담사 선택',
    [MAPPING_CREATION_STEPS.CLIENT_SELECTION]: '내담자 선택',
    [MAPPING_CREATION_STEPS.PAYMENT_INFO]: '결제 정보',
    [MAPPING_CREATION_STEPS.COMPLETION]: '완료'
};

export const PACKAGE_OPTIONS = [];

export const PAYMENT_METHOD_OPTIONS = [];

export const RESPONSIBILITY_OPTIONS = [];

export const DEFAULT_MAPPING_CONFIG = {
    TOTAL_SESSIONS: 10,
    PACKAGE_NAME: '기본 10회기 패키지',
    PACKAGE_PRICE: 500000,
    PAYMENT_METHOD: '신용카드',
    RESPONSIBILITY: '정신건강 상담'
};

export const MAPPING_API_ENDPOINTS = {
    LIST: '/api/v1/admin/mappings',
    CREATE: '/api/v1/admin/mappings',
    UPDATE: '/api/v1/admin/mappings',
    DELETE: '/api/v1/admin/mappings',
    APPROVE: '/api/v1/admin/mappings',
    REJECT: '/api/v1/admin/mappings',
    TEST_CREATE: '/api/v1/test/create-mapping',
    TEST_MAPPING: '/api/v1/test/mapping'
};

export const MAPPING_MESSAGES = {
    LOADING: '매칭 목록을 불러오는 중...',
    LOAD_FAILED: '매칭 목록을 불러오는데 실패했습니다.',
    CREATE_SUCCESS: '매칭이 성공적으로 생성되었습니다!',
    CREATE_FAILED: '매칭 생성에 실패했습니다.',
    APPROVE_SUCCESS: '매칭이 승인되었습니다.',
    APPROVE_FAILED: '매칭 승인에 실패했습니다.',
    REJECT_SUCCESS: '매칭이 거부되었습니다.',
    REJECT_FAILED: '매칭 거부에 실패했습니다.',
    NO_MAPPINGS: '매칭이 없습니다',
    NO_MAPPINGS_DESC: '새로운 매칭을 생성해보세요.',
    MAPPING_REQUIRED: '매칭된 내담자가 없습니다',
    MAPPING_REQUIRED_DESC: '스케줄을 생성하려면 먼저 상담사와 내담자 간의 매칭을 생성해야 합니다. 매칭 생성 후 결제 승인을 받으면 스케줄을 등록할 수 있습니다.'
};
