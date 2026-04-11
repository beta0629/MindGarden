import React from 'react';
import { RotateCcw } from 'lucide-react';
import MGButton from '../../common/MGButton';
import './ConsultantFilter.css';

/**
 * 새로운 디자인의 상담사 필터 컴포넌트
/**
 * - CSS 클래스 상수 사용
/**
 * - JavaScript 상수 사용
/**
 * - 현대적인 디자인 적용
/**
 * 
/**
 * @author Core Solution
/**
 * @version 2.0.0
/**
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
        { value: 'all', label: '전체', color: 'var(--mg-text-secondary)' },
        { value: 'available', label: '여유', color: 'var(--mg-success-500)' },
        { value: 'busy', label: '바쁨', color: 'var(--mg-warning-500)' },
        { value: 'unavailable', label: '휴무', color: 'var(--mg-error-500)' }
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
                    <MGButton
                        variant="secondary"
                        size="small"
                        className="consultant-filter-reset-button"
                        onClick={onResetFilters}
                        preventDoubleClick={false}
                    >
                        <RotateCcw size={16} />
                        초기화
                    </MGButton>
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
                            <MGButton
                                key={option.value}
                                type="button"
                                variant="outline"
                                className={`consultant-filter-availability-btn ${filters.availability === option.value ? 'active' : ''}`}
                                data-option-color={option.color}
                                onClick={() => handleAvailabilityChange(option.value)}
                                preventDoubleClick={false}
                            >
                                <div className="consultant-filter-availability-dot" />
                                {option.label}
                            </MGButton>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConsultantFilterNew;
