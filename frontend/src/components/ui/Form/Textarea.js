/**
 * MindGarden 디자인 시스템 v2.0 - Textarea Component
 */

import React from 'react';

const Textarea = ({
  label,
  placeholder,
  error,
  required = false,
  rows = 4,
  className = '',
  ...props
}) => {
  return (
    <div className={`mg-form-group ${className}`.trim()}>
      {label && (
        <label className="mg-v2-label">
          {label}
          {required && <span className="mg-required">*</span>}
        </label>
      )}
      <textarea
        className={`mg-v2-textarea ${error ? 'mg-input-error' : ''}`.trim()}
        placeholder={placeholder}
        required={required}
        rows={rows}
        {...props}
      />
      {error && <span className="mg-form-error">{error}</span>}
    </div>
  );
};

export default Textarea;

