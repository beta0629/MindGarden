'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import BlogEditor from '@/components/BlogEditor';
import { isLikelyImageFile } from '@/lib/upload-file-types';
import { heicToJpegIfNeeded } from '@/lib/heicToJpeg';

const convertImageToBase64 = async (
  file: File,
  maxWidth: number = 1200,
  maxHeight: number = 675,
  quality: number = 0.75
): Promise<string> => {
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
    reader.readAsDataURL(workFile);
  });
};

export default function EditReviewPage() {
  const router = useRouter();
  const params = useParams();
  const idParam = params?.id;
  const id = typeof idParam === 'string' ? idParam : Array.isArray(idParam) ? idParam[0] : '';

  const [content, setContent] = useState('');
  const [password, setPassword] = useState('');
  const [loadState, setLoadState] = useState<'loading' | 'ok' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleBlogEditorImageUpload = useCallback(async (file: File): Promise<{ imageUrl: string }> => {
    const base64 = await convertImageToBase64(file);
    return { imageUrl: base64 };
  }, []);

  const handleContentChange = useCallback((value: string) => {
    setContent(value);
  }, []);

  useEffect(() => {
    if (!id) {
      setLoadState('error');
      setError('유효하지 않은 주소입니다.');
      return;
    }
    let cancelled = false;
    (async () => {
      setLoadState('loading');
      setError(null);
      try {
        const res = await fetch(`/api/reviews/${id}`);
        const data = await res.json();
        if (cancelled) return;
        if (!data.success || !data.review) {
          setError(data.error || '후기를 불러올 수 없습니다.');
          setContent('');
          setLoadState('error');
          return;
        }
        setContent(data.review.content || '');
        setLoadState('ok');
      } catch {
        if (!cancelled) {
          setError('네트워크 오류로 후기를 불러오지 못했습니다.');
          setLoadState('error');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!id) return;
    if (!content.trim()) {
      setError('후기 내용을 입력해주세요.');
      return;
    }
    if (!password) {
      setError('수정을 위해 작성 시 설정한 비밀번호를 입력해주세요.');
      return;
    }
    setSubmitting(true);
    try {
      const response = await fetch(`/api/reviews/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, password }),
      });
      const data = await response.json();
      if (data.success) {
        setSuccess('후기가 수정되었습니다.');
        setTimeout(() => router.push('/reviews'), 1200);
      } else {
        setError(data.error || '후기 수정에 실패했습니다.');
      }
    } catch {
      setError('후기 수정에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main id="top" className="review-form-page">
      <Navigation />
      <div className="content-shell">
        <div className="content-main">
          <div className="review-form-wrap">
            <section className="review-form-section">
              <Link href="/reviews" className="review-form-back">
                ← 후기 목록
              </Link>

              <h1 className="review-form-title">
                <span className="review-form-title-bar" aria-hidden />
                후기 수정
              </h1>

              <p className="review-form-muted">
                본문만 수정할 수 있습니다. 태그·별점은 변경하려면 관리자에게 문의해 주세요.
              </p>

              {loadState === 'loading' && (
                <p className="review-form-muted" style={{ marginBottom: '1rem' }}>
                  불러오는 중...
                </p>
              )}

              {loadState === 'error' && (
                <div className="review-form-alert review-form-alert--error">{error || '후기를 불러올 수 없습니다.'}</div>
              )}

              {loadState === 'ok' && (
                <form onSubmit={handleSubmit} className="review-form-card">
                  {error && <div className="review-form-alert review-form-alert--error">{error}</div>}
                  {success && <div className="review-form-alert review-form-alert--success">{success}</div>}

                  <div style={{ marginBottom: '1.5rem' }}>
                    <span className="review-form-label">후기 내용 *</span>
                    <BlogEditor
                      value={content}
                      onChange={handleContentChange}
                      onImageUpload={handleBlogEditorImageUpload}
                      placeholder="후기를 수정해주세요..."
                    />
                  </div>

                  <div style={{ marginBottom: '1.5rem' }}>
                    <label className="review-form-label" htmlFor="edit-review-password">
                      비밀번호 * (작성 시 설정한 비밀번호)
                    </label>
                    <input
                      id="edit-review-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="비밀번호"
                      autoComplete="current-password"
                      className="review-form-input"
                    />
                  </div>

                  <div className="review-form-actions">
                    <button type="button" className="review-form-btn review-form-btn--secondary" onClick={() => router.push('/reviews')}>
                      취소
                    </button>
                    <button type="submit" disabled={submitting || !id} className="review-form-btn review-form-btn--primary">
                      {submitting ? '저장 중...' : '수정 저장'}
                    </button>
                  </div>
                </form>
              )}
            </section>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}
