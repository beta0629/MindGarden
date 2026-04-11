/**
 * 학원 시스템 - 빈 상태 컴포넌트
/**
 * 재사용 가능한 빈 상태 UI
/**
 * 
/**
 * @author CoreSolution
/**
 * @version 1.0.0
/**
 * @since 2025-11-19
 */

import React from 'react';
import MGButton from '../../common/MGButton';
import './EmptyState.css';

/**
 * 빈 상태 컴포넌트
 */
const EmptyState = ({ message = '데이터가 없습니다.', actionLabel = null, onAction = null }) => {
  return (
    <div className="academy-empty-state">
      <div className="academy-empty-icon">📭</div>
      <p className="academy-empty-message">{message}</p>
      {actionLabel && onAction && (
        <MGButton
          type="button"
          className="academy-empty-action"
          onClick={onAction}
          variant="primary"
          preventDoubleClick={false}
        >
          {actionLabel}
        </MGButton>
      )}
    </div>
  );
};

export default EmptyState;

