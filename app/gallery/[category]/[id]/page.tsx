'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

interface GalleryImage {
  id: number;
  url: string;
  alt: string;
  category: string | null;
}

export default function GalleryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const category = params.category as string;
  const id = parseInt(params.id as string);
  
  const [image, setImage] = useState<GalleryImage | null>(null);
  const [allImages, setAllImages] = useState<GalleryImage[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadImages();
  }, [category]);

  useEffect(() => {
    if (allImages.length > 0) {
      const index = allImages.findIndex(img => img.id === id);
      if (index !== -1) {
        setCurrentIndex(index);
        setImage(allImages[index]);
      }
    }
  }, [allImages, id]);

  const loadImages = async () => {
    try {
      setLoading(true);
      
      // 먼저 URL의 category로 시도
      let response = await fetch(`/api/gallery?category=${encodeURIComponent(category)}`);
      let data = await response.json();
      
      // 이미지를 찾지 못했고, category가 "기타"가 아니면 "기타"로 다시 시도
      if (data.success && data.images) {
        const foundImage = data.images.find((img: GalleryImage) => img.id === id);
        if (!foundImage && category !== '기타') {
          // "기타" 카테고리로 다시 시도
          response = await fetch(`/api/gallery?category=${encodeURIComponent('기타')}`);
          data = await response.json();
        }
      }
      
      if (data.success && data.images) {
        // category가 null인 이미지는 "기타"로 표시
        const processedImages = data.images.map((img: GalleryImage) => ({
          ...img,
          category: img.category || '기타',
        }));
        
        setAllImages(processedImages);
        const foundImage = processedImages.find((img: GalleryImage) => img.id === id);
        if (foundImage) {
          setImage(foundImage);
          setCurrentIndex(processedImages.findIndex((img: GalleryImage) => img.id === id));
        }
      }
    } catch (error) {
      console.error('Load gallery image error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      const prevImage = allImages[currentIndex - 1];
      const prevCategory = prevImage.category || '기타';
      router.push(`/gallery/${encodeURIComponent(prevCategory)}/${prevImage.id}`);
    }
  };

  const handleNext = () => {
    if (currentIndex < allImages.length - 1) {
      const nextImage = allImages[currentIndex + 1];
      const nextCategory = nextImage.category || '기타';
      router.push(`/gallery/${encodeURIComponent(nextCategory)}/${nextImage.id}`);
    }
  };

  if (loading) {
    return (
      <main id="top">
        <Navigation />
        <div className="content-shell">
          <div className="content-main">
            <div style={{ textAlign: 'center', padding: '5rem 0' }}>
              <p style={{ color: '#64748b' }}>로딩 중...</p>
            </div>
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  if (!image) {
    return (
      <main id="top">
        <Navigation />
        <div className="content-shell">
          <div className="content-main">
            <div style={{ textAlign: 'center', padding: '5rem 0' }}>
              <p style={{ color: '#64748b', marginBottom: '1rem' }}>이미지를 찾을 수 없습니다.</p>
              <Link
                href="/gallery"
                style={{
                  display: 'inline-block',
                  padding: '0.625rem 1.25rem',
                  backgroundColor: '#B8956A',
                  color: 'white',
                  borderRadius: '0.5rem',
                  textDecoration: 'none',
                  fontWeight: '500',
                }}
              >
                갤러리로 돌아가기
              </Link>
            </div>
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  return (
    <main id="top">
      <Navigation />
      <div className="content-shell">
        <div className="content-main">
          <section className="content-section" style={{ paddingTop: '4rem' }}>
            {/* 네비게이션 */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              marginBottom: '2rem',
            }}>
              <Link
                href="/gallery"
                style={{
                  color: '#64748b',
                  textDecoration: 'none',
                  fontSize: '0.875rem',
                }}
              >
                갤러리
              </Link>
              <span style={{ color: '#cbd5e1' }}>/</span>
              <Link
                href={`/gallery?category=${encodeURIComponent(image.category || '기타')}`}
                style={{
                  color: '#64748b',
                  textDecoration: 'none',
                  fontSize: '0.875rem',
                }}
              >
                {image.category || '기타'}
              </Link>
            </div>

            {/* 이미지 뷰어 */}
            <div style={{
              position: 'relative',
              maxWidth: '1200px',
              margin: '0 auto',
              marginBottom: '2rem',
            }}>
              <div style={{
                position: 'relative',
                aspectRatio: '16/9',
                borderRadius: '1rem',
                overflow: 'hidden',
                backgroundColor: '#f1f5f9',
              }}>
                <img
                  src={image.url}
                  alt={image.alt}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                  }}
                />
                
                {/* 이전/다음 버튼 */}
                {allImages.length > 1 && (
                  <>
                    <button
                      onClick={handlePrevious}
                      disabled={currentIndex === 0}
                      style={{
                        position: 'absolute',
                        left: '1rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        padding: '0.75rem 1rem',
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.5rem',
                        cursor: currentIndex === 0 ? 'not-allowed' : 'pointer',
                        opacity: currentIndex === 0 ? 0.5 : 1,
                        fontSize: '1.25rem',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        if (currentIndex > 0) {
                          e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
                      }}
                    >
                      ←
                    </button>
                    <button
                      onClick={handleNext}
                      disabled={currentIndex === allImages.length - 1}
                      style={{
                        position: 'absolute',
                        right: '1rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        padding: '0.75rem 1rem',
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.5rem',
                        cursor: currentIndex === allImages.length - 1 ? 'not-allowed' : 'pointer',
                        opacity: currentIndex === allImages.length - 1 ? 0.5 : 1,
                        fontSize: '1.25rem',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        if (currentIndex < allImages.length - 1) {
                          e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
                      }}
                    >
                      →
                    </button>
                  </>
                )}
              </div>

              {/* 이미지 정보 */}
              <div style={{
                marginTop: '1.5rem',
                padding: '1.5rem',
                backgroundColor: 'white',
                borderRadius: '0.75rem',
                boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
              }}>
                <h2 style={{
                  fontSize: '1.5rem',
                  fontWeight: '700',
                  color: '#1e293b',
                  marginBottom: '0.5rem',
                }}>
                  {image.alt}
                </h2>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  color: '#64748b',
                  fontSize: '0.875rem',
                }}>
                  <span style={{
                    padding: '0.25rem 0.75rem',
                    backgroundColor: '#B8956A',
                    color: 'white',
                    borderRadius: '9999px',
                    fontSize: '0.75rem',
                    fontWeight: '500',
                  }}>
                    {image.category || '기타'}
                  </span>
                  <span>
                    {currentIndex + 1} / {allImages.length}
                  </span>
                </div>
              </div>
            </div>

            {/* 썸네일 그리드 */}
            {allImages.length > 1 && (
              <div style={{
                marginTop: '3rem',
              }}>
                <h3 style={{
                  fontSize: '1.125rem',
                  fontWeight: '600',
                  color: '#1e293b',
                  marginBottom: '1rem',
                }}>
                  다른 이미지 보기
                </h3>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                  gap: '1rem',
                }}>
                  {allImages.map((img, idx) => {
                    const imgCategory = img.category || '기타';
                    return (
                    <Link
                      key={img.id}
                      href={`/gallery/${encodeURIComponent(imgCategory)}/${img.id}`}
                      style={{
                        textDecoration: 'none',
                        display: 'block',
                      }}
                    >
                      <div style={{
                        position: 'relative',
                        aspectRatio: '4/3',
                        borderRadius: '0.5rem',
                        overflow: 'hidden',
                        backgroundColor: '#f1f5f9',
                        border: currentIndex === idx ? '3px solid #B8956A' : '1px solid #e2e8f0',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.05)';
                        e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                      >
                        <img
                          src={img.url}
                          alt={img.alt}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                          }}
                        />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
      <Footer />
    </main>
  );
}
