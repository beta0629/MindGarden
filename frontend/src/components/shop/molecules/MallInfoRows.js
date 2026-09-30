/**
 * MallInfoRows — 라벨/값 정의 목록 (구성 · 이용기간 · 회기 추가 …)
 *
 * @author MindGarden
 * @since 2026-09-29
 */

import React from 'react';
import PropTypes from 'prop-types';

/**
 * @param {{
 *   rows: Array<{ key: string, label: string, value: import('react').ReactNode, sub?: import('react').ReactNode }>,
 *   className?: string
 * }} props
 */
const MallInfoRows = ({ rows, className = '' }) => (
  <dl className={['client-mall-rows', className].filter(Boolean).join(' ')}>
    {rows.map((row) => (
      <div key={row.key} className="client-mall-rows__row">
        <dt className="client-mall-rows__label">{row.label}</dt>
        <dd className="client-mall-rows__value">
          {row.value}
          {row.sub ? <span className="client-mall-rows__sub">{row.sub}</span> : null}
        </dd>
      </div>
    ))}
  </dl>
);

MallInfoRows.propTypes = {
  rows: PropTypes.arrayOf(PropTypes.shape({
    key: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    value: PropTypes.node,
    sub: PropTypes.node
  })).isRequired,
  className: PropTypes.string
};

export default MallInfoRows;
