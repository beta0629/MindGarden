'use client';

import { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { getApiService } from '@/lib/api';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

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
          router.push('/blog/admin/login');
        }
      } catch (err) {
        console.error('Auth check error:', err);
        setAuthenticated(false);
        router.push('/blog/admin/login');
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
      setPosts(data);
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
      router.push('/blog/admin/login');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  // 인증되지 않았으면 로딩 표시
  if (authenticated === null) {
    return (
      <main id="top">
        <Navigation />
        <div className="content-shell">
          <div className="content-main">
            <section className="content-section" style={{ paddingTop: '120px', textAlign: 'center' }}>
              <p>인증 확인 중...</p>
            </section>
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  // 인증되지 않았으면 아무것도 렌더링하지 않음 (리다이렉트 중)
  if (!authenticated) {
    return null;
  }

  return (
    <main id="top">
      <Navigation />
      
      <div className="content-shell">
        <div className="content-main">
          <section className="content-section" style={{ paddingTop: '120px', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
              <h1 className="section-title" style={{ margin: 0 }}>블로그 관리</h1>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <Link
                  href="/blog/admin"
                  style={{
                    padding: '10px 20px',
                    backgroundColor: 'var(--accent-sky)',
                    color: 'white',
                    border: 'none',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '14px',
                    fontWeight: '600',
                    textDecoration: 'none',
                    cursor: 'pointer'
                  }}
                >
                  새 글 작성
                </Link>
                <Link
                  href="/blog/admin/gallery"
                  style={{
                    padding: '10px 20px',
                    backgroundColor: 'transparent',
                    color: 'var(--text-sub)',
                    border: '1px solid var(--border-soft)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '14px',
                    fontWeight: '600',
                    textDecoration: 'none',
                    cursor: 'pointer'
                  }}
                >
                  갤러리 관리
                </Link>
                <Link
                  href="/blog/admin/popups"
                  style={{
                    padding: '10px 20px',
                    backgroundColor: 'transparent',
                    color: 'var(--text-sub)',
                    border: '1px solid var(--border-soft)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '14px',
                    fontWeight: '600',
                    textDecoration: 'none',
                    cursor: 'pointer'
                  }}
                >
                  팝업 관리
                </Link>
                <Link
                  href="/blog/admin/banners"
                  style={{
                    padding: '10px 20px',
                    backgroundColor: 'transparent',
                    color: 'var(--text-sub)',
                    border: '1px solid var(--border-soft)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '14px',
                    fontWeight: '600',
                    textDecoration: 'none',
                    cursor: 'pointer'
                  }}
                >
                  배너 관리
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: 'transparent',
                    color: 'var(--text-sub)',
                    border: '1px solid var(--border-soft)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '14px',
                    cursor: 'pointer'
                  }}
                >
                  로그아웃
                </button>
              </div>
            </div>

            {error && (
              <div style={{
                padding: '16px',
                marginBottom: '24px',
                backgroundColor: '#fee',
                border: '1px solid #fcc',
                borderRadius: 'var(--radius-sm)',
                color: '#c33'
              }}>
                {error}
              </div>
            )}

            {loading ? (
              <div style={{ textAlign: 'center', padding: '80px 20px' }}>
                <p>로딩 중...</p>
              </div>
            ) : posts.length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                padding: '80px 20px',
                color: 'var(--text-sub)'
              }}>
                <p>작성된 글이 없습니다.</p>
                <Link 
                  href="/blog/admin"
                  style={{
                    display: 'inline-block',
                    marginTop: '16px',
                    padding: '12px 24px',
                    backgroundColor: 'var(--accent-sky)',
                    color: 'white',
                    textDecoration: 'none',
                    borderRadius: 'var(--radius-sm)',
                    fontWeight: '600'
                  }}
                >
                  첫 글 작성하기
                </Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {posts.map((post) => (
                  <div
                    key={post.id}
                    style={{
                      padding: '20px',
                      backgroundColor: 'var(--surface-1)',
                      border: '1px solid var(--border-soft)',
                      borderRadius: 'var(--radius-md)',
                      display: 'flex',
                      gap: '20px',
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
                          fontSize: '18px', 
                          fontWeight: '700', 
                          margin: 0,
                          color: 'var(--text-main)'
                        }}>
                          {post.title}
                        </h3>
                        <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                          <span style={{
                            padding: '4px 12px',
                            backgroundColor: post.status === 'published' ? '#efe' : '#fee',
                            color: post.status === 'published' ? '#3c3' : '#c33',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: '600'
                          }}>
                            {post.status === 'published' ? '발행됨' : '임시저장'}
                          </span>
                          {post.isHomepageOnly && (
                            <span style={{
                              padding: '4px 12px',
                              backgroundColor: '#eef',
                              color: '#33c',
                              borderRadius: '12px',
                              fontSize: '12px',
                              fontWeight: '600'
                            }}>
                              홈페이지 전용
                            </span>
                          )}
                        </div>
                      </div>
                      {post.summary && (
                        <p style={{ 
                          color: 'var(--text-sub)', 
                          fontSize: '14px',
                          marginBottom: '8px',
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
                        marginTop: '12px'
                      }}>
                        <div style={{ fontSize: '12px', color: 'var(--text-light)' }}>
                          {post.publishedAt ? (
                            <time dateTime={post.publishedAt}>
                              발행: {new Date(post.publishedAt).toLocaleDateString('ko-KR')}
                            </time>
                          ) : (
                            <span>작성: {new Date(post.createdAt).toLocaleDateString('ko-KR')}</span>
                          )}
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <Link
                            href={`/blog/${post.id}`}
                            target="_blank"
                            style={{
                              padding: '6px 12px',
                              backgroundColor: 'transparent',
                              color: 'var(--text-sub)',
                              border: '1px solid var(--border-soft)',
                              borderRadius: 'var(--radius-sm)',
                              fontSize: '12px',
                              textDecoration: 'none',
                              cursor: 'pointer'
                            }}
                          >
                            보기
                          </Link>
                          <Link
                            href={`/blog/admin/edit/${post.id}`}
                            style={{
                              padding: '6px 12px',
                              backgroundColor: 'var(--accent-sky)',
                              color: 'white',
                              border: 'none',
                              borderRadius: 'var(--radius-sm)',
                              fontSize: '12px',
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
                              padding: '6px 12px',
                              backgroundColor: '#fcc',
                              color: '#c33',
                              border: 'none',
                              borderRadius: 'var(--radius-sm)',
                              fontSize: '12px',
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
          </section>
        </div>
      </div>

      <Footer />
    </main>
  );
}

