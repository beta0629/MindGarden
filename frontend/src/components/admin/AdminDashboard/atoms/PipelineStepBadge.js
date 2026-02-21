import React from 'react';
import './PipelineStepBadge.css';

/**
 * 파이프라인 단계 배지 (Atomic: atom)
 * Core Flow Pipeline에서 단계별 건수 표시
 *
 * @param {Object} props
 * @param {string} props.label - 배지 라벨
 * @param {string|number} props.value - 표시 값
 * @param {'neutral'|'warning'|'success'|'info'|'auto'} props.variant - 배지 스타일
 * @author MindGarden
 * @since 2025-02-21
 */
const PipelineStepBadge = ({ label, value, variant = 'neutral' }) => {
  const ariaLabel = label ? `${value} ${label}` : String(value);
  return (
    <span className={`pipeline-step-badge pipeline-step-badge--${variant}`} aria-label={ariaLabel}>
      <span className="pipeline-step-badge__value">{value}</span>
      {label && <span className="pipeline-step-badge__label">{label}</span>}
    </span>
  );
};

export default PipelineStepBadge;
