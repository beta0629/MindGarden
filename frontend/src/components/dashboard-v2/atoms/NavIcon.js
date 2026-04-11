/**
 * NavIcon - GNB/LNB 아이콘 버튼 (44×44px, Lucide)
 * RESPONSIVE_LAYOUT_SPEC: 터치 영역 44px 최소
 *
 * @author CoreSolution
 * @since 2025-02-22
 */

import React from 'react';
import MGButton from '../../common/MGButton';
import './NavIcon.css';

const NavIcon = ({ icon: Icon, label, onClick, className = '', disabled = false }) => {
  return (
    <MGButton
      type="button"
      variant="outline"
      size="small"
      preventDoubleClick={false}
      className={`mg-v2-nav-icon ${className}`}
      onClick={onClick}
      disabled={disabled}
      aria-label={label || '아이콘 버튼'}
    >
      {Icon && <Icon size={22} strokeWidth={1.8} aria-hidden="true" />}
    </MGButton>
  );
};

export default NavIcon;
