'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import BlogEditor from '@/components/BlogEditor';

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

  useEffect(() => {
    loadReviews();
  }, [page]);

  const loadReviews = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/reviews?page=${page}&limit=10`);
      const data = await response.json();

      if (data.success) {
        setReviews(data.reviews || []);
        setTotalPages(data.pagination?.totalPages || 1);
      } else {
        setError('후기 목록을 불러오는데 실패했습니다.');
      }
    } catch (err) {
      console.error('Load reviews error:', err);
      setError('후기 목록을 불러오는데 실패했습니다.');
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
                        }}
                        dangerouslySetInnerHTML={{ __html: review.content }}
                      />
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
    </main>
  );
}
