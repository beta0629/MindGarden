import React from 'react';
import SafeText from '../../common/SafeText';
import MGButton from '../../common/MGButton';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../../erp/common/erpMgButtonProps';
import './Card.css';

/**
 * CardFooter 컴포넌트 - 카드 푸터
/**
 * 
/**
 * @param {Object} props
/**
 * @param {React.ReactNode} props.children - 푸터 내용
/**
 * @param {Array} props.actions - 액션 버튼 배열 (선택)
/**
 * @param {string} props.meta - 메타 정보 텍스트 (선택)
/**
 * @param {string} props.className - 추가 CSS 클래스
 */
const CardFooter = ({ children, 
  actions,
  meta,
  className = '',
  ...props }) => {return (<div className={`mg-v2-card-footer ${className}`.trim()} {...props}>
      {meta && <span className="mg-v2-v2-v2-card-meta">{meta}</span>}
          {actions && (<div className="mg-v2-v2-v2-card-actions">
          {actions.map((action, index) => {
            const variantClass = action.variant || 'mg-v2-button--secondary';
            const mgVariant = variantClass.includes('danger')
              ? 'danger'
              : variantClass.includes('primary')
                ? 'primary'
                : variantClass.includes('outline')
                  ? 'outline'
                  : 'secondary';
            const actionLoading = Boolean(action.loading);
            return (
              <MGButton
                key={index}
                onClick={action.onClick}
                className={buildErpMgButtonClassName({
                  variant: mgVariant,
                  size: 'md',
                  loading: actionLoading,
                  className: variantClass
                })}
                disabled={action.disabled}
                variant={mgVariant}
                loading={actionLoading}
                loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                preventDoubleClick={false}
              >
                <SafeText>{action.label}</SafeText>
              </MGButton>
            );
          })}
        </div>)}
      {children}
    </div>);};

export default CardFooter;

