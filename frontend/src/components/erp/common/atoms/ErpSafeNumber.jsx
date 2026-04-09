/**
 * ERP 수치 표시 Atom — toSafeNumber + 통화·건수·퍼센트 포맷 캡슐화
 *
 * @author CoreSolution
 * @since 2026-04-09
 */

import React from 'react';
import PropTypes from 'prop-types';
import { toSafeNumber } from '../../../../utils/safeDisplay';

export const ERP_NUMBER_FORMAT = {
  CURRENCY: 'currency',
  COUNT: 'count',
  PERCENT: 'percent'
};

/**
 * @param {number} n
 * @param {'currency'|'count'|'percent'} formatType
 * @returns {string}
 */
function formatSafeNumber(n, formatType) {
  const safe = toSafeNumber(n);
  if (formatType === ERP_NUMBER_FORMAT.CURRENCY) {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
      maximumFractionDigits: 0
    }).format(safe);
  }
  if (formatType === ERP_NUMBER_FORMAT.COUNT) {
    return `${new Intl.NumberFormat('ko-KR').format(safe)}건`;
  }
  if (formatType === ERP_NUMBER_FORMAT.PERCENT) {
    return `${new Intl.NumberFormat('ko-KR', { maximumFractionDigits: 2 }).format(safe)}%`;
  }
  return new Intl.NumberFormat('ko-KR').format(safe);
}

/**
 * @param {object} props
 * @param {unknown} props.value
 * @param {'currency'|'count'|'percent'} [props.formatType='currency']
 * @param {string} [props.className]
 * @param {string} [props.tag='span']
 */
export default function ErpSafeNumber({
  value,
  formatType = ERP_NUMBER_FORMAT.CURRENCY,
  className,
  tag = 'span'
}) {
  const text = formatSafeNumber(value, formatType);
  return React.createElement(tag, { className }, text);
}

ErpSafeNumber.propTypes = {
  value: PropTypes.any,
  formatType: PropTypes.oneOf([
    ERP_NUMBER_FORMAT.CURRENCY,
    ERP_NUMBER_FORMAT.COUNT,
    ERP_NUMBER_FORMAT.PERCENT
  ]),
  className: PropTypes.string,
  tag: PropTypes.string
};
