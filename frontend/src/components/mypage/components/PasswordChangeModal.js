import React, { useState, useEffect, useCallback } from 'react';
import { API_BASE_URL } from '../../../constants/api';
import './PasswordChangeModal.css';
import notificationManager from '../../../utils/notification';

/**
 * 비밀번호 변경 모달 컴포넌트
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-17
 */
const PasswordChangeModal = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    currentPassword: '',
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

  // 폼 초기화
  const resetForm = () => {
    setFormData({
      currentPassword: '',
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
  };

  // 필드별 유효성 검사 (상태 변경 없이 결과만 반환)
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
        } else if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value)) {
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

  // 모달이 열릴 때 폼 초기화
  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen]);

  // formData 변경 시 실시간 유효성 검사
  useEffect(() => {
    if (!isOpen) return;
    
    const currentResult = validateField('currentPassword', formData.currentPassword, formData.currentPassword, formData.newPassword);
    const newResult = validateField('newPassword', formData.newPassword, formData.currentPassword, formData.newPassword);
    const confirmResult = validateField('confirmPassword', formData.confirmPassword, formData.currentPassword, formData.newPassword);
    
    setValidation({
      currentPassword: currentResult,
      newPassword: newResult,
      confirmPassword: confirmResult
    });
  }, [formData.currentPassword, formData.newPassword, formData.confirmPassword, isOpen, validateField]);

  // 입력값 변경 처리 (유효성 검사 제거)
  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  }, []);

  // 전체 폼 유효성 검사
  const validateForm = useCallback(() => {
    return validation.currentPassword.isValid && 
           validation.newPassword.isValid && 
           validation.confirmPassword.isValid;
  }, [validation.currentPassword.isValid, validation.newPassword.isValid, validation.confirmPassword.isValid]);

  // 비밀번호 변경 요청
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/password/change`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(formData)
      });

      const result = await response.json();
      
      if (result.success) {
        notificationManager.show('비밀번호가 성공적으로 변경되었습니다.', 'info');
        onSuccess && onSuccess();
        onClose();
      } else {
        notificationManager.show(result.message || '비밀번호 변경에 실패했습니다.', 'error');
      }
    } catch (error) {
      console.error('비밀번호 변경 오류:', error);
      notificationManager.show('비밀번호 변경 중 오류가 발생했습니다.', 'info');
    } finally {
      setIsLoading(false);
    }
  };

  // 비밀번호 표시/숨김 토글
  const togglePasswordVisibility = (field) => {
    setShowPassword(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="password-change-modal-overlay">
      <div className="password-change-modal">
        <div className="password-change-modal-header">
          <h3>
            <i className="bi bi-shield-lock"></i>
            비밀번호 변경
          </h3>
          <button 
            className="close-btn" 
            onClick={onClose}
            disabled={isLoading}
          >
            <i className="bi bi-x"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="password-change-form">
          <div className="form-group">
            <label htmlFor="currentPassword">
              <i className="bi bi-key"></i>
              현재 비밀번호
            </label>
            <div className="password-input-group">
              <input
                type={showPassword.current ? 'text' : 'password'}
                id="currentPassword"
                name="currentPassword"
                value={formData.currentPassword}
                onChange={handleInputChange}
                className={`form-control ${!validation.currentPassword.isValid ? 'is-invalid' : ''}`}
                placeholder="현재 비밀번호를 입력하세요"
                disabled={isLoading}
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => togglePasswordVisibility('current')}
                disabled={isLoading}
              >
                <i className={`bi bi-${showPassword.current ? 'eye-slash' : 'eye'}`}></i>
              </button>
            </div>
            {!validation.currentPassword.isValid && (
              <div className="invalid-feedback">
                {validation.currentPassword.message}
              </div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="newPassword">
              <i className="bi bi-key-fill"></i>
              새 비밀번호
            </label>
            <div className="password-input-group">
              <input
                type={showPassword.new ? 'text' : 'password'}
                id="newPassword"
                name="newPassword"
                value={formData.newPassword}
                onChange={handleInputChange}
                className={`form-control ${!validation.newPassword.isValid ? 'is-invalid' : ''}`}
                placeholder="새 비밀번호를 입력하세요"
                disabled={isLoading}
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => togglePasswordVisibility('new')}
                disabled={isLoading}
              >
                <i className={`bi bi-${showPassword.new ? 'eye-slash' : 'eye'}`}></i>
              </button>
            </div>
            {!validation.newPassword.isValid && (
              <div className="invalid-feedback">
                {validation.newPassword.message}
              </div>
            )}
            <div className="password-requirements">
              <small className="text-muted">
                <strong>비밀번호 요구사항:</strong>
                <ul>
                  <li>8자 이상 128자 이하</li>
                  <li>대문자, 소문자, 숫자, 특수문자 각각 1개 이상 포함</li>
                  <li>연속된 3개 이상의 문자 사용 금지</li>
                  <li>동일한 문자가 3개 이상 연속으로 사용 금지</li>
                </ul>
              </small>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">
              <i className="bi bi-check-circle"></i>
              비밀번호 확인
            </label>
            <div className="password-input-group">
              <input
                type={showPassword.confirm ? 'text' : 'password'}
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className={`form-control ${!validation.confirmPassword.isValid ? 'is-invalid' : ''}`}
                placeholder="새 비밀번호를 다시 입력하세요"
                disabled={isLoading}
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => togglePasswordVisibility('confirm')}
                disabled={isLoading}
              >
                <i className={`bi bi-${showPassword.confirm ? 'eye-slash' : 'eye'}`}></i>
              </button>
            </div>
            {!validation.confirmPassword.isValid && (
              <div className="invalid-feedback">
                {validation.confirmPassword.message}
              </div>
            )}
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={isLoading}
            >
              취소
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isLoading || !validateForm()}
            >
              {isLoading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  변경 중...
                </>
              ) : (
                <>
                  <i className="bi bi-check-circle me-2"></i>
                  비밀번호 변경
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PasswordChangeModal;
