import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Info, Check } from 'lucide-react';
// import UnifiedLoading from '../../components/common/UnifiedLoading'; // 임시 비활성화
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { apiPost, apiGet } from '../../utils/ajax';
import notificationManager from '../../utils/notification';
import MGButton from '../common/MGButton';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../erp/common/erpMgButtonProps';
import usePasswordPolicyField from '../../hooks/usePasswordPolicyField';
import PasswordPolicyInput, { PasswordPolicyError, PasswordPolicyHint } from '../common/PasswordPolicyInput';
import { resolveUserFacingApiErrorMessage } from '../../utils/userFacingApiErrorMessage';
import './AuthPageCommon.css';

const AUTH_INPUT_CLASS = 'mg-v2-input';

// T5 표준화 2026-05-21: API 경로 리터럴 → 로컬 상수 (운영 게이트 P0)
const API_AUTH_PASSWORD_RESET_RESET = '/api/v1/auth/password-reset/reset';


const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [isPasswordReset, setIsPasswordReset] = useState(false);
  const passwordField = usePasswordPolicyField({ requireConfirm: true });

  // 토큰 검증
  useEffect(() => {
    const validateToken = async() => {
      if (!token) {
        notificationManager.error('유효하지 않은 접근입니다.');
        navigate('/login');
        return;
      }

      try {
        setIsValidating(true);
        const response = await apiGet(
          `/api/v1/auth/password-reset/validate-token?token=${encodeURIComponent(token)}`
        );
        
        if (!response.success || !response.valid) {
          notificationManager.error('토큰이 만료되었거나 유효하지 않습니다.');
          navigate('/forgot-password');
        }
      } catch (error) {
        console.error('토큰 검증 실패:', error);
        notificationManager.error('토큰 검증 중 오류가 발생했습니다.');
        navigate('/forgot-password');
      } finally {
        setIsValidating(false);
      }
    };

    validateToken();
  }, [token, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    passwordField.clearError();
  };

  const handleSubmit = async(e) => {
    e.preventDefault();
    
    const committed = passwordField.validateCommitted(formData.newPassword, formData.confirmPassword);
    if (!committed.valid) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await apiPost(API_AUTH_PASSWORD_RESET_RESET, {
        token: token,
        newPassword: committed.value,
        confirmPassword: committed.confirmValue
      });

      if (response.success) {
        setIsPasswordReset(true);
        notificationManager.success('비밀번호가 성공적으로 변경되었습니다.');
      } else {
        notificationManager.error(response.message || '비밀번호 재설정에 실패했습니다.');
      }
    } catch (error) {
      console.error('비밀번호 재설정 실패:', error);
      notificationManager.error(resolveUserFacingApiErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  // 토큰 검증 중 로딩 화면
  if (isValidating) {
    return (
      <div className="mg-v2-auth-container">
        <div className="mg-v2-auth-hero">
          <div className="mg-v2-auth-hero-content">
            <h1 className="mg-v2-auth-hero-logo">CoreSolution</h1>
            <p className="mg-v2-auth-hero-slogan">비즈니스의 핵심을 솔루션하다</p>
          </div>
        </div>
        <div className="mg-v2-auth-content">
          <div className="mg-v2-auth-form-wrapper mg-v2-auth-form-wrapper--centered">
            <span className="mg-v2-spinner mg-v2-spinner--large" />
            <p className="mg-v2-auth-subtitle mg-v2-auth-subtitle--validating">
              토큰을 검증하고 있습니다...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mg-v2-auth-container">
      <div className="mg-v2-auth-hero">
        <div className="mg-v2-auth-hero-content">
          <h1 className="mg-v2-auth-hero-logo">CoreSolution</h1>
          <p className="mg-v2-auth-hero-slogan">비즈니스의 핵심을 솔루션하다</p>
        </div>
      </div>
      
      <div className="mg-v2-auth-content">
        <div className="mg-v2-auth-form-wrapper">
          {!isPasswordReset ? (
            <>
              <div>
                <h2 className="mg-v2-auth-title">새 비밀번호 설정</h2>
                <p className="mg-v2-auth-subtitle">안전한 새 비밀번호를 설정해주세요</p>
              </div>

              <form onSubmit={handleSubmit} className="mg-v2-auth-form">
                <div className="mg-v2-form-group">
                  <label className="mg-v2-label" htmlFor="newPassword">새 비밀번호</label>
                  <div className="mg-v2-password-wrapper">
                    <PasswordPolicyInput
                      field={passwordField}
                      revealed={showPassword}
                      hintExternal
                      showError={false}
                      id="newPassword"
                      name="newPassword"
                      value={formData.newPassword}
                      onChange={handleInputChange}
                      className={AUTH_INPUT_CLASS}
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      className="mg-v2-password-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
                    >
                      {showPassword ? <EyeOff size={16} strokeWidth={1.75} aria-hidden="true" /> : <Eye size={16} strokeWidth={1.75} aria-hidden="true" />}
                    </button>
                  </div>
                  <PasswordPolicyError field={passwordField} id="newPassword" />
                </div>

                <div className="mg-v2-form-group">
                  <label className="mg-v2-label" htmlFor="confirmPassword">비밀번호 확인</label>
                  <div className="mg-v2-password-wrapper">
                    <PasswordPolicyInput
                      field={passwordField}
                      confirm
                      revealed={showConfirmPassword}
                      showError={false}
                      id="confirmPassword"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      placeholder="비밀번호를 다시 입력해주세요"
                      className={AUTH_INPUT_CLASS}
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      className="mg-v2-password-toggle"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      aria-label={showConfirmPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
                    >
                      {showConfirmPassword ? <EyeOff size={16} strokeWidth={1.75} aria-hidden="true" /> : <Eye size={16} strokeWidth={1.75} aria-hidden="true" />}
                    </button>
                  </div>
                  <PasswordPolicyError field={passwordField} confirm id="confirmPassword" />
                </div>

                <div className="mg-v2-auth-hint mg-v2-auth-hint--password">
                  <p><Info size={16} strokeWidth={1.75} aria-hidden="true" /> <strong>비밀번호 요구사항</strong></p>
                  <PasswordPolicyHint field={passwordField} id="newPassword" as="p" className="" />
                </div>

                <MGButton
                  type="submit"
                  variant="primary"
                  className={`${buildErpMgButtonClassName({ variant: 'primary', size: 'md', loading: isLoading })} mg-v2-button-primary`}
                  disabled={isLoading || !formData.newPassword || !formData.confirmPassword || passwordField.pending}
                  loading={isLoading}
                  loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                  preventDoubleClick={false}
                >
                  비밀번호 변경
                </MGButton>
              </form>
            </>
          ) : (
            <div className="mg-v2-auth-success">
              <div className="mg-v2-auth-success-icon" aria-hidden="true">
                <Check size={32} strokeWidth={1.75} />
              </div>
              
              <div>
                <h2 className="mg-v2-auth-title">비밀번호 변경 완료</h2>
                <p className="mg-v2-auth-success-message">
                  비밀번호가 성공적으로 변경되었습니다.<br />
                  새 비밀번호로 로그인해주세요.
                </p>
              </div>

              <div className="mg-v2-auth-success-actions">
                <Link to="/login" className="mg-v2-button-primary mg-v2-button-primary--link">
                  로그인 페이지로 이동
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
