/**
 * ConsultantSearchField — 상담사 스위트 툴바 검색 입력 (h36 · slate 테두리)
 *
 * @author CoreSolution
 * @since 2026-10-07
 */

import React from 'react';
import PropTypes from 'prop-types';
import { Search } from 'lucide-react';
import { CONSULTANT_SUITE_CLASS } from '../../../constants/consultantSuite';

const SEARCH_ICON_SIZE = 16;

const ConsultantSearchField = ({ id, value, onChange, placeholder, ariaLabel }) => (
  <div className={CONSULTANT_SUITE_CLASS.SEARCH} role="search">
    <span className="consultant-suite-search__icon" aria-hidden="true">
      <Search size={SEARCH_ICON_SIZE} />
    </span>
    <input
      id={id}
      type="search"
      className="consultant-suite-search__input"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      aria-label={ariaLabel}
    />
  </div>
);

ConsultantSearchField.propTypes = {
  id: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string.isRequired,
  ariaLabel: PropTypes.string.isRequired
};

export default ConsultantSearchField;
