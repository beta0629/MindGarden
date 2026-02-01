'use client';

import { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import BlogEditor from '@/components/BlogEditor';
import { getApiService } from '@/lib/api';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function BlogEditPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    summary: '',
    thumbnailImageUrl: '',
    status: 'draft' as 'draft' | 'published',
    isHomepageOnly: false,
  });
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // 인증 상태 확인 및 데이터 로드
  useEffect(() => {
    const checkAuthAndLoad = async () => {
      try {
        const authResponse = await fetch('/api/blog/auth');
        const authData = await authResponse.json();
        
        if (!authData.authenticated) {
          setAuthenticated(false);
          router.push('/admin/login');
          return;
        }

        setAuthenticated(true);
        
        // 기존 글 데이터 로드
        const apiService = getApiService();
        const post = await apiService.getBlogPost(parseInt(params.id));
        
        if (!post) {
          setError('글을 찾을 수 없습니다.');
          setLoading(false);
          return;
        }

        setFormData({
          title: post.title || '',
          content: post.content || '',
          summary: post.summary || '',
          thumbnailImageUrl: post.thumbnailImageUrl || '',
          status: post.status || 'draft',
          isHomepageOnly: post.isHomepageOnly || false,
        });
        setLoading(false);
      } catch (err) {
        console.error('Load error:', err);
        setError('글을 불러오는데 실패했습니다.');
        setLoading(false);
      }
    };

    checkAuthAndLoad();
  }, [params.id, router]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('이미지 파일만 업로드 가능합니다.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('이미지 크기는 5MB 이하여야 합니다.');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const apiService = getApiService();
      const result = await apiService.uploadBlogImage(file);
      setFormData(prev => ({
        ...prev,
        thumbnailImageUrl: result.imageUrl || result.url
      }));
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError('이미지 업로드에 실패했습니다.');
      console.error('Image upload error:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const apiService = getApiService();
      await apiService.updateBlogPost(parseInt(params.id), formData);
      setSuccess(true);
      setTimeout(() => {
        router.push('/admin/blog');
      }, 1500);
    } catch (err) {
      setError('글 수정에 실패했습니다.');
      console.error('Update post error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/blog/auth', { method: 'DELETE' });
      router.push('/admin/login');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  // 인증 확인 중
  if (authenticated === null || loading) {
    return (
      <main id="top">
        <Navigation />
        <div className="content-shell">
          <div className="content-main">
            <section className="content-section" style={{ paddingTop: '120px', textAlign: 'center' }}>
              <p>{authenticated === null ? '인증 확인 중...' : '글을 불러오는 중...'}</p>
            </section>
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  // 인증되지 않았으면 아무것도 렌더링하지 않음
  if (!authenticated) {
    return null;
  }

  return (
    <main id="top">
      <Navigation />
      
      <div className="content-shell">
        <div className="content-main">
          <section className="content-section" style={{ paddingTop: '120px', maxWidth: '900px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h1 className="section-title" style={{ margin: 0 }}>블로그 글 수정</h1>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <Link
                  href="/admin/list"
                  style={{
                    padding: '8px 16px',
                    backgroundColor: 'transparent',
                    color: 'var(--text-sub)',
                    border: '1px solid var(--border-soft)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '14px',
                    textDecoration: 'none',
                    cursor: 'pointer'
                  }}
                >
                  목록
                </Link>
                <Link
                  href="/admin/gallery"
                  style={{
                    padding: '8px 16px',
                    backgroundColor: 'transparent',
                    color: 'var(--text-sub)',
                    border: '1px solid var(--border-soft)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '14px',
                    textDecoration: 'none',
                    cursor: 'pointer'
                  }}
                >
                  갤러리 관리
                </Link>
                <Link
                  href="/admin/popups"
                  style={{
                    padding: '8px 16px',
                    backgroundColor: 'transparent',
                    color: 'var(--text-sub)',
                    border: '1px solid var(--border-soft)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '14px',
                    textDecoration: 'none',
                    cursor: 'pointer'
                  }}
                >
                  팝업 관리
                </Link>
                <Link
                  href="/admin/banners"
                  style={{
                    padding: '8px 16px',
                    backgroundColor: 'transparent',
                    color: 'var(--text-sub)',
                    border: '1px solid var(--border-soft)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '14px',
                    textDecoration: 'none',
                    cursor: 'pointer'
                  }}
                >
                  배너 관리
                </Link>
                <Link
                  href="/admin/consultation"
                  style={{
                    padding: '8px 16px',
                    backgroundColor: 'transparent',
                    color: 'var(--text-sub)',
                    border: '1px solid var(--border-soft)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '14px',
                    textDecoration: 'none',
                    cursor: 'pointer'
                  }}
                >
                  상담 문의 관리
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  style={{
                    padding: '8px 16px',
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

            {success && (
              <div style={{
                padding: '16px',
                marginBottom: '24px',
                backgroundColor: '#efe',
                border: '1px solid #cfc',
                borderRadius: 'var(--radius-sm)',
                color: '#3c3'
              }}>
                글이 수정되었습니다!
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div>
                <label htmlFor="title" style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                  제목 *
                </label>
                <input
                  type="text"
                  id="title"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid var(--border-soft)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '16px',
                    fontFamily: 'var(--font-main)'
                  }}
                />
              </div>

              <div>
                <label htmlFor="summary" style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                  요약
                </label>
                <textarea
                  id="summary"
                  value={formData.summary}
                  onChange={(e) => setFormData(prev => ({ ...prev, summary: e.target.value }))}
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid var(--border-soft)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '16px',
                    fontFamily: 'var(--font-main)',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div>
                <label htmlFor="content" style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                  내용 *
                </label>
                <BlogEditor
                  value={formData.content}
                  onChange={(value) => setFormData(prev => ({ ...prev, content: value }))}
                  placeholder="블로그 내용을 입력하세요. 이미지를 드래그 앤 드롭하거나 툴바의 이미지 버튼을 클릭하여 추가할 수 있습니다."
                />
                <p style={{ marginTop: '8px', fontSize: '14px', color: 'var(--text-sub)' }}>
                  이미지를 드래그 앤 드롭하거나 툴바의 이미지 버튼을 클릭하여 추가할 수 있습니다.
                </p>
              </div>

              <div>
                <label htmlFor="thumbnail" style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                  썸네일 이미지
                </label>
                <input
                  type="file"
                  id="thumbnail"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploading}
                  style={{ marginBottom: '8px' }}
                />
                {uploading && <p style={{ color: 'var(--text-sub)', fontSize: '14px' }}>업로드 중...</p>}
                {formData.thumbnailImageUrl && (
                  <div style={{ marginTop: '12px' }}>
                    <img 
                      src={formData.thumbnailImageUrl} 
                      alt="썸네일 미리보기"
                      style={{
                        maxWidth: '300px',
                        maxHeight: '200px',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-soft)'
                      }}
                    />
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="status" style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                  상태
                </label>
                <select
                  id="status"
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as 'draft' | 'published' }))}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid var(--border-soft)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '16px',
                    fontFamily: 'var(--font-main)'
                  }}
                >
                  <option value="draft">임시 저장</option>
                  <option value="published">발행</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.isHomepageOnly}
                    onChange={(e) => setFormData(prev => ({ ...prev, isHomepageOnly: e.target.checked }))}
                    style={{
                      width: '18px',
                      height: '18px',
                      cursor: 'pointer'
                    }}
                  />
                  <span style={{ fontWeight: '600' }}>홈페이지 전용</span>
                </label>
                <p style={{ marginTop: '8px', fontSize: '14px', color: 'var(--text-sub)', marginLeft: '26px' }}>
                  체크 시 홈페이지에서만 표시되는 전용 글입니다.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                <button
                  type="submit"
                  disabled={submitting || uploading}
                  style={{
                    flex: 1,
                    padding: '14px 24px',
                    backgroundColor: 'var(--accent-sky)',
                    color: 'white',
                    border: 'none',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: submitting || uploading ? 'not-allowed' : 'pointer',
                    opacity: submitting || uploading ? 0.6 : 1,
                    transition: 'opacity 0.2s'
                  }}
                >
                  {submitting ? '수정 중...' : '수정하기'}
                </button>
                <button
                  type="button"
                  onClick={() => router.push('/admin/blog')}
                  style={{
                    padding: '14px 24px',
                    backgroundColor: 'transparent',
                    color: 'var(--text-sub)',
                    border: '1px solid var(--border-soft)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  취소
                </button>
              </div>
            </form>
          </section>
        </div>
      </div>

      <Footer />
    </main>
  );
}

