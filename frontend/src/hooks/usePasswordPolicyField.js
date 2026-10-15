/**
 * 새 비밀번호 입력 공통 훅 — 정책 검증·오류 문구·힌트를 한곳에서 제공한다.
 *
 * 값 상태는 화면이 가진다. 제출 시에는 `validateCommitted(value, confirmValue)` 를 부르고
 * 반환된 `value`(제출 시점 입력란의 확정 값)를 API 본문에 넣는다. `valid` 가 false 면 API 를 부르지 않는다.
 * 화면 상태가 아직 입력란을 따라오지 못한 경우(입력 직후 제출·자동 완성)에도 빈 값(임시 비밀번호)으로
 * 보내지 않도록, 입력란이 마운트돼 있으면 DOM 값을 우선한다.
 * 입력란은 {@link ../components/common/PasswordPolicyInput} 에 `field` 로 넘긴다.
 *
 * @param {{ allowEmpty?: boolean, requireConfirm?: boolean }} [options]
 *   allowEmpty — 빈 값이면 서버가 임시 비밀번호를 발급하는 화면.
 *   requireConfirm — 비밀번호 확인 입력이 있는 화면.
 * @returns {{
 *   allowEmpty: boolean,
 *   validateCommitted: (value: unknown, confirmValue?: unknown) =>
 *     { valid: boolean, value: string, confirmValue: string },
 *   clearError: () => void,
 *   errorCode: string|null,
 *   confirmErrorCode: string|null,
 *   errorMessage: string,
 *   confirmErrorMessage: string,
 *   hint: string,
 *   placeholder: string,
 *   pending: boolean,
 *   markPending: () => void,
 *   settlePending: () => void,
 *   inputRef: { current: HTMLInputElement|null },
 *   confirmInputRef: { current: HTMLInputElement|null }
 * }}
 *
 * @author CoreSolution
 * @since 2026-10-06
 */
import { useCallback, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  formatPasswordPolicyError,
  getPasswordPolicyHint,
  getPasswordPolicyPlaceholder,
  validatePasswordPolicyInput
} from '../utils/loginPasswordPolicy';

const toText = (value) => (value == null ? '' : String(value));

/** 마운트된 입력란의 현재 DOM 값, 없으면 화면 상태 값. */
const readCommitted = (ref, fallback) => {
  const node = ref.current;
  return node && typeof node.value === 'string' ? node.value : toText(fallback);
};

export default function usePasswordPolicyField({ allowEmpty = false, requireConfirm = false } = {}) {
  const { t } = useTranslation('common');
  const [errorCode, setErrorCode] = useState(null);
  const [confirmErrorCode, setConfirmErrorCode] = useState(null);
  const [pending, setPending] = useState(false);
  const inputRef = useRef(null);
  const confirmInputRef = useRef(null);

  const validateCommitted = useCallback((value, confirmValue) => {
    const committedValue = readCommitted(inputRef, value);
    const committedConfirm = requireConfirm ? readCommitted(confirmInputRef, confirmValue) : toText(confirmValue);
    const result = validatePasswordPolicyInput(committedValue, {
      allowEmpty,
      requireConfirm,
      confirmValue: committedConfirm
    });
    setErrorCode(result.errorCode);
    setConfirmErrorCode(result.confirmErrorCode);
    return { valid: result.valid, value: committedValue, confirmValue: committedConfirm };
  }, [allowEmpty, requireConfirm]);

  const clearError = useCallback(() => {
    setErrorCode(null);
    setConfirmErrorCode(null);
  }, []);

  const markPending = useCallback(() => setPending(true), []);
  const settlePending = useCallback(() => setPending(false), []);

  return useMemo(() => ({
    allowEmpty,
    validateCommitted,
    clearError,
    errorCode,
    confirmErrorCode,
    errorMessage: formatPasswordPolicyError(errorCode, t),
    confirmErrorMessage: formatPasswordPolicyError(confirmErrorCode, t),
    hint: getPasswordPolicyHint(t, { allowEmpty }),
    placeholder: getPasswordPolicyPlaceholder(t),
    pending,
    markPending,
    settlePending,
    inputRef,
    confirmInputRef
  }), [allowEmpty, validateCommitted, clearError, errorCode, confirmErrorCode, t, pending,
    markPending, settlePending]);
}
