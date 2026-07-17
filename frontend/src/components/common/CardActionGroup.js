/**
 * CardActionGroup - 카드 액션 버튼 그룹 래퍼
 * ActionButton 등 자식 요소를 flex로 배치
 *
 * @author MindGarden
 * @since 2025-03-14
 */

import React from 'react';
import PropTypes from 'prop-types';
import './CardActionGroup.css';

function CardActionGroup({ children, className = '', ...rest }) {
  const mergedClassName = ['mg-v2-card-actions', className].filter(Boolean).join(' ');
  return (
    <div className={mergedClassName} {...rest}>
      {children}
    </div>
  );
}

CardActionGroup.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string
};

export default CardActionGroup;
