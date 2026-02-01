'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import BlogEditor from '@/components/BlogEditor';

// BlogEditor에서 이미지 업로드 시 base64로 변환하는 헬퍼 함수
const convertImageToBase64 = (file: File, maxWidth: number = 1200, maxHeight: number = 675, quality: number = 0.75): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (file.size > 10 * 1024 * 1024) {
      reject(new Error('이미지 크기는 10MB 이하여야 합니다.'));
      return;
    }

    if (!file.type.startsWith('image/')) {
      reject(new Error('이미지 파일만 업로드 가능합니다.'));
      return;
    }

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
    reader.readAsDataURL(file);
  });
};

export default function NewReviewPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    authorName: '',
    content: '',
    password: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // BlogEditor에서 이미지 업로드 시 base64로 변환
  const handleBlogEditorImageUpload = useCallback(async (file: File): Promise<{ imageUrl: string }> => {
    const base64 = await convertImageToBase64(file);
    return { imageUrl: base64 };
  }, []);

  const handleContentChange = useCallback((value: string) => {
    setFormData(prev => ({ ...prev, content: value }));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!formData.content.trim()) {
      setError('후기 내용을 입력해주세요.');
      return;
    }

    if (!formData.password || formData.password.length < 4) {
      setError('비밀번호는 4자 이상이어야 합니다.');
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          authorName: formData.authorName || '익명',
          content: formData.content,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('후기가 등록되었습니다.');
        setTimeout(() => {
          router.push('/reviews');
        }, 1500);
      } else {
        setError(data.error || '후기 등록에 실패했습니다.');
      }
    } catch (err) {
      console.error('Submit error:', err);
      setError('후기 등록에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main id="top">
      <Navigation />
      <div className="content-shell">
        <div className="content-main">
          <section className="content-section" style={{ maxWidth: '800px', margin: '0 auto' }}>
            <h2 className="section-title" style={{ marginBottom: '2rem' }}>
              후기 작성
            </h2>
            
            {error && (
              <div style={{
                padding: '1rem',
                marginBottom: '1.5rem',
                backgroundColor: '#fee2e2',
                color: '#991b1b',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid #fecaca',
              }}>
                {error}
              </div>
            )}

            {success && (
              <div style={{
                padding: '1rem',
                marginBottom: '1.5rem',
                backgroundColor: '#d1fae5',
                color: '#065f46',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid #a7f3d0',
              }}>
                {success}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{
              backgroundColor: 'var(--surface-0)',
              padding: '2rem',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-1)',
              border: '1px solid var(--border-soft)',
            }}>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--text-main)' }}>
                  작성자 이름 (선택)
                </label>
                <input
                  type="text"
                  value={formData.authorName}
                  onChange={(e) => setFormData({ ...formData, authorName: e.target.value })}
                  placeholder="익명으로 표시됩니다"
                  maxLength={100}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid var(--border-soft)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '1rem',
                    fontFamily: 'var(--font-main)',
                  }}
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--text-main)' }}>
                  후기 내용 *
                </label>
                <BlogEditor
                  value={formData.content}
                  onChange={handleContentChange}
                  onImageUpload={handleBlogEditorImageUpload}
                  placeholder="후기를 작성해주세요..."
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--text-main)' }}>
                  비밀번호 * (수정/삭제 시 필요)
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="4자 이상"
                  minLength={4}
                  maxLength={100}
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid var(--border-soft)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '1rem',
                    fontFamily: 'var(--font-main)',
                  }}
                />
                <p style={{ fontSize: '0.875rem', color: 'var(--text-sub)', marginTop: '0.5rem' }}>
                  후기 수정 또는 삭제 시 필요합니다. 안전하게 보관해주세요.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => router.push('/reviews')}
                  style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: 'transparent',
                    color: 'var(--text-sub)',
                    border: '1px solid var(--border-soft)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '1rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-main)',
                  }}
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: 'linear-gradient(135deg, var(--accent-sky) 0%, var(--accent-mint) 100%)',
                    color: 'var(--text-main)',
                    border: 'none',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    opacity: submitting ? 0.6 : 1,
                    fontFamily: 'var(--font-main)',
                    transition: 'all 0.2s',
                  }}
                >
                  {submitting ? '등록 중...' : '등록하기'}
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
