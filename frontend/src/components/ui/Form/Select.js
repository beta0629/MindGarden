/**
 * Core Solution 디자인 시스템 v2.0 - Select Component
 */

import React from 'react';
import { toDisplayString } from '../../../utils/safeDisplay';

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
        <label className="mg-v2-label">
          {toDisplayString(label)}
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
            {toDisplayString(option.label)}
          </option>
        ))}
      </select>
      {error && <span className="mg-form-error">{error}</span>}
    </div>
  );
};

export default Select;

