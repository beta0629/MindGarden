import React from 'react';
import PropTypes from 'prop-types';
import Badge from '../../../common/Badge';

/** 파이프라인 variant → KPI 색상 매핑 (B0KlA 정렬) */
const VARIANT_TO_KPI = {
  neutral: 'blue',
  warning: 'orange',
  success: 'green',
  info: 'blue',
  auto: 'blue'
};

/**
 * 파이프라인 단계 배지 (Atomic: atom)
 * Core Flow Pipeline에서 단계별 건수 표시. 공통 Badge variant=kpi 사용.
 *
 * @param {Object} props
 * @param {string} props.label - 배지 라벨
 * @param {string|number} props.value - 표시 값
 * @param {'neutral'|'warning'|'success'|'info'|'auto'} props.variant - 배지 스타일
 * @author Core Solution
 * @since 2025-02-21
 */
const PipelineStepBadge = ({ label, value, variant = 'neutral' }) => {
  const kpiVariant = VARIANT_TO_KPI[variant] || 'blue';
  const ariaLabel = label ? `${value} ${label}` : String(value);
  return (
    <Badge
      variant="kpi"
      kpiVariant={kpiVariant}
      value={value}
      label={label}
      size="sm"
      aria-label={ariaLabel}
      className="pipeline-step-badge"
    />
  );
};

PipelineStepBadge.propTypes = {
  label: PropTypes.string,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  variant: PropTypes.oneOf(['neutral', 'warning', 'success', 'info', 'auto'])
};

PipelineStepBadge.defaultProps = {
  label: '',
  variant: 'neutral'
};

export default PipelineStepBadge;
