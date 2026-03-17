/**
 * Badge - 공통 표시용 배지 Atom
 * variant: status | count | tab | pill | kpi
 * StatusBadge, RemainingSessionsBadge, NotificationBadge는 유지; 일반 표시용은 본 컴포넌트 사용.
 *
 * @author CoreSolution
 * @since 2026-03-17
 */

import React from 'react';
import PropTypes from 'prop-types';
import './Badge.css';

const STATUS_VARIANTS = new Set(['success', 'warning', 'neutral', 'danger', 'info']);
const KPI_VARIANTS = new Set(['green', 'orange', 'blue']);
const SIZES = new Set(['sm', 'default', 'lg']);

const DEFAULT_MAX_COUNT = 99;

function Badge({
  variant = 'status',
  size = 'default',
  statusVariant,
  kpiVariant,
  label,
  count,
  value,
  children,
  className = '',
  selected = false,
  maxCount = DEFAULT_MAX_COUNT,
  ...rest
}) {
  const resolvedStatus = statusVariant && STATUS_VARIANTS.has(statusVariant) ? statusVariant : 'neutral';
  const resolvedKpi = kpiVariant && KPI_VARIANTS.has(kpiVariant) ? kpiVariant : 'green';
  const resolvedSize = SIZES.has(size) ? size : 'default';

  let displayContent;
  if (variant === 'count') {
    const num = count != null ? count : value;
    const n = Number(num);
    if (n <= 0) {
      return null;
    }
    displayContent = n > maxCount ? `${maxCount}+` : n;
  } else if (variant === 'kpi') {
    const val = value != null ? String(value) : '';
    const lbl = label != null ? String(label) : (children != null ? children : '');
    displayContent = val ? (lbl ? `${val} ${lbl}` : val) : lbl;
  } else {
    displayContent = label != null ? label : (children != null ? children : value);
  }

  const baseClass = 'mg-common-badge';
  const variantClass = `mg-common-badge--${variant}`;
  const sizeClass = `mg-common-badge--${resolvedSize}`;
  const statusMod = variant === 'status' ? `mg-common-badge--${resolvedStatus}` : '';
  const kpiMod = variant === 'kpi' ? `mg-common-badge--kpi-${resolvedKpi}` : '';
  const selectedMod = (variant === 'tab' || variant === 'pill') && selected ? 'mg-common-badge--selected' : '';

  const classes = [
    baseClass,
    variantClass,
    sizeClass,
    statusMod,
    kpiMod,
    selectedMod,
    className
  ].filter(Boolean).join(' ');

  return (
    <span className={classes} role="status" {...rest}>
      {displayContent}
    </span>
  );
}

Badge.propTypes = {
  variant: PropTypes.oneOf(['status', 'count', 'tab', 'pill', 'kpi']),
  size: PropTypes.oneOf(['sm', 'default', 'lg']),
  statusVariant: PropTypes.oneOf(['success', 'warning', 'neutral', 'danger', 'info']),
  kpiVariant: PropTypes.oneOf(['green', 'orange', 'blue']),
  label: PropTypes.node,
  count: PropTypes.number,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  children: PropTypes.node,
  className: PropTypes.string,
  selected: PropTypes.bool,
  maxCount: PropTypes.number
};

Badge.defaultProps = {
  variant: 'status',
  size: 'default',
  statusVariant: undefined,
  kpiVariant: undefined,
  label: undefined,
  count: undefined,
  value: undefined,
  children: undefined,
  className: '',
  selected: false,
  maxCount: DEFAULT_MAX_COUNT
};

export default Badge;
