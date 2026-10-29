/**
 * 커버 상담실 창 SVG — tobe-home.html 이식 · clinic-os 토큰 fill
 * portrait: 폰/웹·split 좌커버 (540×800)
 * landscape: ipad-p·stack 전폭 (820×480)
 *
 * @author CoreSolution
 * @since 2026-10-29
 */

import React, { useId } from 'react';
import PropTypes from 'prop-types';

export const COVER_CLINIC_SVG_VARIANT_PORTRAIT = 'portrait';
export const COVER_CLINIC_SVG_VARIANT_LANDSCAPE = 'landscape';

/**
 * @param {object} props
 * @param {string} [props.className]
 * @param {'portrait'|'landscape'} [props.variant]
 */
const CoverClinicSvg = ({
  className = 'client-cover__svg',
  variant = COVER_CLINIC_SVG_VARIANT_PORTRAIT
}) => {
  const uid = useId().replace(/:/g, '');
  const winId = `cover-win-${uid}`;
  const beamId = `cover-beam-${uid}`;
  const isLandscape = variant === COVER_CLINIC_SVG_VARIANT_LANDSCAPE;

  if (isLandscape) {
    return (
      <svg
        className={className}
        viewBox="0 0 820 480"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
        focusable="false"
      >
        <defs>
          <linearGradient id={winId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--mg-v2-color-primary-subtle)" />
            <stop offset="100%" stopColor="var(--mg-v2-color-accent-light)" />
          </linearGradient>
          <linearGradient id={beamId} x1="0.7" y1="0" x2="0.2" y2="1">
            <stop offset="0%" stopColor="var(--mg-v2-color-primary-subtle)" stopOpacity="0.5" />
            <stop offset="100%" stopColor="var(--mg-v2-color-primary-subtle)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <rect width="820" height="480" fill="var(--mg-v2-color-neutral-900)" />
        <rect
          width="820"
          height="480"
          fill="var(--mg-v2-color-neutral-800)"
          opacity="0.5"
        />
        <rect
          x="460"
          y="48"
          width="240"
          height="220"
          rx="4"
          fill={`url(#${winId})`}
        />
        <path d="M460 48h240v14H460z" fill="var(--mg-v2-color-secondary-dark)" />
        <path
          d="M580 48v220"
          stroke="var(--mg-v2-color-secondary-dark)"
          strokeWidth="5"
        />
        <path
          d="M460 158h240"
          stroke="var(--mg-v2-color-secondary-dark)"
          strokeWidth="4"
        />
        <polygon
          className="client-cover__light-beam consultant-cover-chapter__light-beam"
          points="460,64 700,64 300,480 80,480"
          fill={`url(#${beamId})`}
        />
        <rect
          x="100"
          y="300"
          width="180"
          height="12"
          rx="2"
          fill="var(--mg-v2-color-secondary-dark)"
        />
        <path
          d="M120 270c0-24 20-44 46-44h12v80H120z"
          fill="var(--mg-v2-color-neutral-700)"
        />
        <rect
          x="640"
          y="320"
          width="26"
          height="32"
          rx="3"
          fill="var(--mg-v2-color-secondary-dark)"
        />
        <ellipse
          cx="653"
          cy="306"
          rx="24"
          ry="14"
          fill="var(--mg-v2-color-primary-solid)"
        />
        <rect
          x="0"
          y="380"
          width="820"
          height="120"
          fill="var(--mg-v2-color-neutral-900)"
        />
      </svg>
    );
  }

  return (
    <svg
      className={className}
      viewBox="0 0 540 800"
      preserveAspectRatio="xMidYMax slice"
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
        className="client-cover__light-beam consultant-cover-chapter__light-beam"
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
        height="200"
        fill="var(--mg-v2-color-neutral-900)"
      />
    </svg>
  );
};

CoverClinicSvg.propTypes = {
  className: PropTypes.string,
  variant: PropTypes.oneOf([
    COVER_CLINIC_SVG_VARIANT_PORTRAIT,
    COVER_CLINIC_SVG_VARIANT_LANDSCAPE
  ])
};

export default CoverClinicSvg;
