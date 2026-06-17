/**
 * 순차적 진행 휴대폰 입력 + SMS 인증 컴포넌트
 */

import { COMPONENT_CSS } from '../../constants/css-variables';
import { TRINITY_CONSTANTS, shouldSkipPhoneVerification } from '../../constants/trinity';
import {
  formatPhoneDisplay,
  normalizeKoreanMobileDigits,
  validatePhoneFormat,
} from '../../utils/phoneUtils';
import PhoneVerification from './PhoneVerification';

interface PhoneInputProgressiveProps {
  value: string;
  onChange: (value: string) => void;
  onValidationChange?: (isValid: boolean) => void;
  placeholder?: string;
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
  setPhoneFormatError: (error: string | null) => void;
  onPhoneChangeReset?: () => void;
  onSkipPhoneVerify?: () => void;
}

export default function PhoneInputProgressive({
  value,
  onChange,
  onValidationChange,
  placeholder = TRINITY_CONSTANTS.PHONE.PLACEHOLDER,
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
  setPhoneFormatError,
  onPhoneChangeReset,
  onSkipPhoneVerify,
}: PhoneInputProgressiveProps) {
  const handlePhoneInput = (raw: string) => {
    const digits = normalizeKoreanMobileDigits(raw);
    const display = formatPhoneDisplay(digits);
    onChange(display);
    onPhoneChangeReset?.();

    if (!digits) {
      setPhoneFormatError(null);
      onValidationChange?.(false);
      return;
    }

    const validation = validatePhoneFormat(display);
    if (!validation.valid) {
      setPhoneFormatError(validation.error || null);
      onValidationChange?.(false);
      return;
    }

    setPhoneFormatError(null);

    if (shouldSkipPhoneVerification()) {
      onSkipPhoneVerify?.();
      onValidationChange?.(true);
      return;
    }

    onValidationChange?.(phoneVerified);
  };

  return (
    <div className="trinity-onboarding__phone-input">
      <input
        type="tel"
        value={value}
        onChange={(e) => handlePhoneInput(e.target.value)}
        placeholder={placeholder}
        className={COMPONENT_CSS.ONBOARDING.INPUT}
        maxLength={TRINITY_CONSTANTS.PHONE.DISPLAY_MAX_LENGTH}
        autoComplete="tel"
        required
      />

      {phoneFormatError && (
        <div className={COMPONENT_CSS.ONBOARDING.ERROR_BOX}>
          <small className={COMPONENT_CSS.ONBOARDING.ERROR_TEXT}>⚠️ {phoneFormatError}</small>
        </div>
      )}

      <PhoneVerification
        phone={value}
        phoneFormatError={phoneFormatError}
        phoneVerified={phoneVerified}
        phoneVerificationCode={phoneVerificationCode}
        phoneVerificationSending={phoneVerificationSending}
        phoneVerificationVerifying={phoneVerificationVerifying}
        phoneVerificationTimeLeft={phoneVerificationTimeLeft}
        resendCooldown={resendCooldown}
        otpSentMessage={otpSentMessage}
        onSendVerificationCode={onSendVerificationCode}
        onVerifyCode={onVerifyCode}
        setPhoneVerificationCode={setPhoneVerificationCode}
      />
    </div>
  );
}
