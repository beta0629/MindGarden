/**
 * 학원 시스템 - 에러 상태 컴포넌트
 * 재사용 가능한 에러 UI
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-19
 */

import React from 'react';
import './ErrorState.css';

/**
 * 에러 상태 컴포넌트
 */
const ErrorState = ({ message = '오류가 발생했습니다.', onRetry = null }) => {
  return (
    <div className="academy-error-state">
      <div className="academy-error-icon">⚠️</div>
      <p className="academy-error-message">{message}</p>
      {onRetry && (
        <button
          type="button"
          className="academy-error-retry"
          onClick={onRetry}
        >
          다시 시도
        </button>
      )}
    </div>
  );
};

export default ErrorState;

