/**
 * 모바일 최적화 크기 상수 정의
 * 터치 인터페이스와 모바일 UX에 최적화된 크기 값들
 */

export const SIZES = {
  // 터치 타겟 최소 크기 (Apple/Android 가이드라인)
  TOUCH_TARGET: {
    MINIMUM: 44,    // 최소 터치 타겟 크기
    PREFERRED: 48,  // 권장 터치 타겟 크기
  },

  // 프로필 이미지 크기 (모바일 최적화)
  PROFILE_IMAGE: {
    AVATAR: 60,     // 아바타 크기 (리스트용)
    HEADER: 80,     // 헤더용 프로필 이미지
    LARGE: 120,     // 프로필 편집 화면
    XLARGE: 150,    // 전체 화면 프로필
  },

  // 아이콘 크기 (가독성과 터치에 최적화)
  ICON: {
    XS: 16,         // 매우 작은 아이콘 (텍스트 인라인)
    SM: 20,         // 작은 아이콘 (버튼용)
    MD: 24,         // 중간 아이콘 (표준)
    LG: 28,         // 큰 아이콘 (메인 액션)
    XL: 32,         // 매우 큰 아이콘 (탭 바)
    '2XL': 40,      // 초대형 아이콘 (온보딩 등)
  },

  // 입력 필드 높이 (터치에 최적화)
  INPUT_HEIGHT: {
    SM: 44,         // 작은 입력 필드 (검색 등)
    MD: 48,         // 표준 입력 필드
    LG: 56,         // 큰 입력 필드 (멀티라인)
  },

  // 버튼 높이 (터치 타겟 크기 준수)
  BUTTON_HEIGHT: {
    SM: 44,         // 작은 버튼
    MD: 48,         // 표준 버튼
    LG: 52,         // 큰 버튼
  },

  // 네비게이션 바 높이
  NAVIGATION_BAR_HEIGHT: 56,  // 상단 네비게이션 바
  TAB_BAR_HEIGHT: 60,         // 하단 탭 바
  STATUS_BAR_HEIGHT: 24,      // 상태 바 (안전 영역 제외)

  // 카드 및 컨테이너 크기
  CARD: {
    BORDER_RADIUS: 12,        // 카드 모서리 둥글기
    PADDING: 16,              // 카드 패딩
    SHADOW: 4,                // 그림자 크기
    MIN_HEIGHT: 100,          // 중간 크기 카드 최소 높이
    WIDTH_SMALL: '48%',       // 작은 카드 너비 (2열 그리드)
    WIDTH_MEDIUM: '100%',     // 중간 카드 너비 (1열)
  },

  // 리스트 아이템 높이 (터치 최적화)
  LIST_ITEM_HEIGHT: {
    COMPACT: 48,    // 간단한 리스트 아이템
    STANDARD: 56,   // 표준 리스트 아이템
    LARGE: 72,      // 큰 리스트 아이템 (이미지 포함)
  },

  // 모달 및 팝업 크기
  MODAL: {
    BORDER_RADIUS: 16,        // 모달 모서리 둥글기
    MAX_WIDTH: 340,           // 최대 너비 (모바일 화면 고려)
    MIN_HEIGHT_EMPTY: 200,   // 빈 상태 모달 최소 높이
    MIN_HEIGHT_CONTENT: 300,  // 내용 있는 모달 최소 높이
  },

  // 타임라인 관련 크기
  TIMELINE: {
    HEIGHT: 300,              // 타임라인 높이
    HANDLE_HEIGHT: 16,        // 타임라인 핸들 높이
    SEPARATOR_HEIGHT: 1,      // 타임라인 시간 구분선 높이
  },

  // 입력 버튼 크기
  INPUT_BUTTON: {
    SM: 40,                   // 작은 입력 버튼 (세션 수 조절 버튼)
    MD: 50,                   // 중간 입력 버튼
    LG: 56,                   // 큰 입력 버튼
  },

  // 경계선 두께
  BORDER_WIDTH: {
    THIN: 0.5,      // 매우 얇은 선 (구분선)
    MEDIUM: 1,      // 표준 선
    THICK: 2,       // 굵은 선 (강조)
  },

  // Toast 메시지 크기 (Notification 컴포넌트용)
  TOAST: {
    WIDTH: '90%',
    MAX_WIDTH: 400,
  },

  // 이미지 크기 제한
  IMAGE: {
    MAX_WIDTH: 800,           // 최대 너비
    MAX_HEIGHT: 800,          // 최대 높이
    QUALITY: 0.85,            // 압축 품질
  },
};

// 터치 영역 (hitSlop) 상수
export const TOUCH_TARGET = {
  // 모달 닫기 버튼 등의 터치 영역
  closeButton: {
    top: 10,
    bottom: 10,
    left: 10,
    right: 10,
  },
  // 일반 버튼 터치 영역
  button: {
    top: 8,
    bottom: 8,
    left: 8,
    right: 8,
  },
  // 리스트 아이템 터치 영역
  listItem: {
    top: 4,
    bottom: 4,
    left: 4,
    right: 4,
  },
};

export default SIZES;

