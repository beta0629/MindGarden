'use client';

import { useEffect, useState } from 'react';

export default function Footer() {
  const [bottomSheetHeight, setBottomSheetHeight] = useState(80); // 바텀시트 높이 (접혀있을 때 기본값)

  useEffect(() => {
    // 바텀시트 높이 감지
    const checkBottomSheetHeight = () => {
      const bottomSheet = document.querySelector('[data-bottom-sheet]') as HTMLElement;
      if (bottomSheet) {
        const height = parseInt(window.getComputedStyle(bottomSheet).height) || 80;
        setBottomSheetHeight(height);
      }
    };

    // 초기 체크
    checkBottomSheetHeight();

    // MutationObserver로 바텀시트 높이 변화 감지
    const observer = new MutationObserver(checkBottomSheetHeight);
    const bottomSheet = document.querySelector('[data-bottom-sheet]');
    if (bottomSheet) {
      observer.observe(bottomSheet, {
        attributes: true,
        attributeFilter: ['style'],
      });
    }

    // 주기적으로 체크 (바텀시트가 열릴 때를 대비)
    const interval = setInterval(checkBottomSheetHeight, 100);

    return () => {
      observer.disconnect();
      clearInterval(interval);
    };
  }, []);

  return (
    <section 
      className="footer-simple"
      style={{
        paddingBottom: `${bottomSheetHeight}px`,
        transition: 'padding-bottom 0.3s ease',
      }}
    >
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '3rem 2rem',
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '2rem',
          marginBottom: '2rem',
        }}>
          {/* 센터 정보 */}
          <div>
            <h3 style={{
              fontSize: '1.125rem',
              fontWeight: '700',
              color: 'var(--text-main)',
              marginBottom: '1rem',
            }}>
              마인드가든 심리상담센터
            </h3>
            <div style={{
              fontSize: '0.875rem',
              color: 'var(--text-sub)',
              lineHeight: '1.8',
            }}>
              <p style={{ marginBottom: '0.5rem' }}>
                <strong>주소:</strong> 인천광역시 연수구 송도과학로 123<br />
                송도 아크리아2 204호
              </p>
              <p style={{ marginBottom: '0.5rem' }}>
                <strong>운영시간:</strong> 평일 09:00 - 18:00
              </p>
              <p>
                <strong>문의:</strong> 상담 예약 및 문의는<br />
                하단 문의/예약 버튼을 이용해주세요.
              </p>
            </div>
          </div>

          {/* 빠른 링크 */}
          <div>
            <h3 style={{
              fontSize: '1.125rem',
              fontWeight: '700',
              color: 'var(--text-main)',
              marginBottom: '1rem',
            }}>
              빠른 링크
            </h3>
            <ul style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
            }}>
              <li style={{ marginBottom: '0.5rem' }}>
                <a 
                  href="/about/mindgarden" 
                  style={{
                    fontSize: '0.875rem',
                    color: 'var(--text-sub)',
                    textDecoration: 'none',
                    transition: 'color 0.2s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent-sky)'}
                  onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-sub)'}
                >
                  전문특화
                </a>
              </li>
              <li style={{ marginBottom: '0.5rem' }}>
                <a 
                  href="/counselors" 
                  style={{
                    fontSize: '0.875rem',
                    color: 'var(--text-sub)',
                    textDecoration: 'none',
                    transition: 'color 0.2s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent-sky)'}
                  onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-sub)'}
                >
                  전문가 소개
                </a>
              </li>
              <li style={{ marginBottom: '0.5rem' }}>
                <a 
                  href="/reviews" 
                  style={{
                    fontSize: '0.875rem',
                    color: 'var(--text-sub)',
                    textDecoration: 'none',
                    transition: 'color 0.2s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent-sky)'}
                  onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-sub)'}
                >
                  이용자 후기
                </a>
              </li>
              <li style={{ marginBottom: '0.5rem' }}>
                <a 
                  href="/gallery" 
                  style={{
                    fontSize: '0.875rem',
                    color: 'var(--text-sub)',
                    textDecoration: 'none',
                    transition: 'color 0.2s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent-sky)'}
                  onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-sub)'}
                >
                  공간 소개
                </a>
              </li>
              <li style={{ marginBottom: '0.5rem' }}>
                <a 
                  href="/location" 
                  style={{
                    fontSize: '0.875rem',
                    color: 'var(--text-sub)',
                    textDecoration: 'none',
                    transition: 'color 0.2s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent-sky)'}
                  onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-sub)'}
                >
                  센터 위치
                </a>
              </li>
            </ul>
          </div>

          {/* 기타 정보 */}
          <div>
            <h3 style={{
              fontSize: '1.125rem',
              fontWeight: '700',
              color: 'var(--text-main)',
              marginBottom: '1rem',
            }}>
              기타 정보
            </h3>
            <div style={{
              fontSize: '0.875rem',
              color: 'var(--text-sub)',
              lineHeight: '1.8',
            }}>
              <p style={{ marginBottom: '0.5rem' }}>
                마인드가든은 ADHD 전문 심리상담센터로<br />
                개인 맞춤형 상담 서비스를 제공합니다.
              </p>
              <p style={{ marginBottom: '0.5rem' }}>
                모든 상담 내용은 비밀이 보장되며,<br />
                안전하고 따뜻한 공간에서 진행됩니다.
              </p>
              <p>
                예약 및 문의는 24시간 접수 가능하며,<br />
                빠른 시일 내에 연락드리겠습니다.
              </p>
            </div>
          </div>
        </div>

        {/* 저작권 */}
        <div style={{
          borderTop: '1px solid var(--border-soft)',
          paddingTop: '1.5rem',
          textAlign: 'center',
        }}>
          <p style={{
            fontSize: '0.875rem',
            color: 'var(--text-sub)',
            margin: 0,
          }}>
            &copy; 2025 Mind Garden. 언제나 당신 곁에.
          </p>
        </div>
      </div>
    </section>
  );
}

