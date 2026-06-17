/**
 * 휴대폰 SMS 인증 컴포넌트
 * EmailVerification 과 동일 패턴 — Core Solution /api/v1/auth/sms/*
 */

import { COMPONENT_CSS } from '../../constants/css-variables';
import { TRINITY_CONSTANTS } from '../../constants/trinity';
import Button from '../Button';

interface PhoneVerificationProps {
  phone: string;
  phoneFormatError: string | null;
  phoneVerified: boolean;
  phoneVerificationCode: string;
  phoneVerificationSending: boolean;
  phoneVerificationVerifying: boolean;
  phoneVerificationTimeLeft: number | null;
  resendCooldown: number;
  otpSentMessage: string | null;
  onSendVerificationCode: (phone: string) => void;
  onVerifyCode: (phone: string, code: string) => void;
  setPhoneVerificationCode: (code: string) => void;
  className?: string;
}

export default function PhoneVerification({
  phone,
  phoneFormatError,
  phoneVerified,
  phoneVerificationCode,
  phoneVerificationSending,
  phoneVerificationVerifying,
  phoneVerificationTimeLeft,
  resendCooldown,
  otpSentMessage,
  onSendVerificationCode,
  onVerifyCode,
  setPhoneVerificationCode,
  className = '',
}: PhoneVerificationProps) {
  if (!phone || phoneFormatError) {
    return null;
  }

  const codeLength = TRINITY_CONSTANTS.OTP.CODE_LENGTH;

  return (
    <div className={`trinity-onboarding__phone-actions ${className}`}>
      {!phoneVerified && (
        <div className={COMPONENT_CSS.ONBOARDING.VERIFICATION_SECTION}>
          <div className={COMPONENT_CSS.ONBOARDING.VERIFICATION_BUTTON_WRAPPER}>
            <Button
              type="button"
              onClick={() => onSendVerificationCode(phone)}
              disabled={phoneVerificationSending || resendCooldown > 0}
              variant="outline"
              size="small"
              loading={phoneVerificationSending}
              loadingText="발송 중..."
            >
              {resendCooldown > 0
                ? `재발송 (${Math.floor(resendCooldown / 60)}:${String(resendCooldown % 60).padStart(2, '0')})`
                : '인증번호 발송'}
            </Button>
            {phoneVerificationTimeLeft !== null && phoneVerificationTimeLeft > 0 && (
              <div
                className={`${COMPONENT_CSS.ONBOARDING.VERIFICATION_TIMER_WRAPPER} ${
                  phoneVerificationTimeLeft <= 60 ? COMPONENT_CSS.ONBOARDING.VERIFICATION_TIMER_WARNING : ''
                }`}
              >
                <span className={COMPONENT_CSS.ONBOARDING.VERIFICATION_TIMER}>
                  ⏱️ {Math.floor(phoneVerificationTimeLeft / 60)}:
                  {String(phoneVerificationTimeLeft % 60).padStart(2, '0')}
                </span>
              </div>
            )}
          </div>

          {otpSentMessage && (
            <p className={COMPONENT_CSS.ONBOARDING.SUCCESS_TEXT}>{otpSentMessage}</p>
          )}

          {phoneVerificationTimeLeft !== null && (
            <div className={COMPONENT_CSS.ONBOARDING.VERIFICATION_CODE_WRAPPER}>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={phoneVerificationCode}
                onChange={(e) =>
                  setPhoneVerificationCode(e.target.value.replace(/[^0-9]/g, '').slice(0, codeLength))
                }
                className={`${COMPONENT_CSS.ONBOARDING.INPUT} ${COMPONENT_CSS.ONBOARDING.VERIFICATION_CODE_INPUT}`}
                placeholder={`인증번호 (${codeLength}자리)`}
                maxLength={codeLength}
              />
              <Button
                type="button"
                onClick={() => onVerifyCode(phone, phoneVerificationCode)}
                disabled={
                  phoneVerificationVerifying ||
                  !phoneVerificationCode ||
                  phoneVerificationCode.length !== codeLength
                }
                variant="primary"
                size="small"
                loading={phoneVerificationVerifying}
                loadingText="확인 중..."
              >
                인증 확인
              </Button>
            </div>
          )}
        </div>
      )}

      {phoneVerified && (
        <div className={COMPONENT_CSS.ONBOARDING.SUCCESS_TEXT}>
          {TRINITY_CONSTANTS.MESSAGES.PHONE_VERIFY_SUCCESS}
        </div>
      )}
    </div>
  );
}
