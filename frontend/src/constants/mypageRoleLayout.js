/**
 * 마이페이지 역할별 레이아웃 설정 SSOT — 역할 분기는 이 객체 하나로만 한다.
 * 화면은 MypageLayout + 섹션 맵이 이 설정을 읽어 렌더한다 (역할별 JSX 분기 금지).
 *
 * @author CoreSolution
 * @since 2026-10-03
 */

import { USER_ROLES } from './roles';
import { CONSULTANT_DASHBOARD_ROUTES } from './consultantDashboardRoutes';
import { CLIENT_DASHBOARD_ROUTES } from './clientDashboardRoutes';
import { MYPAGE_DUAL_ROLE_MAP_LINKS } from './mypageDualRoleUi';
import { isOperatorCounselingDualRole } from './mypageProfileRoles';

export const MYPAGE_SECTION_KEYS = Object.freeze({
  BASIC: 'basic',
  COUNSEL: 'counsel',
  NOTIFY: 'notify',
  SECURITY: 'security',
  SOCIAL: 'social',
  PRIVACY: 'privacy',
  ACCOUNT: 'account'
});

export const MYPAGE_SECTION_LABELS = Object.freeze({
  [MYPAGE_SECTION_KEYS.BASIC]: '기본 정보',
  [MYPAGE_SECTION_KEYS.COUNSEL]: '상담 정보',
  [MYPAGE_SECTION_KEYS.NOTIFY]: '알림 받는 방법',
  [MYPAGE_SECTION_KEYS.SECURITY]: '로그인·보안',
  [MYPAGE_SECTION_KEYS.SOCIAL]: '연결된 계정',
  [MYPAGE_SECTION_KEYS.PRIVACY]: '개인정보·동의',
  [MYPAGE_SECTION_KEYS.ACCOUNT]: '계정 관리'
});

export const MYPAGE_SECTION_CAPTIONS = Object.freeze({
  [MYPAGE_SECTION_KEYS.BASIC]: '이름과 연락처, 프로필 사진입니다.',
  [MYPAGE_SECTION_KEYS.COUNSEL]: '상담사 프로필에 보이는 전문 정보입니다.',
  [MYPAGE_SECTION_KEYS.NOTIFY]: '예약·회기 안내를 받을 방법입니다.',
  [MYPAGE_SECTION_KEYS.SECURITY]: '비밀번호와 지금 로그인한 기기입니다.',
  [MYPAGE_SECTION_KEYS.SOCIAL]: '간편 로그인에 쓰는 계정입니다.',
  [MYPAGE_SECTION_KEYS.PRIVACY]: '약관과 개인정보 수집·이용 동의 상태입니다.',
  [MYPAGE_SECTION_KEYS.ACCOUNT]: '탈퇴를 신청하면 유예 기간 뒤 계정이 정리됩니다.'
});

export const MYPAGE_LAYOUT_MODES = Object.freeze({
  ASIDE: 'aside',
  SINGLE: 'single'
});

export const MYPAGE_SURFACES = Object.freeze({
  STONE: 'stone',
  CARD: 'card'
});

/** 보기·편집에서 숨기는 필드 (값·저장 payload 는 유지) */
export const MYPAGE_HIDE_FIELDS = Object.freeze({
  ADDRESS: 'address',
  GENDER: 'gender'
});

export const MYPAGE_ROLE_LAYOUT_KEYS = Object.freeze({
  OPERATOR: 'operator',
  OPERATOR_DUAL: 'operatorDual',
  CONSULTANT: 'consultant',
  CLIENT: 'client'
});

const COUNSELING_SECTIONS = Object.freeze([
  MYPAGE_SECTION_KEYS.BASIC,
  MYPAGE_SECTION_KEYS.COUNSEL,
  MYPAGE_SECTION_KEYS.NOTIFY,
  MYPAGE_SECTION_KEYS.SECURITY,
  MYPAGE_SECTION_KEYS.SOCIAL,
  MYPAGE_SECTION_KEYS.PRIVACY,
  MYPAGE_SECTION_KEYS.ACCOUNT
]);

export const MYPAGE_ROLE_LAYOUT = Object.freeze({
  [MYPAGE_ROLE_LAYOUT_KEYS.OPERATOR]: Object.freeze({
    layout: MYPAGE_LAYOUT_MODES.ASIDE,
    surface: MYPAGE_SURFACES.STONE,
    sections: Object.freeze([
      MYPAGE_SECTION_KEYS.BASIC,
      MYPAGE_SECTION_KEYS.SECURITY,
      MYPAGE_SECTION_KEYS.SOCIAL,
      MYPAGE_SECTION_KEYS.PRIVACY
    ]),
    linksTitle: '',
    linksLanding: '',
    links: Object.freeze([]),
    hideFields: Object.freeze([MYPAGE_HIDE_FIELDS.ADDRESS, MYPAGE_HIDE_FIELDS.GENDER])
  }),
  [MYPAGE_ROLE_LAYOUT_KEYS.OPERATOR_DUAL]: Object.freeze({
    layout: MYPAGE_LAYOUT_MODES.ASIDE,
    surface: MYPAGE_SURFACES.STONE,
    sections: COUNSELING_SECTIONS,
    linksTitle: '역할 지도',
    linksLanding: '한 계정으로 운영과 상담을 함께 합니다. 역할을 바꾸거나 다시 로그인할 필요가 없습니다.',
    links: Object.freeze([
      Object.freeze({
        key: 'own-salary',
        chip: '상담',
        title: '본인 급여 조회',
        caption: '내 상담 회기 기준 급여를 봅니다.',
        to: MYPAGE_DUAL_ROLE_MAP_LINKS.OWN_SALARY_VIEW
      }),
      Object.freeze({
        key: 'ops-finance',
        chip: '운영',
        title: '상담사 지급 승인',
        caption: '센터 상담사 급여 지급을 승인합니다.',
        to: MYPAGE_DUAL_ROLE_MAP_LINKS.OPS_FINANCE_APPROVE
      })
    ]),
    hideFields: Object.freeze([])
  }),
  [MYPAGE_ROLE_LAYOUT_KEYS.CONSULTANT]: Object.freeze({
    layout: MYPAGE_LAYOUT_MODES.ASIDE,
    surface: MYPAGE_SURFACES.STONE,
    sections: COUNSELING_SECTIONS,
    linksTitle: '바로가기',
    linksLanding: '',
    links: Object.freeze([
      Object.freeze({
        key: 'salary-settlement',
        chip: '상담',
        title: '급여 정산',
        caption: '회기 기준 정산 내역을 봅니다.',
        to: CONSULTANT_DASHBOARD_ROUTES.SALARY_SETTLEMENT
      }),
      Object.freeze({
        key: 'availability',
        chip: '상담',
        title: '근무 가능 시간',
        caption: '예약을 받을 수 있는 시간을 정합니다.',
        to: CONSULTANT_DASHBOARD_ROUTES.AVAILABILITY
      })
    ]),
    hideFields: Object.freeze([])
  }),
  [MYPAGE_ROLE_LAYOUT_KEYS.CLIENT]: Object.freeze({
    layout: MYPAGE_LAYOUT_MODES.SINGLE,
    surface: MYPAGE_SURFACES.CARD,
    sections: Object.freeze([
      MYPAGE_SECTION_KEYS.BASIC,
      MYPAGE_SECTION_KEYS.NOTIFY,
      MYPAGE_SECTION_KEYS.SECURITY,
      MYPAGE_SECTION_KEYS.SOCIAL,
      MYPAGE_SECTION_KEYS.PRIVACY,
      MYPAGE_SECTION_KEYS.ACCOUNT
    ]),
    linksTitle: '바로가기',
    linksLanding: '',
    links: Object.freeze([
      Object.freeze({
        key: 'session-management',
        chip: '회기',
        title: '회기 관리',
        caption: '남은 회기와 지난 상담을 봅니다.',
        to: CLIENT_DASHBOARD_ROUTES.SESSION_MANAGEMENT
      }),
      Object.freeze({
        key: 'payment-history',
        chip: '결제',
        title: '결제 내역',
        caption: '결제와 환불 내역을 봅니다.',
        to: CLIENT_DASHBOARD_ROUTES.PAYMENT_HISTORY
      })
    ]),
    hideFields: Object.freeze([])
  })
});

/**
 * @param {{ role?: string, counselingEnabled?: boolean }|null|undefined} user
 * @returns {string} MYPAGE_ROLE_LAYOUT 키
 */
export function resolveMypageRoleLayoutKey(user) {
  const role = user?.role ? String(user.role).toUpperCase() : '';
  if (role === USER_ROLES.CLIENT) {
    return MYPAGE_ROLE_LAYOUT_KEYS.CLIENT;
  }
  if (role === USER_ROLES.CONSULTANT) {
    return MYPAGE_ROLE_LAYOUT_KEYS.CONSULTANT;
  }
  if (isOperatorCounselingDualRole(user)) {
    return MYPAGE_ROLE_LAYOUT_KEYS.OPERATOR_DUAL;
  }
  return MYPAGE_ROLE_LAYOUT_KEYS.OPERATOR;
}

/**
 * @param {{ role?: string, counselingEnabled?: boolean }|null|undefined} user
 * @returns {{ key: string, layout: string, surface: string, sections: string[], linksTitle: string,
 *   linksLanding: string, links: object[], hideFields: string[] }}
 */
export function resolveMypageRoleLayout(user) {
  const key = resolveMypageRoleLayoutKey(user);
  return { key, ...MYPAGE_ROLE_LAYOUT[key] };
}

/** 저장 API 가 없거나 준비 중인 기능 — true 가 되기 전에는 화면에 내보내지 않는다 (Q1) */
export const MYPAGE_FEATURE_READY = Object.freeze({
  SETTINGS: false,
  TWO_FACTOR: false,
  LOGOUT_OTHER_DEVICES: false,
  SUPPORT: false,
  DATA_REQUEST: false
});

/** 예전 ?tab= 딥링크 → 섹션 앵커 */
export const MYPAGE_LEGACY_TAB_TO_SECTION = Object.freeze({
  profile: MYPAGE_SECTION_KEYS.BASIC,
  settings: MYPAGE_SECTION_KEYS.NOTIFY,
  security: MYPAGE_SECTION_KEYS.SECURITY,
  social: MYPAGE_SECTION_KEYS.SOCIAL,
  privacy: MYPAGE_SECTION_KEYS.PRIVACY
});

/**
 * ?tab= 또는 #hash 로 들어온 값을 이 레이아웃에 있는 섹션 키로 바꾼다. 없으면 '' (맨 위).
 *
 * @param {{ tab?: string|null, hash?: string|null, sections: string[] }} params
 * @returns {string}
 */
export function resolveMypageScrollTarget({ tab, hash, sections }) {
  const list = Array.isArray(sections) ? sections : [];
  const hashKey = typeof hash === 'string' ? hash.replace(/^#/, '').trim() : '';
  if (hashKey && list.includes(hashKey)) {
    return hashKey;
  }
  const mapped = tab ? MYPAGE_LEGACY_TAB_TO_SECTION[tab] : '';
  if (mapped && list.includes(mapped)) {
    return mapped;
  }
  return '';
}

export const MYPAGE_LAYOUT_COPY = Object.freeze({
  TITLE: '마이페이지',
  CAPTION: '내 계정 정보와 로그인·알림 설정을 한 화면에서 관리합니다.',
  ACCOUNT_CARD_ARIA: '내 계정',
  ACCOUNT_CARD_TITLE: '내 계정',
  INDEX_TITLE: '이 페이지',
  INDEX_ARIA: '이 페이지 목차',
  EMPTY_ROWS_LABEL: '입력하지 않은 항목',
  EDIT: '수정',
  SAVE: '저장',
  CANCEL: '취소',
  CHANGE: '변경',
  LOADING: '사용자 정보를 불러오는 중...',
  CENTER_PREFIX: '센터',
  NO_VALUE: '—'
});

export const MYPAGE_FIELD_LABELS = Object.freeze({
  NAME: '이름',
  NICKNAME: '닉네임',
  EMAIL: '이메일',
  PHONE: '휴대전화',
  GENDER: '성별',
  SELECT_PLACEHOLDER: '선택해 주세요',
  ADDRESS: '주소',
  PROFILE_IMAGE: '프로필 사진',
  PROFILE_IMAGE_HELP: 'JPG, PNG, WEBP (권장 2MB 이하)',
  NOTIFY_CHANNEL: '받는 방법',
  PASSWORD: '비밀번호',
  PASSWORD_VALUE: '목록에 표시하지 않습니다.',
  PASSWORD_CHANGE: '비밀번호 변경',
  PASSWORD_RESET: '비밀번호 찾기',
  DEVICE: '로그인한 기기',
  DEVICE_CURRENT: '이 기기',
  WITHDRAWAL: '회원 탈퇴'
});

/** 로그인·보안 — 2단계 인증·다른 기기 로그아웃 문구는 MYPAGE_FEATURE_READY 가 true 일 때만 쓰인다 */
export const MYPAGE_SECURITY_COPY = Object.freeze({
  THIS_BROWSER: '이 브라우저',
  BROWSER: '브라우저',
  TWO_FACTOR: '2단계 인증',
  TWO_FACTOR_OFF: '미사용',
  TWO_FACTOR_SETUP: '설정',
  TWO_FACTOR_NOT_READY: '2단계 인증은 준비 중입니다.',
  LOGOUT_OTHER_DEVICES: '다른 기기 모두 로그아웃'
});

/** 공통코드 그룹 — 전문 분야 한글명 (없으면 codeHelper.getSpecialtyKoreanName) */
export const MYPAGE_SPECIALTY_CODE_GROUP = 'CONSULTANT_SPECIALTY';
export const MYPAGE_SPECIALTY_SEPARATOR = ',';

/** 알림 채널 선호 문구 — 마이페이지 표기 (어드민 모달 기본 문구는 그대로) */
export const MYPAGE_NOTIFY_COPY_OVERRIDES = Object.freeze({
  'tenantProfile.notificationChannel.optionTenantDefault': '센터 기본 설정 따르기',
  'tenantProfile.notificationChannel.optionKakao': '카카오 알림톡',
  'tenantProfile.notificationChannel.optionSms': '문자',
  'tenantProfile.notificationChannel.optionSmsDescription': '문자로 안내를 받습니다.'
});

export const MYPAGE_SOCIAL_PROVIDER_LABELS = Object.freeze({
  KAKAO: '카카오',
  NAVER: '네이버'
});

export const MYPAGE_SOCIAL_COPY = Object.freeze({
  LINKED: '연결됨',
  NOT_LINKED: '연결 안 됨',
  LINK: '연결하기',
  UNLINK: '연결 해제',
  NOT_LINKED_VALUE: '아직 연결하지 않았습니다.',
  OTHER: '기타'
});

export const MYPAGE_PRIVACY_COPY = Object.freeze({
  TERMS: '서비스 이용약관',
  PRIVACY: '개인정보 처리방침',
  MARKETING: '마케팅 수신',
  REQUIRED: '필수',
  OPTIONAL: '선택',
  AGREED: '동의함',
  NOT_AGREED: '동의 안 함',
  VIEW_TERMS: '약관 전문',
  EDIT: '동의 상태 수정',
  START: '동의하기',
  LAST_UPDATED: '최종 업데이트',
  INCOMPLETE: '서비스 이용을 위해 개인정보 처리방침과 이용약관 동의가 필요합니다.'
});

export const MYPAGE_CLIENT_NOTIFY_COPY = Object.freeze({
  GROUP_LABEL: '알림 종류'
});
