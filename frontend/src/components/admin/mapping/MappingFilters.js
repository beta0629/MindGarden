import React from 'react';
import { Search, Filter } from 'lucide-react';
import { MAPPING_FILTER_OPTIONS } from '../../../constants/mapping';
import MGButton from '../../../components/common/MGButton';
import './MappingFilters.css';
import { toDisplayString } from '../../../utils/safeDisplay';

/**
 * 매칭 필터 컴포넌트
/**
 * - 상태별 필터링
/**
 * - 검색 기능
/**
 * - 필터 초기화
/**
 * 
/**
 * @author Core Solution
/**
 * @version 1.0.0
/**
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
        <div className="mg-v2-mapping-filters">
            <div className="mg-v2-mapping-filters-header">
                <h3 className="mg-v2-mapping-filters-title">🔍 필터 및 검색</h3>
                <MGButton
                    variant="secondary"
                    size="small"
                    onClick={onReset}
                >
                    초기화
                </MGButton>
            </div>
            
            <div className="mg-v2-mapping-filters-content">
                <div className="mg-v2-mapping-filters-status">
                    <label className="mg-v2-mapping-filters-label">
                        <Filter size={16} />
                        상태 필터
                    </label>
                    <select 
                        value={filterStatus} 
                        onChange={(e) => onStatusChange(e.target.value)}
                        className="mg-v2-mapping-filters-select"
                    >
                        {statusOptions.map(option => (
                            <option key={option.value} value={option.value}>
                                {toDisplayString(option.label)}
                            </option>
                        ))}
                    </select>
                </div>
                
                <div className="mg-v2-mapping-filters-search">
                    <label className="mg-v2-mapping-filters-label">
                        <Search size={16} />
                        {' '}검색
                    </label>
                    <div className="mg-v2-mapping-filters-search-wrapper">
                        <input
                            type="text"
                            placeholder="상담사 또는 내담자 이름으로 검색..."
                            value={searchTerm}
                            onChange={(e) => onSearchChange(e.target.value)}
                            className="mg-v2-mapping-filters-input"
                        />
                        {searchTerm && (
                            <MGButton
                                type="button"
                                variant="outline"
                                size="small"
                                className="mapping-filters-clear-btn"
                                onClick={() => onSearchChange('')}
                                preventDoubleClick={false}
                                aria-label="검색어 지우기"
                            >
                                지우기
                            </MGButton>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MappingFilters;
