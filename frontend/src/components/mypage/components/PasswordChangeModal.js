import React, { useState, useEffect, useCallback } from 'react';
import { AUTH_API } from '../../../constants/api';
import { getPasswordPolicyApiErrorMessage } from '../../../utils/loginPasswordPolicy';
import usePasswordPolicyField from '../../../hooks/usePasswordPolicyField';
import PasswordPolicyInput, { PasswordPolicyError } from '../../common/PasswordPolicyInput';
import StandardizedApi from '../../../utils/standardizedApi';
import UnifiedModal from '../../common/modals/UnifiedModal';
import MGButton from '../../common/MGButton';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../../erp/common/erpMgButtonProps';
import SafeText from '../../common/SafeText';
import notificationManager from '../../../utils/notification';
import { useTranslation } from 'react-i18next';

const PasswordChangeModal = ({ isOpen, onClose, onSuccess, tempPassword }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    currentPassword: tempPassword || '',
    newPassword: '',
    confirmPassword: ''
  });

  const [validation, setValidation] = useState({
    currentPassword: { isValid: true, message: '' },
    newPassword: { isValid: true, message: '' }
  });
  const passwordField = usePasswordPolicyField({ requireConfirm: true });
  const { validate: validateNewPassword, clearError: clearPasswordError } = passwordField;
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false
  });

  const validateField = useCallback((fieldName, value, currentPassword = '') => {
    let isValid = true;
    let message = '';

    switch (fieldName) {
      case 'currentPassword':
        if (!value.trim()) {
          isValid = false;
          message = t('common:mypage.PasswordChangeModal.t_4ed21ecf');
        }
        break;
      case 'newPassword':
        if (value.trim() && value === currentPassword) {
          isValid = false;
          message = t('common:mypage.PasswordChangeModal.t_89a14bed');
        }
        break;
      default:
        break;
    }

    return { isValid, message };
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    setFormData({
      currentPassword: tempPassword || '',
      newPassword: '',
      confirmPassword: ''
    });
    setValidation({
      currentPassword: { isValid: true, message: '' },
      newPassword: { isValid: true, message: '' }
    });
    clearPasswordError();
    setShowPassword({
      current: false,
      new: false,
      confirm: false
    });
    setSubmitError('');
  }, [isOpen, tempPassword, clearPasswordError]);

  useEffect(() => {
    if (!isOpen) return;
    const currentResult = validateField('currentPassword', formData.currentPassword, formData.currentPassword);
    const newResult = validateField('newPassword', formData.newPassword, formData.currentPassword);
    validateNewPassword(formData.newPassword, formData.confirmPassword);
    setValidation({
      currentPassword: currentResult,
      newPassword: newResult
    });
  }, [
    formData.currentPassword,
    formData.newPassword,
    formData.confirmPassword,
    isOpen,
    validateField,
    validateNewPassword
  ]);

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  }, []);

  const validateForm = useCallback(() => {
    return (
      validation.currentPassword.isValid &&
      validation.newPassword.isValid &&
      !passwordField.errorCode &&
      !passwordField.confirmErrorCode
    );
  }, [
    validation.currentPassword.isValid,
    validation.newPassword.isValid,
    passwordField.errorCode,
    passwordField.confirmErrorCode
  ]);

  const handleSubmit = async(e) => {
    e.preventDefault();
    const policyOk = validateNewPassword(formData.newPassword, formData.confirmPassword);
    if (!policyOk || !validateForm()) return;

    setIsLoading(true);
    setSubmitError('');
    try {
      const result = await StandardizedApi.post(AUTH_API.PASSWORD_CHANGE, {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
        confirmPassword: formData.confirmPassword
      });
      if (result && result.success) {
        notificationManager.show(t('common:mypage.PasswordChangeModal.t_3c574e69'), 'info');
        onSuccess?.();
        onClose();
      } else {
        const msg = (result && result.message) || t('common:mypage.PasswordChangeModal.t_c88dfb0d');
        setSubmitError(msg);
        notificationManager.show(msg, 'error');
      }
    } catch (error) {
      console.error('비밀번호 변경 오류:', error);
      const msg = getPasswordPolicyApiErrorMessage(error);
      setSubmitError(msg);
      notificationManager.show(msg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPassword((prev) => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  if (!isOpen) return null;

  return (
    <UnifiedModal
      isOpen={isOpen}
      onClose={onClose}
      title={tempPassword ? '임시 비밀번호 변경' : t('common:mypage.PasswordChangeModal.t_4c7b9670')}
      size="medium"
      backdropClick={!tempPassword}
      showCloseButton={!tempPassword}
      loading={isLoading}
    >
      <form onSubmit={handleSubmit} className="mg-mypage-password-form">
        {tempPassword ? (
          <div className="mg-mypage-alert--warning" role="alert">
            <strong>임시 비밀번호로 로그인하셨습니다.</strong>
            <p className="mg-mypage__section-description">보안을 위해 비밀번호를 변경해주세요.</p>
          </div>
        ) : null}

        <div className="mg-mypage-password-form__group">
          <label className="mg-mypage-password-form__label" htmlFor="mypage-pw-current">
            현재 비밀번호
          </label>
          <div className="mg-mypage-password-form__input-wrap">
            <input
              type={showPassword.current ? 'text' : 'password'}
              id="mypage-pw-current"
              name="currentPassword"
              className="mg-mypage-password-form__input"
              value={formData.currentPassword}
              onChange={handleInputChange}
              placeholder="현재 비밀번호"
              disabled={isLoading || !!tempPassword}
              readOnly={!!tempPassword}
              autoComplete="current-password"
            />
            <MGButton
              type="button"
              variant="outline"
              size="small"
              className={buildErpMgButtonClassName({
                variant: 'outline',
                size: 'sm',
                loading: false,
                className: 'mg-mypage-password-form__toggle'
              })}
              loadingText={ERP_MG_BUTTON_LOADING_TEXT}
              onClick={() => togglePasswordVisibility('current')}
              disabled={isLoading || !!tempPassword}
              aria-label="비밀번호 표시 전환"
              preventDoubleClick={false}
            >
              {showPassword.current ? '숨김' : t('common:mypage.PasswordChangeModal.t_a61d568e')}
            </MGButton>
          </div>
          {!validation.currentPassword.isValid ? (
            <p className="mg-mypage-password-form__error">
              <SafeText>{validation.currentPassword.message}</SafeText>
            </p>
          ) : null}
        </div>

        <div className="mg-mypage-password-form__group">
          <label className="mg-mypage-password-form__label" htmlFor="mypage-pw-new">
            새 비밀번호
          </label>
          <div className="mg-mypage-password-form__input-wrap">
            <PasswordPolicyInput
              field={passwordField}
              revealed={showPassword.new}
              showHint={false}
              showError={false}
              id="mypage-pw-new"
              name="newPassword"
              className="mg-mypage-password-form__input"
              errorInputClassName=""
              value={formData.newPassword}
              onChange={handleInputChange}
              placeholder="새 비밀번호"
              disabled={isLoading}
            />
            <MGButton
              type="button"
              variant="outline"
              size="small"
              className={buildErpMgButtonClassName({
                variant: 'outline',
                size: 'sm',
                loading: false,
                className: 'mg-mypage-password-form__toggle'
              })}
              loadingText={ERP_MG_BUTTON_LOADING_TEXT}
              onClick={() => togglePasswordVisibility('new')}
              disabled={isLoading}
              aria-label="비밀번호 표시 전환"
              preventDoubleClick={false}
            >
              {showPassword.new ? '숨김' : t('common:mypage.PasswordChangeModal.t_a61d568e')}
            </MGButton>
          </div>
          <PasswordPolicyError field={passwordField} id="mypage-pw-new" className="mg-mypage-password-form__error" />
          {!passwordField.errorMessage && !validation.newPassword.isValid ? (
            <p className="mg-mypage-password-form__error">
              <SafeText>{validation.newPassword.message}</SafeText>
            </p>
          ) : null}
          <p className="mg-mypage-password-form__hint">
            {`${passwordField.hint} ${t('common:mypage.PasswordChangeModal.mustDifferFromCurrent')}`}
          </p>
        </div>

        <div className="mg-mypage-password-form__group">
          <label className="mg-mypage-password-form__label" htmlFor="mypage-pw-confirm">
            새 비밀번호 확인
          </label>
          <div className="mg-mypage-password-form__input-wrap">
            <PasswordPolicyInput
              field={passwordField}
              confirm
              revealed={showPassword.confirm}
              showError={false}
              id="mypage-pw-confirm"
              name="confirmPassword"
              className="mg-mypage-password-form__input"
              errorInputClassName=""
              value={formData.confirmPassword}
              onChange={handleInputChange}
              placeholder="새 비밀번호 확인"
              disabled={isLoading}
            />
            <MGButton
              type="button"
              variant="outline"
              size="small"
              className={buildErpMgButtonClassName({
                variant: 'outline',
                size: 'sm',
                loading: false,
                className: 'mg-mypage-password-form__toggle'
              })}
              loadingText={ERP_MG_BUTTON_LOADING_TEXT}
              onClick={() => togglePasswordVisibility('confirm')}
              disabled={isLoading}
              aria-label="비밀번호 표시 전환"
              preventDoubleClick={false}
            >
              {showPassword.confirm ? '숨김' : t('common:mypage.PasswordChangeModal.t_a61d568e')}
            </MGButton>
          </div>
          <PasswordPolicyError
            field={passwordField}
            confirm
            id="mypage-pw-confirm"
            className="mg-mypage-password-form__error"
          />
        </div>

        {submitError ? (
          <p className="mg-mypage-password-form__error" role="alert">
            <SafeText>{submitError}</SafeText>
          </p>
        ) : null}

        <div className="mg-mypage-password-form__actions">
          <MGButton
            type="button"
            variant="ghost"
            className={buildErpMgButtonClassName({ variant: 'ghost', size: 'md', loading: isLoading })}
            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
            onClick={onClose}
            disabled={isLoading}
          >
            {t('common.actions.cancel')}
          </MGButton>
          <MGButton
            type="submit"
            variant="primary"
            className={buildErpMgButtonClassName({ variant: 'primary', size: 'md', loading: isLoading })}
            loading={isLoading}
            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
            disabled={isLoading || !validateForm()}
          >
            비밀번호 변경
          </MGButton>
        </div>
      </form>
    </UnifiedModal>
  );
};

export default PasswordChangeModal;
