import { valuesPageImages } from '@/lib/values-page-images';

export type ValuesVisualVariant = 'hero' | 'split' | 'accent' | 'band';

export interface ImageBlock {
  src: string;
  alt: string;
  width: number;
  height: number;
}

export interface ValuesSectionVisualProps {
  variant: ValuesVisualVariant;
  image: ImageBlock;
  priority?: boolean;
}

/**
 * 가치관 페이지 전용 — 블록마다 다른 프레이밍·비율 (에디토리얼 레이아웃).
 *
 * 이미지 로딩: `HomeSectionVisual`과 동일하게 **네이티브 `<img>`** 를 사용한다.
 * `next.config.js`에 `images.unsplash.com`이 있어도, 일부 배포에서 `/_next/image` 프록시가
 * 원격 URL에서 실패하는 사례가 있어 홈과 정책을 맞춘다. 로컬 `public/`만 쓸 때는
 * `next/image`로 전환 검토 가능.
 *
 * LCP: `priority === true`일 때 `loading="eager"` + `fetchPriority="high"` (§4).
 *
 * @see docs/VALUES_PAGE_IMAGE_MEETING.md
 */
export default function ValuesSectionVisual({
  variant,
  image,
  priority = false,
}: ValuesSectionVisualProps) {
  const frameClass =
    variant === 'hero'
      ? 'values-visual values-visual--hero'
      : variant === 'split'
        ? 'values-visual values-visual--split'
        : variant === 'accent'
          ? 'values-visual values-visual--accent'
          : 'values-visual values-visual--band';

  return (
    <figure className={frameClass}>
      <div className="values-visual__frame">
        {/* eslint-disable-next-line @next/next/no-img-element -- HomeSectionVisual과 동일: 원격 직접 로드 */}
        <img
          src={image.src}
          alt={image.alt}
          width={image.width}
          height={image.height}
          className="values-visual__img"
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          fetchPriority={priority ? 'high' : undefined}
        />
      </div>
    </figure>
  );
}
