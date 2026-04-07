'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

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
        {/* 센터 정보 - 가로 배치 */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'flex-start',
            alignItems: 'flex-start',
            gap: 'clamp(1.5rem, 4vw, 3rem)',
            marginBottom: '2rem',
            flexWrap: 'wrap',
            textAlign: 'left',
            width: '100%',
          }}
        >
          <div style={{
            flex: '1 1 12rem',
            minWidth: '10rem',
            maxWidth: '22rem',
          }}>
            <h3 style={{
              fontSize: '1.125rem',
              fontWeight: '700',
              color: 'var(--text-main)',
              marginBottom: '1rem',
              textAlign: 'left',
            }}>
              마인드가든 심리상담센터
            </h3>
            <div style={{
              fontSize: '0.875rem',
              color: 'var(--text-sub)',
              lineHeight: '1.8',
              textAlign: 'left',
            }}>
              <p style={{ marginBottom: '0.5rem' }}>
                <strong>주소:</strong> 인천 연수구 해돋이로120번길 23<br />
                아크리아2 2층 204호
              </p>
              <p style={{ marginTop: '0.5rem', marginBottom: 0 }}>
                <Link href="/location" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>
                  센터 위치 보기 →
                </Link>
              </p>
            </div>
          </div>

          <div style={{
            flex: '1 1 10rem',
            minWidth: '9rem',
            maxWidth: '18rem',
          }}>
            <div style={{
              fontSize: '0.875rem',
              color: 'var(--text-sub)',
              lineHeight: '1.8',
              marginTop: '2.5rem', // h3 높이만큼 상단 여백
              textAlign: 'left',
            }}>
              <p style={{ marginBottom: '0.5rem' }}>
                <strong>운영시간:</strong> 주중 10:00 - 20:00<br />
                <strong>토요일:</strong> 10:00 - 17:00<br />
                <strong>일요일:</strong> 정기휴무
              </p>
            </div>
          </div>

          <div style={{
            flex: '1 1 12rem',
            minWidth: '10rem',
            maxWidth: '22rem',
          }}>
            <div style={{
              fontSize: '0.875rem',
              color: 'var(--text-sub)',
              lineHeight: '1.8',
              marginTop: '2.5rem', // h3 높이만큼 상단 여백
              textAlign: 'left',
            }}>
              <p style={{ marginBottom: '0.5rem' }}>
                <strong>전화:</strong> 032-724-8501<br />
                <strong>휴대폰:</strong> 010-7924-8501
              </p>
              <p>
                <strong>문의:</strong> 상담 예약 및 문의는<br />
                하단 문의/예약 버튼을 이용해주세요.
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
            &copy; 2026 Mind Garden. 언제나 당신 곁에.
          </p>
        </div>
      </div>
    </section>
  );
}

