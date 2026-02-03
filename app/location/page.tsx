'use client';

import { useEffect, useRef } from 'react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

declare global {
  interface Window {
    kakao: any;
  }
}

export default function LocationPage() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  useEffect(() => {
    // 카카오맵 API 스크립트 동적 로드
    const script = document.createElement('script');
    script.async = true;
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_MAP_API_KEY || 'YOUR_KAKAO_MAP_API_KEY'}&autoload=false`;
    script.onload = () => {
      if (window.kakao && window.kakao.maps) {
        window.kakao.maps.load(() => {
          if (mapRef.current && !mapInstanceRef.current) {
            // 주소를 좌표로 변환 (Geocoding)
            const geocoder = new window.kakao.maps.services.Geocoder();
            const address = '인천광역시 연수구 송도과학로 123';
            
            geocoder.addressSearch(address, (result: any, status: any) => {
              if (status === window.kakao.maps.services.Status.OK) {
                const coords = new window.kakao.maps.LatLng(result[0].y, result[0].x);
                
                // 지도 생성
                const mapOption = {
                  center: coords,
                  level: 3 // 지도의 확대 레벨
                };
                
                const map = new window.kakao.maps.Map(mapRef.current, mapOption);
                mapInstanceRef.current = map;
                
                // 마커 생성
                const marker = new window.kakao.maps.Marker({
                  position: coords,
                  map: map
                });
                
                // 인포윈도우 생성
                const infowindow = new window.kakao.maps.InfoWindow({
                  content: `
                    <div style="padding: 10px; font-size: 14px; line-height: 1.5;">
                      <strong style="font-size: 16px; display: block; margin-bottom: 5px;">마인드 가든 심리상담센터</strong>
                      <div>송도 아크리아2 204호</div>
                      <div>${address}</div>
                    </div>
                  `
                });
                
                // 마커 클릭 시 인포윈도우 표시
                window.kakao.maps.event.addListener(marker, 'click', () => {
                  infowindow.open(map, marker);
                });
                
                // 지도 로드 시 인포윈도우 자동 표시
                infowindow.open(map, marker);
              } else {
                // 주소 검색 실패 시 기본 좌표 사용 (송도 아크리아2 근처)
                const defaultCoords = new window.kakao.maps.LatLng(37.3885, 126.6584);
                
                const mapOption = {
                  center: defaultCoords,
                  level: 3
                };
                
                const map = new window.kakao.maps.Map(mapRef.current, mapOption);
                mapInstanceRef.current = map;
                
                const marker = new window.kakao.maps.Marker({
                  position: defaultCoords,
                  map: map
                });
                
                const infowindow = new window.kakao.maps.InfoWindow({
                  content: `
                    <div style="padding: 10px; font-size: 14px; line-height: 1.5;">
                      <strong style="font-size: 16px; display: block; margin-bottom: 5px;">마인드 가든 심리상담센터</strong>
                      <div>송도 아크리아2 204호</div>
                      <div>인천광역시 연수구 송도과학로 123</div>
                    </div>
                  `
                });
                
                window.kakao.maps.event.addListener(marker, 'click', () => {
                  infowindow.open(map, marker);
                });
                
                infowindow.open(map, marker);
              }
            });
          }
        });
      }
    };
    
    document.head.appendChild(script);
    
    return () => {
      // 컴포넌트 언마운트 시 스크립트 제거
      const existingScript = document.querySelector(`script[src*="dapi.kakao.com"]`);
      if (existingScript) {
        existingScript.remove();
      }
    };
  }, []);

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

            {/* 지도 영역 (추후 지도 API 연동 가능) */}
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
              <div 
                ref={mapRef}
                style={{
                  width: '100%',
                  height: '400px',
                  borderRadius: 'var(--radius-md)',
                  overflow: 'hidden',
                  border: '2px solid rgba(255, 212, 184, 0.3)'
                }}
              />
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
