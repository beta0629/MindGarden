/**
 * 필터 드롭다운 컴포넌트 (Presentational)
 * 
 * 표준화 원칙 준수:
 * - mg-v2-* CSS 클래스 사용
 * - CSS 변수 사용
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-12-09
 */

import React from 'react';
import { Filter } from 'lucide-react';
import { FILTER_LABEL_ALL } from '../../../constants/filterSearch';

const FilterDropdown = ({
  label = '필터',
  value = '',
  options = [],
  placeholder = FILTER_LABEL_ALL,
  onChange
}) => {
  return (
    <div className="mg-v2-filter-dropdown">
      <label className="mg-v2-filter-dropdown__label">
        <Filter size={16} />
        {label}
      </label>
      <select
        className="mg-v2-select mg-v2-filter-dropdown__select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">{placeholder}</option>
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default FilterDropdown;

