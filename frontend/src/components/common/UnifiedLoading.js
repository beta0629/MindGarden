import React from 'react';
import '../../styles/main.css'; // Ensure main.css is imported for mg-loading styles

/**
 * 통합 로딩 컴포넌트 (UnifiedLoading)
 * 모든 로딩 UI의 표준이 되는 공통 컴포넌트
 * 
 * 로고 확장성 고려사항:
 * - 기본 스피너와 커스텀 로고 모두 지원
 * - 로고 회전 애니메이션 지원
 * - 로고 크기 자동 조정 (responsive)
 * - 다크/라이트 모드 대응
 * - 향후 브랜딩 변경 시 쉽게 교체 가능한 구조
 * 
 * @param {Object} props - 컴포넌트 props
 * @param {string} props.text - 로딩 텍스트
 * @param {string} props.size - 로딩 크기 (small, medium, large)
 * @param {string} props.variant - 로딩 스타일 (spinner, dots, pulse, bars, logo)
 * @param {string} props.type - 로딩 타입 (inline, fullscreen, page, button)
 * @param {boolean} props.showText - 텍스트 표시 여부
 * @param {string} props.className - 추가 CSS 클래스
 * @param {boolean} props.centered - 중앙 정렬 여부
 * @param {string} props.logoType - 로고 타입 (text, image, custom)
 * @param {string} props.logoImage - 커스텀 로고 이미지 URL 또는 HTML
 * @param {string} props.logoAlt - 로고 alt 텍스트
 * @param {boolean} props.logoRotate - 로고 회전 애니메이션 여부
 * 
 * @author MindGarden
 * @version 1.1.0
 * @since 2025-01-02
 */
const UnifiedLoading = ({ 
  text = "로딩 중...",
  size = "medium",
  variant = "spinner",
  type = "inline",
  showText = true,
  className = "",
  centered = true,
  logoType = "text", // text, image, custom
  logoImage = "",
  logoAlt = "MindGarden",
  logoRotate = true,
  ...props 
}) => {
  // 로고 렌더링
  const renderLogo = () => {
    const logoClasses = [
      'mg-loading-logo',
      `mg-loading-logo--${size}`,
      logoRotate ? 'mg-loading-logo--rotating' : '',
      `mg-loading-logo--${logoType}`
    ].filter(Boolean).join(' ');

    switch (logoType) {
      case 'image':
        return (
          <img 
            src={logoImage || '/logo.png'} 
            alt={logoAlt}
            className={logoClasses}
          />
        );
      case 'custom':
        return (
          <div 
            className={logoClasses}
            dangerouslySetInnerHTML={{ __html: logoImage }}
          />
        );
      case 'text':
      default:
        return (
          <div className={logoClasses}>
            <span className="mg-loading-logo-text">
              MindGarden
            </span>
          </div>
        );
    }
  };

  // 로딩 스피너 렌더링
  const renderSpinner = () => {
    const baseClasses = `mg-loading mg-loading--${size} mg-loading--${variant}`;
    
    switch (variant) {
      case 'dots':
        return (
          <div className={`${baseClasses} mg-loading-dots`}>
            <div className="mg-loading-dot"></div>
            <div className="mg-loading-dot"></div>
            <div className="mg-loading-dot"></div>
          </div>
        );
      case 'pulse':
        return (
          <div className={`${baseClasses} mg-loading-pulse`}>
            <div className="mg-loading-pulse-circle"></div>
          </div>
        );
      case 'bars':
        return (
          <div className={`${baseClasses} mg-loading-bars`}>
            <div className="mg-loading-bar"></div>
            <div className="mg-loading-bar"></div>
            <div className="mg-loading-bar"></div>
            <div className="mg-loading-bar"></div>
          </div>
        );
      case 'logo':
        return renderLogo();
      case 'spinner':
      default:
        return (
          <div className={`${baseClasses} mg-loading-spinner`}>
            <div className="mg-loading-spinner-icon"></div>
          </div>
        );
    }
  };

  // 컨테이너 클래스 구성
  const containerClasses = [
    'mg-loading-container',
    `mg-loading-container--${type}`,
    centered ? 'mg-loading-container--centered' : '',
    className
  ].filter(Boolean).join(' ');

  // DOM에 전달하지 않을 props 필터링
  const { fullscreen, ...domProps } = props;

  return (
    <div className={containerClasses} {...domProps}>
      <div className="mg-loading-content">
        {renderSpinner()}
        {showText && text && (
          <div className="mg-loading-text">
            {text}
          </div>
        )}
      </div>
    </div>
  );
};

export default UnifiedLoading;
