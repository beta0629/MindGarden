/**
 * ChipMultiSelect — 다중선택 + 칩(태그) 표시 공통 molecule.
 *
 * <p>드롭다운 클릭 → 옵션 목록 펼침. 선택된 항목은 입력 영역에 칩(태그) 으로 표시되며
 * 각 칩의 × 버튼으로 즉시 제거할 수 있다. 외부 라이브러리 의존성 없이 자체 구현.</p>
 *
 * <ul>
 *   <li>아토믹 디자인: 선택 칩(atom) + 드롭다운 listbox(molecule) 조합</li>
 *   <li>a11y: combobox + aria-multiselectable + 칩 제거 aria-label</li>
 *   <li>모바일: 칩 wrap, 드롭다운 풀폭 (CSS)</li>
 * </ul>
 *
 * @author Core Solution
 * @author MindGarden
 * @since 2026-05-24
 */

import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import './ChipMultiSelect.css';

const KEY_ENTER = 'Enter';
const KEY_SPACE = ' ';
const KEY_ESCAPE = 'Escape';
const KEY_ARROW_DOWN = 'ArrowDown';
const KEY_ARROW_UP = 'ArrowUp';
const KEY_BACKSPACE = 'Backspace';

const isOpenKey = (key) => key === KEY_ENTER || key === KEY_SPACE || key === KEY_ARROW_DOWN;

const ChipMultiSelect = ({
  id,
  options = [],
  value = [],
  onChange,
  placeholder = '선택하세요',
  emptyOptionsText = '선택할 항목이 없습니다.',
  disabled = false,
  ariaLabel,
  ariaLabelledBy,
  formatRemoveLabel,
  className = ''
}) => {
  const safeOptions = useMemo(() => (Array.isArray(options) ? options : []), [options]);
  const safeValue = useMemo(() => (Array.isArray(value) ? value : []), [value]);

  const reactId = useId();
  const componentId = id || `mg-chip-multi-${reactId.replace(/:/g, '')}`;
  const listboxId = `${componentId}-listbox`;

  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const containerRef = useRef(null);
  const triggerRef = useRef(null);
  const listboxRef = useRef(null);

  const selectedSet = useMemo(() => new Set(safeValue.map((v) => String(v))), [safeValue]);

  const isSelected = useCallback(
    (optionValue) => selectedSet.has(String(optionValue)),
    [selectedSet]
  );

  const toggleValue = useCallback(
    (optionValue) => {
      if (disabled) {
        return;
      }
      const optStr = String(optionValue);
      const next = isSelected(optionValue)
        ? safeValue.filter((v) => String(v) !== optStr)
        : [...safeValue, optionValue];
      onChange?.(next);
    },
    [disabled, isSelected, onChange, safeValue]
  );

  const removeValue = useCallback(
    (optionValue) => {
      if (disabled) {
        return;
      }
      const optStr = String(optionValue);
      const next = safeValue.filter((v) => String(v) !== optStr);
      onChange?.(next);
    },
    [disabled, onChange, safeValue]
  );

  const closeDropdown = useCallback(() => {
    setIsOpen(false);
    setActiveIndex(-1);
  }, []);

  const openDropdown = useCallback(() => {
    if (disabled || safeOptions.length === 0) {
      return;
    }
    setIsOpen(true);
    setActiveIndex((prev) => (prev >= 0 ? prev : 0));
  }, [disabled, safeOptions.length]);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        closeDropdown();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, closeDropdown]);

  const handleTriggerKeyDown = (event) => {
    if (disabled) {
      return;
    }
    const { key } = event;
    if (isOpenKey(key)) {
      event.preventDefault();
      openDropdown();
      return;
    }
    if (key === KEY_ESCAPE && isOpen) {
      event.preventDefault();
      closeDropdown();
      return;
    }
    if (key === KEY_BACKSPACE && safeValue.length > 0 && !isOpen) {
      event.preventDefault();
      const last = safeValue[safeValue.length - 1];
      removeValue(last);
    }
  };

  const handleListboxKeyDown = (event) => {
    if (disabled) {
      return;
    }
    const { key } = event;
    const total = safeOptions.length;
    if (total === 0) {
      return;
    }
    if (key === KEY_ARROW_DOWN) {
      event.preventDefault();
      setActiveIndex((prev) => (prev + 1) % total);
      return;
    }
    if (key === KEY_ARROW_UP) {
      event.preventDefault();
      setActiveIndex((prev) => (prev - 1 + total) % total);
      return;
    }
    if (key === KEY_ENTER || key === KEY_SPACE) {
      event.preventDefault();
      const idx = activeIndex >= 0 ? activeIndex : 0;
      const option = safeOptions[idx];
      if (option) {
        toggleValue(option.value);
      }
      return;
    }
    if (key === KEY_ESCAPE) {
      event.preventDefault();
      closeDropdown();
      triggerRef.current?.focus();
    }
  };

  useEffect(() => {
    if (isOpen) {
      listboxRef.current?.focus();
    }
  }, [isOpen]);

  const renderChip = (selectedValue) => {
    const matched = safeOptions.find((opt) => String(opt.value) === String(selectedValue));
    // 칩(chip)은 compact 표시를 위해 chipLabel 우선, 없으면 label, 없으면 raw value
    const chipText = matched?.chipLabel != null
      ? matched.chipLabel
      : (matched?.label != null ? matched.label : String(selectedValue));
    const removeAriaLabel = typeof formatRemoveLabel === 'function'
      ? formatRemoveLabel(chipText, selectedValue)
      : `${chipText} 제거`;

    return (
      <span
        key={String(selectedValue)}
        className="mg-chip-multi-select__chip"
        data-deprecated={matched?.deprecated ? 'true' : undefined}
      >
        <span className="mg-chip-multi-select__chip-label">{chipText}</span>
        <button
          type="button"
          className="mg-chip-multi-select__chip-remove"
          onClick={(event) => {
            event.stopPropagation();
            removeValue(selectedValue);
          }}
          aria-label={removeAriaLabel}
          disabled={disabled}
        >
          <span aria-hidden="true">×</span>
        </button>
      </span>
    );
  };

  const renderOption = (option, idx) => {
    const optStr = String(option.value);
    const selected = isSelected(option.value);
    const active = idx === activeIndex;
    return (
      <li
        key={optStr}
        id={`${componentId}-option-${optStr}`}
        role="option"
        aria-selected={selected}
        className={[
          'mg-chip-multi-select__option',
          selected ? 'mg-chip-multi-select__option--selected' : '',
          active ? 'mg-chip-multi-select__option--active' : ''
        ].filter(Boolean).join(' ')}
        onMouseEnter={() => setActiveIndex(idx)}
        onClick={() => toggleValue(option.value)}
      >
        <span
          className="mg-chip-multi-select__option-checkbox"
          aria-hidden="true"
          data-checked={selected ? 'true' : 'false'}
        />
        <span className="mg-chip-multi-select__option-label">{option.label}</span>
      </li>
    );
  };

  const triggerClassName = [
    'mg-chip-multi-select__trigger',
    isOpen ? 'mg-chip-multi-select__trigger--open' : '',
    disabled ? 'mg-chip-multi-select__trigger--disabled' : '',
    safeValue.length === 0 ? 'mg-chip-multi-select__trigger--empty' : ''
  ].filter(Boolean).join(' ');

  return (
    <div
      ref={containerRef}
      className={['mg-chip-multi-select', className].filter(Boolean).join(' ')}
      data-disabled={disabled ? 'true' : undefined}
    >
      {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events */}
      <div
        ref={triggerRef}
        id={componentId}
        role="combobox"
        tabIndex={disabled ? -1 : 0}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        aria-disabled={disabled}
        className={triggerClassName}
        onClick={() => {
          if (isOpen) {
            closeDropdown();
          } else {
            openDropdown();
          }
        }}
        onKeyDown={handleTriggerKeyDown}
      >
        <div className="mg-chip-multi-select__chips">
          {safeValue.length === 0 ? (
            <span className="mg-chip-multi-select__placeholder">{placeholder}</span>
          ) : (
            safeValue.map(renderChip)
          )}
        </div>
        <span className={`mg-chip-multi-select__caret ${isOpen ? 'mg-chip-multi-select__caret--open' : ''}`} aria-hidden="true">
          ▾
        </span>
      </div>

      {isOpen && (
        <ul
          ref={listboxRef}
          id={listboxId}
          role="listbox"
          aria-multiselectable="true"
          aria-label={ariaLabel}
          tabIndex={-1}
          className="mg-chip-multi-select__listbox"
          onKeyDown={handleListboxKeyDown}
        >
          {safeOptions.length === 0 ? (
            <li className="mg-chip-multi-select__empty" role="presentation">
              {emptyOptionsText}
            </li>
          ) : (
            safeOptions.map(renderOption)
          )}
        </ul>
      )}
    </div>
  );
};

export default ChipMultiSelect;
