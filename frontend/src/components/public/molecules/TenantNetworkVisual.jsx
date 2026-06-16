/**
 * TenantNetworkVisual — 멀티 테넌트 네트워크 일러스트 Molecule (Phase C-Refine v2)
 *
 * SPEC §3.1 / §8: 좌측 Dark Panel 의 시각 자산.
 *   - 중앙 Core 심볼 (120×120px) + 5 노드 (64×64px, Tenant A~E)
 *   - 노드는 중앙을 중심으로 방사형 배치 (반경 ≈ 200px)
 *   - 연결선 stroke 2px, 투명도 40% 그라데이션
 *   - SVG viewBox: 0 0 400 400
 *
 * 색상은 모두 --mg-v2-onboarding-* 토큰을 통해 SVG 내부에서 참조한다.
 *
 * @author CoreSolution
 * @since 2026-06-16
 */

import React from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import './TenantNetworkVisual.css';

const VIEWBOX_SIZE = 400;
const CENTER = VIEWBOX_SIZE / 2;
const CORE_RADIUS = 60;
const CORE_INNER_RADIUS = 18;
const NODE_RADIUS = 32;
const NODE_INNER_RADIUS = 6;
const NODE_ORBIT_RADIUS = 140;
const STROKE_WIDTH = 2;
const NODE_LABEL_OFFSET = 50;
const NODE_COUNT = 5;
const START_ANGLE_DEG = 90;
const ANGLE_STEP_DEG = 360 / NODE_COUNT;
const DEG_TO_RAD = Math.PI / 180;

const NODE_LABELS = Object.freeze(['Tenant A', 'Tenant B', 'Tenant C', 'Tenant D', 'Tenant E']);

const computeNodes = () => Array.from({ length: NODE_COUNT }, (_, index) => {
  const angle = (START_ANGLE_DEG - index * ANGLE_STEP_DEG) * DEG_TO_RAD;
  return {
    cx: CENTER + NODE_ORBIT_RADIUS * Math.cos(angle),
    cy: CENTER - NODE_ORBIT_RADIUS * Math.sin(angle),
    label: NODE_LABELS[index],
  };
});

const TenantNetworkVisual = ({ className = '', ariaLabel }) => {
  const { t } = useTranslation('common');
  const nodes = React.useMemo(computeNodes, []);
  const uniqueId = React.useId ? React.useId() : 'tenant-network';
  const accessibleLabel = ariaLabel
    || t('public.onboarding.v2.networkVisualAria', '멀티 테넌트 네트워크 구조 일러스트');

  return (
    <figure
      className={`mg-v2-tenant-network ${className}`.trim()}
      aria-label={accessibleLabel}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox={`0 0 ${VIEWBOX_SIZE} ${VIEWBOX_SIZE}`}
        className="mg-v2-tenant-network__svg"
        role="img"
        aria-label={accessibleLabel}
      >
        <defs>
          {nodes.map((node, index) => (
            <linearGradient
              key={`grad-${index}`}
              id={`tnv-line-grad-${uniqueId}-${index}`}
              gradientUnits="userSpaceOnUse"
              x1={CENTER}
              y1={CENTER}
              x2={node.cx}
              y2={node.cy}
            >
              <stop
                offset="0%"
                stopColor="var(--mg-v2-onboarding-color-primary)"
                stopOpacity="0.8"
              />
              <stop
                offset="100%"
                stopColor="var(--mg-v2-onboarding-color-accent)"
                stopOpacity="var(--mg-v2-onboarding-network-line-opacity, 0.4)"
              />
            </linearGradient>
          ))}
          <radialGradient id={`tnv-core-glow-${uniqueId}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="var(--mg-v2-onboarding-color-primary)" stopOpacity="0.6" />
            <stop offset="100%" stopColor="var(--mg-v2-onboarding-color-primary)" stopOpacity="0" />
          </radialGradient>
        </defs>

        {nodes.map((node, index) => (
          <line
            key={`line-${index}`}
            x1={CENTER}
            y1={CENTER}
            x2={node.cx}
            y2={node.cy}
            stroke={`url(#tnv-line-grad-${uniqueId}-${index})`}
            strokeWidth={STROKE_WIDTH}
          />
        ))}

        <circle
          cx={CENTER}
          cy={CENTER}
          r={CORE_RADIUS + 16}
          fill={`url(#tnv-core-glow-${uniqueId})`}
        />
        <circle
          cx={CENTER}
          cy={CENTER}
          r={CORE_RADIUS}
          fill="var(--mg-v2-onboarding-color-navy)"
          stroke="var(--mg-v2-onboarding-color-primary)"
          strokeWidth="4"
        />
        <circle
          cx={CENTER}
          cy={CENTER}
          r={CORE_INNER_RADIUS}
          fill="var(--mg-v2-onboarding-color-primary)"
        />

        {nodes.map((node, index) => (
          <g key={`node-${index}`}>
            <circle
              cx={node.cx}
              cy={node.cy}
              r={NODE_RADIUS}
              fill="var(--mg-v2-onboarding-color-dark-surface)"
              stroke="var(--mg-v2-onboarding-color-accent)"
              strokeWidth={STROKE_WIDTH}
            />
            <circle
              cx={node.cx}
              cy={node.cy}
              r={NODE_INNER_RADIUS}
              fill="var(--mg-v2-onboarding-color-white)"
            />
            <text
              x={node.cx}
              y={node.cy + NODE_LABEL_OFFSET}
              textAnchor="middle"
              fill="var(--mg-v2-onboarding-color-text-muted)"
              fontSize="14"
              fontFamily="var(--mg-v2-onboarding-font-family-base)"
            >
              {node.label}
            </text>
          </g>
        ))}
      </svg>
    </figure>
  );
};

TenantNetworkVisual.propTypes = {
  className: PropTypes.string,
  ariaLabel: PropTypes.string,
};

export default TenantNetworkVisual;
