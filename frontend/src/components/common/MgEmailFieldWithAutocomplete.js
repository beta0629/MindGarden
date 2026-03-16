import React, { useState, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';
import { EMAIL_DOMAINS } from '../../constants/emailDomains';
import './MgEmailFieldWithAutocomplete.css';

const DEFAULT_PLACEHOLDER = 'example@email.com';

/**
 * 이메일 input + 자동완성(datalist 또는 custom-dropdown) 코어 컴포넌트.
 * .mg-v2-form-email-row 내부 __input-wrap 에 배치해 사용.
 * @param {Object} props
 * @param {string} props.value - 입력값
 * @param {function} props.onChange - (e) => void
 * @param {string} [props.placeholder] - placeholder (기본 example@email.com)
 * @param {boolean} [props.disabled] - 비활성화
 * @param {string} props.id - input id (label for, 접근성)
 * @param {string} props.name - input name (폼 제출 키)
 * @param {boolean} [props.required] - 필수
 * @param {string[]} [props.domains] - 도메인 목록 (기본 EMAIL_DOMAINS)
 * @param {'datalist'|'custom-dropdown'} [props.autocompleteMode] - 자동완성 방식 (기본 datalist)
 * @param {string} [props.label] - 라벨 텍스트 (선택, 부모에서 label 렌더 시 생략 가능)
 * @param {string} [props.ariaDescribedBy] - 도움말/에러 id
 * @param {boolean} [props.ariaInvalid] - 유효성 오류 시 true
 * @param {function} [props.onBlur] - input blur 핸들러
 * @param {string} [props.className] - 루트 추가 클래스
 */
const MgEmailFieldWithAutocomplete = ({
  value,
  onChange,
  placeholder = DEFAULT_PLACEHOLDER,
  disabled = false,
  id,
  name,
  required = false,
  domains = EMAIL_DOMAINS,
  autocompleteMode = 'datalist',
  label,
  ariaDescribedBy,
  ariaInvalid,
  onBlur,
  className = ''
}) => {
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const listboxId = `${id}-suggestions`;
  const inputRef = useRef(null);
  const listRef = useRef(null);

  const datalistId = autocompleteMode === 'datalist' ? `${id}-domains` : null;

  const prefix = value?.includes?.('@')
    ? (value.slice(0, value.indexOf('@')).trim() || 'example')
    : (value?.trim() || 'example');
  const suggestionOptions = domains.map((d) => prefix + d);

  const handleInputChange = useCallback(
    (e) => {
      onChange(e);
      if (autocompleteMode === 'custom-dropdown') {
        setSuggestionsOpen(true);
        setHighlightedIndex(-1);
      }
    },
    [onChange, autocompleteMode]
  );

  const handleFocus = useCallback(() => {
    if (autocompleteMode === 'custom-dropdown') {
      setSuggestionsOpen(true);
      setHighlightedIndex(-1);
    }
  }, [autocompleteMode]);

  const handleBlur = useCallback(
    (e) => {
      if (autocompleteMode === 'custom-dropdown') {
        setTimeout(() => setSuggestionsOpen(false), 150);
      }
      onBlur?.(e);
    },
    [autocompleteMode, onBlur]
  );

  const selectSuggestion = useCallback(
    (fullEmail) => {
      onChange({ target: { name, value: fullEmail } });
      setSuggestionsOpen(false);
      setHighlightedIndex(-1);
      inputRef.current?.focus();
    },
    [name, onChange]
  );

  const handleKeyDown = useCallback(
    (e) => {
      if (autocompleteMode !== 'custom-dropdown' || !suggestionsOpen) return;
      if (e.key === 'Escape') {
        setSuggestionsOpen(false);
        setHighlightedIndex(-1);
        e.preventDefault();
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlightedIndex((i) =>
          i < suggestionOptions.length - 1 ? i + 1 : 0
        );
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlightedIndex((i) =>
          i <= 0 ? suggestionOptions.length - 1 : i - 1
        );
        return;
      }
      if (e.key === 'Enter' && highlightedIndex >= 0 && suggestionOptions[highlightedIndex]) {
        e.preventDefault();
        selectSuggestion(suggestionOptions[highlightedIndex]);
      }
    },
    [
      autocompleteMode,
      suggestionsOpen,
      highlightedIndex,
      suggestionOptions,
      selectSuggestion
    ]
  );

  const rootClass = [
    'mg-v2-email-field',
    className,
    ariaInvalid ? 'mg-v2-email-field--has-error' : ''
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={rootClass}>
      {label && (
        <label htmlFor={id} className="mg-v2-form-label">
          {label}
        </label>
      )}
      <div className="mg-v2-email-field__input-wrap" style={{ position: 'relative' }}>
        <input
          ref={inputRef}
          type="email"
          id={id}
          name={name}
          value={value}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          autoComplete="email"
          className="mg-v2-form-input"
          list={datalistId}
          aria-invalid={ariaInvalid}
          aria-describedby={ariaDescribedBy}
          aria-expanded={autocompleteMode === 'custom-dropdown' ? suggestionsOpen : undefined}
          aria-controls={autocompleteMode === 'custom-dropdown' && suggestionsOpen ? listboxId : undefined}
          aria-activedescendant={
            autocompleteMode === 'custom-dropdown' && highlightedIndex >= 0 && suggestionOptions[highlightedIndex]
              ? `${listboxId}-${highlightedIndex}`
              : undefined
          }
          aria-autocomplete={autocompleteMode === 'custom-dropdown' ? 'list' : undefined}
        />
        {autocompleteMode === 'datalist' && (
          <datalist id={datalistId}>
            {domains.map((domain) => (
              <option key={domain} value={domain} />
            ))}
          </datalist>
        )}
        {autocompleteMode === 'custom-dropdown' && suggestionsOpen && (
          <ul
            ref={listRef}
            id={listboxId}
            className="mg-v2-email-field__suggestions"
            role="listbox"
            aria-label="이메일 도메인 제안"
          >
            {suggestionOptions.map((fullEmail, idx) => (
              <li
                key={fullEmail}
                id={`${listboxId}-${idx}`}
                role="option"
                aria-selected={idx === highlightedIndex}
                className={`mg-v2-email-field__suggestion-item ${idx === highlightedIndex ? 'mg-v2-email-field__suggestion-item--highlighted' : ''}`}
                onMouseDown={(e) => {
                  e.preventDefault();
                  selectSuggestion(fullEmail);
                }}
              >
                {fullEmail}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

MgEmailFieldWithAutocomplete.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  disabled: PropTypes.bool,
  id: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  required: PropTypes.bool,
  domains: PropTypes.arrayOf(PropTypes.string),
  autocompleteMode: PropTypes.oneOf(['datalist', 'custom-dropdown']),
  label: PropTypes.string,
  ariaDescribedBy: PropTypes.string,
  ariaInvalid: PropTypes.bool,
  onBlur: PropTypes.func,
  className: PropTypes.string
};

export default MgEmailFieldWithAutocomplete;
