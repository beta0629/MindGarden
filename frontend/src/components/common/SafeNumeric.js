/**
 * 예: <SafeNumeric>{metric.rate}</SafeNumeric> — 숫자·문자 혼합 API 필드를 안전하게 한 줄로 표시
 */

import React from 'react';
import { toDisplayString } from '../../utils/safeDisplay';

/* 추후 숫자 포맷(소수·단위·locale) SSOT는 safeDisplay.toNumericDisplay 도입 시 이 컴포넌트에서 일원화 */

/**
 * 숫자·문자 혼합 값을 안전한 표시 문자열로 렌더 (React #130 방지)
 * safeDisplay에 toNumericDisplay가 생기면 그쪽을 단일 소스로 사용하도록 교체 예정
 * @param {object} props
 * @param {unknown} props.children
 * @param {string} [props.fallback='—']
 * @param {string} [props.className]
 * @param {string} [props.tag='span']
 */
export default function SafeNumeric({
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
