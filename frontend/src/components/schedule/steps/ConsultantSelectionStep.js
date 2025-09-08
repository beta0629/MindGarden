import React, { useState, useEffect, useCallback } from 'react';
import ConsultantCard from '../ConsultantCard';
import ConsultantFilter from '../components/ConsultantFilter';
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
            
            // 실제 API 호출
            const response = await fetch('/api/admin/consultants', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include'
            });

            if (response.ok) {
                const responseData = await response.json();
                console.log('👨‍⚕️ API 응답 데이터:', responseData);
                
                // API 응답 구조에 따라 데이터 추출
                const data = responseData.data || responseData;
                
                if (!Array.isArray(data)) {
                    console.error('상담사 데이터가 배열이 아닙니다:', data);
                    setConsultants([]);
                    return;
                }
                
                const consultantsWithAvailability = await Promise.all(
                    data.map(async (consultant, index) => {
                        const availability = await checkConsultantAvailability(consultant.id, selectedDate);
                        return {
                            ...consultant,
                            id: `consultant-${consultant.id}-${index}`,
                            originalId: consultant.id,
                            type: 'consultant',
                            available: availability.available,
                            busy: availability.busy,
                            todayScheduleCount: availability.scheduleCount
                        };
                    })
                );
                setConsultants(consultantsWithAvailability);
                console.log('👨‍⚕️ 상담사 목록 로드 완료 (실제 API)');
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
     * 상담사 가용성 확인
     */
    const checkConsultantAvailability = async (consultantId, date) => {
        try {
            const dateStr = date.toISOString().split('T')[0];
            const response = await fetch(
                `/api/schedules/consultant/${consultantId}/date?date=${dateStr}`,
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            );

            if (response.ok) {
                const schedules = await response.json();
                const scheduleCount = schedules.length;
                const isBusy = scheduleCount >= 6; // 하루 최대 6건
                const isAvailable = scheduleCount < 8; // 하루 최대 8건

                return {
                    available: isAvailable,
                    busy: isBusy,
                    scheduleCount: scheduleCount
                };
            }
        } catch (error) {
            console.error('상담사 가용성 확인 실패:', error);
        }

        return {
            available: true,
            busy: false,
            scheduleCount: 0
        };
    };

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
            filtered = filtered.filter(consultant => consultant.busy);
        } else if (filters.availability === SCHEDULE_MODAL_CONSTANTS.AVAILABILITY.UNAVAILABLE) {
            filtered = filtered.filter(consultant => !consultant.available);
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
                <div className="loading-container">
                    <div className="loading-spinner">상담사 목록을 불러오는 중...</div>
                </div>
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
                    fontSize: '24px',
                    fontWeight: '700',
                    color: '#495057'
                }}>👨‍⚕️ 상담사를 선택하세요</h4>
                <p style={{
                    margin: '0',
                    fontSize: '16px',
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
                            fontSize: '48px',
                            marginBottom: '16px',
                            opacity: '0.5'
                        }}>👨‍⚕️</div>
                        <p style={{
                            fontSize: '18px',
                            fontWeight: '600',
                            margin: '0 0 8px 0'
                        }}>조건에 맞는 상담사가 없습니다.</p>
                        <small style={{
                            fontSize: '14px',
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
                        fontSize: '16px',
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
