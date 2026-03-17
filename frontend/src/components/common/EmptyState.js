/**
 * EmptyState - 빈 목록/빈 결과 공통 UI (아이콘 + 메시지 + 선택적 CTA)
 *
 * @author Core Solution
 * @since 2025-03-17
 */

import React from 'react';
import PropTypes from 'prop-types';
import './EmptyState.css';

const EmptyState = ({ icon, title, description, action, className = '' }) => {
  const classNames = ['mg-v2-empty-state', className].filter(Boolean).join(' ');
  return (
    <div className={classNames}>
      {icon && <div className="mg-v2-empty-state__icon">{icon}</div>}
      {title && <h3 className="mg-v2-empty-state__title">{title}</h3>}
      {description && <p className="mg-v2-empty-state__desc">{description}</p>}
      {action && <div className="mg-v2-empty-state__action">{action}</div>}
    </div>
  );
};

EmptyState.propTypes = {
  icon: PropTypes.node,
  title: PropTypes.node,
  description: PropTypes.node,
  action: PropTypes.node,
  className: PropTypes.string
};

export default EmptyState;
