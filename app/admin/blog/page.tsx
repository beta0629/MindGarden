'use client';

import { useState, useEffect } from 'react';
import { getApiService } from '@/lib/api';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AdminNavigation from '@/components/AdminNavigation';

interface BlogPost {
  id: number;
  title: string;
  summary: string | null;
  thumbnailImageUrl: string | null;
  publishedAt: string | null;
  createdAt: string;
  status: string;
  isHomepageOnly?: boolean;
}

export default function BlogAdminListPage() {
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 인증 상태 확인
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/blog/auth');
        const data = await response.json();
        
        if (data.authenticated) {
          setAuthenticated(true);
          loadPosts();
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
  }, [router]);

  const loadPosts = async () => {
    try {
      setLoading(true);
      const apiService = getApiService();
      // 관리자는 모든 상태의 포스트 조회 (draft 포함)
      const data = await apiService.getBlogPosts(1, 100, false, true);
      
      // 최신순 정렬 (published_at 우선, 없으면 created_at)
      const sortedPosts = Array.isArray(data) ? data : (data.posts || []);
      sortedPosts.sort((a: BlogPost, b: BlogPost) => {
        const aDate = a.publishedAt ? new Date(a.publishedAt).getTime() : new Date(a.createdAt).getTime();
        const bDate = b.publishedAt ? new Date(b.publishedAt).getTime() : new Date(b.createdAt).getTime();
        return bDate - aDate; // 내림차순 (최신순)
      });
      
      setPosts(sortedPosts);
    } catch (err) {
      setError('블로그 목록을 불러오는데 실패했습니다.');
      console.error('Load posts error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (postId: number, title: string) => {
    if (!confirm(`"${title}" 글을 정말 삭제하시겠습니까?`)) {
      return;
    }

    try {
      const apiService = getApiService();
      await apiService.deleteBlogPost(postId);
      setPosts(posts.filter(p => p.id !== postId));
      alert('글이 삭제되었습니다.');
    } catch (err) {
      alert('글 삭제에 실패했습니다.');
      console.error('Delete post error:', err);
    }
  };

  // 로그아웃 처리
  const handleLogout = async () => {
    try {
      await fetch('/api/blog/auth', { method: 'DELETE' });
      router.push('/admin/login');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  // 인증되지 않았으면 로딩 표시
  if (authenticated === null || loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>로딩 중...</p>
      </div>
    );
  }

  // 인증되지 않았으면 아무것도 렌더링하지 않음 (리다이렉트 중)
  if (!authenticated) {
    return null;
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
        {/* 헤더 */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h1 style={{ fontSize: '1.875rem', fontWeight: '700', color: '#1f2937' }}>
              블로그 관리
            </h1>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <Link
                href="/admin/blog/new"
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  textDecoration: 'none',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                }}
              >
                새 글 작성
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                }}
              >
                로그아웃
              </button>
            </div>
          </div>
          <AdminNavigation />
        </div>

        {error && (
          <div style={{
            padding: '1rem',
            backgroundColor: '#fee2e2',
            color: '#991b1b',
            borderRadius: '0.5rem',
            marginBottom: '1rem',
          }}>
            {error}
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <p style={{ color: '#6b7280' }}>로딩 중...</p>
          </div>
        ) : posts.length === 0 ? (
          <div style={{ 
            padding: '3rem',
            textAlign: 'center',
            backgroundColor: 'white',
            borderRadius: '0.5rem',
            border: '1px solid #e5e7eb',
          }}>
            <p style={{ color: '#6b7280', fontSize: '1rem', marginBottom: '1rem' }}>작성된 글이 없습니다.</p>
            <Link 
              href="/admin/blog/new"
              style={{
                display: 'inline-block',
                padding: '0.75rem 1.5rem',
                backgroundColor: '#3b82f6',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '0.5rem',
                fontWeight: '600',
                fontSize: '0.875rem',
              }}
            >
              첫 글 작성하기
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {posts.map((post) => (
                  <div
                    key={post.id}
                    style={{
                      backgroundColor: 'white',
                      padding: '1.5rem',
                      borderRadius: '0.5rem',
                      border: '1px solid #e5e7eb',
                      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                      display: 'flex',
                      gap: '1.5rem',
                      alignItems: 'flex-start'
                    }}
                  >
                    {post.thumbnailImageUrl && (
                      <img
                        src={post.thumbnailImageUrl}
                        alt={post.title}
                        style={{
                          width: '120px',
                          height: '120px',
                          objectFit: 'cover',
                          borderRadius: 'var(--radius-sm)',
                          flexShrink: 0
                        }}
                      />
                    )}
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                        <h3 style={{ 
                          fontSize: '1.25rem', 
                          fontWeight: '600', 
                          margin: 0,
                          color: '#1f2937',
                          marginBottom: '0.5rem'
                        }}>
                          {post.title}
                        </h3>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                          <span style={{
                            padding: '0.25rem 0.75rem',
                            backgroundColor: post.status === 'published' ? '#598e3e' : '#f59e0b',
                            color: 'white',
                            borderRadius: '9999px',
                            fontSize: '0.75rem',
                            fontWeight: '600'
                          }}>
                            {post.status === 'published' ? '발행됨' : '임시저장'}
                          </span>
                          {post.isHomepageOnly && (
                            <span style={{
                              padding: '0.25rem 0.75rem',
                              backgroundColor: '#3b82f6',
                              color: 'white',
                              borderRadius: '9999px',
                              fontSize: '0.75rem',
                              fontWeight: '600'
                            }}>
                              홈페이지 전용
                            </span>
                          )}
                        </div>
                      </div>
                      {post.summary && (
                        <p style={{ 
                          color: '#6b7280', 
                          fontSize: '0.875rem',
                          marginBottom: '0.5rem',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}>
                          {post.summary}
                        </p>
                      )}
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        marginTop: '1rem',
                        paddingTop: '1rem',
                        borderTop: '1px solid #e5e7eb'
                      }}>
                        <div style={{ fontSize: '0.875rem', color: '#9ca3af' }}>
                          {post.publishedAt ? (
                            <time dateTime={post.publishedAt}>
                              발행: {new Date(post.publishedAt).toLocaleDateString('ko-KR')}
                            </time>
                          ) : (
                            <span>작성: {new Date(post.createdAt).toLocaleDateString('ko-KR')}</span>
                          )}
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <Link
                            href={`/blog/${post.id}`}
                            target="_blank"
                            style={{
                              padding: '0.5rem 1rem',
                              backgroundColor: 'transparent',
                              color: '#6b7280',
                              border: '1px solid #d1d5db',
                              borderRadius: '0.375rem',
                              fontSize: '0.875rem',
                              textDecoration: 'none',
                              cursor: 'pointer'
                            }}
                          >
                            보기
                          </Link>
                          <Link
                            href={`/admin/blog/edit/${post.id}`}
                            style={{
                              padding: '0.5rem 1rem',
                              backgroundColor: '#3b82f6',
                              color: 'white',
                              border: 'none',
                              borderRadius: '0.375rem',
                              fontSize: '0.875rem',
                              textDecoration: 'none',
                              cursor: 'pointer'
                            }}
                          >
                            수정
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleDelete(post.id, post.title)}
                            style={{
                              padding: '0.5rem 1rem',
                              backgroundColor: '#ef4444',
                              color: 'white',
                              border: 'none',
                              borderRadius: '0.375rem',
                              fontSize: '0.875rem',
                              cursor: 'pointer'
                            }}
                          >
                            삭제
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
        )}
      </div>
    </div>
  );
}

