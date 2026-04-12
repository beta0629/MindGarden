'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { resolveMediaUrl } from '@/lib/resolveMediaUrl';

interface GalleryImage {
  id: number;
  url: string;
  alt: string;
  category: string | null;
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

export default function GalleryPage() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [groupedImages, setGroupedImages] = useState<Record<string, GalleryImage[]>>({});

  useEffect(() => {
    loadImages();
  }, []);

  useEffect(() => {
    // 카테고리별로 그룹화
    const grouped: Record<string, GalleryImage[]> = {};
    const filteredImages = selectedCategory
      ? images.filter(img => img.category === selectedCategory)
      : images;

    filteredImages.forEach(img => {
      const category = img.category || '기타';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(img);
    });

    setGroupedImages(grouped);
  }, [images, selectedCategory]);

  const loadImages = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/gallery');
      const data = await response.json();
      
      if (data.success && data.images) {
        setImages(data.images);
      } else {
        setImages([]);
      }
    } catch (error) {
      console.error('Load gallery images error:', error);
      setImages([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main id="top">
      <Navigation />
      <div className="content-shell">
        <div className="content-main">
          <section className="content-section" style={{ paddingTop: '4rem' }}>
            <h1 className="section-title" style={{ marginBottom: '2rem' }}>
              공간 소개
            </h1>
            <p className="section-desc" style={{ marginBottom: '3rem' }}>
              마인드가든의 따뜻하고 안전한 공간을 소개합니다.
            </p>

            {/* 카테고리 필터 */}
            <div style={{
              display: 'flex',
              gap: '0.75rem',
              flexWrap: 'wrap',
              marginBottom: '3rem',
              justifyContent: 'center',
            }}>
              <button
                onClick={() => setSelectedCategory(null)}
                style={{
                  padding: '0.625rem 1.25rem',
                  borderRadius: '2rem',
                  border: 'none',
                  backgroundColor: selectedCategory === null ? 'var(--accent-cta)' : '#f1f5f9',
                  color: selectedCategory === null ? 'white' : '#64748b',
                  fontSize: '0.875rem',
                  fontWeight: selectedCategory === null ? '600' : '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                전체
              </button>
              {CATEGORIES.map(cat => (
                <button
                  key={cat.value}
                  onClick={() => setSelectedCategory(cat.value)}
                  style={{
                    padding: '0.625rem 1.25rem',
                    borderRadius: '2rem',
                    border: 'none',
                    backgroundColor: selectedCategory === cat.value ? 'var(--accent-cta)' : '#f1f5f9',
                    color: selectedCategory === cat.value ? 'white' : '#64748b',
                    fontSize: '0.875rem',
                    fontWeight: selectedCategory === cat.value ? '600' : '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* 갤러리 그룹 */}
            {loading ? (
              <div style={{ textAlign: 'center', padding: '5rem 0' }}>
                <p style={{ color: '#64748b' }}>로딩 중...</p>
              </div>
            ) : Object.keys(groupedImages).length === 0 ? (
              <div style={{ textAlign: 'center', padding: '5rem 0' }}>
                <p style={{ color: '#64748b' }}>등록된 이미지가 없습니다.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4rem' }}>
                {Object.entries(groupedImages).map(([category, categoryImages]) => (
                  <div key={category}>
                    <h2 style={{
                      fontSize: '1.5rem',
                      fontWeight: '700',
                      color: '#1e293b',
                      marginBottom: '1.5rem',
                      paddingBottom: '0.75rem',
                      borderBottom: '2px solid var(--accent-cta)',
                    }}>
                      {category}
                    </h2>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                      gap: '1.5rem',
                    }}>
                      {categoryImages.map((image) => (
                        <Link
                          key={image.id}
                          href={`/gallery/${category}/${image.id}`}
                          style={{
                            textDecoration: 'none',
                            color: 'inherit',
                            display: 'block',
                          }}
                        >
                          <div style={{
                            position: 'relative',
                            aspectRatio: '4/3',
                            borderRadius: '0.75rem',
                            overflow: 'hidden',
                            backgroundColor: '#f1f5f9',
                            cursor: 'pointer',
                            transition: 'transform 0.3s, box-shadow 0.3s',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'scale(1.02)';
                            e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(0, 0, 0, 0.1)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'scale(1)';
                            e.currentTarget.style.boxShadow = 'none';
                          }}
                          >
                            <img
                              src={resolveMediaUrl(image.url) ?? image.url}
                              alt={image.alt}
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                              }}
                            />
                            <div style={{
                              position: 'absolute',
                              bottom: 0,
                              left: 0,
                              right: 0,
                              background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)',
                              padding: '1rem',
                              color: 'white',
                              fontSize: '0.875rem',
                            }}>
                              {image.alt}
                            </div>
                          </div>
                        </Link>
                      ))}
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
