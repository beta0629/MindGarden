import React, { useState, useEffect, useCallback } from 'react';
import { apiPut, apiGet } from '../../utils/ajax';
import notificationManager from '../../utils/notification';
import ConsultationLogModal from '../consultant/ConsultationLogModal';
import UnifiedModal from '../common/modals/UnifiedModal';
import { useSession } from '../../contexts/SessionContext';
import '../../styles/main.css';

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
    const { user } = useSession();
    const [loading, setLoading] = useState(false);
    const [showCancelConfirm, setShowCancelConfirm] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [showConsultationLogModal, setShowConsultationLogModal] = useState(false);
    const [adminNote, setAdminNote] = useState('');
    const [scheduleStatusOptions, setScheduleStatusOptions] = useState([]);
    const [loadingCodes, setLoadingCodes] = useState(false);
    
    // 내담자인지 확인
    const isClient = user?.role === 'CLIENT';
    

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

    if (!isOpen || !scheduleData) {
        return null;
    }

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
     * 상담일지 작성 처리
     */
    const handleWriteConsultationLog = () => {
        if (!scheduleData?.id) {
            notificationManager.error('스케줄 정보가 올바르지 않습니다.');
            return;
        }
        
        console.log('📝 상담일지 작성 요청:', scheduleData.id);
        setShowConsultationLogModal(true);
    };

    /**
     * 상담일지 저장 완료 처리
     */
    const handleConsultationLogSaved = () => {
        setShowConsultationLogModal(false);
        onScheduleUpdated?.(); // 스케줄 목록 새로고침
        notificationManager.success('상담일지가 저장되었습니다.');
    };

    /**
     * 예약 변경 처리 - 드래그 앤 드롭 모드로 전환
     */
    const handleEditSchedule = () => {
        if (!scheduleData?.id) {
            notificationManager.error('스케줄 정보가 올바르지 않습니다.');
            return;
        }
        
        console.log('✏️ 예약 변경 요청 - 드래그 앤 드롭 모드:', scheduleData.id);
        
        // 부모 컴포넌트에 드래그 앤 드롭 모드 활성화 요청
        if (onScheduleUpdated) {
            // 드래그 앤 드롭 모드로 전환하는 콜백 호출
            onScheduleUpdated('edit', scheduleData);
        }
        
        // 모달 닫기
        onClose();
        
        notificationManager.info('드래그 앤 드롭으로 예약을 변경할 수 있습니다.');
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
        <div className="mg-modal-overlay mg-modal-overlay--visible" style={{ zIndex: 10001 }}>
            <div className="mg-modal mg-modal--medium">
                <div className="mg-modal__header">
                    <h4 className="mg-modal__title">예약 취소 확인</h4>
                </div>
                <div className="mg-modal__body">
                    <p>정말로 이 예약을 취소하시겠습니까?</p>
                    <div className="mg-modal__actions">
                        <button 
                            className="mg-btn mg-btn--secondary" 
                            onClick={() => setShowCancelConfirm(false)}
                            disabled={loading}
                        >
                            아니오
                        </button>
                        <button 
                            className="mg-btn mg-btn--danger" 
                            onClick={handleCancelSchedule}
                            disabled={loading}
                        >
                            {loading ? '처리중...' : '예, 취소합니다'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    /**
     * 예약 확정 확인 모달
     */
    const renderConfirmModal = () => (
        <div className="mg-modal-overlay mg-modal-overlay--visible" style={{ zIndex: 10001 }}>
            <div className="mg-modal mg-modal--medium">
                <div className="mg-modal__header">
                    <h4 className="mg-modal__title">예약 확정</h4>
                </div>
                <div className="mg-modal__body">
                    <p>내담자의 입금을 확인하셨습니까?</p>
                    <div className="mg-form-group">
                        <label className="mg-label">
                            관리자 메모 (선택사항):
                        </label>
                        <textarea
                            value={adminNote}
                            onChange={(e) => setAdminNote(e.target.value)}
                            placeholder="입금 확인 완료"
                            className="mg-textarea"
                        />
                    </div>
                    <div className="mg-modal__actions">
                        <button 
                            className="mg-btn mg-btn--secondary" 
                            onClick={() => setShowConfirmModal(false)}
                            disabled={loading}
                        >
                            취소
                        </button>
                        <button 
                            className="mg-btn mg-btn--primary" 
                            onClick={handleConfirmSchedule}
                            disabled={loading}
                        >
                            {loading ? '처리중...' : '확정'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <>
            {/* 메인 스케줄 상세 모달 */}
            <UnifiedModal
                isOpen={isOpen}
                onClose={onClose}
                title="📋 스케줄 상세 정보"
                size="large"
                loading={loading}
            >
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

                <div className="mg-modal__actions mg-modal__actions--horizontal">
                    {isVacationEvent() ? (
                        // 휴가 이벤트인 경우 - 휴가 관련 정보 표시
                        <div className="schedule-detail-vacation-notice">
                            <p className="schedule-detail-vacation-title">
                                🏖️ 이 이벤트는 상담사의 휴가입니다.
                            </p>
                            <p className="schedule-detail-vacation-description">
                                해당 시간대에는 상담이 불가능합니다.
                            </p>
                        </div>
                    ) : !isClient ? (
                        // 일반 스케줄인 경우 - 통합 버튼 스타일 적용 (내담자 제외)
                        <>
                            {(scheduleData.status === 'BOOKED' || scheduleData.status === '예약됨') && (
                                <>
                                    <button 
                                        className="mg-btn mg-btn--info mg-btn--icon-left"
                                        onClick={handleEditSchedule}
                                        disabled={loading}
                                    >
                                        <span className="mg-btn__icon">✏️</span>
                                        <span className="mg-btn__text">예약 변경</span>
                                    </button>
                                    <button 
                                        className="mg-btn mg-btn--primary mg-btn--icon-left"
                                        onClick={() => setShowConfirmModal(true)}
                                        disabled={loading}
                                    >
                                        <span className="mg-btn__icon">✅</span>
                                        <span className="mg-btn__text">예약 확정</span>
                                    </button>
                                    <button 
                                        className="mg-btn mg-btn--danger mg-btn--icon-left"
                                        onClick={() => setShowCancelConfirm(true)}
                                        disabled={loading}
                                    >
                                        <span className="mg-btn__icon">❌</span>
                                        <span className="mg-btn__text">예약 취소</span>
                                    </button>
                                </>
                            )}
                            
                            {(scheduleData.status === 'CONFIRMED' || scheduleData.status === '확정됨') && (
                                <>
                                    <button 
                                        className="mg-btn mg-btn--success mg-btn--icon-left"
                                        onClick={() => handleStatusChange('COMPLETED')}
                                        disabled={loading}
                                    >
                                        <span className="mg-btn__icon">✅</span>
                                        <span className="mg-btn__text">완료 처리</span>
                                    </button>
                                    <button 
                                        className="mg-btn mg-btn--info mg-btn--icon-left"
                                        onClick={handleWriteConsultationLog}
                                        disabled={loading}
                                    >
                                        <span className="mg-btn__icon">📝</span>
                                        <span className="mg-btn__text">상담일지 작성</span>
                                    </button>
                                    <button 
                                        className="mg-btn mg-btn--danger mg-btn--icon-left"
                                        onClick={() => setShowCancelConfirm(true)}
                                        disabled={loading}
                                    >
                                        <span className="mg-btn__icon">❌</span>
                                        <span className="mg-btn__text">예약 취소</span>
                                    </button>
                                </>
                            )}
                            
                            {(scheduleData.status === 'COMPLETED' || scheduleData.status === '완료됨') && (
                                <button 
                                    className="mg-btn mg-btn--warning mg-btn--icon-left"
                                    onClick={() => handleStatusChange('BOOKED')}
                                    disabled={loading}
                                >
                                    <span className="mg-btn__icon">🔄</span>
                                    <span className="mg-btn__text">다시 예약</span>
                                </button>
                            )}
                            
                            {(scheduleData.status === 'CANCELLED' || scheduleData.status === '취소') && (
                                <button 
                                    className="mg-btn mg-btn--warning mg-btn--icon-left"
                                    onClick={() => handleStatusChange('BOOKED')}
                                    disabled={loading}
                                >
                                    <span className="mg-btn__icon">🔄</span>
                                    <span className="mg-btn__text">다시 예약</span>
                                </button>
                            )}
                        </>
                    ) : (
                        // 내담자인 경우 - 조회만 가능 메시지 표시
                        <div className="schedule-detail-client-notice" style={{
                            padding: 'var(--spacing-lg)',
                            background: 'var(--bg-gradient-cool)',
                            border: 'var(--border-width-thin) solid var(--border-pink-light)',
                            borderRadius: 'var(--border-radius-md)',
                            textAlign: 'center',
                            color: 'var(--color-text-secondary)'
                        }}>
                            <p style={{ margin: 0, fontSize: 'var(--font-size-base)' }}>
                                📅 예약 정보를 확인하실 수 있습니다.
                            </p>
                            <p style={{ margin: 'var(--spacing-xs) 0 0 0', fontSize: 'var(--font-size-sm)' }}>
                                예약 변경이 필요하신 경우 상담사에게 문의해주세요.
                            </p>
                        </div>
                    )}
                </div>
            </UnifiedModal>

            {showCancelConfirm && renderCancelConfirm()}
            {showConfirmModal && renderConfirmModal()}
            
            {/* 상담일지 작성 모달 */}
            {showConsultationLogModal && (
                <ConsultationLogModal
                    isOpen={showConsultationLogModal}
                    onClose={() => setShowConsultationLogModal(false)}
                    scheduleData={scheduleData}
                    onSave={handleConsultationLogSaved}
                />
            )}
        </>
    );
};

export default ScheduleDetailModal;
