'use client';

import { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ImageUploader from '@/components/ImageUploader';

interface Popup {
  id: number;
  title: string;
  content: string | null;
  imageUrl: string | null;
  linkUrl: string | null;
  startDatetime: string;
  endDatetime: string;
  isActive: boolean;
  priority: number;
  createdAt: string;
  updatedAt: string;
}

export default function PopupsAdminPage() {
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [popups, setPopups] = useState<Popup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    imageUrl: '',
    linkUrl: '',
    startDatetime: '',
    endDatetime: '',
    isActive: true,
    priority: 0,
  });

  // 인증 상태 확인
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/blog/auth');
        const data = await response.json();
        
        if (data.authenticated) {
          setAuthenticated(true);
          loadPopups();
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

  const loadPopups = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/admin/popups');
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }
      
      if (data.success && data.popups) {
        setPopups(data.popups);
      } else {
        setPopups([]);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '팝업 목록을 불러오는데 실패했습니다.';
      setError(errorMessage);
      console.error('Load popups error:', err);
      setPopups([]);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUploaded = async (imageUrl: string) => {
    setFormData(prev => ({ ...prev, imageUrl }));
  };

  const handleImageUploadError = (errorMessage: string) => {
    setError(errorMessage);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.title || !formData.startDatetime || !formData.endDatetime) {
      setError('제목, 시작일시, 종료일시는 필수입니다.');
      return;
    }

    try {
      const url = editingId ? `/api/admin/popups/${editingId}` : '/api/admin/popups';
      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(editingId ? '팝업이 수정되었습니다.' : '팝업이 생성되었습니다.');
        setFormData({
          title: '',
          content: '',
          imageUrl: '',
          linkUrl: '',
          startDatetime: '',
          endDatetime: '',
          isActive: true,
          priority: 0,
        });
        setEditingId(null);
        loadPopups();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(data.error || '팝업 저장에 실패했습니다.');
      }
    } catch (err) {
      setError('팝업 저장에 실패했습니다.');
      console.error('Save popup error:', err);
    }
  };

  const handleEdit = (popup: Popup) => {
    setFormData({
      title: popup.title,
      content: popup.content || '',
      imageUrl: popup.imageUrl || '',
      linkUrl: popup.linkUrl || '',
      startDatetime: popup.startDatetime.slice(0, 16),
      endDatetime: popup.endDatetime.slice(0, 16),
      isActive: popup.isActive,
      priority: popup.priority,
    });
    setEditingId(popup.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: number) => {
    if (!confirm('이 팝업을 삭제하시겠습니까?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/popups/${id}`, { method: 'DELETE' });
      const data = await response.json();

      if (data.success) {
        setSuccess('팝업이 삭제되었습니다.');
        loadPopups();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(data.error || '팝업 삭제에 실패했습니다.');
      }
    } catch (err) {
      setError('팝업 삭제에 실패했습니다.');
      console.error('Delete popup error:', err);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/blog/auth', { method: 'DELETE' });
      router.push('/blog/admin/login');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

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
              <h1 className="section-title" style={{ margin: 0 }}>팝업 관리</h1>
              <div style={{ display: 'flex', gap: '12px' }}>
                <Link
                  href="/blog/admin/list"
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
                  블로그 관리
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

            {success && (
              <div style={{
                padding: '16px',
                marginBottom: '24px',
                backgroundColor: '#efe',
                border: '1px solid #cfc',
                borderRadius: 'var(--radius-sm)',
                color: '#3c3'
              }}>
                {success}
              </div>
            )}

            {/* 팝업 생성/수정 폼 */}
            <form onSubmit={handleSubmit} style={{
              padding: '24px',
              backgroundColor: 'var(--surface-1)',
              border: '1px solid var(--border-soft)',
              borderRadius: 'var(--radius-md)',
              marginBottom: '32px'
            }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '20px' }}>
                {editingId ? '팝업 수정' : '새 팝업 생성'}
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                    제목 <span style={{ color: '#c33' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    required
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '1px solid var(--border-soft)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '16px'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                    내용
                  </label>
                  <textarea
                    value={formData.content}
                    onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                    rows={4}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '1px solid var(--border-soft)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '16px',
                      fontFamily: 'inherit'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                    이미지 업로드
                  </label>
                  <ImageUploader
                    onImageUploaded={handleImageUploaded}
                    onError={handleImageUploadError}
                    maxWidth={1920}
                    maxHeight={1080}
                    quality={0.9}
                    uploading={uploading}
                    onUploadingChange={setUploading}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                    또는 이미지 URL 직접 입력
                  </label>
                  <input
                    type="text"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData(prev => ({ ...prev, imageUrl: e.target.value }))}
                    placeholder="https://example.com/image.jpg"
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '1px solid var(--border-soft)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '16px'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                    링크 URL (선택)
                  </label>
                  <input
                    type="text"
                    value={formData.linkUrl}
                    onChange={(e) => setFormData(prev => ({ ...prev, linkUrl: e.target.value }))}
                    placeholder="https://example.com"
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '1px solid var(--border-soft)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '16px'
                    }}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                      시작일시 <span style={{ color: '#c33' }}>*</span>
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.startDatetime}
                      onChange={(e) => setFormData(prev => ({ ...prev, startDatetime: e.target.value }))}
                      required
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '1px solid var(--border-soft)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '16px'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                      종료일시 <span style={{ color: '#c33' }}>*</span>
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.endDatetime}
                      onChange={(e) => setFormData(prev => ({ ...prev, endDatetime: e.target.value }))}
                      required
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '1px solid var(--border-soft)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '16px'
                      }}
                    />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                      우선순위 (낮을수록 먼저 표시)
                    </label>
                    <input
                      type="number"
                      value={formData.priority}
                      onChange={(e) => setFormData(prev => ({ ...prev, priority: parseInt(e.target.value) || 0 }))}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '1px solid var(--border-soft)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '16px'
                      }}
                    />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '24px' }}>
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={formData.isActive}
                      onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                      style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                    />
                    <label htmlFor="isActive" style={{ fontWeight: '600', cursor: 'pointer' }}>
                      활성화
                    </label>
                  </div>
                </div>
                {formData.imageUrl && (
                  <div style={{ marginTop: '12px' }}>
                    <img 
                      src={formData.imageUrl} 
                      alt="미리보기"
                      style={{
                        maxWidth: '300px',
                        maxHeight: '200px',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-soft)'
                      }}
                    />
                  </div>
                )}
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    type="submit"
                    style={{
                      padding: '12px 24px',
                      backgroundColor: 'var(--accent-sky)',
                      color: 'white',
                      border: 'none',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '16px',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    {editingId ? '수정하기' : '생성하기'}
                  </button>
                  {editingId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(null);
                        setFormData({
                          title: '',
                          content: '',
                          imageUrl: '',
                          linkUrl: '',
                          startDatetime: '',
                          endDatetime: '',
                          isActive: true,
                          priority: 0,
                        });
                      }}
                      style={{
                        padding: '12px 24px',
                        backgroundColor: 'transparent',
                        color: 'var(--text-sub)',
                        border: '1px solid var(--border-soft)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '16px',
                        cursor: 'pointer'
                      }}
                    >
                      취소
                    </button>
                  )}
                </div>
              </div>
            </form>

            {/* 팝업 목록 */}
            {loading ? (
              <div style={{ textAlign: 'center', padding: '80px 20px' }}>
                <p>로딩 중...</p>
              </div>
            ) : popups.length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                padding: '80px 20px',
                color: 'var(--text-sub)'
              }}>
                <p>등록된 팝업이 없습니다.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {popups.map((popup) => (
                  <div
                    key={popup.id}
                    style={{
                      padding: '20px',
                      backgroundColor: 'var(--surface-1)',
                      border: '1px solid var(--border-soft)',
                      borderRadius: 'var(--radius-md)',
                    }}
                  >
                    <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
                      {popup.imageUrl && (
                        <img
                          src={popup.imageUrl}
                          alt={popup.title}
                          style={{
                            width: '150px',
                            height: '150px',
                            objectFit: 'cover',
                            borderRadius: 'var(--radius-sm)',
                            flexShrink: 0
                          }}
                        />
                      )}
                      <div style={{ flex: 1 }}>
                        <h4 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '8px' }}>
                          {popup.title}
                        </h4>
                        {popup.content && (
                          <p style={{ fontSize: '14px', color: 'var(--text-sub)', marginBottom: '12px' }}>
                            {popup.content}
                          </p>
                        )}
                        <div style={{ fontSize: '14px', color: 'var(--text-sub)', marginBottom: '12px' }}>
                          <div>시작: {new Date(popup.startDatetime).toLocaleString('ko-KR')}</div>
                          <div>종료: {new Date(popup.endDatetime).toLocaleString('ko-KR')}</div>
                          <div>우선순위: {popup.priority}</div>
                          <div>상태: {popup.isActive ? '활성' : '비활성'}</div>
                          {popup.linkUrl && <div>링크: <a href={popup.linkUrl} target="_blank" rel="noopener noreferrer">{popup.linkUrl}</a></div>}
                        </div>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          <button
                            type="button"
                            onClick={() => handleEdit(popup)}
                            style={{
                              padding: '6px 12px',
                              backgroundColor: 'var(--accent-sky)',
                              color: 'white',
                              border: 'none',
                              borderRadius: 'var(--radius-sm)',
                              fontSize: '12px',
                              cursor: 'pointer'
                            }}
                          >
                            수정
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(popup.id)}
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
