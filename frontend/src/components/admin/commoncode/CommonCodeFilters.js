import React from 'react';
import './CommonCodeFilters.css';

/**
 * 공통코드 필터 컴포넌트
 * - 코드 그룹, 상태, 검색어로 필터링
 * - 새 코드 추가 버튼 포함
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
const CommonCodeFilters = ({ 
    filters, 
    onFiltersChange, 
    codeGroups, 
    onNewCode 
}) => {
    const handleFilterChange = (key, value) => {
        onFiltersChange({
            ...filters,
            [key]: value
        });
    };

    const clearFilters = () => {
        onFiltersChange({
            codeGroup: '',
            isActive: '',
            searchTerm: ''
        });
    };

    const hasActiveFilters = filters.codeGroup || filters.isActive || filters.searchTerm;

    return (
        <div className="common-code-filters">
            <div className="filters-header">
                <h3>필터 및 검색</h3>
                <button 
                    className="btn btn-primary"
                    onClick={onNewCode}
                >
                    <i className="bi bi-plus-circle"></i>
                    새 공통코드 추가
                </button>
            </div>

            <div className="filters-content">
                <div className="filter-row">
                    <div className="filter-group">
                        <label htmlFor="codeGroup">코드 그룹</label>
                        <select
                            id="codeGroup"
                            value={filters.codeGroup}
                            onChange={(e) => handleFilterChange('codeGroup', e.target.value)}
                            className="form-select"
                        >
                            <option value="">전체 그룹</option>
                            {codeGroups.map(group => (
                                <option key={group} value={group}>
                                    {group}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="filter-group">
                        <label htmlFor="isActive">상태</label>
                        <select
                            id="isActive"
                            value={filters.isActive}
                            onChange={(e) => handleFilterChange('isActive', e.target.value)}
                            className="form-select"
                        >
                            <option value="">전체 상태</option>
                            <option value="true">활성</option>
                            <option value="false">비활성</option>
                        </select>
                    </div>

                    <div className="filter-group search-group">
                        <label htmlFor="searchTerm">검색</label>
                        <div className="search-input-wrapper">
                            <i className="bi bi-search search-icon"></i>
                            <input
                                type="text"
                                id="searchTerm"
                                value={filters.searchTerm}
                                onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                                placeholder="코드 라벨, 값, 설명으로 검색..."
                                className="form-control search-input"
                            />
                            {filters.searchTerm && (
                                <button
                                    className="clear-search-btn"
                                    onClick={() => handleFilterChange('searchTerm', '')}
                                    title="검색어 지우기"
                                >
                                    <i className="bi bi-x"></i>
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="filter-actions">
                        {hasActiveFilters && (
                            <button 
                                className="btn btn-outline-secondary"
                                onClick={clearFilters}
                            >
                                <i className="bi bi-arrow-clockwise"></i>
                                필터 초기화
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CommonCodeFilters;
