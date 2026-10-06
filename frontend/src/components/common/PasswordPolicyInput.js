/**
 * 새 비밀번호 입력란 공통 컴포넌트 — {@link ../../hooks/usePasswordPolicyField} 결과(field)를 받아
 * 정책 오류 표시(aria-invalid·role=alert)·힌트·placeholder 를 통일한다.
 *
 * 로그인·현재 비밀번호 확인처럼 정책을 적용하지 않는 입력은 이 컴포넌트를 쓰지 않고
 * `autoComplete="current-password"` 를 단다(가드레일 check-password-policy-common.js 기준).
 *
 * @author CoreSolution
 * @since 2026-10-06
 */
import React from 'react';
import PropTypes from 'prop-types';
import { PASSWORD_AUTOCOMPLETE, PASSWORD_POLICY_CSS } from '../../constants/passwordPolicyUi';

const joinIds = (...ids) => {
  const list = ids.filter(Boolean);
  return list.length > 0 ? list.join(' ') : undefined;
};

const errorIdOf = (id, confirm) => (id ? `${id}-${confirm ? 'confirm' : 'policy'}-error` : undefined);
const hintIdOf = (id) => (id ? `${id}-policy-hint` : undefined);

/**
 * 정책 오류 문구만 (토글 버튼이 있는 래퍼 밖에 둘 때).
 */
export const PasswordPolicyError = ({
  field,
  confirm = false,
  id,
  className = PASSWORD_POLICY_CSS.ERROR
}) => {
  const message = confirm ? field.confirmErrorMessage : field.errorMessage;
  if (!message) {
    return null;
  }
  return (
    <small id={errorIdOf(id, confirm)} className={className} role="alert">
      {message}
    </small>
  );
};

PasswordPolicyError.propTypes = {
  field: PropTypes.shape({
    errorMessage: PropTypes.string,
    confirmErrorMessage: PropTypes.string
  }).isRequired,
  confirm: PropTypes.bool,
  id: PropTypes.string,
  className: PropTypes.string
};


/**
 * 정책 힌트 문구만.
 */
export const PasswordPolicyHint = ({ field, id, className = PASSWORD_POLICY_CSS.HELP }) => (
  <small id={hintIdOf(id)} className={className}>
    {field.hint}
  </small>
);

PasswordPolicyHint.propTypes = {
  field: PropTypes.shape({ hint: PropTypes.string }).isRequired,
  id: PropTypes.string,
  className: PropTypes.string
};


const PasswordPolicyInput = ({
  field,
  confirm = false,
  revealed = false,
  showHint = true,
  showError = true,
  id,
  className = PASSWORD_POLICY_CSS.INPUT,
  errorInputClassName = PASSWORD_POLICY_CSS.INPUT_ERROR,
  hintClassName = PASSWORD_POLICY_CSS.HELP,
  errorClassName = PASSWORD_POLICY_CSS.ERROR,
  placeholder,
  autoComplete = PASSWORD_AUTOCOMPLETE.NEW,
  'aria-describedby': ariaDescribedBy,
  ...rest
}) => {
  const message = confirm ? field.confirmErrorMessage : field.errorMessage;
  const hasError = Boolean(message);
  const withHint = showHint && !confirm;
  const inputClassName = hasError && errorInputClassName ? `${className} ${errorInputClassName}` : className;
  const resolvedPlaceholder = placeholder !== undefined ? placeholder : (confirm ? undefined : field.placeholder);

  return (
    <>
      <input
        {...rest}
        id={id}
        type={revealed ? 'text' : 'password'}
        className={inputClassName}
        placeholder={resolvedPlaceholder}
        autoComplete={autoComplete}
        aria-invalid={hasError ? true : undefined}
        aria-describedby={joinIds(
          hasError ? errorIdOf(id, confirm) : null,
          withHint ? hintIdOf(id) : null,
          ariaDescribedBy
        )}
      />
      {withHint ? <PasswordPolicyHint field={field} id={id} className={hintClassName} /> : null}
      {showError ? (
        <PasswordPolicyError field={field} confirm={confirm} id={id} className={errorClassName} />
      ) : null}
    </>
  );
};

PasswordPolicyInput.propTypes = {
  field: PropTypes.shape({
    errorMessage: PropTypes.string,
    confirmErrorMessage: PropTypes.string,
    hint: PropTypes.string,
    placeholder: PropTypes.string
  }).isRequired,
  confirm: PropTypes.bool,
  revealed: PropTypes.bool,
  showHint: PropTypes.bool,
  showError: PropTypes.bool,
  id: PropTypes.string,
  className: PropTypes.string,
  errorInputClassName: PropTypes.string,
  hintClassName: PropTypes.string,
  errorClassName: PropTypes.string,
  placeholder: PropTypes.string,
  autoComplete: PropTypes.string,
  'aria-describedby': PropTypes.string
};


export default PasswordPolicyInput;
