export interface HomeSectionVisualProps {
  src: string;
  /** 비어 있으면 스크린리더에서 숨김(순수 장식일 때만 사용) */
  alt: string;
  /** 첫 화면 근처 이미지에만 true → LCP */
  priority?: boolean;
  /** true이면 alt는 반드시 "" 권장, 이미지에 decorative 역할만 할 때 */
  decorative?: boolean;
}

/**
 * 메인·전문특화 페이지 섹션 보조 이미지.
 * `next/image`를 쓰지 않음 — 일부 환경에서 `/_next/image` 프록시가 Unsplash 등 원격 URL에서 실패하는 문제 방지.
 */
export default function HomeSectionVisual({
  src,
  alt,
  priority = false,
  decorative = false,
}: HomeSectionVisualProps) {
  const altResolved = decorative ? '' : alt;

  return (
    <figure className="home-section-visual">
      <div className="home-section-visual-frame">
        {/* eslint-disable-next-line @next/next/no-img-element -- 섹션 보조 이미지는 브라우저 직접 로드로 통일 */}
        <img
          src={src}
          alt={altResolved}
          width={1200}
          height={900}
          className="home-section-visual-img"
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          fetchPriority={priority ? 'high' : undefined}
          aria-hidden={decorative ? true : undefined}
        />
      </div>
    </figure>
  );
}
