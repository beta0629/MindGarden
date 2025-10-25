import React from 'react';

const Input = ({type = 'text',
  placeholder = '',
  value = '',
  onChange,
  disabled = false,
  className = '',
  ...props}) => {return (<input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      disabled={disabled}
      className={`mg-v2-input ${className}`.trim()}
      {...props}
    />);};

export default Input;
