import React from 'react';
import './LoadingSpinner.css';

const LoadingSpinner = ({ 
  text = "로딩 중...", 
  size = "medium",
  showText = true,
  className = ""
}) => {
  return (
    <div className={`loading-spinner-container ${className}`}>
      <div className={`loading-spinner-icon loading-spinner-${size}`}>
        <div className="loading-spinner-inner"></div>
      </div>
      {showText && (
        <div className="loading-spinner-text">
          {text}
        </div>
      )}
    </div>
  );
};

export default LoadingSpinner;
