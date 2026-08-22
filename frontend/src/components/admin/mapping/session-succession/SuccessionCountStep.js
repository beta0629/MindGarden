/**
 * 회기 승계 — 스텝2 상담사·회기 수 및 Before/After 프로젝션.
 *
 * @author CoreSolution
 * @since 2026-08-22
 */

import React from 'react';
import PropTypes from 'prop-types';
import { AlertTriangle } from 'lucide-react';
import CustomSelect from '../../../common/CustomSelect';
import MGButton from '../../../common/MGButton';
import { SESSION_SUCCESSION_UI } from '../../../../constants/sessionSuccession';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../../../erp/common/erpMgButtonProps';
import { toSafeNumber } from '../../../../utils/safeDisplay';

const SuccessionCountStep = ({
  consultantOptions,
  targetConsultantId,
  onTargetConsultantIdChange,
  listsLoading,
  sessionCount,
  transferable,
  remaining,
  occupying,
  onSessionCountChange,
  onApplyFullAmount
}) => {
  const count = toSafeNumber(sessionCount, 0);
  const afterRemaining = Math.max(0, toSafeNumber(remaining, 0) - count);

  return (
    <section className="session-succession-wizard__section session-succession-wizard__section--panel">
      <div className="session-succession-wizard__field-block">
        <span className="session-succession-wizard__field-label" id="session-succession-consultant-label">
          {SESSION_SUCCESSION_UI.TARGET_CONSULTANT_LABEL}
        </span>
        <CustomSelect
          options={consultantOptions}
          value={targetConsultantId}
          onChange={onTargetConsultantIdChange}
          placeholder={SESSION_SUCCESSION_UI.CONSULTANT_PLACEHOLDER}
          loading={listsLoading}
          disabled={listsLoading}
        />
        <p className="session-succession-wizard__helper">
          {SESSION_SUCCESSION_UI.CONSULTANT_HELPER}
        </p>
      </div>

      <div className="session-succession-wizard__field-block">
        <label className="session-succession-wizard__field-label" htmlFor="session-succession-n">
          {SESSION_SUCCESSION_UI.SESSION_COUNT_LABEL}
          {' '}
          (최대
          {' '}
          {transferable}
          )
        </label>
        <div className="session-succession-wizard__count-row">
          <input
            id="session-succession-n"
            type="number"
            className="mg-v2-input session-succession-wizard__stepper"
            min={1}
            max={Math.max(1, transferable)}
            value={sessionCount}
            onChange={(e) => onSessionCountChange(e.target.value)}
          />
          <MGButton
            type="button"
            variant="outline"
            size="small"
            className={buildErpMgButtonClassName({
              variant: 'outline',
              size: 'sm',
              loading: false
            })}
            loading={false}
            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
            onClick={onApplyFullAmount}
            disabled={transferable < 1}
            preventDoubleClick={false}
          >
            {SESSION_SUCCESSION_UI.FULL_AMOUNT_LABEL}
          </MGButton>
        </div>
      </div>

      <div className="session-succession-wizard__projection" aria-live="polite">
        <p className="session-succession-wizard__projection-row">
          <span>{SESSION_SUCCESSION_UI.SOURCE_PROJECTION_LABEL}</span>
          <strong>
            {toSafeNumber(remaining, 0)}
            <span className="session-succession-wizard__projection-arrow" aria-hidden="true">
              →
            </span>
            {afterRemaining}
          </strong>
        </p>
        <p className="session-succession-wizard__projection-row">
          <span>{SESSION_SUCCESSION_UI.TARGET_PROJECTION_LABEL}</span>
          <strong>
            신규
            {' '}
            {count}
            {SESSION_SUCCESSION_UI.TARGET_NEW_SESSIONS_SUFFIX}
          </strong>
        </p>
      </div>

      <p className="session-succession-wizard__banner" role="note">
        <AlertTriangle
          className="session-succession-wizard__banner-icon"
          size={16}
          aria-hidden
        />
        <span>
          {occupying > 0
            ? `${SESSION_SUCCESSION_UI.OCCUPYING_BANNER_PREFIX} ${occupying}${SESSION_SUCCESSION_UI.OCCUPYING_BANNER_SUFFIX}`
            : SESSION_SUCCESSION_UI.OCCUPYING_BANNER_STATIC}
        </span>
      </p>
    </section>
  );
};

SuccessionCountStep.propTypes = {
  consultantOptions: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string,
      label: PropTypes.string
    })
  ),
  targetConsultantId: PropTypes.string,
  onTargetConsultantIdChange: PropTypes.func.isRequired,
  listsLoading: PropTypes.bool,
  sessionCount: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  transferable: PropTypes.number,
  remaining: PropTypes.number,
  occupying: PropTypes.number,
  onSessionCountChange: PropTypes.func.isRequired,
  onApplyFullAmount: PropTypes.func.isRequired
};

SuccessionCountStep.defaultProps = {
  consultantOptions: [],
  targetConsultantId: '',
  listsLoading: false,
  sessionCount: 1,
  transferable: 0,
  remaining: 0,
  occupying: 0
};

export default SuccessionCountStep;
