/**
 * 마이페이지 리뉴얼 UI 상수 (문구·탭 키)
 *
 * @author CoreSolution
 * @since 2026-04-03
 */

export const MYPAGE_TITLE_ID = 'mg-mypage-page-title';

export const MYPAGE_TAB_KEYS = {
  PROFILE: 'profile',
  SETTINGS: 'settings',
  SECURITY: 'security',
  SOCIAL: 'social',
  PRIVACY: 'privacy'
};

export const MYPAGE_TAB_SET = new Set(Object.values(MYPAGE_TAB_KEYS));

/** 표시 순서 (제품 정책으로 항목 필터 가능) */
export const MYPAGE_TAB_ORDER = [
  MYPAGE_TAB_KEYS.PROFILE,
  MYPAGE_TAB_KEYS.SETTINGS,
  MYPAGE_TAB_KEYS.SECURITY,
  MYPAGE_TAB_KEYS.SOCIAL,
  MYPAGE_TAB_KEYS.PRIVACY
];

export const MYPAGE_TAB_LABELS = {
  [MYPAGE_TAB_KEYS.PROFILE]: '프로필',
  [MYPAGE_TAB_KEYS.SETTINGS]: '설정',
  [MYPAGE_TAB_KEYS.SECURITY]: '보안',
  [MYPAGE_TAB_KEYS.SOCIAL]: '소셜 계정',
  [MYPAGE_TAB_KEYS.PRIVACY]: '개인정보·동의'
};

export const getSocialProviderLabel = (provider) => {
  if (provider === 'KAKAO') return '카카오';
  if (provider === 'NAVER') return '네이버';
  return provider || '소셜';
};

export const ROLE_DISPLAY_LABELS = {
  CLIENT: '내담자',
  CONSULTANT: '상담사',
  STAFF: '스태프',
  ADMIN: '관리자',
  SUPER_ADMIN: '최고 관리자',
  BRANCH_MANAGER: '지점 관리자',
  BRANCH_SUPER_ADMIN: '지점 최고 관리자'
};
