/**
 * 학원 시스템 - 로딩 상태 컴포넌트
 * 재사용 가능한 로딩 UI
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-19
 */

import React from 'react';
import { Spinner } from '../../ui/Loading';
import './LoadingState.css';

/**
 * 로딩 상태 컴포넌트
 */
const LoadingState = ({ message = '로딩 중...', size = 'medium' }) => {
  return (
    <div className="academy-loading-state">
      <Spinner size={size} />
      <p className="academy-loading-message">{message}</p>
    </div>
  );
};

export default LoadingState;

