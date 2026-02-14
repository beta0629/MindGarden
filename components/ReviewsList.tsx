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

interface ReviewStats {
  totalReviews: number;
  tagCounts: Array<{ tag: string; count: number }>;
  ratingStats: Record<string, { sum: number; count: number; average: number }>;
}

export default function ReviewsList({ reviews }: ReviewsListProps) {
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [bestReview, setBestReview] = useState<Review | null>(null);
  const [latestReviews, setLatestReviews] = useState<Review[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);
  const lastScrollTime = useRef<number>(Date.now());
  const isAutoScrolling = useRef<boolean>(false);

  // HTML 콘텐츠에서 텍스트만 추출
  const getPreviewText = (content: string, maxLength: number = 150) => {
    const text = content.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  // 재미있는 랜덤 이름 생성 (후기 ID 기반으로 결정적 랜덤)
  const getRandomName = (reviewId: number) => {
    const names = [
      '마음이 따뜻한 분',
      '긍정 에너지',
      '희망의 별',
      '소중한 고객님',
      '따뜻한 마음',
      '행복한 하루',
      '밝은 에너지',
      '감사한 분',
      '따뜻한 인연',
      '소중한 인연',
      '마음의 힐링',
      '평화로운 마음',
      '따뜻한 이야기',
      '희망의 메시지',
      '긍정의 힘',
      '마음의 여행자',
      '따뜻한 손길',
      '소중한 경험',
      '행복한 순간',
      '감사한 마음',
      '밝은 미래',
      '따뜻한 하루',
      '소중한 기억',
      '희망의 등불',
      '마음의 평화',
    ];
    
    // 후기 ID를 기반으로 결정적 랜덤 선택 (같은 후기는 항상 같은 이름)
    const index = reviewId % names.length;
    return names[index];
  };

  // 통계 데이터 로드
  useEffect(() => {
    const loadStats = async () => {
      try {
        const response = await fetch('/api/reviews/stats');
        const data = await response.json();
        if (data.success) {
          setStats(data.stats);
        }
      } catch (err) {
        console.error('Load stats error:', err);
      }
    };
    loadStats();
  }, []);

  // 베스트 후기 및 최신 후기 설정
  useEffect(() => {
    if (reviews.length === 0) return;

    // 베스트 후기: overall 점수가 가장 높거나, 없으면 좋아요 수가 가장 많은 것
    const best = [...reviews].sort((a, b) => {
      const aScore = a.ratings?.overall || 0;
      const bScore = b.ratings?.overall || 0;
      if (aScore !== bScore) return bScore - aScore;
      return (b.likeCount || 0) - (a.likeCount || 0);
    })[0];

    setBestReview(best);

    // 최신 후기 (베스트 제외, 오늘 기준 신규 등록된 후기들)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const latest = reviews
      .filter(r => {
        if (r.id === best.id) return false;
        const reviewDate = new Date(r.createdAt);
        reviewDate.setHours(0, 0, 0, 0);
        return reviewDate.getTime() >= today.getTime();
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // 오늘 등록된 후기가 없으면 최신 후기 전체 사용
    const finalLatest = latest.length > 0 
      ? latest 
      : reviews
          .filter(r => r.id !== best.id)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 10);

    // 롤링을 위해 두 번 반복
    setLatestReviews([...finalLatest, ...finalLatest]);
  }, [reviews]);

  // 무한 롤링 애니메이션 (항상 롤링)
  useEffect(() => {
    if (!containerRef.current || latestReviews.length === 0) return;

    const container = containerRef.current;
    const scrollSpeed = 0.5; // 픽셀/프레임
    let paused = false;
    const halfWidth = () => container.scrollWidth / 2;

    const animate = () => {
      if (!containerRef.current) return;

      // 드래그 중이거나 터치 중일 때는 멈춤
      if (isDragging || touchStartX.current !== null) {
        paused = true;
        animationRef.current = requestAnimationFrame(animate);
        return;
      }

      // 일시정지 상태에서 재개
      if (paused) {
        paused = false;
      }

      const now = Date.now();
      // 사용자가 직접 스크롤한 경우 잠시 멈춤 (300ms) - 자동 스크롤은 제외
      if (!isAutoScrolling.current && now - lastScrollTime.current < 300) {
        animationRef.current = requestAnimationFrame(animate);
        return;
      }

      isAutoScrolling.current = true;

      // 끝에 도달하면 처음으로 순환 (리셋만 하고 다음 프레임에서 다시 스크롤 → 한 바퀴 후 멈춤 방지)
      const currentScroll = container.scrollLeft;
      if (currentScroll >= halfWidth() - 1) {
        container.scrollLeft = 0;
        animationRef.current = requestAnimationFrame(animate);
        return;
      }

      container.scrollLeft = currentScroll + scrollSpeed;
      animationRef.current = requestAnimationFrame(animate);
    };

    // 초기 지연 후 시작
    const timeout = setTimeout(() => {
      if (containerRef.current) {
        animationRef.current = requestAnimationFrame(animate);
      }
    }, 1000);

    return () => {
      clearTimeout(timeout);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      isAutoScrolling.current = false;
    };
  }, [latestReviews.length]);

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
    lastScrollTime.current = Date.now();
    isAutoScrolling.current = false;
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
      isAutoScrolling.current = false;
    }
  };

  const handleTouchEnd = () => {
    touchStartX.current = null;
    touchStartY.current = null;
    // 터치 종료 후 500ms 후에 자동 스크롤 재개
    setTimeout(() => {
      isAutoScrolling.current = true;
    }, 500);
  };

  // 평균 점수 계산
  const getAverageRating = () => {
    if (!stats || !stats.ratingStats.overall) return 0;
    return stats.ratingStats.overall.average;
  };

  // 평균 점수 반올림
  const averageRating = getAverageRating();
  const roundedAverage = Math.round(averageRating * 10) / 10;
  const fullStars = Math.floor(roundedAverage);
  const hasHalfStar = roundedAverage % 1 >= 0.5;

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

  // 중복 제거 (롤링을 위해 두 번 반복했으므로)
  const uniqueReviews = latestReviews.length > 0 
    ? latestReviews.slice(0, latestReviews.length / 2)
    : [];

  return (
    <div style={{
      padding: '3rem 0',
      background: 'linear-gradient(135deg, rgba(240, 253, 249, 0.5) 0%, rgba(255, 255, 255, 0.8) 100%)',
      position: 'relative',
    }} className="reviews-section-container">
      {/* 배경 패턴 */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: 'radial-gradient(rgba(16, 185, 129, 0.1) 1px, transparent 1px)',
        backgroundSize: '24px 24px',
        opacity: 0.4,
        pointerEvents: 'none',
      }} />

      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 1rem', position: 'relative', zIndex: 1 }} className="reviews-content-wrapper">
        {/* 헤더 섹션 */}
        <header style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(12, 1fr)',
          gap: '1rem',
          alignItems: 'center',
          marginBottom: '2rem',
        }} className="reviews-header-grid">
          <div style={{ gridColumn: 'span 12', display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '2rem' }}>
            <div style={{ gridColumn: 'span 12' }} className="reviews-header-text">
              <h1 style={{
                fontSize: '2rem',
                fontWeight: '900',
                lineHeight: '1.2',
                color: 'var(--text-main)',
                marginBottom: '1rem',
              }} className="reviews-title">
                마인드가든<br />
                <span style={{
                  background: 'linear-gradient(135deg, #10B981 0%, #4F46E5 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}>
                  이용자 후기
                </span>
              </h1>
              <p style={{
                fontSize: '0.875rem',
                color: 'var(--text-sub)',
                lineHeight: '1.8',
                marginBottom: '1rem',
              }} className="reviews-description">
                마인드가든을 이용하신 분들의 소중한 이야기입니다.<br />
                진솔한 상담 경험이 만들어낸 변화를 확인해보세요.
              </p>
              <Link
                href="/reviews"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  marginTop: '1rem',
                  fontSize: '1rem',
                  fontWeight: '700',
                  color: '#10B981',
                  textDecoration: 'none',
                  transition: 'color 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#059669';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#10B981';
                }}
              >
                전체 후기 보러가기
                <span style={{ marginLeft: '0.5rem' }}>→</span>
              </Link>
            </div>

            {/* 평균 만족도 카드 */}
            {stats && stats.ratingStats.overall.count > 0 && (
              <div style={{
                gridColumn: 'span 12',
                background: 'white',
                borderRadius: '1.5rem',
                padding: '1.5rem',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                border: '1px solid rgba(226, 232, 240, 0.8)',
                position: 'relative',
                overflow: 'hidden',
              }} className="reviews-header-stats">
                <div style={{
                  position: 'absolute',
                  right: '-1.5rem',
                  top: '-1.5rem',
                  width: '6rem',
                  height: '6rem',
                  background: 'rgba(16, 185, 129, 0.2)',
                  borderRadius: '50%',
                  filter: 'blur(2rem)',
                }} />
                <div style={{ position: 'relative', zIndex: 1 }}>
                  <h3 style={{
                    color: 'var(--text-sub)',
                    fontWeight: '500',
                    fontSize: '0.875rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginBottom: '1rem',
                  }}>
                    평균 만족도
                  </h3>
                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-end',
                    gap: '0.75rem',
                    marginBottom: '0.5rem',
                  }}>
                    <span style={{
                      fontSize: '2.5rem',
                      fontWeight: '900',
                      color: 'var(--text-main)',
                    }} className="reviews-average-score">
                      {roundedAverage.toFixed(1)}
                    </span>
                    <span style={{
                      fontSize: '1.25rem',
                      color: 'var(--text-sub)',
                      fontWeight: '500',
                      marginBottom: '0.5rem',
                    }}>
                      / 5.0
                    </span>
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    marginBottom: '1.5rem',
                    color: '#FBBF24',
                  }}>
                    {[...Array(5)].map((_, i) => (
                      <span key={i} style={{ fontSize: '1.25rem' }}>
                        {i < fullStars ? '★' : i === fullStars && hasHalfStar ? '☆' : '☆'}
                      </span>
                    ))}
                    <span style={{
                      fontSize: '0.75rem',
                      color: 'var(--text-sub)',
                      marginLeft: '0.5rem',
                      fontWeight: '400',
                    }}>
                      ({stats.ratingStats.overall.count}명 참여)
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {['professionalism', 'kindness'].map((key) => {
                      const stat = stats.ratingStats[key];
                      if (!stat || stat.count === 0) return null;
                      const percentage = (stat.average / 5) * 100;
                      const labels: Record<string, string> = {
                        professionalism: '전문성',
                        kindness: '친절도',
                      };
                      return (
                        <div key={key} style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.75rem',
                          fontSize: '0.875rem',
                        }}>
                          <span style={{
                            width: '3rem',
                            fontWeight: '500',
                            color: 'var(--text-sub)',
                          }}>
                            {labels[key]}
                          </span>
                          <div style={{
                            flex: 1,
                            height: '0.5rem',
                            background: 'rgba(226, 232, 240, 0.8)',
                            borderRadius: '9999px',
                            overflow: 'hidden',
                          }}>
                            <div style={{
                              height: '100%',
                              background: key === 'professionalism' ? '#4F46E5' : '#10B981',
                              width: `${percentage}%`,
                              borderRadius: '9999px',
                            }} />
                          </div>
                          <span style={{
                            color: key === 'professionalism' ? '#4F46E5' : '#10B981',
                            fontWeight: '700',
                          }}>
                            {stat.average.toFixed(1)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* 베스트 후기 섹션 */}
        {bestReview && (
          <section style={{ marginBottom: '4rem' }}>
            <div 
              className="best-review-section"
              style={{
                position: 'relative',
                background: 'linear-gradient(135deg, #D4A574 0%, #B8956A 100%)',
                borderRadius: '1.5rem',
                padding: '2rem',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                overflow: 'hidden',
                color: 'white',
              }}
            >
              <div style={{
                position: 'absolute',
                top: 0,
                right: 0,
                width: '16rem',
                height: '16rem',
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '50%',
                filter: 'blur(3rem)',
                marginRight: '-4rem',
                marginTop: '-4rem',
                pointerEvents: 'none',
              }} />
              <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                width: '16rem',
                height: '16rem',
                background: 'rgba(212, 165, 116, 0.3)',
                borderRadius: '50%',
                filter: 'blur(3rem)',
                marginLeft: '-4rem',
                marginBottom: '-4rem',
                pointerEvents: 'none',
              }} />
              <div style={{
                position: 'relative',
                zIndex: 1,
                display: 'grid',
                gridTemplateColumns: 'repeat(12, 1fr)',
                gap: '2.5rem',
                alignItems: 'center',
              }}>
                <div style={{ gridColumn: 'span 12' }} className="best-review-text">
                  <div style={{
                    display: 'inline-block',
                    padding: '0.375rem 1rem',
                    borderRadius: '0.5rem',
                    background: 'rgba(255, 255, 255, 0.2)',
                    backdropFilter: 'blur(8px)',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    marginBottom: '1.5rem',
                  }}>
                    🏆 이달의 베스트 후기
                  </div>
                  <h2 style={{
                    fontSize: '1.875rem',
                    fontWeight: '700',
                    lineHeight: '1.3',
                    marginBottom: '1.5rem',
                  }}>
                    "{getPreviewText(bestReview.content, 100)}"
                  </h2>
                  {bestReview.tags && bestReview.tags.length > 0 && (
                    <div style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '0.5rem',
                    }}>
                      {bestReview.tags.slice(0, 3).map((tag, idx) => (
                        <span
                          key={idx}
                          style={{
                            padding: '0.25rem 0.75rem',
                            background: 'rgba(79, 70, 229, 0.4)',
                            borderRadius: '9999px',
                            fontSize: '0.75rem',
                            border: '1px solid rgba(129, 140, 248, 0.3)',
                          }}
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div style={{
                  gridColumn: 'span 12',
                  background: '#FFF8E7',
                  backdropFilter: 'blur(12px)',
                  borderRadius: '1rem',
                  padding: '1.5rem',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  minHeight: '200px',
                }} className="best-review-card">
                  <div style={{ marginBottom: '1rem', position: 'relative' }}>
                    <span style={{
                      fontSize: '2.5rem',
                      color: '#8B6F47',
                      opacity: 0.6,
                      lineHeight: '1',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                    }}>"</span>
                    <p style={{
                      color: '#5C4033',
                      lineHeight: '1.8',
                      marginTop: '0.5rem',
                      paddingLeft: '1.5rem',
                      display: '-webkit-box',
                      WebkitLineClamp: 4,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      position: 'relative',
                    }}>
                      {getPreviewText(bestReview.content, 200)}
                      <span style={{
                        fontSize: '2.5rem',
                        color: '#8B6F47',
                        opacity: 0.6,
                        lineHeight: '1',
                        position: 'absolute',
                        bottom: 0,
                        right: 0,
                        transform: 'translateY(0.5rem)',
                      }}>"</span>
                    </p>
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingTop: '1rem',
                    borderTop: '1px solid rgba(139, 111, 71, 0.2)',
                    marginTop: '0.5rem',
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                    }}>
                      <div style={{
                        width: '2.5rem',
                        height: '2.5rem',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #D4A574 0%, #B8956A 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: '700',
                        color: 'white',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                        fontSize: '0.875rem',
                      }}>
                        {getRandomName(bestReview.id).charAt(0)}
                      </div>
                      <div>
                        <p style={{
                          fontWeight: '700',
                          fontSize: '0.875rem',
                          color: '#5C4033',
                        }}>
                          {getRandomName(bestReview.id)}
                        </p>
                        <p style={{
                          fontSize: '0.75rem',
                          color: '#8B6F47',
                        }}>
                          {new Date(bestReview.createdAt).toLocaleDateString('ko-KR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </p>
                      </div>
                    </div>
                    <Link
                      href={`/reviews#review-${bestReview.id}`}
                      style={{
                        background: '#D4A574',
                        color: 'white',
                        padding: '0.5rem 1rem',
                        borderRadius: '0.5rem',
                        fontSize: '0.875rem',
                        fontWeight: '700',
                        textDecoration: 'none',
                        transition: 'background 0.2s',
                        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#B8956A';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#D4A574';
                      }}
                    >
                      전체 읽기
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* 최신 후기 섹션 */}
        {uniqueReviews.length > 0 && (
          <section>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '2rem',
            }}>
              <h2 style={{
                fontSize: '1.5rem',
                fontWeight: '700',
                color: 'var(--text-main)',
                display: 'flex',
                alignItems: 'center',
              }}>
                <span style={{
                  width: '0.5rem',
                  height: '2rem',
                  background: '#10B981',
                  borderRadius: '9999px',
                  marginRight: '0.75rem',
                }} />
                최신 후기
              </h2>
            </div>
            <div
              ref={containerRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseLeave}
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
                scrollbarColor: '#10B981 transparent',
              }}
              onScroll={() => {
                // 자동 스크롤이 아닐 때만 lastScrollTime 업데이트
                if (!isAutoScrolling.current) {
                  lastScrollTime.current = Date.now();
                }
              }}
            >
              {latestReviews.map((review, index) => (
                <Link
                  key={`${review.id}-${index}`}
                  href={`/reviews#review-${review.id}`}
                  style={{
                    textDecoration: 'none',
                    color: 'inherit',
                    display: 'block',
                    flexShrink: 0,
                    width: '280px',
                  }}
                  className="latest-review-card"
                  onClick={(e) => {
                    // 드래그 중일 때는 링크 클릭 방지
                    if (isDragging) {
                      e.preventDefault();
                    }
                  }}
                >
                  <article style={{
                    background: 'white',
                    borderRadius: '1rem',
                    padding: '1.5rem',
                    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
                    border: '1px solid rgba(226, 232, 240, 0.8)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    minHeight: '280px',
                    transition: isDragging ? 'none' : 'all 0.3s',
                    position: 'relative',
                    overflow: 'hidden',
                    userSelect: 'none',
                  }}
                  onMouseEnter={(e) => {
                    if (!isDragging) {
                      e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)';
                      e.currentTarget.style.transform = 'translateY(-4px)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isDragging) {
                      e.currentTarget.style.boxShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }
                  }}
                  >
                    {index === 0 && (
                      <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '4px',
                        background: '#10B981',
                      }} />
                    )}
                    <div>
                      <div style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent: 'space-between',
                        marginBottom: '1rem',
                      }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.75rem',
                        }}>
                          <div style={{
                            width: '3rem',
                            height: '3rem',
                            borderRadius: '50%',
                            background: index % 3 === 0
                              ? 'rgba(209, 250, 229, 0.8)'
                              : index % 3 === 1
                              ? 'rgba(226, 232, 240, 0.8)'
                              : 'rgba(224, 231, 255, 0.8)',
                            color: index % 3 === 0
                              ? '#10B981'
                              : index % 3 === 1
                              ? 'var(--text-sub)'
                              : '#4F46E5',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: '700',
                            fontSize: '1.125rem',
                          }}>
                            {review.authorName.charAt(0)}
                          </div>
                          <div>
                            <h3 style={{
                              fontWeight: '700',
                              color: 'var(--text-main)',
                              fontSize: '1.125rem',
                            }}>
                              {review.authorName}
                            </h3>
                            <span style={{
                              fontSize: '0.75rem',
                              color: 'var(--text-sub)',
                            }}>
                              {new Date(review.createdAt).toLocaleDateString('ko-KR', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                              })}
                            </span>
                          </div>
                        </div>
                        {review.ratings && review.ratings.overall && review.ratings.overall > 0 && (
                          <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'flex-end',
                          }}>
                            <div style={{
                              display: 'flex',
                              color: '#EF4444',
                            }}>
                              {[...Array(5)].map((_, i) => (
                                <span key={i} style={{
                                  fontSize: '1.125rem',
                                  color: i < review.ratings!.overall! ? '#EF4444' : 'rgba(239, 68, 68, 0.3)',
                                }}>
                                  ❤️
                                </span>
                              ))}
                            </div>
                            <span style={{
                              fontSize: '0.625rem',
                              color: '#10B981',
                              fontWeight: '700',
                              marginTop: '0.25rem',
                            }}>
                              {review.ratings.overall}/5 만족
                            </span>
                          </div>
                        )}
                      </div>
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
                                padding: '0.25rem 0.5rem',
                                background: 'rgba(241, 245, 249, 0.8)',
                                borderRadius: '0.25rem',
                                fontSize: '0.75rem',
                                color: 'var(--text-sub)',
                              }}
                            >
                              #{tag}
                            </span>
                          ))}
                          {review.tags.length > 3 && (
                            <span style={{
                              padding: '0.25rem 0.5rem',
                              fontSize: '0.75rem',
                              color: 'var(--text-sub)',
                            }}>
                              +{review.tags.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                      <div style={{
                        marginBottom: '1.5rem',
                      }}>
                        <p style={{
                          color: 'var(--text-sub)',
                          fontSize: '0.875rem',
                          lineHeight: '1.6',
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}>
                          {getPreviewText(review.content, 120)}
                        </p>
                      </div>
                    </div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingTop: '1rem',
                      borderTop: '1px solid rgba(226, 232, 240, 0.8)',
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        color: '#EF4444',
                        background: 'rgba(254, 242, 242, 0.8)',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '9999px',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                      }}>
                        <span style={{ marginRight: '0.25rem' }}>❤️</span>
                        {review.likeCount || 0}
                      </div>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        fontSize: '0.875rem',
                        fontWeight: '700',
                        color: 'var(--text-sub)',
                        transition: 'all 0.3s',
                      }}>
                        자세히 보기
                        <span style={{ marginLeft: '0.25rem' }}>→</span>
                      </div>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
            {/* 스크롤바 스타일 및 반응형 */}
            <style jsx>{`
              div::-webkit-scrollbar {
                height: 8px;
              }
              div::-webkit-scrollbar-track {
                background: rgba(241, 245, 249, 0.5);
                border-radius: 4px;
              }
              div::-webkit-scrollbar-thumb {
                background: #10B981;
                border-radius: 4px;
              }
              div::-webkit-scrollbar-thumb:hover {
                background: #059669;
              }
              
              /* 모바일 기본 스타일 */
              .reviews-section-container {
                padding: 2rem 0 !important;
              }
              .reviews-content-wrapper {
                padding: 0 0.75rem !important;
              }
              .reviews-header-grid {
                gap: 1rem !important;
                margin-bottom: 2rem !important;
              }
              .reviews-title {
                font-size: 1.75rem !important;
                margin-bottom: 0.75rem !important;
              }
              .reviews-description {
                font-size: 0.875rem !important;
              }
              .reviews-header-stats {
                padding: 1.25rem !important;
              }
              .reviews-average-score {
                font-size: 2rem !important;
              }
              .best-review-section {
                padding: 1.5rem !important;
              }
              .latest-review-card {
                width: 260px !important;
              }
              
              /* 태블릿 (768px 이상) */
              @media (min-width: 768px) {
                .reviews-section-container {
                  padding: 3.5rem 0 !important;
                }
                .reviews-content-wrapper {
                  padding: 0 1.5rem !important;
                }
                .reviews-header-grid {
                  gap: 1.5rem !important;
                  margin-bottom: 3rem !important;
                }
                .reviews-title {
                  font-size: 2.5rem !important;
                  margin-bottom: 1.25rem !important;
                }
                .reviews-description {
                  font-size: 1rem !important;
                }
                .reviews-header-stats {
                  padding: 1.75rem !important;
                }
                .reviews-average-score {
                  font-size: 3rem !important;
                }
                .best-review-section {
                  padding: 2.5rem !important;
                }
                .latest-review-card {
                  width: 300px !important;
                }
              }
              
              /* 데스크탑 (1024px 이상) */
              @media (min-width: 1024px) {
                .reviews-section-container {
                  padding: 5rem 0 !important;
                }
                .reviews-content-wrapper {
                  padding: 0 2rem !important;
                }
                .reviews-header-grid {
                  gap: 2rem !important;
                  margin-bottom: 4rem !important;
                }
                .reviews-title {
                  font-size: 3rem !important;
                  margin-bottom: 1.5rem !important;
                }
                .reviews-description {
                  font-size: 1.125rem !important;
                }
                .reviews-header-stats {
                  padding: 2rem !important;
                }
                .reviews-average-score {
                  font-size: 3.75rem !important;
                }
                .best-review-section {
                  padding: 3rem !important;
                }
                .latest-review-card {
                  width: 320px !important;
                }
              }
            `}</style>
          </section>
        )}

        {/* 더보기 버튼 */}
        {reviews.length > 6 && (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            paddingTop: '2rem',
          }}>
            <Link
              href="/reviews"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1.5rem',
                borderRadius: '9999px',
                background: 'white',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                border: '1px solid rgba(226, 232, 240, 0.8)',
                color: 'var(--text-sub)',
                fontWeight: '700',
                textDecoration: 'none',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
              }}
            >
              더 많은 후기 보기
              <span style={{ fontSize: '1.25rem' }}>↓</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
