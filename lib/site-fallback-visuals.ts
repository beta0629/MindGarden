/**
 * 레포에 `gallery_*.png` / `hero.png` / `logo_new.png`가 없을 때 쓰는 폴백.
 * 갤러리 URL은 `public/` 정적 경로(절대 도메인 없음). 카카오 공유 등에는 origin과 조합.
 */

const BASE = '/assets/images/generated-garden';

export type FallbackGalleryItem = { url: string; alt: string };

/** 홈 갤러리 스트립·마퀴·API 폴백 (4장) */
export const FALLBACK_GALLERY_IMAGES: FallbackGalleryItem[] = [
  {
    url: `${BASE}/fallback-01.jpg`,
    alt: '분수와 수국이 어우러진 고요한 정원 마당',
  },
  {
    url: `${BASE}/fallback-02.jpg`,
    alt: '새싹과 햇빛이 드는 온실 속 돌봄의 공간',
  },
  {
    url: `${BASE}/fallback-03.jpg`,
    alt: '나무 그늘과 산책로가 이어지는 평온한 정원',
  },
  {
    url: `${BASE}/fallback-04.jpg`,
    alt: '연못과 정자가 있는 해 질 녘의 치유 정원',
  },
];

/** 히어로 `<video poster>` — 비디오 로딩 전 표시 */
export const HERO_VIDEO_POSTER_URL = `${BASE}/mg-hero-bg.jpg`;

/**
 * 카카오 등 SNS 공유 썸네일 — 사이트 루트 기준 경로.
 * 브라우저에서 절대 URL이 필요하면 `origin + SITE_SHARE_PREVIEW_IMAGE_URL` 사용.
 */
export const SITE_SHARE_PREVIEW_IMAGE_URL = `${BASE}/fallback-01.jpg`;
