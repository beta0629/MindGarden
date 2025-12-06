import React, { useState, useEffect, useCallback } from 'react';
import { apiPut, apiGet } from '../../utils/ajax';
import { getCommonCodes } from '../../utils/commonCodeApi';
import notificationManager from '../../utils/notification';
import UnifiedModal from '../../components/common/modals/UnifiedModal'; // 임시 비활성화
import { useSession } from '../../contexts/SessionContext';
import { RoleUtils } from '../../constants/roles';
import '../../styles/main.css';

/**
 * 스케줄 상세 정보 및 관리 모달
/**
 * - 스케줄 정보 표시
/**
 * - 예약 취소 기능
/**
 * - 상태 변경 기능
/**
 * 
/**
 * @author MindGarden
/**
 * @version 1.0.0
/**
 * @since 2024-12-19
 */
const ScheduleDetailModal = ({ 
    isOpen, 
    onClose, 
    scheduleData, 
    onScheduleUpdated,
    onConsultationLogOpen
}) => {
    const { user } = useSession();
    const [loading, setLoading] = useState(false);
    const [showCancelConfirm, setShowCancelConfirm] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [adminNote, setAdminNote] = useState('');
    const [scheduleStatusOptions, setScheduleStatusOptions] = useState([]);
    const [loadingCodes, setLoadingCodes] = useState(false);
    
    const isClient = RoleUtils.isClient(user);
    
    const getStatusCodeValue = (codeValue) => {
        const statusOption = scheduleStatusOptions.find(option => option.value === codeValue);
        return statusOption ? statusOption.value : codeValue;
    };
    
    const isStatus = (currentStatus, targetStatus) => {
        if (!currentStatus) return false;
        const currentCode = getStatusCodeValue(currentStatus);
        const targetCode = getStatusCodeValue(targetStatus);
        return currentCode === targetCode || currentStatus === targetStatus;
    };
    

    const loadScheduleStatusCodes = useCallback(async () => {
        try {
            setLoadingCodes(true);
            const codes = await getCommonCodes('SCHEDULE_STATUS');
            
            if (codes && Array.isArray(codes) && codes.length > 0) {
                setScheduleStatusOptions(codes.map(code => ({
                    value: code.codeValue,
                    label: code.koreanName || code.codeLabel,
                    icon: code.icon || '📋',
                    color: code.colorCode || 'var(--mg-gray-500)',
                    description: code.codeDescription
                })));
            } else {
                setScheduleStatusOptions([]); // 하드코딩된 fallback 제거
            }
        } catch (error) {
            console.error('일정 상태 코드 로드 실패:', error);
            setScheduleStatusOptions([]);
            notificationManager.error('스케줄 상태 코드를 불러올 수 없습니다. 관리자에게 문의하세요.');
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
     * 상태값에 따른 색상 클래스 반환
     */
    const getStatusColorClass = (status) => {
        const statusMap = {
            // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
            'BOOKED': 'info',
            // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
            'CONFIRMED': 'success',
            // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
            'COMPLETED': 'secondary',
            // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
            'CANCELLED': 'danger',
            'VACATION': 'warning',
            'AVAILABLE': 'success'
        };
        return statusMap[status] || 'secondary';
    };

    /**
     * 휴가 이벤트 여부 확인
     */
    const isVacationEvent = () => {
        const vacationStatus = scheduleStatusOptions.find(opt => 
            opt.value === 'VACATION' || opt.label?.includes('휴가')
        );
        
        return isStatus(scheduleData.status, vacationStatus) || 
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
            
            const cancelledStatus = scheduleStatusOptions.find(opt => 
                // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
                opt.value === 'CANCELLED' || opt.label?.includes('취소')
            );
            
            const response = await apiPut(`/api/schedules/${scheduleData.id}`, {
                status: cancelledStatus,
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
        onClose();
        onConsultationLogOpen?.(scheduleData);
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
        
        if (onScheduleUpdated) {
            onScheduleUpdated('edit', scheduleData);
        }
        
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
        <div className="mg-modal-overlay mg-modal-overlay--visible mg-modal-overlay--high-z">
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
        <div className="mg-modal-overlay mg-modal-overlay--visible mg-modal-overlay--high-z">
            <div className="mg-modal mg-modal--medium">
                <div className="mg-modal__header">
                    <h4 className="mg-modal__title">예약 확정</h4>
                </div>
                <div className="mg-modal__body">
                    <p>내담자의 입금을 확인하셨습니까?</p>
                    <div className="mg-form-group">
                        <label className="mg-v2-label">
                            관리자 메모 (선택사항):
                        </label>
                        <textarea
                            value={adminNote}
                            onChange={(e) => setAdminNote(e.target.value)}
                            placeholder="입금 확인 완료"
                            className="mg-v2-textarea"
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
            <div className="mg-modal"
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
                    
                    {!isVacationEvent() && (() => {
                        let parsedConsultantName = scheduleData.consultantName;
                        let parsedClientName = scheduleData.clientName;
                        
                        if ((!parsedConsultantName || parsedConsultantName === '상담사 정보 없음' || parsedConsultantName === 'undefined') &&
                            (!parsedClientName || parsedClientName === '내담자 정보 없음' || parsedClientName === 'undefined')) {
                            if (scheduleData.title && scheduleData.title.includes(' - ')) {
                                const names = scheduleData.title.split(' - ');
                                if (names.length === 2) {
                                    parsedConsultantName = names[0].trim();
                                    parsedClientName = names[1].trim();
                                }
                            }
                        }
                        
                        return (
                            <>
                                <div className="info-row">
                                    <span className="label">상담사:</span>
                                    <span className="value">{parsedConsultantName || '상담사 정보 없음'}</span>
                                </div>
                                <div className="info-row">
                                    <span className="label">내담자:</span>
                                    <span className="value">{parsedClientName || '내담자 정보 없음'}</span>
                                </div>
                            </>
                        );
                    })()}
                    
                    {isVacationEvent() ? (
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
                        <>
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
                        <span className={`value mg-v2-badge mg-v2-badge-${getStatusColorClass(scheduleData.status)}`}>
                            {convertStatusToKorean(scheduleData.status)}
                        </span>
                    </div>
                </div>

                <div className="mg-modal__actions mg-modal__actions--horizontal">
                    {isVacationEvent() ? (
                        <div className="schedule-detail-vacation-notice">
                            <p className="schedule-detail-vacation-title">
                                🏖️ 이 이벤트는 상담사의 휴가입니다.
                            </p>
                            <p className="schedule-detail-vacation-description">
                                해당 시간대에는 상담이 불가능합니다.
                            </p>
                        </div>
                    ) : !isClient ? (
                        <>
                            // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
                            {isStatus(scheduleData.status, 'BOOKED') && (
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
                            
                            // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
                            {isStatus(scheduleData.status, 'CONFIRMED') && (() => {
                                const completedStatus = scheduleStatusOptions.find(opt => 
                                    // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
                                    opt.value === 'COMPLETED' || opt.label?.includes('완료')
                                // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
                                )?.value || 'COMPLETED'; // fallback
                                
                                return (
                                    <>
                                        <button 
                                            className="mg-btn mg-btn--success mg-btn--icon-left"
                                            onClick={() => handleStatusChange(completedStatus)}
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
                                );
                            })()}
                            
                            // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
                            {isStatus(scheduleData.status, 'COMPLETED') && (() => {
                                const bookedStatus = scheduleStatusOptions.find(opt => 
                                    // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
                                    opt.value === 'BOOKED' || opt.label?.includes('예약')
                                // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
                                )?.value || 'BOOKED'; // fallback
                                
                                return (
                                    <button 
                                        className="mg-btn mg-btn--warning mg-btn--icon-left"
                                        onClick={() => handleStatusChange(bookedStatus)}
                                        disabled={loading}
                                    >
                                        <span className="mg-btn__icon">🔄</span>
                                        <span className="mg-btn__text">다시 예약</span>
                                    </button>
                                );
                            })()}
                            
                            // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
                            {isStatus(scheduleData.status, 'CANCELLED') && (() => {
                                const bookedStatus = scheduleStatusOptions.find(opt => 
                                    // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
                                    opt.value === 'BOOKED' || opt.label?.includes('예약')
                                // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
                                )?.value || 'BOOKED'; // fallback
                                
                                return (
                                    <button 
                                        className="mg-btn mg-btn--warning mg-btn--icon-left"
                                        onClick={() => handleStatusChange(bookedStatus)}
                                        disabled={loading}
                                    >
                                        <span className="mg-btn__icon">🔄</span>
                                        <span className="mg-btn__text">다시 예약</span>
                                    </button>
                                );
                            })()}
                        </>
                    ) : (
                        <div className="mg-v2-info-box mg-v2-text-center mg-v2-text-secondary">
                            <p className="mg-v2-text-base">
                                📅 예약 정보를 확인하실 수 있습니다.
                            </p>
                            <p className="mg-v2-text-sm mg-v2-mt-xs">
                                예약 변경이 필요하신 경우 상담사에게 문의해주세요.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {showCancelConfirm && renderCancelConfirm()}
            {showConfirmModal && renderConfirmModal()}
            
            {/* 상담일지 작성 모달은 부모 컴포넌트에서 관리 */}
        </>
    );
};

export default ScheduleDetailModal;
