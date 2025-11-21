/**
 * 학원 시스템 - 공통 필터 바 컴포넌트
 * 재사용 가능한 필터 UI
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-19
 */

import React from 'react';
import FormField from './FormField';
import './FilterBar.css';

/**
 * 필터 바 컴포넌트
 * 
 * @param {Array} filters - 필터 설정 배열
 * @param {Object} values - 현재 필터 값
 * @param {Function} onChange - 필터 변경 핸들러
 */
const FilterBar = ({ filters = [], values = {}, onChange }) => {
  if (!filters || filters.length === 0) {
    return null;
  }

  const handleFilterChange = (name, value) => {
    if (onChange) {
      onChange({ ...values, [name]: value });
    }
  };

  return (
    <div className="academy-filter-bar">
      {filters.map(filter => (
        <FormField
          key={filter.name}
          type={filter.type || 'select'}
          label={filter.label}
          name={filter.name}
          value={values[filter.name] || ''}
          onChange={(e) => handleFilterChange(filter.name, e.target.value)}
          options={filter.options || []}
          placeholder={filter.placeholder}
          className="academy-filter-field"
        />
      ))}
    </div>
  );
};

export default FilterBar;

