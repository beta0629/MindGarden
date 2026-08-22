/**
 * 회기 승계 — 스텝3 영수증 스타일 확인 + 사유.
 *
 * @author CoreSolution
 * @since 2026-08-22
 */

import React from 'react';
import PropTypes from 'prop-types';
import { SESSION_SUCCESSION_UI } from '../../../../constants/sessionSuccession';
import { toDisplayString, toSafeNumber } from '../../../../utils/safeDisplay';

const SuccessionConfirmStep = ({
  beneficiaryLabel,
  consultantLabel,
  sessionCount,
  reason,
  onReasonChange
}) => (
  <section className="session-succession-wizard__section">
    <div className="session-succession-wizard__receipt" aria-label="승계 요약">
      <ul className="session-succession-wizard__confirm-list">
        <li>
          <span>{SESSION_SUCCESSION_UI.BENEFICIARY_CONFIRM_LABEL}</span>
          <strong>{toDisplayString(beneficiaryLabel, '—')}</strong>
        </li>
        <li>
          <span>{SESSION_SUCCESSION_UI.CONSULTANT_CONFIRM_LABEL}</span>
          <strong>{toDisplayString(consultantLabel, '—')}</strong>
        </li>
        <li className="session-succession-wizard__confirm-list-item--highlight">
          <span>{SESSION_SUCCESSION_UI.SESSION_COUNT_CONFIRM_LABEL}</span>
          <strong className="session-succession-wizard__receipt-count">
            {toSafeNumber(sessionCount, 0)}
            회
          </strong>
        </li>
      </ul>
      <p className="session-succession-wizard__payment-notice" role="note">
        {SESSION_SUCCESSION_UI.PAYMENT_NOTICE}
      </p>
    </div>

    <div className="session-succession-wizard__field-block session-succession-wizard__section--panel">
      <label className="session-succession-wizard__field-label" htmlFor="session-succession-reason">
        {SESSION_SUCCESSION_UI.REASON_PLACEHOLDER}
      </label>
      <textarea
        id="session-succession-reason"
        className="mg-v2-input session-succession-wizard__reason"
        value={reason}
        onChange={(e) => onReasonChange(e.target.value)}
        rows={3}
      />
    </div>
  </section>
);

SuccessionConfirmStep.propTypes = {
  beneficiaryLabel: PropTypes.string,
  consultantLabel: PropTypes.string,
  sessionCount: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  reason: PropTypes.string,
  onReasonChange: PropTypes.func.isRequired
};

SuccessionConfirmStep.defaultProps = {
  beneficiaryLabel: '',
  consultantLabel: '',
  sessionCount: 0,
  reason: ''
};

export default SuccessionConfirmStep;
