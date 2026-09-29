/**
 * 결제 화면 인라인 휴대폰 인증 상태 머신 (§8 a~g).
 * 라우트 이동 없이 같은 화면에서 입력 → 발송 → 확인 → 완료. 다른 화면 상태(장바구니·동의)와 독립.
 *
 * @author MindGarden
 * @since 2026-09-29
 */

import { useCallback, useEffect, useRef, useState } from 'react';

import { CLIENT_MALL_LIMITS, CLIENT_MALL_PHONE_COPY, CLIENT_MALL_TIMING } from '../constants/clientMallConstants';
import {
  confirmPhoneVerificationCode,
  sendPhoneVerificationCode
} from '../services/clientPhoneVerifyService';
import {
  PHONE_VERIFY_ERROR,
  PHONE_VERIFY_STEP,
  buildLockedMessage,
  buildWrongCodeMessage,
  classifyPhoneConfirmError,
  classifyPhoneSendError,
  secondsUntil
} from '../utils/clientMallPhoneVerify';
import { isValidKoreanMobileDigits, normalizeKoreanMobileDigits } from '../utils/koreanMobilePhone';

const toDeadline = (seconds, baseMs) => (seconds != null ? baseMs + seconds * CLIENT_MALL_TIMING.MS_PER_SECOND : null);

/**
 * @param {{
 *   initialPhoneDigits?: string,
 *   initiallyVerified?: boolean,
 *   onVerified?: (result: { phoneDigits: string, response: object }) => Promise<void>|void
 * }} options
 */
const usePhoneVerifyFlow = ({ initialPhoneDigits = '', initiallyVerified = false, onVerified } = {}) => {
  const [step, setStep] = useState(initiallyVerified ? PHONE_VERIFY_STEP.VERIFIED : PHONE_VERIFY_STEP.INPUT);
  const [phoneDigits, setPhoneDigitsState] = useState(normalizeKoreanMobileDigits(initialPhoneDigits) || '');
  const [verifiedDigits, setVerifiedDigits] = useState(
    initiallyVerified ? normalizeKoreanMobileDigits(initialPhoneDigits) || '' : ''
  );
  const [code, setCodeState] = useState('');
  const [sentTo, setSentTo] = useState('');
  const [resent, setResent] = useState(false);
  const [deliveryChannel, setDeliveryChannel] = useState(null);
  const [expiresAt, setExpiresAt] = useState(null);
  const [resendAt, setResendAt] = useState(null);
  const [lockedMessage, setLockedMessage] = useState('');
  const [error, setError] = useState(null);
  const [sending, setSending] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const onVerifiedRef = useRef(onVerified);
  onVerifiedRef.current = onVerified;
  const userTouchedRef = useRef(false);

  useEffect(() => {
    if (initiallyVerified && !userTouchedRef.current && step === PHONE_VERIFY_STEP.INPUT && !sentTo) {
      const digits = normalizeKoreanMobileDigits(initialPhoneDigits) || '';
      setVerifiedDigits(digits);
      setPhoneDigitsState(digits);
      setStep(PHONE_VERIFY_STEP.VERIFIED);
    }
  }, [initiallyVerified, initialPhoneDigits, step, sentTo]);

  const hasRunningTimer = (expiresAt != null && expiresAt > now) || (resendAt != null && resendAt > now);
  useEffect(() => {
    if (!hasRunningTimer) {
      return undefined;
    }
    const id = setInterval(() => setNow(Date.now()), CLIENT_MALL_TIMING.COUNTDOWN_TICK_MS);
    return () => clearInterval(id);
  }, [hasRunningTimer]);

  useEffect(() => {
    if (step === PHONE_VERIFY_STEP.SENT && expiresAt != null && now >= expiresAt) {
      setStep(PHONE_VERIFY_STEP.EXPIRED);
      setError(null);
    }
  }, [step, expiresAt, now]);

  const setPhoneDigits = useCallback((raw) => {
    const digits = String(raw || '').replace(/\D/g, '').slice(0, CLIENT_MALL_LIMITS.PHONE_DIGITS_MAX);
    setPhoneDigitsState(digits);
    setError(null);
  }, []);

  const setCode = useCallback((raw) => {
    setCodeState(String(raw || '').replace(/\D/g, '').slice(0, CLIENT_MALL_LIMITS.OTP_LENGTH));
    setError(null);
  }, []);

  const doSend = useCallback(async(targetDigits, isResend) => {
    const digits = normalizeKoreanMobileDigits(targetDigits);
    if (!digits || !isValidKoreanMobileDigits(digits)) {
      setError({ kind: PHONE_VERIFY_ERROR.INVALID_PHONE, message: CLIENT_MALL_PHONE_COPY.INVALID_PHONE });
      return false;
    }
    setSending(true);
    setError(null);
    try {
      const result = await sendPhoneVerificationCode(digits);
      const ts = Date.now();
      setNow(ts);
      setSentTo(digits);
      setResent(Boolean(isResend));
      setDeliveryChannel(result.deliveryChannel);
      setExpiresAt(toDeadline(result.meta.expiresInSeconds, ts));
      setResendAt(toDeadline(result.meta.resendCooldownSeconds, ts));
      setCodeState('');
      setStep(PHONE_VERIFY_STEP.SENT);
      return true;
    } catch (err) {
      const { locked, meta } = classifyPhoneSendError(err);
      if (locked) {
        setLockedMessage(buildLockedMessage(meta.retryAfterSeconds));
        setStep(PHONE_VERIFY_STEP.LOCKED);
        return false;
      }
      setError({ kind: PHONE_VERIFY_ERROR.SEND_FAILED, message: CLIENT_MALL_PHONE_COPY.SEND_FAILED });
      return false;
    } finally {
      setSending(false);
    }
  }, []);

  const send = useCallback(() => doSend(phoneDigits, false), [doSend, phoneDigits]);
  const resend = useCallback(() => doSend(sentTo || phoneDigits, true), [doSend, sentTo, phoneDigits]);

  const confirm = useCallback(async() => {
    if (code.length !== CLIENT_MALL_LIMITS.OTP_LENGTH || !sentTo) {
      return false;
    }
    setConfirming(true);
    setError(null);
    try {
      const response = await confirmPhoneVerificationCode(sentTo, code);
      if (typeof onVerifiedRef.current === 'function') {
        await onVerifiedRef.current({ phoneDigits: sentTo, response });
      }
      setVerifiedDigits(sentTo);
      setPhoneDigitsState(sentTo);
      setExpiresAt(null);
      setResendAt(null);
      setCodeState('');
      setStep(PHONE_VERIFY_STEP.VERIFIED);
      return true;
    } catch (err) {
      const classified = classifyPhoneConfirmError(err);
      if (classified.locked) {
        setLockedMessage(buildLockedMessage(classified.meta.retryAfterSeconds));
        setStep(PHONE_VERIFY_STEP.LOCKED);
        return false;
      }
      if (classified.kind === PHONE_VERIFY_ERROR.WRONG_CODE) {
        setError({
          kind: PHONE_VERIFY_ERROR.WRONG_CODE,
          message: buildWrongCodeMessage(classified.meta.remainingAttempts)
        });
        return false;
      }
      setError({
        kind: PHONE_VERIFY_ERROR.OTHER,
        message: classified.message || CLIENT_MALL_PHONE_COPY.CONFIRM_FAILED
      });
      return false;
    } finally {
      setConfirming(false);
    }
  }, [code, sentTo]);

  /** 번호 변경 / 인증 완료 후 「변경」 → 입력 단계 (번호 유지) */
  const changeNumber = useCallback(() => {
    userTouchedRef.current = true;
    setStep(PHONE_VERIFY_STEP.INPUT);
    setCodeState('');
    setSentTo('');
    setExpiresAt(null);
    setResendAt(null);
    setError(null);
  }, []);

  /** 「번호 변경」을 마치지 않고 닫음 → 서버가 인증 완료로 준 번호면 인증 완료 표시로 복귀 */
  const cancelChange = useCallback(() => {
    if (!initiallyVerified) {
      return;
    }
    const digits = normalizeKoreanMobileDigits(initialPhoneDigits) || '';
    userTouchedRef.current = false;
    setVerifiedDigits(digits);
    setPhoneDigitsState(digits);
    setCodeState('');
    setSentTo('');
    setExpiresAt(null);
    setResendAt(null);
    setError(null);
    setStep(PHONE_VERIFY_STEP.VERIFIED);
  }, [initiallyVerified, initialPhoneDigits]);

  return {
    step,
    phoneDigits,
    verifiedDigits,
    code,
    sentTo,
    resent,
    deliveryChannel,
    remainingSeconds: step === PHONE_VERIFY_STEP.SENT ? secondsUntil(expiresAt, now) : null,
    resendWaitSeconds: (() => {
      const s = secondsUntil(resendAt, now);
      return s != null && s > 0 ? s : null;
    })(),
    lockedMessage,
    error,
    sending,
    confirming,
    isVerified: step === PHONE_VERIFY_STEP.VERIFIED,
    setPhoneDigits,
    setCode,
    send,
    resend,
    confirm,
    changeNumber,
    cancelChange
  };
};

export default usePhoneVerifyFlow;
