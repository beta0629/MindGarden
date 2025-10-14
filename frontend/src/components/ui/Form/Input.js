/**
 * MindGarden 디자인 시스템 v2.0 - Input Component
 * 
 * @reference /docs/design-system-v2/IMPLEMENTATION_PLAN.md (Phase 1.2)
 */

import React from 'react';

/**
 * 재사용 가능한 Input 컴포넌트
 * 
 * @param {Object} props
 * @param {string} [props.label] - 라벨 텍스트
 * @param {string} [props.type='text'] - Input 타입
 * @param {string} [props.placeholder] - Placeholder
 * @param {string} [props.error] - 에러 메시지
 * @param {boolean} [props.required=false] - 필수 여부
 * @param {string} [props.className=''] - 추가 CSS 클래스
 * 
 * @example
 * <Input
 *   label="이메일"
 *   type="email"
 *   placeholder="example@email.com"
 *   error="유효한 이메일을 입력하세요"
 *   required
 * />
 */
const Input = ({
  label,
  type = 'text',
  placeholder,
  error,
  required = false,
  className = '',
  ...props
}) => {
  return (
    <div className={`mg-form-group ${className}`.trim()}>
      {label && (
        <label className="mg-label">
          {label}
          {required && <span className="mg-required">*</span>}
        </label>
      )}
      <input
        type={type}
        className={`mg-input ${error ? 'mg-input-error' : ''}`.trim()}
        placeholder={placeholder}
        required={required}
        {...props}
      />
      {error && <span className="mg-form-error">{error}</span>}
    </div>
  );
};

export default Input;

