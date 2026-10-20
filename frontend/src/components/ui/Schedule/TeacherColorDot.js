/**
 * 담당 선생님 색 점 — getTeacherColor 결과만 렌더.
 * 상태 색 `__dot` 와 클래스 분리 (`mg-v2-teacher-dot`).
 *
 * @author CoreSolution
 * @since 2026-10-14
 */

import React from 'react';
import PropTypes from 'prop-types';
import './TeacherColorDot.css';

/**
 * @param {{
 *   colorResult?: {
 *     token?: string|null,
 *     paletteIndex?: number|null,
 *     hollow?: boolean,
 *     inlineColor?: string
 *   }|null,
 *   className?: string
 * }} props
 * @returns {JSX.Element|null}
 */
const TeacherColorDot = ({ colorResult, className }) => {
  if (!colorResult) {
    return null;
  }

  const paletteIndex = Number.isInteger(colorResult.paletteIndex)
    ? colorResult.paletteIndex
    : null;
  const paletteClass = paletteIndex != null && paletteIndex >= 0 && paletteIndex < 8
    ? ` mg-v2-teacher-dot--palette-${paletteIndex + 1}`
    : '';
  const hollowClass = colorResult.hollow ? ' mg-v2-teacher-dot--hollow' : ' mg-v2-teacher-dot--solid';
  const extra = className ? ` ${className}` : '';

  const style = {};
  if (colorResult.inlineColor) {
    style['--mg-v2-teacher-dot-color'] = colorResult.inlineColor;
  } else if (colorResult.token && paletteIndex == null) {
    style['--mg-v2-teacher-dot-color'] = colorResult.token;
  }

  const hasInline = Object.keys(style).length > 0;

  return (
    <span
      className={`mg-v2-teacher-dot${hollowClass}${paletteClass}${extra}`.trim()}
      style={hasInline ? style : undefined}
      aria-hidden="true"
    />
  );
};

TeacherColorDot.propTypes = {
  colorResult: PropTypes.shape({
    token: PropTypes.string,
    paletteIndex: PropTypes.number,
    hollow: PropTypes.bool,
    inlineColor: PropTypes.string
  }),
  className: PropTypes.string
};

TeacherColorDot.defaultProps = {
  colorResult: null,
  className: ''
};

export default TeacherColorDot;
