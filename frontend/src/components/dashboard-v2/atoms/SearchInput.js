/**
 * SearchInput - GNB 통합 검색바 (300px)
 * B0KlA 스타일
 *
 * @author CoreSolution
 * @since 2025-02-22
 */

import React from 'react';
import Icon from '../../ui/Icon/Icon';
import './SearchInput.css';

const PLACEHOLDER = '통합 검색...';
const SEARCH_INPUT_WIDTH = 300;

const SearchInput = ({ value = '', onChange, placeholder = PLACEHOLDER, className = '' }) => {
  return (
    <div className={`mg-v2-search-input ${className}`}>
      <Icon
        name="SEARCH"
        size="LG"
        color="TRANSPARENT"
        className="mg-v2-search-input__icon"
        aria-hidden="true"
      />
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
