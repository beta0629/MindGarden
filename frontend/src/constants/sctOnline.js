/**
 * SCT 온라인 질문지 — 문자열·경로·클래스 SSOT
 *
 * @author MindGarden
 * @since 2026-11-23
 */

export const SCT_API = Object.freeze({
  PUBLIC_BASE: '/api/v1/public/sct',
  FORMS: '/api/v1/sct/forms',
  INVITATIONS: '/api/v1/sct/invitations',
  SETTINGS: '/api/v1/admin/sct-settings',
  SESSION_VIEW: '/api/v1/sct/session-view',
  clientInvitations: (clientId) => `/api/v1/sct/clients/${clientId}/invitations`,
  clientLatestSubmitted: (clientId) => `/api/v1/sct/clients/${clientId}/latest-submitted`,
  publicMeta: (token) => `/api/v1/public/sct/${token}/meta`,
  publicVerify: (token) => `/api/v1/public/sct/${token}/verify`,
  publicForm: (token) => `/api/v1/public/sct/${token}/form`,
  publicDraft: (token) => `/api/v1/public/sct/${token}/draft`,
  publicConsents: (token) => `/api/v1/public/sct/${token}/consents`,
  publicSubmit: (token) => `/api/v1/public/sct/${token}/submit`,
  invitation: (id) => `/api/v1/sct/invitations/${id}`,
  cancelInvitation: (id) => `/api/v1/sct/invitations/${id}/cancel`,
  resendSms: (id) => `/api/v1/sct/invitations/${id}/resend-sms`,
  linkCandidates: (id) => `/api/v1/sct/invitations/${id}/link-candidates`,
  link: (id) => `/api/v1/sct/invitations/${id}/link`
});

export const SCT_PUBLIC_ROUTE = '/public/sct/:token';
export const SCT_PUBLIC_PATH = (token) => `/public/sct/${token}`;

export const SCT_FORM_TYPE = Object.freeze({
  ADULT: 'ADULT',
  ADOLESCENT: 'ADOLESCENT',
  CHILD: 'CHILD'
});

export const SCT_FORM_TYPE_LABEL = Object.freeze({
  ADULT: '성인용',
  ADOLESCENT: '청소년용',
  CHILD: '아동용'
});

/** 연령별 한 화면 문항 수 */
export const SCT_ITEMS_PER_PAGE = Object.freeze({
  ADULT: 5,
  ADOLESCENT: 3,
  CHILD: 2
});

export const SCT_STATUS = Object.freeze({
  SENT: 'SENT',
  DRAFT: 'DRAFT',
  SUBMITTED: 'SUBMITTED',
  EXPIRED: 'EXPIRED',
  CANCELLED: 'CANCELLED'
});

export const SCT_STATUS_LABEL = Object.freeze({
  SENT: '보냄',
  DRAFT: '진행 중',
  SUBMITTED: '제출',
  EXPIRED: '만료',
  CANCELLED: '취소'
});

export const SCT_CONSENT_TYPE = Object.freeze({
  SENSITIVE: 'SENSITIVE',
  GUARDIAN_UNDER_14: 'GUARDIAN_UNDER_14',
  INSTRUCTION_READ: 'INSTRUCTION_READ'
});

export const SCT_CHANNEL = Object.freeze({
  PHONE: 'PHONE',
  EMAIL: 'EMAIL'
});

export const SCT_DEFAULTS = Object.freeze({
  LINK_EXPIRY_DAYS: 14,
  LINK_EXPIRY_MIN: 1,
  LINK_EXPIRY_MAX: 30,
  DRAFT_DEBOUNCE_MS: 800,
  FOCUS_SCROLL_DELAY_MS: 250,
  KEYBOARD_DELTA_PX: 120,
  TOTAL_ITEMS: 50
});

export const SCT_UI = Object.freeze({
  BRAND: '마인드가든심리상담센터',
  TITLE: '문장완성 질문지',
  TAB_QUESTIONNAIRE: '질문지',
  TAB_OVERVIEW: '개요',
  SEND: '질문지 보내기',
  SEND_SMS: '문자 보내기',
  CANCEL: '취소',
  START: '시작하기',
  RESUME: '이어서 작성',
  VERIFY: '본인 확인',
  VERIFY_SUBMIT: '확인',
  AGREE_START: '동의하고 시작',
  GUARDIAN_DONE: '동의 완료',
  PREV: '이전',
  NEXT: '다음',
  SUBMIT: '제출하기',
  SUBMIT_CONFIRM: '제출하면 고칠 수 없습니다',
  SAVE_DRAFT: '임시 저장',
  PAUSE_CHILD: '쉬었다 할래요',
  MEMO_WRITE: '메모 쓰기',
  MEMO_LABEL: '면담에서 확인할 질문 · 메모',
  MEMO_PLACEHOLDER: '상담사만 봅니다',
  MEMO_SAVE_PENDING: '메모 저장 API는 추후 연동됩니다',
  PANEL_NOTICE: '센터 자체 제작 · 표준화 검사 아님',
  SHEET_NOTICE_PLACEHOLDER:
    '표준화된 심리검사가 아닙니다. 상담 장면에서 함께 살펴보기 위한 참고 자료입니다.',
  ASSIGN: '배정',
  UNASSIGN: '배정 해제',
  VIEW_BY_DOMAIN: '영역별',
  VIEW_BY_NUMBER: '번호순',
  EMPTY_ONLY: '빈 응답만',
  NA_COUNT: '해당 없음',
  BLANK_BADGE: '빈 응답',
  NA_BADGE: '해당 없음',
  NA_MARKED: '해당 없음으로 표시했습니다',
  NA_BUTTON: '해당 없음',
  SAVE_SAVED: '저장됨',
  SAVE_SAVING: '저장 중…',
  SAVE_OFFLINE: '연결 끊김 · 기기에 보관',
  PENDING_TITLE: '아직 제출 전입니다',
  SETTINGS_SECTION: '문장완성 질문지(SCT)',
  SETTINGS_LINK_EXPIRY: '링크 만료(일)',
  SETTINGS_RETENTION: '응답 보관(일)',
  SETTINGS_RETENTION_HINT: '비우면 자동 파기 없음',
  SETTINGS_SAVE: 'SCT 설정 저장',
  SETTINGS_FEATURE_OFF: '기능이 꺼져 있으면 탭·패널이 숨겨집니다',
  PHONE_SEGMENT: '휴대폰 번호',
  EMAIL_SEGMENT: '이메일',
  PROGRESS_ANSWERED: '답한 문항',
  SUMMARY_SENT: '보냄',
  SUMMARY_DRAFT: '진행 중',
  SUMMARY_SUBMITTED: '제출',
  SUMMARY_EXPIRED: '만료',
  RECEIVER: '받는 분',
  FORM_KIND: '종류',
  CHANNEL: '받는 곳',
  EXPIRES: '작성 기한',
  USE_CENTER_DEFAULT: '센터 기본값 사용',
  PHONE_VERIFY_HINT: '본인 확인에 이 번호를 씁니다',
  RESEND_WARN: '새로 보내면 이전 링크는 만료됩니다. 쓰던 문항은 보관됩니다.',
  CHILD_GUARD_HINT: '만 14세 미만 · 보호자 동의부터 · 보호자 번호로',
  RECOMMENDED: '추천',
  DONE_TITLE: '제출했습니다',
  DONE_BODY: '담당 상담사가 다음 상담에서 함께 살펴봅니다. 창을 닫아도 됩니다.',
  EXPIRED_TITLE: '작성 기한이 지났습니다',
  EXPIRED_BODY: '새 링크가 필요하면 센터에 문의해 주세요.',
  ALREADY_TITLE: '이미 제출한 질문지입니다',
  ALREADY_BODY: '답 내용은 여기서 다시 보지 않습니다.',
  MISMATCH: '번호가 일치하지 않습니다',
  ATTEMPTS_LEFT: '남은 시도',
  CONSENT_OPTIONAL_NOTE: '동의하지 않아도 상담은 받을 수 있습니다',
  GUARDIAN_NAME: '보호자 이름',
  GUARDIAN_RELATION: '관계',
  GUARDIAN_PHONE: '보호자 휴대폰',
  INSTRUCTION_READ: '실시 안내를 읽었습니다',
  SENSITIVE_REQUIRED: '[필수] 민감정보 수집·이용',
  GUARDIAN_REQUIRED: '[필수] 법정대리인 동의',
  STEP_VERIFY: '본인 확인',
  STEP_CONSENT: '안내와 동의',
  STEP_ITEMS: '문장 이어 쓰기',
  STEP_SUBMIT: '제출',
  ENTRY_STEPS_TITLE: '이렇게 진행됩니다',
  AUTO_SAVE_HINT: '쓰는 동안 자동 저장',
  RESUME_HINT: '쓰던 질문지가 저장되어 있습니다',
  RESUME_CAP: '본인 확인 뒤 이어서 씁니다. 다른 기기에서 열어도 같습니다.',
  BLANK_LIST_TITLE: '비워 둔 문항',
  COUNT_ANSWERED: '답함',
  COUNT_NA: '해당 없음',
  COUNT_BLANK: '비워 둠',
  DOMAIN_JUMP: '영역',
  LOADING: '불러오는 중…',
  LOAD_FAIL: '질문지를 불러오지 못했습니다',
  FEATURE_OFF_HIDDEN: 'SCT 기능이 꺼져 있습니다',
  SEND_SUCCESS: '질문지를 보냈습니다',
  CANCEL_SUCCESS: '발송을 취소했습니다',
  SETTINGS_SAVE_SUCCESS: 'SCT 설정을 저장했습니다',
  VALIDATE_REQUIRED: '필수 항목을 확인해 주세요',
  VALIDATE_EXPIRY: '만료일은 1~30일 사이여야 합니다'
});

export const SCT_CSS = Object.freeze({
  APP: 'mg-v2-sct-app',
  APP_CHILD: 'mg-v2-sct-app--child',
  APP_KB: 'mg-v2-sct-app--kb',
  TOP: 'mg-v2-sct-top',
  SCROLL: 'mg-v2-sct-scroll',
  BAR: 'mg-v2-sct-bar',
  CAPTION: 'mg-v2-sct-caption',
  FOOT: 'mg-v2-sct-foot',
  MEMO_BTN: 'mg-v2-sct-memo-add',
  MEMO_TA: 'mg-v2-sct-memo-ta',
  TICKS: 'mg-v2-sct-ticks',
  SAVE: 'mg-v2-sct-save',
  QUESTION: 'mg-v2-sct-q',
  PANEL: 'mg-v2-sct-panel',
  ADMIN: 'mg-v2-sct-admin',
  SEND_SHEET: 'mg-v2-sct-send-sheet',
  SESSION: 'mg-v2-sct-session',
  SESSION_GRID: 'mg-v2-sct-session-grid',
  PEEK_TAB: 'mg-v2-sct-peek'
});

export const SCT_TEST_ID = Object.freeze({
  PUBLIC_APP: 'sct-public-app',
  THUMB_BAR: 'sct-thumb-bar',
  PAUSE_CHILD: 'sct-pause-child',
  MEMO_ADD: 'sct-memo-add',
  CAPTION: 'sct-caption',
  ADMIN_TAB: 'sct-admin-tab',
  SESSION_PANEL: 'sct-session-panel',
  FEATURE_GATE: 'sct-feature-gate',
  SETTINGS: 'sct-settings-section'
});
