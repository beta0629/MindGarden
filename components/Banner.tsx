'use client';

import { useState, useEffect, useRef } from 'react';

// 모바일 감지 훅
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
}

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
  const [isVisible, setIsVisible] = useState(true);
  const autoScrollTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isMobile = useIsMobile();
  
  // 터치 스와이프 관련 상태
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const touchEndY = useRef<number | null>(null);
  
  // 스크롤 감지하여 배너 숨기기 (현재 세션 동안만)
  useEffect(() => {
    let lastScrollY = window.scrollY;
    let scrollTimeout: NodeJS.Timeout | null = null;
    
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // 아래로 스크롤하면 배너 숨기기
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        if (scrollTimeout) clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
          setIsVisible(false);
        }, 300); // 300ms 지연 후 숨김
      }
      
      lastScrollY = currentScrollY;
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimeout) clearTimeout(scrollTimeout);
    };
  }, []);
  
  // 배너 닫기 핸들러 (현재 세션 동안만 숨김, 새로고침하면 다시 표시)
  const handleClose = () => {
    setIsVisible(false);
  };

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

  // 터치 스와이프 핸들러
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
    touchEndY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current || !touchStartY.current || !touchEndY.current) return;
    if (banners.length <= 1) return;
    
    const deltaX = touchStartX.current - touchEndX.current;
    const deltaY = touchStartY.current - touchEndY.current;
    const minSwipeDistance = 50; // 최소 스와이프 거리
    
    // 수평 스와이프가 수직 스와이프보다 큰 경우에만 처리
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > minSwipeDistance) {
      if (deltaX > 0) {
        // 왼쪽으로 스와이프 (다음 배너)
        goToNext();
      } else {
        // 오른쪽으로 스와이프 (이전 배너)
        goToPrevious();
      }
    }
    
    // 리셋
    touchStartX.current = null;
    touchStartY.current = null;
    touchEndX.current = null;
    touchEndY.current = null;
  };

  if (banners.length === 0 || !isVisible) {
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
        backgroundColor: '#B8956A',
        borderBottom: '1px solid rgba(184, 149, 106, 0.3)',
        position: 'relative',
        overflow: 'hidden',
        height: '152px', // 고정 높이 설정
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* 닫기 버튼 */}
      <button
        type="button"
        onClick={handleClose}
        aria-label="배너 닫기"
        style={{
          position: 'absolute',
          top: isMobile ? '8px' : '12px',
          right: isMobile ? '8px' : '12px',
          width: isMobile ? '28px' : '32px',
          height: isMobile ? '28px' : '32px',
          borderRadius: '50%',
          border: 'none',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          color: 'var(--white)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: isMobile ? '16px' : '18px',
          fontWeight: 'bold',
          zIndex: 30,
          transition: 'all 0.2s',
          lineHeight: 1,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
          e.currentTarget.style.transform = 'scale(1.1)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
          e.currentTarget.style.transform = 'scale(1)';
        }}
      >
        ×
      </button>
      {/* 이전 버튼 */}
      {banners.length > 1 && (
        <button
          type="button"
          onClick={goToPrevious}
          style={{
            position: 'absolute',
            left: isMobile ? '8px' : '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            width: isMobile ? '32px' : '40px',
            height: isMobile ? '32px' : '40px',
            borderRadius: '50%',
            border: 'none',
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            color: 'var(--text-main)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: isMobile ? '18px' : '20px',
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
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
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
            right: isMobile ? '8px' : '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            width: isMobile ? '32px' : '40px',
            height: isMobile ? '32px' : '40px',
            borderRadius: '50%',
            border: 'none',
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            color: 'var(--text-main)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: isMobile ? '18px' : '20px',
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

      {/* 일시정지/재생 버튼 (웹 접근성) */}
      {banners.length > 1 && (
        <button
          type="button"
          onClick={() => setIsPaused(!isPaused)}
          aria-label={isPaused ? '배너 자동 재생 시작' : '배너 자동 재생 일시정지'}
          style={{
            position: 'absolute',
            bottom: isMobile ? '60px' : '50px',
            right: isMobile ? '8px' : '12px',
            zIndex: 30,
            width: isMobile ? '32px' : '40px',
            height: isMobile ? '32px' : '40px',
            borderRadius: '50%',
            border: 'none',
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            color: 'var(--text-main)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: isMobile ? '14px' : '18px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            setIsPaused(true);
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 1)';
            e.currentTarget.style.transform = 'scale(1.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          {isPaused ? '▶' : '⏸'}
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
  const isMobile = useIsMobile();

  // 이미지만 있을 때
  if (hasImage && !banner.title && !banner.content) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '152px', // 고정 높이
          padding: '8px 16px',
          boxSizing: 'border-box',
        }}
      >
        <img
          src={banner.imageUrl || ''}
          alt={banner.title || '배너'}
          style={{
            maxHeight: '136px', // 152px - 16px (상하 패딩)
            maxWidth: '100%',
            width: 'auto',
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
          flexDirection: isMobile ? 'column' : 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: isMobile ? '12px' : '16px',
          padding: isMobile ? '12px 16px 40px 16px' : '12px 20px 40px 20px',
          maxWidth: '1200px',
          margin: '0 auto',
          width: '100%',
          height: '152px', // 고정 높이
          boxSizing: 'border-box',
        }}
      >
        <div
          style={{
            width: isMobile ? '100%' : '400px',
            height: '136px', // 고정 높이 (152px - 16px 패딩)
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <img
            src={banner.imageUrl || ''}
            alt={banner.title || '배너'}
            style={{
              maxHeight: '136px',
              maxWidth: '100%',
              width: 'auto',
              height: 'auto',
              objectFit: 'contain',
              display: 'block',
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
        </div>
        <div style={{ 
          flex: 1, 
          textAlign: isMobile ? 'center' : 'left',
          width: isMobile ? '100%' : 'auto',
        }}>
          {banner.title && (
            <h3 style={{
              fontSize: isMobile ? '0.9rem' : '1rem',
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
                fontSize: isMobile ? '0.85rem' : '0.9rem',
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
          width: '100%',
          height: '152px', // 고정 높이
          boxSizing: 'border-box',
          background: 'linear-gradient(135deg, rgba(248, 245, 240, 0.8) 0%, rgba(254, 249, 243, 0.8) 100%)',
          borderLeft: '4px solid var(--accent-sky)',
          borderRadius: 'var(--radius-sm)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
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
                  fontSize: isMobile ? '0.85rem' : '0.95rem',
                  color: 'var(--text-sub)',
                  lineHeight: '1.6',
                }}
                dangerouslySetInnerHTML={{ 
                  __html: banner.content.replace(
                    /<img([^>]*?)src="([^"]+)"([^>]*?)>/gi,
                    (match, before, src, after) => {
                      const styleMatch = before.match(/style="([^"]*)"/i) || after.match(/style="([^"]*)"/i);
                      const existingStyle = styleMatch ? styleMatch[1] : '';
                      const newStyle = `max-width: 100%; height: auto; ${existingStyle}`;
                      
                      if (before.includes('style=') || after.includes('style=')) {
                        return match.replace(/style="[^"]*"/i, `style="${newStyle}"`);
                      } else {
                        return `<img${before} style="${newStyle}" src="${src}"${after}>`;
                      }
                    }
                  )
                }}
              />
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
}
