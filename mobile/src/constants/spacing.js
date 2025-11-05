/**
 * 모바일 최적화 스페이싱 상수 정의
 * 터치 인터페이스에 최적화된 스페이싱 값들
 */

export const SPACING = {
  // 터치 타겟 최소 크기 고려 (44px 이상)
  touch: 44,     // 최소 터치 타겟 크기

  // 기본 스페이싱 (모바일에 최적화)
  xs: 8,         // 매우 작은 간격 (아이콘 간격 등)
  sm: 12,        // 작은 간격 (컴포넌트 내부)
  md: 16,        // 중간 간격 (표준 패딩)
  lg: 20,        // 큰 간격 (섹션 간격)
  xl: 24,        // 매우 큰 간격 (주요 섹션 구분)
  '2xl': 32,     // 특대 간격 (화면 여백)

  // 화면 여백 (모바일 화면에 최적화)
  screen: {
    horizontal: 16,  // 좌우 여백
    vertical: 20,    // 상하 여백
  },

  // 컴포넌트별 최적화된 스페이싱
  card: {
    padding: 16,     // 카드 패딩
    gap: 12,         // 카드 내 요소 간격
  },

  button: {
    padding: {
      horizontal: 20,  // 버튼 좌우 패딩
      vertical: 12,    // 버튼 상하 패딩
    },
    gap: 8,          // 버튼 내 아이콘/텍스트 간격
  },

  input: {
    padding: {
      horizontal: 16,  // 입력 필드 좌우 패딩
      vertical: 12,    // 입력 필드 상하 패딩
    },
  },

  list: {
    item: {
      padding: 16,     // 리스트 아이템 패딩
      gap: 12,         // 리스트 아이템 내 간격
    },
    separator: 1,     // 리스트 구분선 두께
  },
};

export default SPACING;

