/**
 * 전문특화(/about/mindgarden) 섹션별 보조 이미지 — 정원 메타포(AI 생성)
 * alt는 제목과 중복되지 않게 장면 위주.
 */
const BASE = '/assets/images/generated-garden';

export const mindgardenSectionImages = {
  responsibility: {
    src: `${BASE}/mg-responsibility.jpg`,
    alt: '잘 가꿔진 텃밭과 도구가 놓인 책임과 돌봄을 상징하는 정원 풍경',
  },
  trust: {
    src: `${BASE}/mg-trust.jpg`,
    alt: '연못과 벤치가 마주 보이는 정원에서 신뢰와 대화를 떠올리게 하는 풍경',
  },
  experience: {
    src: `${BASE}/mg-experience.jpg`,
    alt: '모래가 고른 젠 가든, 차분한 경험과 성찰의 분위기',
  },
  origin: {
    src: `${BASE}/mg-origin.jpg`,
    alt: '흙 속에서 돋아난 새싹, 시작과 근원을 상징하는 장면',
  },
  'late-diagnosis': {
    src: `${BASE}/mg-late-diagnosis.jpg`,
    alt: '살짝 열린 정원문 너머로 이어지는 길, 새로운 이해와 발견을 상징',
  },
  comprehensive: {
    src: `${BASE}/mg-comprehensive.jpg`,
    alt: '한 화단에 서로 다른 식물이 함께 자라는 모습, 포괄적 돌봄을 상징',
  },
  philosophy: {
    src: `${BASE}/mg-philosophy.jpg`,
    alt: '햇살이 스며드는 식물이 가득한 유리 온실, 철학과 성찰의 공간',
  },
  invitation: {
    src: `${BASE}/mg-invitation.jpg`,
    alt: '덩굴 아치와 초대하는 정원 길, 따뜻한 환영의 풍경',
  },
} as const;
