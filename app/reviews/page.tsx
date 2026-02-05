'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { FaHeart } from 'react-icons/fa';
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

// 별점 렌더링
const renderStars = (rating: number) => {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
  
  return (
    <div className="flex text-primary">
      {Array.from({ length: fullStars }).map((_, i) => (
        <span key={i} className="material-icons-round text-sm">star</span>
      ))}
      {hasHalfStar && <span className="material-icons-round text-sm">star_half</span>}
      {Array.from({ length: emptyStars }).map((_, i) => (
        <span key={i} className="material-icons-round text-sm text-slate-300 dark:text-slate-600">star</span>
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
    setPage(1);
    setReviews([]);
    setHasMore(true);
    loadReviews(1, false);
  }, [sortBy, searchQuery]);

  // 무한 스크롤
  useEffect(() => {
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
      'from-indigo-500 to-purple-600',
      'from-primary to-teal-500',
      'from-pink-500 to-rose-600',
      'from-blue-500 to-cyan-600',
      'from-emerald-500 to-green-600',
      'from-amber-500 to-orange-600',
      'from-violet-500 to-purple-600',
      'from-cyan-500 to-blue-600',
    ];
    return gradients[id % gradients.length];
  };

  return (
    <main id="top" className="bg-background-light dark:bg-background-dark min-h-screen">
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-indigo-900 dark:text-white mb-1 tracking-tight">
              마인드가든 후기 피드
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              실시간으로 업데이트되는 내담자들의 생생한 후기를 확인하세요.
            </p>
          </div>
          <Link
            href="/reviews/new"
            className="flex items-center gap-2 bg-indigo-900 hover:bg-indigo-800 text-white px-5 py-2.5 rounded-xl shadow-lg hover:shadow-indigo-900/30 transition-all transform hover:-translate-y-0.5 font-medium text-sm"
          >
            <span className="material-icons-round text-primary text-lg">edit</span>
            후기 작성하기
          </Link>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* 사이드바 */}
          <aside className="hidden lg:block lg:col-span-4 xl:col-span-3 lg:sticky lg:top-8 space-y-5">
            {/* 평균 만족도 카드 */}
            {stats && stats.ratingStats.overall.count > 0 && (
              <div className="bg-indigo-900 rounded-3xl p-6 text-white relative overflow-hidden shadow-card hover:shadow-glow transition-shadow duration-300">
                <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-primary opacity-20 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-32 h-32 bg-indigo-500 opacity-20 rounded-full blur-3xl"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-indigo-200 text-xs font-semibold tracking-wider uppercase">
                      전체 평균 만족도
                    </p>
                    <span className="bg-indigo-800/50 text-indigo-100 text-[10px] px-2 py-0.5 rounded-full border border-indigo-700">
                      Monthly
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2 mb-3">
                    <span className="text-5xl font-bold tracking-tight text-white">
                      {stats.ratingStats.overall.average.toFixed(1)}
                    </span>
                    <span className="text-lg text-indigo-300">/ 5.0</span>
                  </div>
                  <div className="flex gap-1 mb-4 text-primary">
                    {Array.from({ length: 5 }).map((_, i) => {
                      const rating = stats.ratingStats.overall.average;
                      if (i < Math.floor(rating)) {
                        return <span key={i} className="material-icons-round text-xl">star</span>;
                      } else if (i === Math.floor(rating) && rating % 1 >= 0.5) {
                        return <span key={i} className="material-icons-round text-xl">star_half</span>;
                      } else {
                        return <span key={i} className="material-icons-round text-xl text-indigo-700">star</span>;
                      }
                    })}
                  </div>
                  <div className="h-px bg-indigo-800 my-4"></div>
                  <div className="flex justify-between text-xs text-indigo-200 font-medium">
                    <span>총 누적 후기</span>
                    <span className="text-white">{stats.totalReviews.toLocaleString()}건</span>
                  </div>
                </div>
              </div>
            )}

            {/* 평가 상세 */}
            {stats && (
              <div className="bg-surface-light dark:bg-surface-dark p-5 rounded-3xl shadow-card border border-slate-200 dark:border-slate-700">
                <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                  <span className="material-icons-round text-indigo-600 dark:text-primary text-base">pie_chart</span>
                  평가 상세
                </h3>
                <div className="space-y-4">
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
                      const percentage = (stat.average / 5) * 100;
                      return (
                        <div key={key} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                            <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                              {labels[key] || key}
                            </span>
                          </div>
                          <div className="w-32 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-indigo-500"
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                          <span className="text-xs font-bold text-slate-800 dark:text-white">
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
              <div className="bg-surface-light dark:bg-surface-dark p-5 rounded-3xl shadow-card border border-slate-200 dark:border-slate-700">
                <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                  <span className="material-icons-round text-indigo-600 dark:text-primary text-base">tag</span>
                  인기 키워드
                </h3>
                <div className="flex flex-wrap gap-2">
                  {stats.tagCounts.slice(0, 8).map(({ tag, count }) => (
                    <span
                      key={tag}
                      className="bg-indigo-50 dark:bg-indigo-900/40 text-indigo-900 dark:text-indigo-200 px-3 py-1.5 rounded-lg text-xs font-medium border border-indigo-100 dark:border-indigo-800 hover:border-indigo-300 transition-colors cursor-pointer"
                    >
                      <span className="text-primary font-bold">#</span>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </aside>

          {/* 메인 콘텐츠 */}
          <main className="lg:col-span-8 xl:col-span-9 flex flex-col gap-6">
            {/* 필터 및 검색 */}
            <div className="bg-surface-light dark:bg-surface-dark p-2 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-sm border border-slate-200 dark:border-slate-700 sticky top-4 z-40 backdrop-blur-md bg-opacity-95 dark:bg-opacity-95">
              <div className="flex items-center gap-1.5 px-1">
                <button
                  onClick={() => {
                    setSortBy('latest');
                    setPage(1);
                  }}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                    sortBy === 'latest'
                      ? 'bg-indigo-900 text-white shadow-md'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  최신순
                </button>
                <button
                  onClick={() => {
                    setSortBy('ratingHigh');
                    setPage(1);
                  }}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    sortBy === 'ratingHigh'
                      ? 'bg-indigo-900 text-white shadow-md'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  별점 높은순
                </button>
                <button
                  onClick={() => {
                    setSortBy('ratingLow');
                    setPage(1);
                  }}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    sortBy === 'ratingLow'
                      ? 'bg-indigo-900 text-white shadow-md'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  별점 낮은순
                </button>
              </div>
              <form onSubmit={handleSearch} className="relative w-full sm:w-auto px-1">
                <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                  <span className="material-icons-round text-lg">search</span>
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="키워드 검색"
                  className="w-full sm:w-60 pl-10 pr-4 py-2 rounded-xl border-none bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white shadow-inner ring-1 ring-slate-200 dark:ring-slate-700 focus:ring-2 focus:ring-primary text-sm placeholder-slate-400 transition-shadow"
                />
              </form>
            </div>

            {/* 후기 목록 */}
            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-xl border border-red-200 dark:border-red-800">
                {error}
              </div>
            )}

            {loading && reviews.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <div className="spinner"></div>
                <span className="text-sm text-slate-400 font-medium animate-pulse">후기를 불러오는 중...</span>
              </div>
            ) : reviews.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-slate-500 dark:text-slate-400 mb-4">등록된 후기가 없습니다.</p>
                <Link
                  href="/reviews/new"
                  className="inline-block px-5 py-2.5 bg-indigo-900 hover:bg-indigo-800 text-white rounded-xl font-medium transition-all"
                >
                  첫 후기 작성하기
                </Link>
              </div>
            ) : (
              <div className="space-y-6">
                {reviews.map((review) => {
                  const randomName = getRandomName(review.id);
                  const isNew = new Date(review.createdAt).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000;
                  
                  return (
                    <article
                      key={review.id}
                      id={`review-${review.id}`}
                      className="group bg-surface-light dark:bg-surface-dark p-6 sm:p-8 rounded-3xl shadow-card hover:shadow-card-hover border border-slate-100 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-800 transition-all duration-300"
                    >
                      <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center gap-4">
                          <div className="relative">
                            <div
                              className={`h-14 w-14 rounded-2xl bg-gradient-to-br ${getAvatarGradient(review.id)} flex items-center justify-center text-white font-bold text-xl shadow-lg`}
                            >
                              {randomName.charAt(0)}
                            </div>
                            {isNew && (
                              <div className="absolute -top-2 -right-2 bg-primary text-indigo-900 text-[10px] font-bold px-2 py-0.5 rounded-full border-2 border-white dark:border-slate-800 shadow-sm">
                                NEW
                              </div>
                            )}
                          </div>
                          <div>
                            <h3 className="font-bold text-slate-900 dark:text-white text-lg group-hover:text-indigo-700 dark:group-hover:text-primary transition-colors">
                              {getPreviewText(review.content, 30)} - {review.tags?.[0] || '후기'}
                            </h3>
                            <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">
                              <span>
                                {new Date(review.createdAt).toLocaleDateString('ko-KR', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric',
                                })}
                              </span>
                              <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                              <span className="flex items-center gap-1">
                                <span className="material-icons-round text-[14px]">verified</span>
                                {randomName}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 평가 점수 */}
                      {review.ratings && Object.values(review.ratings).some(r => r && r > 0) && (
                        <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl mb-6 grid grid-cols-2 sm:grid-cols-4 gap-4 border border-slate-100 dark:border-slate-700/50">
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
                                <div key={key} className="flex flex-col gap-1.5">
                                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                                    {labels[key] || key}
                                  </span>
                                  {renderStars(value)}
                                </div>
                              );
                            })}
                        </div>
                      )}

                      {/* 후기 내용 */}
                      <div className="mb-6 px-1">
                        <p
                          className="text-slate-700 dark:text-slate-300 text-[15px] leading-relaxed whitespace-pre-line"
                          dangerouslySetInnerHTML={{ __html: review.content }}
                        />
                        {review.tags && review.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-5">
                            {review.tags.map((tag, idx) => (
                              <span
                                key={idx}
                                className="px-3 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs font-bold border border-indigo-100 dark:border-indigo-800"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* 액션 버튼 */}
                      <div className="flex items-center gap-4 border-t border-slate-100 dark:border-slate-800 pt-5">
                        <button
                          onClick={() => handleLike(review.id)}
                          disabled={likedReviews.has(review.id)}
                          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all group/btn ${
                            likedReviews.has(review.id)
                              ? 'text-red-500'
                              : 'text-slate-500 hover:text-indigo-600 dark:hover:text-primary'
                          }`}
                        >
                          <FaHeart
                            className={`text-[20px] group-hover/btn:scale-110 transition-transform ${
                              likedReviews.has(review.id) ? 'fill-current' : ''
                            }`}
                          />
                          <span className="text-sm font-semibold">
                            좋아요 <span className="text-xs font-normal ml-0.5">{likeCounts[review.id] || review.likeCount || 0}</span>
                          </span>
                        </button>
                        <button
                          onClick={() => handleShare('kakao', review.id)}
                          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 hover:text-indigo-600 dark:hover:text-primary transition-all group/btn"
                        >
                          <span className="material-icons-round text-[20px] group-hover/btn:scale-110 transition-transform">chat_bubble_outline</span>
                          <span className="text-sm font-semibold">댓글</span>
                        </button>
                        <button
                          onClick={() => handleShare('link', review.id)}
                          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 hover:text-indigo-600 dark:hover:text-primary transition-all group/btn"
                        >
                          <span className="material-icons-round text-[20px] group-hover/btn:scale-110 transition-transform">share</span>
                          <span className="text-sm font-semibold">공유</span>
                        </button>
                      </div>
                    </article>
                  );
                })}

                {/* 무한 스크롤 로딩 인디케이터 */}
                {loadingMore && (
                  <div className="flex flex-col items-center justify-center py-10 gap-3">
                    <div className="spinner"></div>
                    <span className="text-sm text-slate-400 font-medium animate-pulse">후기 더 불러오는 중...</span>
                  </div>
                )}

                {/* 무한 스크롤 타겟 */}
                <div ref={observerTarget} className="h-1"></div>
              </div>
            )}
          </main>
        </div>
      </div>
      <Footer />

      {/* Material Icons 및 스타일 */}
      <link href="https://fonts.googleapis.com/icon?family=Material+Icons+Round" rel="stylesheet" />
      <style jsx global>{`
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
        .bg-background-light {
          background-color: #F8FAFC;
        }
        .dark .bg-background-dark {
          background-color: #0F172A;
        }
        .bg-surface-light {
          background-color: #ffffff;
        }
        .dark .bg-surface-dark {
          background-color: #1e293b;
        }
        .text-primary {
          color: #4ADE80;
        }
        .shadow-card {
          box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
        }
        .shadow-card-hover {
          box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
        }
        .shadow-glow {
          box-shadow: 0 0 20px rgba(74, 222, 128, 0.25);
        }
      `}</style>
    </main>
  );
}
