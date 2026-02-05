'use client';

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
  // HTML 콘텐츠에서 텍스트만 추출 (미리보기용)
  const getPreviewText = (content: string, maxLength: number = 150) => {
    const text = content.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
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

      {/* 후기 그리드 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
        gap: '1.5rem',
        maxWidth: '1200px',
        margin: '0 auto',
      }}>
        {reviews.map((review) => (
          <Link
            key={review.id}
            href={`/reviews#review-${review.id}`}
            style={{
              textDecoration: 'none',
              color: 'inherit',
              display: 'block',
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
                transition: 'all 0.3s ease',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = 'var(--shadow-2)';
                e.currentTarget.style.borderColor = 'var(--accent-sky)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'var(--shadow-1)';
                e.currentTarget.style.borderColor = 'var(--border-soft)';
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
