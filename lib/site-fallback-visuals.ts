/**
 * 레포에 `gallery_*.png` / `hero.png` / `logo_new.png`가 없을 때 쓰는 폴백.
 * URL은 배포 전 `curl -sI "<url>" | head -1` 로 200 확인 권장.
 */

const GQ = 'w=1400&h=1050&fit=crop&q=80';

export type FallbackGalleryItem = { url: string; alt: string };

/** 홈 갤러리 스트립·마퀴·API 폴백 (4장) */
export const FALLBACK_GALLERY_IMAGES: FallbackGalleryItem[] = [
  {
    url: `https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?${GQ}`,
    alt: '따뜻한 상담 공간',
  },
  {
    url: `https://images.unsplash.com/photo-1506126613408-eca07ce68773?${GQ}`,
    alt: '편안한 치료실',
  },
  {
    url: `https://images.unsplash.com/photo-1497215842964-222b430dc094?${GQ}`,
    alt: '평화로운 공간',
  },
  {
    url: `https://images.unsplash.com/photo-1581578731548-c64695cc6952?${GQ}`,
    alt: '따뜻한 조명의 공간',
  },
];

/** 히어로 `<video poster>` — 비디오 로딩 전 표시 */
export const HERO_VIDEO_POSTER_URL =
  'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=1920&h=1080&fit=crop&q=80';

/**
 * 카카오 등 SNS 공유 썸네일 (절대 HTTPS URL 필요)
 */
export const SITE_SHARE_PREVIEW_IMAGE_URL = FALLBACK_GALLERY_IMAGES[0].url;
