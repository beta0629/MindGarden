/**
 * 가치관 `/values` — 블록별 보조 이미지 (VALUES_PAGE_IMAGE_MEETING.md)
 *
 * 자산: Unsplash (`HomeSectionVisual`과 동일 — `next/image` 프록시 이슈 회피용 직접 img).
 * 이후 `public/images/values/*.webp`로 교체 시 이 파일의 `src`만 경로로 바꾸면 됨.
 *
 * 블록: V-hero / V-pro / V-human / V-growth. V-intro는 문서상 선택·미적용.
 */
export const valuesPageImages = {
  hero: {
    src: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1600&h=686&fit=crop&q=80',
    alt: '따뜻한 햇살이 스며드는 편안한 실내와 식물이 있는 공간',
    width: 1600,
    height: 686,
  },
  professionalism: {
    src: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=960&h=720&fit=crop&q=80',
    alt: '책과 조용한 조도가 어우러진 독서·학습 공간의 분위기',
    width: 960,
    height: 720,
  },
  humanity: {
    src: 'https://images.unsplash.com/photo-1416879595882-3373a048d074?w=640&h=640&fit=crop&q=80',
    alt: '부드러운 빛 아래 피어 있는 꽃과 잎의 자연스러운 장면',
    width: 640,
    height: 640,
  },
  growth: {
    src: 'https://images.unsplash.com/photo-1464822759844-d150ad301d9c?w=1200&h=600&fit=crop&q=80',
    alt: '안개 낀 산맥 너머로 밝아오는 하늘, 고요한 회복과 여정을 연상시키는 풍경',
    width: 1200,
    height: 600,
  },
} as const;
