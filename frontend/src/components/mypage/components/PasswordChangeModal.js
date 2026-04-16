import React, { useState, useEffect, useCallback } from 'react';
import { AUTH_API } from '../../../constants/api';
import StandardizedApi from '../../../utils/standardizedApi';
import UnifiedModal from '../../common/modals/UnifiedModal';
import MGButton from '../../common/MGButton';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../../erp/common/erpMgButtonProps';
import SafeText from '../../common/SafeText';
import notificationManager from '../../../utils/notification';

const PasswordChangeModal = ({ isOpen, onClose, onSuccess, tempPassword }) => {
  const [formData, setFormData] = useState({
    currentPassword: tempPassword || '',
    newPassword: '',
    confirmPassword: ''
  });

  const [validation, setValidation] = useState({
    currentPassword: { isValid: true, message: '' },
    newPassword: { isValid: true, message: '' },
    confirmPassword: { isValid: true, message: '' }
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false
  });

  const validateField = useCallback((fieldName, value, currentPassword = '', newPassword = '') => {
    let isValid = true;
    let message = '';

    switch (fieldName) {
      case 'currentPassword':
        if (!value.trim()) {
          isValid = false;
          message = '현재 비밀번호를 입력해주세요.';
        }
        break;
      case 'newPassword':
        if (!value.trim()) {
          isValid = false;
          message = '새 비밀번호를 입력해주세요.';
        } else if (value.length < 8) {
          isValid = false;
          message = '비밀번호는 최소 8자 이상이어야 합니다.';
        } else if (value.length > 128) {
          isValid = false;
          message = '비밀번호는 최대 128자 이하여야 합니다.';
        } else if (!/[A-Z]/.test(value)) {
          isValid = false;
          message = '비밀번호는 최소 1개의 대문자를 포함해야 합니다.';
        } else if (!/[a-z]/.test(value)) {
          isValid = false;
          message = '비밀번호는 최소 1개의 소문자를 포함해야 합니다.';
        } else if (!/[0-9]/.test(value)) {
          isValid = false;
          message = '비밀번호는 최소 1개의 숫자를 포함해야 합니다.';
        } else if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(value)) {
          isValid = false;
          message = '비밀번호는 최소 1개의 특수문자를 포함해야 합니다.';
        } else if (value === currentPassword) {
          isValid = false;
          message = '새 비밀번호는 현재 비밀번호와 달라야 합니다.';
        }
        break;
      case 'confirmPassword':
        if (!value.trim()) {
          isValid = false;
          message = '비밀번호 확인을 입력해주세요.';
        } else if (value !== newPassword) {
          isValid = false;
          message = '비밀번호 확인이 일치하지 않습니다.';
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
      newPassword: { isValid: true, message: '' },
      confirmPassword: { isValid: true, message: '' }
    });
    setShowPassword({
      current: false,
      new: false,
      confirm: false
    });
  }, [isOpen, tempPassword]);

  useEffect(() => {
    if (!isOpen) return;
    const currentResult = validateField('currentPassword', formData.currentPassword, formData.currentPassword, formData.newPassword);
    const newResult = validateField('newPassword', formData.newPassword, formData.currentPassword, formData.newPassword);
    const confirmResult = validateField(
      'confirmPassword',
      formData.confirmPassword,
      formData.currentPassword,
      formData.newPassword
    );
    setValidation({
      currentPassword: currentResult,
      newPassword: newResult,
      confirmPassword: confirmResult
    });
  }, [formData.currentPassword, formData.newPassword, formData.confirmPassword, isOpen, validateField]);

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
      validation.confirmPassword.isValid
    );
  }, [
    validation.currentPassword.isValid,
    validation.newPassword.isValid,
    validation.confirmPassword.isValid
  ]);

  const handleSubmit = async(e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const result = await StandardizedApi.post(AUTH_API.PASSWORD_CHANGE, {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
        confirmPassword: formData.confirmPassword
      });
      if (result && result.success) {
        notificationManager.show('비밀번호가 변경되었습니다.', 'info');
        onSuccess?.();
        onClose();
      } else {
        notificationManager.show(
          (result && result.message) || '비밀번호 변경에 실패했습니다.',
          'error'
        );
      }
    } catch (error) {
      console.error('비밀번호 변경 오류:', error);
      notificationManager.show('비밀번호 변경 중 오류가 발생했습니다.', 'error');
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
      title={tempPassword ? '임시 비밀번호 변경' : '비밀번호 변경'}
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
              {showPassword.current ? '숨김' : '표시'}
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
            <input
              type={showPassword.new ? 'text' : 'password'}
              id="mypage-pw-new"
              name="newPassword"
              className="mg-mypage-password-form__input"
              value={formData.newPassword}
              onChange={handleInputChange}
              placeholder="새 비밀번호"
              disabled={isLoading}
              autoComplete="new-password"
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
              {showPassword.new ? '숨김' : '표시'}
            </MGButton>
          </div>
          {!validation.newPassword.isValid ? (
            <p className="mg-mypage-password-form__error">
              <SafeText>{validation.newPassword.message}</SafeText>
            </p>
          ) : null}
          <p className="mg-mypage-password-form__hint">
            8자 이상, 대·소문자·숫자·특수문자 포함, 현재 비밀번호와 달라야 합니다.
          </p>
        </div>

        <div className="mg-mypage-password-form__group">
          <label className="mg-mypage-password-form__label" htmlFor="mypage-pw-confirm">
            새 비밀번호 확인
          </label>
          <div className="mg-mypage-password-form__input-wrap">
            <input
              type={showPassword.confirm ? 'text' : 'password'}
              id="mypage-pw-confirm"
              name="confirmPassword"
              className="mg-mypage-password-form__input"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              placeholder="새 비밀번호 확인"
              disabled={isLoading}
              autoComplete="new-password"
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
              {showPassword.confirm ? '숨김' : '표시'}
            </MGButton>
          </div>
          {!validation.confirmPassword.isValid ? (
            <p className="mg-mypage-password-form__error">
              <SafeText>{validation.confirmPassword.message}</SafeText>
            </p>
          ) : null}
        </div>

        <div className="mg-mypage-password-form__actions">
          <MGButton
            type="button"
            variant="outline"
            className={buildErpMgButtonClassName({ variant: 'outline', size: 'md', loading: isLoading })}
            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
            onClick={onClose}
            disabled={isLoading}
          >
            취소
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
