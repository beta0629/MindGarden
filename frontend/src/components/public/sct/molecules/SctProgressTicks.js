/**
 * SCT 진행 눈금 50칸
 *
 * @author MindGarden
 * @since 2026-11-23
 */

import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { SCT_CSS, SCT_DEFAULTS, SCT_UI } from '../../../../constants/sctOnline';

/**
 * @param {{
 *   total?: number,
 *   answersMap: Record<string|number, { answerText?: string, notApplicable?: boolean }>,
 *   currentFrom?: number,
 *   currentTo?: number,
 *   label?: string
 * }} props
 */
const SctProgressTicks = ({
  total = SCT_DEFAULTS.TOTAL_ITEMS,
  answersMap,
  currentFrom,
  currentTo,
  label
}) => {
  const { ticks, answered } = useMemo(() => {
    let count = 0;
    const nodes = [];
    for (let n = 1; n <= total; n += 1) {
      const a = answersMap?.[n] || answersMap?.[String(n)];
      const isNa = a?.notApplicable === true;
      const hasText = Boolean(a?.answerText && String(a.answerText).trim());
      if (isNa || hasText) count += 1;
      const isCurrent = currentFrom != null && currentTo != null
        && n >= currentFrom && n <= currentTo;
      const className = [
        isNa ? 'is-na' : '',
        hasText ? 'is-answered' : '',
        isCurrent ? 'is-current' : ''
      ].filter(Boolean).join(' ');
      nodes.push(<i key={n} className={className || undefined} aria-hidden="true" />);
    }
    return { ticks: nodes, answered: count };
  }, [answersMap, currentFrom, currentTo, total]);

  return (
    <div className="mg-v2-sct-ticks-wrap">
      <div className={SCT_CSS.TICKS} aria-hidden="true">{ticks}</div>
      <div className="mg-v2-sct-ticks-meta">
        <span>
          {SCT_UI.PROGRESS_ANSWERED}
          {' '}
          <b>{answered}</b>
          {' / '}
          {total}
        </span>
        {label ? <span>{label}</span> : null}
      </div>
    </div>
  );
};

SctProgressTicks.propTypes = {
  total: PropTypes.number,
  answersMap: PropTypes.object,
  currentFrom: PropTypes.number,
  currentTo: PropTypes.number,
  label: PropTypes.string
};

export default SctProgressTicks;
