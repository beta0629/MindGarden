import React, { useCallback, useRef } from 'react';
import {
  formatIsoDateForDisplay,
  ISO_DATE_DISPLAY_PLACEHOLDER
} from '../../utils/dateUtils';
import './MGDateInput.css';

const MG_DATE_INPUT_BASE_CLASS = 'mg-date-input';
const MG_DATE_INPUT_NATIVE_CLASS = 'mg-date-input__native';
const MG_DATE_INPUT_DISPLAY_CLASS = 'mg-date-input__display';

/**
 * Native date input with Korean ISO display overlay (Clinic-OS-safe wrapper).
 * Keeps type="date" value/onChange as YYYY-MM-DD; only the visible text is localized.
 *
 * @author Core Solution
 * @since 2026-09-02
 */
const MGDateInput = ({
  id,
  name,
  value = '',
  onChange,
  disabled = false,
  required = false,
  className = '',
  min,
  max,
  'aria-label': ariaLabel,
  readOnly = false,
  placeholder = ISO_DATE_DISPLAY_PLACEHOLDER,
  displaySeparator = '-',
  ...rest
}) => {
  const inputRef = useRef(null);
  const isoValue = value || '';
  const displayText = formatIsoDateForDisplay(isoValue, {
    separator: displaySeparator,
    placeholder
  });
  const isPlaceholder = !isoValue;

  const openPicker = useCallback(() => {
    if (disabled || readOnly) {
      return;
    }
    const input = inputRef.current;
    if (!input) {
      return;
    }
    if (typeof input.showPicker === 'function') {
      try {
        input.showPicker();
        return;
      } catch {
        /* showPicker may throw if not user-gesture initiated */
      }
    }
    input.focus();
    input.click();
  }, [disabled, readOnly]);

  const wrapperClassName = [
    MG_DATE_INPUT_BASE_CLASS,
    disabled ? `${MG_DATE_INPUT_BASE_CLASS}--disabled` : '',
    readOnly ? `${MG_DATE_INPUT_BASE_CLASS}--readonly` : ''
  ]
    .filter(Boolean)
    .join(' ');

  const nativeClassName = [MG_DATE_INPUT_NATIVE_CLASS, className].filter(Boolean).join(' ');

  const displayClassName = [
    MG_DATE_INPUT_DISPLAY_CLASS,
    isPlaceholder ? `${MG_DATE_INPUT_DISPLAY_CLASS}--placeholder` : ''
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={wrapperClassName}
      onClick={openPicker}
      role="presentation"
    >
      <input
        ref={inputRef}
        id={id}
        type="date"
        name={name}
        value={isoValue}
        onChange={onChange}
        disabled={disabled}
        required={required}
        readOnly={readOnly}
        min={min}
        max={max}
        aria-label={ariaLabel}
        className={nativeClassName}
        {...rest}
      />
      <span className={displayClassName} aria-hidden="true">
        {displayText}
      </span>
    </div>
  );
};

export default MGDateInput;
