'use client';

import { useState, type ReactNode, type SyntheticEvent } from 'react';

const YOUTUBE_ID_PATTERN = /^[A-Za-z0-9_-]{6,20}$/;

/** Extracts a YouTube video id from watch / youtu.be / shorts / embed URLs. */
export function extractYoutubeId(url: string): string | null {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, '');
    let id: string | null = null;
    if (host === 'youtu.be') {
      id = parsed.pathname.split('/')[1] ?? null;
    } else if (host.endsWith('youtube.com') || host.endsWith('youtube-nocookie.com')) {
      id = parsed.searchParams.get('v');
      if (!id) {
        const match = parsed.pathname.match(/^\/(?:shorts|embed|live)\/([^/?]+)/);
        id = match?.[1] ?? null;
      }
    }
    return id && YOUTUBE_ID_PATTERN.test(id) ? id : null;
  } catch {
    return null;
  }
}

/** Quality ladder: maxres is missing for many videos, so fall through to smaller sizes. */
const THUMB_QUALITIES = ['maxresdefault', 'sddefault', 'hqdefault'] as const;
/** YouTube serves a 120px-wide grey placeholder (sometimes with HTTP 200) when a size does not exist. */
const THUMB_PLACEHOLDER_MAX_WIDTH = 120;
const THUMB_SIZE = {
  /** Portrait hint for Shorts feature cards (9:16); maxres 16:9 is center-cropped+zoomed in CSS. */
  feature: { width: 720, height: 1280 },
  card: { width: 480, height: 854 },
} as const;

function thumbUrl(id: string, qualityIndex: number): string {
  return `https://i.ytimg.com/vi/${encodeURIComponent(id)}/${THUMB_QUALITIES[qualityIndex]}.jpg`;
}

function embedUrl(id: string): string {
  return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?autoplay=1&playsinline=1&rel=0`;
}

type YoutubeThumbPlayProps = {
  /** YouTube watch URL; the video id is extracted from it. */
  url: string;
  title: string;
  /** Fallback thumbnail used only when the video id cannot be extracted. */
  thumb: string;
  /** feature = home readings overlay card, card = /videos grid card. */
  variant: 'feature' | 'card';
  /** Rendered after the title (e.g. internal review markers). */
  titleSuffix?: ReactNode;
  /** Opts into the home scroll-reveal animation. */
  reveal?: boolean;
};

/**
 * Thumbnail with a ≥44px play control. Tapping swaps the media for an in-page
 * youtube-nocookie iframe so mobile users are not bounced to a new tab.
 */
export function YoutubeThumbPlay({
  url,
  title,
  thumb,
  variant,
  titleSuffix,
  reveal = false,
}: YoutubeThumbPlayProps) {
  const [playing, setPlaying] = useState(false);
  const [qualityIndex, setQualityIndex] = useState(0);
  const id = extractYoutubeId(url);
  const { width, height } = THUMB_SIZE[variant];
  const imgSrc = id ? thumbUrl(id, qualityIndex) : thumb;

  const stepDownQuality = () => {
    if (id && qualityIndex < THUMB_QUALITIES.length - 1) {
      setQualityIndex((i) => i + 1);
    }
  };

  const handleThumbLoad = (event: SyntheticEvent<HTMLImageElement>) => {
    if (event.currentTarget.naturalWidth <= THUMB_PLACEHOLDER_MAX_WIDTH) {
      stepDownQuality();
    }
  };

  const media = playing && id ? (
    <iframe
      className="yt-thumb__frame"
      src={embedUrl(id)}
      title={title}
      allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
      allowFullScreen
      referrerPolicy="strict-origin-when-cross-origin"
    />
  ) : (
    <button
      type="button"
      className="yt-thumb__trigger"
      aria-label={`${title} 재생`}
      onClick={() => {
        if (id) {
          setPlaying(true);
        } else {
          window.open(url, '_blank', 'noopener,noreferrer');
        }
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- ytimg direct; /_next/image 400s on CF/OpenNext */}
      <img
        key={imgSrc}
        src={imgSrc}
        alt=""
        width={width}
        height={height}
        loading="lazy"
        decoding="async"
        onError={stepDownQuality}
        onLoad={handleThumbLoad}
      />
      <span className="yt-thumb__play" aria-hidden="true">
        ▶
      </span>
    </button>
  );

  if (variant === 'feature') {
    return (
      <div
        className={`home-reading-feature home-reading-feature--video${
          playing ? ' is-playing' : ''
        }`}
        data-reveal={reveal ? '' : undefined}
      >
        <span className="home-reading-feature__media">{media}</span>
        <strong>
          {title}
          {titleSuffix}
        </strong>
      </div>
    );
  }

  return (
    <div className="news-card">
      <div className="news-card__media news-card__media--portrait">{media}</div>
      <strong>
        {title}
        {titleSuffix}
      </strong>
    </div>
  );
}
