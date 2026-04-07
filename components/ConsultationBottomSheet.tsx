'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import ConsultationForm from './ConsultationForm';

export default function ConsultationBottomSheet() {
  const pathname = usePathname();
  
  // 관리자 페이지에서는 바텀시트를 표시하지 않음
  const isAdminPage = pathname?.startsWith('/admin') || pathname?.startsWith('/blog/admin');
  
  if (isAdminPage) {
    return null;
  }
  const [isOpen, setIsOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [currentY, setCurrentY] = useState(0);

  // 드래그 시작
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    setStartY(e.touches[0].clientY);
  };

  // 드래그 중
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const deltaY = e.touches[0].clientY - startY;
    setCurrentY(deltaY);
  };

  // 드래그 종료
  const handleTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    
    // 아래로 100px 이상 드래그하면 닫기
    if (currentY > 100) {
      setIsOpen(false);
    }
    setCurrentY(0);
  };

  useEffect(() => {
    const handleOpenBottomSheet = () => setIsOpen(true);
    window.addEventListener('open-consultation-bottom-sheet', handleOpenBottomSheet);
    return () => window.removeEventListener('open-consultation-bottom-sheet', handleOpenBottomSheet);
  }, []);

  // 바텀시트 열기/닫기
  const toggleBottomSheet = () => {
    setIsOpen(!isOpen);
    setCurrentY(0);
  };

  // 바텀시트가 열려있을 때 배경 클릭으로 닫기
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setIsOpen(false);
    }
  };

  /** 접힘 상태 고정 높이 — 해상도별 콘텐츠 가림을 줄이기 위해 핸들과 동일 비율로 맞춤 */
  const COLLAPSED_PX = 112;

  // 바텀시트 높이 (접힘: 핸들·화살표가 잘리지 않도록 COLLAPSED_PX와 동기)
  const getBottomSheetHeight = () => {
    if (typeof window === 'undefined') {
      return isOpen ? '90vh' : `${COLLAPSED_PX}px`;
    }
    if (!isOpen) return `${COLLAPSED_PX}px`;
    const baseHeight = window.innerHeight * 0.9;
    return `${Math.max(baseHeight - currentY, COLLAPSED_PX)}px`;
  };

  return (
    <>
      {/* 바텀시트 */}
      <div
        data-bottom-sheet
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: getBottomSheetHeight(),
          backgroundColor: 'var(--surface-0)',
          borderTopLeftRadius: 'var(--radius-lg)',
          borderTopRightRadius: 'var(--radius-lg)',
          boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.15)',
          zIndex: 1000,
          transition: isDragging ? 'none' : 'height 0.3s ease',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* 드래그 핸들 */}
        <div
          onClick={toggleBottomSheet}
          style={{
            padding: isOpen ? '12px 14px 12px' : '8px 14px 10px',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            borderBottom: isOpen ? '1px solid var(--border-soft)' : 'none',
            backgroundColor: 'var(--bg-pastel-1)',
          }}
        >
          <div
            style={{
              width: '36px',
              height: '3px',
              backgroundColor: 'var(--text-light)',
              borderRadius: '2px',
              marginBottom: '4px',
            }}
          />
          {isOpen ? (
            <div className="consultation-sheet-title-row">
              <div
                style={{
                  fontSize: '1.125rem',
                  fontWeight: '700',
                  color: 'var(--text-main)',
                  textAlign: 'center',
                }}
              >
                문의 / 예약 접기
              </div>
              <span className="consultation-sheet-arrow consultation-sheet-arrow--down" aria-hidden="true">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M12 18.5l7-7-1.4-1.4L12 15.7 6.4 10.1 5 11.5l7 7z"
                    fill="currentColor"
                  />
                </svg>
              </span>
            </div>
          ) : (
            <div
              style={{
                fontSize: '1rem',
                fontWeight: '700',
                color: 'var(--text-main)',
                textAlign: 'center',
                lineHeight: 1.25,
              }}
            >
              문의 / 예약
            </div>
          )}
          {!isOpen && (
            <>
              <div
                style={{
                  fontSize: '0.8125rem',
                  color: 'var(--text-sub)',
                  marginTop: '2px',
                  lineHeight: 1.35,
                }}
              >
                클릭하여 상담 문의하기
              </div>
              <span className="consultation-sheet-arrow-hint" aria-hidden="true">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M12 4.5l-8.5 8.5 1.4 1.4L12 7.3l7.1 7.1 1.4-1.4L12 4.5z"
                    fill="currentColor"
                  />
                </svg>
              </span>
            </>
          )}
        </div>

        {/* 바텀시트 내용 */}
        {isOpen && (
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '24px',
            }}
          >
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
              <h2
                style={{
                  fontSize: '1.75rem',
                  fontWeight: '700',
                  color: 'var(--text-main)',
                  marginBottom: '12px',
                  textAlign: 'center',
                }}
              >
                문의 / 예약
              </h2>
              <p
                style={{
                  fontSize: '1rem',
                  color: 'var(--text-sub)',
                  marginBottom: '32px',
                  textAlign: 'center',
                }}
              >
                아래 폼을 작성해주시면 빠른 시일 내에 연락드리겠습니다.
              </p>
              <ConsultationForm />
            </div>
          </div>
        )}
      </div>

      {/* 배경 오버레이 */}
      {isOpen && (
        <div
          onClick={handleBackdropClick}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 999,
            animation: 'fadeIn 0.3s ease',
          }}
        />
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        .consultation-sheet-title-row {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          flex-wrap: wrap;
          margin-top: 2px;
        }
        .consultation-sheet-arrow {
          display: inline-flex;
          color: var(--accent-sky, #0284c7);
          flex-shrink: 0;
        }
        .consultation-sheet-arrow--down {
          animation: consultationSheetArrowPulse 2s ease-in-out infinite;
          opacity: 0.85;
        }
        .consultation-sheet-arrow-hint {
          display: flex;
          align-items: center;
          justify-content: center;
          margin-top: 2px;
          color: var(--accent-sky, #0284c7);
          animation: consultationSheetCueMotion 1.25s ease-in-out infinite,
            consultationSheetCueBlink 1.1s ease-in-out infinite;
        }
        .consultation-sheet-arrow-hint svg {
          display: block;
          filter: drop-shadow(0 1px 2px rgba(2, 132, 199, 0.25));
        }
        @keyframes consultationSheetCueMotion {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-4px);
          }
        }
        @keyframes consultationSheetCueBlink {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.38;
          }
        }
        @keyframes consultationSheetArrowPulse {
          0%,
          100% {
            opacity: 0.65;
            transform: translateY(0);
          }
          50% {
            opacity: 1;
            transform: translateY(2px);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .consultation-sheet-arrow-hint,
          .consultation-sheet-arrow--down {
            animation: none !important;
          }
        }
      `}</style>
    </>
  );
}
