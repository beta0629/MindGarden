/**
 * MappingFilterSection - 필터/검색 영역
 * ContentSection + UnifiedFilterSearch
 *
 * @author MindGarden
 * @since 2025-02-22
 */

import React from 'react';
import ContentSection from '../../../dashboard-v2/content/ContentSection';
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
    <ContentSection noCard className="mg-v2-mapping-filter-section">
      <UnifiedFilterSearch
        onSearch={onSearch}
        onFilterChange={onFilterChange}
        searchPlaceholder={searchPlaceholder}
        compact={compact}
        showQuickFilters={showQuickFilters}
        quickFilterOptions={quickFilterOptions}
      />
    </ContentSection>
  );
};

export default MappingFilterSection;
