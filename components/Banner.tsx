'use client';

import { useState, useEffect } from 'react';

interface BannerItem {
  id: number;
  title: string;
  content: string | null;
  imageUrl: string | null;
  linkUrl: string | null;
}

interface BannerProps {
  banners: BannerItem[];
}

export default function Banner({ banners }: BannerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (banners.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 5000); // 5초마다 전환

    return () => clearInterval(interval);
  }, [banners.length]);

  if (banners.length === 0) {
    return null;
  }

  const currentBanner = banners[currentIndex];

  const content = currentBanner.linkUrl ? (
    <a
      href={currentBanner.linkUrl}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: 'block',
        textDecoration: 'none',
        color: 'inherit',
      }}
    >
      <BannerContent banner={currentBanner} />
    </a>
  ) : (
    <BannerContent banner={currentBanner} />
  );

  return (
    <div
      style={{
        width: '100%',
        backgroundColor: 'var(--surface-1)',
        borderBottom: '1px solid var(--border-soft)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        key={currentBanner.id}
        className="banner-item"
        style={{
          opacity: 1,
          transition: 'opacity 0.5s ease-in-out',
        }}
      >
        {content}
      </div>
      {banners.length > 1 && (
        <div
          style={{
            position: 'absolute',
            bottom: '8px',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: '6px',
            zIndex: 10,
          }}
        >
          {banners.map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => setCurrentIndex(index)}
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                border: 'none',
                backgroundColor: index === currentIndex ? 'var(--accent-sky)' : 'rgba(0, 0, 0, 0.2)',
                cursor: 'pointer',
                transition: 'background-color 0.3s',
                padding: 0,
              }}
              aria-label={`배너 ${index + 1}로 이동`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function BannerContent({ banner }: { banner: BannerItem }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '16px',
        padding: '12px 20px',
        maxWidth: '1200px',
        margin: '0 auto',
      }}
    >
      {banner.imageUrl && (
        <img
          src={banner.imageUrl}
          alt={banner.title}
          style={{
            maxHeight: '60px',
            maxWidth: '200px',
            objectFit: 'contain',
            flexShrink: 0,
          }}
        />
      )}
      <div style={{ flex: 1, textAlign: banner.imageUrl ? 'left' : 'center' }}>
        <h3 style={{
          fontSize: '1rem',
          fontWeight: '700',
          marginBottom: banner.content ? '4px' : 0,
          color: 'var(--text-main)',
        }}>
          {banner.title}
        </h3>
        {banner.content && (
          <div
            style={{
              fontSize: '0.9rem',
              color: 'var(--text-sub)',
              lineHeight: '1.5',
            }}
            dangerouslySetInnerHTML={{ __html: banner.content }}
          />
        )}
      </div>
    </div>
  );
}
