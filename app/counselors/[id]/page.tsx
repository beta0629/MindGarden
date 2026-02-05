'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
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

export default function CounselorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [counselor, setCounselor] = useState<Counselor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (params.id) {
      loadCounselor(Number(params.id));
    }
  }, [params.id]);

  const loadCounselor = async (id: number) => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/counselors', { cache: 'no-store' });
      const data = await response.json();

      if (data.success && data.counselors) {
        const found = data.counselors.find((c: Counselor) => c.id === id);
        if (found) {
          setCounselor(found);
        } else {
          setError('상담사를 찾을 수 없습니다.');
        }
      } else {
        setError('상담사 정보를 불러오는데 실패했습니다.');
      }
    } catch (err) {
      setError('상담사 정보를 불러오는데 실패했습니다.');
      console.error('Load counselor error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <main id="top">
        <Navigation />
        <div className="content-shell">
          <div className="content-main">
            <section className="content-section" style={{ paddingTop: '120px', textAlign: 'center' }}>
              <p>로딩 중...</p>
            </section>
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  if (error || !counselor) {
    return (
      <main id="top">
        <Navigation />
        <div className="content-shell">
          <div className="content-main">
            <section className="content-section" style={{ paddingTop: '120px', textAlign: 'center' }}>
              <p style={{ color: '#c33', marginBottom: '24px' }}>{error || '상담사를 찾을 수 없습니다.'}</p>
              <Link
                href="/counselors"
                style={{
                  display: 'inline-block',
                  padding: '12px 24px',
                  backgroundColor: 'var(--accent-sky)',
                  color: 'white',
                  borderRadius: 'var(--radius-sm)',
                  textDecoration: 'none',
                  fontWeight: '600'
                }}
              >
                상담사 목록으로 돌아가기
              </Link>
            </section>
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
          <section className="content-section" style={{ paddingTop: '120px' }}>
            <div style={{ maxWidth: '900px', margin: '0 auto' }}>
              {/* 뒤로가기 버튼 */}
              <Link
                href="/counselors"
                style={{
                  display: 'inline-block',
                  marginBottom: '32px',
                  color: 'var(--text-sub)',
                  textDecoration: 'none',
                  fontSize: '0.95rem',
                  fontWeight: '600'
                }}
              >
                ← 상담사 목록으로
              </Link>

              {/* 프로필 헤더 */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                marginBottom: '48px',
                padding: '40px',
                background: 'linear-gradient(135deg, var(--bg-pastel-1) 0%, var(--bg-pastel-2) 100%)',
                borderRadius: 'var(--radius-lg)',
                border: '2px solid var(--accent-sky)40'
              }}>
                {counselor.profileImageUrl ? (
                  <img
                    src={counselor.profileImageUrl}
                    alt={counselor.name}
                    style={{
                      width: '240px',
                      height: '240px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      marginBottom: '24px',
                      border: '4px solid var(--accent-sky)',
                      boxShadow: 'var(--shadow-2)'
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: '240px',
                      height: '240px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--accent-sky)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '24px',
                      fontSize: '4rem',
                      color: 'white',
                      fontWeight: '700',
                      boxShadow: 'var(--shadow-2)'
                    }}
                  >
                    {counselor.name.charAt(0)}
                  </div>
                )}

                <h1 style={{
                  fontSize: '2.25rem',
                  fontWeight: '700',
                  color: 'var(--text-main)',
                  marginBottom: '12px',
                  lineHeight: '1.4'
                }}>
                  {counselor.name}
                </h1>
                {counselor.title && (
                  <p style={{
                    fontSize: '1.25rem',
                    color: 'var(--accent-sky)',
                    fontWeight: '600',
                    marginBottom: '24px'
                  }}>
                    {counselor.title}
                  </p>
                )}
                {counselor.specialties && (
                  <div style={{
                    padding: '12px 24px',
                    backgroundColor: 'var(--accent-sky)15',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '1rem',
                    color: 'var(--text-sub)',
                    lineHeight: '1.6'
                  }}>
                    <strong>전문 분야:</strong> {counselor.specialties}
                  </div>
                )}
              </div>

              {/* 약력/소개 */}
              {counselor.bio && (
                <div style={{
                  marginBottom: '48px',
                  padding: '40px',
                  background: 'var(--surface-1)',
                  borderRadius: 'var(--radius-lg)',
                  boxShadow: 'var(--shadow-1)',
                  border: '1px solid var(--border-soft)'
                }}>
                  <h2 style={{
                    fontSize: '1.5rem',
                    fontWeight: '700',
                    color: 'var(--text-main)',
                    marginBottom: '24px',
                    paddingBottom: '16px',
                    borderBottom: '2px solid var(--accent-sky)'
                  }}>
                    약력 및 소개
                  </h2>
                  <div
                    style={{
                      fontSize: '1.0625rem',
                      lineHeight: '2',
                      color: 'var(--text-sub)',
                      wordBreak: 'keep-all'
                    }}
                    dangerouslySetInnerHTML={{ __html: counselor.bio }}
                  />
                </div>
              )}

              {/* 학력 */}
              {counselor.education && (
                <div style={{
                  marginBottom: '48px',
                  padding: '40px',
                  background: 'var(--surface-1)',
                  borderRadius: 'var(--radius-lg)',
                  boxShadow: 'var(--shadow-1)',
                  border: '1px solid var(--border-soft)'
                }}>
                  <h2 style={{
                    fontSize: '1.5rem',
                    fontWeight: '700',
                    color: 'var(--text-main)',
                    marginBottom: '24px',
                    paddingBottom: '16px',
                    borderBottom: '2px solid var(--accent-sky)'
                  }}>
                    학력
                  </h2>
                  <div
                    style={{
                      fontSize: '1.0625rem',
                      lineHeight: '2',
                      color: 'var(--text-sub)',
                      whiteSpace: 'pre-line',
                      wordBreak: 'keep-all'
                    }}
                  >
                    {counselor.education}
                  </div>
                </div>
              )}

              {/* 자격증 */}
              {counselor.certifications && (
                <div style={{
                  marginBottom: '48px',
                  padding: '40px',
                  background: 'var(--surface-1)',
                  borderRadius: 'var(--radius-lg)',
                  boxShadow: 'var(--shadow-1)',
                  border: '1px solid var(--border-soft)'
                }}>
                  <h2 style={{
                    fontSize: '1.5rem',
                    fontWeight: '700',
                    color: 'var(--text-main)',
                    marginBottom: '24px',
                    paddingBottom: '16px',
                    borderBottom: '2px solid var(--accent-sky)'
                  }}>
                    자격증
                  </h2>
                  <div
                    style={{
                      fontSize: '1.0625rem',
                      lineHeight: '2',
                      color: 'var(--text-sub)',
                      whiteSpace: 'pre-line',
                      wordBreak: 'keep-all'
                    }}
                  >
                    {counselor.certifications}
                  </div>
                </div>
              )}

              {/* 경력 */}
              {counselor.experience && (
                <div style={{
                  marginBottom: '48px',
                  padding: '40px',
                  background: 'var(--surface-1)',
                  borderRadius: 'var(--radius-lg)',
                  boxShadow: 'var(--shadow-1)',
                  border: '1px solid var(--border-soft)'
                }}>
                  <h2 style={{
                    fontSize: '1.5rem',
                    fontWeight: '700',
                    color: 'var(--text-main)',
                    marginBottom: '24px',
                    paddingBottom: '16px',
                    borderBottom: '2px solid var(--accent-sky)'
                  }}>
                    경력
                  </h2>
                  <div
                    style={{
                      fontSize: '1.0625rem',
                      lineHeight: '2',
                      color: 'var(--text-sub)',
                      whiteSpace: 'pre-line',
                      wordBreak: 'keep-all'
                    }}
                  >
                    {counselor.experience}
                  </div>
                </div>
              )}

            </div>
          </section>
        </div>
      </div>

      <Footer />
    </main>
  );
}
