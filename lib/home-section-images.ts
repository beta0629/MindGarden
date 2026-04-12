/**
 * 홈 메인 — 섹션 보조 이미지 (기획 반영)
 *
 * 범위: 메인 `app/page.tsx`의 #program-pages 등. 랜딩 소개 블록은 `MindgardenLandingSections`. 타 페이지는 `HomeSectionVisual` + 이 파일과
 * 동일 패턴(데이터 모듈 분리)으로 확장.
 *
 * 자산: `public/assets/images/generated-garden/` 등 정적 경로.
 *
 * AC 요약:
 * - LCP: 소개 섹션 첫 이미지만 `priority` (page에서 전달).
 * - alt: 섹션 제목(h2)과 문장을 그대로 반복하지 말고, 장면·분위기를 한 문장으로.
 * - 장식만인 경우(텍스트가 이미 전부 설명): 컴포넌트에 `decorative` 사용 검토.
 */
const BASE = '/assets/images/generated-garden';

export const homeSectionImages = {
  about: {
    src: `${BASE}/values-hero.jpg`,
    alt: '이른 햇살이 비치는 정원 산책로와 꽃·나무가 어우러진 고요한 치유 정원 풍경',
  },
  programs: {
    src: '/assets/images/home-programs-garden.jpg',
    alt: '꽃과 녹음이 어우러진 아름다운 정원',
  },
} as const;
