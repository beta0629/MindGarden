/**
 * 학원 시스템 - 에러 상태 컴포넌트
/**
 * 재사용 가능한 에러 UI
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
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../../erp/common/erpMgButtonProps';
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
        <MGButton
          type="button"
          className={buildErpMgButtonClassName({
            variant: 'primary',
            size: 'md',
            loading: false,
            className: 'academy-error-retry'
          })}
          loadingText={ERP_MG_BUTTON_LOADING_TEXT}
          onClick={onRetry}
          variant="primary"
          preventDoubleClick={false}
        >
          다시 시도
        </MGButton>
      )}
    </div>
  );
};

export default ErrorState;

