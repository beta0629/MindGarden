import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import StandardizedApi from '../../utils/standardizedApi';
import notificationManager from '../../utils/notification';
import MGButton from '../common/MGButton';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../erp/common/erpMgButtonProps';
import './AuthPageCommon.css';
import { Mail, Info, Smartphone } from 'lucide-react';

/** 이메일 비밀번호 재설정 링크 발송 */
const API_AUTH_PASSWORD_RESET_SEND_EMAIL = '/api/v1/auth/password-reset/send-email';
/** 휴대폰 비밀번호 찾기 — OTP 발송 */
const API_AUTH_PASSWORD_RESET_SMS_SEND_OTP = '/api/v1/auth/password-reset/sms/send-otp';
/** 휴대폰 비밀번호 찾기 — OTP 검증 */
const API_AUTH_PASSWORD_RESET_SMS_VERIFY_OTP = '/api/v1/auth/password-reset/sms/verify-otp';
/** 휴대폰 비밀번호 찾기 — 임시 비밀번호 SMS */
const API_AUTH_PASSWORD_RESET_SMS_SEND_TEMP = '/api/v1/auth/password-reset/sms/send-temp-password';

const METHOD_EMAIL = 'email';
const METHOD_PHONE = 'phone';

const PHONE_STEP_INPUT = 'input';
const PHONE_STEP_OTP = 'otp';
const PHONE_STEP_DONE = 'done';

/**
 * ApiResponse 봉투 또는 평탄 응답 호환.
 *
 * @param {unknown} raw
 * @returns {Record<string, unknown>}
 */
const unwrapAuthResponse = (raw) => {
  if (raw && typeof raw === 'object' && 'success' in raw && 'data' in raw) {
    const inner = raw.data;
    if (inner && typeof inner === 'object') {
      return { ...inner, success: inner.success ?? raw.success ?? true };
    }
  }
  if (raw && typeof raw === 'object') {
    return raw;
  }
  return {};
};

const ForgotPassword = () => {
  const [method, setMethod] = useState(METHOD_EMAIL);
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    verificationCode: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [phoneStep, setPhoneStep] = useState(PHONE_STEP_INPUT);
  const [challengeToken, setChallengeToken] = useState('');
  const [maskedPhone, setMaskedPhone] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const switchMethod = (next) => {
    if (isLoading || next === method) {
      return;
    }
    setMethod(next);
    setIsEmailSent(false);
    setPhoneStep(PHONE_STEP_INPUT);
    setChallengeToken('');
    setMaskedPhone('');
    setFormData((prev) => ({
      ...prev,
      verificationCode: ''
    }));
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();

    if (!formData.email) {
      notificationManager.error('이메일을 입력해주세요.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      notificationManager.error('올바른 이메일 형식을 입력해주세요.');
      return;
    }

    setIsLoading(true);

    try {
      const response = unwrapAuthResponse(
        await StandardizedApi.post(API_AUTH_PASSWORD_RESET_SEND_EMAIL, {
          email: formData.email
        })
      );

      if (response.success) {
        setIsEmailSent(true);
        notificationManager.success('비밀번호 재설정 링크를 이메일로 발송했습니다.');
      } else {
        notificationManager.error(response.message || '이메일 발송에 실패했습니다.');
      }
    } catch (error) {
      console.error('비밀번호 재설정 이메일 발송 실패:', error);
      notificationManager.error('일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();

    if (!formData.phone || !String(formData.phone).trim()) {
      notificationManager.error('휴대폰 번호를 입력해주세요.');
      return;
    }

    setIsLoading(true);
    try {
      const response = unwrapAuthResponse(
        await StandardizedApi.post(API_AUTH_PASSWORD_RESET_SMS_SEND_OTP, {
          phone: formData.phone.trim()
        })
      );

      if (response.success) {
        setChallengeToken(response.challengeToken || '');
        setMaskedPhone(response.maskedPhone || formData.phone);
        setPhoneStep(PHONE_STEP_OTP);
        setFormData((prev) => ({ ...prev, verificationCode: '' }));
        notificationManager.success(response.message || '인증번호를 발송했습니다.');
      } else {
        notificationManager.error(response.message || '인증번호 발송에 실패했습니다.');
      }
    } catch (error) {
      console.error('비밀번호 찾기 SMS OTP 발송 실패:', error);
      notificationManager.error('일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyAndSendTemp = async (e) => {
    e.preventDefault();

    if (!formData.verificationCode || !String(formData.verificationCode).trim()) {
      notificationManager.error('인증번호를 입력해주세요.');
      return;
    }
    if (!challengeToken) {
      notificationManager.error('인증 세션이 없습니다. 인증번호를 다시 받아 주세요.');
      setPhoneStep(PHONE_STEP_INPUT);
      return;
    }

    setIsLoading(true);
    try {
      const verifyResponse = unwrapAuthResponse(
        await StandardizedApi.post(API_AUTH_PASSWORD_RESET_SMS_VERIFY_OTP, {
          phone: formData.phone.trim(),
          verificationCode: formData.verificationCode.trim(),
          challengeToken
        })
      );

      if (!verifyResponse.success) {
        notificationManager.error(verifyResponse.message || '인증에 실패했습니다.');
        return;
      }

      const proof = verifyResponse.resetProofToken;
      if (!proof) {
        notificationManager.error('인증 증명 토큰이 없습니다. 다시 시도해 주세요.');
        return;
      }

      const tempResponse = unwrapAuthResponse(
        await StandardizedApi.post(API_AUTH_PASSWORD_RESET_SMS_SEND_TEMP, {
          resetProofToken: proof
        })
      );

      if (tempResponse.success) {
        setPhoneStep(PHONE_STEP_DONE);
        notificationManager.success(
          tempResponse.message || '임시 비밀번호를 문자로 발송했습니다.'
        );
      } else {
        notificationManager.error(tempResponse.message || '임시 비밀번호 발송에 실패했습니다.');
      }
    } catch (error) {
      console.error('비밀번호 찾기 SMS 인증·임시비번 실패:', error);
      notificationManager.error('일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderMethodTabs = () => (
    <div className="mg-v2-auth-method-tabs" role="tablist" aria-label="비밀번호 찾기 방법">
      <button
        type="button"
        role="tab"
        aria-selected={method === METHOD_EMAIL}
        className={`mg-v2-auth-method-tab${method === METHOD_EMAIL ? ' mg-v2-auth-method-tab--active' : ''}`}
        onClick={() => switchMethod(METHOD_EMAIL)}
        disabled={isLoading}
      >
        이메일
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={method === METHOD_PHONE}
        className={`mg-v2-auth-method-tab${method === METHOD_PHONE ? ' mg-v2-auth-method-tab--active' : ''}`}
        onClick={() => switchMethod(METHOD_PHONE)}
        disabled={isLoading}
      >
        휴대폰
      </button>
    </div>
  );

  const renderEmailFlow = () => (
    !isEmailSent ? (
      <>
        <div>
          <h2 className="mg-v2-auth-title">비밀번호 찾기</h2>
          <p className="mg-v2-auth-subtitle">
            가입 시 사용한 이메일을 입력하면 비밀번호 재설정 링크를 보내드립니다.
          </p>
        </div>

        {renderMethodTabs()}

        <form className="mg-v2-auth-form" onSubmit={handleEmailSubmit} noValidate>
          <div className="mg-v2-form-group">
            <label className="mg-v2-label" htmlFor="forgotEmail">
              이메일 주소
            </label>
            <input
              id="forgotEmail"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="example@email.com"
              disabled={isLoading}
              className="mg-v2-input"
              autoComplete="email"
              required
            />
          </div>

          <MGButton
            type="submit"
            variant="primary"
            className={`${buildErpMgButtonClassName({ variant: 'primary', size: 'md', loading: isLoading })} mg-v2-button-primary`}
            disabled={isLoading || !formData.email}
            loading={isLoading}
            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
            preventDoubleClick={false}
          >
            재설정 링크 전송
          </MGButton>
        </form>

        <Link className="mg-v2-link-text" to="/login">
          ← 로그인 페이지로 돌아가기
        </Link>
      </>
    ) : (
      <div className="mg-v2-auth-success">
        <div className="mg-v2-auth-success-icon" aria-hidden="true">
          <Mail size={32} strokeWidth={1.75} />
        </div>
        <div>
          <h2 className="mg-v2-auth-title">이메일을 확인해주세요</h2>
          <p className="mg-v2-auth-success-message">
            <strong>{formData.email}</strong> 주소로 비밀번호 재설정 링크를 발송했습니다.
            <br />
            메일함을 확인해 비밀번호 변경을 완료해주세요.
          </p>
        </div>

        <div className="mg-v2-auth-hint">
          <p><Info size={16} strokeWidth={1.75} aria-hidden="true" /> <strong>안내사항</strong></p>
          <ul>
            <li>이메일이 보이지 않으면 스팸함을 확인해주세요.</li>
            <li>재설정 링크는 24시간 후 만료됩니다.</li>
            <li>링크는 한 번만 사용할 수 있습니다.</li>
          </ul>
        </div>

        <div className="mg-v2-auth-success-actions">
          <MGButton
            type="button"
            variant="secondary"
            className={`${buildErpMgButtonClassName({ variant: 'secondary', size: 'md', loading: false })} mg-v2-button-secondary`}
            onClick={() => setIsEmailSent(false)}
            disabled={isLoading}
            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
            preventDoubleClick={false}
          >
            다른 이메일로 다시 발송
          </MGButton>
          <Link className="mg-v2-button-secondary mg-v2-button-secondary--link" to="/login">
            로그인 페이지로 돌아가기
          </Link>
        </div>
      </div>
    )
  );

  const renderPhoneFlow = () => {
    if (phoneStep === PHONE_STEP_DONE) {
      return (
        <div className="mg-v2-auth-success">
          <div className="mg-v2-auth-success-icon" aria-hidden="true">
            <Smartphone size={32} strokeWidth={1.75} />
          </div>
          <div>
            <h2 className="mg-v2-auth-title">문자를 확인해주세요</h2>
            <p className="mg-v2-auth-success-message">
              <strong>{maskedPhone || formData.phone}</strong> 번호로 임시 비밀번호를 발송했습니다.
              <br />
              로그인 후 비밀번호를 변경해주세요.
            </p>
          </div>

          <div className="mg-v2-auth-hint">
            <p><Info size={16} strokeWidth={1.75} aria-hidden="true" /> <strong>안내사항</strong></p>
            <ul>
              <li>문자가 보이지 않으면 수신 시간을 두고 다시 확인해주세요.</li>
              <li>임시 비밀번호로 로그인하면 비밀번호 변경이 필요합니다.</li>
              <li>본인이 요청하지 않았다면 고객센터로 문의해 주세요.</li>
            </ul>
          </div>

          <div className="mg-v2-auth-success-actions">
            <MGButton
              type="button"
              variant="secondary"
              className={`${buildErpMgButtonClassName({ variant: 'secondary', size: 'md', loading: false })} mg-v2-button-secondary`}
              onClick={() => {
                setPhoneStep(PHONE_STEP_INPUT);
                setChallengeToken('');
                setFormData((prev) => ({ ...prev, verificationCode: '' }));
              }}
              disabled={isLoading}
              loadingText={ERP_MG_BUTTON_LOADING_TEXT}
              preventDoubleClick={false}
            >
              다른 번호로 다시 시도
            </MGButton>
            <Link className="mg-v2-button-secondary mg-v2-button-secondary--link" to="/login">
              로그인 페이지로 돌아가기
            </Link>
          </div>
        </div>
      );
    }

    return (
      <>
        <div>
          <h2 className="mg-v2-auth-title">비밀번호 찾기</h2>
          <p className="mg-v2-auth-subtitle">
            {phoneStep === PHONE_STEP_OTP
              ? '문자로 받은 인증번호를 입력한 뒤 임시 비밀번호를 받으세요.'
              : '가입 시 사용한 휴대폰 번호로 인증 후 임시 비밀번호를 문자로 받습니다.'}
          </p>
        </div>

        {renderMethodTabs()}

        {phoneStep === PHONE_STEP_INPUT ? (
          <form className="mg-v2-auth-form" onSubmit={handleSendOtp} noValidate>
            <div className="mg-v2-form-group">
              <label className="mg-v2-label" htmlFor="forgotPhone">
                휴대폰 번호
              </label>
              <input
                id="forgotPhone"
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="01012345678"
                disabled={isLoading}
                className="mg-v2-input"
                autoComplete="tel"
                required
              />
            </div>

            <MGButton
              type="submit"
              variant="primary"
              className={`${buildErpMgButtonClassName({ variant: 'primary', size: 'md', loading: isLoading })} mg-v2-button-primary`}
              disabled={isLoading || !formData.phone}
              loading={isLoading}
              loadingText={ERP_MG_BUTTON_LOADING_TEXT}
              preventDoubleClick={false}
            >
              인증번호 전송
            </MGButton>
          </form>
        ) : (
          <form className="mg-v2-auth-form" onSubmit={handleVerifyAndSendTemp} noValidate>
            <div className="mg-v2-form-group">
              <label className="mg-v2-label" htmlFor="forgotOtp">
                인증번호
              </label>
              <input
                id="forgotOtp"
                type="text"
                name="verificationCode"
                value={formData.verificationCode}
                onChange={handleInputChange}
                placeholder="6자리 인증번호"
                disabled={isLoading}
                className="mg-v2-input"
                inputMode="numeric"
                autoComplete="one-time-code"
                required
              />
            </div>

            <MGButton
              type="submit"
              variant="primary"
              className={`${buildErpMgButtonClassName({ variant: 'primary', size: 'md', loading: isLoading })} mg-v2-button-primary`}
              disabled={isLoading || !formData.verificationCode}
              loading={isLoading}
              loadingText={ERP_MG_BUTTON_LOADING_TEXT}
              preventDoubleClick={false}
            >
              인증 후 임시 비밀번호 받기
            </MGButton>

            <MGButton
              type="button"
              variant="secondary"
              className={`${buildErpMgButtonClassName({ variant: 'secondary', size: 'md', loading: false })} mg-v2-button-secondary`}
              onClick={() => {
                setPhoneStep(PHONE_STEP_INPUT);
                setChallengeToken('');
                setFormData((prev) => ({ ...prev, verificationCode: '' }));
              }}
              disabled={isLoading}
              loadingText={ERP_MG_BUTTON_LOADING_TEXT}
              preventDoubleClick={false}
            >
              번호 다시 입력
            </MGButton>
          </form>
        )}

        <Link className="mg-v2-link-text" to="/login">
          ← 로그인 페이지로 돌아가기
        </Link>
      </>
    );
  };

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
          {method === METHOD_EMAIL ? renderEmailFlow() : renderPhoneFlow()}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
