import React from 'react';
import UnifiedLoading from '../common/UnifiedLoading';
import './SearchFilterSection.css';

/**
 * 검색 및 필터 섹션 컴포넌트
 * - 검색 입력, 필터 드롭다운을 포함
 * - 아이폰 스타일과 글래스모피즘 효과 적용
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
const SearchFilterSection = ({ 
    searchTerm, 
    onSearchChange, 
    filterValue, 
    onFilterChange, 
    filterOptions = [],
    placeholder = "검색어를 입력하세요...",
    filterLabel = "필터"
}) => {
    return (
        <div className="search-filter-section">
            <div className="search-container">
                <div className="search-input-wrapper">
                    <i className="bi bi-search search-icon"></i>
                    <input
                        type="text"
                        placeholder={placeholder}
                        value={searchTerm}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="search-input"
                    />
                </div>
            </div>
            
            <div className="filter-container">
                <select
                    value={filterValue}
                    onChange={(e) => onFilterChange(e.target.value)}
                    className="filter-select"
                >
                    <option value="">{filterLabel}</option>
                    {filterOptions.map((option, index) => (
                        <option key={`filter-${option.value}-${index}`} value={option.value}>
                            {option.icon} {option.label}
                        </option>
                    ))}
                </select>
            </div>
        </div>
    );
};

export default SearchFilterSection;
