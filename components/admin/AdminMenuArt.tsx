'use client';

const S = 48;

export type AdminMenuArtKind =
  | 'blog'
  | 'consultation'
  | 'popup'
  | 'banner'
  | 'gallery'
  | 'video'
  | 'reviews';

export default function AdminMenuArt({
  kind,
  color,
}: {
  kind: AdminMenuArtKind;
  color: string;
}) {
  const stroke = color;
  const fill = color;

  switch (kind) {
    case 'blog':
      return (
        <svg width={S} height={S} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M4 5h12a2 2 0 0 1 2 2v12H6a2 2 0 0 1-2-2V5z"
            stroke={stroke}
            strokeWidth="1.75"
          />
          <path d="M8 9h8M8 13h6" stroke={stroke} strokeWidth="1.75" strokeLinecap="round" />
        </svg>
      );
    case 'consultation':
      return (
        <svg width={S} height={S} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M6 8a6 6 0 1 1 12 0v2a6 6 0 0 1-12 0V8z"
            stroke={stroke}
            strokeWidth="1.75"
          />
          <path d="M9 17v2a3 3 0 0 0 6 0v-2" stroke={stroke} strokeWidth="1.75" />
        </svg>
      );
    case 'popup':
      return (
        <svg width={S} height={S} viewBox="0 0 24 24" fill="none" aria-hidden>
          <rect x="5" y="6" width="14" height="12" rx="2" stroke={stroke} strokeWidth="1.75" />
          <path d="M12 9v6M9 12h6" stroke={stroke} strokeWidth="1.75" strokeLinecap="round" />
        </svg>
      );
    case 'banner':
      return (
        <svg width={S} height={S} viewBox="0 0 24 24" fill="none" aria-hidden>
          <rect x="3" y="8" width="18" height="8" rx="1" stroke={stroke} strokeWidth="1.75" />
          <path d="M6 8V6M18 8V6" stroke={stroke} strokeWidth="1.75" strokeLinecap="round" />
        </svg>
      );
    case 'gallery':
      return (
        <svg width={S} height={S} viewBox="0 0 24 24" fill="none" aria-hidden>
          <rect x="4" y="5" width="16" height="14" rx="2" stroke={stroke} strokeWidth="1.75" />
          <circle cx="9" cy="10" r="2" fill={fill} />
          <path d="M4 17l5-5 4 4 4-4 3 3" stroke={stroke} strokeWidth="1.75" strokeLinejoin="round" />
        </svg>
      );
    case 'video':
      return (
        <svg width={S} height={S} viewBox="0 0 24 24" fill="none" aria-hidden>
          <rect x="4" y="6" width="12" height="12" rx="2" stroke={stroke} strokeWidth="1.75" />
          <path d="M16 10l4-2v8l-4-2v-4z" fill={fill} />
        </svg>
      );
    case 'reviews':
      return (
        <svg width={S} height={S} viewBox="0 0 24 24" aria-hidden>
          <path
            fill={fill}
            d="M12 3l2.1 5.2h5.6l-4.5 3.4 1.7 5.2L12 15.9 7.1 16.8l1.7-5.2L4.3 8.2h5.6L12 3z"
          />
        </svg>
      );
    default:
      return null;
  }
}
