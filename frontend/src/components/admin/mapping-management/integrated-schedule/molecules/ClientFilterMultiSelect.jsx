/**
 * ClientFilterMultiSelect — 통합 스케줄 상단 컴팩트 내담자 다중 필터.
 *
 * <p>핵심 UX: 평소·선택多 모두 «상단 영역 height 증가 0».
 * - 트리거: 항상 단일 라인 칩-버튼 (`내담자 필터` placeholder | `내담자 N명` 압축 라벨 + ×).
 * - 드롭다운: ReactDOM.createPortal 로 띄움(z-index 안전), 검색 + 체크박스 리스트.</p>
 *
 * <p>ChipMultiSelect 재사용을 검토했으나 선택된 항목을 칩으로 inline 펼치므로
 * 다수 선택 시 wrap 되어 헤더 height 가 증가하는 회귀 위험이 있어, 본 페이지 전용으로 신설.
 * 단 a11y 패턴(combobox + aria-multiselectable + aria-controls)은 ChipMultiSelect 와 동일.</p>
 *
 * @author Core Solution
 * @author MindGarden
 * @since 2026-06-09
 */

import React, {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import PropTypes from 'prop-types';
import ReactDOM from 'react-dom';
import './ClientFilterMultiSelect.css';

const KEY_ENTER = 'Enter';
const KEY_SPACE = ' ';
const KEY_ESCAPE = 'Escape';
const KEY_ARROW_DOWN = 'ArrowDown';

const POPOVER_OFFSET_PX = 4;
const POPOVER_VIEWPORT_MARGIN_PX = 8;

const isOpenKey = (key) => key === KEY_ENTER || key === KEY_SPACE || key === KEY_ARROW_DOWN;

const normalizeSearchToken = (raw) => String(raw ?? '').trim().toLowerCase();

/**
 * 옵션 검색: 이름·전화·이메일 includes (case-insensitive).
 * - 토큰이 비어 있으면 전체 통과.
 */
const filterOptions = (options, rawToken) => {
  const token = normalizeSearchToken(rawToken);
  if (!token) {
    return options;
  }
  return options.filter((opt) => {
    const name = String(opt.name ?? '').toLowerCase();
    const phone = String(opt.phone ?? '').toLowerCase();
    const email = String(opt.email ?? '').toLowerCase();
    return name.includes(token) || phone.includes(token) || email.includes(token);
  });
};

const ClientFilterMultiSelect = ({
  id,
  options,
  value,
  onChange,
  triggerLabel,
  triggerSelectedLabel,
  searchPlaceholder,
  emptyOptionsText,
  clearAllLabel,
  doneLabel,
  ariaLabel,
  className,
  disabled
}) => {
  const safeOptions = useMemo(
    () => (Array.isArray(options) ? options : []),
    [options]
  );
  const safeValue = useMemo(() => (Array.isArray(value) ? value : []), [value]);

  const reactId = useId();
  const componentId = id || `mg-client-filter-${reactId.replace(/:/g, '')}`;
  const popoverId = `${componentId}-popover`;
  const searchInputId = `${componentId}-search`;
  const listboxId = `${componentId}-listbox`;

  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [popoverStyle, setPopoverStyle] = useState(null);

  const triggerRef = useRef(null);
  const popoverRef = useRef(null);
  const searchInputRef = useRef(null);

  const selectedSet = useMemo(
    () => new Set(safeValue.map((v) => String(v))),
    [safeValue]
  );

  const visibleOptions = useMemo(
    () => filterOptions(safeOptions, searchTerm),
    [safeOptions, searchTerm]
  );

  const isSelected = useCallback(
    (optionId) => selectedSet.has(String(optionId)),
    [selectedSet]
  );

  const closePopover = useCallback(() => {
    setIsOpen(false);
    setSearchTerm('');
  }, []);

  const openPopover = useCallback(() => {
    if (disabled) {
      return;
    }
    setIsOpen(true);
  }, [disabled]);

  const toggleId = useCallback(
    (optionId) => {
      if (disabled) {
        return;
      }
      const optStr = String(optionId);
      const numericId = Number(optionId);
      const nextValue = Number.isFinite(numericId) && String(numericId) === optStr
        ? numericId
        : optionId;
      const next = isSelected(optionId)
        ? safeValue.filter((v) => String(v) !== optStr)
        : [...safeValue, nextValue];
      if (typeof onChange === 'function') {
        onChange(next);
      }
    },
    [disabled, isSelected, onChange, safeValue]
  );

  const handleClearAll = useCallback(
    (event) => {
      if (event && typeof event.stopPropagation === 'function') {
        event.stopPropagation();
      }
      if (disabled) {
        return;
      }
      if (typeof onChange === 'function' && safeValue.length > 0) {
        onChange([]);
      }
    },
    [disabled, onChange, safeValue.length]
  );

  /**
   * 트리거 위치 기반으로 팝오버 좌표·폭 계산.
   * - 화면 우측 오버플로 시 right-align.
   * - 좁은 폭(480px 이하)에서는 트리거 폭과 동등하게.
   */
  const recalcPopoverPosition = useCallback(() => {
    if (!triggerRef.current) {
      return;
    }
    const rect = triggerRef.current.getBoundingClientRect();
    const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : rect.right;
    const minWidth = Math.max(rect.width, 240);
    // viewport 안 fit 보장 — 좁은 viewport(태블릿/모니터 zoom)에서도 옵션 텍스트 squash 방지.
    const maxFitWidth = Math.max(240, viewportWidth - POPOVER_VIEWPORT_MARGIN_PX * 2);
    const desiredWidth = Math.min(360, Math.max(minWidth, 280), maxFitWidth);
    let left = rect.left;
    if (left + desiredWidth + POPOVER_VIEWPORT_MARGIN_PX > viewportWidth) {
      left = Math.max(POPOVER_VIEWPORT_MARGIN_PX, viewportWidth - desiredWidth - POPOVER_VIEWPORT_MARGIN_PX);
    }
    const top = rect.bottom + POPOVER_OFFSET_PX;
    setPopoverStyle({
      position: 'fixed',
      top: `${top}px`,
      left: `${left}px`,
      width: `${desiredWidth}px`
    });
  }, []);

  useLayoutEffect(() => {
    if (!isOpen) {
      return undefined;
    }
    recalcPopoverPosition();
    const handleViewport = () => recalcPopoverPosition();
    window.addEventListener('resize', handleViewport);
    window.addEventListener('scroll', handleViewport, true);
    return () => {
      window.removeEventListener('resize', handleViewport);
      window.removeEventListener('scroll', handleViewport, true);
    };
  }, [isOpen, recalcPopoverPosition]);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }
    const handleClickOutside = (event) => {
      const target = event.target;
      if (triggerRef.current && triggerRef.current.contains(target)) {
        return;
      }
      if (popoverRef.current && popoverRef.current.contains(target)) {
        return;
      }
      closePopover();
    };
    const handleKey = (event) => {
      if (event.key === KEY_ESCAPE) {
        closePopover();
        if (triggerRef.current) {
          triggerRef.current.focus();
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKey);
    };
  }, [isOpen, closePopover]);

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const handleTriggerKeyDown = (event) => {
    if (disabled) {
      return;
    }
    if (isOpenKey(event.key)) {
      event.preventDefault();
      openPopover();
    }
  };

  const handleTriggerClick = (event) => {
    if (event && typeof event.stopPropagation === 'function') {
      event.stopPropagation();
    }
    if (isOpen) {
      closePopover();
    } else {
      openPopover();
    }
  };

  const selectedCount = safeValue.length;
  const hasSelection = selectedCount > 0;
  const compactLabel = hasSelection
    ? triggerSelectedLabel(selectedCount)
    : triggerLabel;

  const triggerClassName = [
    'mg-client-filter',
    'mg-client-filter--trigger',
    isOpen ? 'mg-client-filter--open' : '',
    hasSelection ? 'mg-client-filter--has-selection' : 'mg-client-filter--empty',
    disabled ? 'mg-client-filter--disabled' : '',
    className || ''
  ].filter(Boolean).join(' ');

  const renderOption = (option) => {
    const optStr = String(option.id);
    const selected = isSelected(option.id);
    const optionLabel = option.name || option.label || `#${optStr}`;
    const phone = typeof option.phone === 'string' ? option.phone.trim() : '';
    const email = typeof option.email === 'string' ? option.email.trim() : '';
    const optionClass = [
      'mg-client-filter__option',
      selected ? 'mg-client-filter__option--selected' : ''
    ].filter(Boolean).join(' ');
    return (
      <li
        key={optStr}
        id={`${componentId}-option-${optStr}`}
        role="option"
        aria-selected={selected}
        className={optionClass}
        onClick={() => toggleId(option.id)}
      >
        <span
          className="mg-client-filter__option-checkbox"
          aria-hidden="true"
          data-checked={selected ? 'true' : 'false'}
        />
        <div className="mg-client-filter__option-text">
          <span className="mg-client-filter__option-name">{optionLabel}</span>
          {phone ? (
            <span className="mg-client-filter__option-meta mg-client-filter__option-meta--phone">{phone}</span>
          ) : null}
          {email ? (
            <span className="mg-client-filter__option-meta mg-client-filter__option-meta--email">{email}</span>
          ) : null}
        </div>
      </li>
    );
  };

  const popoverNode = isOpen && popoverStyle ? (
    <div
      ref={popoverRef}
      id={popoverId}
      role="dialog"
      aria-modal="false"
      aria-label={ariaLabel}
      className="mg-client-filter__popover"
      style={popoverStyle}
    >
      <div className="mg-client-filter__popover-header">
        <input
          ref={searchInputRef}
          id={searchInputId}
          type="search"
          role="searchbox"
          autoComplete="off"
          className="mg-client-filter__search"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder={searchPlaceholder}
          aria-controls={listboxId}
        />
      </div>
      <ul
        id={listboxId}
        role="listbox"
        aria-multiselectable="true"
        aria-label={ariaLabel}
        className="mg-client-filter__listbox"
      >
        {visibleOptions.length === 0 ? (
          <li className="mg-client-filter__empty" role="presentation">
            {emptyOptionsText}
          </li>
        ) : (
          visibleOptions.map(renderOption)
        )}
      </ul>
      <div className="mg-client-filter__popover-footer">
        <button
          type="button"
          className="mg-client-filter__action mg-client-filter__action--clear"
          onClick={handleClearAll}
          disabled={!hasSelection || disabled}
        >
          {clearAllLabel}
        </button>
        <button
          type="button"
          className="mg-client-filter__action mg-client-filter__action--done"
          onClick={closePopover}
        >
          {doneLabel}
        </button>
      </div>
    </div>
  ) : null;

  return (
    <>
      {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events */}
      <button
        ref={triggerRef}
        type="button"
        id={componentId}
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={popoverId}
        aria-label={ariaLabel}
        aria-disabled={disabled || undefined}
        disabled={disabled}
        className={triggerClassName}
        onClick={handleTriggerClick}
        onKeyDown={handleTriggerKeyDown}
      >
        <span className="mg-client-filter__label">{compactLabel}</span>
        {hasSelection ? (
          <span
            role="button"
            tabIndex={-1}
            className="mg-client-filter__clear"
            aria-label={clearAllLabel}
            onClick={handleClearAll}
            onKeyDown={(event) => {
              if (event.key === KEY_ENTER || event.key === KEY_SPACE) {
                event.preventDefault();
                handleClearAll(event);
              }
            }}
          >
            <span aria-hidden="true">×</span>
          </span>
        ) : (
          <span className="mg-client-filter__caret" aria-hidden="true">
            ▾
          </span>
        )}
      </button>
      {popoverNode && typeof document !== 'undefined'
        ? ReactDOM.createPortal(popoverNode, document.body)
        : null}
    </>
  );
};

ClientFilterMultiSelect.propTypes = {
  id: PropTypes.string,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      name: PropTypes.string,
      phone: PropTypes.string,
      email: PropTypes.string,
      label: PropTypes.string
    })
  ),
  value: PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.number])),
  onChange: PropTypes.func.isRequired,
  triggerLabel: PropTypes.string.isRequired,
  triggerSelectedLabel: PropTypes.func.isRequired,
  searchPlaceholder: PropTypes.string,
  emptyOptionsText: PropTypes.string,
  clearAllLabel: PropTypes.string,
  doneLabel: PropTypes.string,
  ariaLabel: PropTypes.string,
  className: PropTypes.string,
  disabled: PropTypes.bool
};

ClientFilterMultiSelect.defaultProps = {
  id: undefined,
  options: [],
  value: [],
  searchPlaceholder: '',
  emptyOptionsText: '',
  clearAllLabel: '',
  doneLabel: '',
  ariaLabel: undefined,
  className: '',
  disabled: false
};

export default ClientFilterMultiSelect;
