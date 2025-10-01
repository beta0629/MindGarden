import React from 'react';
import '../../styles/main.css';
import './FormInput.css';

/**
 * 공통 폼 입력 컴포넌트
 * 
 * @param {Object} props
 * @param {string} props.type - 입력 타입
 * @param {string} props.name - 입력 필드명
 * @param {string} props.value - 입력 값
 * @param {function} props.onChange - 변경 핸들러
 * @param {string} props.placeholder - 플레이스홀더
 * @param {string} props.label - 라벨
 * @param {boolean} props.required - 필수 여부
 * @param {boolean} props.disabled - 비활성화 여부
 * @param {string} props.error - 에러 메시지
 * @param {React.ReactNode} props.rightElement - 우측 요소 (예: 비밀번호 토글)
 */
const FormInput = ({
  type = 'text',
  name,
  value,
  onChange,
  placeholder,
  label,
  required = false,
  disabled = false,
  error,
  rightElement,
  ...props
}) => {
  const inputId = `input-${name}`;

  return (
    <div className="form-input-wrapper">
      {label && (
        <label 
          htmlFor={inputId}
          className={`form-input-label ${error ? 'form-input-label--error' : ''}`}
        >
          {label}
          {required && (
            <span className="form-input-required">*</span>
          )}
        </label>
      )}
      
      <div className="form-input-container">
        <input
          id={inputId}
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className={`form-input ${rightElement ? 'form-input--with-right-element' : ''} ${error ? 'form-input--error' : ''} ${disabled ? 'form-input--disabled' : ''}`}
          {...props}
        />
        
        {rightElement && (
          <div className="form-input-right-element">
            {rightElement}
          </div>
        )}
      </div>
      
      {error && (
        <p className="form-input-error">
          <i className="bi bi-exclamation-circle form-input-error-icon"></i>
          {error}
        </p>
      )}
    </div>
  );
};

export default FormInput;
