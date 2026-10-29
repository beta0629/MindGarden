/**
 * 커버 상담실 창 SVG — tobe-home.html 이식 · clinic-os 토큰 fill
 *
 * @author CoreSolution
 * @since 2026-10-29
 */

import React, { useId } from 'react';
import PropTypes from 'prop-types';

/**
 * @param {object} props
 * @param {string} [props.className]
 */
const CoverClinicSvg = ({ className = 'client-cover__svg' }) => {
  const uid = useId().replace(/:/g, '');
  const winId = `cover-win-${uid}`;
  const beamId = `cover-beam-${uid}`;

  return (
    <svg
      className={className}
      viewBox="0 0 540 800"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id={winId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--mg-v2-color-primary-subtle)" />
          <stop offset="100%" stopColor="var(--mg-v2-color-accent-light)" />
        </linearGradient>
        <linearGradient id={beamId} x1="0.65" y1="0" x2="0.15" y2="1">
          <stop offset="0%" stopColor="var(--mg-v2-color-primary-subtle)" stopOpacity="0.5" />
          <stop offset="100%" stopColor="var(--mg-v2-color-primary-subtle)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect width="540" height="800" fill="var(--mg-v2-color-neutral-900)" />
      <rect
        width="540"
        height="800"
        fill="var(--mg-v2-color-neutral-800)"
        opacity="0.55"
      />
      <rect
        x="260"
        y="90"
        width="200"
        height="260"
        rx="4"
        fill={`url(#${winId})`}
        opacity="0.92"
      />
      <path d="M260 90h200v16H260z" fill="var(--mg-v2-color-secondary-dark)" />
      <path
        d="M360 90v260"
        stroke="var(--mg-v2-color-secondary-dark)"
        strokeWidth="5"
      />
      <path
        d="M260 220h200"
        stroke="var(--mg-v2-color-secondary-dark)"
        strokeWidth="4"
      />
      <polygon
        className="client-cover__light-beam"
        points="260,110 460,110 200,720 40,720"
        fill={`url(#${beamId})`}
      />
      <rect
        x="60"
        y="520"
        width="200"
        height="14"
        rx="2"
        fill="var(--mg-v2-color-secondary-dark)"
      />
      <rect x="80" y="534" width="12" height="70" fill="var(--mg-v2-color-neutral-700)" />
      <rect x="228" y="534" width="12" height="70" fill="var(--mg-v2-color-neutral-700)" />
      <path
        d="M90 470c0-28 22-50 50-50h14v90H90z"
        fill="var(--mg-v2-color-neutral-700)"
      />
      <path d="M100 510h90v10H100z" fill="var(--mg-v2-color-secondary-dark)" />
      <rect
        x="400"
        y="560"
        width="28"
        height="36"
        rx="3"
        fill="var(--mg-v2-color-secondary-dark)"
      />
      <ellipse
        cx="414"
        cy="544"
        rx="26"
        ry="16"
        fill="var(--mg-v2-color-primary-solid)"
      />
      <ellipse
        cx="400"
        cy="556"
        rx="14"
        ry="10"
        fill="var(--mg-v2-color-primary-main)"
      />
      <rect
        x="0"
        y="640"
        width="540"
        height="160"
        fill="var(--mg-v2-color-surface-sidebar)"
      />
    </svg>
  );
};

CoverClinicSvg.propTypes = {
  className: PropTypes.string
};

export default CoverClinicSvg;
