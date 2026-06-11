import React, { useCallback, useEffect, useState } from 'react';
import { MYPAGE_API } from '../../../constants/api';
import StandardizedApi from '../../../utils/standardizedApi';
import UnifiedModal from '../../common/modals/UnifiedModal';
import MGButton from '../../common/MGButton';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../../erp/common/erpMgButtonProps';
import SafeText from '../../common/SafeText';
import notificationManager from '../../../utils/notification';

/**
 * 마이페이지 이메일 변경 모달 (Phase B).
 *
 * 단계:
 *  1) `email` — 새 이메일 입력 + "인증 메일 발송" → {@link MYPAGE_API.EMAIL_SEND}
 *  2) `otp` — 6자리 OTP 입력 + "변경 완료" → {@link MYPAGE_API.CHANGE_EMAIL}
 *     ↳ 서버가 OTP 단일 사용 검증 + tenant 내 중복 가드 + AuditLog 기록 후 새 이메일 저장
 *     ↳ 성공 시 서버가 JWT refresh token·HttpSession·SecurityContext 를 모두 무효화하므로
 *       호출 측은 즉시 로그아웃 후 /login 으로 강제 리다이렉트해야 한다.
 *
 * 디자인 토큰·클래스는 `mg-mypage-password-form__*` 패턴 재사용 (PhoneChangeModal 정합).
 *
 * @author MindGarden
 * @since 2026-06-11
 */
const OTP_LENGTH = 6;
const EMAIL_MAX_LENGTH = 254;
const EMAIL_FORMAT_PATTERN = /^[\w.!#$%&'*+/=?`{|}~^-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+$/;

const ERROR_EMAIL_REQUIRED = '새 이메일을 입력해주세요.';
const ERROR_EMAIL_INVALID = '올바른 이메일 형식이 아닙니다.';
const ERROR_OTP_REQUIRED = '6자리 인증 코드를 입력해주세요.';
const ERROR_OTP_INVALID = '6자리 숫자 코드를 입력해주세요.';
const ERROR_GENERIC = '이메일 변경에 실패했습니다.';
const MSG_OTP_SENT = '인증 코드가 전송되었습니다. 메일함을 확인해 주세요.';
const MSG_CHANGED = '이메일이 변경되었습니다.';
const MSG_REAUTH_REQUIRED = '보안상 재로그인이 필요합니다. 잠시 후 로그인 화면으로 이동합니다.';

const normalizeEmail = (raw) => (raw || '').trim().toLowerCase();

const EmailChangeModal = ({ isOpen, onClose, onSuccess }) => {
  const [step, setStep] = useState('email');
  const [emailInput, setEmailInput] = useState('');
  const [emailError, setEmailError] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [otpError, setOtpError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      return undefined;
    }
    setStep('email');
    setEmailInput('');
    setEmailError('');
    setOtpInput('');
    setOtpError('');
    setSubmitError('');
    setIsSending(false);
    setIsSubmitting(false);
    return undefined;
  }, [isOpen]);

  const normalizedEmail = normalizeEmail(emailInput);

  const handleEmailChange = useCallback((e) => {
    setEmailInput(e.target.value.slice(0, EMAIL_MAX_LENGTH));
    setEmailError('');
    setSubmitError('');
  }, []);

  const handleOtpChange = useCallback((e) => {
    const digits = (e.target.value || '').replace(/\D/g, '').slice(0, OTP_LENGTH);
    setOtpInput(digits);
    setOtpError('');
    setSubmitError('');
  }, []);

  const handleSendOtp = useCallback(async () => {
    if (!normalizedEmail) {
      setEmailError(ERROR_EMAIL_REQUIRED);
      return;
    }
    if (!EMAIL_FORMAT_PATTERN.test(normalizedEmail)) {
      setEmailError(ERROR_EMAIL_INVALID);
      return;
    }
    setIsSending(true);
    setSubmitError('');
    try {
      const response = await StandardizedApi.post(MYPAGE_API.EMAIL_SEND, {
        email: normalizedEmail
      });
      if (response && response.success !== false) {
        notificationManager.show(MSG_OTP_SENT, 'info');
        setStep('otp');
        setOtpInput('');
      } else {
        const msg = (response && response.message) || ERROR_GENERIC;
        setSubmitError(msg);
        notificationManager.show(msg, 'error');
      }
    } catch (error) {
      const msg = error?.response?.data?.message || ERROR_GENERIC;
      setSubmitError(msg);
      notificationManager.show(msg, 'error');
    } finally {
      setIsSending(false);
    }
  }, [normalizedEmail]);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      if (!otpInput) {
        setOtpError(ERROR_OTP_REQUIRED);
        return;
      }
      if (!/^\d{6}$/.test(otpInput)) {
        setOtpError(ERROR_OTP_INVALID);
        return;
      }
      setIsSubmitting(true);
      setSubmitError('');
      try {
        const response = await StandardizedApi.post(MYPAGE_API.CHANGE_EMAIL, {
          newEmail: normalizedEmail,
          verificationCode: otpInput
        });
        if (response && response.success === false) {
          const msg = response.message || ERROR_GENERIC;
          setSubmitError(msg);
          notificationManager.show(msg, 'error');
          return;
        }
        notificationManager.show(MSG_CHANGED, 'info');
        notificationManager.show(MSG_REAUTH_REQUIRED, 'warning');
        onSuccess?.(response);
        onClose?.();
      } catch (error) {
        const msg = error?.response?.data?.message || error?.message || ERROR_GENERIC;
        setSubmitError(msg);
        notificationManager.show(msg, 'error');
      } finally {
        setIsSubmitting(false);
      }
    },
    [otpInput, normalizedEmail, onClose, onSuccess]
  );

  if (!isOpen) return null;

  const sendDisabled = isSending || !EMAIL_FORMAT_PATTERN.test(normalizedEmail);
  const submitDisabled = isSubmitting || otpInput.length !== OTP_LENGTH;

  return (
    <UnifiedModal
      isOpen={isOpen}
      onClose={onClose}
      title="이메일 변경"
      subtitle={step === 'email' ? '새 이메일로 6자리 인증 코드를 보내드립니다.' : '메일함에서 받은 6자리 코드를 입력하세요.'}
      size="medium"
      loading={isSending || isSubmitting}
    >
      <form onSubmit={handleSubmit} className="mg-mypage-password-form">
        <div className="mg-mypage-password-form__group">
          <label className="mg-mypage-password-form__label" htmlFor="mg-mypage-new-email">
            새 이메일
          </label>
          <input
            type="email"
            id="mg-mypage-new-email"
            name="newEmail"
            className="mg-mypage-password-form__input"
            value={emailInput}
            onChange={handleEmailChange}
            placeholder="name@example.com"
            inputMode="email"
            maxLength={EMAIL_MAX_LENGTH}
            autoComplete="email"
            disabled={step === 'otp' || isSending}
          />
          {emailError ? (
            <p className="mg-mypage-password-form__error" role="alert">
              <SafeText>{emailError}</SafeText>
            </p>
          ) : null}
        </div>

        {step === 'email' ? (
          <div className="mg-mypage-password-form__actions">
            <MGButton
              type="button"
              variant="outline"
              className={buildErpMgButtonClassName({ variant: 'outline', size: 'md', loading: false })}
              loadingText={ERP_MG_BUTTON_LOADING_TEXT}
              onClick={onClose}
              disabled={isSending}
            >
              취소
            </MGButton>
            <MGButton
              type="button"
              variant="primary"
              className={buildErpMgButtonClassName({ variant: 'primary', size: 'md', loading: isSending })}
              loading={isSending}
              loadingText={ERP_MG_BUTTON_LOADING_TEXT}
              onClick={handleSendOtp}
              disabled={sendDisabled}
            >
              인증 메일 발송
            </MGButton>
          </div>
        ) : (
          <>
            <div className="mg-mypage-password-form__group">
              <label className="mg-mypage-password-form__label" htmlFor="mg-mypage-email-otp">
                인증 코드 (6자리)
              </label>
              <input
                type="text"
                id="mg-mypage-email-otp"
                name="verificationCode"
                className="mg-mypage-password-form__input"
                value={otpInput}
                onChange={handleOtpChange}
                placeholder="000000"
                inputMode="numeric"
                pattern="\d{6}"
                maxLength={OTP_LENGTH}
                autoComplete="one-time-code"
                disabled={isSubmitting}
                autoFocus
              />
              {otpError ? (
                <p className="mg-mypage-password-form__error" role="alert">
                  <SafeText>{otpError}</SafeText>
                </p>
              ) : null}
            </div>

            {submitError ? (
              <p className="mg-mypage-password-form__error" role="alert">
                <SafeText>{submitError}</SafeText>
              </p>
            ) : null}

            <div className="mg-mypage-password-form__actions">
              <MGButton
                type="button"
                variant="outline"
                className={buildErpMgButtonClassName({ variant: 'outline', size: 'md', loading: false })}
                loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                onClick={() => {
                  setStep('email');
                  setOtpInput('');
                  setOtpError('');
                  setSubmitError('');
                }}
                disabled={isSubmitting}
              >
                이메일 다시 입력
              </MGButton>
              <MGButton
                type="submit"
                variant="primary"
                className={buildErpMgButtonClassName({ variant: 'primary', size: 'md', loading: isSubmitting })}
                loading={isSubmitting}
                loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                disabled={submitDisabled}
              >
                변경 완료
              </MGButton>
            </div>
          </>
        )}
      </form>
    </UnifiedModal>
  );
};

export default EmailChangeModal;
