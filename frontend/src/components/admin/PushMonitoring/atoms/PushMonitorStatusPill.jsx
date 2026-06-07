/**
 * PushMonitorStatusPill — ON/OFF/✓/✗ 표기 atom.
 *
 * 핸드오프 §4.9 `StatusToggleBadge` 와 동일 역할. 테넌트 스냅샷 행에서 토글/등록 여부를
 * 시각적으로 표시한다. ARIA 라벨은 `${항목명}: ON` / `${항목명}: 등록됨` 등 호출자가 결정.
 *
 * @author MindGarden core-coder
 * @since 2026-06-07
 */

import React from 'react';
import PropTypes from 'prop-types';
import { ADMIN_WEB_SCAFFOLD_COPY } from '../../../../constants/adminWebScaffold';
import './PushMonitorStatusPill.css';

const STYLE_VARIANTS = Object.freeze({
  ON_OFF: 'on-off',
  CHECK: 'check'
});

const PushMonitorStatusPill = ({
  active,
  styleVariant,
  labelOn,
  labelOff,
  ariaLabel
}) => {
  const pillClass = [
    'mg-push-monitor__status-pill',
    `mg-push-monitor__status-pill--${active ? 'on' : 'off'}`,
    `mg-push-monitor__status-pill--${styleVariant}`
  ].join(' ');

  const resolvedLabel = active ? (labelOn || defaultOn(styleVariant))
    : (labelOff || defaultOff(styleVariant));

  return (
    <span className={pillClass} aria-label={ariaLabel} role="img">
      {resolvedLabel}
    </span>
  );
};

const defaultOn = (variant) => (variant === STYLE_VARIANTS.CHECK
  ? ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_SNAPSHOT_VALUE_OK
  : ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_SNAPSHOT_VALUE_ON);

const defaultOff = (variant) => (variant === STYLE_VARIANTS.CHECK
  ? ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_SNAPSHOT_VALUE_NG
  : ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_SNAPSHOT_VALUE_OFF);

PushMonitorStatusPill.propTypes = {
  active: PropTypes.bool.isRequired,
  styleVariant: PropTypes.oneOf(Object.values(STYLE_VARIANTS)),
  labelOn: PropTypes.string,
  labelOff: PropTypes.string,
  ariaLabel: PropTypes.string
};

PushMonitorStatusPill.defaultProps = {
  styleVariant: STYLE_VARIANTS.ON_OFF,
  labelOn: null,
  labelOff: null,
  ariaLabel: undefined
};

export default PushMonitorStatusPill;
export { STYLE_VARIANTS as PUSH_MONITOR_STATUS_PILL_VARIANTS };
