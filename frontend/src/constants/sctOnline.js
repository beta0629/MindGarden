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
  destroyInvitation: (id) => `/api/v1/sct/invitations/${id}`,
  cancelInvitation: (id) => `/api/v1/sct/invitations/${id}/cancel`,
  resendSms: (id) => `/api/v1/sct/invitations/${id}/resend-sms`,
  reissueLink: (id) => `/api/v1/sct/invitations/${id}/reissue-link`,
  UNLINKED: '/api/v1/sct/invitations/unlinked',
  linkCandidates: (id) => `/api/v1/sct/invitations/${id}/link-candidates`,
  link: (id) => `/api/v1/sct/invitations/${id}/link`,
  domainMemos: (id) => `/api/v1/sct/invitations/${id}/domain-memos`,
  domainMemo: (id, domainCode) =>
    `/api/v1/sct/invitations/${id}/domain-memos/${encodeURIComponent(domainCode)}`,
  printAudit: (id) => `/api/v1/sct/invitations/${id}/print-audit`,
  revokeConsent: (clientId) => `/api/v1/sct/clients/${clientId}/consents/revoke`
});

export const SCT_PUBLIC_ROUTE = '/public/sct/:token';
export const SCT_PUBLIC_PATH = (token) => `/public/sct/${token}`;
export const SCT_PRINT_ROUTE = '/consultant/sct-print';
export const SCT_PRINT_PATH = (invitationId) =>
  `${SCT_PRINT_ROUTE}?invitationId=${encodeURIComponent(invitationId)}`;

export const SCT_FORM_TYPE = Object.freeze({
  ADULT: 'ADULT',
  ADOLESCENT: 'ADOLESCENT',
  CHILD: 'CHILD'
});

/** 온라인 발송·실시 대상(아동용 제외) */
export const SCT_ONLINE_FORM_TYPES = Object.freeze([
  SCT_FORM_TYPE.ADULT,
  SCT_FORM_TYPE.ADOLESCENT
]);

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
  CANCELLED: 'CANCELLED',
  /** 재발급으로 이전 링크·단축코드가 닫힘(공개 메타) */
  REISSUED: 'REISSUED'
});

export const SCT_STATUS_LABEL = Object.freeze({
  SENT: '보냄',
  DRAFT: '진행 중',
  SUBMITTED: '제출',
  EXPIRED: '만료',
  CANCELLED: '취소',
  REISSUED: '재발급으로 닫힘'
});

export const SCT_CONSENT_TYPE = Object.freeze({
  SENSITIVE_INFO: 'SENSITIVE_INFO',
  GUARDIAN_UNDER_14: 'GUARDIAN_UNDER_14',
  IDENTITY_CONTACT: 'IDENTITY_CONTACT'
});

export const SCT_SIGNER_BAND = Object.freeze({
  ADULT: 'ADULT',
  TEEN_14_PLUS: 'TEEN_14_PLUS',
  UNDER_14: 'UNDER_14'
});

export const SCT_VERIFY_SESSION_HEADER = 'X-Sct-Verify-Session';

export const SCT_CHANNEL = Object.freeze({
  PHONE: 'PHONE',
  EMAIL: 'EMAIL'
});

export const SCT_DEFAULTS = Object.freeze({
  LINK_EXPIRY_DAYS: 14,
  LINK_EXPIRY_MIN: 1,
  LINK_EXPIRY_MAX: 30,
  RETENTION_DAYS: 365,
  RETENTION_MIN: 1,
  DRAFT_DEBOUNCE_MS: 800,
  FOCUS_SCROLL_DELAY_MS: 250,
  KEYBOARD_DELTA_PX: 120,
  TOTAL_ITEMS: 50,
  /** 공개 연락처(사무실·휴대폰) — 숫자·하이픈, 최대 길이 */
  PUBLIC_CONTACT_PHONE_MAX: 20
});

/** 공개 연락처 전화 형식(숫자·하이픈, 1~20자, 숫자 1개 이상). */
export const SCT_PUBLIC_CONTACT_PHONE_PATTERN = /^[0-9-]{1,20}$/;

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
  MEMO_SAVE: '메모 저장',
  MEMO_SAVE_SUCCESS: '메모를 저장했습니다',
  MEMO_SAVE_PENDING: '저장되지 않은 변경이 있습니다',
  MEMO_SAVED: '저장됨',
  PANEL_NOTICE: '센터 자체 제작 · 상담 면담 참고용 · 표준화 검사 아님',
  /** 상담사·관리자 별지용. 공개 내담자 화면에는 쓰지 않음. */
  SHEET_NOTICE_PLACEHOLDER:
    '상담 면담 참고용 자료이며, 표준화된 심리검사가 아닙니다.',
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
  SETTINGS_RETENTION_HINT: '기본 365일. 기간이 지나면 파기 대상이 됩니다(자동 삭제 없음).',
  SETTINGS_SAVE: 'SCT 설정 저장',
  SETTINGS_FEATURE_TOGGLE: 'SCT 기능 사용',
  SETTINGS_FEATURE_HINT: '끄면 질문지 탭·발송·공개 링크가 숨겨집니다. 설정 화면은 유지됩니다.',
  SETTINGS_FEATURE_ON: 'ON',
  SETTINGS_FEATURE_OFF_LABEL: 'OFF',
  SETTINGS_FEATURE_OFF: '기능이 꺼져 있으면 탭·패널이 숨겨집니다',
  MANAGEMENT_NO: '관리번호',
  DESTROY_ELIGIBLE: '파기 대상',
  DESTROY: '파기',
  DESTROY_CONFIRM_TITLE: '응답 파기',
  DESTROY_CONFIRM_BODY: '파기 대상 응답과 메모를 삭제합니다. 동의 기록은 남습니다. 되돌릴 수 없습니다.',
  DESTROY_SUCCESS: '응답을 파기했습니다',
  ONLINE_CHILD_HINT: '아동용은 온라인으로 보내지 않습니다(종이 전용).',
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
  EXPIRED_BODY:
    '쓰시던 내용이 있더라도 기한이 지나면 열 수 없습니다. 센터로 연락해 주시면 새 링크를 보내 드립니다.',
  EXPIRED_COVER_FOOT: '이 링크는 더 이상 열 수 없습니다. 새 링크가 필요하면 센터로 문의해 주세요.',
  EXPIRED_BADGE: '만료됨',
  /** 공개 링크 토큰 없음·404(삼킴) — 존재 여부 비공개 */
  INVALID_LINK_TITLE: '링크가 올바르지 않습니다',
  INVALID_LINK_BODY: '주소를 다시 확인하거나 센터에 문의해 주세요.',
  ALREADY_TITLE: '이미 제출한 질문지입니다',
  ALREADY_BODY:
    '작성해 주신 내용은 안전하게 접수되었습니다. 고치거나 더하고 싶은 이야기는 다음 상담 때 상담사에게 말씀해 주세요.',
  ALREADY_BADGE: '제출 완료',
  REISSUED_TITLE: '새 링크가 발급되어 이 주소는 닫혔습니다',
  REISSUED_BODY:
    '질문지 링크가 재발급되면 이전 링크와 QR은 바로 사용할 수 없습니다. 가장 최근에 받으신 문자 링크로 열거나, 센터에 새 링크를 요청해 주세요.',
  REISSUED_BADGE: '재발급으로 닫힘',
  REISSUED_HINT: '가장 최근 문자의 링크로 다시 열어 주세요',
  LANDING_COVER_TITLE: '마음을 꺼내 놓는 문장완성 질문지',
  LANDING_COVER_SUB_CLOSED: '질문지 안내',
  LANDING_BRAND_SUB: '면담 전 온라인 질문지',
  LANDING_RULE_STEM: "내가 생각하는 '잘 산 하루'란",
  LANDING_COVER_FOOT:
    '로그인이나 앱 설치 없이 문자로 받은 주소에서 바로 씁니다. 잠시 멈추어도 쓴 곳까지 자동으로 저장됩니다.',
  LANDING_INVITE_TO: '님께 보낸 질문지입니다',
  LANDING_DURATION: '약 30~40분',
  LANDING_DURATION_LABEL: '예상 시간',
  LANDING_SAVE_LABEL: '저장 방식',
  LANDING_SAVE_VALUE: '쓰는 동안 자동 저장 · 이어 쓰기 가능',
  LANDING_TAG: '50문항 · 자동 저장',
  LANDING_ID_NOTE_TITLE: '다음 화면에서 본인 확인을 합니다',
  LANDING_ID_NOTE_ADULT:
    '개인정보 보호를 위해 다음 단계에서 문자를 받으신 휴대폰 번호(또는 이메일)를 입력해 확인합니다.',
  LANDING_ID_NOTE_CHILD:
    '만 14세 미만은 보호자 번호 확인과 보호자 동의 후 아이가 이어서 작성합니다.',
  LANDING_STEPS_01: '이렇게 진행됩니다',
  LANDING_HELP_02: '도움이 필요할 때',
  LANDING_STEP1_TITLE: '본인 확인',
  LANDING_STEP1_BODY: '다음 화면에서 휴대폰 번호 또는 이메일을 입력해 주세요',
  LANDING_STEP2_TITLE: '실시 안내와 동의',
  LANDING_STEP2_BODY: '민감정보(건강·심리 정보) 동의 후 시작합니다',
  LANDING_STEP2_BODY_CHILD: '만 14세 미만 보호자 동의 뒤 민감정보(건강·심리 정보) 동의 후 시작합니다',
  LANDING_STEP3_TITLE: '편한 속도로 문장 잇기',
  LANDING_STEP3_BODY: '정답이 없으며, 쓰기 어려운 문항은 비워 두셔도 됩니다',
  LANDING_OFFICE_HINT: '사무실 · 전화 문의 · 링크 재요청',
  LANDING_MOBILE_HINT: '공개 문의 휴대폰 · 전화·문자',
  LANDING_TEL_GO: '전화 걸기 ›',
  LANDING_CALL_CENTER: '센터에 전화하기',
  LANDING_ASK_CENTER: '센터 문의',
  LANDING_CONTACT_EMPTY: '센터로 문의해 주세요',
  LANDING_PRIVACY_NOTE:
    '작성한 내용은 상담 기록과 같은 수준으로 비밀을 지켜 보관하며, 담당 상담사만 면담과 함께 살펴봅니다.',
  LANDING_NOTICE:
    '이 질문지는 마인드가든심리상담센터가 자체 제작한 상담 면담 질문지입니다. 표준화 검사가 아니며, 응답은 담당 상담사가 면담과 함께 살펴봅니다. 무단 복제·배포를 금합니다. ⓒ 마인드가든심리상담센터',
  LANDING_OG_TITLE: '마인드가든 심리상담센터 · 문장완성 질문지',
  LANDING_OG_DESCRIPTION: '면담 전 작성하는 질문지입니다.',
  LANDING_DEADLINE_LABEL: '마감 기한',
  LANDING_SUBMITTED_LABEL: '제출 시각',
  LANDING_OFFICE_LABEL: '사무실',
  QR_ISSUED_BADGE: '발급 완료',
  QR_SCAN_TIP: '내담자 휴대폰 카메라로 비추면 바로 열립니다',
  QR_META_EXPIRY: '유효 기한',
  QR_META_SMS: '문자 발송',
  QR_META_REISSUE: '재발급 규칙',
  QR_REISSUE_RULE: '재발급 시 이전 링크·QR 즉시 무효',
  QR_SMS_SENT: '발송됨',
  QR_RESEND_SMS: '문자 다시 보내기',
  QR_PRINT_A6: '인쇄 (A6)',
  QR_CONFIRM: '확인',
  QR_REISSUED_BANNER_TITLE: '이전 링크와 QR은 만료되었습니다',
  QR_REISSUED_BANNER_BODY: '새로 만든 QR과 문자로만 열 수 있습니다.',
  QR_SHEET_TITLE_SENT: '질문지를 보냈습니다',
  QR_SHEET_TITLE_REISSUED: '링크를 재발급했습니다',
  QR_RULE:
    '대면 방문 시 태블릿 화면의 QR을 바로 보여 주거나, 인쇄 (A6)로 안내 카드를 출력해 드릴 수 있습니다. 발송 건마다 고유 QR이 생성됩니다.',
  QR_DAYS_SUFFIX: '일',
  A6_HEADER_RIGHT: '면담 전 질문지',
  A6_SCAN_CAP: '휴대폰 카메라로 비춰 주세요',
  A6_STEP1_TITLE: '1. QR 열기',
  A6_STEP1_BODY: '카메라로 비추면 바로 열립니다',
  A6_STEP2_TITLE: '2. 본인 확인',
  A6_STEP2_BODY: '문자 받은 번호(또는 이메일) 입력',
  A6_STEP3_TITLE: '3. 작성 · 저장',
  A6_STEP3_BODY: '약 30~40분 · 쓰는 동안 자동 저장',
  A6_CONTACT_PREFIX: '문의 및 링크 재요청:',
  A6_REISSUE_NOTE: '새 링크를 재발급하면 이 QR 카드는 사용할 수 없습니다.',
  MISMATCH: '번호가 일치하지 않습니다',
  ATTEMPTS_LEFT: '남은 시도',
  CONSENT_OPTIONAL_NOTE: '동의하지 않아도 상담은 받을 수 있습니다',
  GUARDIAN_NAME: '보호자 이름',
  GUARDIAN_RELATION: '관계',
  GUARDIAN_PHONE: '보호자 휴대폰',
  SIGNER_NAME: '본인 성명(서명)',
  CHILD_NAME_CONFIRM: '아동 본인 확인 이름(선택)',
  INSTRUCTION_READ: '실시 안내를 읽었습니다',
  SENSITIVE_REQUIRED: '[필수] 민감정보(심리·건강 관련 정보) 처리 동의',
  GUARDIAN_REQUIRED: '[필수] 법정대리인 동의',
  CONSENT_REUSE_HINT: '한 번 동의하면 철회할 때까지 이후 실시에도 적용됩니다.',
  SETTINGS_LEGAL_NOTE: '법률 검토 권장',
  STEP_IDENTITY_CONSENT: '본인확인 동의',
  STEP_VERIFY: '본인 확인',
  STEP_CONSENT: '안내와 동의',
  STEP_ITEMS: '문장 이어 쓰기',
  STEP_SUBMIT: '제출',
  IDENTITY_CONSENT_REQUIRED: '[필수] 본인확인용 개인정보 수집·이용 동의',
  IDENTITY_CONSENT_CONTINUE: '동의하고 본인 확인',
  IDENTITY_CONSENT_FALLBACK_TITLE: '본인확인용 개인정보 수집·이용 동의',
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
  PUBLIC_LINK_LABEL: '공개 링크',
  PUBLIC_LINK_HINT: '이 링크는 발송·재발급 직후에만 표시됩니다. 복사하여 내담자에게 전달하세요.',
  COPY_LINK: '링크 복사',
  COPY_LINK_SUCCESS: '링크를 복사했습니다',
  COPY_LINK_FAIL: '복사하지 못했습니다',
  REISSUE_LINK: '링크 재발급',
  REISSUE_SUCCESS: '새 공개 링크가 발급되었습니다',
  /**
   * 미연결 목록 — 평문 토큰은 DB에 없어 재발급 전 복사 불가(보안).
   */
  UNLINKED_COPY_HINT:
    '보안상 링크 원문은 저장되지 않습니다. 「링크 재발급」 후 새 링크를 복사하세요.',
  UNLINKED_TITLE: '미연결 초대',
  UNLINKED_EMPTY: '미연결 초대가 없습니다',
  RECIPIENT_NAME: '표시 이름',
  CANCEL_SUCCESS: '발송을 취소했습니다',
  SETTINGS_SAVE_SUCCESS: 'SCT 설정을 저장했습니다',
  SETTINGS_OFFICE_PHONE: '사무실 전화',
  SETTINGS_MOBILE_PHONE: '공개 휴대폰',
  SETTINGS_PUBLIC_CONTACT_HINT:
    '공개 질문지 랑딩에 표시되며, 비우면 숨김',
  VALIDATE_REQUIRED: '필수 항목을 확인해 주세요',
  VALIDATE_EXPIRY: '만료일은 1~30일 사이여야 합니다',
  VALIDATE_PUBLIC_CONTACT_PHONE:
    '사무실 전화·공개 휴대폰은 숫자와 하이픈만 사용하며 최대 20자여야 합니다',
  PRINT: '인쇄',
  PRINT_PREVIEW: '인쇄 미리보기',
  PRINT_DO: '인쇄하기',
  PRINT_CLOSE: '닫기',
  PRINT_PAPER: '용지',
  PRINT_ORIENTATION: '방향',
  PRINT_SCALE: '배율',
  PRINT_PORTRAIT: '세로',
  PRINT_LANDSCAPE: '가로',
  PRINT_SCALE_FIT: '맞춤',
  PRINT_HEADER_NOTICE: '상담 면담 참고용 질문지이며, 표준화 검사가 아닙니다. ⓒ 마인드가든',
  PRINT_CLIENT: '내담자',
  PRINT_FORM: '양식',
  PRINT_SUBMITTED: '제출일',
  PRINT_MANAGEMENT_NO: '관리번호',
  PRINT_MEMO_TITLE: '상담사 메모',
  PRINT_MEMO_HINT: '면담에서 확인할 질문 · 메모 (여백)',
  FONT_SIZE: '글자 크기',
  FONT_SMALL: '작게',
  FONT_MEDIUM: '보통',
  FONT_LARGE: '크게',
  SEARCH_PLACEHOLDER: '문항 검색·번호 점프',
  SEARCH_JUMP: '이동',
  DOMAIN_JUMP_ALL: '전체',
  PRINT_AUDIT_FAIL: '인쇄 감사 기록을 남기지 못했습니다',
  /** 상담일지 SCT 레일·스트립·피크·시트 */
  RAIL_STRIP_LABEL: '문장완성 질문지 상태',
  STATUS_UNSENT: '미발송',
  STATUS_PENDING: '진행 중',
  STATUS_EXPIRED: '만료',
  STATUS_JUST_SUBMITTED: '방금 제출',
  BODY_HIDDEN_BEFORE_SUBMIT: '제출 전 본문은 열람할 수 없습니다',
  /** 스트립 한 줄 카피 (상태별, 문장 끝 마침표 포함) */
  STRIP_UNSENT: '질문지를 아직 보내지 않았습니다.',
  STRIP_PENDING: '작성 중 · 제출 전 본문은 열람할 수 없습니다.',
  STRIP_EXPIRED: '작성 기한이 지났습니다. 본문은 열람할 수 없습니다.',
  STRIP_EMPTY_RESPONSES: '빈 응답',
  STRIP_NA_RESPONSES: '해당 없음',
  /** 피크 카피 */
  PEEK_UNSENT: '질문지를 아직 보내지 않았습니다.',
  PEEK_EXPIRED: '작성 기한이 지났습니다. 본문은 열람할 수 없습니다.',
  PEEK_PENDING_AFTER_SUBMIT: '제출이 끝나면 여기에서 영역별로 살펴볼 수 있습니다.',
  PEEK_DETAILS: '자세히',
  PEEK_CLOSE: '닫기',
  EXPAND_SIDE: '펼쳐서 보기',
  COLLAPSE_SIDE: '접기',
  SHEET_TITLE: '문장완성 질문지',
  SHEET_CLOSE: '닫기',
  DRAFT_SAVED_AT: '마지막 저장',
  EXPIRES_AT: '작성 기한',
  SPINE_LABEL: '진행 표시',
  SUBMITTED_AT: '제출 시각',
  /** 공개 제출 시 본인확인 세션 만료 — 재확인 안내 */
  VERIFY_TO_SUBMIT: '본인확인 후 제출이 완료돼요',
  /** 본인확인 재시도 CTA */
  VERIFY_AGAIN: '본인 확인하기'
});

/** 공개 API 오류 코드 (BE GlobalExceptionHandler 와 맞춤) */
export const SCT_ERROR_CODE = Object.freeze({
  VERIFY_REQUIRED: 'SCT_VERIFY_REQUIRED',
  IDENTITY_CONTACT_CONSENT_REQUIRED: 'SCT_IDENTITY_CONTACT_CONSENT_REQUIRED',
  GONE: 'SCT_GONE',
  CONFLICT: 'SCT_CONFLICT',
  VERIFY_LOCKED: 'SCT_VERIFY_LOCKED',
  FEATURE_DISABLED: 'SCT_FEATURE_DISABLED'
});

/** 공개 응답 로컬 임시저장 localStorage 키 prefix (opaque token 접미) */
export const SCT_PUBLIC_DRAFT_LS_PREFIX = 'mg.sctPublicDraft.v1';

/**
 * PENDING 스트립 — answeredCount 가 있을 때만 n/50 포함.
 * @param {number|null|undefined} answeredCount
 * @param {number} [total=SCT_DEFAULTS.TOTAL_ITEMS]
 * @returns {string}
 */
export const buildSctStripPendingCopy = (answeredCount, total = SCT_DEFAULTS.TOTAL_ITEMS) => {
  if (answeredCount == null || !Number.isFinite(Number(answeredCount))) {
    return SCT_UI.STRIP_PENDING;
  }
  const n = Number(answeredCount);
  return `${n}/${total}문항 작성 중 · ${SCT_UI.BODY_HIDDEN_BEFORE_SUBMIT}.`;
};

/**
 * SUBMITTED 스트립 요약.
 * @param {string} formLabel SCT_FORM_TYPE_LABEL 값
 * @param {number} emptyCount
 * @param {number} naCount
 * @param {number} [total=SCT_DEFAULTS.TOTAL_ITEMS]
 * @returns {string}
 */
export const buildSctStripSubmittedCopy = (
  formLabel,
  emptyCount,
  naCount,
  total = SCT_DEFAULTS.TOTAL_ITEMS
) => {
  const head = formLabel ? `${formLabel} ${total}문항` : `${total}문항`;
  return `${head} · ${SCT_UI.STRIP_EMPTY_RESPONSES} ${emptyCount} · ${SCT_UI.STRIP_NA_RESPONSES} ${naCount}`;
};

/**
 * PENDING 피크 — n 없으면 문항 수 절 생략. 본문 답은 절대 포함하지 않음.
 * @param {{ answeredCount?: number|null, draftSavedAtLabel?: string }} opts
 * @param {number} [total=SCT_DEFAULTS.TOTAL_ITEMS]
 * @returns {string}
 */
export const buildSctPeekPendingCopy = (opts = {}, total = SCT_DEFAULTS.TOTAL_ITEMS) => {
  const parts = [];
  const n = opts.answeredCount;
  if (n != null && Number.isFinite(Number(n))) {
    parts.push(`내담자가 ${Number(n)} / ${total}문항까지 썼습니다.`);
  }
  if (opts.draftSavedAtLabel) {
    parts.push(`마지막 저장은 ${opts.draftSavedAtLabel}입니다.`);
  }
  parts.push(SCT_UI.PEEK_PENDING_AFTER_SUBMIT);
  return parts.join(' ');
};

/** 상담일지 SCT 레일 localStorage 키 prefix (open: consultant×invite, seen: consultant×client) */
export const SCT_JOURNAL_PANEL_LS_KEYS = Object.freeze({
  OPEN: 'mg.sctJournalPanel.open.v1',
  SEEN_SUBMITTED: 'mg.sctJournalPanel.seenSubmitted.v2'
});

/** 사이드 패널 분기 뷰포트 — 1180px = 73.75rem */
export const SCT_JOURNAL_PANEL_DESKTOP_MQ = '(min-width: 73.75rem)';

/** 레일 UI 상태 (제출 본문 노출 여부 판정용) */
export const SCT_JOURNAL_UI_STATE = Object.freeze({
  UNSENT: 'UNSENT',
  PENDING: 'PENDING',
  EXPIRED: 'EXPIRED',
  SUBMITTED: 'SUBMITTED'
});

/** 인쇄 용지 (CSS @page size) */
export const SCT_PRINT_PAPER = Object.freeze({
  A4: 'A4',
  B5: 'B5',
  LETTER: 'Letter'
});

export const SCT_PRINT_ORIENTATION = Object.freeze({
  PORTRAIT: 'portrait',
  LANDSCAPE: 'landscape'
});

/** 배율 — fit 은 미리보기에서 콘텐츠 맞춤 */
export const SCT_PRINT_SCALE = Object.freeze({
  FIT: 'fit',
  S90: '90',
  S100: '100',
  S110: '110'
});

export const SCT_PRINT_SCALE_FACTOR = Object.freeze({
  fit: 1,
  '90': 0.9,
  '100': 1,
  '110': 1.1
});

/** 화면(비인쇄) 글자 크기 */
export const SCT_SCREEN_FONT = Object.freeze({
  SM: 'sm',
  MD: 'md',
  LG: 'lg'
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
  PEEK_TAB: 'mg-v2-sct-peek',
  PRINT: 'mg-v2-sct-print',
  PRINT_SHEET: 'mg-v2-sct-print-sheet',
  PRINT_ITEM: 'mg-v2-sct-print-item',
  PRINT_CONTROLS: 'mg-v2-sct-print-controls',
  SEARCH: 'mg-v2-sct-session-search',
  RAIL: 'mg-v2-sct-rail',
  STRIP: 'mg-v2-sct-strip',
  PEEK: 'mg-v2-sct-peek-card',
  SHEET: 'mg-v2-sct-sheet',
  SHEET_SCRIM: 'mg-v2-sct-sheet__scrim',
  SIDE: 'mg-v2-sct-side',
  SPINE: 'mg-v2-sct-spine'
});

export const SCT_TEST_ID = Object.freeze({
  PUBLIC_APP: 'sct-public-app',
  THUMB_BAR: 'sct-thumb-bar',
  PAUSE_CHILD: 'sct-pause-child',
  MEMO_ADD: 'sct-memo-add',
  MEMO_SAVE: 'sct-memo-save',
  CAPTION: 'sct-caption',
  ADMIN_TAB: 'sct-admin-tab',
  SESSION_PANEL: 'sct-session-panel',
  FEATURE_GATE: 'sct-feature-gate',
  SETTINGS: 'sct-settings-section',
  SETTINGS_FEATURE_SWITCH: 'sct-settings-feature-switch',
  SETTINGS_OFFICE_PHONE: 'sct-office-phone',
  SETTINGS_MOBILE_PHONE: 'sct-mobile-phone',
  UNLINKED_REISSUE: 'sct-unlinked-reissue',
  UNLINKED_COPY_HINT: 'sct-unlinked-copy-hint',
  UNLINKED_COPY_AREA: 'sct-unlinked-copy-area',
  HARNESS: 'sct-viewport-harness',
  CONSENT_STEP: 'sct-consent-step',
  IDENTITY_CONSENT_STEP: 'sct-identity-consent-step',
  GUARDIAN_STEP: 'sct-guardian-step',
  PRINT_BTN: 'sct-print-btn',
  PRINT_PREVIEW: 'sct-print-preview',
  PRINT_DO: 'sct-print-do',
  PRINT_PAPER: 'sct-print-paper',
  PRINT_ORIENT: 'sct-print-orient',
  PRINT_SCALE: 'sct-print-scale',
  PRINT_ITEM: 'sct-print-item',
  FONT_SIZE: 'sct-font-size',
  SEARCH: 'sct-session-search',
  DOMAIN_CHIP: 'sct-domain-chip',
  DESTROY_BTN: 'sct-destroy-btn',
  DESTROY_BADGE: 'sct-destroy-badge',
  MANAGEMENT_NO: 'sct-management-no',
  RAIL: 'sct-journal-rail',
  STRIP: 'sct-journal-strip',
  PEEK: 'sct-journal-peek',
  SHEET: 'sct-journal-sheet',
  SIDE: 'sct-journal-side',
  EXPAND_BTN: 'sct-journal-expand',
  COLLAPSE_BTN: 'sct-journal-collapse',
  PEEK_TOGGLE: 'sct-journal-peek-toggle',
  STATUS_BADGE: 'sct-journal-status',
  FRESH_BADGE: 'sct-journal-fresh',
  STRIP_COPY: 'sct-journal-strip-copy',
  STRIP_DEADLINE: 'sct-journal-strip-deadline',
  STRIP_SUBMITTED_AT: 'sct-journal-strip-submitted-at',
  PEEK_COPY: 'sct-journal-peek-copy',
  VERIFY_AGAIN: 'sct-verify-again',
  VERIFY_REQUIRED_ALERT: 'sct-verify-required-alert',
  LANDING: 'sct-landing',
  LANDING_START: 'sct-landing-start',
  LANDING_TEL_OFFICE: 'sct-landing-tel-office',
  LANDING_TEL_MOBILE: 'sct-landing-tel-mobile',
  INVITE_QR: 'sct-invite-qr',
  INVITE_QR_URL: 'sct-invite-qr-url',
  INVITE_QR_COPY: 'sct-invite-qr-copy',
  INVITE_A6: 'sct-invite-a6'
});

