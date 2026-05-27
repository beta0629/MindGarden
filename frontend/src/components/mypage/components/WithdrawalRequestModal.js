/**
 * 자발 회원 탈퇴 신청 모달.
 *
 * USER_LIFECYCLE_TERMINATION_POLICY v1.1 §0.1
 *  - Q3 30일 유예
 *  - Q12-b 본인 옵션 "커뮤니티 본문도 삭제"
 *  - W3 email tombstone 의무화 → 동일 이메일 재가입 불가 안내
 *
 * SSOT 컴포넌트만 사용: UnifiedModal + MGButton (커스텀 모달 금지).
 *
 * @author CoreSolution
 * @since 2026-06-06
 */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import UnifiedModal from '../../common/modals/UnifiedModal';
import MGButton from '../../common/MGButton';
import SafeText from '../../common/SafeText';
import {
  buildErpMgButtonClassName,
  ERP_MG_BUTTON_LOADING_TEXT
} from '../../erp/common/erpMgButtonProps';
import mypageApi from '../../../utils/mypageApi';
import notificationManager from '../../../utils/notification';

const REASON_CODES = ['LOW_USAGE', 'NO_MATCH', 'ERROR', 'PRIVACY', 'OTHER'];

const buildInitialState = () => ({
  password: '',
  reasonCode: '',
  otherReason: '',
  deleteCommunityBody: false,
  agreed: false
});

const WithdrawalRequestModal = ({ isOpen, onClose, onSuccess }) => {
  const { t } = useTranslation('mypage');
  const [formState, setFormState] = useState(buildInitialState);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setFormState(buildInitialState());
      setSubmitError('');
      setSubmitting(false);
    }
  }, [isOpen]);

  const resolvedReason = useMemo(() => {
    if (formState.reasonCode === 'OTHER') {
      return formState.otherReason.trim();
    }
    if (!formState.reasonCode) {
      return '';
    }
    return t(`withdrawal.modal.reason.${formState.reasonCode}`);
  }, [formState.reasonCode, formState.otherReason, t]);

  const canSubmit =
    !submitting &&
    formState.password.trim().length > 0 &&
    formState.reasonCode.length > 0 &&
    (formState.reasonCode !== 'OTHER' || formState.otherReason.trim().length > 0) &&
    formState.agreed;

  const handlePasswordChange = useCallback((e) => {
    setFormState((prev) => ({ ...prev, password: e.target.value }));
  }, []);

  const handleReasonChange = useCallback((e) => {
    const next = e.target.value;
    setFormState((prev) => ({
      ...prev,
      reasonCode: next,
      otherReason: next === 'OTHER' ? prev.otherReason : ''
    }));
  }, []);

  const handleOtherReasonChange = useCallback((e) => {
    setFormState((prev) => ({ ...prev, otherReason: e.target.value }));
  }, []);

  const handleDeleteBodyToggle = useCallback((e) => {
    setFormState((prev) => ({ ...prev, deleteCommunityBody: e.target.checked }));
  }, []);

  const handleAgreeToggle = useCallback((e) => {
    setFormState((prev) => ({ ...prev, agreed: e.target.checked }));
  }, []);

  const handleSubmit = useCallback(
    async (e) => {
      if (e && e.preventDefault) {
        e.preventDefault();
      }
      if (!canSubmit) {
        if (!formState.password.trim()) {
          setSubmitError(t('withdrawal.modal.passwordRequired'));
          return;
        }
        if (!formState.reasonCode) {
          setSubmitError(t('withdrawal.modal.reasonRequired'));
          return;
        }
        if (!formState.agreed) {
          setSubmitError(t('withdrawal.modal.agreementRequired'));
          return;
        }
        return;
      }
      setSubmitting(true);
      setSubmitError('');
      try {
        const response = await mypageApi.requestWithdrawal(
          formState.password,
          resolvedReason,
          formState.deleteCommunityBody
        );
        notificationManager.show(t('withdrawal.pending.submitSuccess'), 'success');
        if (onSuccess) {
          onSuccess(response);
        }
        onClose();
      } catch (error) {
        const message =
          (error && (error.message || error.error)) ||
          t('withdrawal.modal.submitFailure');
        setSubmitError(message);
        notificationManager.show(message, 'error');
      } finally {
        setSubmitting(false);
      }
    },
    [canSubmit, formState, resolvedReason, onClose, onSuccess, t]
  );

  if (!isOpen) {
    return null;
  }

  return (
    <UnifiedModal
      isOpen={isOpen}
      onClose={onClose}
      title={t('withdrawal.modal.title')}
      size="medium"
      loading={submitting}
      className="mg-v2-ad-b0kla"
    >
      <form
        className="mg-mypage-withdrawal-form"
        data-testid="mypage-withdrawal-request-form"
        onSubmit={handleSubmit}
      >
        <section
          className="mg-v2-ad-b0kla__card mg-mypage-withdrawal-form__alert"
          aria-labelledby="mypage-withdrawal-warning-title"
        >
          <h3
            id="mypage-withdrawal-warning-title"
            className="mg-mypage-withdrawal-form__alert-title"
          >
            {t('withdrawal.modal.warningTitle')}
          </h3>
          <ul className="mg-mypage-withdrawal-form__alert-list">
            <li>
              <SafeText>{t('withdrawal.modal.warningDesc')}</SafeText>
            </li>
            <li>
              <SafeText>{t('withdrawal.modal.emailTombstoneDesc')}</SafeText>
            </li>
          </ul>
        </section>

        <div className="mg-mypage-withdrawal-form__group">
          <label
            className="mg-mypage-withdrawal-form__label"
            htmlFor="mypage-withdrawal-password"
          >
            {t('withdrawal.modal.passwordLabel')}
          </label>
          <input
            id="mypage-withdrawal-password"
            type="password"
            autoComplete="current-password"
            className="mg-mypage-withdrawal-form__input"
            placeholder={t('withdrawal.modal.passwordPlaceholder')}
            value={formState.password}
            onChange={handlePasswordChange}
            disabled={submitting}
            data-testid="mypage-withdrawal-password-input"
          />
        </div>

        <fieldset
          className="mg-mypage-withdrawal-form__group"
          data-testid="mypage-withdrawal-reason-fieldset"
        >
          <legend className="mg-mypage-withdrawal-form__label">
            {t('withdrawal.modal.reasonLabel')}
          </legend>
          <div className="mg-mypage-withdrawal-form__radio-list">
            {REASON_CODES.map((code) => (
              <label key={code} className="mg-mypage-withdrawal-form__radio-item">
                <input
                  type="radio"
                  name="withdrawal-reason"
                  value={code}
                  checked={formState.reasonCode === code}
                  onChange={handleReasonChange}
                  disabled={submitting}
                  data-testid={`mypage-withdrawal-reason-${code}`}
                />
                <span>{t(`withdrawal.modal.reason.${code}`)}</span>
              </label>
            ))}
          </div>
          {formState.reasonCode === 'OTHER' ? (
            <textarea
              className="mg-mypage-withdrawal-form__textarea"
              placeholder={t('withdrawal.modal.otherReasonPlaceholder')}
              value={formState.otherReason}
              onChange={handleOtherReasonChange}
              rows={3}
              disabled={submitting}
              data-testid="mypage-withdrawal-other-reason"
            />
          ) : null}
        </fieldset>

        <fieldset className="mg-mypage-withdrawal-form__group">
          <legend className="mg-mypage-withdrawal-form__label">
            {t('withdrawal.modal.communityLabel')}
          </legend>
          <label className="mg-mypage-withdrawal-form__checkbox-item">
            <input
              type="checkbox"
              checked={formState.deleteCommunityBody}
              onChange={handleDeleteBodyToggle}
              disabled={submitting}
              data-testid="mypage-withdrawal-delete-community-body"
            />
            <span>{t('withdrawal.modal.communityCheckbox')}</span>
          </label>
          <p className="mg-mypage-withdrawal-form__hint">
            <SafeText>{t('withdrawal.modal.communityHint')}</SafeText>
          </p>
        </fieldset>

        <label className="mg-mypage-withdrawal-form__checkbox-item mg-mypage-withdrawal-form__agreement">
          <input
            type="checkbox"
            checked={formState.agreed}
            onChange={handleAgreeToggle}
            disabled={submitting}
            data-testid="mypage-withdrawal-agreement"
          />
          <span>{t('withdrawal.modal.agreementCheckbox')}</span>
        </label>

        {submitError ? (
          <p
            className="mg-mypage-withdrawal-form__error"
            role="alert"
            data-testid="mypage-withdrawal-error"
          >
            <SafeText>{submitError}</SafeText>
          </p>
        ) : null}

        <div className="mg-mypage-withdrawal-form__actions">
          <MGButton
            type="button"
            variant="outline"
            className={buildErpMgButtonClassName({
              variant: 'outline',
              size: 'md',
              loading: submitting
            })}
            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
            onClick={onClose}
            disabled={submitting}
          >
            {t('withdrawal.modal.cancelButton')}
          </MGButton>
          <MGButton
            type="submit"
            variant="danger"
            className={buildErpMgButtonClassName({
              variant: 'danger',
              size: 'md',
              loading: submitting
            })}
            loading={submitting}
            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
            disabled={!canSubmit}
            data-testid="mypage-withdrawal-submit"
          >
            {t('withdrawal.modal.submitButton')}
          </MGButton>
        </div>
      </form>
    </UnifiedModal>
  );
};

export default WithdrawalRequestModal;
