/**
 * SearchInput - GNB 통합 검색바 (300px)
 * B0KlA 스타일
 *
 * @author CoreSolution
 * @since 2025-02-22
 */

import React from 'react';
import { ICONS, ICON_SIZES } from '../../../constants/icons';
import './SearchInput.css';

const SearchLucideIcon = ICONS.SEARCH;

const PLACEHOLDER = '통합 검색...';
const SEARCH_INPUT_WIDTH = 300;

const SearchInput = ({ value = '', onChange, placeholder = PLACEHOLDER, className = '' }) => {
  return (
    <div className={`mg-v2-search-input ${className}`}>
      <span className="mg-v2-search-input__icon" aria-hidden>
        {SearchLucideIcon ? (
          <SearchLucideIcon
            size={ICON_SIZES.LG}
            strokeWidth={2}
            className="mg-v2-search-input__lucide"
          />
        ) : null}
      </span>
      <input
        type="search"
        className="mg-v2-search-input__field"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        aria-label="통합 검색"
      />
    </div>
  );
};

export default SearchInput;
export { PLACEHOLDER, SEARCH_INPUT_WIDTH };
