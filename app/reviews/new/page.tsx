'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import BlogEditor from '@/components/BlogEditor';
import { HeartGlyph } from '@/components/icons/ReviewHearts';
import { isLikelyImageFile } from '@/lib/upload-file-types';
import { heicToJpegIfNeeded } from '@/lib/heicToJpeg';

// BlogEditor에서 이미지 업로드 시 base64로 변환하는 헬퍼 함수
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

// 해시태그 옵션
const REVIEW_TAGS = [
  '전문성', '친절도', '효과', '시설', '접근성', '가격', '추천', '재방문', '기타',
];

// 평가 항목
const RATING_CATEGORIES = [
  { key: 'professionalism', label: '전문성' },
  { key: 'kindness', label: '친절도' },
  { key: 'effectiveness', label: '효과' },
  { key: 'facility', label: '시설' },
  { key: 'overall', label: '전반적 만족도' },
];

export default function NewReviewPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    authorName: '',
    content: '',
    password: '',
    tags: [] as string[],
    ratings: {
      professionalism: 0,
      kindness: 0,
      effectiveness: 0,
      facility: 0,
      overall: 0,
    },
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleTagToggle = (tag: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag) ? prev.tags.filter((t) => t !== tag) : [...prev.tags, tag],
    }));
  };

  const handleRatingChange = (category: string, value: number) => {
    setFormData((prev) => ({
      ...prev,
      ratings: {
        ...prev.ratings,
        [category]: value,
      },
    }));
  };

  const handleBlogEditorImageUpload = useCallback(async (file: File): Promise<{ imageUrl: string }> => {
    const base64 = await convertImageToBase64(file);
    return { imageUrl: base64 };
  }, []);

  const handleContentChange = useCallback((value: string) => {
    setFormData((prev) => ({ ...prev, content: value }));
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
          authorName: formData.authorName.trim() || undefined,
          content: formData.content,
          password: formData.password,
          tags: formData.tags,
          ratings: formData.ratings,
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
                후기 작성
              </h1>

              {error && <div className="review-form-alert review-form-alert--error">{error}</div>}

              {success && <div className="review-form-alert review-form-alert--success">{success}</div>}

              <form onSubmit={handleSubmit} className="review-form-card">
                <div style={{ marginBottom: '1.5rem' }}>
                  <label className="review-form-label" htmlFor="review-author-name">
                    작성자 이름 (선택)
                  </label>
                  <input
                    id="review-author-name"
                    type="text"
                    value={formData.authorName}
                    onChange={(e) => setFormData({ ...formData, authorName: e.target.value })}
                    placeholder="입력 시 후기에 표시됩니다 (미입력 시 고객님)"
                    maxLength={100}
                    className="review-form-input"
                    autoComplete="nickname"
                  />
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <span className="review-form-label">후기 내용 *</span>
                  <BlogEditor
                    value={formData.content}
                    onChange={handleContentChange}
                    onImageUpload={handleBlogEditorImageUpload}
                    placeholder="후기를 작성해주세요..."
                  />
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <span className="review-form-label">관련 항목 선택 (복수 선택 가능)</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {REVIEW_TAGS.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => handleTagToggle(tag)}
                        className={`review-form-tag ${formData.tags.includes(tag) ? 'review-form-tag--on' : ''}`}
                      >
                        #{tag}
                      </button>
                    ))}
                  </div>
                  {formData.tags.length > 0 && (
                    <p className="review-form-hint">선택된 항목: {formData.tags.map((t) => `#${t}`).join(', ')}</p>
                  )}
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <span className="review-form-label">평가 (선택사항)</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.35rem' }}>
                    {RATING_CATEGORIES.map((category) => (
                      <div key={category.key} style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                        <span style={{ minWidth: '7.5rem', fontSize: '0.95rem', color: 'var(--text-main)', fontWeight: 600 }}>
                          {category.label}
                        </span>
                        <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center', flexWrap: 'wrap' }}>
                          {[1, 2, 3, 4, 5].map((heart) => (
                            <button
                              key={heart}
                              type="button"
                              className="review-form-heart-btn"
                              onClick={() => handleRatingChange(category.key, heart)}
                              aria-label={`${category.label} ${heart}점`}
                            >
                              <HeartGlyph
                                filled={heart <= formData.ratings[category.key as keyof typeof formData.ratings]}
                                size={22}
                                style={{
                                  color:
                                    heart <= formData.ratings[category.key as keyof typeof formData.ratings]
                                      ? '#598e3e'
                                      : 'rgba(89, 142, 62, 0.22)',
                                }}
                              />
                            </button>
                          ))}
                          {formData.ratings[category.key as keyof typeof formData.ratings] > 0 && (
                            <span style={{ fontSize: '0.875rem', color: 'var(--text-sub)', marginLeft: '0.35rem', fontWeight: 600 }}>
                              {formData.ratings[category.key as keyof typeof formData.ratings]}점
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label className="review-form-label" htmlFor="review-password">
                    비밀번호 * (수정/삭제 시 필요)
                  </label>
                  <input
                    id="review-password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="4자 이상"
                    minLength={4}
                    maxLength={100}
                    required
                    className="review-form-input"
                    autoComplete="new-password"
                  />
                  <p className="review-form-hint">후기 수정 또는 삭제 시 필요합니다. 안전하게 보관해주세요.</p>
                </div>

                <div className="review-form-actions">
                  <button type="button" className="review-form-btn review-form-btn--secondary" onClick={() => router.push('/reviews')}>
                    취소
                  </button>
                  <button type="submit" disabled={submitting} className="review-form-btn review-form-btn--primary">
                    {submitting ? '등록 중...' : '등록하기'}
                  </button>
                </div>
              </form>
            </section>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}
