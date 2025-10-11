import React from 'react';
import './iPhone17Card.css';

/**
 * iPhone 17 디자인 언어를 적용한 카드 컴포넌트
 * 
 * @param {Object} props - 컴포넌트 props
 * @param {string} props.variant - 카드 변형 (default, glass, stat, feature, content)
 * @param {React.ReactNode} props.children - 카드 내용
 * @param {string} props.className - 추가 CSS 클래스
 * @param {function} props.onClick - 클릭 핸들러
 * @param {Object} props.style - 인라인 스타일
 * @param {string} props.title - 카드 제목 (feature, content 카드용)
 * @param {string} props.description - 카드 설명 (feature 카드용)
 * @param {string} props.icon - 아이콘 (stat, feature 카드용)
 * @param {string|number} props.value - 값 (stat 카드용)
 * @param {string} props.label - 라벨 (stat 카드용)
 */
const IPhone17Card = ({
  variant = 'default',
  children,
  className = '',
  onClick,
  style,
  title,
  description,
  icon,
  value,
  label,
  ...props
}) => {
  const baseClass = 'iphone17-card';
  const variantClass = `iphone17-${variant}-card`;
  const classes = `${baseClass} ${variantClass} ${className}`.trim();

  const renderContent = () => {
    switch (variant) {
      case 'stat':
        return (
          <>
            {icon && (
              <div className="iphone17-stat-icon">
                {icon}
              </div>
            )}
            <div className="iphone17-stat-content">
              {value !== undefined && (
                <div className="iphone17-stat-value">
                  {value}
                </div>
              )}
              {label && (
                <div className="iphone17-stat-label">
                  {label}
                </div>
              )}
            </div>
          </>
        );

      case 'feature':
        return (
          <>
            {icon && (
              <div className="iphone17-feature-icon">
                {icon}
              </div>
            )}
            {title && (
              <h4>{title}</h4>
            )}
            {description && (
              <p>{description}</p>
            )}
          </>
        );

      case 'content':
        return (
          <>
            {title && (
              <h3>{title}</h3>
            )}
            {children}
          </>
        );

      default:
        return children;
    }
  };

  return (
    <div
      className={classes}
      onClick={onClick}
      style={style}
      {...props}
    >
      {renderContent()}
    </div>
  );
};

export default IPhone17Card;
