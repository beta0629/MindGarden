import React from 'react';
import { Search, Filter, RotateCcw, X } from 'lucide-react';
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
            <div className="mapping-filters-header">
                <h3 className="mapping-filters-title">🔍 필터 및 검색</h3>
                <button 
                    className="mg-btn mg-btn--sm mg-btn--secondary"
                    onClick={onReset}
                >
                    <RotateCcw size={16} /> 초기화
                </button>
            </div>
            
            <div className="mapping-filters-content">
                <div className="mapping-filters-status">
                    <label className="mapping-filters-label">
                        <Filter size={16} />
                        상태 필터
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
                        <Search size={16} />
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
                                className="mapping-filters-clear-btn"
                                onClick={() => onSearchChange('')}
                            >
                                <X size={16} />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MappingFilters;
