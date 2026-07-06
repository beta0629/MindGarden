/**
 * BrandSymbol — Core Solution 브랜드 심볼 Atom (Phase C-Refine v2)
 *
 * SPEC §8: variant props 로 light/dark 배경에 따른 색상 반전.
 * Core Solution 의 B2B SaaS 정체성(Navy + Primary Blue + Network Node)을 표현하는
 * 인라인 SVG 심볼. 색상은 모두 --mg-v2-onboarding-* 토큰만 사용.
 *
 * Reference: docs/design/v2/refine/v2/DESIGN_V2_REFINE_V2_ONBOARDING_SPEC.md §8
 *
 * @author CoreSolution
 * @since 2026-06-16
 */

import React from 'react';
import PropTypes from 'prop-types';

const VARIANTS = Object.freeze({
  LIGHT: 'light',
  DARK: 'dark',
});

const RING_INNER_RATIO = 0.406;
const RING_STROKE_RATIO = 0.094;
const CORE_INNER_RATIO = 0.344;

const BrandSymbol = ({
  variant = VARIANTS.DARK,
  size = 32,
  className = '',
  title,
}) => {
  const uniqueId = React.useId ? React.useId() : `brand-${variant}`;
  const gradientStart = variant === VARIANTS.DARK
    ? 'var(--mg-v2-onboarding-color-primary)'
    : 'var(--mg-v2-onboarding-color-primary)';
  const gradientEnd = variant === VARIANTS.DARK
    ? 'var(--mg-v2-onboarding-color-accent)'
    : 'var(--mg-v2-onboarding-color-accent)';
  const coreFill = variant === VARIANTS.DARK
    ? 'var(--mg-v2-onboarding-color-navy)'
    : 'var(--mg-v2-onboarding-color-white)';

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${size} ${size}`}
      width={size}
      height={size}
      fill="none"
      role="img"
      aria-label={title || 'Core Solution'}
      className={`mg-v2-brand-symbol mg-v2-brand-symbol--${variant} ${className}`.trim()}
    >
      <defs>
        <linearGradient id={`brand-symbol-grad-${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={gradientStart} />
          <stop offset="100%" stopColor={gradientEnd} />
        </linearGradient>
      </defs>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={size * RING_INNER_RATIO}
        stroke={`url(#brand-symbol-grad-${uniqueId})`}
        strokeWidth={size * RING_STROKE_RATIO}
        fill="none"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={size * CORE_INNER_RATIO}
        fill={coreFill}
      />
    </svg>
  );
};

BrandSymbol.propTypes = {
  variant: PropTypes.oneOf([VARIANTS.LIGHT, VARIANTS.DARK]),
  size: PropTypes.number,
  className: PropTypes.string,
  title: PropTypes.string,
};

export default BrandSymbol;
