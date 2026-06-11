import React, { useCallback, useEffect, useState } from 'react';
import { AUTH_API, MYPAGE_API } from '../../../constants/api';
import StandardizedApi from '../../../utils/standardizedApi';
import UnifiedModal from '../../common/modals/UnifiedModal';
import MGButton from '../../common/MGButton';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../../erp/common/erpMgButtonProps';
import SafeText from '../../common/SafeText';
import notificationManager from '../../../utils/notification';

/**
 * 마이페이지 휴대전화 변경 모달 (Phase A).
 *
 * 단계:
 *  1) `phone` — 새 휴대폰 번호 입력 + "인증번호 발송" → {@link AUTH_API.SMS_SEND}
 *  2) `otp` — 6자리 OTP 입력 + "변경 완료" → {@link MYPAGE_API.CHANGE_PHONE}
 *     ↳ 서버가 SMS OTP 단일 사용 검증 + tenant 내 중복 가드 + AuditLog 기록 후 새 번호 저장
 *
 * 디자인 토큰·클래스는 `mg-mypage-password-form__*` 패턴 재사용.
 *
 * @author MindGarden
 * @since 2026-06-11
 */
const OTP_LENGTH = 6;
const PHONE_MAX_LENGTH = 13; // 010-1234-5678
const KOREAN_MOBILE_PATTERN = /^01[016789]\d{7,8}$/;

const ERROR_PHONE_REQUIRED = '새 휴대전화 번호를 입력해주세요.';
const ERROR_PHONE_INVALID = '올바른 휴대전화 번호를 입력해주세요.';
const ERROR_OTP_REQUIRED = '6자리 인증 코드를 입력해주세요.';
const ERROR_OTP_INVALID = '6자리 숫자 코드를 입력해주세요.';
const ERROR_GENERIC = '휴대전화 변경에 실패했습니다.';
const MSG_SMS_SENT = '인증 코드가 전송되었습니다.';
const MSG_CHANGED = '휴대전화가 변경되었습니다.';

const sanitizeDigits = (raw) => (raw || '').replace(/\D/g, '');

const formatPhoneDisplay = (digits) => {
  const d = sanitizeDigits(digits);
  if (d.length <= 3) return d;
  if (d.length <= 7) return `${d.slice(0, 3)}-${d.slice(3)}`;
  return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7, 11)}`;
};

const PhoneChangeModal = ({ isOpen, onClose, onSuccess }) => {
  const [step, setStep] = useState('phone');
  const [phoneDisplay, setPhoneDisplay] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [otpError, setOtpError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      return undefined;
    }
    setStep('phone');
    setPhoneDisplay('');
    setPhoneError('');
    setOtpInput('');
    setOtpError('');
    setSubmitError('');
    setIsSending(false);
    setIsSubmitting(false);
    return undefined;
  }, [isOpen]);

  const phoneDigits = sanitizeDigits(phoneDisplay);

  const handlePhoneChange = useCallback((e) => {
    const digits = sanitizeDigits(e.target.value).slice(0, 11);
    setPhoneDisplay(formatPhoneDisplay(digits));
    setPhoneError('');
    setSubmitError('');
  }, []);

  const handleOtpChange = useCallback((e) => {
    const digits = sanitizeDigits(e.target.value).slice(0, OTP_LENGTH);
    setOtpInput(digits);
    setOtpError('');
    setSubmitError('');
  }, []);

  const handleSendOtp = useCallback(async () => {
    if (!phoneDigits) {
      setPhoneError(ERROR_PHONE_REQUIRED);
      return;
    }
    if (!KOREAN_MOBILE_PATTERN.test(phoneDigits)) {
      setPhoneError(ERROR_PHONE_INVALID);
      return;
    }
    setIsSending(true);
    setSubmitError('');
    try {
      const response = await StandardizedApi.post(AUTH_API.SMS_SEND, {
        phoneNumber: phoneDigits
      });
      if (response && response.success !== false) {
        notificationManager.show(MSG_SMS_SENT, 'info');
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
  }, [phoneDigits]);

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
        const response = await StandardizedApi.post(MYPAGE_API.CHANGE_PHONE, {
          newPhoneNumber: phoneDigits,
          verificationCode: otpInput
        });
        if (response && response.success === false) {
          const msg = response.message || ERROR_GENERIC;
          setSubmitError(msg);
          notificationManager.show(msg, 'error');
          return;
        }
        notificationManager.show(MSG_CHANGED, 'info');
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
    [otpInput, phoneDigits, onClose, onSuccess]
  );

  if (!isOpen) return null;

  const sendDisabled = isSending || !KOREAN_MOBILE_PATTERN.test(phoneDigits);
  const submitDisabled = isSubmitting || otpInput.length !== OTP_LENGTH;

  return (
    <UnifiedModal
      isOpen={isOpen}
      onClose={onClose}
      title="휴대전화 변경"
      subtitle={step === 'phone' ? '새 휴대폰 번호로 6자리 인증 코드를 보내드립니다.' : '문자로 전송된 6자리 코드를 입력하세요.'}
      size="medium"
      loading={isSending || isSubmitting}
    >
      <form onSubmit={handleSubmit} className="mg-mypage-password-form">
        <div className="mg-mypage-password-form__group">
          <label className="mg-mypage-password-form__label" htmlFor="mg-mypage-new-phone">
            새 휴대전화 번호
          </label>
          <input
            type="tel"
            id="mg-mypage-new-phone"
            name="newPhone"
            className="mg-mypage-password-form__input"
            value={phoneDisplay}
            onChange={handlePhoneChange}
            placeholder="010-0000-0000"
            inputMode="numeric"
            maxLength={PHONE_MAX_LENGTH}
            autoComplete="tel"
            disabled={step === 'otp' || isSending}
          />
          {phoneError ? (
            <p className="mg-mypage-password-form__error" role="alert">
              <SafeText>{phoneError}</SafeText>
            </p>
          ) : null}
        </div>

        {step === 'phone' ? (
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
              인증번호 발송
            </MGButton>
          </div>
        ) : (
          <>
            <div className="mg-mypage-password-form__group">
              <label className="mg-mypage-password-form__label" htmlFor="mg-mypage-otp">
                인증 코드 (6자리)
              </label>
              <input
                type="text"
                id="mg-mypage-otp"
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
                  setStep('phone');
                  setOtpInput('');
                  setOtpError('');
                  setSubmitError('');
                }}
                disabled={isSubmitting}
              >
                번호 다시 입력
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

export default PhoneChangeModal;
