/**
 * KpiNumeral — 대시보드 KPI 큰 건수 표기 atom
 * title → KpiNumeral → quiet caption 패턴의 수치 영역.
 * AdminDashboardV2 대형 KPI 전용 calm digit-roll(오도미터).
 *
 * @author CoreSolution
 * @since 2026-08-26
 */

import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { toDisplayString } from '../../../utils/safeDisplay';
import './KpiNumeral.css';

/** 오도미터 리본에 쌓는 숫자 글리프 (0→9) */
const KPI_NUMERAL_DIGIT_GLYPHS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

/**
 * @param {string} char
 * @returns {boolean}
 */
const isDigitChar = (char) => char >= '0' && char <= '9';

/**
 * @returns {boolean}
 */
const readPrefersReducedMotion = () => {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
};

/**
 * prefers-reduced-motion 구독 훅
 * @returns {boolean}
 */
const usePrefersReducedMotion = () => {
  const [reduced, setReduced] = useState(readPrefersReducedMotion);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return undefined;
    }
    const mediaQuery = window.matchMedia(REDUCED_MOTION_QUERY);
    const handleChange = () => {
      setReduced(mediaQuery.matches);
    };
    handleChange();
    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
    mediaQuery.addListener(handleChange);
    return () => mediaQuery.removeListener(handleChange);
  }, []);

  return reduced;
};

/**
 * @param {Object} props
 * @param {string} props.digit
 */
const DigitColumn = ({ digit }) => {
  const offset = Number(digit);
  return (
    <span
      className="mg-v2-kpi-numeral__digit"
      style={{ '--mg-v2-kpi-numeral-digit-offset': offset }}
    >
      <span className="mg-v2-kpi-numeral__digit-ribbon mg-v2-kpi-numeral__digit-ribbon--rolling">
        {KPI_NUMERAL_DIGIT_GLYPHS.map((glyph) => (
          <span key={glyph} className="mg-v2-kpi-numeral__digit-glyph">
            {glyph}
          </span>
        ))}
      </span>
    </span>
  );
};

DigitColumn.propTypes = {
  digit: PropTypes.string.isRequired
};

/**
 * @param {Object} props
 * @param {string} props.displayValue
 */
const DigitRollValue = ({ displayValue }) => {
  const chars = Array.from(displayValue);
  const hasDigit = chars.some(isDigitChar);

  if (!hasDigit) {
    return null;
  }

  return (
    <span className="mg-v2-kpi-numeral__roll">
      {chars.map((char, index) => (
        isDigitChar(char) ? (
          <DigitColumn key={`d-${index}-${char}`} digit={char} />
        ) : (
          <span key={`s-${index}-${char}`} className="mg-v2-kpi-numeral__static">
            {char}
          </span>
        )
      ))}
    </span>
  );
};

DigitRollValue.propTypes = {
  displayValue: PropTypes.string.isRequired
};

/**
 * @param {Object} props
 * @param {string|number|null|undefined} props.value - 표시 값 (safeDisplay)
 * @param {string} [props.unit='건'] - 단위 (빈 문자열이면 미표시, 롤하지 않음)
 * @param {string} [props.className]
 */
const KpiNumeral = ({ value, unit = '건', className = '', ...rest }) => {
  const displayValue = toDisplayString(value);
  const displayUnit = unit != null && String(unit).trim() !== ''
    ? toDisplayString(unit)
    : '';
  const ariaLabel = displayUnit ? `${displayValue}${displayUnit}` : displayValue;
  const prefersReducedMotion = usePrefersReducedMotion();
  const canRoll = !prefersReducedMotion && Array.from(displayValue).some(isDigitChar);

  return (
    <span
      className={`mg-v2-kpi-numeral ${className}`.trim()}
      aria-label={ariaLabel}
    >
      <span
        className={`mg-v2-kpi-numeral__value${canRoll ? ' mg-v2-kpi-numeral__value--rolling' : ''}`}
        aria-hidden="true"
        {...rest}
      >
        <span className="mg-v2-kpi-numeral__plaintext">{displayValue}</span>
        {canRoll ? (
          <span className="mg-v2-kpi-numeral__roll-layer">
            <DigitRollValue key={displayValue} displayValue={displayValue} />
          </span>
        ) : null}
      </span>
      {displayUnit ? (
        <span className="mg-v2-kpi-numeral__unit" aria-hidden="true">{displayUnit}</span>
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
