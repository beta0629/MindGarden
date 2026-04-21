/**
 * codeHelper.js — 사용자·UI 노출 문자열 (맵 값, 라벨, fallback)
 * @author Core Solution
 * @since 2026-04-21
 */

export const MASK_ENCRYPTED_DISPLAY_FALLBACK = '—';

export const USER_STATUS_KOREAN_NAME_ASYNC_MAP = {
  ACTIVE: '활성',
  INACTIVE: '비활성',
  SUSPENDED: '일시정지',
  COMPLETED: '완료',
  PENDING: '대기중',
  APPROVED: '승인됨',
  REJECTED: '거부됨',
  PAYMENT_CONFIRMED: '결제확인',
  PAYMENT_PENDING: '결제대기',
  PAYMENT_REJECTED: '결제거부',
  TERMINATED: '종료됨'
};

export const USER_STATUS_KOREAN_NAME_SYNC_MAP = {
  ACTIVE: '활성',
  INACTIVE: '비활성',
  PENDING: '대기',
  SUSPENDED: '정지',
  DELETED: '삭제됨',
  PENDING_APPROVAL: '승인대기',
  APPROVED: '승인됨',
  REJECTED: '거부됨'
};

export const USER_GRADE_KOREAN_NAME_MAP = {
  CLIENT_BRONZE: '브론즈',
  CLIENT_SILVER: '실버',
  CLIENT_GOLD: '골드',
  CLIENT_PLATINUM: '플래티넘',
  CLIENT_DIAMOND: '다이아몬드',
  BRONZE: '브론즈',
  SILVER: '실버',
  GOLD: '골드',
  PLATINUM: '플래티넘',
  DIAMOND: '다이아몬드',
  CONSULTANT_JUNIOR: '주니어',
  CONSULTANT_SENIOR: '시니어',
  CONSULTANT_EXPERT: '전문가',
  JUNIOR: '주니어',
  SENIOR: '시니어',
  EXPERT: '전문가',
  ADMIN: '관리자'
};

export const USER_GRADE_KOREAN_DEFAULT = '브론즈';

export const USER_GRADE_ICON_MAP = {
  CLIENT_BRONZE: '🥉',
  CLIENT_SILVER: '🥈',
  CLIENT_GOLD: '🥇',
  CLIENT_PLATINUM: '💎',
  CLIENT_DIAMOND: '💠',
  BRONZE: '🥉',
  SILVER: '🥈',
  GOLD: '🥇',
  PLATINUM: '💎',
  DIAMOND: '💠',
  CONSULTANT_JUNIOR: '⭐',
  CONSULTANT_SENIOR: '⭐⭐',
  CONSULTANT_EXPERT: '⭐⭐⭐',
  JUNIOR: '⭐',
  SENIOR: '⭐⭐',
  EXPERT: '⭐⭐⭐',
  ADMIN: '👑'
};

export const USER_GRADE_ICON_FALLBACK_ASYNC = '🥉';
export const USER_GRADE_ICON_FALLBACK_SYNC = '👤';

export const MAPPING_STATUS_KOREAN_NAME_ASYNC_MAP = {
  PENDING_PAYMENT: '결제 대기',
  PAYMENT_CONFIRMED: '결제 확인',
  ACTIVE: '활성',
  INACTIVE: '비활성',
  SUSPENDED: '일시정지',
  TERMINATED: '종료됨',
  SESSIONS_EXHAUSTED: '회기 소진'
};

export const MAPPING_STATUS_KOREAN_NAME_SYNC_MAP = {
  PENDING_PAYMENT: '결제 대기',
  PAYMENT_CONFIRMED: '결제 확인',
  ACTIVE: '활성',
  INACTIVE: '비활성',
  SUSPENDED: '일시정지',
  TERMINATED: '종료됨',
  SESSIONS_EXHAUSTED: '회기 소진',
  PENDING: '대기',
  COMPLETED: '완료'
};

export const SPECIALTY_NOT_SET_LABEL = '미설정';

export const SPECIALTY_KOREAN_NAME_MAP = {
  DEPRESSION: '우울증',
  ANXIETY: '불안장애',
  TRAUMA: '트라우마',
  STRESS: '스트레스',
  RELATIONSHIP: '관계상담',
  FAMILY: '가족상담',
  COUPLE: '부부상담',
  CHILD: '아동상담',
  TEEN: '청소년상담',
  ADOLESCENT: '청소년상담',
  ADDICTION: '중독',
  EATING: '섭식장애',
  SLEEP: '수면장애',
  ANGER: '분노조절',
  GRIEF: '상실',
  SELF_ESTEEM: '자존감',
  CAREER: '진로상담',
  FAMIL: '가족상담'
};

export const SPECIALTY_DEFAULT_ICON = '🎯';

export const CONSULTANT_EXPERIENCE_NONE = '경력 정보 없음';
export const CONSULTANT_YEAR_SUFFIX = '년';
export const CONSULTANT_CONTACT_EMAIL_NONE = '이메일 정보 없음';
export const CONSULTANT_CONTACT_PHONE_NONE = '전화번호 정보 없음';
export const CONSULTANT_SESSION_COUNT_SUFFIX = '회';
export const CONSULTANT_INFO_NONE = '정보 없음';
export const CONSULTANT_CLIENT_COUNT_SUFFIX = '명';

export const AVAILABILITY_VACATION_LABEL = '휴무';
export const AVAILABILITY_UNAVAILABLE_LABEL = '상담 불가';
export const AVAILABILITY_BUSY_LABEL = '상담 중';
export const AVAILABILITY_AVAILABLE_LABEL = '상담 가능';
