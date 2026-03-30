/**
 * FilterBadge Component
 * 
 * @description 클릭 가능한 필터 배지 컴포넌트 (Molecule)
 * @author Core Solution Team
 * @since 2026-03-09
 */

import React from 'react';
import PropTypes from 'prop-types';

const FilterBadge = ({
  label,
  value,
  count,
  icon: Icon,
  isActive,
  onClick,
  activeColor
}) => {
  const handleClick = () => {
    if (onClick) {
      onClick(value);
    }
  };

  const badgeClasses = [
    'mg-v2-filter-badge',
    isActive ? 'mg-v2-filter-badge--active' : ''
  ].filter(Boolean).join(' ');

  const badgeStyle = isActive && activeColor ? { 
    backgroundColor: activeColor,
    borderColor: activeColor 
  } : {};

  return (
    <button
      aria-label={`${label} 상태 필터 (${count}명)`}
      aria-pressed={isActive}
      className={badgeClasses}
      onClick={handleClick}
      style={badgeStyle}
    >
      {Icon && <Icon size={14} />}
      <span className="mg-v2-filter-badge__label">{label}</span>
      <span className="mg-v2-filter-badge__count">({count})</span>
    </button>
  );
};

FilterBadge.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  count: PropTypes.number.isRequired,
  icon: PropTypes.elementType,
  isActive: PropTypes.bool.isRequired,
  onClick: PropTypes.func.isRequired,
  activeColor: PropTypes.string
};

export default FilterBadge;
