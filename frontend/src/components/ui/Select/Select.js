import React from 'react';

const Select = ({children,
  value = '',
  onChange,
  disabled = false,
  className = '',
  ...props}) => {return (<select
      value={value}
      onChange={onChange}
      disabled={disabled}
      className={`mg-v2-select ${className}`.trim()}
      {...props}
    >
      {children}
    </select>);};

export default Select;
