'use client';

import { useEffect, useRef } from 'react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

declare global {
  interface Window {
    naver: any;
  }
}

export default function LocationPage() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // 네이버 지도 API 스크립트 동적 로드
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpClientId=${process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID || 'x72gn6c20o'}`;
    
    script.onload = () => {
      // API가 완전히 로드될 때까지 대기
      const initMap = () => {
        if (!window.naver || !window.naver.maps || !mapRef.current || mapInstanceRef.current) {
          return;
        }

        // 인증 실패 시에도 지도를 표시하기 위해 try-catch 사용
        try {
          const address = '인천광역시 연수구 송도과학로 123';
          
          // 네이버 지도 Geocoding API 사용
          if (window.naver.maps.Service && window.naver.maps.Service.geocode) {
            window.naver.maps.Service.geocode({
              query: address
            }, (status: any, response: any) => {
              try {
                if (status === window.naver.maps.Service.Status.OK && response.result && response.result.items && response.result.items.length > 0) {
                  const result = response.result;
                  const coords = new window.naver.maps.LatLng(result.items[0].point.y, result.items[0].point.x);
                  createMap(coords, address);
                } else {
                  // 주소 검색 실패 시 기본 좌표로 지도 생성
                  createMapWithDefaultCoords();
                }
              } catch (error) {
                console.error('Geocoding 처리 오류:', error);
                createMapWithDefaultCoords();
              }
            });
          } else {
            // Service API가 없는 경우 기본 좌표로 지도 생성
            createMapWithDefaultCoords();
          }
        } catch (error) {
          console.error('네이버 지도 초기화 오류:', error);
          // 오류 발생 시에도 기본 좌표로 지도 생성
          createMapWithDefaultCoords();
        }
      };

      const createMap = (coords: any, address: string) => {
        if (!mapRef.current || mapInstanceRef.current) return;
        
        try {
          const mapOptions = {
            center: coords,
            zoom: 15
          };
          
          const map = new window.naver.maps.Map(mapRef.current, mapOptions);
          mapInstanceRef.current = map;
          
          const marker = new window.naver.maps.Marker({
            position: coords,
            map: map,
            title: '마인드 가든 심리상담센터'
          });
          
          const infoWindow = new window.naver.maps.InfoWindow({
            content: `
              <div style="padding: 10px; font-size: 14px; line-height: 1.5; min-width: 200px;">
                <strong style="font-size: 16px; display: block; margin-bottom: 5px;">마인드 가든 심리상담센터</strong>
                <div>송도 아크리아2 204호</div>
                <div>${address}</div>
              </div>
            `
          });
          
          window.naver.maps.Event.addListener(marker, 'click', () => {
            if (infoWindow.getMap()) {
              infoWindow.close();
            } else {
              infoWindow.open(map, marker);
            }
          });
          
          infoWindow.open(map, marker);
        } catch (error) {
          console.error('지도 생성 오류:', error);
          createMapWithDefaultCoords();
        }
      };

      const createMapWithDefaultCoords = () => {
        if (!mapRef.current || mapInstanceRef.current) return;
        
        try {
          // 송도 아크리아2 근처 좌표 (37.3885, 126.6584)
          const defaultCoords = new window.naver.maps.LatLng(37.3885, 126.6584);
          
          const mapOptions = {
            center: defaultCoords,
            zoom: 15
          };
          
          const map = new window.naver.maps.Map(mapRef.current, mapOptions);
          mapInstanceRef.current = map;
          
          const marker = new window.naver.maps.Marker({
            position: defaultCoords,
            map: map,
            title: '마인드 가든 심리상담센터'
          });
          
          const infoWindow = new window.naver.maps.InfoWindow({
            content: `
              <div style="padding: 10px; font-size: 14px; line-height: 1.5; min-width: 200px;">
                <strong style="font-size: 16px; display: block; margin-bottom: 5px;">마인드 가든 심리상담센터</strong>
                <div>송도 아크리아2 204호</div>
                <div>인천광역시 연수구 송도과학로 123</div>
              </div>
            `
          });
          
          window.naver.maps.Event.addListener(marker, 'click', () => {
            if (infoWindow.getMap()) {
              infoWindow.close();
            } else {
              infoWindow.open(map, marker);
            }
          });
          
          infoWindow.open(map, marker);
        } catch (error) {
          console.error('기본 좌표 지도 생성 오류:', error);
          // 지도 생성 실패 시 안내 메시지 표시
          if (mapRef.current) {
            mapRef.current.innerHTML = `
              <div style="display: flex; align-items: center; justify-content: center; height: 100%; color: var(--text-sub); padding: 20px; text-align: center;">
                <div>
                  <p style="margin-bottom: 10px; font-size: 16px; font-weight: 600;">지도를 불러올 수 없습니다</p>
                  <p style="font-size: 14px;">네이버 클라우드 플랫폼에서 서비스 URL을 등록해주세요.</p>
                  <p style="font-size: 12px; margin-top: 10px; color: var(--text-light);">주소: 송도 아크리아2 204호, 인천광역시 연수구 송도과학로 123</p>
                </div>
              </div>
            `;
          }
        }
      };

      // API가 완전히 로드될 때까지 약간의 지연 후 초기화
      // 인증 오류가 발생해도 지도가 표시되도록 여러 번 시도
      setTimeout(() => {
        initMap();
        // 인증 오류로 인해 지도가 사라질 수 있으므로 재시도
        setTimeout(() => {
          if (!mapInstanceRef.current && mapRef.current) {
            initMap();
          }
        }, 500);
      }, 100);
    };
    
    script.onerror = () => {
      console.error('네이버 지도 API 로드 실패');
    };
    
    document.head.appendChild(script);
    
    return () => {
      const existingScript = document.querySelector(`script[src*="oapi.map.naver.com"]`);
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
