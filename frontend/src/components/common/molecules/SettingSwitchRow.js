/**
 * SettingSwitchRow — 설정 boolean 행 Molecule (라벨·힌트 + 상태 + Switch)
 *
 * @author CoreSolution
 * @since 2026-08-07
 */

import React from 'react';
import PropTypes from 'prop-types';
import SafeText from '../SafeText';
import Switch from '../Switch';
import { toDisplayString } from '../../../utils/safeDisplay';
import './SettingSwitchRow.css';

/**
 * @param {object} props
 * @param {unknown} props.label
 * @param {unknown} [props.hint]
 * @param {unknown} [props.meta]
 * @param {unknown} [props.statusLabel]
 * @param {boolean} [props.checked=false]
 * @param {(next: boolean) => void} [props.onCheckedChange]
 * @param {boolean} [props.disabled=false]
 * @param {boolean} [props.isPending=false] 저장 중 — Switch disabled + aria-busy
 * @param {string} [props.id]
 * @param {string} [props.ariaLabel]
 * @param {string} [props.className]
 * @param {string} [props['data-testid']]
 */
function SettingSwitchRow({
  label,
  hint,
  meta,
  statusLabel,
  checked = false,
  onCheckedChange,
  disabled = false,
  isPending = false,
  id,
  ariaLabel,
  className = '',
  'data-testid': dataTestId
}) {
  const statusMod = checked ? 'on' : 'off';
  const rootClass = ['mg-v2-setting-switch-row', className].filter(Boolean).join(' ');
  const showHint = hint != null && hint !== '';
  const showMeta = meta != null && meta !== '';
  const showStatus = statusLabel != null && statusLabel !== '';
  const switchAria = ariaLabel != null && ariaLabel !== ''
    ? toDisplayString(ariaLabel, '')
    : toDisplayString(label, '');

  return (
    <div className={rootClass} data-testid={dataTestId ? `${dataTestId}-row` : undefined}>
      <div className="mg-v2-setting-switch-row__main">
        <p className="mg-v2-setting-switch-row__label">
          <SafeText>{label}</SafeText>
        </p>
        {showHint ? (
          <p className="mg-v2-setting-switch-row__hint">
            <SafeText>{hint}</SafeText>
          </p>
        ) : null}
        {showMeta ? (
          <p className="mg-v2-setting-switch-row__meta">
            <SafeText>{meta}</SafeText>
          </p>
        ) : null}
      </div>
      <div className="mg-v2-setting-switch-row__control">
        {showStatus ? (
          <span
            className={`mg-v2-setting-switch-row__status mg-v2-setting-switch-row__status--${statusMod}`}
            role="status"
          >
            <SafeText>{statusLabel}</SafeText>
          </span>
        ) : null}
        <Switch
          id={id}
          checked={checked}
          onCheckedChange={onCheckedChange}
          disabled={disabled}
          isPending={isPending}
          ariaLabel={switchAria}
          data-testid={dataTestId}
        />
      </div>
    </div>
  );
}

SettingSwitchRow.propTypes = {
  label: PropTypes.any.isRequired,
  hint: PropTypes.any,
  meta: PropTypes.any,
  statusLabel: PropTypes.any,
  checked: PropTypes.bool,
  onCheckedChange: PropTypes.func,
  disabled: PropTypes.bool,
  isPending: PropTypes.bool,
  id: PropTypes.string,
  ariaLabel: PropTypes.string,
  className: PropTypes.string,
  'data-testid': PropTypes.string
};

export default SettingSwitchRow;
