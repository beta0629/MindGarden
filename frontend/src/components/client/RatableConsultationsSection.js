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
            <div className="mg-card">
                <div className="mg-loading-container">
                    <div className="mg-spinner"></div>
                    <p>평가 가능한 상담을 불러오는 중...</p>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="mg-card">
                {/* 섹션 헤더 */}
                <div className="mg-card-header">
                    <div className="mg-flex mg-align-center mg-gap-sm">
                        <h3 className="mg-h4 mg-mb-0">
                            💖 상담사님께 감사 인사를
                        </h3>
                        <span className="mg-badge mg-badge-primary">
                            {ratableSchedules.length}개
                        </span>
                    </div>
                    <p className="mg-text-sm mg-color-text-secondary mg-mt-sm mg-mb-0">
                        완료된 상담에 대해 하트 점수로 평가해주세요
                    </p>
                </div>

                {/* 평가 가능한 상담 목록 */}
                <div className="mg-card-body">
                    {showTestData ? (
                        <div className="mg-empty-state">
                            <div className="mg-empty-state__icon">🔧</div>
                            <div className="mg-empty-state__text">
                                평가 시스템 준비 중입니다
                            </div>
                            <div className="mg-empty-state__hint">
                                데이터베이스 테이블 생성 중... 잠시 후 다시 시도해주세요
                            </div>
                        </div>
                    ) : ratableSchedules.length === 0 ? (
                        <div className="mg-empty-state">
                            <div className="mg-empty-state__icon">💭</div>
                            <div className="mg-empty-state__text">
                                평가 가능한 상담이 없습니다
                            </div>
                            <div className="mg-empty-state__hint">
                                상담을 완료하시면 평가할 수 있어요
                            </div>
                        </div>
                    ) : (
                        <div className="mg-space-y-sm">
                            {ratableSchedules.map(schedule => (
                                <div key={schedule.scheduleId} className="mg-card mg-card-hover">
                                    <div className="mg-flex mg-justify-between mg-align-center">
                                        <div className="mg-flex-1">
                                            <div className="mg-text-base mg-font-semibold mg-color-text-primary mg-mb-xs">
                                                {schedule.consultantName}님과의 상담
                                            </div>
                                            <div className="mg-text-sm mg-color-text-secondary mg-mb-xs">
                                                {schedule.consultationDate} {schedule.consultationTime}
                                            </div>
                                            <div className="mg-text-xs mg-color-success mg-font-medium">
                                                ✅ 상담 완료
                                            </div>
                                        </div>
                                        <button
                                            className="mg-button mg-button-primary mg-button-small"
                                            onClick={() => handleRateConsultant(schedule)}
                                        >
                                            💖 평가하기
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
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
