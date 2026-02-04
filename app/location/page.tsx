'use client';

import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

export default function LocationPage() {
  // 네이버 지도 임베드 방식 사용 (API 키 인증 불필요)
  // 송도 아크리아2 204호 좌표를 네이버 지도 임베드 URL로 변환
  // 좌표: 37.3885, 126.6584
  const mapEmbedUrl = `https://map.naver.com/v5/search/인천광역시 연수구 송도과학로 123/place/14135647.0000000,4514567.0000000,15,0,0,0,dh`;

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
                센터 위치
              </h1>
              <p style={{
                fontSize: '1.25rem',
                color: 'var(--text-sub)',
                lineHeight: '1.8',
                maxWidth: '700px',
                margin: '0 auto'
              }}>
                마인드 가든 심리상담센터로 오시는 길을 안내해드립니다
              </p>
            </div>

            {/* 위치 정보 카드 */}
            <div style={{
              maxWidth: '1000px',
              margin: '0 auto',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '32px',
              marginBottom: '64px'
            }}>
              {/* 주소 정보 */}
              <div style={{
                background: 'linear-gradient(to bottom, rgba(255, 252, 248, 0.98) 0%, rgba(255, 250, 245, 0.95) 100%)',
                borderRadius: 'var(--radius-lg)',
                padding: '40px 32px',
                boxShadow: '0 6px 24px rgba(255, 212, 184, 0.25), 0 3px 12px rgba(0, 0, 0, 0.12)',
                border: '1px solid rgba(255, 212, 184, 0.35)',
                transition: 'all 0.3s ease'
              }}>
                <h2 style={{
                  fontSize: '1.5rem',
                  fontWeight: '700',
                  color: 'var(--text-main)',
                  marginBottom: '24px',
                  paddingBottom: '16px',
                  borderBottom: '2px solid rgba(255, 212, 184, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  📍 주소
                </h2>
                <div style={{
                  fontSize: '1.125rem',
                  lineHeight: '2',
                  color: 'var(--text-sub)'
                }}>
                  <p style={{
                    marginBottom: '16px',
                    fontWeight: '600',
                    color: 'var(--text-main)',
                    fontSize: '1.25rem'
                  }}>
                    송도 아크리아2 204호
                  </p>
                  <p style={{
                    marginBottom: '0',
                    wordBreak: 'keep-all',
                    overflowWrap: 'break-word'
                  }}>
                    인천광역시 연수구 송도과학로 123
                  </p>
                </div>
              </div>

              {/* 교통 안내 */}
              <div style={{
                background: 'linear-gradient(to bottom, rgba(255, 252, 248, 0.98) 0%, rgba(255, 250, 245, 0.95) 100%)',
                borderRadius: 'var(--radius-lg)',
                padding: '40px 32px',
                boxShadow: '0 6px 24px rgba(255, 212, 184, 0.25), 0 3px 12px rgba(0, 0, 0, 0.12)',
                border: '1px solid rgba(255, 212, 184, 0.35)',
                transition: 'all 0.3s ease'
              }}>
                <h2 style={{
                  fontSize: '1.5rem',
                  fontWeight: '700',
                  color: 'var(--text-main)',
                  marginBottom: '24px',
                  paddingBottom: '16px',
                  borderBottom: '2px solid rgba(255, 212, 184, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  🚇 교통 안내
                </h2>
                <div style={{
                  fontSize: '1.0625rem',
                  lineHeight: '2',
                  color: 'var(--text-sub)'
                }}>
                  <p style={{
                    marginBottom: '12px',
                    wordBreak: 'keep-all',
                    overflowWrap: 'break-word'
                  }}>
                    <strong style={{ color: 'var(--text-main)' }}>지하철:</strong> 인천1호선 송도달빛축제공원역 하차
                  </p>
                  <p style={{
                    marginBottom: '12px',
                    wordBreak: 'keep-all',
                    overflowWrap: 'break-word'
                  }}>
                    <strong style={{ color: 'var(--text-main)' }}>버스:</strong> 송도 아크리아2 정류장 하차
                  </p>
                  <p style={{
                    marginBottom: '0',
                    wordBreak: 'keep-all',
                    overflowWrap: 'break-word'
                  }}>
                    <strong style={{ color: 'var(--text-main)' }}>주차:</strong> 건물 지하 주차장 이용 가능
                  </p>
                </div>
              </div>
            </div>

            {/* 지도 영역 - 네이버 지도 임베드 방식 */}
            <div style={{
              maxWidth: '1000px',
              margin: '0 auto',
              background: 'linear-gradient(to bottom, rgba(255, 252, 248, 0.98) 0%, rgba(255, 250, 245, 0.95) 100%)',
              borderRadius: 'var(--radius-lg)',
              padding: '40px 32px',
              boxShadow: '0 6px 24px rgba(255, 212, 184, 0.25), 0 3px 12px rgba(0, 0, 0, 0.12)',
              border: '1px solid rgba(255, 212, 184, 0.35)',
              marginBottom: '64px'
            }}>
              <h2 style={{
                fontSize: '1.5rem',
                fontWeight: '700',
                color: 'var(--text-main)',
                marginBottom: '24px',
                paddingBottom: '16px',
                borderBottom: '2px solid rgba(255, 212, 184, 0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                🗺️ 지도
              </h2>
              <div style={{
                width: '100%',
                height: '400px',
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
                border: '2px solid rgba(255, 212, 184, 0.3)',
                position: 'relative'
              }}>
                <iframe
                  src={mapEmbedUrl}
                  width="100%"
                  height="100%"
                  style={{
                    border: 'none',
                    borderRadius: 'var(--radius-md)'
                  }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="마인드 가든 심리상담센터 위치"
                />
              </div>
            </div>

            {/* 하단 CTA */}
            <div style={{
              marginTop: '80px',
              textAlign: 'center',
              padding: '48px 32px',
              background: 'linear-gradient(135deg, var(--bg-pastel-1) 0%, var(--bg-pastel-2) 100%)',
              borderRadius: 'var(--radius-lg)',
              border: '2px solid rgba(168, 213, 186, 0.4)'
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
                센터 방문 전 상담 예약을 원하시면 아래 버튼을 클릭해주세요
              </p>
              <a
                href="/#contact"
                style={{
                  display: 'inline-block',
                  padding: '14px 32px',
                  background: 'rgba(168, 213, 186, 0.8)',
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
                  e.currentTarget.style.background = 'rgba(168, 213, 186, 1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-1)';
                  e.currentTarget.style.background = 'rgba(168, 213, 186, 0.8)';
                }}
              >
                상담 예약하기
              </a>
            </div>
          </section>
        </div>
      </div>

      <Footer />
    </main>
  );
}
