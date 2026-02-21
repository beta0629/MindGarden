/**
 * MappingFilterSection - 필터/검색 영역
 * ContentSection + UnifiedFilterSearch
 *
 * @author MindGarden
 * @since 2025-02-22
 */

import React from 'react';
import UnifiedFilterSearch from '../../../ui/FilterSearch/UnifiedFilterSearch';
import './MappingFilterSection.css';

const MappingFilterSection = ({
  onSearch,
  onFilterChange,
  searchPlaceholder,
  compact = true,
  showQuickFilters = true,
  quickFilterOptions = []
}) => {
  return (
    <div className="mg-v2-mapping-filter-section">
      <div className="mg-v2-ad-b0kla__card mg-v2-mapping-filter-card">
        <UnifiedFilterSearch
        onSearch={onSearch}
        onFilterChange={onFilterChange}
        searchPlaceholder={searchPlaceholder}
        compact={compact}
        showQuickFilters={showQuickFilters}
        quickFilterOptions={quickFilterOptions}
      />
      </div>
    </div>
  );
};

export default MappingFilterSection;
