'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import KakaoIcon from '@/components/KakaoIcon';

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
  updatedAt: string;
}

interface ReviewStats {
  totalReviews: number;
  tagCounts: Array<{ tag: string; count: number }>;
  ratingStats: Record<string, { sum: number; count: number; average: number }>;
}

type SortBy = 'latest' | 'ratingHigh' | 'ratingLow';

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
  
  const index = reviewId % names.length;
  return names[index];
};

// 하트 렌더링
const renderHearts = (rating: number) => {
  const fullHearts = Math.floor(rating);
  const hasHalfHeart = rating % 1 >= 0.5;
  const emptyHearts = 5 - fullHearts - (hasHalfHeart ? 1 : 0);
  
  return (
    <div style={{ display: 'flex', gap: '0.125rem' }}>
      {Array.from({ length: fullHearts }).map((_, i) => (
        <span key={i} style={{ fontSize: '0.875rem', color: '#ef4444' }}>❤️</span>
      ))}
      {hasHalfHeart && <span style={{ fontSize: '0.875rem', color: '#ef4444', opacity: 0.5 }}>❤️</span>}
      {Array.from({ length: emptyHearts }).map((_, i) => (
        <span key={i} style={{ fontSize: '0.875rem', color: '#cbd5e1' }}>🤍</span>
      ))}
    </div>
  );
};

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [sortBy, setSortBy] = useState<SortBy>('latest');
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [likeCounts, setLikeCounts] = useState<Record<number, number>>({});
  const [likedReviews, setLikedReviews] = useState<Set<number>>(new Set());
  const observerTarget = useRef<HTMLDivElement>(null);

  // 통계 데이터 로드
  const loadStats = useCallback(async () => {
    try {
      const response = await fetch('/api/reviews/stats');
      const data = await response.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Load stats error:', err);
    }
  }, []);

  // 후기 로드
  const loadReviews = useCallback(async (pageNum: number, append: boolean = false) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      setError(null);
      
      const params = new URLSearchParams({
        page: pageNum.toString(),
        limit: '10',
        sortBy,
        ...(searchQuery && { search: searchQuery }),
      });
      
      const response = await fetch(`/api/reviews?${params}`);
      
      if (!response.ok) {
        throw new Error(`서버 오류 (${response.status})`);
      }

      const data = await response.json();

      if (data.success) {
        const newReviews = data.reviews || [];
        if (append) {
          setReviews(prev => [...prev, ...newReviews]);
        } else {
          setReviews(newReviews);
        }
        
        // 좋아요 수 초기화
        const newLikeCounts: Record<number, number> = {};
        newReviews.forEach((review: Review) => {
          newLikeCounts[review.id] = review.likeCount || 0;
        });
        setLikeCounts(prev => ({ ...prev, ...newLikeCounts }));
        
        setHasMore(newReviews.length === 10 && (data.pagination?.totalPages || 0) > pageNum);
        setPage(pageNum);
      } else {
        setError(data.error || '후기 목록을 불러오는데 실패했습니다.');
      }
    } catch (err) {
      console.error('Load reviews error:', err);
      setError(`네트워크 오류: ${err instanceof Error ? err.message : ''}`);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [sortBy, searchQuery]);

  // 초기 로드
  useEffect(() => {
    loadStats();
  }, []);

  // 정렬 또는 검색 변경 시 리로드
  useEffect(() => {
    setPage(1);
    setReviews([]);
    setHasMore(true);
    loadReviews(1, false);
  }, [sortBy, searchQuery, loadReviews]);

  // 무한 스크롤
  useEffect(() => {
    if (!hasMore || loadingMore || loading) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          loadReviews(page + 1, true);
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, loadingMore, loading, page, loadReviews]);

  // 좋아요 처리
  const handleLike = async (reviewId: number) => {
    if (likedReviews.has(reviewId)) return;

    try {
      const response = await fetch(`/api/reviews/${reviewId}/like`, {
        method: 'POST',
      });

      const data = await response.json();
      if (data.success) {
        setLikeCounts((prev) => ({
          ...prev,
          [reviewId]: data.likeCount,
        }));
        setLikedReviews((prev) => new Set([...prev, reviewId]));
      }
    } catch (error) {
      console.error('Like error:', error);
    }
  };

  // 공유 처리
  const handleShare = (platform: string, reviewId: number) => {
    const review = reviews.find((r) => r.id === reviewId);
    if (!review) return;

    const url = typeof window !== 'undefined' ? window.location.origin : '';
    const shareUrl = `${url}/reviews#review-${reviewId}`;
    const shareText = `${getRandomName(reviewId)}님의 후기 - 마인드가든`;
    const shareContent = review.content.replace(/<[^>]*>/g, '').substring(0, 100) + '...';

    switch (platform) {
      case 'kakao':
        if (typeof window !== 'undefined' && (window as any).Kakao) {
          (window as any).Kakao.Share.sendDefault({
            objectType: 'feed',
            content: {
              title: shareText,
              description: shareContent,
              imageUrl: `${url}/assets/images/gallery_1.png`,
              link: {
                mobileWebUrl: shareUrl,
                webUrl: shareUrl,
              },
            },
          });
        } else {
          if (navigator.clipboard) {
            navigator.clipboard.writeText(shareText + '\n' + shareUrl);
            alert('카카오톡에 공유할 내용이 클립보드에 복사되었습니다!');
          }
        }
        break;
      case 'link':
        if (navigator.clipboard) {
          navigator.clipboard.writeText(shareUrl);
          alert('링크가 클립보드에 복사되었습니다!');
        }
        break;
    }
  };

  // 검색 처리
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadReviews(1, false);
  };

  // HTML 콘텐츠에서 텍스트만 추출
  const getPreviewText = (content: string, maxLength: number = 100) => {
    const text = content.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  // 아바타 그라데이션 색상 생성
  const getAvatarGradient = (id: number) => {
    const gradients = [
      ['#6366F1', '#8B5CF6'], // indigo to purple
      ['#4ADE80', '#14B8A6'], // primary to teal
      ['#EC4899', '#F43F5E'], // pink to rose
      ['#3B82F6', '#06B6D4'], // blue to cyan
      ['#10B981', '#059669'], // emerald to green
      ['#F59E0B', '#F97316'], // amber to orange
      ['#8B5CF6', '#7C3AED'], // violet to purple
      ['#06B6D4', '#3B82F6'], // cyan to blue
    ];
    return gradients[id % gradients.length];
  };

  return (
    <main id="top" style={{ backgroundColor: '#F8FAFC', minHeight: '100vh' }}>
      <Navigation />
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '2rem 1rem' }}>
        <header style={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '2rem',
          gap: '1rem',
        }}>
          <div>
            <h1 style={{
              fontSize: '2rem',
              fontWeight: '700',
              color: '#1e1b4b',
              marginBottom: '0.25rem',
              letterSpacing: '-0.02em',
            }}>
              마인드가든 후기 피드
            </h1>
            <p style={{
              color: '#64748b',
              fontSize: '0.875rem',
            }}>
              실시간으로 업데이트되는 내담자들의 생생한 후기를 확인하세요.
            </p>
          </div>
          <Link
            href="/reviews/new"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              backgroundColor: '#B8956A',
              color: 'white',
              padding: '0.625rem 1.25rem',
              borderRadius: '0.75rem',
              textDecoration: 'none',
              fontWeight: '500',
              fontSize: '0.875rem',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
              transition: 'all 0.2s',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#A0825A';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#B8956A';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <span style={{ fontSize: '1rem', color: '#4ADE80' }}>✏️</span>
            후기 작성하기
          </Link>
        </header>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: '2rem',
        }} className="reviews-container">
          {/* 사이드바 - 데스크탑에서만 표시 */}
          <aside style={{
            display: 'none',
          }} className="reviews-sidebar">
            {/* 평균 만족도 카드 */}
            {stats && stats.ratingStats.overall.count > 0 && (
              <div style={{
                backgroundColor: '#B8956A',
                borderRadius: '1.5rem',
                padding: '1.5rem',
                color: 'white',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
                marginBottom: '1.25rem',
              }}>
                <div style={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  width: '8rem',
                  height: '8rem',
                  background: 'rgba(255, 255, 255, 0.15)',
                  borderRadius: '50%',
                  filter: 'blur(3rem)',
                  transform: 'translate(25%, -25%)',
                }}></div>
                <div style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  width: '8rem',
                  height: '8rem',
                  background: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '50%',
                  filter: 'blur(3rem)',
                  transform: 'translate(-25%, 25%)',
                }}></div>
                <div style={{ position: 'relative', zIndex: 1 }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '0.5rem',
                  }}>
                    <p style={{
                      color: 'rgba(255, 255, 255, 0.9)',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      letterSpacing: '0.05em',
                      textTransform: 'uppercase',
                    }}>
                      전체 평균 만족도
                    </p>
                    <span style={{
                      backgroundColor: 'rgba(99, 102, 241, 0.5)',
                      color: 'rgba(199, 210, 254, 1)',
                      fontSize: '0.625rem',
                      padding: '0.125rem 0.5rem',
                      borderRadius: '9999px',
                      border: '1px solid rgba(99, 102, 241, 0.7)',
                    }}>
                      Monthly
                    </span>
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    gap: '0.5rem',
                    marginBottom: '0.75rem',
                  }}>
                    <span style={{
                      fontSize: '3rem',
                      fontWeight: '700',
                      color: 'white',
                    }}>
                      {stats.ratingStats.overall.average.toFixed(1)}
                    </span>
                    <span style={{
                      fontSize: '1.125rem',
                      color: 'rgba(255, 255, 255, 0.9)',
                    }}>
                      / 5.0
                    </span>
                  </div>
                  <div style={{
                    display: 'flex',
                    gap: '0.25rem',
                    marginBottom: '1rem',
                  }}>
                    {Array.from({ length: 5 }).map((_, i) => {
                      const rating = stats.ratingStats.overall.average;
                      if (i < Math.floor(rating)) {
                        return <span key={i} style={{ fontSize: '1.25rem', color: '#ef4444' }}>❤️</span>;
                      } else if (i === Math.floor(rating) && rating % 1 >= 0.5) {
                        return <span key={i} style={{ fontSize: '1.25rem', color: '#ef4444', opacity: 0.5 }}>❤️</span>;
                      } else {
                        return <span key={i} style={{ fontSize: '1.25rem', color: '#cbd5e1' }}>🤍</span>;
                      }
                    })}
                  </div>
                  <div style={{
                    height: '1px',
                    backgroundColor: 'rgba(255, 255, 255, 0.3)',
                    margin: '1rem 0',
                  }}></div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '0.75rem',
                    color: 'rgba(255, 255, 255, 0.9)',
                    fontWeight: '500',
                  }}>
                    <span>총 누적 후기</span>
                    <span style={{ color: 'white', fontWeight: '600' }}>{stats.totalReviews.toLocaleString()}건</span>
                  </div>
                </div>
              </div>
            )}

            {/* 평가 상세 */}
            {stats && (
              <div style={{
                backgroundColor: 'white',
                padding: '1.25rem',
                borderRadius: '1.5rem',
                boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
                border: '1px solid #e2e8f0',
                marginBottom: '1.25rem',
              }}>
                <h3 style={{
                  fontSize: '0.875rem',
                  fontWeight: '700',
                  color: '#1e293b',
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}>
                  <span style={{ fontSize: '1rem' }}>📊</span>
                  평가 상세
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {Object.entries(stats.ratingStats)
                    .filter(([key]) => key !== 'overall')
                    .map(([key, stat]) => {
                      if (stat.count === 0) return null;
                      const labels: Record<string, string> = {
                        professionalism: '전문성',
                        kindness: '친절도',
                        effectiveness: '효과',
                        facility: '시설',
                      };
                      // 각 항목별 색상 정의
                      const colorMap: Record<string, { dot: string; bar: string }> = {
                        professionalism: { dot: '#3B82F6', bar: '#3B82F6' }, // 파란색
                        kindness: { dot: '#10B981', bar: '#10B981' }, // 초록색
                        effectiveness: { dot: '#F59E0B', bar: '#F59E0B' }, // 주황색
                        facility: { dot: '#8B5CF6', bar: '#8B5CF6' }, // 보라색
                      };
                      const colors = colorMap[key] || { dot: '#6366F1', bar: '#6366F1' };
                      const percentage = (stat.average / 5) * 100;
                      return (
                        <div key={key} style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                          }}>
                            <span style={{
                              width: '0.5rem',
                              height: '0.5rem',
                              borderRadius: '50%',
                              backgroundColor: colors.dot,
                            }}></span>
                            <span style={{
                              fontSize: '0.75rem',
                              fontWeight: '500',
                              color: '#475569',
                            }}>
                              {labels[key] || key}
                            </span>
                          </div>
                          <div style={{
                            width: '8rem',
                            height: '0.5rem',
                            backgroundColor: '#f1f5f9',
                            borderRadius: '9999px',
                            overflow: 'hidden',
                          }}>
                            <div
                              style={{
                                height: '100%',
                                backgroundColor: colors.bar,
                                width: `${percentage}%`,
                                transition: 'width 0.3s ease',
                              }}
                            ></div>
                          </div>
                          <span style={{
                            fontSize: '0.75rem',
                            fontWeight: '700',
                            color: '#1e293b',
                          }}>
                            {stat.average.toFixed(1)}
                          </span>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* 인기 키워드 */}
            {stats && stats.tagCounts.length > 0 && (
              <div style={{
                backgroundColor: 'white',
                padding: '1.25rem',
                borderRadius: '1.5rem',
                boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
                border: '1px solid #e2e8f0',
              }}>
                <h3 style={{
                  fontSize: '0.875rem',
                  fontWeight: '700',
                  color: '#1e293b',
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}>
                  <span style={{ fontSize: '1rem' }}>🏷️</span>
                  인기 키워드
                </h3>
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '0.5rem',
                }}>
                  {stats.tagCounts.slice(0, 8).map(({ tag, count }) => (
                    <span
                      key={tag}
                      style={{
                        backgroundColor: '#eef2ff',
                        color: '#1e1b4b',
                        padding: '0.375rem 0.75rem',
                        borderRadius: '0.5rem',
                        fontSize: '0.75rem',
                        fontWeight: '500',
                        border: '1px solid #c7d2fe',
                      }}
                    >
                      <span style={{ color: '#4ADE80', fontWeight: '700' }}>#</span>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </aside>

          {/* 메인 콘텐츠 */}
          <main className="reviews-main" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* 필터 및 검색 */}
            <div style={{
              backgroundColor: 'white',
              padding: '0.5rem',
              borderRadius: '1rem',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.75rem',
              boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
              border: '1px solid #e2e8f0',
              position: 'sticky',
              top: '4rem',
              zIndex: 40,
              backdropFilter: 'blur(12px)',
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem',
                padding: '0 0.25rem',
              }}>
                <button
                  onClick={() => {
                    setSortBy('latest');
                    setPage(1);
                  }}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '0.75rem',
                    fontSize: '0.875rem',
                    fontWeight: sortBy === 'latest' ? '600' : '500',
                    backgroundColor: sortBy === 'latest' ? '#B8956A' : 'transparent',
                    color: sortBy === 'latest' ? 'white' : '#475569',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: sortBy === 'latest' ? '0 4px 6px -1px rgba(0, 0, 0, 0.1)' : 'none',
                  }}
                >
                  최신순
                </button>
                <button
                  onClick={() => {
                    setSortBy('ratingHigh');
                    setPage(1);
                  }}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '0.75rem',
                    fontSize: '0.875rem',
                    fontWeight: sortBy === 'ratingHigh' ? '600' : '500',
                    backgroundColor: sortBy === 'ratingHigh' ? '#B8956A' : 'transparent',
                    color: sortBy === 'ratingHigh' ? 'white' : '#475569',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: sortBy === 'ratingHigh' ? '0 4px 6px -1px rgba(0, 0, 0, 0.1)' : 'none',
                  }}
                >
                  별점 높은순
                </button>
                <button
                  onClick={() => {
                    setSortBy('ratingLow');
                    setPage(1);
                  }}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '0.75rem',
                    fontSize: '0.875rem',
                    fontWeight: sortBy === 'ratingLow' ? '600' : '500',
                    backgroundColor: sortBy === 'ratingLow' ? '#B8956A' : 'transparent',
                    color: sortBy === 'ratingLow' ? 'white' : '#475569',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: sortBy === 'ratingLow' ? '0 4px 6px -1px rgba(0, 0, 0, 0.1)' : 'none',
                  }}
                >
                  별점 낮은순
                </button>
              </div>
              <form onSubmit={handleSearch} style={{
                position: 'relative',
                width: '100%',
                padding: '0 0.25rem',
              }}>
                <span style={{
                  position: 'absolute',
                  inset: '0 0 0 0',
                  display: 'flex',
                  alignItems: 'center',
                  paddingLeft: '1rem',
                  color: '#94a3b8',
                  pointerEvents: 'none',
                }}>
                  🔍
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="키워드 검색"
                  style={{
                    width: '100%',
                    paddingLeft: '2.5rem',
                    paddingRight: '1rem',
                    paddingTop: '0.5rem',
                    paddingBottom: '0.5rem',
                    borderRadius: '0.75rem',
                    border: 'none',
                    backgroundColor: '#f8fafc',
                    color: '#1e293b',
                    fontSize: '0.875rem',
                    boxShadow: 'inset 0 1px 2px 0 rgb(0 0 0 / 0.05)',
                  }}
                />
              </form>
            </div>

            {/* 후기 목록 */}
            {error && (
              <div style={{
                padding: '1rem',
                backgroundColor: '#fee2e2',
                color: '#991b1b',
                borderRadius: '0.75rem',
                border: '1px solid #fecaca',
              }}>
                {error}
              </div>
            )}

            {loading && reviews.length === 0 ? (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '5rem 0',
                gap: '0.75rem',
              }}>
                <div className="spinner"></div>
                <span style={{
                  fontSize: '0.875rem',
                  color: '#94a3b8',
                  fontWeight: '500',
                }}>후기를 불러오는 중...</span>
              </div>
            ) : reviews.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '5rem 0' }}>
                <p style={{ color: '#64748b', marginBottom: '1rem' }}>등록된 후기가 없습니다.</p>
                <Link
                  href="/reviews/new"
                  style={{
                    display: 'inline-block',
                    padding: '0.625rem 1.25rem',
                    backgroundColor: '#B8956A',
                    color: 'white',
                    borderRadius: '0.75rem',
                    textDecoration: 'none',
                    fontWeight: '500',
                    fontSize: '0.875rem',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#A0825A';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#B8956A';
                  }}
                >
                  첫 후기 작성하기
                </Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {reviews.map((review) => {
                  const randomName = getRandomName(review.id);
                  const isNew = new Date(review.createdAt).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000;
                  const [gradientFrom, gradientTo] = getAvatarGradient(review.id);
                  
                  return (
                    <article
                      key={review.id}
                      id={`review-${review.id}`}
                      style={{
                        backgroundColor: 'white',
                        padding: '1.5rem 2rem',
                        borderRadius: '1.5rem',
                        boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
                        border: '1px solid #f1f5f9',
                        transition: 'all 0.3s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.boxShadow = '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)';
                        e.currentTarget.style.borderColor = '#c7d2fe';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.boxShadow = '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)';
                        e.currentTarget.style.borderColor = '#f1f5f9';
                      }}
                    >
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        marginBottom: '1.5rem',
                      }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '1rem',
                        }}>
                          <div style={{ position: 'relative' }}>
                            <div style={{
                              width: '3.5rem',
                              height: '3.5rem',
                              borderRadius: '1rem',
                              background: `linear-gradient(135deg, ${gradientFrom} 0%, ${gradientTo} 100%)`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'white',
                              fontWeight: '700',
                              fontSize: '1.25rem',
                              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                            }}>
                              {randomName.charAt(0)}
                            </div>
                            {isNew && (
                              <div style={{
                                position: 'absolute',
                                top: '-0.5rem',
                                right: '-0.5rem',
                                backgroundColor: '#4ADE80',
                                color: '#1e1b4b',
                                fontSize: '0.625rem',
                                fontWeight: '700',
                                padding: '0.125rem 0.5rem',
                                borderRadius: '9999px',
                                border: '2px solid white',
                                boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
                              }}>
                                NEW
                              </div>
                            )}
                          </div>
                          <div>
                            <h3 style={{
                              fontWeight: '700',
                              color: '#1e293b',
                              fontSize: '1.125rem',
                              marginBottom: '0.25rem',
                            }}>
                              {getPreviewText(review.content, 30)} - {review.tags?.[0] || '후기'}
                            </h3>
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              fontSize: '0.75rem',
                              fontWeight: '500',
                              color: '#64748b',
                              marginTop: '0.25rem',
                            }}>
                              <span>
                                {new Date(review.createdAt).toLocaleDateString('ko-KR', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric',
                                })}
                              </span>
                              <span style={{
                                width: '0.25rem',
                                height: '0.25rem',
                                backgroundColor: '#cbd5e1',
                                borderRadius: '50%',
                              }}></span>
                              <span style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                              }}>
                                <span style={{ fontSize: '0.875rem' }}>✓</span>
                                {randomName}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 평가 점수 */}
                      {review.ratings && Object.values(review.ratings).some(r => r && r > 0) && (
                        <div style={{
                          backgroundColor: '#f8fafc',
                          padding: '1.25rem',
                          borderRadius: '1rem',
                          marginBottom: '1.5rem',
                          display: 'grid',
                          gridTemplateColumns: 'repeat(2, 1fr)',
                          gap: '1rem',
                          border: '1px solid #f1f5f9',
                        }}>
                          {Object.entries(review.ratings)
                            .filter(([key]) => key !== 'overall')
                            .map(([key, value]) => {
                              if (!value || value === 0) return null;
                              const labels: Record<string, string> = {
                                professionalism: '전문성',
                                kindness: '친절도',
                                effectiveness: '효과',
                                facility: '시설',
                              };
                              return (
                                <div key={key} style={{
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: '0.375rem',
                                }}>
                                  <span style={{
                                    fontSize: '0.75rem',
                                    fontWeight: '600',
                                    color: '#64748b',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em',
                                  }}>
                                    {labels[key] || key}
                                  </span>
                                  {renderHearts(value)}
                                </div>
                              );
                            })}
                        </div>
                      )}

                      {/* 후기 내용 */}
                      <div style={{ marginBottom: '1.5rem', padding: '0 0.25rem' }}>
                        <div
                          style={{
                            color: '#334155',
                            fontSize: '0.9375rem',
                            lineHeight: '1.75',
                            whiteSpace: 'pre-line',
                          }}
                          dangerouslySetInnerHTML={{ __html: review.content }}
                        />
                        {review.tags && review.tags.length > 0 && (
                          <div style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: '0.5rem',
                            marginTop: '1.25rem',
                          }}>
                            {review.tags.map((tag, idx) => (
                              <span
                                key={idx}
                                style={{
                                  padding: '0.375rem 0.75rem',
                                  borderRadius: '9999px',
                                  backgroundColor: '#eef2ff',
                                  color: '#4338ca',
                                  fontSize: '0.75rem',
                                  fontWeight: '700',
                                  border: '1px solid #c7d2fe',
                                }}
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* 액션 버튼 */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                        borderTop: '1px solid #f1f5f9',
                        paddingTop: '1.25rem',
                      }}>
                        <button
                          onClick={() => handleLike(review.id)}
                          disabled={likedReviews.has(review.id)}
                          style={{
                            flex: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem',
                            padding: '0.625rem',
                            borderRadius: '0.75rem',
                            backgroundColor: 'transparent',
                            border: 'none',
                            cursor: likedReviews.has(review.id) ? 'default' : 'pointer',
                            color: likedReviews.has(review.id) ? '#ef4444' : '#64748b',
                            fontSize: '0.875rem',
                            fontWeight: '600',
                            transition: 'all 0.2s',
                          }}
                          onMouseEnter={(e) => {
                            if (!likedReviews.has(review.id)) {
                              e.currentTarget.style.backgroundColor = '#f8fafc';
                              e.currentTarget.style.color = '#6366F1';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!likedReviews.has(review.id)) {
                              e.currentTarget.style.backgroundColor = 'transparent';
                              e.currentTarget.style.color = '#64748b';
                            }
                          }}
                        >
                          <span style={{ fontSize: '1.25rem' }}>
                            {likedReviews.has(review.id) ? '❤️' : '🤍'}
                          </span>
                          <span>
                            좋아요 <span style={{ fontSize: '0.75rem', fontWeight: '400', marginLeft: '0.125rem' }}>
                              {likeCounts[review.id] || review.likeCount || 0}
                            </span>
                          </span>
                        </button>
                        <button
                          onClick={() => handleShare('link', review.id)}
                          style={{
                            flex: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem',
                            padding: '0.625rem',
                            borderRadius: '0.75rem',
                            backgroundColor: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#64748b',
                            fontSize: '0.875rem',
                            fontWeight: '600',
                            transition: 'all 0.2s',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#f8fafc';
                            e.currentTarget.style.color = '#6366F1';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                            e.currentTarget.style.color = '#64748b';
                          }}
                        >
                          <span style={{ fontSize: '1.25rem' }}>🔗</span>
                          <span>공유</span>
                        </button>
                      </div>
                    </article>
                  );
                })}

                {/* 무한 스크롤 로딩 인디케이터 */}
                {loadingMore && (
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '2.5rem 0',
                    gap: '0.75rem',
                  }}>
                    <div className="spinner"></div>
                    <span style={{
                      fontSize: '0.875rem',
                      color: '#94a3b8',
                      fontWeight: '500',
                    }}>후기 더 불러오는 중...</span>
                  </div>
                )}

                {/* 무한 스크롤 타겟 */}
                <div ref={observerTarget} style={{ height: '4px' }}></div>
              </div>
            )}
          </main>
        </div>
      </div>
      <Footer />

      {/* 스피너 스타일 */}
      <style jsx>{`
        .spinner {
          border: 3px solid rgba(226, 232, 240, 0.3);
          border-radius: 50%;
          border-top: 3px solid #4ADE80;
          width: 28px;
          height: 28px;
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @media (min-width: 1024px) {
          .reviews-container {
            display: grid !important;
            grid-template-columns: 300px 1fr !important;
            gap: 2rem !important;
            align-items: start;
          }
          .reviews-sidebar {
            display: block !important;
            position: sticky;
            top: 2rem;
            align-self: start;
            height: fit-content;
          }
          .reviews-main {
            grid-column: 2;
            width: 100%;
          }
        }
        @media (min-width: 1280px) {
          .reviews-container {
            grid-template-columns: 350px 1fr !important;
          }
        }
      `}</style>
    </main>
  );
}
