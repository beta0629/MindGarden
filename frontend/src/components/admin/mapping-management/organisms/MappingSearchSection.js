/**
 * MappingSearchSection - 검색 + 상태 필터 영역
 * SearchInput(dashboard-v2) + 상태 필터 칩
 *
 * @author Core Solution
 * @since 2025-02-22
 */

import React from 'react';
import { SearchInput } from '../../../dashboard-v2/atoms';
import ContentSection from '../../../dashboard-v2/content/ContentSection';
import { MAPPING_FILTER_OPTIONS } from '../../../../constants/mapping';
import './MappingSearchSection.css';

const MappingSearchSection = ({
  searchValue = '',
  onSearchChange,
  filterStatus = 'ALL',
  onFilterChange,
  placeholder = '상담사, 내담자, 패키지명 또는 #상태로 검색...'
}) => {
  return (
    <ContentSection noCard className="mg-v2-mapping-search-section">
      <div className="mg-v2-mapping-search-section__row">
        <div className="mg-v2-mapping-search-section__input-wrap">
          <SearchInput
            value={searchValue}
            onChange={onSearchChange}
            placeholder={placeholder}
          />
        </div>
        <div className="mg-v2-mapping-search-section__chips">
          {MAPPING_FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={`mg-v2-mapping-search-section__chip ${
                filterStatus === opt.value ? 'mg-v2-mapping-search-section__chip--active' : ''
              }`}
              onClick={() => onFilterChange && onFilterChange(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </ContentSection>
  );
};

export default MappingSearchSection;
