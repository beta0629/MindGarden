'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

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
        // 카카오톡 공유 (카카오 SDK 필요 시 추가)
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
          // 카카오톡 링크로 공유
          window.open(
            `https://talk.kakao.com/share?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`,
            '_blank'
          );
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
        window.open(
          `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`,
          '_blank',
          'width=600,height=400'
        );
        break;
      case 'instagram':
        // 인스타그램 공유 (모바일 앱 또는 웹)
        if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
          // 모바일: 인스타그램 앱으로 공유 (스토리 또는 피드)
          window.open(
            `instagram://share?url=${encodeURIComponent(shareUrl)}`,
            '_blank'
          );
        } else {
          // 데스크톱: 인스타그램 웹으로 이동
          window.open(
            'https://www.instagram.com/',
            '_blank'
          );
          // 데스크톱에서는 사용자가 직접 복사하여 공유해야 함
          if (navigator.clipboard) {
            navigator.clipboard.writeText(shareText + '\n' + shareUrl).then(() => {
              alert('인스타그램에 공유할 내용이 클립보드에 복사되었습니다!');
            });
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
              marginBottom: '1.5rem',
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
                💬
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
                📘
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
                🐦
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
                📷
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
                🔗
              </button>
            </div>
          </div>
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
