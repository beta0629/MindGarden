/**
 * KpiNumeral — 대시보드 KPI 큰 건수 표기 atom
 * title → KpiNumeral → quiet caption 패턴의 수치 영역.
 *
 * @author CoreSolution
 * @since 2026-08-26
 */

import React from 'react';
import PropTypes from 'prop-types';
import { toDisplayString } from '../../../utils/safeDisplay';
import './KpiNumeral.css';

/**
 * @param {Object} props
 * @param {string|number|null|undefined} props.value - 표시 값 (safeDisplay)
 * @param {string} [props.unit='건'] - 단위 (빈 문자열이면 미표시)
 * @param {string} [props.className]
 */
const KpiNumeral = ({ value, unit = '건', className = '', ...rest }) => {
  const displayValue = toDisplayString(value);
  const displayUnit = unit != null && String(unit).trim() !== ''
    ? toDisplayString(unit)
    : '';

  return (
    <span className={`mg-v2-kpi-numeral ${className}`.trim()}>
      <span className="mg-v2-kpi-numeral__value" {...rest}>{displayValue}</span>
      {displayUnit ? (
        <span className="mg-v2-kpi-numeral__unit">{displayUnit}</span>
      ) : null}
    </span>
  );
};

KpiNumeral.propTypes = {
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  unit: PropTypes.string,
  className: PropTypes.string
};

export default KpiNumeral;
