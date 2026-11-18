type ResponsiveImageProps = {
  /** Basename under /images/responsive without width suffix, e.g. space-1-sandplay-c73-16x9 */
  baseName: string;
  /** Available widths that were generated (must not exceed source). */
  widths: number[];
  width: number;
  height: number;
  alt: string;
  className?: string;
  sizes: string;
  priority?: boolean;
  /** Fallback raster under /images/ */
  fallbackSrc: string;
};

/**
 * Pre-generated AVIF/WebP srcset. Never lists a width larger than the source.
 */
export function ResponsiveImage({
  baseName,
  widths,
  width,
  height,
  alt,
  className,
  sizes,
  priority = false,
  fallbackSrc,
}: ResponsiveImageProps) {
  const sorted = [...widths].sort((a, b) => a - b);
  const avif = sorted
    .map((w) => `/images/responsive/${baseName}-${w}.avif ${w}w`)
    .join(', ');
  const webp = sorted
    .map((w) => `/images/responsive/${baseName}-${w}.webp ${w}w`)
    .join(', ');

  return (
    <picture className={className}>
      <source type="image/avif" srcSet={avif} sizes={sizes} />
      <source type="image/webp" srcSet={webp} sizes={sizes} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={fallbackSrc}
        alt={alt}
        width={width}
        height={height}
        sizes={sizes}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        fetchPriority={priority ? 'high' : undefined}
      />
    </picture>
  );
}
