/**
 * ConsultantFilterSelect — 통합 스케줄 「전체 상담사」 단일 필터.
 * native &lt;select&gt; 대신 커스텀 드롭다운으로 선생님 색 점(getTeacherColor)을 표시.
 * 트리거·슬레이트 토큰은 ClientFilterMultiSelect / ScheduleHeader select 와 시각 통일.
 *
 * @author CoreSolution
 * @since 2026-10-14
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
import { toDisplayString } from '../../../../../utils/safeDisplay';
import { getTeacherColor } from '../../../../../utils/getTeacherColor';
import TeacherColorDot from '../../../../ui/Schedule/TeacherColorDot';
import './ConsultantFilterSelect.css';

const KEY_ENTER = 'Enter';
const KEY_SPACE = ' ';
const KEY_ESCAPE = 'Escape';
const KEY_ARROW_DOWN = 'ArrowDown';

const POPOVER_OFFSET_PX = 4;
const POPOVER_VIEWPORT_MARGIN_PX = 8;
const ALL_VALUE = '';

const isOpenKey = (key) => key === KEY_ENTER || key === KEY_SPACE || key === KEY_ARROW_DOWN;

/**
 * @param {object} props
 * @returns {JSX.Element}
 */
const ConsultantFilterSelect = ({
  id,
  consultants,
  value,
  onChange,
  loading,
  disabled,
  allLabel,
  loadingLabel,
  ariaLabel,
  className
}) => {
  const safeConsultants = useMemo(
    () => (Array.isArray(consultants) ? consultants : []),
    [consultants]
  );
  const selectedValue = value == null ? ALL_VALUE : String(value);

  const reactId = useId();
  const componentId = id || `mg-consultant-filter-${reactId.replace(/:/g, '')}`;
  const listboxId = `${componentId}-listbox`;

  const [isOpen, setIsOpen] = useState(false);
  const [popoverStyle, setPopoverStyle] = useState(null);

  const triggerRef = useRef(null);
  const popoverRef = useRef(null);

  const selectedConsultant = useMemo(
    () => safeConsultants.find(
      (row) => String(row?.id ?? row?.consultantId ?? '') === selectedValue
    ),
    [safeConsultants, selectedValue]
  );

  const triggerLabel = loading
    ? loadingLabel
    : (selectedConsultant
      ? toDisplayString(selectedConsultant.name, '—')
      : allLabel);

  const selectedTeacherColor = selectedConsultant
    ? getTeacherColor({
      consultantId: selectedConsultant.id ?? selectedConsultant.consultantId,
      consultants: safeConsultants,
      colorFromData: selectedConsultant
    })
    : null;

  const closePopover = useCallback(() => {
    setIsOpen(false);
  }, []);

  const openPopover = useCallback(() => {
    if (disabled || loading) {
      return;
    }
    setIsOpen(true);
  }, [disabled, loading]);

  const emitChange = useCallback((nextValue) => {
    if (typeof onChange !== 'function') {
      return;
    }
    onChange({ target: { value: nextValue } });
  }, [onChange]);

  const selectValue = useCallback((nextValue) => {
    emitChange(nextValue);
    closePopover();
    if (triggerRef.current) {
      triggerRef.current.focus();
    }
  }, [closePopover, emitChange]);

  const recalcPopoverPosition = useCallback(() => {
    if (!triggerRef.current) {
      return;
    }
    const rect = triggerRef.current.getBoundingClientRect();
    const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : rect.right;
    const minWidth = Math.max(rect.width, 160);
    const maxFitWidth = Math.max(160, viewportWidth - POPOVER_VIEWPORT_MARGIN_PX * 2);
    const desiredWidth = Math.min(280, Math.max(minWidth, 200), maxFitWidth);
    let left = rect.left;
    if (left + desiredWidth + POPOVER_VIEWPORT_MARGIN_PX > viewportWidth) {
      left = Math.max(
        POPOVER_VIEWPORT_MARGIN_PX,
        viewportWidth - desiredWidth - POPOVER_VIEWPORT_MARGIN_PX
      );
    }
    setPopoverStyle({
      position: 'fixed',
      top: `${rect.bottom + POPOVER_OFFSET_PX}px`,
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

  const handleTriggerKeyDown = (event) => {
    if (disabled || loading) {
      return;
    }
    if (isOpenKey(event.key)) {
      event.preventDefault();
      if (isOpen) {
        closePopover();
      } else {
        openPopover();
      }
    }
  };

  const handleTriggerClick = () => {
    if (isOpen) {
      closePopover();
    } else {
      openPopover();
    }
  };

  const triggerClassName = [
    'mg-consultant-filter',
    'mg-consultant-filter--trigger',
    isOpen ? 'mg-consultant-filter--open' : '',
    disabled || loading ? 'mg-consultant-filter--disabled' : '',
    selectedValue === ALL_VALUE ? 'mg-consultant-filter--empty' : '',
    className || ''
  ].filter(Boolean).join(' ');

  const options = [
    { id: ALL_VALUE, name: allLabel, isAll: true },
    ...safeConsultants.map((row) => ({
      id: String(row?.id ?? row?.consultantId ?? ''),
      name: toDisplayString(row?.name, '—'),
      consultant: row,
      isAll: false
    }))
  ];

  const popoverNode = isOpen && popoverStyle ? (
    <div
      ref={popoverRef}
      id={listboxId}
      role="listbox"
      aria-label={ariaLabel}
      className="mg-consultant-filter__popover"
      style={popoverStyle}
    >
      <ul className="mg-consultant-filter__options" role="presentation">
        {loading ? (
          <li className="mg-consultant-filter__option mg-consultant-filter__option--disabled" role="option" aria-selected={false} aria-disabled="true">
            {loadingLabel}
          </li>
        ) : options.map((option) => {
          const selected = selectedValue === option.id
            || (option.isAll && selectedValue === ALL_VALUE);
          const colorResult = option.isAll || !option.consultant
            ? null
            : getTeacherColor({
              consultantId: option.id,
              consultants: safeConsultants,
              colorFromData: option.consultant
            });
          const optionClass = [
            'mg-consultant-filter__option',
            selected ? 'mg-consultant-filter__option--selected' : ''
          ].filter(Boolean).join(' ');
          return (
            <li
              key={option.isAll ? 'all' : option.id}
              id={`${componentId}-option-${option.isAll ? 'all' : option.id}`}
              role="option"
              aria-selected={selected}
              className={optionClass}
              onClick={() => selectValue(option.isAll ? ALL_VALUE : option.id)}
            >
              {colorResult ? (
                <TeacherColorDot colorResult={colorResult} />
              ) : (
                <span className="mg-consultant-filter__dot-spacer" aria-hidden="true" />
              )}
              <span className="mg-consultant-filter__option-label">{option.name}</span>
            </li>
          );
        })}
      </ul>
    </div>
  ) : null;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        id={componentId}
        className={triggerClassName}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        disabled={disabled || loading}
        onClick={handleTriggerClick}
        onKeyDown={handleTriggerKeyDown}
      >
        {selectedTeacherColor ? (
          <TeacherColorDot colorResult={selectedTeacherColor} />
        ) : null}
        <span className="mg-consultant-filter__label">{triggerLabel}</span>
        <span className="mg-consultant-filter__caret" aria-hidden="true">▾</span>
      </button>
      {popoverNode && typeof document !== 'undefined'
        ? ReactDOM.createPortal(popoverNode, document.body)
        : null}
    </>
  );
};

ConsultantFilterSelect.propTypes = {
  id: PropTypes.string,
  consultants: PropTypes.arrayOf(PropTypes.object),
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func,
  loading: PropTypes.bool,
  disabled: PropTypes.bool,
  allLabel: PropTypes.string,
  loadingLabel: PropTypes.string,
  ariaLabel: PropTypes.string,
  className: PropTypes.string
};

ConsultantFilterSelect.defaultProps = {
  id: undefined,
  consultants: [],
  value: '',
  onChange: undefined,
  loading: false,
  disabled: false,
  allLabel: '전체 상담사',
  loadingLabel: '상담사 목록을 불러오는 중...',
  ariaLabel: '상담사 필터',
  className: ''
};

export default ConsultantFilterSelect;
