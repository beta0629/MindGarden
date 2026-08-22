/**
 * 회기 승계 마법사 — UnifiedModal 3스텝 (+완료). DESIGN_SPEC_SESSION_SUCCESSION v2.
 *
 * @author CoreSolution
 * @since 2026-08-22
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import UnifiedModal from '../../common/modals/UnifiedModal';
import MGButton from '../../common/MGButton';
import ErrorBoundary from '../../common/ErrorBoundary';
import SafeErrorDisplay from '../../common/SafeErrorDisplay';
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
import SuccessionSourceSummary from './session-succession/SuccessionSourceSummary';
import BeneficiaryPickerStep from './session-succession/BeneficiaryPickerStep';
import SuccessionCountStep from './session-succession/SuccessionCountStep';
import SuccessionConfirmStep from './session-succession/SuccessionConfirmStep';
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

  const sameClientInline =
    beneficiaryMode === SESSION_SUCCESSION_BENEFICIARY_MODE.EXISTING
    && beneficiaryClientId
    && String(beneficiaryClientId) === String(sourceClientId)
      ? SESSION_SUCCESSION_UI.SAME_CLIENT_ERROR
      : '';

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

  const showSourceSummary =
    step !== SESSION_SUCCESSION_STEPS.DONE
    && (previewLoading || !previewError);

  return (
    <UnifiedModal
      isOpen={isOpen}
      onClose={handleClose}
      title={SESSION_SUCCESSION_UI.MODAL_TITLE}
      subtitle={subtitle}
      size="large"
      className="mg-v2-ad-b0kla mg-v2-ad-b0kla__modal session-succession-wizard"
      loading={false}
      actions={footerActions}
      backdropClick={!submitting}
    >
      <ErrorBoundary>
        <div className="session-succession-wizard__body">
          {step !== SESSION_SUCCESSION_STEPS.DONE && (
            <nav className="session-succession-wizard__steps" aria-label="회기 승계 단계">
              <span
                className={
                  step === SESSION_SUCCESSION_STEPS.BENEFICIARY
                    ? 'session-succession-wizard__step is-active'
                    : 'session-succession-wizard__step'
                }
              >
                <span className="session-succession-wizard__step-full">
                  1.
                  {' '}
                  {SESSION_SUCCESSION_UI.STEP_BENEFICIARY}
                </span>
                <span className="session-succession-wizard__step-short">
                  1/3 수혜자
                </span>
              </span>
              <span
                className={
                  step === SESSION_SUCCESSION_STEPS.COUNT
                    ? 'session-succession-wizard__step is-active'
                    : 'session-succession-wizard__step'
                }
              >
                <span className="session-succession-wizard__step-full">
                  2.
                  {' '}
                  {SESSION_SUCCESSION_UI.STEP_CONSULTANT_SESSIONS}
                </span>
                <span className="session-succession-wizard__step-short">
                  2/3 회기
                </span>
              </span>
              <span
                className={
                  step === SESSION_SUCCESSION_STEPS.CONFIRM
                    ? 'session-succession-wizard__step is-active'
                    : 'session-succession-wizard__step'
                }
              >
                <span className="session-succession-wizard__step-full">
                  3.
                  {' '}
                  {SESSION_SUCCESSION_UI.STEP_CONFIRM}
                </span>
                <span className="session-succession-wizard__step-short">
                  3/3 확인
                </span>
              </span>
            </nav>
          )}

          {previewError && (
            <div className="session-succession-wizard__error" role="alert">
              <SafeErrorDisplay
                error={previewError}
                variant="inline"
                fallback={SESSION_SUCCESSION_UI.PREVIEW_FAILED}
              />
              <MGButton
                type="button"
                variant="outline"
                size="small"
                className={buildErpMgButtonClassName({ variant: 'outline', size: 'sm', loading: false })}
                loading={false}
                loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                onClick={loadPreview}
                preventDoubleClick={false}
              >
                {SESSION_SUCCESSION_UI.RETRY_LABEL}
              </MGButton>
            </div>
          )}

          {showSourceSummary && step === SESSION_SUCCESSION_STEPS.BENEFICIARY && (
            <div className="session-succession-wizard__layout">
              <SuccessionSourceSummary
                packageName={preview?.packageName ?? mapping?.packageName}
                usedSessions={toSafeNumber(preview?.usedSessions ?? mapping?.usedSessions, 0)}
                remainingSessions={remaining}
                totalSessions={toSafeNumber(preview?.totalSessions ?? mapping?.totalSessions, 0)}
                transferableSessions={transferable}
                occupyingScheduleCount={occupying}
                loading={previewLoading && !preview}
                showZeroBanner={transferable < 1 && !previewLoading && !previewError}
              />
              {!previewError && !(previewLoading && !preview) && (
                <div className="session-succession-wizard__main">
                  <BeneficiaryPickerStep
                    beneficiaryMode={beneficiaryMode}
                    onModeChange={setBeneficiaryMode}
                    clientOptions={clientOptions}
                    beneficiaryClientId={beneficiaryClientId}
                    onBeneficiaryClientIdChange={setBeneficiaryClientId}
                    listsLoading={listsLoading}
                    newClientName={newClientName}
                    newClientPhone={newClientPhone}
                    newClientEmail={newClientEmail}
                    onNewClientNameChange={setNewClientName}
                    onNewClientPhoneChange={setNewClientPhone}
                    onNewClientEmailChange={setNewClientEmail}
                    sameClientError={sameClientInline}
                  />
                </div>
              )}
            </div>
          )}

          {step === SESSION_SUCCESSION_STEPS.COUNT && !previewError && (
            <SuccessionCountStep
              consultantOptions={consultantOptions}
              targetConsultantId={targetConsultantId}
              onTargetConsultantIdChange={setTargetConsultantId}
              listsLoading={listsLoading}
              sessionCount={sessionCount}
              transferable={transferable}
              remaining={remaining}
              occupying={occupying}
              onSessionCountChange={handleSessionCountChange}
              onApplyFullAmount={() => setSessionCount(transferable)}
            />
          )}

          {step === SESSION_SUCCESSION_STEPS.CONFIRM && !previewError && (
            <SuccessionConfirmStep
              beneficiaryLabel={selectedBeneficiaryLabel}
              consultantLabel={selectedConsultantLabel}
              sessionCount={sessionCount}
              reason={reason}
              onReasonChange={setReason}
            />
          )}

          {step === SESSION_SUCCESSION_STEPS.DONE && result && (
            <section
              className="session-succession-wizard__section session-succession-wizard__section--panel"
              aria-live="polite"
            >
              <p>
                이전
                {' '}
                {toSafeNumber(result.transferredCount, 0)}
                회 완료.
              </p>
              <p>
                소스 남은 회기:
                {' '}
                {toSafeNumber(result.sourceMapping?.remainingSessions, 0)}
              </p>
              <p>
                타깃 남은 회기:
                {' '}
                {toSafeNumber(result.targetMapping?.remainingSessions, 0)}
              </p>
            </section>
          )}

          {inlineError && (
            <SafeErrorDisplay
              error={inlineError}
              variant="inline"
              className="session-succession-wizard__inline-error"
              fallback={SESSION_SUCCESSION_UI.EXECUTE_FAILED}
            />
          )}
        </div>
      </ErrorBoundary>
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
