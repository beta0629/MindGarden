'use client';

import { useState, useEffect } from 'react';
import { getApiService } from '@/lib/api';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ImageUploader from '@/components/ImageUploader';
import AdminNavigation from '@/components/AdminNavigation';

interface GalleryImage {
  id: number;
  imageUrl: string;
  altText: string | null;
  category: string | null;
  displayOrder: number;
  isActive: boolean;
}

const CATEGORIES = [
  { value: '모래놀이실', label: '모래놀이실' },
  { value: '미술치료', label: '미술치료' },
  { value: '놀이치료', label: '놀이치료' },
  { value: '언어치료', label: '언어치료' },
  { value: '가족상담실', label: '가족상담실' },
  { value: '상담실', label: '상담실' },
  { value: '대기실', label: '대기실' },
];

export default function GalleryAdminPage() {
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [newImage, setNewImage] = useState({
    imageUrl: '',
    altText: '',
    category: '',
    displayOrder: 0,
  });

  // 인증 상태 확인
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/blog/auth');
        const data = await response.json();
        
        if (data.authenticated) {
          setAuthenticated(true);
          loadImages();
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

  const loadImages = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/gallery?all=true');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Gallery images response:', data);
      console.log('Response success:', data.success);
      console.log('Response images:', data.images);
      console.log('Images array check:', Array.isArray(data.images));
      console.log('Images length:', data.images?.length);
      
      if (data.success) {
        // images가 배열인지 확인하고 설정
        if (Array.isArray(data.images)) {
          setImages(data.images);
          console.log('Images loaded:', data.images.length);
        } else {
          console.warn('Images is not an array:', data.images);
          setImages([]);
        }
      } else {
        console.warn('API returned success: false:', data);
        setError(data.error || '갤러리 이미지를 불러오는데 실패했습니다.');
        setImages([]);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '갤러리 이미지를 불러오는데 실패했습니다.';
      setError(errorMessage);
      console.error('Load images error:', err);
      setImages([]);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUploaded = async (imageUrl: string) => {
    // ImageUploader에서 이미 /api/gallery로 업로드했고, 그 과정에서 DB에도 저장되었음
    // 따라서 여기서는 목록만 새로고침하면 됨
    try {
      console.log('Image uploaded, refreshing gallery list:', imageUrl);
      setSuccess('갤러리 이미지가 추가되었습니다.');
      setNewImage({ imageUrl: '', altText: '', category: '', displayOrder: 0 });
      // 약간의 지연 후 목록 새로고침 (DB 반영 시간 고려)
      setTimeout(() => {
        loadImages();
      }, 500);
      setTimeout(() => setSuccess(null), 3000);
      setError(null);
    } catch (err: any) {
      const errorMessage = err.message || '이미지 추가에 실패했습니다.';
      setError(errorMessage);
      console.error('Handle image uploaded error:', err);
    }
  };

  const handleImageUploadError = (errorMessage: string) => {
    setError(errorMessage);
  };

  const handleAddImage = async () => {
    if (!newImage.imageUrl) {
      setError('이미지 URL을 입력하거나 업로드해주세요.');
      return;
    }

    try {
      const apiService = getApiService();
      await apiService.addGalleryImage({
        imageUrl: newImage.imageUrl,
        altText: newImage.altText || undefined,
        category: newImage.category || undefined,
        displayOrder: newImage.displayOrder,
      });
      setSuccess('갤러리 이미지가 추가되었습니다.');
      setNewImage({ imageUrl: '', altText: '', category: '', displayOrder: 0 });
      loadImages();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('이미지 추가에 실패했습니다.');
      console.error('Add image error:', err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('이 이미지를 삭제하시겠습니까?')) {
      return;
    }

    try {
      const apiService = getApiService();
      await apiService.deleteGalleryImage(id);
      setSuccess('이미지가 삭제되었습니다.');
      loadImages();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('이미지 삭제에 실패했습니다.');
      console.error('Delete image error:', err);
    }
  };

  const handleUpdateOrder = async (id: number, newOrder: number) => {
    try {
      const apiService = getApiService();
      await apiService.updateGalleryImage(id, { displayOrder: newOrder });
      setSuccess('순서가 변경되었습니다.');
      loadImages();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('순서 변경에 실패했습니다.');
      console.error('Update order error:', err);
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
              갤러리 관리
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

            {/* 새 이미지 추가 */}
            <div style={{
              padding: '24px',
              backgroundColor: 'var(--surface-1)',
              border: '1px solid var(--border-soft)',
              borderRadius: 'var(--radius-md)',
              marginBottom: '32px'
            }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '20px' }}>
                새 이미지 추가
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                    이미지 업로드 (드래그 앤 드롭 또는 클릭)
                  </label>
                  <ImageUploader
                    onImageUploaded={handleImageUploaded}
                    onError={handleImageUploadError}
                    maxWidth={1920}
                    maxHeight={1080}
                    quality={0.9}
                    uploading={uploading}
                    onUploadingChange={setUploading}
                    altText={newImage.altText}
                    category={newImage.category}
                    displayOrder={newImage.displayOrder}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                    또는 이미지 URL 직접 입력
                  </label>
                  <input
                    type="text"
                    value={newImage.imageUrl}
                    onChange={(e) => setNewImage(prev => ({ ...prev, imageUrl: e.target.value }))}
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
                    카테고리
                  </label>
                  <select
                    value={newImage.category}
                    onChange={(e) => setNewImage(prev => ({ ...prev, category: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '1px solid var(--border-soft)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '16px',
                      backgroundColor: 'white',
                    }}
                  >
                    <option value="">카테고리 선택</option>
                    {CATEGORIES.map(cat => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                    대체 텍스트
                  </label>
                  <input
                    type="text"
                    value={newImage.altText}
                    onChange={(e) => setNewImage(prev => ({ ...prev, altText: e.target.value }))}
                    placeholder="이미지 설명"
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
                    표시 순서
                  </label>
                  <input
                    type="number"
                    value={newImage.displayOrder}
                    onChange={(e) => setNewImage(prev => ({ ...prev, displayOrder: parseInt(e.target.value) || 0 }))}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '1px solid var(--border-soft)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '16px'
                    }}
                  />
                </div>
                {newImage.imageUrl && (
                  <div style={{ marginTop: '12px' }}>
                    <img 
                      src={newImage.imageUrl} 
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
                <button
                  type="button"
                  onClick={handleAddImage}
                  disabled={!newImage.imageUrl}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: 'var(--accent-sky)',
                    color: 'white',
                    border: 'none',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: !newImage.imageUrl ? 'not-allowed' : 'pointer',
                    opacity: !newImage.imageUrl ? 0.6 : 1
                  }}
                >
                  이미지 추가
                </button>
              </div>
            </div>

            {/* 이미지 목록 */}
            {loading ? (
              <div style={{ textAlign: 'center', padding: '80px 20px' }}>
                <p>로딩 중...</p>
              </div>
            ) : images.length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                padding: '80px 20px',
                color: 'var(--text-sub)'
              }}>
                <p>등록된 이미지가 없습니다.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {images.map((image) => (
                  <div
                    key={image.id}
                    style={{
                      padding: '20px',
                      backgroundColor: 'var(--surface-1)',
                      border: '1px solid var(--border-soft)',
                      borderRadius: 'var(--radius-md)',
                      display: 'flex',
                      gap: '20px',
                      alignItems: 'center'
                    }}
                  >
                    <img
                      src={image.imageUrl}
                      alt={image.altText || '갤러리 이미지'}
                      style={{
                        width: '150px',
                        height: '150px',
                        objectFit: 'cover',
                        borderRadius: 'var(--radius-sm)',
                        flexShrink: 0
                      }}
                    />
                      <div style={{ flex: 1 }}>
                      <div style={{ marginBottom: '12px' }}>
                        <div style={{ fontSize: '14px', color: 'var(--text-sub)', marginBottom: '4px' }}>
                          카테고리: {image.category || '(카테고리 없음)'}
                        </div>
                        <div style={{ fontSize: '14px', color: 'var(--text-sub)', marginBottom: '4px' }}>
                          순서: {image.displayOrder}
                        </div>
                        <div style={{ fontSize: '14px', color: 'var(--text-sub)' }}>
                          {image.altText || '(대체 텍스트 없음)'}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          onClick={() => handleUpdateOrder(image.id, image.displayOrder - 1)}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: 'transparent',
                            color: 'var(--text-sub)',
                            border: '1px solid var(--border-soft)',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: '12px',
                            cursor: 'pointer'
                          }}
                        >
                          ↑ 위로
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdateOrder(image.id, image.displayOrder + 1)}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: 'transparent',
                            color: 'var(--text-sub)',
                            border: '1px solid var(--border-soft)',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: '12px',
                            cursor: 'pointer'
                          }}
                        >
                          ↓ 아래로
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(image.id)}
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
                ))}
              </div>
            )}
      </div>
    </div>
  );
}

