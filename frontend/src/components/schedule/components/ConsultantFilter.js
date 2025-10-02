import React from 'react';
import './ConsultantFilter.css';

/**
 * 새로운 디자인의 상담사 필터 컴포넌트
 * - CSS 클래스 상수 사용
 * - JavaScript 상수 사용
 * - 현대적인 디자인 적용
 * 
 * @author MindGarden
 * @version 2.0.0
 * @since 2025-01-05
 */
const ConsultantFilterNew = ({ 
    filters, 
    onFilterChange, 
    onResetFilters,
    consultantCount 
}) => {
    // 전문분야 옵션
    const specialtyOptions = [
        { value: '', label: '전체' },
        { value: '우울증', label: '우울증' },
        { value: '불안장애', label: '불안장애' },
        { value: '가족상담', label: '가족상담' },
        { value: '부부상담', label: '부부상담' },
        { value: '트라우마', label: '트라우마' },
        { value: 'PTSD', label: 'PTSD' },
        { value: 'ADHD', label: 'ADHD' },
        { value: '자폐스펙트럼', label: '자폐스펙트럼' }
    ];

    // 가용성 필터 옵션
    const availabilityOptions = [
        { value: 'all', label: '전체', color: 'var(--color-text-secondary, #424245)' },
        { value: 'available', label: '여유', color: 'var(--color-success, #28A745)' },
        { value: 'busy', label: '바쁨', color: 'var(--color-warning, #FFC107)' },
        { value: 'unavailable', label: '휴무', color: '#dc3545' }
    ];
    /**
     * 검색 입력 변경 핸들러
     */
    const handleSearchChange = (e) => {
        onFilterChange({ search: e.target.value });
    };

    /**
     * 전문분야 선택 변경 핸들러
     */
    const handleSpecialtyChange = (e) => {
        onFilterChange({ specialty: e.target.value });
    };

    /**
     * 가용성 필터 변경 핸들러
     */
    const handleAvailabilityChange = (availability) => {
        onFilterChange({ availability });
    };

    return (
        <div className="consultant-filter">
            {/* 필터 행 */}
            <div className="consultant-filter-row">
                {/* 검색 입력 */}
                <div className="consultant-filter-field consultant-filter-field--search">
                    <label className="consultant-filter-label">검색</label>
                    <input
                        type="text"
                        className="consultant-filter-input"
                        placeholder="상담사 이름, 직책, 전문분야로 검색..."
                        value={filters.search}
                        onChange={handleSearchChange}
                    />
                </div>

                {/* 전문분야 선택 */}
                <div className="consultant-filter-field consultant-filter-field--specialty">
                    <label className="consultant-filter-label">전문분야</label>
                    <select
                        className="consultant-filter-select"
                        value={filters.specialty}
                        onChange={handleSpecialtyChange}
                    >
                        {specialtyOptions.map(specialty => (
                            <option key={specialty.value} value={specialty.value}>
                                {specialty.label}
                            </option>
                        ))}
                    </select>
                </div>

                {/* 초기화 버튼 */}
                <div className="consultant-filter-field consultant-filter-field--reset">
                    <label className="consultant-filter-label">&nbsp;</label>
                    <button
                        className="mg-btn mg-btn--sm mg-btn--secondary"
                        onClick={onResetFilters}
                    >
                        🔄 초기화
                    </button>
                </div>

                {/* 상담사 수 표시 */}
                <div className="consultant-filter-count">
                    {consultantCount}명의 상담사
                </div>
            </div>

            {/* 가용성 필터 */}
            <div className="consultant-filter-availability">
                <div className="consultant-filter-availability-field">
                    <label className="consultant-filter-label">가용성</label>
                    <div className="consultant-filter-availability-buttons">
                        {availabilityOptions.map(option => (
                            <button
                                key={option.value}
                                className={`consultant-filter-availability-btn ${filters.availability === option.value ? 'active' : ''}`}
                                data-option-color={option.color}
                                onClick={() => handleAvailabilityChange(option.value)}
                            >
                                <div className="consultant-filter-availability-dot"></div>
                                {option.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConsultantFilterNew;
