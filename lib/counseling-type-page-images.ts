/**
 * 상담 유형 페이지 이미지 메타 — docs/COUNSELING_TYPE_PAGES_IMAGE_DESIGN.md
 * section id는 lib/counseling-type-pages.ts와 정합.
 */

import type { CounselingSlug } from '@/lib/counseling-type-pages';

/** 투명 1×1 GIF — 에셋 미사용 시 레이아웃·간격만 확인할 때 사용 */
export const COUNSELING_TYPE_IMAGE_PLACEHOLDER_SRC =
  'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

export type CounselingTypeBeforeSectionImage = {
  sectionId: string;
  file: string;
  alt: string;
};

export type CounselingPageImagePlan = {
  hero: { file: string; alt: string };
  beforeSection: CounselingTypeBeforeSectionImage[];
};

/** `NEXT_PUBLIC_COUNSELING_IMAGES_ENABLED === 'true'`일 때만 public 경로 사용 */
export function counselingTypeImageSrc(slug: string, file: string): string {
  if (process.env.NEXT_PUBLIC_COUNSELING_IMAGES_ENABLED !== 'true') {
    return COUNSELING_TYPE_IMAGE_PLACEHOLDER_SRC;
  }
  return `/assets/images/counseling/${slug}/${file}`;
}

/** slug·section id·파일명·alt — 디자인 문서와 동일 */
export const COUNSELING_TYPE_IMAGE_PLAN = {
  'child-adolescent-adhd': {
    hero: {
      file: 'hero.webp',
      alt: '햇살이 스며든 거실, 부드러운 색의 쿠션과 책이 놓인 조용한 가정 분위기.',
    },
    beforeSection: [
      {
        sectionId: 'features',
        file: 'section-features.webp',
        alt: '창가 책상 위에 정돈된 필기구와 노트가 있는 차분한 학습 코너.',
      },
      {
        sectionId: 'family',
        file: 'section-family.webp',
        alt: '소파에 마주 앉은 성인의 어깨와 손만 보이는, 부담 없는 대화 장면의 실내.',
      },
    ],
  },
  'adult-adhd': {
    hero: {
      file: 'hero.webp',
      alt: '노트북과 머그잔이 놓인 밝은 책상과 창으로 들어오는 자연광이 있는 일반적인 업무 공간.',
    },
    beforeSection: [
      {
        sectionId: 'presentation',
        file: 'section-presentation.webp',
        alt: '화이트보드와 의자가 정돈된 중립적인 회의실 풍경.',
      },
      {
        sectionId: 'comorbid',
        file: 'section-comorbid.webp',
        alt: '화분과 부드러운 조명만 있는 창가 휴게 코너, 차분한 톤.',
      },
    ],
  },
  comorbidity: {
    hero: {
      file: 'hero.webp',
      alt: '따뜻한 목재 톤과 균형 잡힌 실내 조명이 이어지는 상담 센터 복도.',
    },
    beforeSection: [
      {
        sectionId: 'areas',
        file: 'section-areas.webp',
        alt: '여러 문이 나란히 있는 단정하고 중립적인 실내 통로.',
      },
      {
        sectionId: 'counseling',
        file: 'section-counseling.webp',
        alt: '상담실 앞 벤치와 벽면 색만 보이는 대기 공간 느낌.',
      },
    ],
  },
  'counseling-areas': {
    hero: {
      file: 'hero.webp',
      alt: '책장과 은은한 조명이 있는 전문 상담 사무실 분위기의 실내.',
    },
    beforeSection: [
      {
        sectionId: 'examples',
        file: 'section-examples.webp',
        alt: '특정 주제를 과장하지 않는 일반 서가와 식물이 있는 열람 공간.',
      },
      {
        sectionId: 'intake',
        file: 'section-intake.webp',
        alt: '접수대와 안내 표지가 보이지만 인물 얼굴은 없는 초기 방문 동선의 실내.',
      },
    ],
  },
} satisfies Record<CounselingSlug, CounselingPageImagePlan>;
