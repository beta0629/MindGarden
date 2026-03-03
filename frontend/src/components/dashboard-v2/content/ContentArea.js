/**
 * ContentArea - Admin Dashboard V2 메인 콘텐츠 래퍼
 * B0KlA 스펙 + RESPONSIVE_LAYOUT_SPEC, 레거시 mg-dashboard-layout 미사용
 *
 * @author CoreSolution
 * @since 2025-02-22
 */

import React from 'react';
import './ContentArea.css';

const ContentArea = ({ children, className = '', ariaLabel }) => {
  return (
    <div
      className={`mg-v2-content-area ${className}`.trim()}
      role="region"
      aria-label={ariaLabel != null && ariaLabel !== '' ? ariaLabel : '대시보드 콘텐츠'}
    >
      {children}
    </div>
  );
};

export default ContentArea;
