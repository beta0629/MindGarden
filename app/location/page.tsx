'use client';

import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { getGoogleMapsEmbedSrc, getGoogleMapsOpenUrl } from '@/lib/location-map';

export default function LocationPage() {
  /** 단일 핀(좌표 고정) — `lib/location-map.ts` 참고. 퍼가기 URL 덮어쓰기는 NEXT_PUBLIC_GOOGLE_MAPS_EMBED_IFRAME_SRC */
  const googleMapEmbedSrc = getGoogleMapsEmbedSrc();
  const googleMapOpenUrl = getGoogleMapsOpenUrl();
  // 네이버: 건물 도로명으로 검색(다지점 혼동 시 지도에서 확인)
  const naverMapLinkUrl = `https://map.naver.com/v5/search/${encodeURIComponent('인천 연수구 해돋이로120번길 23 아크리아2')}`;

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
                boxShadow: '0 6px 24px rgba(89, 142, 62, 0.25), 0 3px 12px rgba(0, 0, 0, 0.12)',
                border: '1px solid rgba(89, 142, 62, 0.35)',
                transition: 'all 0.3s ease'
              }}>
                <h2 style={{
                  fontSize: '1.5rem',
                  fontWeight: '700',
                  color: 'var(--text-main)',
                  marginBottom: '24px',
                  paddingBottom: '16px',
                  borderBottom: '2px solid rgba(89, 142, 62, 0.3)',
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
                boxShadow: '0 6px 24px rgba(89, 142, 62, 0.25), 0 3px 12px rgba(0, 0, 0, 0.12)',
                border: '1px solid rgba(89, 142, 62, 0.35)',
                transition: 'all 0.3s ease'
              }}>
                <h2 style={{
                  fontSize: '1.5rem',
                  fontWeight: '700',
                  color: 'var(--text-main)',
                  marginBottom: '24px',
                  paddingBottom: '16px',
                  borderBottom: '2px solid rgba(89, 142, 62, 0.3)',
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
                    <strong style={{ color: 'var(--text-main)' }}>지하철:</strong>{' '}
                    인천 1호선 캠퍼스타운역 하차 → 4번 출구 방향으로 나와 도보 약 1.5km(약 24분)
                  </p>
                  <p style={{
                    marginBottom: '8px',
                    wordBreak: 'keep-all',
                    overflowWrap: 'break-word'
                  }}>
                    <strong style={{ color: 'var(--text-main)' }}>버스:</strong>
                  </p>
                  <ul
                    style={{
                      margin: '0 0 12px 0',
                      paddingLeft: '1.25rem',
                      listStyle: 'disc',
                      color: 'var(--text-sub)',
                    }}
                  >
                    <li style={{ marginBottom: '8px' }}>
                      <strong style={{ color: 'var(--text-main)' }}>330번</strong> 해양경찰청 하차 → 도보 약 176m(약 2분)
                    </li>
                    <li style={{ marginBottom: '8px' }}>
                      <strong style={{ color: 'var(--text-main)' }}>16번</strong> 송도힐스테이트 5단지 하차 → 도보 약 231m(약 4분)
                    </li>
                    <li style={{ marginBottom: '0' }}>
                      <strong style={{ color: 'var(--text-main)' }}>8번</strong> 송도풍림아이원 2단지 하차 → 아크리아 2 상가 바로 앞
                    </li>
                  </ul>
                  <p style={{
                    marginBottom: '0',
                    wordBreak: 'keep-all',
                    overflowWrap: 'break-word'
                  }}>
                    <strong style={{ color: 'var(--text-main)' }}>주차:</strong>{' '}
                    아크리아 2 지하 1~2층 (만차 시 지하로 연결된 아크리아 1 주차장 이용 가능)
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
              boxShadow: '0 6px 24px rgba(89, 142, 62, 0.25), 0 3px 12px rgba(0, 0, 0, 0.12)',
              border: '1px solid rgba(89, 142, 62, 0.35)',
              marginBottom: '64px'
            }}>
              <h2 style={{
                fontSize: '1.5rem',
                fontWeight: '700',
                color: 'var(--text-main)',
                marginBottom: '24px',
                paddingBottom: '16px',
                borderBottom: '2px solid rgba(89, 142, 62, 0.3)',
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
                border: '2px solid rgba(89, 142, 62, 0.3)',
                position: 'relative',
                background: '#f5f5f5'
              }}>
                {/* 구글 지도 임베드 (API 키 없이도 작동) */}
                <iframe
                  src={googleMapEmbedSrc}
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
                  href={googleMapOpenUrl}
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
                    border: '1px solid rgba(89, 142, 62, 0.3)',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(89, 142, 62, 0.1)';
                    e.currentTarget.style.borderColor = 'rgba(89, 142, 62, 0.5)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.9)';
                    e.currentTarget.style.borderColor = 'rgba(89, 142, 62, 0.3)';
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
                    border: '1px solid rgba(89, 142, 62, 0.3)',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(89, 142, 62, 0.1)';
                    e.currentTarget.style.borderColor = 'rgba(89, 142, 62, 0.5)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.9)';
                    e.currentTarget.style.borderColor = 'rgba(89, 142, 62, 0.3)';
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
