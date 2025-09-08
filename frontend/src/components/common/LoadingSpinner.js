import React from 'react';
import './LoadingSpinner.css';

const LoadingSpinner = ({ 
  text = "로딩 중...", 
  size = "medium",
  showText = true,
  className = "",
  variant = "default" // default, dots, pulse, bars
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
            <div className="loading-spinner-inner"></div>
          </div>
        );
    }
  };

  return (
    <div className={`loading-spinner-container ${className}`}>
      {renderSpinner()}
      {showText && (
        <div className="loading-spinner-text">
          {text}
        </div>
      )}
    </div>
  );
};

export default LoadingSpinner;
