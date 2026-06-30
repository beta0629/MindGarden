/**
 * CardContainer - 공통 카드 컨테이너
 * CARD_VISUAL_UNIFIED_SPEC 준수, 좌측 악센트(::before), hover 시 box-shadow만 변경
 *
 * @author MindGarden
 * @since 2025-03-14
 */

import React from 'react';
import PropTypes from 'prop-types';
import './CardContainer.css';

const CARD_CONTAINER_VARIANTS = {
  default: '',
  sidebarRow: 'mg-v2-card-container--sidebar-row'
};

function CardContainer({ children, className = '', variant = 'default', ...rest }) {
  const variantClass = CARD_CONTAINER_VARIANTS[variant] || '';
  const classNames = ['mg-v2-card-container', variantClass, className].filter(Boolean).join(' ').trim();

  return (
    <div className={classNames} {...rest}>
      {children}
    </div>
  );
}

CardContainer.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  variant: PropTypes.oneOf(['default', 'sidebarRow'])
};

CardContainer.defaultProps = {
  className: '',
  variant: 'default'
};

export default CardContainer;
