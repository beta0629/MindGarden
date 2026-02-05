'use client';

import { useState, useEffect } from 'react';
import ConsultationForm from './ConsultationForm';

export default function ConsultationBottomSheet() {
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

  // 바텀시트 높이 계산
  const getBottomSheetHeight = () => {
    if (!isOpen) return '80px'; // 접혀있을 때 높이
    if (typeof window === 'undefined') return '80px'; // SSR 대응
    const baseHeight = window.innerHeight * 0.9; // 열렸을 때 화면의 90%
    return `${Math.max(baseHeight - currentY, 80)}px`;
  };

  return (
    <>
      {/* 바텀시트 */}
      <div
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
            padding: '16px',
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
              width: '40px',
              height: '4px',
              backgroundColor: 'var(--text-light)',
              borderRadius: '2px',
              marginBottom: '8px',
            }}
          />
          <div
            style={{
              fontSize: '1.125rem',
              fontWeight: '700',
              color: 'var(--text-main)',
              textAlign: 'center',
            }}
          >
            {isOpen ? '문의 / 예약 접기' : '문의 / 예약'}
          </div>
          {!isOpen && (
            <div
              style={{
                fontSize: '0.875rem',
                color: 'var(--text-sub)',
                marginTop: '4px',
              }}
            >
              클릭하여 상담 문의하기
            </div>
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
      `}</style>
    </>
  );
}
