'use client';

import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

export default function LocationPage() {
  // 구글 지도 임베드 방식 사용 (HTTPS 완전 지원, Mixed Content 오류 없음)
  // 송도 아크리아2 204호 주소
  const address = '인천광역시 연수구 해돋이로120번길 23';
  const buildingName = '아크리아2 2층 204호';
  const fullAddress = `${address} ${buildingName} 마인드가든 심리상담센터`;
  
  // 구글 지도 임베드 URL (API 키 없이도 작동하는 공개 방식)
  // 방법 1: API 키가 있는 경우 - Embed API 사용
  const googleMapEmbedUrlWithKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY 
    ? `https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&q=${encodeURIComponent(fullAddress)}`
    : null;
  
  // 방법 2: API 키 없이도 작동하는 공개 임베드 URL (구글 지도 공유 링크 기반)
  // 구글 지도에서 주소를 검색한 후 공유 > 지도 퍼가기에서 얻은 iframe URL 형식
  const googleMapEmbedUrl = `https://www.google.com/maps?q=${encodeURIComponent(fullAddress)}&output=embed`;
  
  // 구글 지도 검색 링크 (새 탭에서 열기) - 송도 지점 노출을 위해 지역명 포함
  const googleMapSearchUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent('송도 마인드가든 심리상담센터')}`;
  // 네이버 지도 링크 (대체 옵션) - 배곧 등 타 지점 노출 방지를 위해 지역명 포함
  const naverMapLinkUrl = `https://map.naver.com/v5/search/${encodeURIComponent('송도 마인드가든 심리상담센터')}`;

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
                background: '#ffffff',
                borderRadius: 'var(--radius-lg)',
                padding: '40px 32px',
                boxShadow: '0 6px 24px rgba(168, 213, 186, 0.25), 0 3px 12px rgba(0, 0, 0, 0.12)',
                border: '1px solid rgba(168, 213, 186, 0.35)',
                transition: 'all 0.3s ease'
              }}>
                <h2 style={{
                  fontSize: '1.5rem',
                  fontWeight: '700',
                  color: 'var(--text-main)',
                  marginBottom: '24px',
                  paddingBottom: '16px',
                  borderBottom: '2px solid rgba(168, 213, 186, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  주소
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
                    마인드가든 심리상담센터
                  </p>
                  <p style={{
                    marginBottom: '0',
                    wordBreak: 'keep-all',
                    overflowWrap: 'break-word'
                  }}>
                    인천 연수구 해돋이로120번길 23<br />아크리아2 2층 204호
                  </p>
                </div>
              </div>

              {/* 교통 안내 */}
              <div style={{
                background: '#ffffff',
                borderRadius: 'var(--radius-lg)',
                padding: '40px 32px',
                boxShadow: '0 6px 24px rgba(168, 213, 186, 0.25), 0 3px 12px rgba(0, 0, 0, 0.12)',
                border: '1px solid rgba(168, 213, 186, 0.35)',
                transition: 'all 0.3s ease'
              }}>
                <h2 style={{
                  fontSize: '1.5rem',
                  fontWeight: '700',
                  color: 'var(--text-main)',
                  marginBottom: '24px',
                  paddingBottom: '16px',
                  borderBottom: '2px solid rgba(168, 213, 186, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  교통 안내
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
              background: '#ffffff',
              borderRadius: 'var(--radius-lg)',
              padding: '40px 32px',
              boxShadow: '0 6px 24px rgba(168, 213, 186, 0.25), 0 3px 12px rgba(0, 0, 0, 0.12)',
              border: '1px solid rgba(168, 213, 186, 0.35)',
              marginBottom: '64px'
            }}>
              <h2 style={{
                fontSize: '1.5rem',
                fontWeight: '700',
                color: 'var(--text-main)',
                marginBottom: '24px',
                paddingBottom: '16px',
                borderBottom: '2px solid rgba(168, 213, 186, 0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                지도
              </h2>
              <div style={{
                width: '100%',
                height: '400px',
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
                border: '2px solid rgba(168, 213, 186, 0.3)',
                position: 'relative',
                background: '#f5f5f5'
              }}>
                {/* 구글 지도 임베드 (API 키 없이도 작동) */}
                <iframe
                  src={googleMapEmbedUrlWithKey || googleMapEmbedUrl}
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
              {/* 지도 옵션 링크 */}
              <div style={{
                marginTop: '16px',
                display: 'flex',
                gap: '12px',
                justifyContent: 'center',
                flexWrap: 'wrap'
              }}>
                <a
                  href={googleMapSearchUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    padding: '8px 16px',
                    background: 'rgba(255, 255, 255, 0.9)',
                    color: 'var(--text-main)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    textDecoration: 'none',
                    border: '1px solid rgba(168, 213, 186, 0.3)',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(168, 213, 186, 0.1)';
                    e.currentTarget.style.borderColor = 'rgba(168, 213, 186, 0.5)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.9)';
                    e.currentTarget.style.borderColor = 'rgba(168, 213, 186, 0.3)';
                  }}
                >
                  구글 지도
                </a>
                <a
                  href={naverMapLinkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    padding: '8px 16px',
                    background: 'rgba(255, 255, 255, 0.9)',
                    color: 'var(--text-main)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    textDecoration: 'none',
                    border: '1px solid rgba(168, 213, 186, 0.3)',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(168, 213, 186, 0.1)';
                    e.currentTarget.style.borderColor = 'rgba(168, 213, 186, 0.5)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.9)';
                    e.currentTarget.style.borderColor = 'rgba(168, 213, 186, 0.3)';
                  }}
                >
                  네이버 지도
                </a>
              </div>
            </div>

          </section>
        </div>
      </div>

      <Footer />
    </main>
  );
}
