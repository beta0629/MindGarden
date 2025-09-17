import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../constants/api';
import { useSession } from '../../contexts/SessionContext';
import ConsultantRatingModal from './ConsultantRatingModal';

/**
 * 평가 가능한 상담 목록 섹션
 * - 완료된 상담 중 아직 평가하지 않은 것들 표시
 * - 하트 평가 모달 연동
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-09-17
 */
const RatableConsultationsSection = () => {
    const { user } = useSession();
    const [ratableSchedules, setRatableSchedules] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedSchedule, setSelectedSchedule] = useState(null);
    const [showRatingModal, setShowRatingModal] = useState(false);
    const [showTestData, setShowTestData] = useState(false);

    useEffect(() => {
        console.log('💖 RatableConsultationsSection 마운트됨, 사용자:', user);
        if (user?.id) {
            console.log('💖 평가 가능한 상담 로드 시작, 사용자 ID:', user.id);
            loadRatableSchedules();
        } else {
            console.log('💖 사용자 정보 없음, 평가 섹션 대기 중');
        }
    }, [user]);

    const loadRatableSchedules = async () => {
        if (!user?.id) return;

        setLoading(true);
        try {
            console.log('💖 API 호출 시작:', `${API_BASE_URL}/api/ratings/client/${user.id}/ratable-schedules`);
            
            const response = await fetch(`${API_BASE_URL}/api/ratings/client/${user.id}/ratable-schedules`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include'
            });

            console.log('💖 API 응답 상태:', response.status);
            const result = await response.json();
            console.log('💖 API 응답 데이터:', result);

            if (result.success) {
                console.log('💖 평가 가능한 상담 개수:', result.data?.length || 0);
                setRatableSchedules(result.data || []);
            } else {
                console.error('💖 평가 가능한 상담 조회 실패:', result.message);
                // API 오류 시 테스트 데이터 표시
                console.log('💖 테스트 데이터 표시');
                setShowTestData(true);
            }

        } catch (error) {
            console.error('💖 평가 가능한 상담 조회 오류:', error);
            // API 오류 시 테스트 데이터 표시
            console.log('💖 테스트 데이터 표시');
            setShowTestData(true);
        } finally {
            setLoading(false);
        }
    };

    const handleRateConsultant = (schedule) => {
        setSelectedSchedule(schedule);
        setShowRatingModal(true);
    };

    const handleRatingComplete = () => {
        // 평가 완료 후 목록 새로고침
        loadRatableSchedules();
        setShowRatingModal(false);
        setSelectedSchedule(null);
    };

    if (loading) {
        return (
            <div style={{
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                padding: '24px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                marginBottom: '24px'
            }}>
                <div style={{ textAlign: 'center', color: '#666' }}>
                    평가 가능한 상담을 불러오는 중...
                </div>
            </div>
        );
    }

    // 디버깅을 위해 항상 섹션 표시
    console.log('💖 렌더링 체크:', { 
        loading, 
        ratableSchedulesLength: ratableSchedules.length, 
        user: user?.id,
        userRole: user?.role 
    });

    return (
        <>
            <div style={{
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                padding: '24px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                marginBottom: '24px'
            }}>
                {/* 섹션 헤더 */}
                <div style={{ marginBottom: '20px' }}>
                    <h3 style={{
                        fontSize: '18px',
                        fontWeight: '600',
                        color: '#333',
                        marginBottom: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}>
                        💖 상담사님께 감사 인사를
                        <span style={{
                            backgroundColor: '#e7f3ff',
                            color: '#0066cc',
                            fontSize: '12px',
                            fontWeight: '500',
                            padding: '2px 8px',
                            borderRadius: '12px'
                        }}>
                            {ratableSchedules.length}개
                        </span>
                    </h3>
                    <p style={{
                        fontSize: '14px',
                        color: '#666',
                        margin: 0
                    }}>
                        완료된 상담에 대해 하트 점수로 평가해주세요
                    </p>
                </div>

                {/* 평가 가능한 상담 목록 */}
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                }}>
                    {showTestData ? (
                        <div style={{
                            textAlign: 'center',
                            padding: '32px',
                            color: '#666',
                            backgroundColor: '#fff3cd',
                            borderRadius: '8px',
                            border: '1px solid #ffeaa7'
                        }}>
                            <div style={{ fontSize: '24px', marginBottom: '12px' }}>🔧</div>
                            <div style={{ fontSize: '15px', marginBottom: '8px' }}>
                                평가 시스템 준비 중입니다
                            </div>
                            <div style={{ fontSize: '13px', color: '#856404' }}>
                                데이터베이스 테이블 생성 중... 잠시 후 다시 시도해주세요
                            </div>
                        </div>
                    ) : ratableSchedules.length === 0 ? (
                        <div style={{
                            textAlign: 'center',
                            padding: '32px',
                            color: '#666',
                            backgroundColor: '#f8f9fa',
                            borderRadius: '8px',
                            border: '1px solid #e9ecef'
                        }}>
                            <div style={{ fontSize: '24px', marginBottom: '12px' }}>💭</div>
                            <div style={{ fontSize: '15px', marginBottom: '8px' }}>
                                평가 가능한 상담이 없습니다
                            </div>
                            <div style={{ fontSize: '13px', color: '#999' }}>
                                상담을 완료하시면 평가할 수 있어요
                            </div>
                        </div>
                    ) : (
                        ratableSchedules.map(schedule => (
                        <div
                            key={schedule.scheduleId}
                            style={{
                                border: '1px solid #e9ecef',
                                borderRadius: '8px',
                                padding: '16px',
                                backgroundColor: '#fefefe',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <div>
                                    <div style={{
                                        fontSize: '15px',
                                        fontWeight: '500',
                                        color: '#333',
                                        marginBottom: '4px'
                                    }}>
                                        {schedule.consultantName}님과의 상담
                                    </div>
                                    <div style={{
                                        fontSize: '13px',
                                        color: '#666'
                                    }}>
                                        {schedule.consultationDate} {schedule.consultationTime}
                                    </div>
                                    <div style={{
                                        fontSize: '12px',
                                        color: '#28a745',
                                        marginTop: '2px'
                                    }}>
                                        ✅ 상담 완료
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleRateConsultant(schedule)}
                                    style={{
                                        padding: '8px 16px',
                                        borderRadius: '20px',
                                        border: 'none',
                                        backgroundColor: '#ff6b9d',
                                        color: '#ffffff',
                                        fontSize: '13px',
                                        fontWeight: '500',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.target.style.backgroundColor = '#ff5588';
                                        e.target.style.transform = 'scale(1.05)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.target.style.backgroundColor = '#ff6b9d';
                                        e.target.style.transform = 'scale(1)';
                                    }}
                                >
                                    💖 평가하기
                                </button>
                            </div>
                        </div>
                        ))
                    )}
                </div>
            </div>

            {/* 평가 모달 */}
            <ConsultantRatingModal
                isOpen={showRatingModal}
                onClose={() => {
                    setShowRatingModal(false);
                    setSelectedSchedule(null);
                }}
                schedule={selectedSchedule}
                onRatingComplete={handleRatingComplete}
            />
        </>
    );
};

export default RatableConsultationsSection;
