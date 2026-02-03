'use client';

import { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import Link from 'next/link';

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
}

export default function CounselorsPage() {
  const [counselors, setCounselors] = useState<Counselor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCounselors();
  }, []);

  const loadCounselors = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/counselors', { cache: 'no-store' });
      const data = await response.json();

      if (data.success && data.counselors) {
        setCounselors(data.counselors);
      } else {
        setCounselors([]);
      }
    } catch (err) {
      setError('상담사 목록을 불러오는데 실패했습니다.');
      console.error('Load counselors error:', err);
      setCounselors([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main id="top">
      <Navigation />
      
      <div className="content-shell">
        <div className="content-main">
          <section className="content-section" style={{ paddingTop: '120px' }}>
            {/* 헤더 */}
            <div style={{
              textAlign: 'center',
              marginBottom: '64px',
              maxWidth: '900px',
              margin: '0 auto 64px'
            }}>
              <h1 style={{
                fontSize: '2.5rem',
                fontWeight: '700',
                color: 'var(--text-main)',
                marginBottom: '24px',
                lineHeight: '1.4',
                letterSpacing: '-0.02em',
                wordBreak: 'keep-all'
              }}>
                마인드가든 선생님들
              </h1>
              <p style={{
                fontSize: '1.25rem',
                color: 'var(--text-sub)',
                lineHeight: '1.8',
                maxWidth: '700px',
                margin: '0 auto'
              }}>
                마인드 가든의 전문 선생님들을 소개합니다
              </p>
            </div>

            {/* 상담사 목록 */}
            {loading ? (
              <div style={{ textAlign: 'center', padding: '80px 20px' }}>
                <p>로딩 중...</p>
              </div>
            ) : error ? (
              <div style={{
                textAlign: 'center',
                padding: '80px 20px',
                color: '#c33'
              }}>
                <p>{error}</p>
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
              <div style={{
                maxWidth: '1000px',
                margin: '0 auto',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '32px'
              }}>
                {counselors.map((counselor) => (
                  <div
                    key={counselor.id}
                    style={{
                      background: 'linear-gradient(to bottom, var(--white) 0%, rgba(184, 212, 227, 0.05) 100%)',
                      borderRadius: 'var(--radius-lg)',
                      padding: '32px',
                      boxShadow: 'var(--shadow-1)',
                      border: '2px solid var(--accent-sky)40',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      textAlign: 'center'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.boxShadow = 'var(--shadow-2)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'var(--shadow-1)';
                    }}
                  >
                    {/* 프로필 이미지 */}
                    {counselor.profileImageUrl ? (
                      <img
                        src={counselor.profileImageUrl}
                        alt={counselor.name}
                        style={{
                          width: '180px',
                          height: '180px',
                          borderRadius: '50%',
                          objectFit: 'cover',
                          marginBottom: '24px',
                          border: '4px solid var(--accent-sky)',
                          boxShadow: 'var(--shadow-1)'
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: '180px',
                          height: '180px',
                          borderRadius: '50%',
                          backgroundColor: 'var(--accent-sky)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginBottom: '24px',
                          fontSize: '3rem',
                          color: 'white',
                          fontWeight: '700'
                        }}
                      >
                        {counselor.name.charAt(0)}
                      </div>
                    )}

                    {/* 이름 및 직함 */}
                    <h2 style={{
                      fontSize: '1.5rem',
                      fontWeight: '700',
                      color: 'var(--text-main)',
                      marginBottom: '8px',
                      lineHeight: '1.4'
                    }}>
                      {counselor.name}
                    </h2>
                    {counselor.title && (
                      <p style={{
                        fontSize: '1rem',
                        color: 'var(--accent-sky)',
                        fontWeight: '600',
                        marginBottom: '16px'
                      }}>
                        {counselor.title}
                      </p>
                    )}

                    {/* 전문 분야 */}
                    {counselor.specialties && (
                      <div style={{
                        marginBottom: '16px',
                        padding: '8px 16px',
                        backgroundColor: 'var(--accent-sky)15',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.9rem',
                        color: 'var(--text-sub)',
                        lineHeight: '1.6'
                      }}>
                        <strong>전문 분야:</strong> {counselor.specialties}
                      </div>
                    )}

                    {/* 약력 미리보기 */}
                    {counselor.bio && (
                      <div
                        style={{
                          fontSize: '0.95rem',
                          color: 'var(--text-sub)',
                          lineHeight: '1.8',
                          marginTop: '16px',
                          textAlign: 'left',
                          maxHeight: '150px',
                          overflow: 'hidden',
                          position: 'relative'
                        }}
                        dangerouslySetInnerHTML={{
                          __html: counselor.bio.length > 200
                            ? counselor.bio.substring(0, 200) + '...'
                            : counselor.bio
                        }}
                      />
                    )}

                    {/* 상세 보기 버튼 */}
                    <Link
                      href={`/counselors/${counselor.id}`}
                      style={{
                        display: 'inline-block',
                        marginTop: '24px',
                        padding: '10px 24px',
                        backgroundColor: 'var(--accent-sky)',
                        color: 'white',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.95rem',
                        fontWeight: '600',
                        textDecoration: 'none',
                        transition: 'all 0.2s',
                        boxShadow: 'var(--shadow-1)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = 'var(--shadow-2)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'var(--shadow-1)';
                      }}
                    >
                      상세 보기
                    </Link>
                  </div>
                ))}
              </div>
            )}

            {/* 하단 CTA */}
            <div style={{
              marginTop: '80px',
              textAlign: 'center',
              padding: '48px 32px',
              background: 'linear-gradient(135deg, var(--bg-pastel-1) 0%, var(--bg-pastel-2) 100%)',
              borderRadius: 'var(--radius-lg)',
              border: '2px solid var(--accent-sky)40'
            }}>
              <h3 style={{
                fontSize: '1.75rem',
                fontWeight: '700',
                color: 'var(--text-main)',
                marginBottom: '16px'
              }}>
                상담 문의하기
              </h3>
              <p style={{
                fontSize: '1.125rem',
                color: 'var(--text-sub)',
                marginBottom: '32px',
                lineHeight: '1.8'
              }}>
                전문 상담사와 함께 시작하는 회복의 여정
              </p>
              <Link
                href="/#contact"
                style={{
                  display: 'inline-block',
                  padding: '14px 32px',
                  background: 'var(--accent-sky)',
                  color: 'white',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '1.0625rem',
                  fontWeight: '600',
                  textDecoration: 'none',
                  transition: 'all 0.2s',
                  boxShadow: 'var(--shadow-1)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-1)';
                }}
              >
                상담 예약하기
              </Link>
            </div>
          </section>
        </div>
      </div>

      <Footer />
    </main>
  );
}
