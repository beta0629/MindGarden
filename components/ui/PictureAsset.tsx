type PictureAssetProps = {
  /** Path under /illustrations without extension, e.g. empty-reviews@2x */
  baseName: string;
  width: number;
  height: number;
  alt: string;
  className?: string;
  priority?: boolean;
  /** Optional SVG fallback when raster is unavailable */
  svgSrc?: string;
  sizes?: string;
};

/**
 * AVIF → WebP → img picture for assets-v1.
 * Opaque cream composites must sit on cream backgrounds only.
 */
export function PictureAsset({
  baseName,
  width,
  height,
  alt,
  className,
  priority = false,
  svgSrc,
  sizes,
}: PictureAssetProps) {
  const avif = `/illustrations/${baseName}.avif`;
  const webp = `/illustrations/${baseName}.webp`;
  const loading = priority ? 'eager' : 'lazy';
  const fetchPriority = priority ? ('high' as const) : undefined;
  const imgSrc = svgSrc ?? webp;

  return (
    <picture className={className}>
      <source type="image/avif" srcSet={avif} />
      <source type="image/webp" srcSet={webp} />
      <img
        src={imgSrc}
        alt={alt}
        width={width}
        height={height}
        loading={loading}
        decoding="async"
        fetchPriority={fetchPriority}
        sizes={sizes}
      />
    </picture>
  );
}
