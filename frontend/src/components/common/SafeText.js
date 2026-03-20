/**
 * 예: <SafeText className="mg-muted">{row.label}</SafeText> — 객체/null 시 '—'로 표시 (React #130 방지)
 */

import React from 'react';
import { toDisplayString } from '../../utils/safeDisplay';

/**
 * JSX에 안전한 문자열만 렌더 (React #130: 객체 자식 방지)
 * @param {object} props
 * @param {unknown} props.children
 * @param {string} [props.fallback='—']
 * @param {string} [props.className]
 * @param {string} [props.tag='span']
 */
export default function SafeText({
  children,
  fallback = '—',
  className,
  tag = 'span'
}) {
  return React.createElement(
    tag,
    { className },
    toDisplayString(children, fallback)
  );
}
