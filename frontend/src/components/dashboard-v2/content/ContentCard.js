/**
 * ContentCard - B0KlA 카드 래퍼 (섹션 없이 카드만)
 *
 * @author CoreSolution
 * @since 2025-02-22
 */

import React from 'react';
import './ContentCard.css';

const ContentCard = ({ children, className = '' }) => {
  return <div className={`mg-v2-content-card ${className}`.trim()}>{children}</div>;
};

export default ContentCard;
