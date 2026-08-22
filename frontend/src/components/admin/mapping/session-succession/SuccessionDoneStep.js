/**
 * 회기 승계 — 완료(DONE) 스텝: 승계 결과·타깃 매핑 요약.
 *
 * @author CoreSolution
 * @since 2026-08-22
 */

import React from 'react';
import PropTypes from 'prop-types';
import { SESSION_SUCCESSION_UI } from '../../../../constants/sessionSuccession';
import { toDisplayString, toSafeNumber } from '../../../../utils/safeDisplay';

const resolveTargetMappingId = (targetMapping) => {
  if (!targetMapping || typeof targetMapping !== 'object') {
    return null;
  }
  return targetMapping.id ?? targetMapping.mappingId ?? null;
};

const buildSidebarGuidance = (beneficiaryName) => {
  const name = toDisplayString(beneficiaryName, '수혜자');
  return SESSION_SUCCESSION_UI.DONE_SIDEBAR_GUIDANCE.replace('{beneficiaryName}', name);
};

const SuccessionDoneStep = ({ result }) => {
  const targetMapping = result?.targetMapping ?? null;
  const beneficiaryName = toDisplayString(
    targetMapping?.clientName,
    '수혜자'
  );
  const consultantName = toDisplayString(
    targetMapping?.consultantName,
    '상담사'
  );
  const transferredCount = toSafeNumber(result?.transferredCount, 0);
  const targetMappingId = resolveTargetMappingId(targetMapping);
  const sourceRemaining = toSafeNumber(result?.sourceMapping?.remainingSessions, 0);
  const targetRemaining = toSafeNumber(targetMapping?.remainingSessions, 0);

  return (
    <section
      className="session-succession-wizard__section session-succession-wizard__section--panel session-succession-wizard__done"
      aria-live="polite"
    >
      <p className="session-succession-wizard__done-lead">
        {SESSION_SUCCESSION_UI.DONE_SUCCESS_LEAD.replace(
          '{count}',
          String(transferredCount)
        )}
      </p>

      <div className="session-succession-wizard__receipt" aria-label="승계 결과">
        <ul className="session-succession-wizard__confirm-list">
          <li>
            <span>{SESSION_SUCCESSION_UI.DONE_BENEFICIARY_LABEL}</span>
            <strong>{beneficiaryName}</strong>
          </li>
          <li>
            <span>{SESSION_SUCCESSION_UI.DONE_CONSULTANT_LABEL}</span>
            <strong>{consultantName}</strong>
          </li>
          <li className="session-succession-wizard__confirm-list-item--highlight">
            <span>{SESSION_SUCCESSION_UI.SESSION_COUNT_CONFIRM_LABEL}</span>
            <strong className="session-succession-wizard__receipt-count">
              {transferredCount}
              회
            </strong>
          </li>
          {targetMappingId != null ? (
            <li>
              <span>{SESSION_SUCCESSION_UI.DONE_MAPPING_ID_LABEL}</span>
              <strong>{toDisplayString(targetMappingId, '—')}</strong>
            </li>
          ) : null}
          <li>
            <span>{SESSION_SUCCESSION_UI.SOURCE_PROJECTION_LABEL}</span>
            <strong>
              {SESSION_SUCCESSION_UI.DONE_REMAINING_SUFFIX.replace(
                '{count}',
                String(sourceRemaining)
              )}
            </strong>
          </li>
          <li>
            <span>{SESSION_SUCCESSION_UI.TARGET_PROJECTION_LABEL}</span>
            <strong>
              {SESSION_SUCCESSION_UI.DONE_REMAINING_SUFFIX.replace(
                '{count}',
                String(targetRemaining)
              )}
            </strong>
          </li>
        </ul>
      </div>

      <p className="session-succession-wizard__done-guidance" role="status">
        {buildSidebarGuidance(beneficiaryName)}
      </p>
    </section>
  );
};

SuccessionDoneStep.propTypes = {
  result: PropTypes.shape({
    transferredCount: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    sourceMapping: PropTypes.shape({
      remainingSessions: PropTypes.number
    }),
    targetMapping: PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      mappingId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      clientName: PropTypes.string,
      consultantName: PropTypes.string,
      remainingSessions: PropTypes.number
    })
  })
};

SuccessionDoneStep.defaultProps = {
  result: null
};

export default SuccessionDoneStep;
