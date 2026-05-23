/**
 * 학원 시스템 — 로딩 상태 컴포넌트 (UnifiedLoading SSOT 위임)
 *
 * @author CoreSolution
 * @version 1.1.0
 * @since 2025-11-19 (2026-05-23 UnifiedLoading 위임)
 */

import React from 'react';
import UnifiedLoading from '../../common/UnifiedLoading';
import './LoadingState.css';

/**
 * 로딩 상태 컴포넌트
 *
 * @param {Object} props
 * @param {string} [props.message='로딩 중...']
 * @param {('xs'|'sm'|'md'|'lg'|'xl'|'small'|'medium'|'large')} [props.size='md']
 */
const LoadingState = ({ message = '로딩 중...', size = 'md' }) => (
  <div className="academy-loading-state">
    <UnifiedLoading
      variant="spinner"
      size={size}
      type="inline"
      text={message}
      showText
      label={message}
    />
  </div>
);

export default LoadingState;
