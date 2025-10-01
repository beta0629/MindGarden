import React from 'react';
import { MAPPING_FILTER_OPTIONS } from '../../../constants/mapping';

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
            <div className="mapping-filters-header">
                <h3 className="mapping-filters-title">🔍 필터 및 검색</h3>
                <button 
                    className="mg-btn mg-btn--sm mg-btn--secondary"
                    onClick={onReset}
                >
                    <i className="bi bi-arrow-clockwise"></i> 초기화
                </button>
            </div>
            
            <div className="mapping-filters-content">
                <div className="mapping-filters-status">
                    <label className="mapping-filters-label">
                        <i className="bi bi-funnel"></i>
                        {' '}상태 필터
                    </label>
                    <select 
                        value={filterStatus} 
                        onChange={(e) => onStatusChange(e.target.value)}
                        className="mapping-filters-select"
                    >
                        {statusOptions.map(option => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </div>
                
                <div className="mapping-filters-search">
                    <label className="mapping-filters-label">
                        <i className="bi bi-search"></i>
                        {' '}검색
                    </label>
                    <div className="mapping-filters-search-wrapper">
                        <input
                            type="text"
                            placeholder="상담사 또는 내담자 이름으로 검색..."
                            value={searchTerm}
                            onChange={(e) => onSearchChange(e.target.value)}
                            className="mapping-filters-input"
                        />
                        {searchTerm && (
                            <button 
                                className="mapping-filters-clear-btn">
                                onClick={() => onSearchChange('')}
                                onMouseEnter={(e) => {
                                    e.target.style.backgroundColor = '#f8f9fa';
                                    e.target.style.color = '#dc3545';
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.backgroundColor = 'transparent';
                                    e.target.style.color = '#6c757d';
                                }}
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
