/**
 * 학원 시스템 - 공통 폼 필드 컴포넌트
 * 재사용 가능한 폼 필드 래퍼
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-19
 */

import React from 'react';
import Input from '../../ui/Form/Input';
import Select from '../../ui/Form/Select';
import Textarea from '../../ui/Form/Textarea';
import './FormField.css';

/**
 * 공통 폼 필드 컴포넌트
 * Input, Select, Textarea를 통합한 래퍼
 */
const FormField = ({
  type = 'text',
  label,
  name,
  value,
  onChange,
  options = [],
  required = false,
  disabled = false,
  error = null,
  placeholder = '',
  min = null,
  max = null,
  step = null,
  rows = 4,
  className = '',
  ...props
}) => {
  const fieldId = `field-${name}`;
  const fieldError = error || '';

  const commonProps = {
    id: fieldId,
    name,
    value: value || '',
    onChange,
    required,
    disabled,
    placeholder,
    error: fieldError,
    className: `academy-form-field ${className}`.trim(),
    ...props
  };

  // Select 타입
  if (type === 'select') {
    return (
      <div className="academy-form-group">
        <label htmlFor={fieldId} className="academy-form-label">
          {label}
          {required && <span className="academy-required">*</span>}
        </label>
        <Select {...commonProps}>
          {options.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
        {fieldError && <span className="academy-form-error">{fieldError}</span>}
      </div>
    );
  }

  // Textarea 타입
  if (type === 'textarea') {
    return (
      <div className="academy-form-group">
        <label htmlFor={fieldId} className="academy-form-label">
          {label}
          {required && <span className="academy-required">*</span>}
        </label>
        <Textarea
          {...commonProps}
          rows={rows}
        />
        {fieldError && <span className="academy-form-error">{fieldError}</span>}
      </div>
    );
  }

  // Input 타입 (text, number, date, email, password 등)
  const inputProps = {
    ...commonProps,
    type,
  };

  if (type === 'number') {
    if (min !== null) inputProps.min = min;
    if (max !== null) inputProps.max = max;
    if (step !== null) inputProps.step = step;
  }

  return (
    <div className="academy-form-group">
      <Input
        {...inputProps}
        label={label}
      />
    </div>
  );
};

export default FormField;

