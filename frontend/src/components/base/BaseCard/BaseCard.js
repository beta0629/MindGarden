import React from 'react';

import MGButton from '../../common/MGButton';
import styles from './BaseCard.module.css';

const VARIANT_CLASS = {
  default: 'mg-card',
  management: 'mg-card mg-management-card',
  stat: 'mg-card mg-stat-card'
};

/**
 * 기본 카드 컴포넌트
 * @param {Object} props
 * @param {'default'|'management'|'stat'} props.variant - 카드 변형
 * @param {string} [props.className] - 추가 클래스명
 * @param {function} [props.onClick] - 클릭 핸들러 (있으면 MGButton, 없으면 div)
 * @param {React.ReactNode} props.children
 */
const BaseCard = ({ variant = 'default', className = '', onClick, children, ...rest }) => {
  const baseClass = VARIANT_CLASS[variant] ?? VARIANT_CLASS.default;
  const classNames = [baseClass, styles.card, className].filter(Boolean).join(' ');

  if (onClick) {
    return (
      <MGButton
        type="button"
        variant="outline"
        className={classNames}
        onClick={onClick}
        preventDoubleClick={false}
        {...rest}
      >
        {children}
      </MGButton>
    );
  }
  return (
    <div className={classNames} {...rest}>
      {children}
    </div>
  );
};

export default BaseCard;
