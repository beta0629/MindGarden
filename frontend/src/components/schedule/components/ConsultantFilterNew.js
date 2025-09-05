import React from 'react';
import { COMPONENT_CSS, SCHEDULE_MODAL_CONSTANTS } from '../../../constants/css-variables';

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
        <div className={COMPONENT_CSS.SCHEDULE_MODAL.FILTER_SECTION}>
            {/* 필터 행 */}
            <div className="filter-row">
                {/* 검색 입력 */}
                <div className="filter-group">
                    <label>검색</label>
                    <input
                        type="text"
                        className={COMPONENT_CSS.SCHEDULE_MODAL.SEARCH_INPUT}
                        placeholder={SCHEDULE_MODAL_CONSTANTS.FILTER.SEARCH_PLACEHOLDER}
                        value={filters.search}
                        onChange={handleSearchChange}
                    />
                </div>

                {/* 전문분야 선택 */}
                <div className="filter-group">
                    <label>전문분야</label>
                    <select
                        className={COMPONENT_CSS.SCHEDULE_MODAL.SPECIALTY_SELECT}
                        value={filters.specialty}
                        onChange={handleSpecialtyChange}
                    >
                        {SCHEDULE_MODAL_CONSTANTS.SPECIALTIES.map(specialty => (
                            <option key={specialty.value} value={specialty.value}>
                                {specialty.label}
                            </option>
                        ))}
                    </select>
                </div>

                {/* 초기화 버튼 */}
                <div className="filter-group">
                    <label>&nbsp;</label>
                    <button
                        className={COMPONENT_CSS.SCHEDULE_MODAL.RESET_BUTTON}
                        onClick={onResetFilters}
                    >
                        🔄 {SCHEDULE_MODAL_CONSTANTS.FILTER.RESET_BUTTON_TEXT}
                    </button>
                </div>

                {/* 상담사 수 표시 */}
                <div className="consultant-count">
                    {consultantCount}{SCHEDULE_MODAL_CONSTANTS.FILTER.CONSULTANT_COUNT_TEXT}
                </div>
            </div>

            {/* 가용성 필터 */}
            <div className="filter-row">
                <div className="filter-group">
                    <label>가용성</label>
                    <div className={COMPONENT_CSS.SCHEDULE_MODAL.AVAILABILITY_FILTER}>
                        {SCHEDULE_MODAL_CONSTANTS.AVAILABILITY_OPTIONS.map(option => (
                            <button
                                key={option.value}
                                className={`${COMPONENT_CSS.SCHEDULE_MODAL.FILTER_BUTTON} ${option.value} ${
                                    filters.availability === option.value ? 'active' : ''
                                }`}
                                onClick={() => handleAvailabilityChange(option.value)}
                                style={{
                                    '--button-color': option.color
                                }}
                            >
                                <div className="availability-indicator" style={{ backgroundColor: option.color }}></div>
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
