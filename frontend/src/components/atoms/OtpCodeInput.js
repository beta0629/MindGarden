/**
 * OtpCodeInput — 6칸 OTP 입력 atom (web).
 *
 * 디자이너 산출 §2.5.2 — 48×48 cell, border 2px, radius 10px,
 * primary/border/error 토큰만 사용. expo `OtpCodeInput` molecule 와 동등한 시각/UX.
 *
 * - 1개의 hidden input(SMS 자동입력) + 6개의 시각용 cell 구조.
 * - `autocomplete="one-time-code"` 로 iOS/Android SMS 자동 채움 호환.
 * - 6자리 완료 시 `onComplete(value)` 콜백 (자동 verify 트리거).
 * - aria-label/role 로 스크린리더 친화. 에러 상태는 cell border + alert 영역으로 표시.
 *
 * Atomic Design — atoms 계층. 외부 의존(컴포넌트) 없음. CSS 는 `OtpCodeInput.css`.
 *
 * @author MindGarden
 * @since 2026-06-09
 */

import React, {
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  forwardRef
} from 'react';
import PropTypes from 'prop-types';
import './OtpCodeInput.css';

const DEFAULT_LENGTH = 6;
const DIGITS_ONLY_REGEX = /\D/g;

/**
 * @typedef {Object} OtpCodeInputProps
 * @property {string} value 외부 제어 입력 값 (숫자만 권장)
 * @property {(next: string) => void} onChange 값 변경 콜백 (숫자만 전달)
 * @property {(value: string) => void} [onComplete] length 도달 시 1회 호출
 * @property {number} [length=6]
 * @property {string} [error] 에러 메시지 (있으면 cell error 색)
 * @property {boolean} [disabled]
 * @property {boolean} [autoFocus]
 * @property {string} [ariaLabel='인증번호 6자리 입력']
 * @property {string} [ariaDescribedBy]
 * @property {string} [name='otp']
 * @property {string} [id]
 */

const OtpCodeInput = forwardRef((
  {
    value,
    onChange,
    onComplete,
    length = DEFAULT_LENGTH,
    error = '',
    disabled = false,
    autoFocus = false,
    ariaLabel = '인증번호 6자리 입력',
    ariaDescribedBy,
    name = 'otp',
    id
  },
  ref
) => {
  const inputRef = useRef(null);
  const completedValueRef = useRef('');

  useImperativeHandle(
    ref,
    () => ({
      focus: () => {
        inputRef.current?.focus();
      },
      blur: () => {
        inputRef.current?.blur();
      }
    }),
    []
  );

  useEffect(() => {
    if (autoFocus && inputRef.current && !disabled) {
      inputRef.current.focus();
    }
  }, [autoFocus, disabled]);

  const sanitizedValue = useMemo(() => {
    const raw = String(value ?? '').replace(DIGITS_ONLY_REGEX, '');
    return raw.slice(0, length);
  }, [value, length]);

  // 외부에서 value 가 length 미만으로 줄어들면 (예: 부모 재발송으로 OTP 초기화)
  // 다음 완성 시 onComplete 가 재호출되도록 completedValueRef 를 리셋한다.
  useEffect(() => {
    if (sanitizedValue.length < length) {
      completedValueRef.current = '';
    }
  }, [sanitizedValue, length]);

  const cells = useMemo(() => {
    const arr = new Array(length);
    for (let i = 0; i < length; i += 1) {
      arr[i] = sanitizedValue[i] || '';
    }
    return arr;
  }, [sanitizedValue, length]);

  const hasError = Boolean(error);

  const handleChange = useCallback(
    (event) => {
      const nextRaw = String(event.target.value ?? '').replace(DIGITS_ONLY_REGEX, '');
      const next = nextRaw.slice(0, length);
      if (next === sanitizedValue) {
        return;
      }
      onChange?.(next);
      if (next.length === length && completedValueRef.current !== next) {
        completedValueRef.current = next;
        onComplete?.(next);
      }
      if (next.length < length) {
        completedValueRef.current = '';
      }
    },
    [length, onChange, onComplete, sanitizedValue]
  );

  const handleCellClick = useCallback(() => {
    if (!disabled) {
      inputRef.current?.focus();
    }
  }, [disabled]);

  return (
    <div
      className={[
        'mg-otp-input',
        hasError ? 'mg-otp-input--error' : '',
        disabled ? 'mg-otp-input--disabled' : ''
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <input
        ref={inputRef}
        id={id}
        name={name}
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        pattern="[0-9]*"
        maxLength={length}
        value={sanitizedValue}
        onChange={handleChange}
        disabled={disabled}
        aria-label={ariaLabel}
        aria-invalid={hasError || undefined}
        aria-describedby={ariaDescribedBy}
        className="mg-otp-input__hidden"
        data-testid="mg-otp-hidden-input"
      />
      <ol
        className="mg-otp-input__cells"
        aria-hidden="true"
        onClick={handleCellClick}
      >
        {cells.map((digit, idx) => {
          const isFilled = digit !== '';
          return (
            <li
              key={`mg-otp-cell-${idx}`}
              className={[
                'mg-otp-input__cell',
                isFilled ? 'mg-otp-input__cell--filled' : '',
                hasError ? 'mg-otp-input__cell--error' : ''
              ]
                .filter(Boolean)
                .join(' ')}
              data-testid={`mg-otp-cell-${idx}`}
            >
              {digit}
            </li>
          );
        })}
      </ol>
      {hasError && (
        <p className="mg-otp-input__error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
});

OtpCodeInput.displayName = 'OtpCodeInput';

OtpCodeInput.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  onComplete: PropTypes.func,
  length: PropTypes.number,
  error: PropTypes.string,
  disabled: PropTypes.bool,
  autoFocus: PropTypes.bool,
  ariaLabel: PropTypes.string,
  ariaDescribedBy: PropTypes.string,
  name: PropTypes.string,
  id: PropTypes.string
};

export default OtpCodeInput;
