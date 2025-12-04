import React, { useState, useEffect, useCallback } from 'react';
// import UnifiedLoading from '../../components/common/UnifiedLoading'; // 임시 비활성화
import { apiPut, apiGet } from '../../utils/ajax';
import { getCommonCodes } from '../../utils/commonCodeApi';
import notificationManager from '../../utils/notification';
// import ConsultationLogModal from '../consultant/ConsultationLogModal'; // 부모 컴포넌트에서 관리
import UnifiedModal from '../../components/common/modals/UnifiedModal'; // 임시 비활성화
import { useSession } from '../../contexts/SessionContext';
import { RoleUtils } from '../../constants/roles';
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
    onScheduleUpdated,
    onConsultationLogOpen
}) => {
    const { user } = useSession();
    const [loading, setLoading] = useState(false);
    const [showCancelConfirm, setShowCancelConfirm] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    // 상담일지 모달은 부모 컴포넌트에서 관리
    const [adminNote, setAdminNote] = useState('');
    const [scheduleStatusOptions, setScheduleStatusOptions] = useState([]);
    const [loadingCodes, setLoadingCodes] = useState(false);
    
    // 내담자인지 확인
    const isClient = RoleUtils.isClient(user);
    
    // 공통코드에서 조회한 상태값으로 비교하는 헬퍼 함수
    const getStatusCodeValue = (codeValue) => {
        const statusOption = scheduleStatusOptions.find(option => option.value === codeValue);
        return statusOption ? statusOption.value : codeValue;
    };
    
    // 상태값이 특정 값과 일치하는지 확인 (공통코드 기반)
    const isStatus = (currentStatus, targetStatus) => {
        if (!currentStatus) return false;
        // 공통코드에서 조회한 값으로 비교
        const currentCode = getStatusCodeValue(currentStatus);
        const targetCode = getStatusCodeValue(targetStatus);
        return currentCode === targetCode || currentStatus === targetStatus;
    };
    

    // 일정 상태 코드 로드 (공통코드에서 동적으로 조회)
    const loadScheduleStatusCodes = useCallback(async () => {
        try {
            setLoadingCodes(true);
            // 공통코드 API 사용 (표준화된 방법)
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
                console.warn('📋 스케줄 상태 코드 데이터가 없습니다. 공통코드에서 조회하세요.');
                setScheduleStatusOptions([]); // 하드코딩된 fallback 제거
            }
        } catch (error) {
            console.error('일정 상태 코드 로드 실패:', error);
            // 하드코딩된 fallback 제거 - 공통코드에서만 조회
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
            'BOOKED': 'info',
            'CONFIRMED': 'success',
            'COMPLETED': 'secondary',
            'CANCELLED': 'danger',
            'VACATION': 'warning',
            'AVAILABLE': 'success'
        };
        return statusMap[status] || 'secondary';
    };

    /**
     * 휴가 이벤트인지 확인 (공통코드 기반)
     */
    const isVacationEvent = () => {
        // 공통코드에서 VACATION 상태값 조회
        const vacationStatus = scheduleStatusOptions.find(opt => 
            opt.value === 'VACATION' || opt.label?.includes('휴가')
        )?.value || 'VACATION'; // fallback (공통코드 미로드 시)
        
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
            
            // 공통코드에서 CANCELLED 상태값 조회
            const cancelledStatus = scheduleStatusOptions.find(opt => 
                opt.value === 'CANCELLED' || opt.label?.includes('취소')
            )?.value || 'CANCELLED'; // fallback (공통코드 미로드 시)
            
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
        // 현재 모달을 닫고 부모 컴포넌트에서 상담일지 모달 열기
        onClose();
        onConsultationLogOpen?.(scheduleData);
    };

    // 상담일지 저장 완료 처리는 부모 컴포넌트에서 관리

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
                        // title에서 이름 파싱: "김선희 - 이재학" 형식
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
                            
                            {isStatus(scheduleData.status, 'CONFIRMED') && (() => {
                                // 공통코드에서 COMPLETED 상태값 조회
                                const completedStatus = scheduleStatusOptions.find(opt => 
                                    opt.value === 'COMPLETED' || opt.label?.includes('완료')
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
                            
                            {isStatus(scheduleData.status, 'COMPLETED') && (() => {
                                // 공통코드에서 BOOKED 상태값 조회
                                const bookedStatus = scheduleStatusOptions.find(opt => 
                                    opt.value === 'BOOKED' || opt.label?.includes('예약')
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
                            
                            {isStatus(scheduleData.status, 'CANCELLED') && (() => {
                                // 공통코드에서 BOOKED 상태값 조회
                                const bookedStatus = scheduleStatusOptions.find(opt => 
                                    opt.value === 'BOOKED' || opt.label?.includes('예약')
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
                        // 내담자인 경우 - 조회만 가능 메시지 표시
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
