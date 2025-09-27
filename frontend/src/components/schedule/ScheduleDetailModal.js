import React, { useState, useEffect, useCallback } from 'react';
import { apiPut, apiGet } from '../../utils/ajax';
import notificationManager from '../../utils/notification';
import './ScheduleDetailModal.css';

/**
 * 스케줄 상세 정보 및 관리 모달
 * - 스케줄 정보 표시
 * - 예약 취소 기능
 * - 상태 변경 기능
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
const ScheduleDetailModal = ({ 
    isOpen, 
    onClose, 
    scheduleData, 
    onScheduleUpdated 
}) => {
    const [loading, setLoading] = useState(false);
    const [showCancelConfirm, setShowCancelConfirm] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [adminNote, setAdminNote] = useState('');
    const [scheduleStatusOptions, setScheduleStatusOptions] = useState([]);
    const [loadingCodes, setLoadingCodes] = useState(false);
    

    // 일정 상태 코드 로드
    const loadScheduleStatusCodes = useCallback(async () => {
        try {
            setLoadingCodes(true);
            const response = await apiGet('/api/common-codes/group/STATUS');
            if (response && response.length > 0) {
                // 우리가 원하는 6개 상태만 필터링
                const allowedStatuses = ['AVAILABLE', 'BOOKED', 'CONFIRMED', 'VACATION', 'COMPLETED', 'CANCELLED'];
                const filteredResponse = response.filter(code => allowedStatuses.includes(code.codeValue));
                
                setScheduleStatusOptions(filteredResponse.map(code => {
                    let icon = '📋';
                    let color = '#6b7280';
                    
                    switch (code.codeValue) {
                        case 'AVAILABLE':
                            icon = '✅';
                            color = '#28a745';
                            break;
                        case 'BOOKED':
                            icon = '📅';
                            color = '#007bff';
                            break;
                        case 'CONFIRMED':
                            icon = '✅';
                            color = '#17a2b8';
                            break;
                        case 'VACATION':
                            icon = '🏖️';
                            color = '#ffc107';
                            break;
                        case 'COMPLETED':
                            icon = '✅';
                            color = '#6c757d';
                            break;
                        case 'CANCELLED':
                            icon = '❌';
                            color = '#dc3545';
                            break;
                    }
                    
                    return {
                        value: code.codeValue,
                        label: code.codeLabel,
                        icon: icon,
                        color: color,
                        description: code.codeDescription
                    };
                }));
            }
        } catch (error) {
            console.error('일정 상태 코드 로드 실패:', error);
            // 실패 시 기본값 설정 (enum 6개 상태만)
            setScheduleStatusOptions([
                { value: 'AVAILABLE', label: '가능', icon: '✅', color: '#28a745', description: '예약 가능한 시간대' },
                { value: 'BOOKED', label: '예약됨', icon: '📅', color: '#007bff', description: '예약된 일정' },
                { value: 'CONFIRMED', label: '확정됨', icon: '✅', color: '#17a2b8', description: '확정된 일정' },
                { value: 'VACATION', label: '휴가', icon: '🏖️', color: '#ffc107', description: '휴가로 인한 비활성' },
                { value: 'COMPLETED', label: '완료', icon: '✅', color: '#6c757d', description: '완료된 일정' },
                { value: 'CANCELLED', label: '취소됨', icon: '❌', color: '#dc3545', description: '취소된 일정' }
            ]);
        } finally {
            setLoadingCodes(false);
        }
    }, []);

    useEffect(() => {
        if (isOpen) {
            loadScheduleStatusCodes();
        }
    }, [isOpen, loadScheduleStatusCodes]);

    if (!isOpen || !scheduleData) return null;

    /**
     * 상담 유형을 한글로 변환
     */
    const convertConsultationTypeToKorean = (consultationType) => {
        const typeMap = {
            'INDIVIDUAL': '개인상담',
            'COUPLE': '부부상담',
            'FAMILY': '가족상담',
            'INITIAL': '초기상담',
            'GROUP': '그룹상담'
        };
        return typeMap[consultationType] || consultationType || "알 수 없음";
    };

    /**
     * 상태값을 한글로 변환 (동적 로드)
     */
    const convertStatusToKorean = (status) => {
        const statusOption = scheduleStatusOptions.find(option => option.value === status);
        return statusOption ? statusOption.label : status || "알 수 없음";
    };

    /**
     * 휴가 이벤트인지 확인
     */
    const isVacationEvent = () => {
        return scheduleData.status === 'VACATION' || 
               scheduleData.consultationType === 'VACATION' ||
               scheduleData.scheduleType === 'VACATION';
    };

    /**
     * 휴가 유형을 표시용으로 변환
     */
    const getVacationTypeDisplay = (vacationType) => {
        const typeMap = {
            'ALL_DAY': '🏖️ 하루 종일 휴가',
            'FULL_DAY': '🏖️ 하루 종일 휴가',
            'MORNING': '🌅 오전 휴가 (09:00-13:00)',
            'MORNING_HALF_1': '🌅 오전 반반차 1 (09:00-11:00)',
            'MORNING_HALF_2': '🌅 오전 반반차 2 (11:00-13:00)',
            'AFTERNOON': '🌆 오후 휴가 (14:00-18:00)',
            'AFTERNOON_HALF_1': '🌆 오후 반반차 1 (14:00-16:00)',
            'AFTERNOON_HALF_2': '🌆 오후 반반차 2 (16:00-18:00)',
            'CUSTOM_TIME': '⏰ 시간 지정 휴가'
        };
        return typeMap[vacationType] || '🏖️ 휴가';
    };

    /**
     * 예약 취소 처리
     */
    const handleCancelSchedule = async () => {
        try {
            setLoading(true);
            console.log('❌ 스케줄 취소 요청:', scheduleData.id);
            
            const response = await apiPut(`/api/schedules/${scheduleData.id}`, {
                status: 'CANCELLED',
                description: '사용자에 의해 취소됨'
            });
            
            if (response.success) {
                notificationManager.success('예약이 취소되었습니다.');
                onScheduleUpdated?.();
                onClose();
            } else {
                throw new Error(response.message || '예약 취소에 실패했습니다.');
            }
        } catch (error) {
            console.error('❌ 예약 취소 실패:', error);
            notificationManager.error('예약 취소에 실패했습니다: ' + error.message);
        } finally {
            setLoading(false);
            setShowCancelConfirm(false);
        }
    };

    /**
     * 상태 변경 처리
     */
    const handleStatusChange = async (newStatus) => {
        try {
            setLoading(true);
            console.log('📝 스케줄 상태 변경:', scheduleData.id, newStatus);
            
            const response = await apiPut(`/api/schedules/${scheduleData.id}`, {
                status: newStatus
            });
            
            if (response.success) {
                notificationManager.success('상태가 변경되었습니다.');
                onScheduleUpdated?.();
                onClose();
            } else {
                throw new Error(response.message || '상태 변경에 실패했습니다.');
            }
        } catch (error) {
            console.error('❌ 상태 변경 실패:', error);
            notificationManager.error('상태 변경에 실패했습니다: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    /**
     * 예약 확정 처리
     */
    const handleConfirmSchedule = async () => {
        if (!scheduleData?.id) {
            notificationManager.error('스케줄 정보가 올바르지 않습니다.');
            return;
        }

        setLoading(true);
        try {
            console.log('✅ 예약 확정 요청:', scheduleData.id);
            
            const response = await apiPut(`/api/schedules/${scheduleData.id}/confirm?userRole=ADMIN`, {
                adminNote: adminNote || '입금 확인 완료'
            });
            
            if (response.success) {
                notificationManager.success('예약이 확정되었습니다.');
                onScheduleUpdated?.();
                onClose();
            } else {
                throw new Error(response.message || '예약 확정에 실패했습니다.');
            }
        } catch (error) {
            console.error('❌ 예약 확정 실패:', error);
            notificationManager.error('예약 확정에 실패했습니다: ' + error.message);
        } finally {
            setLoading(false);
            setShowConfirmModal(false);
            setAdminNote('');
        }
    };

    /**
     * 취소 확인 모달
     */
    const renderCancelConfirm = () => (
        <div className="schedule-detail-confirm-overlay">
            <div className="schedule-detail-confirm-modal">
                <h4>예약 취소 확인</h4>
                <p>정말로 이 예약을 취소하시겠습니까?</p>
                <div className="schedule-detail-confirm-buttons">
                    <button 
                        className="btn-cancel" 
                        onClick={() => setShowCancelConfirm(false)}
                        disabled={loading}
                    >
                        아니오
                    </button>
                    <button 
                        className="btn-confirm" 
                        onClick={handleCancelSchedule}
                        disabled={loading}
                    >
                        {loading ? '처리중...' : '예, 취소합니다'}
                    </button>
                </div>
            </div>
        </div>
    );

    /**
     * 예약 확정 확인 모달
     */
    const renderConfirmModal = () => (
        <div className="schedule-detail-confirm-overlay">
            <div className="schedule-detail-confirm-modal">
                <h4>예약 확정</h4>
                <p>내담자의 입금을 확인하셨습니까?</p>
                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>
                        관리자 메모 (선택사항):
                    </label>
                    <textarea
                        value={adminNote}
                        onChange={(e) => setAdminNote(e.target.value)}
                        placeholder="입금 확인 완료"
                        style={{
                            width: '100%',
                            height: '60px',
                            padding: '8px',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            fontSize: '14px',
                            resize: 'vertical'
                        }}
                    />
                </div>
                <div className="schedule-detail-confirm-buttons">
                    <button 
                        className="btn-cancel" 
                        onClick={() => setShowConfirmModal(false)}
                        disabled={loading}
                    >
                        취소
                    </button>
                    <button 
                        className="btn-confirm" 
                        onClick={handleConfirmSchedule}
                        disabled={loading}
                    >
                        {loading ? '처리중...' : '확정'}
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="schedule-detail-modal-overlay" onClick={onClose}>
            <div 
                className="schedule-detail-modal" 
                onClick={(e) => e.stopPropagation()}
            >
                <div className="schedule-detail-modal-header">
                    <h3>📋 스케줄 상세 정보</h3>
                    <button className="schedule-detail-close-btn" onClick={onClose}>✕</button>
                </div>

                <div className="schedule-detail-modal-content">
                    <div className="schedule-info">
                        <div className="info-row">
                            <span className="label">이벤트:</span>
                            <span className="value">{scheduleData.title}</span>
                        </div>
                        <div className="info-row">
                            <span className="label">상담사:</span>
                            <span className="value">{scheduleData.consultantName}</span>
                        </div>
                        
                        {isVacationEvent() ? (
                            // 휴가 이벤트인 경우
                            <>
                                <div className="info-row">
                                    <span className="label">휴가 사유:</span>
                                    <span className="value">{scheduleData.description || scheduleData.reason || '사유 없음'}</span>
                                </div>
                                <div className="info-row">
                                    <span className="label">휴가 유형:</span>
                                    <span className="value">{getVacationTypeDisplay(scheduleData.vacationType)}</span>
                                </div>
                            </>
                        ) : (
                            // 일반 스케줄인 경우
                            <>
                                <div className="info-row">
                                    <span className="label">내담자:</span>
                                    <span className="value">{scheduleData.clientName}</span>
                                </div>
                                <div className="info-row">
                                    <span className="label">상담 유형:</span>
                                    <span className="value">{convertConsultationTypeToKorean(scheduleData.consultationType)}</span>
                                </div>
                            </>
                        )}
                        
                        <div className="info-row">
                            <span className="label">시간:</span>
                            <span className="value">
                                {scheduleData.startTime} - {scheduleData.endTime}
                            </span>
                        </div>
                        <div className="info-row">
                            <span className="label">상태:</span>
                            <span className={`value status-${scheduleData.status?.toLowerCase()}`}>
                                {convertStatusToKorean(scheduleData.status)}
                            </span>
                        </div>
                    </div>

                    <div className="action-buttons">
                        {isVacationEvent() ? (
                            // 휴가 이벤트인 경우 - 휴가 관련 정보 표시
                            <div 
                                ref={(el) => {
                                    if (el) {
                                        el.style.setProperty('text-align', 'center', 'important');
                                        el.style.setProperty('display', 'flex', 'important');
                                        el.style.setProperty('flex-direction', 'column', 'important');
                                        el.style.setProperty('align-items', 'center', 'important');
                                        el.style.setProperty('justify-content', 'center', 'important');
                                    }
                                }}
                                style={{ 
                                    padding: '20px',
                                    backgroundColor: '#fef3c7',
                                    borderRadius: '8px',
                                    margin: '20px 0',
                                    width: '100%'
                                }}
                            >
                                <p 
                                    ref={(el) => {
                                        if (el) {
                                            el.style.setProperty('text-align', 'center', 'important');
                                            el.style.setProperty('display', 'block', 'important');
                                            el.style.setProperty('width', '100%', 'important');
                                        }
                                    }}
                                    style={{ 
                                        fontSize: '16px',
                                        fontWeight: 'bold',
                                        color: '#f59e0b',
                                        margin: '0 0 10px 0'
                                    }}
                                >
                                    🏖️ 이 이벤트는 상담사의 휴가입니다.
                                </p>
                                <p 
                                    ref={(el) => {
                                        if (el) {
                                            el.style.setProperty('text-align', 'center', 'important');
                                            el.style.setProperty('display', 'block', 'important');
                                            el.style.setProperty('width', '100%', 'important');
                                        }
                                    }}
                                    style={{ 
                                        fontSize: '14px',
                                        color: '#92400e',
                                        margin: '0'
                                    }}
                                >
                                    해당 시간대에는 상담이 불가능합니다.
                                </p>
                            </div>
                        ) : (
                            // 일반 스케줄인 경우 - 기존 버튼들
                            <>
                                {(scheduleData.status === 'BOOKED' || scheduleData.status === '예약됨') && (
                                    <>
                                        <button 
                                            className="btn-status btn-confirm"
                                            onClick={() => setShowConfirmModal(true)}
                                            disabled={loading}
                                        >
                                            ✅ 예약 확정
                                        </button>
                                        <button 
                                            className="btn-status btn-complete"
                                            onClick={() => handleStatusChange('COMPLETED')}
                                            disabled={loading}
                                        >
                                            ✅ 완료 처리
                                        </button>
                                        <button 
                                            className="btn-status btn-cancel"
                                            onClick={() => setShowCancelConfirm(true)}
                                            disabled={loading}
                                        >
                                            ❌ 예약 취소
                                        </button>
                                    </>
                                )}
                                
                                {(scheduleData.status === 'CONFIRMED' || scheduleData.status === '확정됨') && (
                                    <button 
                                        className="btn-status btn-cancel"
                                        onClick={() => setShowCancelConfirm(true)}
                                        disabled={loading}
                                    >
                                        ❌ 예약 취소
                                    </button>
                                )}
                                
                                {(scheduleData.status === 'COMPLETED' || scheduleData.status === '완료됨') && (
                                    <button 
                                        className="btn-status btn-reopen"
                                        onClick={() => handleStatusChange('BOOKED')}
                                        disabled={loading}
                                    >
                                        🔄 다시 예약
                                    </button>
                                )}
                                
                                {(scheduleData.status === 'CANCELLED' || scheduleData.status === '취소') && (
                                    <button 
                                        className="btn-status btn-reopen"
                                        onClick={() => handleStatusChange('BOOKED')}
                                        disabled={loading}
                                    >
                                        🔄 다시 예약
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>

            {showCancelConfirm && renderCancelConfirm()}
            {showConfirmModal && renderConfirmModal()}
        </div>
    );
};

export default ScheduleDetailModal;
