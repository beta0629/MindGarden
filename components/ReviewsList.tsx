'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

interface Review {
  id: number;
  authorName: string;
  content: string;
  tags?: string[];
  ratings?: {
    professionalism?: number;
    kindness?: number;
    effectiveness?: number;
    facility?: number;
    overall?: number;
  };
  likeCount?: number;
  createdAt: string;
}

interface ReviewsListProps {
  reviews: Review[];
}

export default function ReviewsList({ reviews }: ReviewsListProps) {
  const [isPaused, setIsPaused] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);
  const lastScrollTime = useRef<number>(Date.now());

  // HTML 콘텐츠에서 텍스트만 추출 (미리보기용)
  const getPreviewText = (content: string, maxLength: number = 150) => {
    const text = content.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  // 무한 롤링 애니메이션
  useEffect(() => {
    if (!containerRef.current || reviews.length === 0 || isPaused || isDragging) return;

    const container = containerRef.current;
    const scrollSpeed = 0.5; // 픽셀/프레임

    const animate = () => {
      if (isPaused || isDragging) return;
      
      const now = Date.now();
      // 사용자가 직접 스크롤한 경우 일시 정지
      if (now - lastScrollTime.current < 100) {
        animationRef.current = requestAnimationFrame(animate);
        return;
      }

      container.scrollLeft += scrollSpeed;

      // 끝에 도달하면 처음으로 순환
      if (container.scrollLeft >= container.scrollWidth - container.clientWidth) {
        container.scrollLeft = 0;
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [reviews.length, isPaused, isDragging]);

  // 마우스 드래그 시작
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - containerRef.current.offsetLeft);
    setScrollLeft(containerRef.current.scrollLeft);
    lastScrollTime.current = Date.now();
  };

  // 마우스 드래그 중
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    e.preventDefault();
    const x = e.pageX - containerRef.current.offsetLeft;
    const walk = (x - startX) * 2; // 스크롤 속도 조절
    containerRef.current.scrollLeft = scrollLeft - walk;
    lastScrollTime.current = Date.now();
  };

  // 마우스 드래그 종료
  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // 마우스 떠남
  const handleMouseLeave = () => {
    setIsDragging(false);
    setIsPaused(false);
  };

  // 터치 이벤트 처리
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const touchScrollLeft = useRef<number>(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!containerRef.current) return;
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    touchScrollLeft.current = containerRef.current.scrollLeft;
    setIsPaused(true);
    lastScrollTime.current = Date.now();
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!containerRef.current || touchStartX.current === null || touchStartY.current === null) return;
    
    const deltaX = e.touches[0].clientX - touchStartX.current;
    const deltaY = e.touches[0].clientY - touchStartY.current;
    
    // 수평 스와이프인 경우에만 처리
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      e.preventDefault();
      containerRef.current.scrollLeft = touchScrollLeft.current - deltaX;
      lastScrollTime.current = Date.now();
    }
  };

  const handleTouchEnd = () => {
    touchStartX.current = null;
    touchStartY.current = null;
    setIsPaused(false);
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

  return (
    <div style={{
      padding: '2rem 0',
    }}>
      {/* 헤더 */}
      <div style={{
        textAlign: 'center',
        marginBottom: '3rem',
      }}>
        <h2 className="section-title" style={{
          background: 'linear-gradient(135deg, var(--accent-sky) 0%, var(--accent-lavender) 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}>
          이용자 후기
        </h2>
        <p className="section-desc" style={{ marginBottom: '1rem' }}>
          마인드가든을 이용하신 분들의 소중한 후기입니다
        </p>
        <Link
          href="/reviews"
          style={{
            display: 'inline-block',
            fontSize: '0.9rem',
            color: 'var(--accent-sky)',
            textDecoration: 'none',
            fontWeight: '600',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.textDecoration = 'underline';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.textDecoration = 'none';
          }}
        >
          전체 후기 보기 →
        </Link>
      </div>

      {/* 후기 롤링 컨테이너 */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onMouseEnter={() => setIsPaused(true)}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          display: 'flex',
          gap: '1.5rem',
          overflowX: 'auto',
          overflowY: 'hidden',
          scrollBehavior: 'auto',
          cursor: isDragging ? 'grabbing' : 'grab',
          padding: '1rem 0',
          margin: '0 -1rem',
          paddingLeft: '1rem',
          paddingRight: '1rem',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'thin',
          scrollbarColor: 'var(--accent-sky) transparent',
        }}
        onScroll={() => {
          lastScrollTime.current = Date.now();
        }}
      >
        {/* 후기 카드들을 두 번 반복하여 무한 롤링 효과 */}
        {[...reviews, ...reviews].map((review, index) => (
          <Link
            key={`${review.id}-${index}`}
            href={`/reviews#review-${review.id}`}
            style={{
              textDecoration: 'none',
              color: 'inherit',
              display: 'block',
              flexShrink: 0,
              width: '320px',
            }}
            onClick={(e) => {
              // 드래그 중일 때는 링크 클릭 방지
              if (isDragging) {
                e.preventDefault();
              }
            }}
          >
            <div
              style={{
                backgroundColor: 'var(--surface-0)',
                borderRadius: 'var(--radius-md)',
                padding: '1.5rem',
                boxShadow: 'var(--shadow-1)',
                border: '1px solid var(--border-soft)',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: isDragging ? 'none' : 'all 0.3s ease',
                cursor: isDragging ? 'grabbing' : 'pointer',
                userSelect: 'none',
              }}
              onMouseEnter={(e) => {
                if (!isDragging) {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-2)';
                  e.currentTarget.style.borderColor = 'var(--accent-sky)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isDragging) {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-1)';
                  e.currentTarget.style.borderColor = 'var(--border-soft)';
                }
              }}
            >
              {/* 작성자 정보 */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1rem',
                paddingBottom: '0.75rem',
                borderBottom: '1px solid var(--border-soft)',
              }}>
                <div>
                  <div style={{
                    fontSize: '1rem',
                    fontWeight: '700',
                    color: 'var(--text-main)',
                    marginBottom: '0.25rem',
                  }}>
                    {review.authorName}
                  </div>
                  <div style={{
                    fontSize: '0.75rem',
                    color: 'var(--text-sub)',
                  }}>
                    {new Date(review.createdAt).toLocaleDateString('ko-KR', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </div>
                </div>
                {review.ratings && review.ratings.overall && review.ratings.overall > 0 && (
                  <div style={{
                    fontSize: '1.25rem',
                    color: 'var(--accent-sky)',
                  }}>
                    {'⭐'.repeat(review.ratings.overall)}
                  </div>
                )}
              </div>

              {/* 해시태그 */}
              {review.tags && review.tags.length > 0 && (
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '0.5rem',
                  marginBottom: '1rem',
                }}>
                  {review.tags.slice(0, 3).map((tag, idx) => (
                    <span
                      key={idx}
                      style={{
                        padding: '4px 8px',
                        backgroundColor: 'rgba(168, 213, 186, 0.15)',
                        color: 'var(--accent-sky)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.75rem',
                        fontWeight: '500',
                      }}
                    >
                      #{tag}
                    </span>
                  ))}
                  {review.tags.length > 3 && (
                    <span style={{
                      padding: '4px 8px',
                      color: 'var(--text-sub)',
                      fontSize: '0.75rem',
                    }}>
                      +{review.tags.length - 3}
                    </span>
                  )}
                </div>
              )}

              {/* 후기 내용 미리보기 */}
              <div
                style={{
                  flex: 1,
                  color: 'var(--text-main)',
                  lineHeight: '1.6',
                  fontSize: '0.9rem',
                  marginBottom: '1rem',
                  overflow: 'hidden',
                  display: '-webkit-box',
                  WebkitLineClamp: 4,
                  WebkitBoxOrient: 'vertical',
                }}
              >
                {getPreviewText(review.content)}
              </div>

              {/* 하단 정보 */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingTop: '0.75rem',
                borderTop: '1px solid var(--border-soft)',
                fontSize: '0.85rem',
                color: 'var(--text-sub)',
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}>
                  <span>❤️</span>
                  <span>{review.likeCount || 0}</span>
                </div>
                <span style={{
                  color: 'var(--accent-sky)',
                  fontWeight: '600',
                }}>
                  자세히 보기 →
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* 스크롤바 스타일 */}
      <style jsx>{`
        div::-webkit-scrollbar {
          height: 8px;
        }
        div::-webkit-scrollbar-track {
          background: var(--bg-light);
          border-radius: 4px;
        }
        div::-webkit-scrollbar-thumb {
          background: var(--accent-sky);
          border-radius: 4px;
        }
        div::-webkit-scrollbar-thumb:hover {
          background: var(--accent-mint);
        }
      `}</style>

      {/* 더보기 버튼 */}
      {reviews.length >= 20 && (
        <div style={{
          textAlign: 'center',
          marginTop: '3rem',
        }}>
          <Link
            href="/reviews"
            style={{
              display: 'inline-block',
              padding: '0.75rem 2rem',
              background: 'linear-gradient(135deg, var(--accent-sky) 0%, var(--accent-mint) 100%)',
              color: 'var(--text-main)',
              textDecoration: 'none',
              borderRadius: 'var(--radius-sm)',
              fontSize: '1rem',
              fontWeight: '600',
              transition: 'all 0.2s',
              boxShadow: 'var(--shadow-1)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = 'var(--shadow-2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'var(--shadow-1)';
            }}
          >
            전체 후기 보기
          </Link>
        </div>
      )}
    </div>
  );
}
