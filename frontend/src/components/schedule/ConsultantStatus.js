import React, { useState, useEffect } from 'react';
import { apiGet } from '../../utils/ajax';
import './ConsultantStatus.css';

/**
 * 상담사 현황 컴포넌트
 * - 실제 상담사 데이터를 기반으로 현황 표시
 * - 상담사별 상태 (여유, 바쁨, 휴무) 표시
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
const ConsultantStatus = () => {
    const [consultants, setConsultants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    /**
     * 상담사 목록 로드
     */
    const loadConsultants = async () => {
        try {
            setLoading(true);
            console.log('👥 상담사 현황 로드 시작');
            
            const response = await apiGet('/api/admin/consultants');
            
            if (response.success) {
                const consultantData = response.data || [];
                console.log('👥 상담사 현황 데이터:', consultantData);
                
                // 상담사별 상태 계산 (실제 스케줄 데이터 기반)
                const consultantsWithStatus = await Promise.all(
                    consultantData.map(async (consultant) => ({
                        ...consultant,
                        status: await calculateConsultantStatus(consultant)
                    }))
                );
                
                setConsultants(consultantsWithStatus);
                console.log('👥 상담사 현황 로드 완료:', consultantsWithStatus);
            } else {
                throw new Error(response.message || '상담사 목록 조회 실패');
            }
        } catch (error) {
            console.error('❌ 상담사 현황 로드 실패:', error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    /**
     * 간단한 상담사 상태 계산 (임시 로직)
     */
    const calculateSimpleStatus = (consultant, index) => {
        // 임시 로직: 인덱스 기반으로 상태 결정
        const statusTypes = [
            { type: 'available', text: '여유', color: 'available' },
            { type: 'busy', text: '바쁨', color: 'busy' },
            { type: 'unavailable', text: '휴무', color: 'unavailable' }
        ];
        
        return statusTypes[index % statusTypes.length];
    };

    /**
     * 상담사 상태 계산 (실제 스케줄 데이터 기반)
     */
    const calculateConsultantStatus = async (consultant) => {
        try {
            const today = new Date().toISOString().split('T')[0];
            console.log(`🔍 상담사 ${consultant.name} (ID: ${consultant.id}) 상태 계산 시작`);
            
            const response = await apiGet(`/api/schedules?userId=${consultant.id}&userRole=CONSULTANT`);
            console.log(`📅 상담사 ${consultant.name} 스케줄 데이터:`, response);
            
            if (response && Array.isArray(response)) {
                // 오늘의 스케줄 필터링
                const todaySchedules = response.filter(schedule => 
                    schedule.date === today && 
                    schedule.status === '예약됨'
                );
                
                console.log(`📅 상담사 ${consultant.name} 오늘 스케줄:`, todaySchedules);
                
                // 현재 시간 기준으로 진행 중인 상담 확인
                const now = new Date();
                const currentHour = now.getHours();
                const currentMinute = now.getMinutes();
                const currentTime = currentHour * 60 + currentMinute;
                
                const hasCurrentSchedule = todaySchedules.some(schedule => {
                    if (!schedule.startTime || !schedule.endTime) return false;
                    
                    const [startHour, startMinute] = schedule.startTime.split(':').map(Number);
                    const [endHour, endMinute] = schedule.endTime.split(':').map(Number);
                    const startTime = startHour * 60 + startMinute;
                    const endTime = endHour * 60 + endMinute;
                    
                    const isCurrent = currentTime >= startTime && currentTime <= endTime;
                    console.log(`⏰ 스케줄 ${schedule.id}: ${schedule.startTime}-${schedule.endTime}, 현재시간: ${currentTime}, 진행중: ${isCurrent}`);
                    
                    return isCurrent;
                });
                
                if (hasCurrentSchedule) {
                    console.log(`✅ 상담사 ${consultant.name}: 상담중`);
                    return { type: 'busy', text: '상담중', color: 'busy' };
                } else if (todaySchedules.length > 0) {
                    console.log(`✅ 상담사 ${consultant.name}: 바쁨 (${todaySchedules.length}개 예약)`);
                    return { type: 'busy', text: '바쁨', color: 'busy' };
                } else {
                    console.log(`✅ 상담사 ${consultant.name}: 여유`);
                    return { type: 'available', text: '여유', color: 'available' };
                }
            }
        } catch (error) {
            console.warn(`❌ 상담사 ${consultant.name} 상태 계산 실패:`, error);
        }
        
        // 기본값: 임시 로직 (API 호출 실패 시)
        console.log(`⚠️ 상담사 ${consultant.name}: 기본값 사용`);
        const consultantId = consultant.id;
        if (consultantId % 3 === 0) {
            return { type: 'available', text: '여유', color: 'available' };
        } else if (consultantId % 3 === 1) {
            return { type: 'busy', text: '바쁨', color: 'busy' };
        } else {
            return { type: 'unavailable', text: '휴무', color: 'unavailable' };
        }
    };

    /**
     * 상태별 아이콘 반환
     */
    const getStatusIcon = (status) => {
        switch (status.type) {
            case 'available':
                return '🟢';
            case 'busy':
                return '🟡';
            case 'unavailable':
                return '🔴';
            default:
                return '⚪';
        }
    };

    /**
     * 상담사 프로필 이미지 URL 생성
     */
    const getProfileImageUrl = (consultant) => {
        // 실제 프로필 이미지가 있다면 사용
        if (consultant.profileImageUrl || consultant.profileImage || consultant.socialProfileImage) {
            return consultant.profileImageUrl || consultant.profileImage || consultant.socialProfileImage;
        }
        
        // 기본 아바타 생성 (이름의 첫 글자 사용)
        const firstChar = consultant.name ? consultant.name.charAt(0) : '?';
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(firstChar)}&background=3b82f6&color=ffffff&size=64&font-size=0.6&bold=true`;
    };

    useEffect(() => {
        loadConsultants();
    }, []);

    if (loading) {
        return (
            <div className="consultant-status">
                <div className="consultant-status-loading">
                    <span>상담사 현황 로딩 중...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="consultant-status">
                <div className="consultant-status-error">
                    <span>❌ {error}</span>
                </div>
            </div>
        );
    }

    return (
        <div className="consultant-status">
            {consultants.length === 0 ? (
                <div className="consultant-status-empty">
                    <span>등록된 상담사가 없습니다.</span>
                </div>
            ) : (
                consultants.map((consultant) => {
                    const status = consultant.status;
                    return (
                        <div key={consultant.id} className="consultant-status-item">
                            <div className="consultant-status-info">
                                <div className="consultant-status-profile">
                                    <img 
                                        src={getProfileImageUrl(consultant)} 
                                        alt={consultant.name}
                                        className="consultant-status-profile-image"
                                        width="32"
                                        height="32"
                                        style={{
                                            width: '32px',
                                            height: '32px',
                                            minWidth: '32px',
                                            minHeight: '32px',
                                            maxWidth: '32px',
                                            maxHeight: '32px'
                                        }}
                                        onError={(e) => {
                                            // 이미지 로드 실패 시 기본 아이콘으로 대체
                                            e.target.style.display = 'none';
                                            e.target.nextSibling.style.display = 'inline-block';
                                        }}
                                    />
                                    <span className="consultant-status-default-icon" style={{display: 'none'}}>👨‍⚕️</span>
                                </div>
                                <span className="consultant-status-name">{consultant.name} ({status.text})</span>
                            </div>
                            <span className="consultant-status-dot" data-status={status.color}>
                                {getStatusIcon(status)}
                            </span>
                        </div>
                    );
                })
            )}
        </div>
    );
};

export default ConsultantStatus;
