/**
 * 필터 칩 컴포넌트 (Presentational)
 * 
 * 선택된 필터를 칩 형태로 표시하고 제거 가능
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-12-09
 */

import React from 'react';
import { X } from 'lucide-react';
import { FILTER_CHIP_CLEAR_ALL } from '../../../constants/filterSearch';

const FilterChips = ({
  activeFilters = [],
  onRemoveFilter,
  onClearAll
}) => {
  if (activeFilters.length === 0) return null;

  return (
    <div className="mg-v2-filter-chips">
      {activeFilters.map(filter => (
        <div key={filter.key} className="mg-v2-filter-chip">
          <span className="mg-v2-filter-chip__label">
            {filter.label}: {filter.value}
          </span>
          <button 
            className="mg-v2-filter-chip__remove"
            onClick={() => onRemoveFilter(filter.key)}
            type="button"
            aria-label={`${filter.label} 필터 제거`}
          >
            <X size={14} />
          </button>
        </div>
      ))}
      
      <button 
        className="mg-v2-filter-chip__clear-all"
        onClick={onClearAll}
        type="button"
      >
        {FILTER_CHIP_CLEAR_ALL}
      </button>
    </div>
  );
};

export default FilterChips;

