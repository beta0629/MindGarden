'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { FaFacebook, FaTwitter, FaInstagram, FaLink } from 'react-icons/fa';
import KakaoIcon from './KakaoIcon';

interface Review {
  id: number;
  authorName: string;
  content: string;
  likeCount?: number;
  createdAt: string;
}

interface ReviewsCarouselProps {
  reviews: Review[];
}

export default function ReviewsCarousel({ reviews }: ReviewsCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [likeCounts, setLikeCounts] = useState<Record<number, number>>({});
  const [likedReviews, setLikedReviews] = useState<Set<number>>(new Set());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // 터치 스와이프 관련 상태
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const touchEndY = useRef<number | null>(null);

  // 초기 좋아요 수 설정
  useEffect(() => {
    const initialCounts: Record<number, number> = {};
    reviews.forEach((review) => {
      initialCounts[review.id] = review.likeCount || 0;
    });
    setLikeCounts(initialCounts);
  }, [reviews]);

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
    if (reviews.length <= 1) return;
    
    const deltaX = touchStartX.current - touchEndX.current;
    const deltaY = touchStartY.current - touchEndY.current;
    const minSwipeDistance = 50; // 최소 스와이프 거리
    
    // 수평 스와이프가 수직 스와이프보다 큰 경우에만 처리
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > minSwipeDistance) {
      if (deltaX > 0) {
        // 왼쪽으로 스와이프 (다음 후기)
        setCurrentIndex((prev) => (prev + 1) % reviews.length);
        setIsAutoPlaying(false);
        setTimeout(() => setIsAutoPlaying(true), 3000);
      } else {
        // 오른쪽으로 스와이프 (이전 후기)
        setCurrentIndex((prev) => (prev - 1 + reviews.length) % reviews.length);
        setIsAutoPlaying(false);
        setTimeout(() => setIsAutoPlaying(true), 3000);
      }
    }
    
    // 리셋
    touchStartX.current = null;
    touchStartY.current = null;
    touchEndX.current = null;
    touchEndY.current = null;
  };

  // 좋아요 처리
  const handleLike = async (reviewId: number) => {
    if (likedReviews.has(reviewId)) {
      return; // 이미 좋아요를 누른 경우
    }

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

  // SNS 공유
  const handleShare = (platform: string, reviewId: number) => {
    const review = reviews.find((r) => r.id === reviewId);
    if (!review) return;

    const url = typeof window !== 'undefined' ? window.location.origin : '';
    const shareUrl = `${url}/reviews#review-${reviewId}`;
    const shareText = `${review.authorName}님의 후기 - 마인드가든`;
    const shareContent = review.content.replace(/<[^>]*>/g, '').substring(0, 100) + '...';

    switch (platform) {
      case 'kakao':
        // 카카오톡 공유 (카카오 SDK 사용)
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
          // 카카오 SDK가 없으면 링크 복사 후 안내
          if (navigator.clipboard) {
            navigator.clipboard.writeText(shareText + '\n' + shareUrl).then(() => {
              alert('카카오톡에 공유할 내용이 클립보드에 복사되었습니다!\n카카오톡에서 붙여넣기하여 공유해주세요.');
            });
          } else {
            alert(`카카오톡 공유:\n${shareText}\n${shareUrl}\n\n위 내용을 복사하여 카카오톡에서 공유해주세요.`);
          }
        }
        break;
      case 'facebook':
        window.open(
          `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
          '_blank',
          'width=600,height=400'
        );
        break;
      case 'twitter':
        // 트위터/X 공유 (공식 URL 형식)
        window.open(
          `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}&via=mindgarden`,
          '_blank',
          'width=600,height=400'
        );
        break;
      case 'instagram':
        // 인스타그램 공유 (인스타그램은 웹에서 직접 공유 링크를 지원하지 않음)
        if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
          // 모바일: 인스타그램 앱 스토리 공유 (URL 스키마 사용)
          // 참고: 인스타그램은 직접 URL 공유를 지원하지 않으므로 클립보드 복사
          if (navigator.clipboard) {
            navigator.clipboard.writeText(shareText + '\n' + shareUrl).then(() => {
              alert('인스타그램에 공유할 내용이 클립보드에 복사되었습니다!\n인스타그램 앱에서 붙여넣기하여 공유해주세요.');
              // 인스타그램 앱 열기 시도
              window.open('instagram://', '_blank');
            });
          } else {
            alert(`인스타그램 공유:\n${shareText}\n${shareUrl}\n\n위 내용을 복사하여 인스타그램에서 공유해주세요.`);
          }
        } else {
          // 데스크톱: 클립보드 복사 후 안내
          if (navigator.clipboard) {
            navigator.clipboard.writeText(shareText + '\n' + shareUrl).then(() => {
              alert('인스타그램에 공유할 내용이 클립보드에 복사되었습니다!\n인스타그램 웹에서 붙여넣기하여 공유해주세요.');
              window.open('https://www.instagram.com/', '_blank');
            });
          } else {
            alert(`인스타그램 공유:\n${shareText}\n${shareUrl}\n\n위 내용을 복사하여 인스타그램에서 공유해주세요.`);
          }
        }
        break;
      case 'link':
        // 링크 복사
        if (navigator.clipboard) {
          navigator.clipboard.writeText(shareUrl).then(() => {
            alert('링크가 클립보드에 복사되었습니다!');
          });
        } else {
          // 폴백: 텍스트 영역 사용
          const textArea = document.createElement('textarea');
          textArea.value = shareUrl;
          document.body.appendChild(textArea);
          textArea.select();
          document.execCommand('copy');
          document.body.removeChild(textArea);
          alert('링크가 클립보드에 복사되었습니다!');
        }
        break;
    }
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
        minHeight: '600px', // 최소 높이 고정으로 레이아웃 시프트 방지
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
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{
            backgroundColor: 'var(--surface-0)',
            borderRadius: 'var(--radius-md)',
            padding: '2.5rem',
            boxShadow: 'var(--shadow-2)',
            border: '1px solid var(--border-soft)',
            height: '450px', // 고정 높이로 설정
            display: 'flex',
            flexDirection: 'column',
            animation: 'fadeInUp 0.5s ease',
            touchAction: 'pan-y pinch-zoom', // 수직 스크롤과 핀치 줌은 허용
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
              marginBottom: '1.5rem',
              overflowY: 'auto', // 내용이 길 경우 스크롤 가능
              maxHeight: '250px', // 최대 높이 제한
              paddingRight: '0.5rem', // 스크롤바 공간 확보
            }}
            dangerouslySetInnerHTML={{
              __html: processContent(currentReview.content),
            }}
          />

          {/* 좋아요 및 공유 버튼 */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: '1rem',
            borderTop: '1px solid var(--border-soft)',
            gap: '1rem',
            flexWrap: 'wrap',
          }}>
            {/* 좋아요 버튼 */}
            <button
              onClick={() => handleLike(currentReview.id)}
              disabled={likedReviews.has(currentReview.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 1rem',
                backgroundColor: likedReviews.has(currentReview.id)
                  ? 'rgba(239, 68, 68, 0.1)'
                  : 'transparent',
                border: `1px solid ${likedReviews.has(currentReview.id) ? '#ef4444' : 'var(--border-soft)'}`,
                borderRadius: 'var(--radius-sm)',
                color: likedReviews.has(currentReview.id) ? '#ef4444' : 'var(--text-sub)',
                cursor: likedReviews.has(currentReview.id) ? 'default' : 'pointer',
                fontSize: '0.9rem',
                fontWeight: '600',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                if (!likedReviews.has(currentReview.id)) {
                  e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.05)';
                  e.currentTarget.style.borderColor = '#ef4444';
                  e.currentTarget.style.color = '#ef4444';
                }
              }}
              onMouseLeave={(e) => {
                if (!likedReviews.has(currentReview.id)) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.borderColor = 'var(--border-soft)';
                  e.currentTarget.style.color = 'var(--text-sub)';
                }
              }}
            >
              <span style={{ fontSize: '1.2rem' }}>
                {likedReviews.has(currentReview.id) ? '❤️' : '🤍'}
              </span>
              <span>{likeCounts[currentReview.id] || currentReview.likeCount || 0}</span>
            </button>

            {/* SNS 공유 버튼 */}
            <div style={{
              display: 'flex',
              gap: '0.5rem',
              alignItems: 'center',
            }}>
                          <button
                            onClick={() => handleShare('kakao', currentReview.id)}
                            style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: '50%',
                              border: '1px solid var(--border-soft)',
                              backgroundColor: '#FEE500',
                              color: '#000',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '1.1rem',
                              transition: 'all 0.2s',
                            }}
                            title="카카오톡 공유"
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = 'scale(1.1)';
                              e.currentTarget.style.boxShadow = '0 2px 8px rgba(254, 229, 0, 0.4)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = 'scale(1)';
                              e.currentTarget.style.boxShadow = 'none';
                            }}
                          >
                            <KakaoIcon size={18} />
                          </button>
                          <button
                            onClick={() => handleShare('facebook', currentReview.id)}
                            style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: '50%',
                              border: '1px solid var(--border-soft)',
                              backgroundColor: '#1877F2',
                              color: '#fff',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '1.1rem',
                              transition: 'all 0.2s',
                            }}
                            title="페이스북 공유"
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = 'scale(1.1)';
                              e.currentTarget.style.boxShadow = '0 2px 8px rgba(24, 119, 242, 0.4)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = 'scale(1)';
                              e.currentTarget.style.boxShadow = 'none';
                            }}
                          >
                            <FaFacebook size={18} />
                          </button>
                          <button
                            onClick={() => handleShare('twitter', currentReview.id)}
                            style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: '50%',
                              border: '1px solid var(--border-soft)',
                              backgroundColor: '#1DA1F2',
                              color: '#fff',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '1.1rem',
                              transition: 'all 0.2s',
                            }}
                            title="트위터 공유"
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = 'scale(1.1)';
                              e.currentTarget.style.boxShadow = '0 2px 8px rgba(29, 161, 242, 0.4)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = 'scale(1)';
                              e.currentTarget.style.boxShadow = 'none';
                            }}
                          >
                            <FaTwitter size={18} />
                          </button>
                          <button
                            onClick={() => handleShare('instagram', currentReview.id)}
                            style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: '50%',
                              border: '1px solid var(--border-soft)',
                              background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)',
                              color: '#fff',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '1.1rem',
                              transition: 'all 0.2s',
                            }}
                            title="인스타그램 공유"
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = 'scale(1.1)';
                              e.currentTarget.style.boxShadow = '0 2px 8px rgba(188, 24, 136, 0.4)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = 'scale(1)';
                              e.currentTarget.style.boxShadow = 'none';
                            }}
                          >
                            <FaInstagram size={18} />
                          </button>
                          <button
                            onClick={() => handleShare('link', currentReview.id)}
                            style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: '50%',
                              border: '1px solid var(--border-soft)',
                              backgroundColor: 'var(--surface-1)',
                              color: 'var(--text-main)',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '1.1rem',
                              transition: 'all 0.2s',
                            }}
                            title="링크 복사"
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = 'scale(1.1)';
                              e.currentTarget.style.boxShadow = 'var(--shadow-1)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = 'scale(1)';
                              e.currentTarget.style.boxShadow = 'none';
                            }}
                          >
                            <FaLink size={16} />
                          </button>
            </div>
          </div>
        </div>
      </div>

      {/* 일시정지/재생 버튼 (웹 접근성) */}
      {reviews.length > 1 && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '1rem',
          marginTop: '2rem',
        }}>
          <button
            type="button"
            onClick={() => setIsAutoPlaying(!isAutoPlaying)}
            aria-label={isAutoPlaying ? '후기 자동 재생 일시정지' : '후기 자동 재생 시작'}
            style={{
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
            {isAutoPlaying ? '⏸' : '▶'}
          </button>

          {/* 네비게이션 도트 */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '0.5rem',
          }}>
            {reviews.map((_, index) => (
              <button
                key={index}
                type="button"
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
