import React, { useState, useEffect, useCallback } from 'react';
import ConsultantCard from '../../ui/Card/ConsultantCard';
import SpecialtyDisplay from '../../ui/SpecialtyDisplay';
import ConsultantFilter from '../components/ConsultantFilter';
import UnifiedLoading from '../../../components/common/UnifiedLoading'; // 임시 비활성화
import notificationManager from '../../../utils/notification';
import './ConsultantSelectionStep.css';

/**
 * 새로운 디자인의 상담사 선택 단계 컴포넌트
/**
 * - CSS 클래스 상수 사용
/**
 * - JavaScript 상수 사용
/**
 * - 현대적인 디자인 적용
/**
 * 
/**
 * @author MindGarden
/**
 * @version 2.0.0
/**
 * @since 2025-01-05
 */
const ConsultantSelectionStepNew = ({ 
    onConsultantSelect, 
    selectedConsultant,
    selectedDate 
}) => {
    const [consultants, setConsultants] = useState([]);
    const [filteredConsultants, setFilteredConsultants] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [filters, setFilters] = useState({
        specialty: '',
        availability: 'all',
        search: ''
    });

/**
     * 상담사 목록 로드
     */
    const loadConsultants = useCallback(async () => {
        setLoading(true);
        try {
            console.log('👨‍⚕️ 상담사 목록 로드 시작');
            
            if (!selectedDate) {
                console.error('❌ selectedDate가 없습니다:', selectedDate);
                setConsultants([]);
                return;
            }
            
            // 시간대 문제를 피하기 위해 로컬 날짜로 직접 포맷팅
            const year = selectedDate.getFullYear();
            const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
            const day = String(selectedDate.getDate()).padStart(2, '0');
            const dateStr = `${year}-${month}-${day}`;
            
            console.log('🗓️ 선택된 날짜:', selectedDate);
            console.log('🗓️ API 호출 날짜:', dateStr);
            
            // 휴무 정보를 포함한 상담사 목록 조회
            const response = await fetch(`/api/v1/admin/consultants/with-vacation?date=${dateStr}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include'
            });

            if (response.ok) {
                const responseData = await response.json();
                console.log('👨‍⚕️ API 응답 데이터:', responseData);
                console.log('👨‍⚕️ API URL:', `/api/v1/admin/consultants/with-vacation?date=${dateStr}`);
                
                // API 응답 구조에 따라 데이터 추출
                // ApiResponse 래퍼: { success: true, data: { consultants: [...], count: N } }
                let data = null;
                if (responseData.data && responseData.data.consultants) {
                    data = responseData.data.consultants;
                } else if (responseData.consultants) {
                    data = responseData.consultants;
                } else if (Array.isArray(responseData.data)) {
                    data = responseData.data;
                } else if (Array.isArray(responseData)) {
                    data = responseData;
                } else {
                    data = [];
                }
                console.log('👨‍⚕️ 추출된 데이터:', data);
                console.log('👨‍⚕️ 김선희2 데이터 확인:', data.find(c => c.name === '김선희2'));
                
                if (!Array.isArray(data)) {
                    console.error('상담사 데이터가 배열이 아닙니다:', data);
                    setConsultants([]);
                    return;
                }
                
                // 휴무 정보가 이미 포함된 상담사 데이터 처리
                console.log('🔍 필터링 전 상담사 목록:', data.map(c => ({name: c.name, isOnVacation: c.isOnVacation, vacationType: c.vacationType})));
                
                // 김선희2 원본 데이터 확인
                const kimSunHee2Original = data.find(c => c.name === '김선희2');
                if (kimSunHee2Original) {
                    console.log('🔍 김선희2 원본 API 데이터:', kimSunHee2Original);
                } else {
                    console.log('❌ 김선희2를 원본 데이터에서 찾을 수 없습니다');
                }
                
                // 김선희2 데이터 특별 확인
                const kimSunHee2 = data.find(c => c.name === '김선희2');
                if (kimSunHee2) {
                    console.log('🔍 김선희2 상세 데이터:', kimSunHee2);
                    console.log('🔍 김선희2 휴가 정보:', {
                        isOnVacation: kimSunHee2.isOnVacation,
                        vacationType: kimSunHee2.vacationType,
                        vacationReason: kimSunHee2.vacationReason,
                        busy: kimSunHee2.busy,
                        isVacation: kimSunHee2.isVacation
                    });
                } else {
                    console.log('🔍 김선희2를 찾을 수 없습니다.');
                }
                
                const consultantsWithAvailability = data
                    .filter((consultant) => {
                        // 종일 휴가인 상담사는 목록에서 제외
                        const isOnVacation = consultant.isOnVacation || false;
                        const vacationType = consultant.vacationType;
                        
                        console.log(`🔍 상담사 ${consultant.name} - isOnVacation: ${isOnVacation}, vacationType: ${vacationType}`);
                        
                        // 김선희2에 대한 특별 로그
                        if (consultant.name === '김선희2') {
                            console.log(`🔍 김선희2 필터링 체크:`, {
                                isOnVacation: isOnVacation,
                                vacationType: vacationType,
                                isOnVacationType: typeof isOnVacation,
                                vacationTypeType: typeof vacationType,
                                isOnVacationValue: consultant.isOnVacation,
                                vacationTypeValue: consultant.vacationType
                            });
                        }
                        
                        // 모든 상담사를 포함하되, 휴가 정보는 표시
                        console.log(`✅ 상담사 ${consultant.name} 포함됨 (휴가: ${isOnVacation}, 타입: ${vacationType})`);
                        return true; // 모든 상담사 포함
                    })
                    .map((consultant, index) => {
                        // 휴무 상태 확인
                        const isOnVacation = consultant.isOnVacation || false;
                        
                        // 김선희2 매핑 과정 디버깅
                        if (consultant.name === '김선희2') {
                            console.log('🔍 김선희2 매핑 전 데이터:', {
                                originalIsOnVacation: consultant.isOnVacation,
                                originalVacationType: consultant.vacationType,
                                originalVacationReason: consultant.vacationReason
                            });
                            console.log('🔍 김선희2 매핑 후 isOnVacation:', isOnVacation);
                        }
                        
                        // 종일 휴가인 경우만 선택 불가능, 반차나 시간 지정 휴가는 선택 가능
                        const isFullDayVacation = isOnVacation && 
                            (consultant.vacationType === 'FULL_DAY' || consultant.vacationType === 'ALL_DAY');
                        
                        const mappedConsultant = {
                            ...consultant,
                            id: `consultant-${consultant.id}-${index}`,
                            originalId: consultant.id,
                            type: 'consultant',
                            available: !isFullDayVacation, // 종일 휴가가 아니면 선택 가능
                            busy: isOnVacation, // 휴무 상태면 바쁨으로 표시
                            reason: isOnVacation ? '휴무' : null,
                            isOnVacation: isOnVacation, // 휴가 여부 추가
                            vacationType: consultant.vacationType,
                            vacationReason: consultant.vacationReason,
                            vacationStartTime: consultant.vacationStartTime,
                            vacationEndTime: consultant.vacationEndTime
                        };
                        
                        // 김선희2 매핑 후 데이터 확인
                        if (consultant.name === '김선희2') {
                            console.log('🔍 김선희2 매핑 후 최종 데이터:', {
                                isOnVacation: mappedConsultant.isOnVacation,
                                vacationType: mappedConsultant.vacationType,
                                vacationReason: mappedConsultant.vacationReason,
                                available: mappedConsultant.available,
                                busy: mappedConsultant.busy
                            });
                        }
                        
                        return mappedConsultant;
                    });
                setConsultants(consultantsWithAvailability);
                console.log('👨‍⚕️ 상담사 목록 로드 완료 (실제 API)');
                console.log('👨‍⚕️ 필터링 후 상담사 목록:', consultantsWithAvailability.map(c => ({name: c.name, isOnVacation: c.isOnVacation, vacationType: c.vacationType})));
                console.log('👨‍⚕️ 필터링 후 상담사 수:', consultantsWithAvailability.length);
                
                // 김선희2가 필터링 후에도 남아있는지 확인
                const kimSunHee2AfterFilter = consultantsWithAvailability.find(c => c.name === '김선희2');
                if (kimSunHee2AfterFilter) {
                    console.log('⚠️ 김선희2가 필터링 후에도 남아있습니다!', kimSunHee2AfterFilter);
                } else {
                    console.log('✅ 김선희2가 올바르게 필터링되었습니다.');
                }
            } else {
                console.error('상담사 목록 로드 실패:', response.status);
                notificationManager.error('상담사 목록을 불러올 수 없습니다.');
                setConsultants([]);
            }
        } catch (error) {
            console.error('상담사 목록 로드 실패:', error);
            notificationManager.error('상담사 목록을 불러오는 중 오류가 발생했습니다.');
            setConsultants([]);
        } finally {
            setLoading(false);
        }
    }, [selectedDate]);


/**
     * 필터 적용
     */
    const applyFilters = useCallback(() => {
        let filtered = [...consultants];

        // 전문분야 필터
        if (filters.specialty) {
            filtered = filtered.filter(consultant => 
                consultant.specialties?.includes(filters.specialty) ||
                consultant.specialty === filters.specialty
            );
        }

        // 가용성 필터
        if (filters.availability === 'available') {
            filtered = filtered.filter(consultant => consultant.available && !consultant.busy);
        } else if (filters.availability === 'busy') {
            // 바쁨 필터: busy 상태이지만 휴가가 아닌 상담사 (스케줄로 인한 바쁨)
            filtered = filtered.filter(consultant => consultant.busy && !consultant.isVacation);
        } else if (filters.availability === 'unavailable') {
            // 휴무 필터: 휴가 중인 상담사
            filtered = filtered.filter(consultant => consultant.isVacation);
        }

        // 검색 필터
        if (filters.search) {
            const searchTerm = filters.search.toLowerCase();
            filtered = filtered.filter(consultant =>
                consultant.name.toLowerCase().includes(searchTerm) ||
                consultant.title?.toLowerCase().includes(searchTerm) ||
                consultant.specialties?.some(s => s.toLowerCase().includes(searchTerm))
            );
        }

        setFilteredConsultants(filtered);
    }, [consultants, filters]);

    // 모바일 감지
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth <= 768);
        };
        
        checkMobile();
        window.addEventListener('resize', checkMobile);
        
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    useEffect(() => {
        loadConsultants();
    }, [loadConsultants]);

    useEffect(() => {
        applyFilters();
    }, [applyFilters]);

/**
     * 상담사 선택 핸들러
     */
    const handleConsultantSelect = (consultant) => {
        if (!consultant.available) {
            notificationManager.error('해당 상담사는 현재 사용할 수 없습니다.');
            return;
        }

        onConsultantSelect(consultant);
    };

/**
     * 필터 변경 핸들러
     */
    const handleFilterChange = (newFilters) => {
        setFilters(prev => ({ ...prev, ...newFilters }));
    };

/**
     * 필터 초기화
     */
    const handleResetFilters = () => {
        setFilters({
            specialty: '',
            availability: 'all',
            search: ''
        });
    };

    console.log('🔍 ConsultantSelectionStepNew 렌더링:', { 
        loading, 
        consultantsCount: consultants.length, 
        filteredCount: filteredConsultants.length,
        consultants: consultants,
        filteredConsultants: filteredConsultants,
        filters: filters
    });

    // 로딩 상태 처리
    if (loading && consultants.length === 0) {
        return (
            <div className="consultant-selection-step">
                <div className="mg-loading">로딩중...</div>
            </div>
        );
    }

    return (
        <div className="consultant-selection-step">
            {/* 단계 헤더 */}
            <div className="consultant-selection-header">
                <h4 className="consultant-selection-title">👨‍⚕️ 상담사를 선택하세요</h4>
                <p className="consultant-selection-subtitle">
                    {selectedDate?.toLocaleDateString('ko-KR', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                    })}에 상담 가능한 상담사를 선택하세요
                </p>
            </div>

            {/* 필터 섹션 */}
            <div className="consultant-selection-filter-section">
                <ConsultantFilter
                    filters={filters}
                    onFilterChange={handleFilterChange}
                    onResetFilters={handleResetFilters}
                    consultantCount={filteredConsultants.length}
                />
            </div>

            {/* 상담사 그리드 */}
            <div className="mg-consultant-cards-grid mg-consultant-cards-grid--detailed">
                {filteredConsultants.length === 0 ? (
                    <div className="mg-empty-state">
                        <div className="mg-empty-state__icon">👨‍⚕️</div>
                        <p className="mg-empty-state__text">조건에 맞는 상담사가 없습니다.</p>
                        <small className="mg-empty-state__hint">필터를 조정해보세요.</small>
                    </div>
                ) : (
                    filteredConsultants.map(consultant => (
                        <ConsultantCard
                            key={consultant.id}
                            consultant={consultant}
                            onClick={() => handleConsultantSelect(consultant)}
                            selected={selectedConsultant?.id === consultant.id}
                            draggable={false}
                            variant={isMobile ? 'mobile-simple' : 'detailed'}
                        />
                    ))
                )}
            </div>

            {/* 선택된 상담사 정보 */}
            {selectedConsultant && (
                <div className="consultant-selection-selected">
                    <div className="consultant-selection-selected-text">
                        <strong>선택된 상담사:</strong> {selectedConsultant.name}
                        <SpecialtyDisplay 
                            consultant={selectedConsultant} 
                            variant="inline" 
                            maxItems={20}
                            debug={true}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default ConsultantSelectionStepNew;
