import React from 'react';
import './BadgeSelect.css';

/**
 * 배지(칩) 기반 단일/다중 선택 컴포넌트
 * - CustomSelect와 API 호환 (options, value, onChange)
 * - 드롭다운 없이 인라인 배지로 표시 — 모달 내 z-index/스크롤 이슈 회피
 *
 * @author Core Solution
 * @since 2026-03-05
 */
const BadgeSelect = ({
  options = [],
  value = '',
  onChange,
  multiple = false,
  disabled = false,
  loading = false,
  error = false,
  size = 'default',
  className = '',
  placeholder = '선택하세요',
  'aria-label': ariaLabel
}) => {
  const safeOptions = Array.isArray(options) ? options : [];
  let currentValue;
  if (multiple) {
    currentValue = Array.isArray(value) ? value : value ? [value] : [];
  } else {
    currentValue = value;
  }

  // option.value는 렌더 시 String()으로 통일됨. 부모가 number(예: paymentDay)를 넘기면
  // 5 === "5" 가 false가 되어 선택 표시·aria-checked가 항상 틀어지므로 문자열로 맞춤.
  // multiple: value 배열에 number·string이 섞여도 includes/!== 만으로는 불일치 → 동일 정책 적용.
  const isSelected = (optionValue) => {
    const optStr = String(optionValue);
    return multiple
      ? currentValue.some((v) => String(v) === optStr)
      : String(currentValue) === optStr;
  };

  const handleClick = (optionValue) => {
    if (disabled || loading) return;
    if (multiple) {
      const optStr = String(optionValue);
      const next = isSelected(optionValue)
        ? currentValue.filter((v) => String(v) !== optStr)
        : [...currentValue, optionValue];
      onChange(next);
    } else {
      onChange(optionValue);
    }
  };

  const handleKeyDown = (e, optionValue) => {
    if (disabled || loading) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick(optionValue);
    }
  };

  const role = multiple ? 'group' : 'radiogroup';
  const itemRole = multiple ? 'checkbox' : 'radio';

  const sizeModifier = size === 'small' ? 'mg-v2-badge-select--small' : '';
  if (loading) {
    return (
      <div
        className={`mg-v2-badge-select mg-v2-badge-select--loading ${sizeModifier} ${className}`.trim()}
        role={role}
        aria-label={ariaLabel}
        aria-busy="true"
      >
        <span className="mg-v2-badge-select__placeholder">{placeholder}</span>
        <span className="mg-v2-badge-select__loading-text">로딩 중...</span>
      </div>
    );
  }

  if (safeOptions.length === 0) {
    return (
      <div
        className={`mg-v2-badge-select mg-v2-badge-select--empty ${sizeModifier} ${error ? 'mg-v2-badge-select--error' : ''} ${className}`.trim()}
        role={role}
        aria-label={ariaLabel}
      >
        <span className="mg-v2-badge-select__placeholder">{placeholder}</span>
      </div>
    );
  }

  return (
    <div
      className={`mg-v2-badge-select ${sizeModifier} ${error ? 'mg-v2-badge-select--error' : ''} ${disabled ? 'mg-v2-badge-select--disabled' : ''} ${className}`.trim()}
      role={role}
      aria-label={ariaLabel}
      aria-disabled={disabled}
    >
      {safeOptions.map((option) => {
        const isValid = option && (option.value !== undefined || option.label !== undefined);
        if (isValid) {
          const optValue = option.value !== undefined ? String(option.value) : '';
          const label = option.label != null ? String(option.label) : optValue;
          const selected = isSelected(optValue);

          return (
            <button
              key={optValue}
              type="button"
              role={itemRole}
              aria-checked={selected}
              aria-disabled={disabled}
              tabIndex={disabled ? -1 : 0}
              className={`mg-v2-badge-select__item ${selected ? 'mg-v2-badge-select__item--selected' : ''} ${disabled ? 'mg-v2-badge-select__item--disabled' : ''}`}
              onClick={() => handleClick(optValue)}
              onKeyDown={(e) => handleKeyDown(e, optValue)}
            >
              {option.icon != null && <span className="mg-v2-badge-select__item-icon" aria-hidden>{option.icon}</span>}
              <span className="mg-v2-badge-select__item-label">{label}</span>
            </button>
          );
        }
        return null;
      })}
    </div>
  );
};

export default BadgeSelect;
