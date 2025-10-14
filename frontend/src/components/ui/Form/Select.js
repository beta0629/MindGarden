/**
 * MindGarden 디자인 시스템 v2.0 - Select Component
 */

import React from 'react';

const Select = ({
  label,
  options = [],
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
      <select
        className={`mg-select ${error ? 'mg-input-error' : ''}`.trim()}
        required={required}
        {...props}
      >
        {options.map((option, index) => (
          <option key={index} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <span className="mg-form-error">{error}</span>}
    </div>
  );
};

export default Select;

