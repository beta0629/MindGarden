/**
 * KpiSparkline — KPI 카드용 미니 추세선 atom (SVG polyline)
 *
 * 디자인 핸드오프 §3.4 Dashboard KPI Zone: 스파크라인은 aria-hidden,
 * 추세는 별도 텍스트(trendAriaLabel)로 제공.
 *
 * @author CoreSolution
 * @since 2026-07-02
 */

import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import './KpiSparkline.css';

const VIEW_WIDTH = 100;
const VIEW_HEIGHT = 32;
const PLOT_HEIGHT = 24;
const PLOT_TOP = 4;

/**
 * @param {number[]} data
 * @returns {string}
 */
function buildPolylinePoints(data) {
  if (!Array.isArray(data) || data.length === 0) {
    return '';
  }
  if (data.length === 1) {
    const y = VIEW_HEIGHT / 2;
    return `0,${y} ${VIEW_WIDTH},${y}`;
  }
  const maxVal = Math.max(...data, 1);
  return data
    .map((value, index) => {
      const x = (index / (data.length - 1)) * VIEW_WIDTH;
      const normalized = Math.max(0, Number(value) || 0) / maxVal;
      const y = PLOT_TOP + PLOT_HEIGHT - normalized * PLOT_HEIGHT;
      return `${x},${y}`;
    })
    .join(' ');
}

const KpiSparkline = ({ data = null, variant = 'green', className = '' }) => {
  const points = useMemo(() => buildPolylinePoints(data), [data]);

  if (!points) {
    return null;
  }

  const rootClass = [
    'mg-v2-kpi-sparkline',
    `mg-v2-kpi-sparkline--${variant}`,
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={rootClass} aria-hidden="true" data-testid="kpi-sparkline">
      <svg
        className="mg-v2-kpi-sparkline__svg"
        viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
        preserveAspectRatio="none"
        focusable="false"
      >
        <polyline
          className="mg-v2-kpi-sparkline__line"
          fill="none"
          points={points}
        />
      </svg>
    </div>
  );
};

KpiSparkline.propTypes = {
  data: PropTypes.arrayOf(PropTypes.number),
  variant: PropTypes.oneOf(['green', 'orange', 'blue', 'gray']),
  className: PropTypes.string
};

export default KpiSparkline;
