import React from 'react';
import { MAPPING_FILTER_OPTIONS } from '../../../constants/mapping';
import './MappingFilters.css';

/**
 * 매핑 필터 컴포넌트
 * - 상태별 필터링
 * - 검색 기능
 * - 필터 초기화
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
const MappingFilters = ({ 
    filterStatus, 
    searchTerm, 
    onStatusChange, 
    onSearchChange, 
    onReset 
}) => {
    const statusOptions = MAPPING_FILTER_OPTIONS;

    return (
        <div className="mapping-filters">
            <div className="filters-header">
                <h3>🔍 필터 및 검색</h3>
                <button 
                    className="btn btn-secondary btn-sm"
                    onClick={onReset}
                >
                    <i className="bi bi-arrow-clockwise"></i> 초기화
                </button>
            </div>
            
            <div className="filters-content">
                <div className="filter-group">
                    <label className="filter-label">
                        <i className="bi bi-funnel"></i>
                        상태 필터
                    </label>
                    <select 
                        value={filterStatus} 
                        onChange={(e) => onStatusChange(e.target.value)}
                        className="filter-select"
                    >
                        {statusOptions.map(option => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </div>
                
                <div className="filter-group">
                    <label className="filter-label">
                        <i className="bi bi-search"></i>
                        검색
                    </label>
                    <div className="search-input-group">
                        <input
                            type="text"
                            placeholder="상담사 또는 내담자 이름으로 검색..."
                            value={searchTerm}
                            onChange={(e) => onSearchChange(e.target.value)}
                            className="search-input"
                        />
                        {searchTerm && (
                            <button 
                                className="search-clear"
                                onClick={() => onSearchChange('')}
                            >
                                <i className="bi bi-x"></i>
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MappingFilters;
