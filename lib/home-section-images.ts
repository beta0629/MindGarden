/**
 * 홈 메인 — 섹션 보조 이미지 (기획 반영)
 *
 * 범위: 메인 `app/page.tsx`의 #program-pages 등. 랜딩 소개 블록은 `MindgardenLandingSections`. 타 페이지는 `HomeSectionVisual` + 이 파일과
 * 동일 패턴(데이터 모듈 분리)으로 확장.
 *
 * 자산: Unsplash (`images.unsplash.com`, `next.config.js` remotePatterns). 자체/정적 자산으로
 * 바꿀 때는 `public/` 경로 문자열로 `src`만 교체하면 됨.
 *
 * AC 요약:
 * - LCP: 소개 섹션 첫 이미지만 `priority` (page에서 전달).
 * - alt: 섹션 제목(h2)과 문장을 그대로 반복하지 말고, 장면·분위기를 한 문장으로.
 * - 장식만인 경우(텍스트가 이미 전부 설명): 컴포넌트에 `decorative` 사용 검토.
 */
export const homeSectionImages = {
  about: {
    src: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1200&h=900&fit=crop&q=80',
    alt: '따뜻한 햇살이 들어오는 편안한 실내와 식물이 있는 공간',
  },
  programs: {
    src: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=1200&h=900&fit=crop&q=80',
    alt: '차분하고 평온한 분위기의 휴식 공간',
  },
} as const;
