'use client';

import { useEffect, useState, useRef } from 'react';

interface GalleryImage {
  url: string;
  alt: string;
}

interface GalleryMarqueeProps {
  images?: GalleryImage[];
}

export default function GalleryMarquee({ images }: GalleryMarqueeProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const autoScrollTimerRef = useRef<NodeJS.Timeout | null>(null);

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
          style={{
            display: 'flex',
            overflowX: 'auto',
            scrollSnapType: 'x mandatory',
            scrollBehavior: 'smooth',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          {displayImages.map((image, index) => (
            <div
              key={index}
              className="marquee-item"
              style={{
                scrollSnapAlign: 'start',
                flexShrink: 0,
                width: '100%',
              }}
            >
              <img
                src={image.url}
                alt={image.alt}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
                loading={index >= 2 ? 'lazy' : 'eager'}
              />
            </div>
          ))}
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

