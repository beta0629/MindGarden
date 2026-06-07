/**
 * PushMonitorMaskedRecipient — 마스킹된 수신자 표시 atom.
 *
 * 디자인 §10 PII 가드 — `recipient_phone_masked` 백엔드 응답을 그대로 노출하고 재마스킹·
 * 평문 표시·복사 우회를 차단한다. `user-select: none` 으로 클립보드 복사를 비활성한다.
 *
 * @author MindGarden core-coder
 * @since 2026-06-07
 */

import React from 'react';
import PropTypes from 'prop-types';
import './PushMonitorMaskedRecipient.css';

const PushMonitorMaskedRecipient = ({ value, ariaLabel }) => {
  const display = typeof value === 'string' && value.length > 0 ? value : '—';
  return (
    <span
      className="mg-push-monitor__masked-recipient"
      aria-label={ariaLabel}
      data-testid="push-monitor-masked-recipient"
    >
      {display}
    </span>
  );
};

PushMonitorMaskedRecipient.propTypes = {
  value: PropTypes.string,
  ariaLabel: PropTypes.string
};

PushMonitorMaskedRecipient.defaultProps = {
  value: '',
  ariaLabel: undefined
};

export default PushMonitorMaskedRecipient;
