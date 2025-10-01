import React from 'react';
import './LoadingSpinner.css';

const LoadingSpinner = ({ 
  text = "로딩 중...", 
  size = "medium",
  showText = true,
  className = "",
  variant = "default", // default(스케줄 스타일), dots, pulse, bars
  fullscreen = false,
  inline = false
}) => {
  const renderSpinner = () => {
    switch (variant) {
      case 'dots':
        return (
          <div className={`loading-dots loading-dots-${size}`}>
            <div className="dot"></div>
            <div className="dot"></div>
            <div className="dot"></div>
          </div>
        );
      case 'pulse':
        return (
          <div className={`loading-pulse loading-pulse-${size}`}>
            <div className="pulse-circle"></div>
          </div>
        );
      case 'bars':
        return (
          <div className={`loading-bars loading-bars-${size}`}>
            <div className="bar"></div>
            <div className="bar"></div>
            <div className="bar"></div>
            <div className="bar"></div>
          </div>
        );
      default:
        return (
          <div className={`loading-spinner-icon loading-spinner-${size}`}>
            {/* loading-spinner-inner 제거 - 스케줄 스타일은 border만 사용 */}
          </div>
        );
    }
  };

  // 컨테이너 클래스 결정
  let containerClass = `loading-spinner-container ${className}`;
  
  if (fullscreen) {
    containerClass += ' loading-spinner-fullscreen';
  } else if (inline) {
    containerClass += ' loading-spinner-inline';
  }

  return (
    <div className={containerClass}>
      <div style={{ 
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative'
      }}>
        {/* 스피너는 별도 컨테이너에서 회전 */}
        <div style={{ position: 'relative' }}>
          {renderSpinner()}
        </div>
        
        {/* 텍스트는 완전히 분리된 영역에 배치 (회전하지 않음) */}
        {showText && (
          <div 
            className="loading-spinner-text" 
            style={{
              fontFamily: 'Noto Sans KR, Malgun Gothic, 맑은 고딕, sans-serif',
              position: 'static',
              transform: 'none',
              animation: 'none',
              marginTop: '16px',
              fontSize: 'var(--font-size-base)',
              color: '#6b7280',
              fontWeight: '500',
              textAlign: 'center',
              lineHeight: '1.5'
            }}
          >
            {text}
          </div>
        )}
      </div>
    </div>
  );
};

export default LoadingSpinner;
