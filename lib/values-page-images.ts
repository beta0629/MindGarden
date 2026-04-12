/**
 * 가치관 `/values` — 블록별 보조 이미지 (VALUES_PAGE_IMAGE_MEETING.md)
 *
 * 자산: `public/assets/images/generated-garden/` (AI 생성 · 정원·치유 테마 JPEG).
 */
const BASE = '/assets/images/generated-garden';

export const valuesPageImages = {
  hero: {
    src: `${BASE}/values-hero.jpg`,
    alt: '이른 햇살이 비치는 정원 산책로와 꽃·나무가 어우러진 고요한 치유 정원 풍경',
    width: 1376,
    height: 768,
  },
  professionalism: {
    src: `${BASE}/values-professionalism.jpg`,
    alt: '정돈된 화단과 독서용 정원 공간에서 느껴지는 차분하고 전문적인 분위기',
    width: 1376,
    height: 768,
  },
  humanity: {
    src: `${BASE}/values-humanity.jpg`,
    alt: '부드러운 빛 아래 피어 있는 꽃과 잎이 어우러진 다정하고 인간적인 장면',
    width: 1376,
    height: 768,
  },
  growth: {
    src: `${BASE}/values-growth.jpg`,
    alt: '새싹에서 숲까지 이어지는 정원 길, 성장과 회복의 여정을 떠올리게 하는 풍경',
    width: 1376,
    height: 768,
  },
} as const;
