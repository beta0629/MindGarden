/**
 * 매핑 관련 상수 정의
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */

// 매핑 상태 상수
export const MAPPING_STATUS = {
    PENDING_PAYMENT: 'PENDING_PAYMENT',
    PAYMENT_CONFIRMED: 'PAYMENT_CONFIRMED',
    ACTIVE: 'ACTIVE',
    INACTIVE: 'INACTIVE',
    SUSPENDED: 'SUSPENDED',
    TERMINATED: 'TERMINATED',
    SESSIONS_EXHAUSTED: 'SESSIONS_EXHAUSTED'
};

// 매핑 상태 한글명
export const MAPPING_STATUS_LABELS = {
    [MAPPING_STATUS.PENDING_PAYMENT]: '입금 대기',
    [MAPPING_STATUS.PAYMENT_CONFIRMED]: '입금 확인',
    [MAPPING_STATUS.ACTIVE]: '활성',
    [MAPPING_STATUS.INACTIVE]: '비활성',
    [MAPPING_STATUS.SUSPENDED]: '중단',
    [MAPPING_STATUS.TERMINATED]: '종료',
    [MAPPING_STATUS.SESSIONS_EXHAUSTED]: '회기 소진'
};

// 매핑 상태 색상
export const MAPPING_STATUS_COLORS = {
    [MAPPING_STATUS.PENDING_PAYMENT]: '#ffc107',
    [MAPPING_STATUS.PAYMENT_CONFIRMED]: '#17a2b8',
    [MAPPING_STATUS.ACTIVE]: '#28a745',
    [MAPPING_STATUS.INACTIVE]: '#6c757d',
    [MAPPING_STATUS.SUSPENDED]: '#fd7e14',
    [MAPPING_STATUS.TERMINATED]: '#dc3545',
    [MAPPING_STATUS.SESSIONS_EXHAUSTED]: '#6f42c1'
};

// 매핑 상태 배경색
export const MAPPING_STATUS_BG_COLORS = {
    [MAPPING_STATUS.PENDING_PAYMENT]: '#fff3cd',
    [MAPPING_STATUS.PAYMENT_CONFIRMED]: '#d1ecf1',
    [MAPPING_STATUS.ACTIVE]: '#d4edda',
    [MAPPING_STATUS.INACTIVE]: '#f8f9fa',
    [MAPPING_STATUS.SUSPENDED]: '#ffeaa7',
    [MAPPING_STATUS.TERMINATED]: '#f8d7da',
    [MAPPING_STATUS.SESSIONS_EXHAUSTED]: '#e2e3f1'
};

// 결제 상태 상수
export const PAYMENT_STATUS = {
    PENDING: 'PENDING',
    CONFIRMED: 'CONFIRMED',
    APPROVED: 'APPROVED',
    REJECTED: 'REJECTED',
    REFUNDED: 'REFUNDED'
};

// 결제 상태 한글명
export const PAYMENT_STATUS_LABELS = {
    [PAYMENT_STATUS.PENDING]: '대기',
    [PAYMENT_STATUS.CONFIRMED]: '확인됨',
    [PAYMENT_STATUS.APPROVED]: '승인됨',
    [PAYMENT_STATUS.REJECTED]: '거부됨',
    [PAYMENT_STATUS.REFUNDED]: '환불됨'
};

// 매핑 액션 상수
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

// 매핑 액션 버튼 설정
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

// 매핑 통계 아이콘
export const MAPPING_STAT_ICONS = {
    PENDING: '⏳',
    ACTIVE: '✅',
    PAYMENT_CONFIRMED: '💰',
    TOTAL: '📊',
    TERMINATED: '❌',
    SESSIONS_EXHAUSTED: '🔚'
};

// 매핑 통계 라벨
export const MAPPING_STAT_LABELS = {
    PENDING: '승인 대기',
    ACTIVE: '활성 매핑',
    PAYMENT_CONFIRMED: '입금 확인',
    TOTAL: '전체 매핑',
    TERMINATED: '종료됨',
    SESSIONS_EXHAUSTED: '회기 소진'
};

// 매핑 통계 색상
export const MAPPING_STAT_COLORS = {
    PENDING: '#ffc107',
    ACTIVE: '#28a745',
    PAYMENT_CONFIRMED: '#17a2b8',
    TOTAL: '#6f42c1',
    TERMINATED: '#dc3545',
    SESSIONS_EXHAUSTED: '#fd7e14'
};

// 매핑 통계 배경색
export const MAPPING_STAT_BG_COLORS = {
    PENDING: '#fff3cd',
    ACTIVE: '#d4edda',
    PAYMENT_CONFIRMED: '#d1ecf1',
    TOTAL: '#e2e3f1',
    TERMINATED: '#f8d7da',
    SESSIONS_EXHAUSTED: '#ffeaa7'
};

// 매핑 필터 옵션
export const MAPPING_FILTER_OPTIONS = [
    { value: 'ALL', label: '전체' },
    { value: MAPPING_STATUS.PENDING_PAYMENT, label: MAPPING_STATUS_LABELS[MAPPING_STATUS.PENDING_PAYMENT] },
    { value: MAPPING_STATUS.PAYMENT_CONFIRMED, label: MAPPING_STATUS_LABELS[MAPPING_STATUS.PAYMENT_CONFIRMED] },
    { value: MAPPING_STATUS.ACTIVE, label: MAPPING_STATUS_LABELS[MAPPING_STATUS.ACTIVE] },
    { value: MAPPING_STATUS.INACTIVE, label: MAPPING_STATUS_LABELS[MAPPING_STATUS.INACTIVE] },
    { value: MAPPING_STATUS.SUSPENDED, label: MAPPING_STATUS_LABELS[MAPPING_STATUS.SUSPENDED] },
    { value: MAPPING_STATUS.TERMINATED, label: MAPPING_STATUS_LABELS[MAPPING_STATUS.TERMINATED] },
    { value: MAPPING_STATUS.SESSIONS_EXHAUSTED, label: MAPPING_STATUS_LABELS[MAPPING_STATUS.SESSIONS_EXHAUSTED] }
];

// 매핑 생성 단계
export const MAPPING_CREATION_STEPS = {
    CONSULTANT_SELECTION: 1,
    CLIENT_SELECTION: 2,
    PAYMENT_INFO: 3,
    COMPLETION: 4
};

// 매핑 생성 단계 라벨
export const MAPPING_CREATION_STEP_LABELS = {
    [MAPPING_CREATION_STEPS.CONSULTANT_SELECTION]: '상담사 선택',
    [MAPPING_CREATION_STEPS.CLIENT_SELECTION]: '내담자 선택',
    [MAPPING_CREATION_STEPS.PAYMENT_INFO]: '결제 정보',
    [MAPPING_CREATION_STEPS.COMPLETION]: '완료'
};

// 패키지 옵션 (공통 코드에서 동적으로 로드됨)
export const PACKAGE_OPTIONS = [];

// 결제 방법 옵션 (공통 코드에서 동적으로 로드됨)
export const PAYMENT_METHOD_OPTIONS = [];

// 담당 업무 옵션 (공통 코드에서 동적으로 로드됨)
export const RESPONSIBILITY_OPTIONS = [];

// 기본 매핑 설정
export const DEFAULT_MAPPING_CONFIG = {
    TOTAL_SESSIONS: 10,
    PACKAGE_NAME: '기본 10회기 패키지',
    PACKAGE_PRICE: 500000,
    PAYMENT_METHOD: '신용카드',
    RESPONSIBILITY: '정신건강 상담'
};

// 매핑 API 엔드포인트
export const MAPPING_API_ENDPOINTS = {
    LIST: '/api/admin/mappings',
    CREATE: '/api/admin/mappings',
    UPDATE: '/api/admin/mappings',
    DELETE: '/api/admin/mappings',
    APPROVE: '/api/admin/mappings',
    REJECT: '/api/admin/mappings',
    TEST_CREATE: '/api/test/create-mapping',
    TEST_MAPPING: '/api/test/mapping'
};

// 매핑 메시지
export const MAPPING_MESSAGES = {
    LOADING: '매핑 목록을 불러오는 중...',
    LOAD_FAILED: '매핑 목록을 불러오는데 실패했습니다.',
    CREATE_SUCCESS: '매핑이 성공적으로 생성되었습니다!',
    CREATE_FAILED: '매핑 생성에 실패했습니다.',
    APPROVE_SUCCESS: '매핑이 승인되었습니다.',
    APPROVE_FAILED: '매핑 승인에 실패했습니다.',
    REJECT_SUCCESS: '매핑이 거부되었습니다.',
    REJECT_FAILED: '매핑 거부에 실패했습니다.',
    NO_MAPPINGS: '매핑이 없습니다',
    NO_MAPPINGS_DESC: '새로운 매핑을 생성해보세요.',
    MAPPING_REQUIRED: '매핑된 내담자가 없습니다',
    MAPPING_REQUIRED_DESC: '스케줄을 생성하려면 먼저 상담사와 내담자 간의 매핑을 생성해야 합니다. 매핑 생성 후 결제 승인을 받으면 스케줄을 등록할 수 있습니다.'
};
