'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import BlogEditor from '@/components/BlogEditor';
import AdminNavigation from '@/components/AdminNavigation';
import { isLikelyImageFile } from '@/lib/upload-file-types';
import { heicToJpegIfNeeded } from '@/lib/heicToJpeg';

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
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
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


  // content 변경 핸들러를 useCallback으로 메모이제이션
  const handleContentChange = useCallback((value: string) => {
    setFormData(prev => ({ ...prev, content: value }));
  }, []);

  // BlogEditor에서 이미지 업로드 시 base64로 변환 (편집 편의성 향상)
  const handleBlogEditorImageUpload = useCallback(async (file: File): Promise<{ imageUrl: string }> => {
    if (file.size > 10 * 1024 * 1024) {
      throw new Error('이미지 크기는 10MB 이하여야 합니다.');
    }
    if (!isLikelyImageFile(file)) {
      throw new Error('이미지 파일만 업로드 가능합니다. (HEIC 포함)');
    }
    const workFile = await heicToJpegIfNeeded(file);

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          // base64 크기를 줄이기 위해 더 작은 크기로 리사이징
          const maxWidth = 1200;  // 1920 → 1200으로 축소
          const maxHeight = 675;   // 1080 → 675로 축소
          
          let width = img.width;
          let height = img.height;
          
          // 비율 유지하며 최대 크기로 리사이징
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
          
          // base64로 변환 (품질 0.75로 낮춤 - base64 크기 감소)
          const base64 = canvas.toDataURL('image/jpeg', 0.75);
          
          // base64 크기 확인 (약 2MB 제한)
          const base64Size = (base64.length * 3) / 4; // base64 크기 추정 (바이트)
          if (base64Size > 2 * 1024 * 1024) {
            reject(new Error('이미지가 너무 큽니다. 더 작은 이미지를 사용해주세요.'));
            return;
          }
          
          resolve({
            imageUrl: base64,
          });
        };
        img.onerror = () => reject(new Error('이미지를 로드할 수 없습니다.'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('파일을 읽을 수 없습니다.'));
      reader.readAsDataURL(workFile);
    });
  }, []);

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

      // 요청 데이터 로깅 (디버깅용)
      console.log('Submitting popup formData:', {
        title: formData.title,
        contentLength: formData.content?.length || 0,
        startDatetime: formData.startDatetime,
        endDatetime: formData.endDatetime,
      });

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      // 응답 상태 확인
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API response error:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText,
        });
        try {
          const errorData = JSON.parse(errorText);
          setError(errorData.error || `서버 오류 (${response.status}): ${errorText}`);
        } catch {
          setError(`서버 오류 (${response.status}): ${errorText.substring(0, 200)}`);
        }
        return;
      }

      const data = await response.json();
      console.log('API response:', data);

      if (data.success) {
        setSuccess(editingId ? '팝업이 수정되었습니다.' : '팝업이 생성되었습니다.');
        setFormData({
          title: '',
          content: '',
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
    } catch (err: any) {
      console.error('Save popup error:', err);
      setError(`팝업 저장에 실패했습니다: ${err?.message || '알 수 없는 오류'}`);
    }
  };

  const handleEdit = (popup: Popup) => {
    // imageUrl이 있으면 content에 이미지 태그로 추가 (기존 데이터 호환성)
    let content = popup.content || '';
    if (popup.imageUrl && !content.includes('<img')) {
      // content에 이미지가 없고 imageUrl이 있으면 이미지 태그 추가
      content = `<img src="${popup.imageUrl}" alt="${popup.title}" style="max-width: 100%; height: auto;" />${content ? '<br/><br/>' + content : ''}`;
    }
    
    setFormData({
      title: popup.title,
      content: content,
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
      router.push('/admin/login');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  if (authenticated === null) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>로딩 중...</p>
      </div>
    );
  }

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
              팝업 관리
            </h1>
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
          <AdminNavigation />
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
                    내용 (HTML 편집 가능)
                  </label>
                  <div style={{
                    padding: '12px 16px',
                    marginBottom: '12px',
                    backgroundColor: '#f0f9ff',
                    border: '1px solid #bae6fd',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '14px',
                    color: '#0369a1'
                  }}>
                    <div style={{ fontWeight: '600', marginBottom: '4px' }}>팝업 내용 작성 방법</div>
                    <div>• HTML 편집기에서 자유롭게 텍스트, 이미지, 링크 등을 추가할 수 있습니다</div>
                    <div>• 이미지는 드래그 앤 드롭하거나 툴바의 이미지 버튼을 클릭하여 추가하세요</div>
                    <div>• 이미지는 자동으로 base64로 변환되어 content에 저장됩니다</div>
                    <div style={{ marginTop: '8px', fontSize: '12px', color: '#64748b' }}>
                      팝업은 모달로 표시되므로 큰 이미지도 사용할 수 있습니다. 권장 사이즈: 1920px × 1080px (16:9)
                    </div>
                  </div>
                  <BlogEditor
                    key={`popup-editor-${editingId || 'new'}`}
                    value={formData.content}
                    onChange={handleContentChange}
                    placeholder="팝업 내용을 입력하세요. HTML 편집이 가능하며, 이미지를 드래그 앤 드롭하거나 툴바의 이미지 버튼을 클릭하여 추가할 수 있습니다."
                    onImageUpload={handleBlogEditorImageUpload}
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
                      <div style={{ flex: 1 }}>
                        <h4 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '8px' }}>
                          {popup.title}
                        </h4>
                        {popup.content && (
                          <div 
                            style={{ 
                              fontSize: '14px', 
                              color: 'var(--text-sub)', 
                              marginBottom: '12px',
                              maxHeight: '200px',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}
                            dangerouslySetInnerHTML={{ __html: popup.content.substring(0, 200) + (popup.content.length > 200 ? '...' : '') }}
                          />
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
      </div>
    </div>
  );
}
