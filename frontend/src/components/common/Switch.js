/**
 * Switch — 모바일형 토글 Atom (role="switch")
 * NotificationScheduler 인라인 스위치와 시각·동작 정합.
 *
 * @author CoreSolution
 * @since 2026-08-07
 */

import React from 'react';
import PropTypes from 'prop-types';
import { toDisplayString } from '../../utils/safeDisplay';
import './Switch.css';

/**
 * @param {object} props
 * @param {boolean} [props.checked=false]
 * @param {(next: boolean) => void} [props.onCheckedChange]
 * @param {boolean} [props.disabled=false]
 * @param {boolean} [props.isPending=false] 저장 중 — disabled + aria-busy
 * @param {string} [props.id]
 * @param {string} [props.ariaLabel]
 * @param {string} [props.className]
 */
function Switch({
  checked = false,
  onCheckedChange,
  disabled = false,
  isPending = false,
  id,
  ariaLabel,
  className = '',
  ...rest
}) {
  const isDisabled = disabled || isPending;

  const handleClick = () => {
    if (isDisabled) {
      return;
    }
    if (typeof onCheckedChange === 'function') {
      onCheckedChange(!checked);
    }
  };

  const stateMod = checked ? 'mg-v2-switch--on' : 'mg-v2-switch--off';
  const classes = ['mg-v2-switch', stateMod, className].filter(Boolean).join(' ');
  const resolvedAria = ariaLabel != null && ariaLabel !== ''
    ? toDisplayString(ariaLabel, '')
    : undefined;

  return (
    <button
      type="button"
      role="switch"
      id={id}
      aria-checked={checked}
      aria-label={resolvedAria || undefined}
      aria-busy={isPending ? true : undefined}
      disabled={isDisabled}
      className={classes}
      onClick={handleClick}
      {...rest}
    >
      <span className="mg-v2-switch__knob" aria-hidden="true" />
    </button>
  );
}

Switch.propTypes = {
  checked: PropTypes.bool,
  onCheckedChange: PropTypes.func,
  disabled: PropTypes.bool,
  isPending: PropTypes.bool,
  id: PropTypes.string,
  ariaLabel: PropTypes.string,
  className: PropTypes.string
};

export default Switch;
