'use client';

import Image from 'next/image';
import { useState, type ReactNode } from 'react';

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

function embedUrl(id: string): string {
  return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?autoplay=1&playsinline=1&rel=0`;
}

type YoutubeThumbPlayProps = {
  /** YouTube watch URL; the video id is extracted from it. */
  url: string;
  title: string;
  thumb: string;
  /** feature = home readings overlay card, card = /videos grid card. */
  variant: 'feature' | 'card';
  /** Rendered after the title (e.g. internal review markers). */
  titleSuffix?: ReactNode;
  sizes?: string;
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
  sizes,
  reveal = false,
}: YoutubeThumbPlayProps) {
  const [playing, setPlaying] = useState(false);
  const id = extractYoutubeId(url);

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
      <Image src={thumb} alt="" fill sizes={sizes} quality={80} />
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
