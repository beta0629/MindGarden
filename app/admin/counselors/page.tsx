'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ImageUploader from '@/components/ImageUploader';
import AdminNavigation from '@/components/AdminNavigation';
import BlogEditor from '@/components/BlogEditor';

interface Counselor {
  id: number;
  name: string;
  title: string | null;
  profileImageUrl: string | null;
  bio: string | null;
  specialties: string | null;
  education: string | null;
  certifications: string | null;
  experience: string | null;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function CounselorsAdminPage() {
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [counselors, setCounselors] = useState<Counselor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    title: '',
    profileImageUrl: '',
    bio: '',
    specialties: '',
    education: '',
    certifications: '',
    experience: '',
    displayOrder: 0,
    isActive: true,
  });

  // 인증 상태 확인
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/blog/auth');
        const data = await response.json();
        
        if (data.authenticated) {
          setAuthenticated(true);
          loadCounselors();
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

  const loadCounselors = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/admin/counselors');
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }
      
      if (data.success && data.counselors) {
        setCounselors(data.counselors);
      } else {
        setCounselors([]);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '상담사 목록을 불러오는데 실패했습니다.';
      setError(errorMessage);
      console.error('Load counselors error:', err);
      setCounselors([]);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUploaded = async (imageUrl: string) => {
    setFormData(prev => ({ ...prev, profileImageUrl: imageUrl }));
  };

  const handleImageUploadError = (errorMessage: string) => {
    setError(errorMessage);
  };

  const handleBioChange = useCallback((content: string) => {
    setFormData(prev => ({ ...prev, bio: content }));
  }, []);

  const handleBlogEditorImageUpload = useCallback(async (file: File): Promise<{ imageUrl: string }> => {
    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch('/api/blog/images', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || '이미지 업로드에 실패했습니다.');
      }

      return { imageUrl: data.imageUrl || data.url };
    } catch (error) {
      console.error('Image upload error:', error);
      throw error;
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name) {
      setError('이름은 필수입니다.');
      return;
    }

    try {
      const url = editingId ? `/api/admin/counselors/${editingId}` : '/api/admin/counselors';
      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(editingId ? '상담사 정보가 수정되었습니다.' : '상담사가 등록되었습니다.');
        setFormData({
          name: '',
          title: '',
          profileImageUrl: '',
          bio: '',
          specialties: '',
          education: '',
          certifications: '',
          experience: '',
          displayOrder: 0,
          isActive: true,
        });
        setEditingId(null);
        loadCounselors();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(data.error || '상담사 저장에 실패했습니다.');
      }
    } catch (err) {
      setError('상담사 저장에 실패했습니다.');
      console.error('Save counselor error:', err);
    }
  };

  const handleEdit = (counselor: Counselor) => {
    setFormData({
      name: counselor.name,
      title: counselor.title || '',
      profileImageUrl: counselor.profileImageUrl || '',
      bio: counselor.bio || '',
      specialties: counselor.specialties || '',
      education: counselor.education || '',
      certifications: counselor.certifications || '',
      experience: counselor.experience || '',
      displayOrder: counselor.displayOrder,
      isActive: counselor.isActive,
    });
    setEditingId(counselor.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: number) => {
    if (!confirm('이 상담사 정보를 삭제하시겠습니까?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/counselors/${id}`, { method: 'DELETE' });
      const data = await response.json();

      if (data.success) {
        setSuccess('상담사 정보가 삭제되었습니다.');
        loadCounselors();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(data.error || '상담사 삭제에 실패했습니다.');
      }
    } catch (err) {
      setError('상담사 삭제에 실패했습니다.');
      console.error('Delete counselor error:', err);
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

  if (authenticated === null || loading) {
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
              상담사/치료사 프로필 관리
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

        {/* 상담사 등록/수정 폼 */}
        <form onSubmit={handleSubmit} style={{
          padding: '24px',
          backgroundColor: 'var(--surface-1)',
          border: '1px solid var(--border-soft)',
          borderRadius: 'var(--radius-md)',
          marginBottom: '32px'
        }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '20px' }}>
            {editingId ? '상담사 정보 수정' : '새 상담사 등록'}
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                  이름 <span style={{ color: '#c33' }}>*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
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
                  직함/직책
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="예: 원장, 수석상담사"
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

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                프로필 이미지
              </label>
              <ImageUploader
                onImageUploaded={handleImageUploaded}
                onError={handleImageUploadError}
                maxWidth={800}
                maxHeight={800}
                quality={0.9}
                uploading={uploading}
                onUploadingChange={setUploading}
                recommendedAspectRatio={1}
                recommendedSize={{ width: 800, height: 800 }}
                autoResize={true}
              />
              {formData.profileImageUrl && (
                <div style={{ marginTop: '12px' }}>
                  <img 
                    src={formData.profileImageUrl} 
                    alt="프로필 미리보기"
                    style={{
                      maxWidth: '200px',
                      maxHeight: '200px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-soft)'
                    }}
                  />
                </div>
              )}
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                약력/소개
              </label>
              <BlogEditor
                key={editingId || 'new'}
                value={formData.bio}
                onChange={handleBioChange}
                onImageUpload={handleBlogEditorImageUpload}
                placeholder="상담사의 약력과 소개를 입력하세요..."
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                전문 분야
              </label>
              <textarea
                value={formData.specialties}
                onChange={(e) => setFormData(prev => ({ ...prev, specialties: e.target.value }))}
                placeholder="예: ADHD, 우울증, 불안장애 (쉼표로 구분)"
                rows={2}
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
                학력
              </label>
              <textarea
                value={formData.education}
                onChange={(e) => setFormData(prev => ({ ...prev, education: e.target.value }))}
                placeholder="학력 정보를 입력하세요"
                rows={3}
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
                자격증
              </label>
              <textarea
                value={formData.certifications}
                onChange={(e) => setFormData(prev => ({ ...prev, certifications: e.target.value }))}
                placeholder="자격증 정보를 입력하세요"
                rows={3}
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
                경력
              </label>
              <textarea
                value={formData.experience}
                onChange={(e) => setFormData(prev => ({ ...prev, experience: e.target.value }))}
                placeholder="경력 정보를 입력하세요"
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

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                  표시 순서 (낮을수록 먼저 표시)
                </label>
                <input
                  type="number"
                  value={formData.displayOrder}
                  onChange={(e) => setFormData(prev => ({ ...prev, displayOrder: parseInt(e.target.value) || 0 }))}
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
                {editingId ? '수정하기' : '등록하기'}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(null);
                    setFormData({
                      name: '',
                      title: '',
                      profileImageUrl: '',
                      bio: '',
                      specialties: '',
                      education: '',
                      certifications: '',
                      experience: '',
                      displayOrder: 0,
                      isActive: true,
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

        {/* 상담사 목록 */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px 20px' }}>
            <p>로딩 중...</p>
          </div>
        ) : counselors.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '80px 20px',
            color: 'var(--text-sub)'
          }}>
            <p>등록된 상담사가 없습니다.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {counselors.map((counselor) => (
              <div
                key={counselor.id}
                style={{
                  padding: '20px',
                  backgroundColor: 'var(--surface-1)',
                  border: '1px solid var(--border-soft)',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
                  {counselor.profileImageUrl && (
                    <img
                      src={counselor.profileImageUrl}
                      alt={counselor.name}
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
                    <h4 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '8px' }}>
                      {counselor.name}
                      {counselor.title && <span style={{ fontSize: '0.9rem', color: 'var(--text-sub)', fontWeight: '400', marginLeft: '8px' }}>({counselor.title})</span>}
                    </h4>
                    <div style={{ fontSize: '14px', color: 'var(--text-sub)', marginBottom: '12px' }}>
                      <div>표시 순서: {counselor.displayOrder}</div>
                      <div>상태: {counselor.isActive ? '활성' : '비활성'}</div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        onClick={() => handleEdit(counselor)}
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
                        onClick={() => handleDelete(counselor.id)}
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
