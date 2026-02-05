'use client';

import { useState, useEffect } from 'react';
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
  const [currentPage, setCurrentPage] = useState(0);

  // HTML 콘텐츠에서 텍스트만 추출
  const getPreviewText = (content: string, maxLength: number = 150) => {
    const text = content.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
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

    // 최신 후기 (베스트 제외)
    const latest = reviews
      .filter(r => r.id !== best.id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 6);

    setLatestReviews(latest);
  }, [reviews]);

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

  // 페이지네이션
  const reviewsPerPage = 3;
  const totalPages = Math.ceil(latestReviews.length / reviewsPerPage);
  const startIndex = currentPage * reviewsPerPage;
  const displayedReviews = latestReviews.slice(startIndex, startIndex + reviewsPerPage);

  return (
    <div style={{
      padding: '5rem 0',
      background: 'linear-gradient(135deg, rgba(240, 253, 249, 0.5) 0%, rgba(255, 255, 255, 0.8) 100%)',
      position: 'relative',
    }}>
      {/* 배경 패턴 */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: 'radial-gradient(rgba(16, 185, 129, 0.1) 1px, transparent 1px)',
        backgroundSize: '24px 24px',
        opacity: 0.4,
        pointerEvents: 'none',
      }} />

      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 2rem', position: 'relative', zIndex: 1 }}>
        {/* 헤더 섹션 */}
        <header style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(12, 1fr)',
          gap: '2rem',
          alignItems: 'center',
          marginBottom: '4rem',
        }}>
          <div style={{ gridColumn: 'span 12', display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '2rem' }}>
            <div style={{ gridColumn: 'span 12' }} className="reviews-header-text">
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '0.25rem 0.75rem',
                borderRadius: '9999px',
                background: 'rgba(209, 250, 229, 0.8)',
                color: 'rgb(4, 120, 87)',
                fontSize: '0.875rem',
                fontWeight: '600',
                marginBottom: '1rem',
              }}>
                <span style={{ marginRight: '0.25rem' }}>✨</span>
                실시간 후기 대시보드
              </div>
              <h1 style={{
                fontSize: '3rem',
                fontWeight: '900',
                lineHeight: '1.2',
                color: 'var(--text-main)',
                marginBottom: '1.5rem',
              }}>
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
                fontSize: '1.125rem',
                color: 'var(--text-sub)',
                lineHeight: '1.8',
                marginBottom: '1rem',
              }}>
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
                padding: '2rem',
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
                      fontSize: '3.75rem',
                      fontWeight: '900',
                      color: 'var(--text-main)',
                    }}>
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
            <div style={{
              position: 'relative',
              background: 'linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)',
              borderRadius: '1.5rem',
              padding: '3rem',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              overflow: 'hidden',
              color: 'white',
            }}>
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
                background: 'rgba(16, 185, 129, 0.2)',
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
                  background: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(12px)',
                  borderRadius: '1rem',
                  padding: '1.5rem',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  minHeight: '200px',
                }} className="best-review-card">
                  <div style={{ marginBottom: '1rem' }}>
                    <span style={{
                      fontSize: '2.5rem',
                      color: 'rgba(255, 255, 255, 0.4)',
                    }}>"</span>
                    <p style={{
                      color: 'rgba(199, 210, 254, 1)',
                      lineHeight: '1.8',
                      marginTop: '0.5rem',
                      display: '-webkit-box',
                      WebkitLineClamp: 4,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}>
                      {getPreviewText(bestReview.content, 200)}
                    </p>
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingTop: '1rem',
                    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
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
                        background: 'linear-gradient(135deg, #10B981 0%, #06B6D4 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: '700',
                        color: 'white',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                      }}>
                        {bestReview.authorName.charAt(0)}
                      </div>
                      <div>
                        <p style={{
                          fontWeight: '700',
                          fontSize: '0.875rem',
                        }}>
                          {bestReview.authorName} 님
                        </p>
                        <p style={{
                          fontSize: '0.75rem',
                          color: 'rgba(199, 210, 254, 0.8)',
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
                        background: 'white',
                        color: '#4F46E5',
                        padding: '0.5rem 1rem',
                        borderRadius: '0.5rem',
                        fontSize: '0.875rem',
                        fontWeight: '700',
                        textDecoration: 'none',
                        transition: 'background 0.2s',
                        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#EEF2FF';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'white';
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
        {displayedReviews.length > 0 && (
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
              {totalPages > 1 && (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                    disabled={currentPage === 0}
                    style={{
                      width: '2.5rem',
                      height: '2.5rem',
                      borderRadius: '50%',
                      border: '1px solid rgba(226, 232, 240, 0.8)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: currentPage === 0 ? 'transparent' : 'white',
                      color: 'var(--text-sub)',
                      cursor: currentPage === 0 ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      if (currentPage !== 0) {
                        e.currentTarget.style.background = 'rgba(241, 245, 249, 0.8)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (currentPage !== 0) {
                        e.currentTarget.style.background = 'white';
                      }
                    }}
                  >
                    ←
                  </button>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                    disabled={currentPage === totalPages - 1}
                    style={{
                      width: '2.5rem',
                      height: '2.5rem',
                      borderRadius: '50%',
                      border: '1px solid rgba(226, 232, 240, 0.8)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: currentPage === totalPages - 1 ? 'transparent' : 'white',
                      color: 'var(--text-sub)',
                      cursor: currentPage === totalPages - 1 ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      if (currentPage !== totalPages - 1) {
                        e.currentTarget.style.background = 'rgba(241, 245, 249, 0.8)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (currentPage !== totalPages - 1) {
                        e.currentTarget.style.background = 'white';
                      }
                    }}
                  >
                    →
                  </button>
                </div>
              )}
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '1.5rem',
            }}>
              {displayedReviews.map((review, index) => (
                <Link
                  key={review.id}
                  href={`/reviews#review-${review.id}`}
                  style={{
                    textDecoration: 'none',
                    color: 'inherit',
                    display: 'block',
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
                    transition: 'all 0.3s',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)';
                    e.currentTarget.style.transform = 'translateY(-4px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)';
                    e.currentTarget.style.transform = 'translateY(0)';
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
