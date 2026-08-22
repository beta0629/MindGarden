/**
 * 회기 승계 마법사 — UnifiedModal 3스텝 (+완료).
 * PLAN/SCREEN_SPEC_SESSION_SUCCESSION.
 *
 * @author CoreSolution
 * @since 2026-08-22
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import UnifiedModal from '../../common/modals/UnifiedModal';
import MGButton from '../../common/MGButton';
import CustomSelect from '../../common/CustomSelect';
import { API_ENDPOINTS } from '../../../constants/apiEndpoints';
import {
  SESSION_SUCCESSION_BENEFICIARY_MODE,
  SESSION_SUCCESSION_STEPS,
  SESSION_SUCCESSION_UI
} from '../../../constants/sessionSuccession';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../../erp/common/erpMgButtonProps';
import notificationManager from '../../../utils/notification';
import { toDisplayString, toErrorMessage, toSafeNumber } from '../../../utils/safeDisplay';
import StandardizedApi from '../../../utils/standardizedApi';
import './SessionSuccessionWizardModal.css';

const unwrapList = (payload) => {
  if (Array.isArray(payload)) {
    return payload;
  }
  if (Array.isArray(payload?.data)) {
    return payload.data;
  }
  if (Array.isArray(payload?.content)) {
    return payload.content;
  }
  return [];
};

const SessionSuccessionWizardModal = ({
  isOpen,
  onClose,
  mapping,
  onSucceeded
}) => {
  const [step, setStep] = useState(SESSION_SUCCESSION_STEPS.BENEFICIARY);
  const [preview, setPreview] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState('');
  const [beneficiaryMode, setBeneficiaryMode] = useState(
    SESSION_SUCCESSION_BENEFICIARY_MODE.EXISTING
  );
  const [beneficiaryClientId, setBeneficiaryClientId] = useState('');
  const [newClientName, setNewClientName] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');
  const [targetConsultantId, setTargetConsultantId] = useState('');
  const [sessionCount, setSessionCount] = useState(1);
  const [reason, setReason] = useState('');
  const [clientOptions, setClientOptions] = useState([]);
  const [consultantOptions, setConsultantOptions] = useState([]);
  const [listsLoading, setListsLoading] = useState(false);
  const [inlineError, setInlineError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const submittingRef = useRef(false);

  const sourceClientId = mapping?.clientId ?? mapping?.client?.id ?? null;
  const sourceConsultantId = mapping?.consultantId ?? mapping?.consultant?.id ?? null;
  const sourceClientName = toDisplayString(
    mapping?.clientName ?? preview?.clientName,
    '이전 당사자'
  );
  const sourceConsultantName = toDisplayString(
    mapping?.consultantName ?? preview?.consultantName,
    '상담사'
  );
  const transferable = toSafeNumber(preview?.transferableSessions, 0);
  const occupying = toSafeNumber(preview?.occupyingScheduleCount, 0);
  const remaining = toSafeNumber(
    preview?.remainingSessions ?? mapping?.remainingSessions,
    0
  );

  const resetState = useCallback(() => {
    setStep(SESSION_SUCCESSION_STEPS.BENEFICIARY);
    setPreview(null);
    setPreviewLoading(false);
    setPreviewError('');
    setBeneficiaryMode(SESSION_SUCCESSION_BENEFICIARY_MODE.EXISTING);
    setBeneficiaryClientId('');
    setNewClientName('');
    setNewClientPhone('');
    setNewClientEmail('');
    setTargetConsultantId('');
    setSessionCount(1);
    setReason('');
    setInlineError('');
    setSubmitting(false);
    setResult(null);
    submittingRef.current = false;
  }, []);

  const loadPreview = useCallback(async() => {
    if (!mapping?.id) {
      return;
    }
    setPreviewLoading(true);
    setPreviewError('');
    try {
      const data = await StandardizedApi.get(
        API_ENDPOINTS.ADMIN.MAPPINGS.SESSION_SUCCESSION_PREVIEW(mapping.id)
      );
      const body = data?.data ?? data;
      setPreview(body);
      const max = toSafeNumber(body?.transferableSessions, 0);
      setSessionCount(max > 0 ? max : 1);
      const defaultConsultant = body?.consultantId ?? sourceConsultantId;
      if (defaultConsultant != null) {
        setTargetConsultantId(String(defaultConsultant));
      }
    } catch (error) {
      setPreviewError(toErrorMessage(error, SESSION_SUCCESSION_UI.PREVIEW_FAILED));
      setPreview(null);
    } finally {
      setPreviewLoading(false);
    }
  }, [mapping?.id, sourceConsultantId]);

  const loadSelectOptions = useCallback(async() => {
    setListsLoading(true);
    try {
      const [clientsRaw, consultantsRaw] = await Promise.all([
        StandardizedApi.get(API_ENDPOINTS.ADMIN.CLIENTS.WITH_MAPPING_INFO),
        StandardizedApi.get(API_ENDPOINTS.ADMIN.CONSULTANTS.WITH_STATS)
      ]);
      const clients = unwrapList(clientsRaw?.data ?? clientsRaw);
      const consultants = unwrapList(consultantsRaw?.data ?? consultantsRaw);
      setClientOptions(
        clients
          .filter((c) => c?.id != null && String(c.id) !== String(sourceClientId))
          .map((c) => ({
            value: String(c.id),
            label: toDisplayString(c.name || c.clientName, `내담자 #${c.id}`)
          }))
      );
      setConsultantOptions(
        consultants
          .filter((c) => c?.id != null)
          .map((c) => ({
            value: String(c.id),
            label: toDisplayString(c.name || c.consultantName, `상담사 #${c.id}`)
          }))
      );
    } catch (error) {
      console.error('회기 승계 옵션 로드 실패:', error);
      setClientOptions([]);
      setConsultantOptions([]);
    } finally {
      setListsLoading(false);
    }
  }, [sourceClientId]);

  useEffect(() => {
    if (!isOpen || !mapping) {
      return;
    }
    resetState();
    loadPreview();
    loadSelectOptions();
  }, [isOpen, mapping, resetState, loadPreview, loadSelectOptions]);

  const subtitle = useMemo(
    () => `${sourceClientName} — ${sourceConsultantName}`,
    [sourceClientName, sourceConsultantName]
  );

  const validateBeneficiaryStep = () => {
    if (beneficiaryMode === SESSION_SUCCESSION_BENEFICIARY_MODE.EXISTING) {
      if (!beneficiaryClientId) {
        setInlineError(SESSION_SUCCESSION_UI.BENEFICIARY_REQUIRED);
        return false;
      }
      if (String(beneficiaryClientId) === String(sourceClientId)) {
        setInlineError(SESSION_SUCCESSION_UI.SAME_CLIENT_ERROR);
        return false;
      }
    } else {
      if (!newClientName.trim()) {
        setInlineError(SESSION_SUCCESSION_UI.NEW_NAME_REQUIRED);
        return false;
      }
      if (!newClientPhone.trim() && !newClientEmail.trim()) {
        setInlineError(SESSION_SUCCESSION_UI.NEW_CONTACT_REQUIRED);
        return false;
      }
    }
    if (transferable < 1) {
      setInlineError(SESSION_SUCCESSION_UI.ZERO_TRANSFERABLE);
      return false;
    }
    setInlineError('');
    return true;
  };

  const validateCountStep = () => {
    if (!targetConsultantId) {
      setInlineError(SESSION_SUCCESSION_UI.CONSULTANT_REQUIRED);
      return false;
    }
    const n = toSafeNumber(sessionCount, 0);
    if (n < 1 || n > transferable) {
      setInlineError(SESSION_SUCCESSION_UI.ZERO_TRANSFERABLE);
      return false;
    }
    setInlineError('');
    return true;
  };

  const handleNext = () => {
    if (step === SESSION_SUCCESSION_STEPS.BENEFICIARY) {
      if (!validateBeneficiaryStep()) {
        return;
      }
      setStep(SESSION_SUCCESSION_STEPS.COUNT);
      return;
    }
    if (step === SESSION_SUCCESSION_STEPS.COUNT) {
      if (!validateCountStep()) {
        return;
      }
      setStep(SESSION_SUCCESSION_STEPS.CONFIRM);
    }
  };

  const handlePrev = () => {
    setInlineError('');
    if (step === SESSION_SUCCESSION_STEPS.COUNT) {
      setStep(SESSION_SUCCESSION_STEPS.BENEFICIARY);
    } else if (step === SESSION_SUCCESSION_STEPS.CONFIRM) {
      setStep(SESSION_SUCCESSION_STEPS.COUNT);
    }
  };

  const handleSessionCountChange = (raw) => {
    const n = toSafeNumber(raw, 1);
    if (transferable < 1) {
      setSessionCount(1);
      return;
    }
    setSessionCount(Math.min(Math.max(1, n), transferable));
  };

  const handleExecute = async() => {
    if (submittingRef.current || !mapping?.id) {
      return;
    }
    if (!validateBeneficiaryStep() || !validateCountStep()) {
      return;
    }
    submittingRef.current = true;
    setSubmitting(true);
    setInlineError('');
    try {
      const body = {
        targetConsultantId: Number(targetConsultantId),
        sessionCount: toSafeNumber(sessionCount, 0),
        reason: reason.trim() || undefined
      };
      if (beneficiaryMode === SESSION_SUCCESSION_BENEFICIARY_MODE.EXISTING) {
        body.beneficiaryClientId = Number(beneficiaryClientId);
      } else {
        body.newClient = {
          name: newClientName.trim(),
          phone: newClientPhone.trim() || undefined,
          email: newClientEmail.trim() || undefined
        };
      }
      const response = await StandardizedApi.post(
        API_ENDPOINTS.ADMIN.MAPPINGS.SESSION_SUCCESSION(mapping.id),
        body
      );
      if (response?.success === false) {
        throw new Error(response.message || SESSION_SUCCESSION_UI.EXECUTE_FAILED);
      }
      const payload = response?.data ?? response;
      setResult(payload);
      setStep(SESSION_SUCCESSION_STEPS.DONE);
      notificationManager.success(SESSION_SUCCESSION_UI.SUCCESS);
      await onSucceeded?.(payload);
    } catch (error) {
      console.error('회기 승계 실패:', error);
      setInlineError(toErrorMessage(error, SESSION_SUCCESSION_UI.EXECUTE_FAILED));
    } finally {
      setSubmitting(false);
      submittingRef.current = false;
    }
  };

  const handleClose = () => {
    if (submitting) {
      return;
    }
    onClose();
  };

  const selectedBeneficiaryLabel = useMemo(() => {
    if (beneficiaryMode === SESSION_SUCCESSION_BENEFICIARY_MODE.NEW) {
      return toDisplayString(newClientName, '신규 수혜자');
    }
    const found = clientOptions.find((o) => o.value === String(beneficiaryClientId));
    return found?.label || toDisplayString(beneficiaryClientId, '—');
  }, [beneficiaryMode, newClientName, clientOptions, beneficiaryClientId]);

  const selectedConsultantLabel = useMemo(() => {
    const found = consultantOptions.find((o) => o.value === String(targetConsultantId));
    return found?.label || toDisplayString(targetConsultantId, '—');
  }, [consultantOptions, targetConsultantId]);

  const footerActions = (() => {
    if (step === SESSION_SUCCESSION_STEPS.DONE) {
      return (
        <MGButton
          type="button"
          variant="primary"
          className={buildErpMgButtonClassName({ variant: 'primary', size: 'md', loading: false })}
          loading={false}
          loadingText={ERP_MG_BUTTON_LOADING_TEXT}
          onClick={handleClose}
          preventDoubleClick={false}
        >
          {SESSION_SUCCESSION_UI.CLOSE_LABEL}
        </MGButton>
      );
    }
    return (
      <>
        <MGButton
          type="button"
          variant="secondary"
          className={buildErpMgButtonClassName({ variant: 'secondary', size: 'md', loading: false })}
          loading={false}
          loadingText={ERP_MG_BUTTON_LOADING_TEXT}
          onClick={step === SESSION_SUCCESSION_STEPS.BENEFICIARY ? handleClose : handlePrev}
          disabled={submitting}
          preventDoubleClick={false}
        >
          {step === SESSION_SUCCESSION_STEPS.BENEFICIARY
            ? SESSION_SUCCESSION_UI.CANCEL_LABEL
            : SESSION_SUCCESSION_UI.PREV_LABEL}
        </MGButton>
        {step === SESSION_SUCCESSION_STEPS.CONFIRM ? (
          <MGButton
            type="button"
            variant="primary"
            className={buildErpMgButtonClassName({
              variant: 'primary',
              size: 'md',
              loading: submitting
            })}
            loading={submitting}
            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
            onClick={handleExecute}
            disabled={submitting || transferable < 1 || previewLoading || Boolean(previewError)}
            preventDoubleClick
          >
            {SESSION_SUCCESSION_UI.EXECUTE_LABEL}
          </MGButton>
        ) : (
          <MGButton
            type="button"
            variant="primary"
            className={buildErpMgButtonClassName({ variant: 'primary', size: 'md', loading: false })}
            loading={false}
            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
            onClick={handleNext}
            disabled={previewLoading || Boolean(previewError) || transferable < 1}
            preventDoubleClick={false}
          >
            {SESSION_SUCCESSION_UI.NEXT_LABEL}
          </MGButton>
        )}
      </>
    );
  })();

  return (
    <UnifiedModal
      isOpen={isOpen}
      onClose={handleClose}
      title={SESSION_SUCCESSION_UI.MODAL_TITLE}
      subtitle={subtitle}
      size="large"
      className="mg-v2-ad-b0kla session-succession-wizard"
      loading={previewLoading && !preview}
      actions={footerActions}
      backdropClick={!submitting}
    >
      <div className="session-succession-wizard__body">
        {step !== SESSION_SUCCESSION_STEPS.DONE && (
          <nav className="session-succession-wizard__steps" aria-label="회기 승계 단계">
            <span className={step === SESSION_SUCCESSION_STEPS.BENEFICIARY ? 'is-active' : ''}>
              1 {SESSION_SUCCESSION_UI.STEP_BENEFICIARY}
            </span>
            <span className={step === SESSION_SUCCESSION_STEPS.COUNT ? 'is-active' : ''}>
              2 {SESSION_SUCCESSION_UI.STEP_CONSULTANT_SESSIONS}
            </span>
            <span className={step === SESSION_SUCCESSION_STEPS.CONFIRM ? 'is-active' : ''}>
              3 {SESSION_SUCCESSION_UI.STEP_CONFIRM}
            </span>
          </nav>
        )}

        {previewError && (
          <div className="session-succession-wizard__error" role="alert">
            <p>{toDisplayString(previewError, SESSION_SUCCESSION_UI.PREVIEW_FAILED)}</p>
            <MGButton
              type="button"
              variant="secondary"
              size="small"
              className={buildErpMgButtonClassName({ variant: 'secondary', size: 'sm', loading: false })}
              loading={false}
              loadingText={ERP_MG_BUTTON_LOADING_TEXT}
              onClick={loadPreview}
              preventDoubleClick={false}
            >
              {SESSION_SUCCESSION_UI.RETRY_LABEL}
            </MGButton>
          </div>
        )}

        {!previewError && (
          <section className="session-succession-wizard__summary" aria-label="소스 요약">
            <p className="session-succession-wizard__summary-row">
              <span>패키지</span>
              <strong>{toDisplayString(preview?.packageName ?? mapping?.packageName, '—')}</strong>
            </p>
            <p className="session-succession-wizard__summary-row">
              <span>사용 / 남은 / 총</span>
              <strong>
                {toSafeNumber(preview?.usedSessions ?? mapping?.usedSessions, 0)}
                {' / '}
                {remaining}
                {' / '}
                {toSafeNumber(preview?.totalSessions ?? mapping?.totalSessions, 0)}
              </strong>
            </p>
            <p className="session-succession-wizard__summary-row">
              <span>점유 스케줄</span>
              <strong>{occupying}건</strong>
            </p>
            <p className="session-succession-wizard__summary-row">
              <span>승계가능</span>
              <strong>{transferable}회</strong>
            </p>
            {transferable < 1 && !previewLoading && (
              <p className="session-succession-wizard__zero" role="status">
                {SESSION_SUCCESSION_UI.ZERO_TRANSFERABLE}
              </p>
            )}
          </section>
        )}

        {step === SESSION_SUCCESSION_STEPS.BENEFICIARY && !previewError && (
          <section className="session-succession-wizard__section">
            <div className="session-succession-wizard__tabs" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={beneficiaryMode === SESSION_SUCCESSION_BENEFICIARY_MODE.EXISTING}
                className={
                  beneficiaryMode === SESSION_SUCCESSION_BENEFICIARY_MODE.EXISTING
                    ? 'is-active'
                    : ''
                }
                onClick={() => setBeneficiaryMode(SESSION_SUCCESSION_BENEFICIARY_MODE.EXISTING)}
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
                onClick={() => setBeneficiaryMode(SESSION_SUCCESSION_BENEFICIARY_MODE.NEW)}
              >
                {SESSION_SUCCESSION_UI.MODE_NEW}
              </button>
            </div>
            {beneficiaryMode === SESSION_SUCCESSION_BENEFICIARY_MODE.EXISTING ? (
              <CustomSelect
                options={clientOptions}
                value={beneficiaryClientId}
                onChange={setBeneficiaryClientId}
                placeholder={SESSION_SUCCESSION_UI.MODE_EXISTING}
                loading={listsLoading}
                disabled={listsLoading}
              />
            ) : (
              <div className="session-succession-wizard__new-client">
                <label>
                  이름
                  <input
                    type="text"
                    className="mg-v2-input"
                    value={newClientName}
                    onChange={(e) => setNewClientName(e.target.value)}
                    autoComplete="name"
                  />
                </label>
                <label>
                  휴대폰
                  <input
                    type="tel"
                    className="mg-v2-input"
                    value={newClientPhone}
                    onChange={(e) => setNewClientPhone(e.target.value)}
                    autoComplete="tel"
                  />
                </label>
                <label>
                  이메일
                  <input
                    type="email"
                    className="mg-v2-input"
                    value={newClientEmail}
                    onChange={(e) => setNewClientEmail(e.target.value)}
                    autoComplete="email"
                  />
                </label>
              </div>
            )}
          </section>
        )}

        {step === SESSION_SUCCESSION_STEPS.COUNT && !previewError && (
          <section className="session-succession-wizard__section">
            <p className="session-succession-wizard__helper">
              {SESSION_SUCCESSION_UI.CONSULTANT_HELPER}
            </p>
            <label className="session-succession-wizard__field-label">타깃 상담사</label>
            <CustomSelect
              options={consultantOptions}
              value={targetConsultantId}
              onChange={setTargetConsultantId}
              placeholder="상담사 선택"
              loading={listsLoading}
              disabled={listsLoading}
            />
            <label className="session-succession-wizard__field-label" htmlFor="session-succession-n">
              이전 횟수 N (최대 {transferable})
            </label>
            <div className="session-succession-wizard__count-row">
              <input
                id="session-succession-n"
                type="number"
                className="mg-v2-input"
                min={1}
                max={Math.max(1, transferable)}
                value={sessionCount}
                onChange={(e) => handleSessionCountChange(e.target.value)}
              />
              <MGButton
                type="button"
                variant="secondary"
                size="small"
                className={buildErpMgButtonClassName({
                  variant: 'secondary',
                  size: 'sm',
                  loading: false
                })}
                loading={false}
                loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                onClick={() => setSessionCount(transferable)}
                disabled={transferable < 1}
                preventDoubleClick={false}
              >
                {SESSION_SUCCESSION_UI.FULL_AMOUNT_LABEL}
              </MGButton>
            </div>
            <div className="session-succession-wizard__projection" aria-live="polite">
              <p>
                소스 남은 {remaining}
                {' → '}
                {Math.max(0, remaining - toSafeNumber(sessionCount, 0))}
              </p>
              <p>타깃 +{toSafeNumber(sessionCount, 0)}</p>
            </div>
            <p className="session-succession-wizard__banner" role="note">
              {`${SESSION_SUCCESSION_UI.OCCUPYING_BANNER_PREFIX} ${occupying}${SESSION_SUCCESSION_UI.OCCUPYING_BANNER_SUFFIX}`}
            </p>
          </section>
        )}

        {step === SESSION_SUCCESSION_STEPS.CONFIRM && !previewError && (
          <section className="session-succession-wizard__section">
            <ul className="session-succession-wizard__confirm-list">
              <li>
                <span>수혜자</span>
                <strong>{selectedBeneficiaryLabel}</strong>
              </li>
              <li>
                <span>타깃 상담사</span>
                <strong>{selectedConsultantLabel}</strong>
              </li>
              <li>
                <span>이전 횟수</span>
                <strong>{toSafeNumber(sessionCount, 0)}회</strong>
              </li>
              <li>
                <span>승계가능</span>
                <strong>{transferable}회</strong>
              </li>
              <li>
                <span>점유 제외</span>
                <strong>{occupying}건</strong>
              </li>
            </ul>
            <p className="session-succession-wizard__banner" role="note">
              {`${SESSION_SUCCESSION_UI.OCCUPYING_BANNER_PREFIX} ${occupying}${SESSION_SUCCESSION_UI.OCCUPYING_BANNER_SUFFIX}`}
            </p>
            <p className="session-succession-wizard__payment-notice" role="note">
              {SESSION_SUCCESSION_UI.PAYMENT_NOTICE}
            </p>
            <label className="session-succession-wizard__field-label" htmlFor="session-succession-reason">
              {SESSION_SUCCESSION_UI.REASON_PLACEHOLDER}
            </label>
            <textarea
              id="session-succession-reason"
              className="mg-v2-input session-succession-wizard__reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </section>
        )}

        {step === SESSION_SUCCESSION_STEPS.DONE && result && (
          <section className="session-succession-wizard__section" aria-live="polite">
            <p>
              이전 {toSafeNumber(result.transferredCount, 0)}회 완료.
            </p>
            <p>
              소스 남은 회기:{' '}
              {toSafeNumber(result.sourceMapping?.remainingSessions, 0)}
            </p>
            <p>
              타깃 남은 회기:{' '}
              {toSafeNumber(result.targetMapping?.remainingSessions, 0)}
            </p>
          </section>
        )}

        {inlineError && (
          <p className="session-succession-wizard__inline-error" role="alert">
            {toDisplayString(inlineError, SESSION_SUCCESSION_UI.EXECUTE_FAILED)}
          </p>
        )}
      </div>
    </UnifiedModal>
  );
};

SessionSuccessionWizardModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  mapping: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    clientId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    consultantId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    clientName: PropTypes.string,
    consultantName: PropTypes.string,
    packageName: PropTypes.string,
    remainingSessions: PropTypes.number,
    usedSessions: PropTypes.number,
    totalSessions: PropTypes.number,
    client: PropTypes.object,
    consultant: PropTypes.object
  }),
  onSucceeded: PropTypes.func
};

SessionSuccessionWizardModal.defaultProps = {
  mapping: null,
  onSucceeded: undefined
};

export default SessionSuccessionWizardModal;
