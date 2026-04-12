'use client';

import { useState, useEffect, useRef } from 'react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import Link from 'next/link';
import Image from 'next/image';
import { resolveMediaUrl } from '@/lib/resolveMediaUrl';
import CopyGuard from '@/components/CopyGuard';

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

const HEAD_COUNSELOR = {
  name: '김선희',
  title: '대표원장',
  imageUrl: '/assets/images/counselors/kim-sunhee-director.png',
  specialties: [
    'ADHD, ADD(조용한 ADHD)',
    '틱, 투렛',
    '아스퍼거',
    'HSP(초민감성)',
    'PTSD(외상후 스트레스장애), 트라우마',
    '불안, 강박, 공황장애',
    '우울, 양극성(조울)',
    '조현병',
    '경계선 성격, 애착문제',
    '자해, 자살, 위기개입',
    '아동. 청소년(등교거부, 적응, 학폭, 따돌림, 게임중독, 사회성증진)',
    '부부, 커플, 가족상담',
    '양육코칭 , 부모교육',
    '부부갈등 , 이혼 재결합',
  ],
  education: '청소년 교육(학사), 상담학(석사), 가족상담(박사일부수료)',
  certifications: [
    '한국상담학회 전문상담사, 부부가족분과, 재난상담 분과 소속',
    '보건복지부 사회복지사',
    '여성가족부 청소년지도사',
    '놀이치료사, 미술치료사, 교류분석사'
  ],
  experience: [
    '전) 인천지역 건강·다문화가족지원센터, 부부가족상담',
    '전) 인천지역 소방공무원·PTSD·트라우마 상담 및 검사',
    '전) 한국이민재단·부부 상호 이해 과목 강사(결혼이민자조기적응P)',
    '전) 인천지역 초등학교 외부 전문상담사',
    '전) 아동보호전문기관(법원수탁프로그램)·부모교육·개인·가족상담',
    '전) 유명 프랜차이즈 심리상담센터 (아동, 청소년, 성인, 부부 가족, 수석상담사 역임)',
    '전) 트리니티 심리상담연구소 소장(아동, 청소년, 부부, 가족)',
    '전) 한부모가정지지·사회복지 사례담당자 힐링 프로그램',
    '전) 정서조절P·감정코칭·자기이해·자녀양육·청소년 진로집단P'
  ],
  trainingTitle: '교육 수료 및 이수',
  trainingDetail:
    '경험적 가족치료, 인간중심, 미술치료, 모래놀이, 놀이치료, 교류분석, 종합심리검사 및 각종 검사 자격이수',
};

export default function CounselorsPage() {
  const [counselors, setCounselors] = useState<Counselor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  // 모바일 감지
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // 터치 스와이프 관련 상태
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const touchEndY = useRef<number | null>(null);
  
  // 터치 스와이프 핸들러
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };
  
  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
    touchEndY.current = e.touches[0].clientY;
  };
  
  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current || !touchStartY.current || !touchEndY.current) return;
    if (!scrollContainerRef.current) return;
    
    const deltaX = touchStartX.current - touchEndX.current;
    const deltaY = touchStartY.current - touchEndY.current;
    const minSwipeDistance = 50;
    
    // 수평 스와이프가 수직 스와이프보다 큰 경우에만 처리
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > minSwipeDistance) {
      const container = scrollContainerRef.current;
      const scrollAmount = container.offsetWidth * 0.8; // 한 번에 80% 스크롤
      
      if (deltaX > 0) {
        // 왼쪽으로 스와이프 (다음으로)
        container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      } else {
        // 오른쪽으로 스와이프 (이전으로)
        container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
      }
    }
    
    // 리셋
    touchStartX.current = null;
    touchStartY.current = null;
    touchEndX.current = null;
    touchEndY.current = null;
  };

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
                전문가
              </h1>
              <p style={{
                fontSize: '1.25rem',
                color: 'var(--text-sub)',
                lineHeight: '1.8',
                maxWidth: '700px',
                margin: '0 auto'
              }}>
                마인드 가든의 전문가 소개
              </p>
            </div>

            {/* 대표원장 섹션 */}
            <CopyGuard
              as="div"
              style={{
                maxWidth: '1000px',
                margin: '0 auto 64px',
                background: 'linear-gradient(to bottom, var(--white) 0%, rgba(184, 212, 227, 0.05) 100%)',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-1)',
                border: '2px solid var(--accent-sky)40',
                padding: isMobile ? '32px 24px' : '48px',
                display: 'flex',
                flexDirection: isMobile ? 'column' : 'row',
                gap: '40px',
                alignItems: isMobile ? 'center' : 'flex-start',
              }}
            >
              {/* 왼쪽: 프로필 이미지 */}
              <div style={{
                flexShrink: 0,
                width: isMobile ? '200px' : '280px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
              }}>
                <div style={{
                  width: '100%',
                  aspectRatio: '1/1',
                  position: 'relative',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  marginBottom: '24px',
                  border: '4px solid var(--accent-sky)',
                  boxShadow: 'var(--shadow-1)'
                }}>
                  <Image
                    src={HEAD_COUNSELOR.imageUrl}
                    alt={`${HEAD_COUNSELOR.name} ${HEAD_COUNSELOR.title}`}
                    fill
                    style={{ objectFit: 'cover' }}
                  />
                </div>
                <h2 style={{
                  fontSize: '1.75rem',
                  fontWeight: '700',
                  color: 'var(--text-main)',
                  marginBottom: '8px'
                }}>
                  {HEAD_COUNSELOR.name} <span style={{ fontSize: '1.25rem', color: 'var(--accent-sky)', fontWeight: '600' }}>{HEAD_COUNSELOR.title}</span>
                </h2>
              </div>

              {/* 오른쪽: 약력 및 상담분야 */}
              <div style={{ flex: 1, width: '100%' }}>
                {/* 상담분야 태그 */}
                <div style={{ marginBottom: '32px' }}>
                  <h3 style={{ 
                    fontSize: '1.1rem', 
                    fontWeight: '700', 
                    color: 'var(--text-main)', 
                    marginBottom: '16px', 
                    borderBottom: '2px solid var(--accent-sky)', 
                    paddingBottom: '8px', 
                    display: 'inline-block' 
                  }}>
                    상담 분야
                  </h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {HEAD_COUNSELOR.specialties.map((specialty, idx) => (
                      <span key={idx} style={{
                        background: 'var(--accent-sky)',
                        color: 'white',
                        padding: '6px 14px',
                        borderRadius: '999px',
                        fontSize: '0.9rem',
                        fontWeight: '500',
                        boxShadow: 'var(--shadow-sm)'
                      }}>
                        {specialty}
                      </span>
                    ))}
                  </div>
                </div>

                {/* 약력 리스트 */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <div>
                    <h4 style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '8px' }}>전공</h4>
                    <p style={{ fontSize: '0.95rem', color: 'var(--text-sub)', lineHeight: '1.6', wordBreak: 'keep-all' }}>{HEAD_COUNSELOR.education}</p>
                  </div>
                  
                  <div>
                    <h4 style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '8px' }}>전문자격</h4>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                      {HEAD_COUNSELOR.certifications.map((cert, idx) => (
                        <li key={idx} style={{ 
                          fontSize: '0.95rem', 
                          color: 'var(--text-sub)', 
                          lineHeight: '1.6', 
                          position: 'relative', 
                          paddingLeft: '12px', 
                          marginBottom: '4px',
                          wordBreak: 'keep-all'
                        }}>
                          <span style={{ 
                            position: 'absolute', 
                            left: 0, 
                            top: '8px', 
                            width: '4px', 
                            height: '4px', 
                            borderRadius: '50%', 
                            backgroundColor: 'var(--accent-sky)' 
                          }} />
                          {cert}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '8px' }}>강의 및 상담 경력</h4>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                      {HEAD_COUNSELOR.experience.map((exp, idx) => (
                        <li key={idx} style={{ 
                          fontSize: '0.95rem', 
                          color: 'var(--text-sub)', 
                          lineHeight: '1.6', 
                          position: 'relative', 
                          paddingLeft: '12px', 
                          marginBottom: '4px',
                          wordBreak: 'keep-all'
                        }}>
                          <span style={{ 
                            position: 'absolute', 
                            left: 0, 
                            top: '8px', 
                            width: '4px', 
                            height: '4px', 
                            borderRadius: '50%', 
                            backgroundColor: 'var(--accent-sky)' 
                          }} />
                          {exp}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4
                      style={{
                        fontSize: '1rem',
                        fontWeight: '700',
                        color: 'var(--text-main)',
                        marginBottom: '8px',
                      }}
                    >
                      {HEAD_COUNSELOR.trainingTitle}
                    </h4>
                    <p
                      style={{
                        fontSize: '0.95rem',
                        color: 'var(--text-sub)',
                        lineHeight: '1.6',
                        wordBreak: 'keep-all',
                        margin: 0,
                      }}
                    >
                      {HEAD_COUNSELOR.trainingDetail}
                    </p>
                  </div>
                </div>
              </div>
            </CopyGuard>

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
              <div 
                ref={scrollContainerRef}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                style={{
                  maxWidth: '1000px',
                  margin: '0 auto',
                  display: isMobile ? 'flex' : 'grid',
                  gridTemplateColumns: isMobile ? 'none' : 'repeat(auto-fit, minmax(300px, 1fr))',
                  gap: '32px',
                  overflowX: isMobile ? 'auto' : 'visible',
                  overflowY: 'visible',
                  scrollSnapType: isMobile ? 'x mandatory' : 'none',
                  scrollBehavior: 'smooth',
                  scrollbarWidth: isMobile ? 'thin' : 'auto',
                  msOverflowStyle: isMobile ? 'auto' : 'none',
                  WebkitOverflowScrolling: 'touch',
                  touchAction: isMobile ? 'pan-x pinch-zoom' : 'auto',
                }}
              >
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
                      textAlign: 'center',
                      minWidth: isMobile ? 'calc(100vw - 64px)' : 'auto',
                      flexShrink: 0,
                      scrollSnapAlign: isMobile ? 'start' : 'none',
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
                        src={resolveMediaUrl(counselor.profileImageUrl) ?? counselor.profileImageUrl}
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
          </section>
        </div>
      </div>

      <Footer />
    </main>
  );
}
