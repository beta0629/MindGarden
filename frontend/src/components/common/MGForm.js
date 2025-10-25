import React from 'react';

/**
 * MindGarden 폼 컴포넌트
 * 통합 폼 입력 컴포넌트
 */
const MGForm = ({
  children,
  onSubmit = null,
  className = '',
  variant = 'default', // 'default', 'card', 'minimal'
  size = 'medium', // 'small', 'medium', 'large'
  loading = false,
  disabled = false,
  ...props
}) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!loading && !disabled && onSubmit) {
      onSubmit(e);
    }
  };

  const getFormClasses = () => {
    const variantClasses = {
      default: "space-y-4",
      card: "bg-[#F5F5DC] p-6 rounded-xl border border-[#D2B48C]/20 shadow-sm space-y-4",
      minimal: "space-y-2",
    };

    const sizeClasses = {
      small: "text-sm",
      medium: "text-base",
      large: "text-lg",
    };

    return [
      variantClasses[variant] || variantClasses.default,
      sizeClasses[size] || sizeClasses.medium,
      loading ? 'opacity-50 pointer-events-none' : '',
      disabled ? 'opacity-50 pointer-events-none' : '',
      className
    ].filter(Boolean).join(' ');
  };

  return (
    <form
      className={getFormClasses()}
      onSubmit={handleSubmit}
      {...props}
    >
      {loading && (
        <div className="absolute inset-0 bg-white/50 flex items-center justify-center rounded-xl">
          <div className="animate-spin text-[#D2B48C]">⟳</div>
        </div>
      )}
      {children}
    </form>
  );
};

/**
 * 폼 그룹 컴포넌트
 */
export const MGFormGroup = ({
  children,
  label = '',
  required = false,
  error = '',
  help = '',
  className = '',
  ...props
}) => {
  return (
    <div className={`space-y-2 ${className}`} {...props}>
      {label && (
        <label className="block text-sm font-medium text-[#6B7C32]">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        {children}
      </div>
      {help && !error && (
        <div className="text-xs text-[#9CAF88]">
          {help}
        </div>
      )}
      {error && (
        <div className="flex items-center gap-1 text-xs text-red-500">
          <span>⚠️</span>
          {error}
        </div>
      )}
    </div>
  );
};

/**
 * 폼 입력 컴포넌트
 */
export const MGFormInput = ({
  type = 'text',
  name,
  value,
  onChange,
  placeholder = '',
  label = '',
  required = false,
  disabled = false,
  error = '',
  help = '',
  icon = null,
  rightElement = null,
  className = '',
  ...props
}) => {
  const inputId = `mg-input-${name || Math.random().toString(36).substr(2, 9)}`;

  return (
    <MGFormGroup
      label={label}
      required={required}
      error={error}
      help={help}
    >
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CAF88]">
            {icon}
          </div>
        )}
        <input
          id={inputId}
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className={`
            w-full px-3 py-2 rounded-lg border border-[#D2B48C] 
            focus:border-[#6B7C32] focus:ring-2 focus:ring-[#6B7C32]/20 
            bg-[#F5F5DC] text-[#6B7C32] placeholder-[#9CAF88]
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-all duration-200
            ${icon ? 'pl-10' : ''}
            ${rightElement ? 'pr-10' : ''}
            ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}
            ${className}
          `}
          {...props}
        />
        {rightElement && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CAF88]">
            {rightElement}
          </div>
        )}
      </div>
    </MGFormGroup>
  );
};

/**
 * 폼 텍스트에어리어 컴포넌트
 */
export const MGFormTextarea = ({
  name,
  value,
  onChange,
  placeholder = '',
  label = '',
  required = false,
  disabled = false,
  error = '',
  help = '',
  rows = 4,
  className = '',
  ...props
}) => {
  const textareaId = `mg-v2-textarea-${name || Math.random().toString(36).substr(2, 9)}`;

  return (
    <MGFormGroup
      label={label}
      required={required}
      error={error}
      help={help}
    >
      <textarea
        id={textareaId}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        rows={rows}
        className={`
          w-full px-3 py-2 rounded-lg border border-[#D2B48C] 
          focus:border-[#6B7C32] focus:ring-2 focus:ring-[#6B7C32]/20 
          bg-[#F5F5DC] text-[#6B7C32] placeholder-[#9CAF88]
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-all duration-200 resize-vertical
          ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}
          ${className}
        `}
        {...props}
      />
    </MGFormGroup>
  );
};

/**
 * 폼 셀렉트 컴포넌트
 */
export const MGFormSelect = ({
  name,
  value,
  onChange,
  options = [],
  placeholder = '선택하세요',
  label = '',
  required = false,
  disabled = false,
  error = '',
  help = '',
  className = '',
  ...props
}) => {
  const selectId = `mg-select-${name || Math.random().toString(36).substr(2, 9)}`;

  return (
    <MGFormGroup
      label={label}
      required={required}
      error={error}
      help={help}
    >
      <div className="relative">
        <select
          id={selectId}
          name={name}
          value={value}
          onChange={onChange}
          disabled={disabled}
          required={required}
          className={`
            w-full px-3 py-2 pr-10 rounded-lg border border-[#D2B48C] 
            focus:border-[#6B7C32] focus:ring-2 focus:ring-[#6B7C32]/20 
            bg-[#F5F5DC] text-[#6B7C32] 
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-all duration-200 appearance-none
            ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}
            ${className}
          `}
          {...props}
        >
          <option value="">{placeholder}</option>
          {options.map((option, index) => (
            <option key={index} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CAF88] pointer-events-none">▼</div>
      </div>
    </MGFormGroup>
  );
};

export default MGForm;



