/**
 * 상담 유형 페이지 이미지 메타 — docs/COUNSELING_TYPE_PAGES_IMAGE_DESIGN.md
 * section id는 lib/counseling-type-pages.ts와 정합.
 *
 * 기본: Unsplash 원격 URL (홈·전문특화와 동일, next.config remotePatterns).
 * 로컬 WebP: `NEXT_PUBLIC_COUNSELING_IMAGES_USE_LOCAL=true` + public/assets/images/counseling/{slug}/
 */

import type { CounselingSlug } from '@/lib/counseling-type-pages';

/** 투명 1×1 GIF — 테스트·레이아웃 전용 (일반 경로에서는 미사용) */
export const COUNSELING_TYPE_IMAGE_PLACEHOLDER_SRC =
  'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

export type CounselingTypeBeforeSectionImage = {
  sectionId: string;
  file: string;
  alt: string;
  remoteSrc: string;
};

export type CounselingPageImagePlan = {
  hero: { file: string; alt: string; remoteSrc: string };
  beforeSection: CounselingTypeBeforeSectionImage[];
};

/**
 * `NEXT_PUBLIC_COUNSELING_IMAGES_USE_LOCAL === 'true'`이면 public 정적 경로,
 * 그 외에는 Unsplash 등 원격 URL (개발·스테이징에서도 이미지 노출).
 */
export function counselingTypeImageSrc(
  slug: string,
  file: string,
  remoteSrc: string
): string {
  if (process.env.NEXT_PUBLIC_COUNSELING_IMAGES_USE_LOCAL === 'true') {
    return `/assets/images/counseling/${slug}/${file}`;
  }
  return remoteSrc;
}

const W_HERO = 'w=1600&h=900&fit=crop&q=80';
const W_SEC = 'w=1600&h=1067&fit=crop&q=80';

/** slug·section id·파일명·alt·원격 src — 디자인 문서 톤에 맞는 실내·공간 계열 */
export const COUNSELING_TYPE_IMAGE_PLAN = {
  'child-adolescent-adhd': {
    hero: {
      file: 'hero.webp',
      alt: '햇살이 스며든 거실, 부드러운 색의 쿠션과 책이 놓인 조용한 가정 분위기.',
      remoteSrc: `https://images.unsplash.com/photo-1586023492125-27b2c045efd7?${W_HERO}`,
    },
    beforeSection: [
      {
        sectionId: 'features',
        file: 'section-features.webp',
        alt: '창가 책상 위에 정돈된 필기구와 노트가 있는 차분한 학습 코너.',
        remoteSrc: `https://images.unsplash.com/photo-1513542789411-b6d5c869de1b?${W_SEC}`,
      },
      {
        sectionId: 'family',
        file: 'section-family.webp',
        alt: '소파에 마주 앉은 성인의 어깨와 손만 보이는, 부담 없는 대화 장면의 실내.',
        remoteSrc: `https://images.unsplash.com/photo-1522336572469-59614c884063?${W_SEC}`,
      },
    ],
  },
  'adult-adhd': {
    hero: {
      file: 'hero.webp',
      alt: '노트북과 머그잔이 놓인 밝은 책상과 창으로 들어오는 자연광이 있는 일반적인 업무 공간.',
      remoteSrc: `https://images.unsplash.com/photo-1497366811353-6870744d04b2?${W_HERO}`,
    },
    beforeSection: [
      {
        sectionId: 'presentation',
        file: 'section-presentation.webp',
        alt: '화이트보드와 의자가 정돈된 중립적인 회의실 풍경.',
        remoteSrc: `https://images.unsplash.com/photo-1560472354-b33ff0c44a43?${W_SEC}`,
      },
      {
        sectionId: 'comorbid',
        file: 'section-comorbid.webp',
        alt: '화분과 부드러운 조명만 있는 창가 휴게 코너, 차분한 톤.',
        remoteSrc: `https://images.unsplash.com/photo-1416879595882-3373a0480b5b?${W_SEC}`,
      },
    ],
  },
  comorbidity: {
    hero: {
      file: 'hero.webp',
      alt: '따뜻한 목재 톤과 균형 잡힌 실내 조명이 이어지는 상담 센터 복도.',
      remoteSrc: `https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?${W_HERO}`,
    },
    beforeSection: [
      {
        sectionId: 'areas',
        file: 'section-areas.webp',
        alt: '여러 문이 나란히 있는 단정하고 중립적인 실내 통로.',
        remoteSrc: `https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?${W_SEC}`,
      },
      {
        sectionId: 'counseling',
        file: 'section-counseling.webp',
        alt: '상담실 앞 벤치와 벽면 색만 보이는 대기 공간 느낌.',
        remoteSrc: `https://images.unsplash.com/photo-1505576391889-b40f689d9380?${W_SEC}`,
      },
    ],
  },
  'counseling-areas': {
    hero: {
      file: 'hero.webp',
      alt: '책장과 은은한 조명이 있는 전문 상담 사무실 분위기의 실내.',
      remoteSrc: `https://images.unsplash.com/photo-1481627834876-b7833c8f5576?${W_HERO}`,
    },
    beforeSection: [
      {
        sectionId: 'examples',
        file: 'section-examples.webp',
        alt: '특정 주제를 과장하지 않는 일반 서가와 식물이 있는 열람 공간.',
        remoteSrc: `https://images.unsplash.com/photo-1524995997946-a1c36990a10d?${W_SEC}`,
      },
      {
        sectionId: 'intake',
        file: 'section-intake.webp',
        alt: '접수대와 안내 표지가 보이지만 인물 얼굴은 없는 초기 방문 동선의 실내.',
        remoteSrc: `https://images.unsplash.com/photo-1556761175-5973dc0f32e7?${W_SEC}`,
      },
    ],
  },
} satisfies Record<CounselingSlug, CounselingPageImagePlan>;
