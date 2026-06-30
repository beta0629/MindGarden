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

function CardContainer({ children, className = '', ...rest }) {
  const classNames = ['mg-v2-card-container', className].filter(Boolean).join(' ').trim();

  return (
    <div className={classNames} {...rest}>
      {children}
    </div>
  );
}

CardContainer.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string
};

CardContainer.defaultProps = {
  className: ''
};

export default CardContainer;
