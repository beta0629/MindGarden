/**
 * 통합 필터/검색 컴포넌트 (Container)
 * 
 * 표준화 원칙 준수:
 * - Presentational/Container 패턴
 * - 로직과 UI 분리
 * - 상수 사용
 * - 입력 최소화 (컴팩트 모드)
 * 
 * @author Core Solution
 * @version 1.0.0
 * @since 2025-12-09
 */

import React, { useState, useEffect } from 'react';
import { Filter } from 'lucide-react';
import { useDebounce } from '../../../hooks/useDebounce';
import SearchBar from './SearchBar';
import QuickFilters from './QuickFilters';
import FilterChips from './FilterChips';
import MGButton from '../../common/MGButton';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../../erp/common/erpMgButtonProps';
import { SEARCH_PLACEHOLDER, DEBOUNCE_DELAY, SEARCH_MIN_LENGTH } from '../../../constants/filterSearch';

const UnifiedFilterSearch = ({
  onSearch,
  onFilterChange,
  filters = [],
  searchPlaceholder = SEARCH_PLACEHOLDER,
  showQuickFilters = true, // 기본값: true (버튼만 사용)
  quickFilterOptions = [], // 빠른 필터 옵션
  compact = true // 컴팩트 모드 (기본값: true)
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState({});
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showFilters, setShowFilters] = useState(false); // 필터 패널 표시 여부
  
  const debouncedSearchTerm = useDebounce(searchTerm, DEBOUNCE_DELAY);

  // Debounce 검색
  useEffect(() => {
    if (debouncedSearchTerm && debouncedSearchTerm.length >= SEARCH_MIN_LENGTH) {
      onSearch?.(debouncedSearchTerm);
      // 자동완성 제안 로드 (예시)
      loadSuggestions(debouncedSearchTerm);
    } else if (debouncedSearchTerm === '') {
      onSearch?.('');
    }
  }, [debouncedSearchTerm]);

  const loadSuggestions = async(term) => {
    // TODO: 실제 API 호출로 대체
    // 예시: 검색 제안 데이터
    const mockSuggestions = [
      { id: 1, name: `${term} 관련 항목 1` },
      { id: 2, name: `${term} 관련 항목 2` }
    ];
    setSuggestions(mockSuggestions);
  };

  const handleSearchChange = (value) => {
    setSearchTerm(value);
    setShowSuggestions(value.length >= SEARCH_MIN_LENGTH);
  };

  const handleSelectSuggestion = (suggestion) => {
    setSearchTerm(suggestion.name || suggestion.label);
    setShowSuggestions(false);
    onSearch?.(suggestion.name || suggestion.label);
  };

  const handleFilterChange = (filterKey, value) => {
    const newFilters = { ...activeFilters };
    if (value === '' || value === 'all') {
      delete newFilters[filterKey];
    } else {
      newFilters[filterKey] = value;
    }
    setActiveFilters(newFilters);
    onFilterChange?.(newFilters);
  };

  const handleRemoveFilter = (filterKey) => {
    const newFilters = { ...activeFilters };
    delete newFilters[filterKey];
    setActiveFilters(newFilters);
    onFilterChange?.(newFilters);
  };

  const handleClearAll = () => {
    setActiveFilters({});
    setSearchTerm('');
    setShowSuggestions(false);
    onFilterChange?.({});
    onSearch?.('');
  };

  // 필터 칩용 데이터 변환
  const filterChipsData = Object.entries(activeFilters).map(([key, value]) => {
    const filter = filters.find(f => f.key === key);
    return {
      key,
      label: filter?.label || key,
      value: filter?.options?.find(o => o.value === value)?.label || value
    };
  });

  // 필터가 활성화되어 있는지 확인
  const hasActiveFilters = filterChipsData.length > 0;

  return (
    <div className={`mg-v2-filter-search ${compact ? 'mg-v2-filter-search--compact' : ''}`}>
      {/* 검색 바 + 필터 토글 버튼 (항상 표시) */}
      <div className="mg-v2-filter-search__row">
        <div className="mg-v2-filter-search__search">
          <SearchBar
            searchTerm={searchTerm}
            suggestions={suggestions}
            showSuggestions={showSuggestions}
            placeholder={searchPlaceholder}
            onSearchChange={handleSearchChange}
            onSelectSuggestion={handleSelectSuggestion}
            onClear={() => handleSearchChange('')}
            enableHashtag={true}
          />
        </div>

        {/* 필터 토글 버튼 (컴팩트 모드) */}
        {compact && showQuickFilters && quickFilterOptions.length > 0 && (
          <MGButton
            variant={hasActiveFilters ? 'primary' : 'outline'}
            size="small"
            className={buildErpMgButtonClassName({
              variant: hasActiveFilters ? 'primary' : 'outline',
              size: 'sm',
              loading: false,
              className: 'mg-v2-filter-search__toggle'
            })}
            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={16} />
            {hasActiveFilters && (
              <span className="mg-v2-filter-search__badge">{filterChipsData.length}</span>
            )}
          </MGButton>
        )}
      </div>

      {/* 빠른 필터 버튼 (컴팩트 모드: 패널, 비컴팩트 모드: 항상 표시) */}
      {showQuickFilters && quickFilterOptions.length > 0 && (
        <div className={`mg-v2-filter-search__panel ${compact ? (showFilters ? 'mg-v2-filter-search__panel--open' : '') : 'mg-v2-filter-search__panel--always-open'}`}>
          <QuickFilters
            activeFilter={activeFilters.status || 'all'}
            options={quickFilterOptions}
            onFilterChange={(value) => handleFilterChange('status', value)}
          />
        </div>
      )}

      {/* 필터 칩 (항상 표시, 있으면) */}
      {filterChipsData.length > 0 && (
        <div className="mg-v2-filter-search__chips">
          <FilterChips
            activeFilters={filterChipsData}
            onRemoveFilter={handleRemoveFilter}
            onClearAll={handleClearAll}
          />
        </div>
      )}
    </div>
  );
};

export default UnifiedFilterSearch;
