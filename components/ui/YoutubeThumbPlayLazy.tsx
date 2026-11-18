'use client';

import { useEffect, useRef, useState, type ComponentType } from 'react';

type Props = {
  variant: 'feature' | 'card';
  url: string;
  title: string;
  thumb: string;
  reveal?: boolean;
};

/**
 * Below-fold YouTube thumbs — import the player chunk only when near viewport
 * so it never joins the homepage LCP critical graph.
 */
export function YoutubeThumbPlayLazy(props: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [Comp, setComp] = useState<ComponentType<Props> | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let cancelled = false;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        io.disconnect();
        void import('./YoutubeThumbPlay').then((m) => {
          if (!cancelled) setComp(() => m.YoutubeThumbPlay);
        });
      },
      { rootMargin: '200px 0px' },
    );
    io.observe(el);
    return () => {
      cancelled = true;
      io.disconnect();
    };
  }, []);

  if (Comp) return <Comp {...props} />;

  return (
    <div
      ref={ref}
      className={`home-reading-feature${props.reveal ? '' : ''}`}
      data-reveal={props.reveal ? true : undefined}
      aria-hidden="true"
      style={{ minHeight: '8rem' }}
    />
  );
}
