import type { ReactNode } from 'react';
import { PictureAsset } from '@/components/ui/PictureAsset';

export type EmptyStateKind = 'reviews' | 'event' | 'generic';

const ASSETS: Record<
  EmptyStateKind,
  { svg: string; raster: string; label: string }
> = {
  reviews: {
    svg: '/illustrations/empty-reviews.svg',
    raster: 'empty-reviews@2x',
    label: '등록된 후기가 없을 때',
  },
  event: {
    svg: '/illustrations/empty-event-off.svg',
    raster: 'empty-event-off@2x',
    label: '진행 중인 이벤트가 없을 때',
  },
  generic: {
    svg: '/illustrations/empty-generic.svg',
    raster: 'empty-generic@2x',
    label: '표시할 내용이 없을 때',
  },
};

type EmptyStateProps = {
  kind: EmptyStateKind;
  title: string;
  body?: string;
  children?: ReactNode;
};

/** Cream-only empty illustration (160×160 CSS). */
export function EmptyState({ kind, title, body, children }: EmptyStateProps) {
  const asset = ASSETS[kind];

  return (
    <div className="empty-state">
      <PictureAsset
        baseName={asset.raster}
        svgSrc={asset.svg}
        width={160}
        height={160}
        alt=""
        className="empty-state__art"
      />
      <p className="empty-state__title">{title}</p>
      {body ? <p className="muted">{body}</p> : null}
      <span className="sr-only">{asset.label}</span>
      {children}
    </div>
  );
}
