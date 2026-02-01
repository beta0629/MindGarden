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
  // 이미지가 있으면 기본 디자인 없이 이미지만 표시
  const hasImage = !!banner.imageUrl;
  // 텍스트만 있으면 기본 디자인 적용
  const hasTextOnly = !hasImage && (banner.title || banner.content);

  // 이미지만 있을 때
  if (hasImage && !banner.title && !banner.content) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '8px 0',
        }}
      >
        <img
          src={banner.imageUrl || ''}
          alt={banner.title || '배너'}
          style={{
            maxHeight: '80px',
            maxWidth: '100%',
            objectFit: 'contain',
            display: 'block',
          }}
        />
      </div>
    );
  }

  // 이미지와 텍스트가 함께 있을 때
  if (hasImage && (banner.title || banner.content)) {
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
        <img
          src={banner.imageUrl || ''}
          alt={banner.title || '배너'}
          style={{
            maxHeight: '60px',
            maxWidth: '200px',
            objectFit: 'contain',
            flexShrink: 0,
          }}
        />
        <div style={{ flex: 1, textAlign: 'left' }}>
          {banner.title && (
            <h3 style={{
              fontSize: '1rem',
              fontWeight: '700',
              marginBottom: banner.content ? '4px' : 0,
              color: 'var(--text-main)',
            }}>
              {banner.title}
            </h3>
          )}
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

  // 텍스트만 있을 때: 기본 디자인 템플릿 적용
  if (hasTextOnly) {
    return (
      <div
        style={{
          padding: '16px 24px',
          maxWidth: '1200px',
          margin: '0 auto',
          background: 'linear-gradient(135deg, rgba(248, 245, 240, 0.8) 0%, rgba(254, 249, 243, 0.8) 100%)',
          borderLeft: '4px solid var(--accent-sky)',
          borderRadius: 'var(--radius-sm)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
          }}
        >
          <div style={{ flex: 1, textAlign: 'center' }}>
            {banner.title && (
              <h3
                style={{
                  fontSize: '1.1rem',
                  fontWeight: '700',
                  marginBottom: banner.content ? '8px' : 0,
                  color: 'var(--text-main)',
                  background: 'linear-gradient(135deg, var(--accent-sky) 0%, var(--accent-lavender) 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                {banner.title}
              </h3>
            )}
            {banner.content && (
              <div
                style={{
                  fontSize: '0.95rem',
                  color: 'var(--text-sub)',
                  lineHeight: '1.6',
                }}
                dangerouslySetInnerHTML={{ __html: banner.content }}
              />
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
}
