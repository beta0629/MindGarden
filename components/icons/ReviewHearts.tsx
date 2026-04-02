'use client';

import type { CSSProperties } from 'react';

const HEART_PATH =
  'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 6 4 4 6.5 4c1.74 0 3.41 1 4.5 2.09C12.09 5 13.76 4 15.5 4 18 4 20 6 20 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z';

export function HeartGlyph({
  filled,
  size = 16,
  className,
  style,
}: {
  filled: boolean;
  size?: number;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      style={style}
      aria-hidden
    >
      {filled ? (
        <path fill="currentColor" d={HEART_PATH} />
      ) : (
        <path
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          d={HEART_PATH}
        />
      )}
    </svg>
  );
}

/** 0~5, 0.5 단위는 채운 하트 + 낮은 불투명도로 표시 */
export function RatingHeartsRow({
  rating,
  size = 14,
}: {
  rating: number;
  size?: number;
}) {
  return (
    <div style={{ display: 'flex', gap: '0.125rem', alignItems: 'center' }}>
      {Array.from({ length: 5 }).map((_, i) => {
        const slot = i + 1;
        if (rating >= slot) {
          return (
            <HeartGlyph key={i} filled size={size} style={{ color: '#ef4444' }} />
          );
        }
        if (rating >= slot - 0.5) {
          return (
            <HeartGlyph
              key={i}
              filled
              size={size}
              style={{ color: '#ef4444', opacity: 0.5 }}
            />
          );
        }
        return (
          <HeartGlyph key={i} filled={false} size={size} style={{ color: '#cbd5e1' }} />
        );
      })}
    </div>
  );
}
