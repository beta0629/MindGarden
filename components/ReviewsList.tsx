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
      padding: '5rem 0',
      background: 'linear-gradient(135deg, rgba(168, 213, 186, 0.08) 0%, rgba(184, 212, 227, 0.12) 50%, rgba(200, 180, 255, 0.08) 100%)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* 배경 장식 요소 */}
      <div style={{
        position: 'absolute',
        top: '-50%',
        right: '-10%',
        width: '600px',
        height: '600px',
        background: 'radial-gradient(circle, rgba(168, 213, 186, 0.15) 0%, transparent 70%)',
        borderRadius: '50%',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-30%',
        left: '-5%',
        width: '500px',
        height: '500px',
        background: 'radial-gradient(circle, rgba(184, 212, 227, 0.12) 0%, transparent 70%)',
        borderRadius: '50%',
        pointerEvents: 'none',
      }} />

      {/* 헤더 */}
      <div style={{
        textAlign: 'center',
        marginBottom: '4rem',
        position: 'relative',
        zIndex: 1,
      }}>
        <div style={{
          display: 'inline-block',
          padding: '0.5rem 2rem',
          background: 'linear-gradient(135deg, var(--accent-sky) 0%, var(--accent-mint) 100%)',
          borderRadius: '50px',
          marginBottom: '1.5rem',
          boxShadow: '0 4px 20px rgba(168, 213, 186, 0.3)',
        }}>
          <span style={{
            fontSize: '0.875rem',
            fontWeight: '700',
            color: 'white',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
          }}>
            ✨ 실시간 후기
          </span>
        </div>
        <h2 className="section-title" style={{
          fontSize: '3rem',
          fontWeight: '800',
          background: 'linear-gradient(135deg, var(--accent-sky) 0%, var(--accent-lavender) 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          marginBottom: '1rem',
          textShadow: '0 2px 10px rgba(168, 213, 186, 0.2)',
          lineHeight: '1.2',
        }}>
          이용자 후기
        </h2>
        <p className="section-desc" style={{
          marginBottom: '2rem',
          fontSize: '1.125rem',
          color: 'var(--text-main)',
          fontWeight: '500',
        }}>
          마인드가든을 이용하신 분들의 소중한 후기입니다
        </p>
        <Link
          href="/reviews"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.875rem 2rem',
            fontSize: '1rem',
            color: 'white',
            textDecoration: 'none',
            fontWeight: '600',
            background: 'linear-gradient(135deg, var(--accent-sky) 0%, var(--accent-mint) 100%)',
            borderRadius: 'var(--radius-md)',
            transition: 'all 0.3s ease',
            boxShadow: '0 4px 15px rgba(168, 213, 186, 0.4)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 20px rgba(168, 213, 186, 0.5)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 15px rgba(168, 213, 186, 0.4)';
          }}
        >
          전체 후기 보기
          <span style={{ fontSize: '1.2rem' }}>→</span>
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
          gap: '2rem',
          overflowX: 'auto',
          overflowY: 'hidden',
          scrollBehavior: 'auto',
          cursor: isDragging ? 'grabbing' : 'grab',
          padding: '2rem 0',
          margin: '0 -2rem',
          paddingLeft: '2rem',
          paddingRight: '2rem',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'thin',
          scrollbarColor: 'var(--accent-sky) transparent',
          position: 'relative',
          zIndex: 1,
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
              width: '360px',
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
                backgroundColor: 'white',
                borderRadius: 'var(--radius-lg)',
                padding: '2rem',
                boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08)',
                border: '2px solid transparent',
                backgroundImage: 'linear-gradient(white, white), linear-gradient(135deg, var(--accent-sky), var(--accent-mint))',
                backgroundOrigin: 'border-box',
                backgroundClip: 'padding-box, border-box',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: isDragging ? 'none' : 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                cursor: isDragging ? 'grabbing' : 'pointer',
                userSelect: 'none',
                position: 'relative',
                overflow: 'hidden',
              }}
              onMouseEnter={(e) => {
                if (!isDragging) {
                  e.currentTarget.style.transform = 'translateY(-8px) scale(1.02)';
                  e.currentTarget.style.boxShadow = '0 16px 40px rgba(168, 213, 186, 0.25), 0 4px 12px rgba(0, 0, 0, 0.15)';
                  e.currentTarget.style.borderImage = 'linear-gradient(135deg, var(--accent-sky), var(--accent-mint)) 1';
                }
              }}
              onMouseLeave={(e) => {
                if (!isDragging) {
                  e.currentTarget.style.transform = 'translateY(0) scale(1)';
                  e.currentTarget.style.boxShadow = '0 8px 30px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08)';
                }
              }}
            >
              {/* 카드 상단 장식 */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '4px',
                background: 'linear-gradient(90deg, var(--accent-sky) 0%, var(--accent-mint) 100%)',
              }} />
              {/* 작성자 정보 */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '1.5rem',
                paddingTop: '0.5rem',
                paddingBottom: '1rem',
                borderBottom: '2px solid rgba(168, 213, 186, 0.2)',
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    marginBottom: '0.5rem',
                  }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, var(--accent-sky) 0%, var(--accent-mint) 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.25rem',
                      fontWeight: '700',
                      color: 'white',
                      boxShadow: '0 4px 12px rgba(168, 213, 186, 0.3)',
                    }}>
                      {review.authorName.charAt(0)}
                    </div>
                    <div>
                      <div style={{
                        fontSize: '1.125rem',
                        fontWeight: '700',
                        color: 'var(--text-main)',
                        marginBottom: '0.25rem',
                      }}>
                        {review.authorName}
                      </div>
                      <div style={{
                        fontSize: '0.8rem',
                        color: 'var(--text-sub)',
                      }}>
                        {new Date(review.createdAt).toLocaleDateString('ko-KR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </div>
                    </div>
                  </div>
                </div>
                {review.ratings && review.ratings.overall && review.ratings.overall > 0 && (
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.25rem',
                    padding: '0.5rem',
                    background: 'linear-gradient(135deg, rgba(168, 213, 186, 0.1) 0%, rgba(184, 212, 227, 0.1) 100%)',
                    borderRadius: 'var(--radius-md)',
                  }}>
                    <div style={{
                      fontSize: '1.5rem',
                      lineHeight: '1',
                    }}>
                      {'❤️'.repeat(review.ratings.overall)}
                    </div>
                    <div style={{
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      color: 'var(--accent-sky)',
                    }}>
                      {review.ratings.overall}/5
                    </div>
                  </div>
                )}
              </div>

              {/* 해시태그 */}
              {review.tags && review.tags.length > 0 && (
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '0.5rem',
                  marginBottom: '1.25rem',
                }}>
                  {review.tags.slice(0, 3).map((tag, idx) => (
                    <span
                      key={idx}
                      style={{
                        padding: '6px 12px',
                        background: 'linear-gradient(135deg, rgba(168, 213, 186, 0.2) 0%, rgba(184, 212, 227, 0.2) 100%)',
                        color: 'var(--accent-sky)',
                        borderRadius: '20px',
                        fontSize: '0.8rem',
                        fontWeight: '600',
                        border: '1px solid rgba(168, 213, 186, 0.3)',
                        boxShadow: '0 2px 4px rgba(168, 213, 186, 0.1)',
                      }}
                    >
                      #{tag}
                    </span>
                  ))}
                  {review.tags.length > 3 && (
                    <span style={{
                      padding: '6px 12px',
                      color: 'var(--text-sub)',
                      fontSize: '0.8rem',
                      fontWeight: '500',
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
                  lineHeight: '1.8',
                  fontSize: '0.95rem',
                  marginBottom: '1.5rem',
                  overflow: 'hidden',
                  display: '-webkit-box',
                  WebkitLineClamp: 4,
                  WebkitBoxOrient: 'vertical',
                  fontWeight: '400',
                }}
              >
                {getPreviewText(review.content)}
              </div>

              {/* 하단 정보 */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingTop: '1rem',
                borderTop: '2px solid rgba(168, 213, 186, 0.15)',
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 1rem',
                  background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(255, 182, 193, 0.1) 100%)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  color: '#ef4444',
                }}>
                  <span style={{ fontSize: '1.1rem' }}>❤️</span>
                  <span>{review.likeCount || 0}</span>
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 1rem',
                  background: 'linear-gradient(135deg, var(--accent-sky) 0%, var(--accent-mint) 100%)',
                  borderRadius: 'var(--radius-md)',
                  color: 'white',
                  fontWeight: '600',
                  fontSize: '0.9rem',
                  boxShadow: '0 2px 8px rgba(168, 213, 186, 0.3)',
                }}>
                  <span>자세히 보기</span>
                  <span style={{ fontSize: '1.1rem' }}>→</span>
                </div>
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
