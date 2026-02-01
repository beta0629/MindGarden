'use client';

import { useState, useEffect, useRef } from 'react';

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
  const [isPaused, setIsPaused] = useState(false);
  const autoScrollTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 특정 인덱스로 이동
  const goToIndex = (index: number) => {
    if (index < 0 || index >= banners.length) return;
    setCurrentIndex(index);
  };

  // 이전 배너로 이동
  const goToPrevious = () => {
    const newIndex = currentIndex === 0 ? banners.length - 1 : currentIndex - 1;
    goToIndex(newIndex);
  };

  // 다음 배너로 이동
  const goToNext = () => {
    const newIndex = (currentIndex + 1) % banners.length;
    goToIndex(newIndex);
  };

  // 자동 스크롤
  useEffect(() => {
    if (isPaused || banners.length <= 1) {
      if (autoScrollTimerRef.current) {
        clearInterval(autoScrollTimerRef.current);
        autoScrollTimerRef.current = null;
      }
      return;
    }

    autoScrollTimerRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 5000); // 5초마다 전환

    return () => {
      if (autoScrollTimerRef.current) {
        clearInterval(autoScrollTimerRef.current);
        autoScrollTimerRef.current = null;
      }
    };
  }, [isPaused, banners.length]);

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
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* 이전 버튼 */}
      {banners.length > 1 && (
        <button
          type="button"
          onClick={goToPrevious}
          style={{
            position: 'absolute',
            left: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            border: 'none',
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            color: 'var(--text-main)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px',
            fontWeight: 'bold',
            zIndex: 20,
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            setIsPaused(true);
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 1)';
            e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)';
          }}
          onMouseLeave={(e) => {
            setIsPaused(false);
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
            e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
          }}
          aria-label="이전 배너"
        >
          ‹
        </button>
      )}

      {/* 배너 콘텐츠 */}
      <div
        key={currentBanner.id}
        className="banner-item"
        style={{
          opacity: 1,
          animation: 'bannerFadeIn 0.5s ease-in-out',
        }}
      >
        {content}
      </div>

      {/* 다음 버튼 */}
      {banners.length > 1 && (
        <button
          type="button"
          onClick={goToNext}
          style={{
            position: 'absolute',
            right: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            border: 'none',
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            color: 'var(--text-main)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px',
            fontWeight: 'bold',
            zIndex: 20,
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            setIsPaused(true);
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 1)';
            e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)';
          }}
          onMouseLeave={(e) => {
            setIsPaused(false);
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
            e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
          }}
          aria-label="다음 배너"
        >
          ›
        </button>
      )}

      {/* 인디케이터 점 */}
      {banners.length > 1 && (
        <div
          style={{
            position: 'absolute',
            bottom: '12px',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: '8px',
            zIndex: 20,
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            padding: '6px 12px',
            borderRadius: '20px',
            backdropFilter: 'blur(8px)',
          }}
        >
          {banners.map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => goToIndex(index)}
              style={{
                width: index === currentIndex ? '24px' : '8px',
                height: '8px',
                borderRadius: '4px',
                border: 'none',
                backgroundColor: index === currentIndex ? 'var(--accent-sky)' : 'rgba(0, 0, 0, 0.3)',
                cursor: 'pointer',
                transition: 'all 0.3s',
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
          padding: '8px 0 40px 0', // 하단 패딩 추가 (인디케이터 공간 확보)
        }}
      >
        <img
          src={banner.imageUrl || ''}
          alt={banner.title || '배너'}
          style={{
            maxHeight: '120px',
            maxWidth: '100%',
            width: '100%',
            height: 'auto',
            objectFit: 'contain',
            display: 'block',
          }}
          onError={(e) => {
            console.error('Banner image load error:', banner.imageUrl, e);
            // 이미지 로드 실패 시 숨김 처리
            e.currentTarget.style.display = 'none';
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
          padding: '12px 20px 40px 20px', // 하단 패딩 추가 (인디케이터 공간 확보)
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
          onError={(e) => {
            console.error('Banner image load error (with text):', banner.imageUrl, e);
            // 이미지 로드 실패 시 숨김 처리
            e.currentTarget.style.display = 'none';
          }}
          onLoad={() => {
            console.log('Banner image loaded successfully:', banner.imageUrl);
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
          padding: '16px 24px 40px 24px', // 하단 패딩 추가 (인디케이터 공간 확보)
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
