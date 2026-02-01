'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminNavigation from '@/components/AdminNavigation';

interface Review {
  id: number;
  authorName: string;
  content: string;
  isApproved: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function ReviewsAdminPage() {
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/blog/auth');
        const data = await response.json();
        
        if (data.authenticated) {
          setAuthenticated(true);
          loadReviews();
        } else {
          setAuthenticated(false);
          router.push('/admin/login');
        }
      } catch (err) {
        console.error('Auth check error:', err);
        setAuthenticated(false);
        router.push('/admin/login');
      }
    };

    checkAuth();
  }, [router, page]);

  const loadReviews = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/admin/reviews?page=${page}&limit=20`);
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

  const handleDelete = async (id: number) => {
    if (!confirm('정말 이 후기를 삭제하시겠습니까?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/reviews/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        loadReviews();
        alert('후기가 삭제되었습니다.');
      } else {
        setError(data.error || '후기 삭제에 실패했습니다.');
      }
    } catch (err) {
      console.error('Delete error:', err);
      setError('후기 삭제에 실패했습니다.');
    }
  };

  if (authenticated === null || loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p>로딩 중...</p>
      </div>
    );
  }

  if (!authenticated) {
    return null;
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', padding: '2rem' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: '700', color: '#1f2937' }}>
              후기 관리
            </h1>
          </div>
          <AdminNavigation />
          <p style={{ color: '#6b7280', marginTop: '1rem' }}>
            등록된 후기를 관리합니다.
          </p>
        </div>

        {error && (
          <div style={{
            padding: '1rem',
            marginBottom: '1.5rem',
            backgroundColor: '#fee2e2',
            color: '#991b1b',
            borderRadius: '0.5rem',
            border: '1px solid #fecaca',
          }}>
            {error}
          </div>
        )}

        {reviews.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '3rem',
            backgroundColor: 'white',
            borderRadius: '0.75rem',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          }}>
            <p style={{ color: '#6b7280' }}>등록된 후기가 없습니다.</p>
          </div>
        ) : (
          <>
            <div style={{ display: 'grid', gap: '1.5rem', marginBottom: '2rem' }}>
              {reviews.map((review) => (
                <div
                  key={review.id}
                  style={{
                    backgroundColor: 'white',
                    padding: '1.5rem',
                    borderRadius: '0.75rem',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                    border: '1px solid #e5e7eb',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <div>
                      <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1f2937', marginBottom: '0.25rem' }}>
                        {review.authorName}
                      </h3>
                      <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                        {new Date(review.createdAt).toLocaleDateString('ko-KR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDelete(review.id)}
                      style={{
                        padding: '0.5rem 1rem',
                        backgroundColor: '#ef4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.5rem',
                        fontSize: '0.875rem',
                        cursor: 'pointer',
                        fontWeight: '500',
                      }}
                    >
                      삭제
                    </button>
                  </div>
                  <div
                    style={{
                      color: '#1f2937',
                      lineHeight: '1.8',
                      fontSize: '1rem',
                      marginBottom: '1rem',
                    }}
                    dangerouslySetInnerHTML={{ __html: review.content }}
                  />
                  <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                    상태: {review.isApproved ? '승인됨' : '대기 중'}
                  </div>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: page === 1 ? '#f3f4f6' : 'white',
                    color: page === 1 ? '#9ca3af' : '#1f2937',
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    cursor: page === 1 ? 'not-allowed' : 'pointer',
                  }}
                >
                  이전
                </button>
                <span style={{ padding: '0.5rem 1rem', color: '#6b7280', fontSize: '0.875rem' }}>
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: page === totalPages ? '#f3f4f6' : 'white',
                    color: page === totalPages ? '#9ca3af' : '#1f2937',
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    cursor: page === totalPages ? 'not-allowed' : 'pointer',
                  }}
                >
                  다음
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
