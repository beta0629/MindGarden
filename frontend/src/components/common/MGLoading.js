/**
 * MindGarden 로딩 컴포넌트
 * 다양한 스타일의 로딩 인디케이터
 */

import React from 'react';
import './MGLoading.css';

const MGLoading = ({
  variant = 'spinner', // 'spinner', 'dots', 'pulse', 'skeleton', 'progress'
  size = 'medium', // 'small', 'medium', 'large'
  color = 'primary',
  text = '',
  progress = 0, // progress variant일 때 사용 (0-100)
  className = '',
  ...props
}) => {
  const renderSpinner = () => (
    <div className={`mg-loading-spinner mg-loading-spinner--${size} mg-loading-spinner--${color}`}>
      <div className="mg-loading-spinner__ring"></div>
    </div>
  );

  const renderDots = () => (
    <div className={`mg-loading-dots mg-loading-dots--${size} mg-loading-dots--${color}`}>
      <div className="mg-loading-dots__dot"></div>
      <div className="mg-loading-dots__dot"></div>
      <div className="mg-loading-dots__dot"></div>
    </div>
  );

  const renderPulse = () => (
    <div className={`mg-loading-pulse mg-loading-pulse--${size} mg-loading-pulse--${color}`}>
      <div className="mg-loading-pulse__circle"></div>
    </div>
  );

  const renderSkeleton = () => (
    <div className={`mg-loading-skeleton mg-loading-skeleton--${size}`}>
      <div className="mg-loading-skeleton__line"></div>
      <div className="mg-loading-skeleton__line mg-loading-skeleton__line--short"></div>
      <div className="mg-loading-skeleton__line mg-loading-skeleton__line--medium"></div>
    </div>
  );

  const renderProgress = () => (
    <div className={`mg-loading-progress mg-loading-progress--${size}`}>
      <div className="mg-loading-progress__track">
        <div 
          className="mg-loading-progress__bar"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      {text && (
        <div className="mg-loading-progress__text">{text}</div>
      )}
      <div className="mg-loading-progress__percentage">{progress}%</div>
    </div>
  );

  const renderLoading = () => {
    switch (variant) {
      case 'dots':
        return renderDots();
      case 'pulse':
        return renderPulse();
      case 'skeleton':
        return renderSkeleton();
      case 'progress':
        return renderProgress();
      default:
        return renderSpinner();
    }
  };

  return (
    <div className={`mg-loading mg-loading--${variant} ${className}`} {...props}>
      {renderLoading()}
      {text && variant !== 'progress' && (
        <div className="mg-loading__text">{text}</div>
      )}
    </div>
  );
};

// 페이지 전체 로딩
export const MGPageLoading = ({ text = '로딩 중...' }) => (
  <div className="mg-page-loading">
    <MGLoading variant="spinner" size="large" text={text} />
  </div>
);

// 인라인 로딩
export const MGInlineLoading = ({ text = '' }) => (
  <MGLoading variant="dots" size="small" text={text} />
);

export default MGLoading;



