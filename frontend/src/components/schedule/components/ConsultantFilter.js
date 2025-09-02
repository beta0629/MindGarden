import React from 'react';
import './ConsultantFilter.css';

/**
 * 상담사 필터 컴포넌트
 * - 전문분야 필터
 * - 가용성 필터
 * - 검색 기능
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
const ConsultantFilter = ({ 
    filters, 
    onFilterChange, 
    consultantCount 
}) => {
    const specialties = [
        '개인상담',
        '가족상담',
        '부부상담',
        '집단상담',
        '청소년상담',
        '노인상담',
        '중독상담',
        '트라우마상담'
    ];

    const availabilityOptions = [
        { value: 'all', label: '전체', icon: '👥' },
        { value: 'available', label: '여유', icon: '🟢' },
        { value: 'busy', label: '바쁨', icon: '🟡' },
        { value: 'unavailable', label: '휴무', icon: '🔴' }
    ];

    /**
     * 검색어 변경 핸들러
     */
    const handleSearchChange = (e) => {
        onFilterChange({ search: e.target.value });
    };

    /**
     * 전문분야 변경 핸들러
     */
    const handleSpecialtyChange = (e) => {
        onFilterChange({ specialty: e.target.value });
    };

    /**
     * 가용성 변경 핸들러
     */
    const handleAvailabilityChange = (e) => {
        onFilterChange({ availability: e.target.value });
    };

    /**
     * 필터 초기화
     */
    const handleResetFilters = () => {
        onFilterChange({
            specialty: '',
            availability: 'all',
            search: ''
        });
    };

    return (
        <div className="consultant-filter">
            <div className="filter-header">
                <div className="filter-title">
                    <span className="filter-icon">🔍</span>
                    <span>필터</span>
                </div>
                <div className="consultant-count">
                    {consultantCount}명의 상담사
                </div>
            </div>

            <div className="filter-controls">
                {/* 검색 */}
                <div className="filter-group">
                    <label className="filter-label">검색</label>
                    <div className="search-input-container">
                        <input
                            type="text"
                            placeholder="상담사 이름, 직책, 전문분야로 검색..."
                            value={filters.search}
                            onChange={handleSearchChange}
                            className="search-input"
                        />
                        <span className="search-icon">🔍</span>
                    </div>
                </div>

                {/* 전문분야 */}
                <div className="filter-group">
                    <label className="filter-label">전문분야</label>
                    <select
                        value={filters.specialty}
                        onChange={handleSpecialtyChange}
                        className="filter-select"
                    >
                        <option value="">전체</option>
                        {specialties.map(specialty => (
                            <option key={specialty} value={specialty}>
                                {specialty}
                            </option>
                        ))}
                    </select>
                </div>

                {/* 가용성 */}
                <div className="filter-group">
                    <label className="filter-label">가용성</label>
                    <div className="availability-buttons">
                        {availabilityOptions.map(option => (
                            <button
                                key={option.value}
                                className={`availability-btn ${filters.availability === option.value ? 'active' : ''}`}
                                onClick={() => onFilterChange({ availability: option.value })}
                                title={option.label}
                            >
                                <span className="btn-icon">{option.icon}</span>
                                <span className="btn-label">{option.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* 필터 초기화 */}
                <div className="filter-actions">
                    <button
                        className="reset-btn"
                        onClick={handleResetFilters}
                        disabled={!filters.specialty && filters.availability === 'all' && !filters.search}
                    >
                        <span className="reset-icon">🔄</span>
                        초기화
                    </button>
                </div>
            </div>

            {/* 활성 필터 표시 */}
            {(filters.specialty || filters.availability !== 'all' || filters.search) && (
                <div className="active-filters">
                    <span className="active-filters-label">활성 필터:</span>
                    <div className="active-filter-tags">
                        {filters.search && (
                            <span className="filter-tag">
                                검색: "{filters.search}"
                                <button 
                                    className="remove-filter"
                                    onClick={() => onFilterChange({ search: '' })}
                                >
                                    ✕
                                </button>
                            </span>
                        )}
                        {filters.specialty && (
                            <span className="filter-tag">
                                전문분야: {filters.specialty}
                                <button 
                                    className="remove-filter"
                                    onClick={() => onFilterChange({ specialty: '' })}
                                >
                                    ✕
                                </button>
                            </span>
                        )}
                        {filters.availability !== 'all' && (
                            <span className="filter-tag">
                                가용성: {availabilityOptions.find(opt => opt.value === filters.availability)?.label}
                                <button 
                                    className="remove-filter"
                                    onClick={() => onFilterChange({ availability: 'all' })}
                                >
                                    ✕
                                </button>
                            </span>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ConsultantFilter;
