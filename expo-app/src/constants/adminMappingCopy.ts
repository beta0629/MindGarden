/**
 * 어드민 모바일 — 매칭·스케줄 허브 카피
 *
 * @author MindGarden
 * @since 2026-05-18
 */

export const ADMIN_MAPPING_DEFAULTS = {
  TOTAL_SESSIONS: 10,
  PACKAGE_NAME: '기본 10회기 패키지',
  PACKAGE_PRICE: 500_000,
  PAYMENT_METHOD: 'BANK_TRANSFER',
  RESPONSIBILITY: '정신건강 상담',
} as const;

export const ADMIN_MAPPING_COPY = {
  HUB_TITLE: '일정·매칭',
  TAB_SCHEDULE: '일정',
  TAB_MAPPINGS: '매칭',
  FAB_SHEET_TITLE: '등록',
  FAB_SCHEDULE: '일정 등록',
  FAB_NEW_MAPPING: '신규 매칭',
  FILTER_ONGOING: '진행중',
  FILTER_REMAINING: '잔여 회기',
  FILTER_ALL: '전체',
  EMPTY_MAPPINGS: '표시할 매칭이 없습니다.',
  MAPPINGS_ERROR: '매칭 목록을 불러오지 못했습니다.',
  REMAINING_SESSIONS: (n: number) => `잔여 ${n}회`,
  ACTION_SCHEDULE_FROM_MAPPING: '이 매칭으로 일정 잡기',
  ACCESS_VIEW_DENIED: '매칭 조회 권한이 없습니다. 관리자에게 문의해 주세요.',
  ACCESS_MANAGE_DENIED: '매칭 생성 권한이 없습니다. 관리자에게 문의해 주세요.',
  FORBIDDEN_TITLE: '접근 제한',
  CREATE_TITLE: '신규 매칭',
  STEP_CONSULTANT: '상담사',
  STEP_PACKAGE: '패키지',
  STEP_CLIENT: '내담자',
  STEP_PAYMENT: '결제',
  STEP_DONE: '완료',
  STEP_OF: (current: number, total: number) => `${current}/${total}`,
  SEARCH_CONSULTANT: '이름 또는 이메일 검색',
  SEARCH_CLIENT: '이름 또는 연락처 검색',
  LABEL_PACKAGE: '상담 패키지',
  LABEL_SESSIONS: '총 회기',
  LABEL_PRICE: '패키지 금액',
  LABEL_PAYMENT_METHOD: '결제 수단',
  LABEL_PAYMENT_REF: '결제 참조번호',
  LABEL_RESPONSIBILITY: '책임 소재',
  LABEL_SPECIAL: '특이사항 (선택)',
  LABEL_NOTES: '메모 (선택)',
  SUBMIT: '매칭 생성',
  PREV: '이전',
  NEXT: '다음',
  CANCEL: '취소',
  CANCEL_CONFIRM_TITLE: '등록 취소',
  CANCEL_CONFIRM_BODY: '작성 중인 내용이 사라집니다. 취소하시겠습니까?',
  SUCCESS_TITLE: '매칭 생성 완료',
  SUCCESS_BODY: '신규 매칭이 등록되었습니다.',
  ERROR_TITLE: '매칭 생성 실패',
  VALIDATION_PICK_CONSULTANT: '상담사를 선택해 주세요.',
  VALIDATION_PICK_CLIENT: '내담자를 선택해 주세요.',
  VALIDATION_PACKAGE: '패키지를 선택해 주세요.',
  VALIDATION_PAYMENT: '결제 정보를 확인해 주세요.',
  EMPTY_CONSULTANTS: '등록된 상담사가 없습니다.',
  EMPTY_CLIENTS: '등록된 내담자가 없습니다.',
  EMPTY_PACKAGES: '등록된 상담 패키지가 없습니다. 공통코드를 확인해 주세요.',
  DONE_HINT: '매칭 탭에서 목록을 확인하거나 일정을 등록할 수 있습니다.',
  DONE_BACK: '매칭 목록으로',
} as const;

export const ADMIN_MAPPING_STATUS_LABELS: Record<string, string> = {
  PENDING_PAYMENT: '결제 대기',
  PAYMENT_CONFIRMED: '결제 확인',
  DEPOSIT_PENDING: '승인 대기',
  ACTIVE: '활성',
  INACTIVE: '비활성',
  SUSPENDED: '일시정지',
  TERMINATED: '종료',
  SESSIONS_EXHAUSTED: '회기 소진',
};
