'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

interface Review {
  id: number;
  authorName: string;
  content: string;
  createdAt: string;
}

interface ReviewsCarouselProps {
  reviews: Review[];
}

export default function ReviewsCarousel({ reviews }: ReviewsCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // 자동 롤링 (5초마다)
  useEffect(() => {
    if (reviews.length === 0) return;

    if (isAutoPlaying) {
      intervalRef.current = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % reviews.length);
      }, 5000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [reviews.length, isAutoPlaying]);

  // 마우스 호버 시 자동 재생 일시 정지
  const handleMouseEnter = () => {
    setIsAutoPlaying(false);
  };

  const handleMouseLeave = () => {
    setIsAutoPlaying(true);
  };

  // HTML 콘텐츠에서 이미지 추출 및 리사이징
  const processContent = (content: string) => {
    // base64 이미지를 찾아서 최적화된 크기로 표시
    const processedContent = content.replace(
      /<img([^>]*?)src="(data:image\/[^;]+;base64,[^"]+)"([^>]*?)>/gi,
      (match, before, src, after) => {
        // 이미지에 스타일 추가 (반응형 및 최적화)
        const styleMatch = before.match(/style="([^"]*)"/i) || after.match(/style="([^"]*)"/i);
        const existingStyle = styleMatch ? styleMatch[1] : '';
        const newStyle = `max-width: 100%; height: auto; border-radius: var(--radius-sm); margin: 12px 0; ${existingStyle}`;
        
        // style 속성이 이미 있으면 업데이트, 없으면 추가
        if (before.includes('style=') || after.includes('style=')) {
          return match.replace(/style="[^"]*"/i, `style="${newStyle}"`);
        } else {
          return `<img${before} style="${newStyle}" src="${src}"${after}>`;
        }
      }
    );
    return processedContent;
  };

  if (reviews.length === 0) {
    return (
      <div style={{
        padding: '4rem 0',
        textAlign: 'center',
        color: 'var(--text-sub)',
      }}>
        <p>등록된 후기가 없습니다.</p>
        <Link
          href="/reviews/new"
          style={{
            display: 'inline-block',
            marginTop: '1rem',
            padding: '0.75rem 1.5rem',
            background: 'linear-gradient(135deg, var(--accent-sky) 0%, var(--accent-mint) 100%)',
            color: 'var(--text-main)',
            textDecoration: 'none',
            borderRadius: 'var(--radius-sm)',
            fontWeight: '600',
            transition: 'all 0.2s',
          }}
        >
          첫 후기 작성하기
        </Link>
      </div>
    );
  }

  const currentReview = reviews[currentIndex];

  return (
    <div
      className="reviews-carousel"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        position: 'relative',
        padding: '4rem 0',
        background: 'linear-gradient(135deg, var(--bg-pastel-1) 0%, var(--bg-pastel-2) 100%)',
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
      }}
    >
      {/* 헤더 */}
      <div style={{
        textAlign: 'center',
        marginBottom: '3rem',
        padding: '0 2rem',
      }}>
        <h2 className="section-title" style={{
          background: 'linear-gradient(135deg, var(--accent-sky) 0%, var(--accent-lavender) 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}>
          이용자 후기
        </h2>
        <p className="section-desc" style={{ marginBottom: '0' }}>
          마인드가든을 이용하신 분들의 소중한 후기입니다
        </p>
        <Link
          href="/reviews"
          style={{
            display: 'inline-block',
            marginTop: '1rem',
            fontSize: '0.9rem',
            color: 'var(--accent-sky)',
            textDecoration: 'none',
            fontWeight: '600',
          }}
        >
          전체 후기 보기 →
        </Link>
      </div>

      {/* 후기 카드 */}
      <div style={{
        maxWidth: '900px',
        margin: '0 auto',
        padding: '0 2rem',
      }}>
        <div
          key={currentReview.id}
          style={{
            backgroundColor: 'var(--surface-0)',
            borderRadius: 'var(--radius-md)',
            padding: '2.5rem',
            boxShadow: 'var(--shadow-2)',
            border: '1px solid var(--border-soft)',
            minHeight: '300px',
            display: 'flex',
            flexDirection: 'column',
            animation: 'fadeInUp 0.5s ease',
          }}
        >
          {/* 작성자 정보 */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.5rem',
            paddingBottom: '1rem',
            borderBottom: '1px solid var(--border-soft)',
          }}>
            <div>
              <div style={{
                fontSize: '1.125rem',
                fontWeight: '700',
                color: 'var(--text-main)',
                marginBottom: '0.25rem',
              }}>
                {currentReview.authorName}
              </div>
              <div style={{
                fontSize: '0.875rem',
                color: 'var(--text-sub)',
              }}>
                {new Date(currentReview.createdAt).toLocaleDateString('ko-KR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </div>
            </div>
            <div style={{
              fontSize: '1.5rem',
              color: 'var(--accent-sky)',
            }}>
              ⭐
            </div>
          </div>

          {/* 후기 내용 */}
          <div
            style={{
              flex: 1,
              color: 'var(--text-main)',
              lineHeight: '1.8',
              fontSize: '1rem',
            }}
            dangerouslySetInnerHTML={{
              __html: processContent(currentReview.content),
            }}
          />
        </div>
      </div>

      {/* 네비게이션 도트 */}
      {reviews.length > 1 && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '0.5rem',
          marginTop: '2rem',
        }}>
          {reviews.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                setCurrentIndex(index);
                setIsAutoPlaying(false);
                setTimeout(() => setIsAutoPlaying(true), 3000);
              }}
              style={{
                width: index === currentIndex ? '24px' : '8px',
                height: '8px',
                borderRadius: '4px',
                border: 'none',
                backgroundColor: index === currentIndex
                  ? 'var(--accent-sky)'
                  : 'rgba(184, 212, 227, 0.4)',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
              }}
              aria-label={`후기 ${index + 1}로 이동`}
            />
          ))}
        </div>
      )}

      {/* 이전/다음 버튼 */}
      {reviews.length > 1 && (
        <>
          <button
            onClick={() => {
              setCurrentIndex((prev) => (prev - 1 + reviews.length) % reviews.length);
              setIsAutoPlaying(false);
              setTimeout(() => setIsAutoPlaying(true), 3000);
            }}
            style={{
              position: 'absolute',
              left: '1rem',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              border: 'none',
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              color: 'var(--text-main)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem',
              boxShadow: 'var(--shadow-1)',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--surface-0)';
              e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
              e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
            }}
            aria-label="이전 후기"
          >
            ‹
          </button>
          <button
            onClick={() => {
              setCurrentIndex((prev) => (prev + 1) % reviews.length);
              setIsAutoPlaying(false);
              setTimeout(() => setIsAutoPlaying(true), 3000);
            }}
            style={{
              position: 'absolute',
              right: '1rem',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              border: 'none',
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              color: 'var(--text-main)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem',
              boxShadow: 'var(--shadow-1)',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--surface-0)';
              e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
              e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
            }}
            aria-label="다음 후기"
          >
            ›
          </button>
        </>
      )}

      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
