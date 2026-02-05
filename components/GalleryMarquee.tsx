'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';

interface GalleryImage {
  id?: number;
  url: string;
  alt: string;
  category?: string;
}

interface GalleryMarqueeProps {
  images?: GalleryImage[];
}

export default function GalleryMarquee({ images }: GalleryMarqueeProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const autoScrollTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // 터치 스와이프 관련 상태
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const touchEndY = useRef<number | null>(null);

  // 로컬 무료 이미지 사용 (public/assets/images/ 폴더)
  const defaultImages: GalleryImage[] = [
    { 
      url: '/assets/images/gallery_1.png', 
      alt: '따뜻한 상담 공간' 
    },
    { 
      url: '/assets/images/gallery_2.png', 
      alt: '편안한 치료실' 
    },
    { 
      url: '/assets/images/gallery_3.png', 
      alt: '평화로운 공간' 
    },
    { 
      url: '/assets/images/gallery_4.png', 
      alt: '따뜻한 조명의 공간' 
    },
  ];

  const displayImages = images && images.length > 0 ? images : defaultImages;
  const imageCount = displayImages.length;

  // 특정 인덱스로 이동
  const goToIndex = (index: number) => {
    if (index < 0 || index >= imageCount) return;
    setCurrentIndex(index);
    if (trackRef.current) {
      const containerWidth = trackRef.current.offsetWidth;
      const scrollLeft = index * containerWidth;
      trackRef.current.scrollTo({
        left: scrollLeft,
        behavior: 'smooth'
      });
    }
  };

  // 이전 이미지로 이동
  const goToPrevious = () => {
    const newIndex = currentIndex === 0 ? imageCount - 1 : currentIndex - 1;
    goToIndex(newIndex);
  };

  // 다음 이미지로 이동
  const goToNext = () => {
    const newIndex = (currentIndex + 1) % imageCount;
    goToIndex(newIndex);
  };

  // 자동 스크롤
  useEffect(() => {
    if (isPaused || imageCount === 0) {
      if (autoScrollTimerRef.current) {
        clearInterval(autoScrollTimerRef.current);
        autoScrollTimerRef.current = null;
      }
      return;
    }

    autoScrollTimerRef.current = setInterval(() => {
      setCurrentIndex((prev) => {
        const next = (prev + 1) % imageCount;
        if (trackRef.current) {
          const containerWidth = trackRef.current.offsetWidth;
          trackRef.current.scrollTo({
            left: next * containerWidth,
            behavior: 'smooth'
          });
        }
        return next;
      });
    }, 4000); // 4초마다 자동 이동

    return () => {
      if (autoScrollTimerRef.current) {
        clearInterval(autoScrollTimerRef.current);
        autoScrollTimerRef.current = null;
      }
    };
  }, [isPaused, imageCount]);

  // 스크롤 위치에 따라 인덱스 업데이트
  useEffect(() => {
    const track = trackRef.current;
    if (!track || imageCount === 0) return;

    const handleScroll = () => {
      const containerWidth = track.offsetWidth;
      const scrollIndex = Math.round(track.scrollLeft / containerWidth);
      const actualIndex = Math.min(scrollIndex, imageCount - 1);
      if (actualIndex !== currentIndex && actualIndex >= 0) {
        setCurrentIndex(actualIndex);
      }
    };

    track.addEventListener('scroll', handleScroll);
    return () => track.removeEventListener('scroll', handleScroll);
  }, [currentIndex, imageCount]);

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
    
    const deltaX = touchStartX.current - touchEndX.current;
    const deltaY = touchStartY.current - touchEndY.current;
    const minSwipeDistance = 50; // 최소 스와이프 거리
    
    // 수평 스와이프가 수직 스와이프보다 큰 경우에만 처리
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > minSwipeDistance) {
      if (deltaX > 0) {
        // 왼쪽으로 스와이프 (다음 이미지)
        goToNext();
      } else {
        // 오른쪽으로 스와이프 (이전 이미지)
        goToPrevious();
      }
    }
    
    // 리셋
    touchStartX.current = null;
    touchStartY.current = null;
    touchEndX.current = null;
    touchEndY.current = null;
  };

  return (
    <section className="flow-section">
      <div className="flow-header">
        <h2>따뜻한 동행</h2>
        <p>밝은 햇살처럼 당신의 마음에 온기를 전합니다.</p>
      </div>

      <div 
        className="marquee-container"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* 일시정지/재생 버튼 (웹 접근성) */}
        {imageCount > 1 && (
          <button
            type="button"
            onClick={() => setIsPaused(!isPaused)}
            aria-label={isPaused ? '자동 재생 시작' : '자동 재생 일시정지'}
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              zIndex: 30,
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
              fontSize: '18px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
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

        {/* 좌우 이동 버튼 */}
        <button
          className="marquee-nav-button marquee-nav-prev"
          onClick={goToPrevious}
          aria-label="이전 이미지"
        >
          ←
        </button>
        <button
          className="marquee-nav-button marquee-nav-next"
          onClick={goToNext}
          aria-label="다음 이미지"
        >
          →
        </button>

        <div
          ref={trackRef}
          className="marquee-track"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{
            display: 'flex',
            overflowX: 'auto',
            scrollSnapType: 'x mandatory',
            scrollBehavior: 'smooth',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            touchAction: 'pan-y pinch-zoom', // 수직 스크롤과 핀치 줌은 허용
          }}
        >
          {displayImages.map((image, index) => {
            // DB에서 가져온 이미지인 경우 상세 페이지 링크 추가
            const hasDetailPage = image.id;
            const category = image.category || '기타';
            const detailUrl = hasDetailPage ? `/gallery/${encodeURIComponent(category)}/${image.id}` : null;
            
            const imageElement = (
              <img
                src={image.url}
                alt={image.alt}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  cursor: hasDetailPage ? 'pointer' : 'default',
                }}
                loading={index >= 2 ? 'lazy' : 'eager'}
              />
            );
            
            return (
              <div
                key={index}
                className="marquee-item"
                style={{
                  scrollSnapAlign: 'start',
                  flexShrink: 0,
                  width: '100%',
                  position: 'relative',
                }}
              >
                {hasDetailPage && detailUrl ? (
                  <Link
                    href={detailUrl}
                    style={{
                      display: 'block',
                      width: '100%',
                      height: '100%',
                      textDecoration: 'none',
                    }}
                  >
                    {imageElement}
                  </Link>
                ) : (
                  imageElement
                )}
              </div>
            );
          })}
        </div>

        {/* 인디케이터 (점) */}
        <div className="marquee-indicators">
          {displayImages.map((_, index) => (
            <button
              key={index}
              className={`marquee-indicator ${index === currentIndex ? 'active' : ''}`}
              onClick={() => goToIndex(index)}
              aria-label={`${index + 1}번째 이미지로 이동`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

