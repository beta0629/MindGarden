/**
 * ActionBar — MGButton SSOT 핸드오프 v1.1 (2026-06-05 채택)
 *
 * D2=a 채택: 단순 wrapper + Context auto-attr.
 * 자식 MGButton 은 `<ActionBar>` 안에서 자동으로 actionBar 외형으로 통일.
 *
 * 사용 예:
 * ```jsx
 * <ActionBar align="end" gap="md">
 *   <MGButton variant="outline" onClick={handleEdit}>예약 변경</MGButton>
 *   <MGButton variant="primary" onClick={handleConfirm}>예약 확정</MGButton>
 *   <MGButton variant="danger" onClick={handleCancel}>예약 취소</MGButton>
 * </ActionBar>
 * ```
 *
 * 채택: D1=b (danger #dc2626 = cs-error-600).
 * MGButton.css 의 :focus-visible outline 단차는 SSOT CSS 가 inset shadow 로 흡수.
 */

import React from 'react';
import PropTypes from 'prop-types';
import './ActionBar.css';

const ActionBar = ({ children, align = 'end', gap = 'md', className = '' }) => {
  return (
    <div
      className={`mg-actionbar ${className}`.trim()}
      data-align={align}
      data-gap={gap}
      role="group"
    >
      {children}
    </div>
  );
};

ActionBar.propTypes = {
  children: PropTypes.node.isRequired,
  align: PropTypes.oneOf(['start', 'center', 'end', 'between']),
  gap: PropTypes.oneOf(['sm', 'md']),
  className: PropTypes.string,
};

export default ActionBar;
