/**
 * 새 비밀번호 입력 공통 훅 — 정책 검증·오류 문구·힌트를 한곳에서 제공한다.
 *
 * 값 상태는 화면이 가진다. 제출 직전에 `validate(value, confirmValue)` 가 false 면 API 를 부르지 않는다.
 * 입력란은 {@link ../components/common/PasswordPolicyInput} 에 `field` 로 넘긴다.
 *
 * @param {{ allowEmpty?: boolean, requireConfirm?: boolean }} [options]
 *   allowEmpty — 빈 값이면 서버가 임시 비밀번호를 발급하는 화면.
 *   requireConfirm — 비밀번호 확인 입력이 있는 화면.
 * @returns {{
 *   allowEmpty: boolean,
 *   validate: (value: unknown, confirmValue?: unknown) => boolean,
 *   clearError: () => void,
 *   errorCode: string|null,
 *   confirmErrorCode: string|null,
 *   errorMessage: string,
 *   confirmErrorMessage: string,
 *   hint: string,
 *   placeholder: string
 * }}
 *
 * @author CoreSolution
 * @since 2026-10-06
 */
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  formatPasswordPolicyError,
  getPasswordPolicyHint,
  getPasswordPolicyPlaceholder,
  validatePasswordPolicyInput
} from '../utils/loginPasswordPolicy';

export default function usePasswordPolicyField({ allowEmpty = false, requireConfirm = false } = {}) {
  const { t } = useTranslation('common');
  const [errorCode, setErrorCode] = useState(null);
  const [confirmErrorCode, setConfirmErrorCode] = useState(null);

  const validate = useCallback((value, confirmValue) => {
    const result = validatePasswordPolicyInput(value, { allowEmpty, requireConfirm, confirmValue });
    setErrorCode(result.errorCode);
    setConfirmErrorCode(result.confirmErrorCode);
    return result.valid;
  }, [allowEmpty, requireConfirm]);

  const clearError = useCallback(() => {
    setErrorCode(null);
    setConfirmErrorCode(null);
  }, []);

  return useMemo(() => ({
    allowEmpty,
    validate,
    clearError,
    errorCode,
    confirmErrorCode,
    errorMessage: formatPasswordPolicyError(errorCode, t),
    confirmErrorMessage: formatPasswordPolicyError(confirmErrorCode, t),
    hint: getPasswordPolicyHint(t, { allowEmpty }),
    placeholder: getPasswordPolicyPlaceholder(t)
  }), [allowEmpty, validate, clearError, errorCode, confirmErrorCode, t]);
}
