/**
 * PricingCompareToggle — "자세한 비교 보기" 토글 (Molecule)
 *
 * Spec §3.4:
 *   - 박스형 버튼
 *   - 좌측 차트 아이콘
 *   - 우측 화살표 아이콘 (펼침 상태에 따라 회전)
 *
 * @author CoreSolution
 * @since 2026-06-16
 */

import React from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { toDisplayString } from '../../../utils/safeDisplay';
import './PricingCompareToggle.css';

/* ================================================================
   INTERNAL — Icons
   ================================================================ */
function ChartIcon() {
  return (
    <svg
      className="mg-v2-compare-toggle__icon-chart"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <line x1="6" y1="20" x2="6" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="18" y1="20" x2="18" y2="14" />
    </svg>
  );
}

function ArrowIcon({ expanded }) {
  return (
    <svg
      className={`mg-v2-compare-toggle__icon-arrow${
        expanded ? ' mg-v2-compare-toggle__icon-arrow--expanded' : ''
      }`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

ArrowIcon.propTypes = {
  expanded: PropTypes.bool.isRequired,
};

/* ================================================================
   PUBLIC — PricingCompareToggle
   ================================================================ */
const PricingCompareToggle = ({
  expanded,
  onToggle,
  controlsId,
  className = '',
}) => {
  const { t } = useTranslation('common');

  const wrapperClass = [
    'mg-v2-compare-toggle',
    expanded ? 'mg-v2-compare-toggle--expanded' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <button
      type="button"
      className={wrapperClass}
      aria-expanded={expanded}
      aria-controls={controlsId}
      onClick={onToggle}
      data-testid="pricing-compare-toggle"
    >
      <span className="mg-v2-compare-toggle__icon-wrapper">
        <ChartIcon />
      </span>
      <span className="mg-v2-compare-toggle__label">
        {toDisplayString(t('public.pricing.compareToggle', '자세한 비교 보기'))}
      </span>
      <span className="mg-v2-compare-toggle__icon-wrapper mg-v2-compare-toggle__icon-wrapper--right">
        <ArrowIcon expanded={expanded} />
      </span>
    </button>
  );
};

PricingCompareToggle.propTypes = {
  expanded: PropTypes.bool.isRequired,
  onToggle: PropTypes.func.isRequired,
  controlsId: PropTypes.string,
  className: PropTypes.string,
};

export default PricingCompareToggle;
