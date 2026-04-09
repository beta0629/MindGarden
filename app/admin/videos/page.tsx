'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import AdminNavigation from '@/components/AdminNavigation';
import { VIDEO_FILE_ACCEPT, isLikelyVideoFile } from '@/lib/upload-file-types';

interface Video {
  id: number;
  title: string;
  videoUrl: string;
  posterUrl: string | null;
  description: string | null;
  isActive: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

/** Nginx 등에서 413 HTML을 주거나 JSON이 아닐 때 대비 */
async function readVideoAdminJson(
  response: Response
): Promise<{ success: boolean; error?: string } & Record<string, unknown>> {
  if (response.status === 413) {
    return {
      success: false,
      error:
        '업로드 용량이 프록시(Nginx) 한도를 넘었습니다. 동영상을 더 줄이거나 「브라우저에서 먼저 1080p 압축」을 사용하세요. (개발 서버는 API 경로에 512MB까지 허용되도록 맞춰 두었습니다.)',
    };
  }
  const ct = response.headers.get('content-type') || '';
  if (!ct.includes('application/json')) {
    await response.text().catch(() => '');
    return {
      success: false,
      error: `서버 응답을 해석할 수 없습니다 (HTTP ${response.status}). 보통 용량 초과(413)일 때 HTML 오류 페이지가 옵니다.`,
    };
  }
  return response.json();
}

export default function VideoManagementPage() {
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    isActive: true,
    displayOrder: 0,
  });
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [preencodeInBrowser, setPreencodeInBrowser] = useState(true);
  const [transcoding, setTranscoding] = useState(false);
  const [transcodeProgress, setTranscodeProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 인증 확인
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/blog/auth');
        const data = await response.json();
        
        if (data.authenticated) {
          setAuthenticated(true);
          loadVideos();
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

  // 비디오 목록 로드
  const loadVideos = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/videos');
      const data = await response.json();
      
      if (data.success) {
        setVideos(data.videos || []);
      } else {
        setError('비디오 목록을 불러오는데 실패했습니다.');
      }
    } catch (err) {
      console.error('Load videos error:', err);
      setError('비디오 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  // 폼 초기화
  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      isActive: true,
      displayOrder: 0,
    });
    setVideoFile(null);
    setPreviewUrl(null);
    setTranscodeProgress(null);
    setEditingId(null);
    setError(null);
  };

  // 편집 시작
  const handleEdit = (video: Video) => {
    setEditingId(video.id);
    setFormData({
      title: video.title,
      description: video.description || '',
      isActive: video.isActive,
      displayOrder: video.displayOrder,
    });
    setPreviewUrl(video.videoUrl);
    setVideoFile(null);
    setError(null);
  };

  // 비디오 파일 선택
  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!isLikelyVideoFile(file)) {
      setError('비디오 파일만 업로드 가능합니다. (MOV·MP4 등)');
      return;
    }

    // 4K 동영상 지원: 파일 크기 제한을 500MB로 증가
    if (file.size > 500 * 1024 * 1024) {
      setError('비디오 크기는 500MB 이하여야 합니다.');
      return;
    }

    setVideoFile(file);
    setError(null);

    // 미리보기 URL 생성
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  // 제출
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!formData.title.trim()) {
      setError('제목을 입력해주세요.');
      return;
    }

    try {
      let fileToUpload: File | null = videoFile;
      let didClientPrecompress = false;

      if (videoFile && preencodeInBrowser) {
        try {
          setTranscoding(true);
          setTranscodeProgress(0);
          const { clientTranscodeHeroVideo } = await import('@/lib/clientTranscodeHeroVideo');
          fileToUpload = await clientTranscodeHeroVideo(videoFile, (p) => setTranscodeProgress(p));
          didClientPrecompress = true;
          setTranscodeProgress(100);
        } catch (err: unknown) {
          console.error(err);
          const msg = err instanceof Error ? err.message : '브라우저 변환 실패';
          setTranscodeProgress(null);
          setError(
            `${msg}. 아래 「브라우저에서 먼저 1080p 압축」을 끄고 원본 파일을 업로드해 보세요.`
          );
          return;
        } finally {
          setTranscoding(false);
        }
      }

      const submitFormData = new FormData();
      submitFormData.append('title', formData.title);
      submitFormData.append('description', formData.description);
      submitFormData.append('isActive', formData.isActive.toString());
      submitFormData.append('displayOrder', formData.displayOrder.toString());

      if (fileToUpload) {
        submitFormData.append('video', fileToUpload);
        if (didClientPrecompress) {
          submitFormData.append('clientPrecompressed', 'true');
        }
      }

      let response;
      if (editingId) {
        // 수정
        response = await fetch(`/api/admin/videos/${editingId}`, {
          method: 'PUT',
          body: submitFormData,
        });
      } else {
        // 생성
        if (!videoFile) {
          setError('비디오 파일을 선택해주세요.');
          return;
        }
        response = await fetch('/api/admin/videos', {
          method: 'POST',
          body: submitFormData,
        });
      }

      const data = await readVideoAdminJson(response);

      if (data.success) {
        setTranscodeProgress(null);
        resetForm();
        loadVideos();
        alert(editingId ? '비디오가 수정되었습니다.' : '비디오가 등록되었습니다.');
      } else {
        setError((typeof data.error === 'string' && data.error) || '비디오 등록에 실패했습니다.');
      }
    } catch (err) {
      console.error('Submit error:', err);
      setError('비디오 등록에 실패했습니다.');
    }
  };

  // 삭제
  const handleDelete = async (id: number) => {
    if (!confirm('정말 이 비디오를 삭제하시겠습니까?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/videos/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        loadVideos();
        alert('비디오가 삭제되었습니다.');
      } else {
        setError(data.error || '비디오 삭제에 실패했습니다.');
      }
    } catch (err) {
      console.error('Delete error:', err);
      setError('비디오 삭제에 실패했습니다.');
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
        {/* 헤더 */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: '700', color: '#1f2937' }}>
              히어로 비디오 관리
            </h1>
          </div>
          <AdminNavigation />
          <p style={{ color: '#6b7280', marginTop: '1rem' }}>
            메인 페이지 히어로 섹션에 표시되는 비디오를 관리합니다.
          </p>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div
            style={{
              padding: '1rem',
              backgroundColor: '#fee2e2',
              color: '#991b1b',
              borderRadius: '0.5rem',
              marginBottom: '1.5rem',
            }}
          >
            {error}
          </div>
        )}

        {/* 폼 */}
        <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '0.75rem', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1.5rem' }}>
            {editingId ? '비디오 수정' : '새 비디오 등록'}
          </h2>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                제목 *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.5rem',
                  fontSize: '1rem',
                }}
                required
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                설명
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.5rem',
                  fontSize: '1rem',
                  resize: 'vertical',
                }}
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                비디오 파일 {!editingId && '*'}
              </label>
              <input
                type="file"
                accept={VIDEO_FILE_ACCEPT}
                onChange={handleVideoSelect}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.5rem',
                  fontSize: '1rem',
                }}
                required={!editingId}
              />
              <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.5rem' }}>
                최대 500MB — 옵션을 켜면 브라우저에서 1080p로 줄인 뒤 올려 업로드가 빨라집니다. 끄면 서버에서
                FFmpeg로 변환합니다.
              </p>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.5rem',
                  marginTop: '0.75rem',
                  fontSize: '0.9rem',
                  cursor: videoFile ? 'pointer' : 'not-allowed',
                  opacity: videoFile ? 1 : 0.6,
                }}
              >
                <input
                  type="checkbox"
                  checked={preencodeInBrowser}
                  disabled={!videoFile || transcoding}
                  onChange={(e) => setPreencodeInBrowser(e.target.checked)}
                  style={{ width: '18px', height: '18px', marginTop: '2px', flexShrink: 0 }}
                />
                <span>
                  브라우저에서 먼저 1080p로 압축 후 업로드 (MOV·대용량 권장, 첫 실행 시 ffmpeg.wasm 로드에
                  시간이 걸릴 수 있음)
                </span>
              </label>
              {transcoding && transcodeProgress !== null && (
                <div style={{ marginTop: '0.75rem' }}>
                  <div
                    style={{
                      height: '8px',
                      backgroundColor: '#e5e7eb',
                      borderRadius: '4px',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${transcodeProgress}%`,
                        backgroundColor: '#3b82f6',
                        transition: 'width 0.2s ease',
                      }}
                    />
                  </div>
                  <p style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '0.35rem' }}>
                    변환 중… {transcodeProgress}%
                  </p>
                </div>
              )}
            </div>

            {previewUrl && (
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  미리보기
                </label>
                <video
                  src={previewUrl}
                  controls
                  style={{
                    width: '100%',
                    maxHeight: '400px',
                    borderRadius: '0.5rem',
                    backgroundColor: '#000',
                  }}
                />
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  표시 순서
                </label>
                <input
                  type="number"
                  value={formData.displayOrder}
                  onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.5rem',
                    fontSize: '1rem',
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1.75rem' }}>
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    style={{ width: '18px', height: '18px' }}
                  />
                  <span>활성화</span>
                </label>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                type="submit"
                disabled={transcoding}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: transcoding ? '#93c5fd' : '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  fontSize: '1rem',
                  fontWeight: '500',
                  cursor: transcoding ? 'not-allowed' : 'pointer',
                }}
              >
                {transcoding ? '동영상 변환 중…' : editingId ? '수정' : '등록'}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: 'transparent',
                    color: '#6b7280',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.5rem',
                    fontSize: '1rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                  }}
                >
                  취소
                </button>
              )}
            </div>
          </form>
        </div>

        {/* 비디오 목록 */}
        <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '0.75rem', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1.5rem' }}>
            등록된 비디오 ({videos.length})
          </h2>
          {videos.length === 0 ? (
            <p style={{ color: '#6b7280', textAlign: 'center', padding: '2rem' }}>
              등록된 비디오가 없습니다.
            </p>
          ) : (
            <div style={{ display: 'grid', gap: '1.5rem' }}>
              {videos.map((video) => (
                <div
                  key={video.id}
                  style={{
                    padding: '1.5rem',
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.5rem',
                    display: 'grid',
                    gridTemplateColumns: '300px 1fr auto',
                    gap: '1.5rem',
                    alignItems: 'center',
                  }}
                >
                  <video
                    src={video.videoUrl}
                    style={{
                      width: '100%',
                      height: 'auto',
                      borderRadius: '0.5rem',
                      backgroundColor: '#000',
                    }}
                    controls
                  />
                  <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                      {video.title}
                    </h3>
                    {video.description && (
                      <p style={{ color: '#6b7280', marginBottom: '0.5rem' }}>
                        {video.description}
                      </p>
                    )}
                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem', color: '#6b7280' }}>
                      <span>순서: {video.displayOrder}</span>
                      <span>상태: {video.isActive ? '활성' : '비활성'}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <button
                      type="button"
                      onClick={() => handleEdit(video)}
                      style={{
                        padding: '0.5rem 1rem',
                        backgroundColor: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.5rem',
                        fontSize: '0.875rem',
                        cursor: 'pointer',
                      }}
                    >
                      수정
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(video.id)}
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
                      삭제
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 가이드 링크 */}
        <div style={{ marginTop: '2rem', padding: '1.5rem', backgroundColor: '#eff6ff', borderRadius: '0.75rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
            비디오 리사이징 가이드
          </h3>
          <p style={{ color: '#1e40af', marginBottom: '0.5rem' }}>
            위 체크박스로 브라우저에서 바로 1080p로 줄일 수 있습니다. 끄면 원본을 올리고 서버에서 FFmpeg로
            처리합니다.
          </p>
          <ul style={{ color: '#1e40af', marginLeft: '1.5rem', marginBottom: '1rem' }}>
            <li>권장 해상도: 1920x1080 (Full HD)</li>
            <li>권장 형식: MP4 (H.264 코덱)</li>
            <li>권장 프레임레이트: 30fps</li>
            <li>권장 파일 크기: 10MB 이하 (최대 100MB)</li>
          </ul>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <a
              href="https://www.ffmpeg.org/download.html"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#3b82f6',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
              }}
            >
              FFmpeg 다운로드 (리사이징 도구)
            </a>
            <a
              href="https://handbrake.fr/"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#3b82f6',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
              }}
            >
              HandBrake (비디오 변환 도구)
            </a>
            <a
              href="https://www.pexels.com/search/videos/"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#3b82f6',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
              }}
            >
              Pexels (무료 비디오)
            </a>
            <a
              href="https://pixabay.com/videos/"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#3b82f6',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
              }}
            >
              Pixabay (무료 비디오)
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
