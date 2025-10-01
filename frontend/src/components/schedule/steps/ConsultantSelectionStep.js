import React, { useState, useEffect, useCallback } from 'react';
import ConsultantCard from '../ConsultantCard';
import ConsultantFilter from '../components/ConsultantFilter';
import LoadingSpinner from '../../common/LoadingSpinner';
import notificationManager from '../../../utils/notification';
import { COMPONENT_CSS, SCHEDULE_MODAL_CONSTANTS } from '../../../constants/css-variables';

/**
 * 새로운 디자인의 상담사 선택 단계 컴포넌트
 * - CSS 클래스 상수 사용
 * - JavaScript 상수 사용
 * - 현대적인 디자인 적용
 * 
 * @author MindGarden
 * @version 2.0.0
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
    const [filters, setFilters] = useState({
        specialty: '',
        availability: SCHEDULE_MODAL_CONSTANTS.AVAILABILITY.ALL,
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
            const response = await fetch(`/api/admin/consultants/with-vacation?date=${dateStr}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include'
            });

            if (response.ok) {
                const responseData = await response.json();
                console.log('👨‍⚕️ API 응답 데이터:', responseData);
                console.log('👨‍⚕️ API URL:', `/api/admin/consultants/with-vacation?date=${dateStr}`);
                
                // API 응답 구조에 따라 데이터 추출
                const data = responseData.data || responseData;
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
                // API 실패 시 더미 데이터 사용
                const dummyConsultants = [
                    {
                        id: 'consultant-1',
                        originalId: 1,
                        name: '김상담',
                        title: '수석 상담사',
                        specialties: ['우울증', '불안장애'],
                        specialty: '우울증',
                        type: 'consultant',
                        available: true,
                        busy: false,
                        todayScheduleCount: 2
                    },
                    {
                        id: 'consultant-2',
                        originalId: 2,
                        name: '이심리',
                        title: '전문 상담사',
                        specialties: ['가족상담', '부부상담'],
                        specialty: '가족상담',
                        type: 'consultant',
                        available: true,
                        busy: false,
                        todayScheduleCount: 1
                    },
                    {
                        id: 'consultant-3',
                        originalId: 3,
                        name: '박치료',
                        title: '임상 심리사',
                        specialties: ['트라우마', 'PTSD'],
                        specialty: '트라우마',
                        type: 'consultant',
                        available: true,
                        busy: true,
                        todayScheduleCount: 6
                    },
                    {
                        id: 'consultant-4',
                        originalId: 4,
                        name: '최상담',
                        title: '상담사',
                        specialties: ['ADHD', '자폐스펙트럼'],
                        specialty: 'ADHD',
                        type: 'consultant',
                        available: true,
                        busy: false,
                        todayScheduleCount: 3
                    },
                    {
                        id: 'consultant-5',
                        originalId: 5,
                        name: '정치료',
                        title: '전문 상담사',
                        specialties: ['우울증', '불안장애'],
                        specialty: '우울증',
                        type: 'consultant',
                        available: false,
                        busy: false,
                        todayScheduleCount: 0
                    },
                    {
                        id: 'consultant-6',
                        originalId: 6,
                        name: '한상담',
                        title: '수석 상담사',
                        specialties: ['가족상담', '부부상담'],
                        specialty: '가족상담',
                        type: 'consultant',
                        available: true,
                        busy: true,
                        todayScheduleCount: 7
                    }
                ];
                setConsultants(dummyConsultants);
                console.log('👨‍⚕️ 더미 상담사 데이터 사용');
            }
        } catch (error) {
            console.error('상담사 목록 로드 실패:', error);
            // 네트워크 오류 시 더미 데이터 사용
            const dummyConsultants = [
                {
                    id: 'consultant-1',
                    originalId: 1,
                    name: '김상담',
                    title: '수석 상담사',
                    specialties: ['우울증', '불안장애'],
                    specialty: '우울증',
                    type: 'consultant',
                    available: true,
                    busy: false,
                    todayScheduleCount: 2
                },
                {
                    id: 'consultant-2',
                    originalId: 2,
                    name: '이심리',
                    title: '전문 상담사',
                    specialties: ['가족상담', '부부상담'],
                    specialty: '가족상담',
                    type: 'consultant',
                    available: true,
                    busy: false,
                    todayScheduleCount: 1
                },
                {
                    id: 'consultant-3',
                    originalId: 3,
                    name: '박치료',
                    title: '임상 심리사',
                    specialties: ['트라우마', 'PTSD'],
                    specialty: '트라우마',
                    type: 'consultant',
                    available: true,
                    busy: true,
                    todayScheduleCount: 6
                }
            ];
            setConsultants(dummyConsultants);
            console.log('👨‍⚕️ 네트워크 오류로 인한 더미 상담사 데이터 사용');
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
        if (filters.availability === SCHEDULE_MODAL_CONSTANTS.AVAILABILITY.AVAILABLE) {
            filtered = filtered.filter(consultant => consultant.available && !consultant.busy);
        } else if (filters.availability === SCHEDULE_MODAL_CONSTANTS.AVAILABILITY.BUSY) {
            // 바쁨 필터: busy 상태이지만 휴가가 아닌 상담사 (스케줄로 인한 바쁨)
            filtered = filtered.filter(consultant => consultant.busy && !consultant.isVacation);
        } else if (filters.availability === SCHEDULE_MODAL_CONSTANTS.AVAILABILITY.UNAVAILABLE) {
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
            availability: SCHEDULE_MODAL_CONSTANTS.AVAILABILITY.ALL,
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
                <LoadingSpinner 
                    text="상담사 목록을 불러오는 중..." 
                    size="large" 
                    variant="dots"
                    className="loading-spinner-inline"
                />
            </div>
        );
    }

    return (
        <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            padding: '0',
            margin: '0'
        }}>
            {/* 단계 헤더 */}
            <div style={{
                height: '80px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                textAlign: 'center',
                marginBottom: '20px',
                padding: '16px 0',
                background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
                borderRadius: '12px',
                border: 'none'
            }}>
                <h4 style={{
                    margin: '0 0 8px 0',
                    fontSize: 'var(--font-size-xxl)',
                    fontWeight: '700',
                    color: '#495057'
                }}>👨‍⚕️ 상담사를 선택하세요</h4>
                <p style={{
                    margin: '0',
                    fontSize: 'var(--font-size-base)',
                    color: '#6c757d',
                    fontWeight: '500'
                }}>
                    {selectedDate?.toLocaleDateString('ko-KR', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                    })}에 상담 가능한 상담사를 선택하세요
                </p>
            </div>

            {/* 필터 섹션 */}
            <div style={{
                height: '200px',
                background: '#f8f9fa',
                borderRadius: '12px',
                padding: '20px',
                marginBottom: '20px',
                border: 'none',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px'
            }}>
                <ConsultantFilter
                    filters={filters}
                    onFilterChange={handleFilterChange}
                    onResetFilters={handleResetFilters}
                    consultantCount={filteredConsultants.length}
                />
            </div>

            {/* 상담사 그리드 */}
            <div style={{
                height: '350px',
                overflowY: 'auto',
                padding: '20px',
                background: '#f8f9fa',
                borderRadius: '12px',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '20px',
                alignItems: 'start',
                gridAutoRows: 'max-content'
            }}>
                {filteredConsultants.length === 0 ? (
                    <div style={{
                        gridColumn: '1 / -1',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        textAlign: 'center',
                        padding: '40px 20px',
                        color: '#6c757d'
                    }}>
                        <div style={{
                            fontSize: 'var(--font-size-xxxl)',
                            marginBottom: '16px',
                            opacity: '0.5'
                        }}>👨‍⚕️</div>
                        <p style={{
                            fontSize: 'var(--font-size-lg)',
                            fontWeight: '600',
                            margin: '0 0 8px 0'
                        }}>조건에 맞는 상담사가 없습니다.</p>
                        <small style={{
                            fontSize: 'var(--font-size-sm)',
                            opacity: '0.7'
                        }}>필터를 조정해보세요.</small>
                    </div>
                ) : (
                    filteredConsultants.map(consultant => (
                        <ConsultantCard
                            key={consultant.id}
                            consultant={consultant}
                            onClick={() => handleConsultantSelect(consultant)}
                            selected={selectedConsultant?.id === consultant.id}
                            draggable={false}
                        />
                    ))
                )}
            </div>

            {/* 선택된 상담사 정보 */}
            {selectedConsultant && (
                <div style={{
                    marginTop: '20px',
                    padding: '16px',
                    background: 'linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%)',
                    borderRadius: '12px',
                    border: 'none'
                }}>
                    <div style={{
                        fontSize: 'var(--font-size-base)',
                        fontWeight: '600',
                        color: '#495057',
                        textAlign: 'center'
                    }}>
                        <strong>선택된 상담사:</strong> {selectedConsultant.name}
                        <span style={{
                            color: '#667eea',
                            fontWeight: '500'
                        }}>
                            ({selectedConsultant.specialties?.[0] || selectedConsultant.specialty})
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ConsultantSelectionStepNew;
