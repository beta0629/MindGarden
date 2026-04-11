import React from 'react';

import MGButton from '../../common/MGButton';
import styles from './BaseButton.module.css';

/**
 * 기본 버튼 컴포넌트 (stub)
 * @param {Object} props
 * @param {string} [props.className] - 추가 클래스명
 * @param {React.ReactNode} props.children
 */
const BaseButton = ({ className = '', children, preventDoubleClick = false, ...rest }) => {
  const classNames = ['mg-btn', styles.button, className].filter(Boolean).join(' ');
  return (
    <MGButton type="button" className={classNames} preventDoubleClick={preventDoubleClick} {...rest}>
      {children}
    </MGButton>
  );
};

export default BaseButton;
