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
        <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
        }}>
            {/* 필터 행 */}
            <div style={{
                display: 'flex',
                gap: '16px',
                alignItems: 'center',
                flexWrap: 'wrap'
            }}>
                {/* 검색 입력 */}
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    minWidth: '200px',
                    flex: '1'
                }}>
                    <label style={{
                        fontSize: 'var(--font-size-sm)',
                        fontWeight: '600',
                        color: '#495057',
                        margin: '0'
                    }}>검색</label>
                    <input
                        type="text"
                        style={{
                            width: '100%',
                            padding: '12px 16px',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: 'var(--font-size-sm)',
                            transition: 'all 0.2s ease',
                            background: '#ffffff'
                        }}
                        placeholder={SCHEDULE_MODAL_CONSTANTS.FILTER.SEARCH_PLACEHOLDER}
                        value={filters.search}
                        onChange={handleSearchChange}
                        onFocus={(e) => {
                            e.target.style.outline = 'none';
                            e.target.style.borderColor = '#667eea';
                            e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                        }}
                        onBlur={(e) => {
                            e.target.style.borderColor = 'transparent';
                            e.target.style.boxShadow = 'none';
                        }}
                    />
                </div>

                {/* 전문분야 선택 */}
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    minWidth: '150px'
                }}>
                    <label style={{
                        fontSize: 'var(--font-size-sm)',
                        fontWeight: '600',
                        color: '#495057',
                        margin: '0'
                    }}>전문분야</label>
                    <select
                        style={{
                            width: '100%',
                            padding: '12px 16px',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: 'var(--font-size-sm)',
                            background: '#ffffff',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                        }}
                        value={filters.specialty}
                        onChange={handleSpecialtyChange}
                        onFocus={(e) => {
                            e.target.style.outline = 'none';
                            e.target.style.borderColor = '#667eea';
                            e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                        }}
                        onBlur={(e) => {
                            e.target.style.borderColor = 'transparent';
                            e.target.style.boxShadow = 'none';
                        }}
                    >
                        {SCHEDULE_MODAL_CONSTANTS.SPECIALTIES.map(specialty => (
                            <option key={specialty.value} value={specialty.value}>
                                {specialty.label}
                            </option>
                        ))}
                    </select>
                </div>

                {/* 초기화 버튼 */}
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    minWidth: '100px'
                }}>
                    <label style={{
                        fontSize: 'var(--font-size-sm)',
                        fontWeight: '600',
                        color: '#495057',
                        margin: '0'
                    }}>&nbsp;</label>
                    <button
                        style={{
                            height: '40px',
                            padding: '8px 16px',
                            border: 'none',
                            borderRadius: '8px',
                            background: '#ffffff',
                            color: '#6c757d',
                            fontSize: 'var(--font-size-sm)',
                            fontWeight: '500',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            minWidth: '80px',
                            justifyContent: 'center'
                        }}
                        onClick={onResetFilters}
                        onMouseEnter={(e) => {
                            e.target.style.background = '#6c757d';
                            e.target.style.color = '#ffffff';
                            e.target.style.transform = 'translateY(-2px)';
                            e.target.style.boxShadow = '0 4px 12px rgba(108, 117, 125, 0.3)';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.background = '#ffffff';
                            e.target.style.color = '#6c757d';
                            e.target.style.transform = 'translateY(0)';
                            e.target.style.boxShadow = 'none';
                        }}
                    >
                        🔄 {SCHEDULE_MODAL_CONSTANTS.FILTER.RESET_BUTTON_TEXT}
                    </button>
                </div>

                {/* 상담사 수 표시 */}
                <div style={{
                            fontSize: 'var(--font-size-sm)',
                    fontWeight: '600',
                    color: '#495057',
                    marginLeft: 'auto',
                    display: 'flex',
                    alignItems: 'center',
                    height: '40px'
                }}>
                    {consultantCount}{SCHEDULE_MODAL_CONSTANTS.FILTER.CONSULTANT_COUNT_TEXT}
                </div>
            </div>

            {/* 가용성 필터 */}
            <div style={{
                display: 'flex',
                gap: '16px',
                alignItems: 'center',
                flexWrap: 'wrap'
            }}>
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    minWidth: '200px'
                }}>
                    <label style={{
                        fontSize: 'var(--font-size-sm)',
                        fontWeight: '600',
                        color: '#495057',
                        margin: '0'
                    }}>가용성</label>
                    <div style={{
                        display: 'flex',
                        gap: '8px',
                        flexWrap: 'wrap'
                    }}>
                        {SCHEDULE_MODAL_CONSTANTS.AVAILABILITY_OPTIONS.map(option => (
                            <button
                                key={option.value}
                                style={{
                                    height: '40px',
                                    padding: '8px 16px',
                                    border: 'none',
                                    borderRadius: '8px',
                                    background: filters.availability === option.value ? option.color : '#ffffff',
                                    color: filters.availability === option.value ? '#ffffff' : '#495057',
                                    fontSize: 'var(--font-size-sm)',
                                    fontWeight: '500',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    minWidth: '80px',
                                    justifyContent: 'center'
                                }}
                                onClick={() => handleAvailabilityChange(option.value)}
                                onMouseEnter={(e) => {
                                    if (filters.availability !== option.value) {
                                        e.target.style.transform = 'translateY(-2px)';
                                        e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (filters.availability !== option.value) {
                                        e.target.style.transform = 'translateY(0)';
                                        e.target.style.boxShadow = 'none';
                                    }
                                }}
                            >
                                <div style={{
                                    width: '8px',
                                    height: '8px',
                                    borderRadius: '50%',
                                    background: 'currentColor'
                                }}></div>
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
