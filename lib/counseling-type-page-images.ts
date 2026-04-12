/**
 * 상담 유형 페이지 이미지 메타 — docs/COUNSELING_TYPE_PAGES_IMAGE_DESIGN.md
 * section id는 lib/counseling-type-pages.ts와 정합.
 *
 * 기본: `public/assets/images/counseling/{slug}/` 정원 테마 WebP(생성·변환 산출물).
 * 폴백: `NEXT_PUBLIC_COUNSELING_IMAGES_USE_LOCAL=false`이면 아래 `remoteSrc`(Unsplash) 사용.
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
 * 기본은 로컬 정적 경로. 원격만 쓰려면 `NEXT_PUBLIC_COUNSELING_IMAGES_USE_LOCAL=false`.
 */
export function counselingTypeImageSrc(
  slug: string,
  file: string,
  remoteSrc: string
): string {
  if (process.env.NEXT_PUBLIC_COUNSELING_IMAGES_USE_LOCAL === 'false') {
    return remoteSrc;
  }
  return `/assets/images/counseling/${slug}/${file}`;
}

const W_HERO = 'w=1600&h=900&fit=crop&q=80';
const W_SEC = 'w=1600&h=1067&fit=crop&q=80';

/** slug·section id·파일명·alt·원격 폴백 — 정원 테마(성장·질서·다양성·초대) 메타포 */
export const COUNSELING_TYPE_IMAGE_PLAN = {
  'child-adolescent-adhd': {
    hero: {
      file: 'hero.webp',
      alt: '이른 아침 안개 속, 디딤돌과 어린 새싹이 있는 고요한 치유 정원. 아이와 가정의 성장을 상징하는 풍경.',
      remoteSrc: `https://images.unsplash.com/photo-1586023492125-27b2c045efd7?${W_HERO}`,
    },
    beforeSection: [
      {
        sectionId: 'features',
        file: 'section-features.webp',
        alt: '작은 텃밭에 줄지어 심긴 모종과 단정한 화단. 배움과 루틴을 떠올리게 하는 정원 풍경.',
        remoteSrc: `https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?${W_SEC}`,
      },
      {
        sectionId: 'family',
        file: 'section-family.webp',
        alt: '꽃이 핀 나무 아래 벤치와 잔, 가족과의 대화를 떠올리게 하는 따뜻한 정원 한구석.',
        remoteSrc: `https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?${W_SEC}`,
      },
    ],
  },
  'adult-adhd': {
    hero: {
      file: 'hero.webp',
      alt: '이끼 낀 바위와 고요하게 갈린 자갈, 젠 가든 스타일의 정원. 집중과 정리를 상징하는 차분한 풍경.',
      remoteSrc: `https://images.unsplash.com/photo-1497366811353-6870744d04b2?${W_HERO}`,
    },
    beforeSection: [
      {
        sectionId: 'presentation',
        file: 'section-presentation.webp',
        alt: '원형 석재 테라스와 벤치가 둘러싸인 녹색 공간. 대화와 성찰을 위한 자연 속 자리.',
        remoteSrc: `https://images.unsplash.com/photo-1560472354-b33ff0c44a43?${W_SEC}`,
      },
      {
        sectionId: 'comorbid',
        file: 'section-comorbid.webp',
        alt: '한 화단에 서로 다른 식물이 함께 자라는 모습. 서로 다른 어려움이 맞물리는 맥락을 상징.',
        remoteSrc: `https://images.unsplash.com/photo-1416879595882-3373a0480b5b?${W_SEC}`,
      },
    ],
  },
  comorbidity: {
    hero: {
      file: 'hero.webp',
      alt: '다양한 꽃과 수목이 어우러진 보태니컬 가든 산책로. 공존과 조화를 떠올리게 하는 풍경.',
      remoteSrc: `https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?${W_HERO}`,
    },
    beforeSection: [
      {
        sectionId: 'areas',
        file: 'section-areas.webp',
        alt: '여러 갈래로 나뉜 자갈 길이 서로 다른 정원 테마로 이어지는 풍경. 삶의 여러 영역을 상징.',
        remoteSrc: `https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?${W_SEC}`,
      },
      {
        sectionId: 'counseling',
        file: 'section-counseling.webp',
        alt: '덩굴이 올라탄 목제 퍼걸러 아래 조용한 포치. 은밀한 대화와 쉼을 위한 정원 공간.',
        remoteSrc: `https://images.unsplash.com/photo-1541976590-713941681591?${W_SEC}`,
      },
    ],
  },
  'counseling-areas': {
    hero: {
      file: 'hero.webp',
      alt: '살짝 열린 정원문과 나무 그늘 사이로 이어지는 돌길. 처음 방문을 환영하는 풍경.',
      remoteSrc: `https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?${W_HERO}`,
    },
    beforeSection: [
      {
        sectionId: 'examples',
        file: 'section-examples.webp',
        alt: '허브와 향초가 줄지어 자란 텃밭. 서로 다른 주제를 다루는 다양함을 상징.',
        remoteSrc: `https://images.unsplash.com/photo-1522071820081-009f0129c71c?${W_SEC}`,
      },
      {
        sectionId: 'intake',
        file: 'section-intake.webp',
        alt: '낮은 생울타리 사이로 이어지는 디딤돌과 초록 아치. 첫 걸음과 초기 방문을 상징.',
        remoteSrc: `https://images.unsplash.com/photo-1556761175-5973dc0f32e7?${W_SEC}`,
      },
    ],
  },
} satisfies Record<CounselingSlug, CounselingPageImagePlan>;
