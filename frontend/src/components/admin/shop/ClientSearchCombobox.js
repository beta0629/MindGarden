/**
 * ClientSearchCombobox — 이름·연락처 뒷자리로 검색하는 단일 선택 콤보박스 (APG combobox/listbox)
 * onLoadMore·hasMore 를 주면 목록 끝까지 스크롤할 때 다음 페이지를 이어 부른다 (무한 스크롤).
 * onQueryChange 를 주면 검색은 서버가 하고(options = 서버 결과), 없으면 options 를 화면에서 거른다.
 * 입력값은 사용자가 친 검색어(query)만 담는다. 선택 라벨은 placeholder 로만 보여 주고 검색어로 보내지 않는다.
 *
 * @author CoreSolution
 * @since 2026-10-12
 */

import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { ChevronDown } from 'lucide-react';
import SafeText from '../../common/SafeText';
import { filterClientOptions } from '../../../utils/shopClientOffer';
import { useScrollEndLoadMore } from '../../../hooks/useScrollEndLoadMore';

const ClientSearchCombobox = ({
  options, value, selectedOption, onChange, onQueryChange, loading, loadingText,
  onLoadMore, hasMore, loadingMore, loadingMoreText,
  label, placeholder, emptyText, disabled, testId
}) => {
  const listId = useId();
  const inputId = useId();
  const rootRef = useRef(null);
  const selected = useMemo(
    () => selectedOption || options.find((o) => o.value === value) || null,
    [selectedOption, options, value]
  );
  const remote = typeof onQueryChange === 'function';
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const filtered = useMemo(
    () => (remote ? options : filterClientOptions(options, query)),
    [remote, options, query]
  );

  const onListScroll = useScrollEndLoadMore({ onLoadMore, hasMore, loadingMore });

  const updateQuery = (next) => {
    setQuery(next);
    if (remote) {
      onQueryChange(next);
    }
  };

  useEffect(() => {
    if (!open) {
      return undefined;
    }
    const onDown = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setOpen(false);
        updateQuery('');
      }
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const choose = (option) => {
    onChange(option.value);
    setOpen(false);
    updateQuery('');
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
      updateQuery('');
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
          value={query}
          onFocus={() => setOpen(true)}
          onClick={() => setOpen(true)}
          onChange={(e) => { updateQuery(e.target.value); setActive(0); setOpen(true); }}
          onKeyDown={onKeyDown}
          data-testid={testId}
        />
        <ChevronDown className="aco-icon" aria-hidden="true" />
      </span>
      {open ? (
        <ul
          id={listId}
          role="listbox"
          aria-label={label}
          aria-busy={loading || loadingMore}
          className="aco-combo__list"
          onScroll={onListScroll}
        >
          {loading && filtered.length === 0 ? (
            <li className="aco-combo__empty" role="option" aria-selected="false" aria-disabled="true">{loadingText}</li>
          ) : filtered.length === 0 ? (
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
          {loadingMore && filtered.length > 0 ? (
            <li className="aco-combo__empty" role="option" aria-selected="false" aria-disabled="true" aria-live="polite">
              {loadingMoreText}
            </li>
          ) : null}
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
  selectedOption: PropTypes.shape({ value: PropTypes.string, label: PropTypes.string }),
  onQueryChange: PropTypes.func,
  loading: PropTypes.bool,
  loadingText: PropTypes.string,
  onLoadMore: PropTypes.func,
  hasMore: PropTypes.bool,
  loadingMore: PropTypes.bool,
  loadingMoreText: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  label: PropTypes.string.isRequired,
  placeholder: PropTypes.string,
  emptyText: PropTypes.string,
  disabled: PropTypes.bool,
  testId: PropTypes.string
};

ClientSearchCombobox.defaultProps = {
  value: '', selectedOption: null, onQueryChange: undefined, loading: false, loadingText: '',
  onLoadMore: undefined, hasMore: false, loadingMore: false, loadingMoreText: '',
  placeholder: '', emptyText: '', disabled: false, testId: undefined
};

export default ClientSearchCombobox;
