/**
 * MindGarden 디자인 시스템 v2.0 - Checkbox Component
 */

import React from 'react';

const Checkbox = ({
  label,
  checked,
  onChange,
  className = '',
  ...props
}) => {
  return (
    <label className={`mg-checkbox ${className}`.trim()}>
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        {...props}
      />
      {label && <span>{label}</span>}
    </label>
  );
};

export default Checkbox;

