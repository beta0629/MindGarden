import type { PackId, V37SceneKind } from './types';
import { v4RmPosterSrc, v4ScenePosterSrc } from '@/components/home/v4/assets';

type Props = {
  kind: V37SceneKind;
  pack: PackId;
  /** `v37-scene__poster` or with `--layout` after live paint. */
  className: string;
};

/**
 * Static scene poster. Motion URL is always the `<img src>` (never JS-swapped).
 * Reduced-motion selects RM via `<source media>` only — no post-mount src flip.
 */
export function V37ScenePoster({ kind, pack, className }: Props) {
  return (
    <picture className={className}>
      <source
        media="(prefers-reduced-motion: reduce)"
        type="image/webp"
        srcSet={v4RmPosterSrc(kind, pack)}
      />
      {/* eslint-disable-next-line @next/next/no-img-element -- static LCP/layout spacer */}
      <img
        className={className}
        src={v4ScenePosterSrc(kind, pack)}
        alt=""
        decoding="async"
        loading="lazy"
        fetchPriority="low"
      />
    </picture>
  );
}
