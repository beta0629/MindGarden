'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import BlogEditor from '@/components/BlogEditor';
import { FaFacebook, FaTwitter, FaInstagram, FaLink } from 'react-icons/fa';
import KakaoIcon from '@/components/KakaoIcon';

// 이미지를 base64로 변환하는 헬퍼 함수
const convertImageToBase64 = (file: File, maxWidth: number = 1200, maxHeight: number = 675, quality: number = 0.75): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (file.size > 10 * 1024 * 1024) {
      reject(new Error('이미지 크기는 10MB 이하여야 합니다.'));
      return;
    }

    if (!file.type.startsWith('image/')) {
      reject(new Error('이미지 파일만 업로드 가능합니다.'));
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        if (ratio < 1) {
          width = width * ratio;
          height = height * ratio;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context를 가져올 수 없습니다.'));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const base64 = canvas.toDataURL('image/jpeg', quality);
        const base64Size = (base64.length * 3) / 4;
        if (base64Size > 2 * 1024 * 1024) {
          reject(new Error('이미지가 너무 큽니다. 더 작은 이미지를 사용해주세요.'));
          return;
        }
        resolve(base64);
      };
      img.onerror = () => reject(new Error('이미지를 로드할 수 없습니다.'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('파일을 읽을 수 없습니다.'));
    reader.readAsDataURL(file);
  });
};

interface Review {
  id: number;
  authorName: string;
  content: string;
  likeCount?: number;
  createdAt: string;
  updatedAt: string;
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [password, setPassword] = useState('');
  const [editContent, setEditContent] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [likeCounts, setLikeCounts] = useState<Record<number, number>>({});
  const [likedReviews, setLikedReviews] = useState<Set<number>>(new Set());

  // 초기 좋아요 수 설정
  useEffect(() => {
    const initialCounts: Record<number, number> = {};
    reviews.forEach((review) => {
      initialCounts[review.id] = review.likeCount || 0;
    });
    setLikeCounts(initialCounts);
  }, [reviews]);

  useEffect(() => {
    loadReviews();
  }, [page]);

  const loadReviews = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/reviews?page=${page}&limit=10`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API response error:', response.status, errorText);
        setError(`서버 오류 (${response.status}): 후기 목록을 불러오는데 실패했습니다.`);
        return;
      }

      const data = await response.json();
      console.log('Reviews API response:', data);

      if (data.success) {
        setReviews(data.reviews || []);
        setTotalPages(data.pagination?.totalPages || 1);
      } else {
        setError(data.error || '후기 목록을 불러오는데 실패했습니다.');
        if (data.details) {
          console.error('Error details:', data.details);
        }
      }
    } catch (err) {
      console.error('Load reviews error:', err);
      setError(`네트워크 오류: 후기 목록을 불러오는데 실패했습니다. ${err instanceof Error ? err.message : ''}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (review: Review) => {
    setEditingId(review.id);
    setEditContent(review.content);
    setPassword('');
    setPasswordError(null);
  };

  // BlogEditor에서 이미지 업로드 시 base64로 변환
  const handleBlogEditorImageUpload = useCallback(async (file: File): Promise<{ imageUrl: string }> => {
    const base64 = await convertImageToBase64(file);
    return { imageUrl: base64 };
  }, []);

  const handleDelete = (id: number) => {
    setDeletingId(id);
    setPassword('');
    setPasswordError(null);
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
        // 카카오톡 공유
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
        // 인스타그램 공유
        if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
          window.open(
            `instagram://share?url=${encodeURIComponent(shareUrl)}`,
            '_blank'
          );
        } else {
          window.open('https://www.instagram.com/', '_blank');
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

  const handleEditSubmit = async () => {
    if (!password) {
      setPasswordError('비밀번호를 입력해주세요.');
      return;
    }

    if (!editContent.trim()) {
      setPasswordError('후기 내용을 입력해주세요.');
      return;
    }

    try {
      const response = await fetch(`/api/reviews/${editingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: editContent,
          password: password,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setEditingId(null);
        setPassword('');
        setEditContent('');
        setPasswordError(null);
        loadReviews();
        alert('후기가 수정되었습니다.');
      } else {
        setPasswordError(data.error || '후기 수정에 실패했습니다.');
      }
    } catch (err) {
      console.error('Edit error:', err);
      setPasswordError('후기 수정에 실패했습니다.');
    }
  };

  const handleDeleteSubmit = async () => {
    if (!password) {
      setPasswordError('비밀번호를 입력해주세요.');
      return;
    }

    try {
      const response = await fetch(`/api/reviews/${deletingId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          password: password,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setDeletingId(null);
        setPassword('');
        setPasswordError(null);
        loadReviews();
        alert('후기가 삭제되었습니다.');
      } else {
        setPasswordError(data.error || '후기 삭제에 실패했습니다.');
      }
    } catch (err) {
      console.error('Delete error:', err);
      setPasswordError('후기 삭제에 실패했습니다.');
    }
  };

  return (
    <main id="top">
      <Navigation />
      <div className="content-shell">
        <div className="content-main">
          <section className="content-section" style={{ maxWidth: '900px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h2 className="section-title" style={{ margin: 0 }}>
                마인드가든 후기
              </h2>
              <Link
                href="/reviews/new"
                style={{
                  padding: '0.75rem 1.5rem',
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
                후기 작성하기
              </Link>
            </div>

            {error && (
              <div style={{
                padding: '1rem',
                marginBottom: '1.5rem',
                backgroundColor: '#fee2e2',
                color: '#991b1b',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid #fecaca',
              }}>
                {error}
              </div>
            )}

            {loading ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-sub)' }}>
                로딩 중...
              </div>
            ) : reviews.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '3rem',
                backgroundColor: 'var(--surface-0)',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-1)',
                border: '1px solid var(--border-soft)',
              }}>
                <p style={{ color: 'var(--text-sub)', marginBottom: '1rem' }}>
                  아직 등록된 후기가 없습니다.
                </p>
                <Link
                  href="/reviews/new"
                  style={{
                    display: 'inline-block',
                    padding: '0.75rem 1.5rem',
                    background: 'linear-gradient(135deg, var(--accent-sky) 0%, var(--accent-mint) 100%)',
                    color: 'var(--text-main)',
                    textDecoration: 'none',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '1rem',
                    fontWeight: '600',
                  }}
                >
                  첫 후기 작성하기
                </Link>
              </div>
            ) : (
              <>
                <div style={{ display: 'grid', gap: '1.5rem', marginBottom: '2rem' }}>
                  {reviews.map((review) => (
                    <div
                      key={review.id}
                      style={{
                        backgroundColor: 'var(--surface-0)',
                        padding: '2rem',
                        borderRadius: 'var(--radius-md)',
                        boxShadow: 'var(--shadow-1)',
                        border: '1px solid var(--border-soft)',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.boxShadow = 'var(--shadow-2)';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.boxShadow = 'var(--shadow-1)';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <div>
                          <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-main)', marginBottom: '0.25rem' }}>
                            {review.authorName}
                          </h3>
                          <p style={{ fontSize: '0.875rem', color: 'var(--text-sub)' }}>
                            {new Date(review.createdAt).toLocaleDateString('ko-KR', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </p>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            onClick={() => handleEdit(review)}
                            style={{
                              padding: '0.5rem 1rem',
                              backgroundColor: 'var(--accent-sky)',
                              color: 'var(--text-main)',
                              border: 'none',
                              borderRadius: 'var(--radius-sm)',
                              fontSize: '0.875rem',
                              cursor: 'pointer',
                              fontWeight: '500',
                            }}
                          >
                            수정
                          </button>
                          <button
                            onClick={() => handleDelete(review.id)}
                            style={{
                              padding: '0.5rem 1rem',
                              backgroundColor: '#ef4444',
                              color: 'white',
                              border: 'none',
                              borderRadius: 'var(--radius-sm)',
                              fontSize: '0.875rem',
                              cursor: 'pointer',
                              fontWeight: '500',
                            }}
                          >
                            삭제
                          </button>
                        </div>
                      </div>
                      <div
                        style={{
                          color: 'var(--text-main)',
                          lineHeight: '1.8',
                          fontSize: '1rem',
                          marginBottom: '1.5rem',
                        }}
                        dangerouslySetInnerHTML={{ __html: review.content }}
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
                          onClick={() => handleLike(review.id)}
                          disabled={likedReviews.has(review.id)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.5rem 1rem',
                            backgroundColor: likedReviews.has(review.id)
                              ? 'rgba(239, 68, 68, 0.1)'
                              : 'transparent',
                            border: `1px solid ${likedReviews.has(review.id) ? '#ef4444' : 'var(--border-soft)'}`,
                            borderRadius: 'var(--radius-sm)',
                            color: likedReviews.has(review.id) ? '#ef4444' : 'var(--text-sub)',
                            cursor: likedReviews.has(review.id) ? 'default' : 'pointer',
                            fontSize: '0.9rem',
                            fontWeight: '600',
                            transition: 'all 0.2s',
                          }}
                          onMouseEnter={(e) => {
                            if (!likedReviews.has(review.id)) {
                              e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.05)';
                              e.currentTarget.style.borderColor = '#ef4444';
                              e.currentTarget.style.color = '#ef4444';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!likedReviews.has(review.id)) {
                              e.currentTarget.style.backgroundColor = 'transparent';
                              e.currentTarget.style.borderColor = 'var(--border-soft)';
                              e.currentTarget.style.color = 'var(--text-sub)';
                            }
                          }}
                        >
                          <span style={{ fontSize: '1.2rem' }}>
                            {likedReviews.has(review.id) ? '❤️' : '🤍'}
                          </span>
                          <span>{likeCounts[review.id] || review.likeCount || 0}</span>
                        </button>

                        {/* SNS 공유 버튼 */}
                        <div style={{
                          display: 'flex',
                          gap: '0.5rem',
                          alignItems: 'center',
                        }}>
                          <button
                            onClick={() => handleShare('kakao', review.id)}
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
                            onClick={() => handleShare('facebook', review.id)}
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
                            onClick={() => handleShare('twitter', review.id)}
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
                            onClick={() => handleShare('instagram', review.id)}
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
                            onClick={() => handleShare('link', review.id)}
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
                  ))}
                </div>

                {totalPages > 1 && (
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '2rem' }}>
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      style={{
                        padding: '0.5rem 1rem',
                        backgroundColor: page === 1 ? 'var(--bg-light)' : 'var(--surface-0)',
                        color: page === 1 ? 'var(--text-light)' : 'var(--text-main)',
                        border: '1px solid var(--border-soft)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.875rem',
                        cursor: page === 1 ? 'not-allowed' : 'pointer',
                        fontFamily: 'var(--font-main)',
                      }}
                    >
                      이전
                    </button>
                    <span style={{
                      padding: '0.5rem 1rem',
                      color: 'var(--text-sub)',
                      fontSize: '0.875rem',
                    }}>
                      {page} / {totalPages}
                    </span>
                    <button
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      style={{
                        padding: '0.5rem 1rem',
                        backgroundColor: page === totalPages ? 'var(--bg-light)' : 'var(--surface-0)',
                        color: page === totalPages ? 'var(--text-light)' : 'var(--text-main)',
                        border: '1px solid var(--border-soft)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.875rem',
                        cursor: page === totalPages ? 'not-allowed' : 'pointer',
                        fontFamily: 'var(--font-main)',
                      }}
                    >
                      다음
                    </button>
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      </div>
      <Footer />

      {/* 수정 모달 */}
      {editingId && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setEditingId(null);
              setPassword('');
              setEditContent('');
              setPasswordError(null);
            }
          }}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: 'var(--radius-md)',
              padding: '2rem',
              maxWidth: '800px',
              width: '100%',
              maxHeight: '90vh',
              overflow: 'auto',
              boxShadow: 'var(--shadow-2)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1.5rem' }}>
              후기 수정
            </h3>
            {passwordError && (
              <div style={{
                padding: '1rem',
                marginBottom: '1rem',
                backgroundColor: '#fee2e2',
                color: '#991b1b',
                borderRadius: 'var(--radius-sm)',
              }}>
                {passwordError}
              </div>
            )}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                후기 내용 *
              </label>
              <BlogEditor
                value={editContent}
                onChange={setEditContent}
                onImageUpload={handleBlogEditorImageUpload}
                placeholder="후기를 수정해주세요..."
              />
            </div>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                비밀번호 *
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호를 입력하세요"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid var(--border-soft)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '1rem',
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setEditingId(null);
                  setPassword('');
                  setEditContent('');
                  setPasswordError(null);
                }}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: 'transparent',
                  color: 'var(--text-sub)',
                  border: '1px solid var(--border-soft)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '1rem',
                  cursor: 'pointer',
                }}
              >
                취소
              </button>
              <button
                onClick={handleEditSubmit}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: 'linear-gradient(135deg, var(--accent-sky) 0%, var(--accent-mint) 100%)',
                  color: 'var(--text-main)',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                수정하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 삭제 모달 */}
      {deletingId && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setDeletingId(null);
              setPassword('');
              setPasswordError(null);
            }
          }}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: 'var(--radius-md)',
              padding: '2rem',
              maxWidth: '400px',
              width: '100%',
              boxShadow: 'var(--shadow-2)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem' }}>
              후기 삭제
            </h3>
            <p style={{ color: 'var(--text-sub)', marginBottom: '1.5rem' }}>
              정말 이 후기를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </p>
            {passwordError && (
              <div style={{
                padding: '1rem',
                marginBottom: '1rem',
                backgroundColor: '#fee2e2',
                color: '#991b1b',
                borderRadius: 'var(--radius-sm)',
              }}>
                {passwordError}
              </div>
            )}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                비밀번호 *
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호를 입력하세요"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid var(--border-soft)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '1rem',
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setDeletingId(null);
                  setPassword('');
                  setPasswordError(null);
                }}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: 'transparent',
                  color: 'var(--text-sub)',
                  border: '1px solid var(--border-soft)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '1rem',
                  cursor: 'pointer',
                }}
              >
                취소
              </button>
              <button
                onClick={handleDeleteSubmit}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                삭제하기
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
