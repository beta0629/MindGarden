/**
 * ERP 표시 경계 Atom — API/스칼라 외 값을 JSX 자식으로 두기 전에 정규화 (React #130 방지)
 *
 * @author CoreSolution
 * @since 2026-04-09
 */

import React from 'react';
import PropTypes from 'prop-types';
import { toDisplayString } from '../../../../utils/safeDisplay';

/**
 * @param {object} props
 * @param {unknown} [props.value] value가 있으면 children보다 우선
 * @param {unknown} [props.children]
 * @param {string} [props.fallback='—']
 * @param {string} [props.className]
 * @param {string} [props.tag='span']
 */
export default function ErpSafeText({
  value,
  children,
  fallback = '—',
  className,
  tag = 'span'
}) {
  const raw = value === undefined ? children : value;
  return React.createElement(tag, { className }, toDisplayString(raw, fallback));
}

ErpSafeText.propTypes = {
  value: PropTypes.any,
  children: PropTypes.any,
  fallback: PropTypes.string,
  className: PropTypes.string,
  tag: PropTypes.string
};
