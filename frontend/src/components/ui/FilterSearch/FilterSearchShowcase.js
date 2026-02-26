/**
 * 필터/검색 컴포넌트 샘플 페이지
 * 
 * 표준화된 필터/검색 컴포넌트의 사용 예시를 보여주는 샘플 페이지
 * 
 * @author Core Solution
 * @version 1.0.0
 * @since 2025-12-09
 */

import React, { useState } from 'react';
import UnifiedFilterSearch from './UnifiedFilterSearch';
import Card from '../Card/Card';

const FilterSearchShowcase = () => {
  const [searchResult, setSearchResult] = useState('');
  const [filterResult, setFilterResult] = useState({});

  const handleSearch = (term) => {
    console.log('검색어:', term);
    setSearchResult(term);
  };

  const handleFilterChange = (filters) => {
    console.log('필터:', filters);
    setFilterResult(filters);
  };

  // 상태 필터 옵션 (공통코드에서 가져온다고 가정)
  const statusOptions = [
    { value: 'ACTIVE', label: '활성' },
    { value: 'INACTIVE', label: '비활성' },
    { value: 'PENDING', label: '대기' }
  ];

  // 필터 설정
  const filters = [
    {
      key: 'status',
      label: '상태',
      options: statusOptions
    }
  ];

  return (
    <div className="mg-v2-filter-search-showcase">
      <div className="mg-v2-filter-search-showcase__header">
        <h1 className="mg-v2-filter-search-showcase__title">필터/검색 컴포넌트 샘플</h1>
      </div>

      <Card padding="large" className="mg-v2-filter-search-showcase__card">
        <h2 className="mg-v2-filter-search-showcase__subtitle">통합 필터/검색</h2>
        <UnifiedFilterSearch
          onSearch={handleSearch}
          onFilterChange={handleFilterChange}
          filters={filters}
          compact={true}
          showQuickFilters={true}
          quickFilterOptions={[
            { value: 'all', label: '전체' },
            { value: 'ACTIVE', label: '활성' },
            { value: 'INACTIVE', label: '비활성' },
            { value: 'PENDING', label: '대기' }
          ]}
        />
      </Card>

      <Card padding="large" className="mg-v2-filter-search-showcase__card">
        <h2 className="mg-v2-filter-search-showcase__subtitle">결과</h2>
        <div className="mg-v2-filter-search-showcase__result">
          <div className="mg-v2-filter-search-showcase__result-item">
            <strong>검색어:</strong> {searchResult || '(없음)'}
          </div>
          <div className="mg-v2-filter-search-showcase__result-item">
            <strong>필터:</strong> {Object.keys(filterResult).length > 0 
              ? JSON.stringify(filterResult, null, 2)
              : '(없음)'
            }
          </div>
        </div>
      </Card>
    </div>
  );
};

export default FilterSearchShowcase;

