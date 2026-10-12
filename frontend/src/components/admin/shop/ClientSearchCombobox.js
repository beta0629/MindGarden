/**
 * ClientSearchCombobox — 이름·연락처 뒷자리로 검색하는 단일 선택 콤보박스 (APG combobox/listbox)
 *
 * @author CoreSolution
 * @since 2026-10-12
 */

import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { ChevronDown } from 'lucide-react';
import SafeText from '../../common/SafeText';
import { filterClientOptions } from '../../../utils/shopClientOffer';

const ClientSearchCombobox = ({
  options, value, onChange, label, placeholder, emptyText, disabled, testId
}) => {
  const listId = useId();
  const inputId = useId();
  const rootRef = useRef(null);
  const selected = useMemo(() => options.find((o) => o.value === value) || null, [options, value]);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const filtered = useMemo(() => filterClientOptions(options, query), [options, query]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }
    const onDown = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const choose = (option) => {
    onChange(option.value);
    setOpen(false);
    setQuery('');
  };

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      setActive((i) => Math.min(i + 1, Math.max(filtered.length - 1, 0)));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && open && filtered[active]) {
      e.preventDefault();
      choose(filtered[active]);
    } else if (e.key === 'Escape') {
      setOpen(false);
      setQuery('');
    }
  };

  return (
    <div className="aco-combo" ref={rootRef}>
      <span className="aco-select-wrap">
        <input
          id={inputId}
          className="aco-ctl"
          type="text"
          role="combobox"
          aria-label={label}
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={open && filtered[active] ? `${listId}-${active}` : undefined}
          autoComplete="off"
          disabled={disabled}
          placeholder={selected ? selected.label : placeholder}
          value={open ? query : (selected ? selected.label : '')}
          onFocus={() => setOpen(true)}
          onChange={(e) => { setQuery(e.target.value); setActive(0); setOpen(true); }}
          onKeyDown={onKeyDown}
          data-testid={testId}
        />
        <ChevronDown className="aco-icon" aria-hidden="true" />
      </span>
      {open ? (
        <ul id={listId} role="listbox" aria-label={label} className="aco-combo__list">
          {filtered.length === 0 ? (
            <li className="aco-combo__empty" role="option" aria-selected="false" aria-disabled="true">{emptyText}</li>
          ) : filtered.map((o, i) => (
            <li
              key={o.value}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={o.value === value}
              className="aco-combo__option"
              onMouseDown={(e) => { e.preventDefault(); choose(o); }}
              onMouseEnter={() => setActive(i)}
            >
              <SafeText>{o.label}</SafeText>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
};

ClientSearchCombobox.propTypes = {
  options: PropTypes.arrayOf(PropTypes.shape({
    value: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    searchText: PropTypes.string
  })).isRequired,
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  label: PropTypes.string.isRequired,
  placeholder: PropTypes.string,
  emptyText: PropTypes.string,
  disabled: PropTypes.bool,
  testId: PropTypes.string
};

ClientSearchCombobox.defaultProps = {
  value: '', placeholder: '', emptyText: '', disabled: false, testId: undefined
};

export default ClientSearchCombobox;
