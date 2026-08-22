/**
 * 회기 승계 — 스텝1 수혜자 선택 (기존/신규 세그먼트).
 *
 * @author CoreSolution
 * @since 2026-08-22
 */

import React from 'react';
import PropTypes from 'prop-types';
import CustomSelect from '../../../common/CustomSelect';
import FormInput from '../../../common/FormInput';
import {
  SESSION_SUCCESSION_BENEFICIARY_MODE,
  SESSION_SUCCESSION_UI
} from '../../../../constants/sessionSuccession';
import { toDisplayString } from '../../../../utils/safeDisplay';

const BeneficiaryPickerStep = ({
  beneficiaryMode,
  onModeChange,
  clientOptions,
  beneficiaryClientId,
  onBeneficiaryClientIdChange,
  listsLoading,
  newClientName,
  newClientPhone,
  newClientEmail,
  onNewClientNameChange,
  onNewClientPhoneChange,
  onNewClientEmailChange,
  sameClientError
}) => (
  <section className="session-succession-wizard__section session-succession-wizard__section--panel">
    <div className="session-succession-wizard__tabs" role="tablist" aria-label="수혜자 모드">
      <button
        type="button"
        role="tab"
        aria-selected={beneficiaryMode === SESSION_SUCCESSION_BENEFICIARY_MODE.EXISTING}
        className={
          beneficiaryMode === SESSION_SUCCESSION_BENEFICIARY_MODE.EXISTING ? 'is-active' : ''
        }
        onClick={() => onModeChange(SESSION_SUCCESSION_BENEFICIARY_MODE.EXISTING)}
      >
        {SESSION_SUCCESSION_UI.MODE_EXISTING}
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={beneficiaryMode === SESSION_SUCCESSION_BENEFICIARY_MODE.NEW}
        className={
          beneficiaryMode === SESSION_SUCCESSION_BENEFICIARY_MODE.NEW ? 'is-active' : ''
        }
        onClick={() => onModeChange(SESSION_SUCCESSION_BENEFICIARY_MODE.NEW)}
      >
        {SESSION_SUCCESSION_UI.MODE_NEW}
      </button>
    </div>

    {beneficiaryMode === SESSION_SUCCESSION_BENEFICIARY_MODE.EXISTING ? (
      <>
        <CustomSelect
          options={clientOptions}
          value={beneficiaryClientId}
          onChange={onBeneficiaryClientIdChange}
          placeholder={SESSION_SUCCESSION_UI.CLIENT_LIST_PLACEHOLDER}
          loading={listsLoading}
          disabled={listsLoading}
        />
        {!listsLoading && (!clientOptions || clientOptions.length === 0) ? (
          <p className="session-succession-wizard__inline-hint" role="status">
            {SESSION_SUCCESSION_UI.CLIENT_LIST_EMPTY}
          </p>
        ) : null}
        {sameClientError ? (
          <p className="session-succession-wizard__inline-error" role="alert">
            {toDisplayString(sameClientError, SESSION_SUCCESSION_UI.SAME_CLIENT_ERROR)}
          </p>
        ) : null}
      </>
    ) : (
      <div className="session-succession-wizard__new-client">
        <FormInput
          type="text"
          name="session-succession-new-name"
          label={SESSION_SUCCESSION_UI.NEW_CLIENT_NAME_LABEL}
          value={newClientName}
          onChange={(e) => onNewClientNameChange(e.target.value)}
          autoComplete="name"
        />
        <FormInput
          type="tel"
          name="session-succession-new-phone"
          label={SESSION_SUCCESSION_UI.NEW_CLIENT_PHONE_LABEL}
          value={newClientPhone}
          onChange={(e) => onNewClientPhoneChange(e.target.value)}
          autoComplete="tel"
        />
        <FormInput
          type="email"
          name="session-succession-new-email"
          label={SESSION_SUCCESSION_UI.NEW_CLIENT_EMAIL_LABEL}
          value={newClientEmail}
          onChange={(e) => onNewClientEmailChange(e.target.value)}
          autoComplete="email"
        />
      </div>
    )}
  </section>
);

BeneficiaryPickerStep.propTypes = {
  beneficiaryMode: PropTypes.string.isRequired,
  onModeChange: PropTypes.func.isRequired,
  clientOptions: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string,
      label: PropTypes.string
    })
  ),
  beneficiaryClientId: PropTypes.string,
  onBeneficiaryClientIdChange: PropTypes.func.isRequired,
  listsLoading: PropTypes.bool,
  newClientName: PropTypes.string,
  newClientPhone: PropTypes.string,
  newClientEmail: PropTypes.string,
  onNewClientNameChange: PropTypes.func.isRequired,
  onNewClientPhoneChange: PropTypes.func.isRequired,
  onNewClientEmailChange: PropTypes.func.isRequired,
  sameClientError: PropTypes.string
};

BeneficiaryPickerStep.defaultProps = {
  clientOptions: [],
  beneficiaryClientId: '',
  listsLoading: false,
  newClientName: '',
  newClientPhone: '',
  newClientEmail: '',
  sameClientError: ''
};

export default BeneficiaryPickerStep;
