import React, { useState, useEffect, useCallback } from 'react';
import { apiPut } from '../../utils/ajax';
import { getCommonCodes } from '../../utils/commonCodeApi';
import notificationManager from '../../utils/notification';
import { useSession } from '../../contexts/SessionContext';
import { RoleUtils } from '../../constants/roles';
import UnifiedModal from '../common/modals/UnifiedModal';
import '../admin/AdminDashboard/AdminDashboardB0KlA.css';
import './ScheduleB0KlA.css';
import '../../styles/main.css';
import SafeText from '../common/SafeText';
import MGButton from '../common/MGButton';
import { toDisplayString } from '../../utils/safeDisplay';

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
 * @author Core Solution
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
    /** 상태 변경 성공 시 API 응답으로 갱신한 데이터 (모달이 닫히지 않을 때 최신 상태 표시) */
    const [localScheduleOverride, setLocalScheduleOverride] = useState(null);

    const isClient = RoleUtils.isClient(user);

    /** 코드값/한글 라벨 모두 고려해 공통코드 value로 정규화 */
    const getStatusCodeValue = (codeOrLabel) => {
        if (codeOrLabel == null || codeOrLabel === '') return codeOrLabel;
        const knownCodes = ['BOOKED', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'VACATION', 'AVAILABLE'];
        if (knownCodes.includes(String(codeOrLabel).trim())) return String(codeOrLabel).trim();
        const byValue = scheduleStatusOptions.find(opt => opt.value === codeOrLabel);
        if (byValue) return byValue.value;
        const byLabel = scheduleStatusOptions.find(opt => (opt.label && opt.label === codeOrLabel));
        if (byLabel) return byLabel.value;
        if (typeof codeOrLabel === 'string') {
            if (/취소|취소됨/.test(codeOrLabel)) return 'CANCELLED';
            if (/예약|예약됨/.test(codeOrLabel)) return 'BOOKED';
            if (/완료|완료됨/.test(codeOrLabel)) return 'COMPLETED';
            if (/확정|확정됨/.test(codeOrLabel)) return 'CONFIRMED';
            if (/휴가/.test(codeOrLabel)) return 'VACATION';
        }
        return codeOrLabel;
    };

    const isStatus = (currentStatus, targetStatus) => {
        if (currentStatus == null) return false;
        const currentCode = getStatusCodeValue(currentStatus);
        const targetCode = getStatusCodeValue(targetStatus);
        return currentCode === targetCode || currentStatus === targetStatus;
    };

    /**
     * 액션 분기·배지용 상태 해석: API 코드(statusCode) 우선, 표시용 status는 유효할 때만 사용.
     * @param {object} data 스케줄 표시 데이터
     * @returns {string|null}
     */
    const resolveStatusForActions = (data) => {
        if (!data) return null;
        const codeStr =
            data.statusCode != null && String(data.statusCode).trim() !== ''
                ? String(data.statusCode).trim()
                : null;
        if (codeStr) return codeStr;

        const st = data.status;
        const statusInvalid =
            st == null ||
            st === '' ||
            (typeof st === 'string' && st.trim() === '') ||
            st === '알 수 없음';
        if (!statusInvalid) {
            return st;
        }

        return codeStr;
    };

    const loadScheduleStatusCodes = useCallback(async() => {
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

    /** 모달이 열릴 때 또는 다른 스케줄을 선택했을 때 로컬 오버라이드 초기화 */
    useEffect(() => {
        if (!isOpen || !scheduleData) {
            setLocalScheduleOverride(null);
        }
    }, [isOpen, scheduleData?.id]);

    /**
     * 예약 취소 처리 (TDZ 방지: renderCancelConfirm에서 참조)
     */
    const handleCancelSchedule = async() => {
        try {
            setLoading(true);
            console.log('❌ 스케줄 취소 요청:', scheduleData?.id);
            const cancelledStatusOption = scheduleStatusOptions.find(opt =>
                opt.value === 'CANCELLED' || opt.label?.includes('취소')
            );
            const statusCode = cancelledStatusOption?.value ?? 'CANCELLED';
            const response = await apiPut(`/api/v1/schedules/${scheduleData.id}`, {
                status: statusCode,
                description: '사용자에 의해 취소됨'
            });
            if (response != null) {
                notificationManager.success('예약이 취소되었습니다.');
                onScheduleUpdated?.();
                onClose();
            } else {
                throw new Error('예약 취소에 실패했습니다.');
            }
        } catch (error) {
            console.error('❌ 예약 취소 실패:', error);
            notificationManager.error(`예약 취소에 실패했습니다: ${error.message}`);
        } finally {
            setLoading(false);
            setShowCancelConfirm(false);
        }
    };

    /**
     * 예약 확정 처리 (TDZ 방지: renderConfirmModal에서 참조)
     */
    const handleConfirmSchedule = async() => {
        if (!scheduleData?.id) {
            notificationManager.error('스케줄 정보가 올바르지 않습니다.');
            return;
        }
        setLoading(true);
        try {
            console.log('✅ 예약 확정 요청:', scheduleData.id);
            const response = await apiPut(`/api/v1/schedules/${scheduleData.id}/confirm?userRole=ADMIN`, {
                adminNote: adminNote || '입금 확인 완료'
            });
            if (response != null) {
                notificationManager.success('예약이 확정되었습니다.');
                onScheduleUpdated?.();
                try {
                  window.dispatchEvent(new CustomEvent('admin-dashboard-refresh-stats'));
                } catch (e) {
                  // CustomEvent 미지원 등 무시
                }
                onClose();
            } else {
                throw new Error('예약 확정에 실패했습니다.');
            }
        } catch (error) {
            console.error('❌ 예약 확정 실패:', error);
            notificationManager.error(`예약 확정에 실패했습니다: ${error.message}`);
        } finally {
            setLoading(false);
            setShowConfirmModal(false);
            setAdminNote('');
        }
    };

    /**
     * 취소 확인 모달 (TDZ 방지: loading early return 전에 정의)
     */
    const renderCancelConfirm = () => (
        <UnifiedModal
            isOpen={showCancelConfirm}
            onClose={() => setShowCancelConfirm(false)}
            title="예약 취소 확인"
            size="large"
            variant="confirm"
            zIndex={1100}
            backdropClick={!loading}
            showCloseButton={!loading}
            loading={loading}
            className="mg-v2-ad-b0kla"
            actions={
                <>
                    <MGButton
                        type="button"
                        variant="outline"
                        className="mg-v2-btn--outline"
                        preventDoubleClick={false}
                        onClick={() => setShowCancelConfirm(false)}
                        disabled={loading}
                    >
                        아니오
                    </MGButton>
                    <MGButton
                        type="button"
                        variant="danger"
                        className="mg-v2-schedule-detail-btn--danger"
                        preventDoubleClick={false}
                        onClick={handleCancelSchedule}
                        loading={loading}
                        loadingText="처리중..."
                    >
                        예, 취소합니다
                    </MGButton>
                </>
            }
        >
            <p>정말로 이 예약을 취소하시겠습니까?</p>
        </UnifiedModal>
    );

    /**
     * 예약 확정 확인 모달 (TDZ 방지: loading early return 전에 정의)
     */
    const renderConfirmModal = () => (
        <UnifiedModal
            isOpen={showConfirmModal}
            onClose={() => setShowConfirmModal(false)}
            title="예약 확정"
            size="large"
            variant="confirm"
            zIndex={1100}
            backdropClick={!loading}
            showCloseButton={!loading}
            loading={loading}
            className="mg-v2-ad-b0kla"
            actions={
                <>
                    <MGButton
                        type="button"
                        variant="outline"
                        className="mg-v2-btn--outline"
                        preventDoubleClick={false}
                        onClick={() => setShowConfirmModal(false)}
                        disabled={loading}
                    >
                        취소
                    </MGButton>
                    <MGButton
                        type="button"
                        variant="primary"
                        className="mg-v2-btn--primary"
                        preventDoubleClick={false}
                        onClick={handleConfirmSchedule}
                        loading={loading}
                        loadingText="처리중..."
                    >
                        확정
                    </MGButton>
                </>
            }
        >
            <p>내담자의 입금을 확인하셨습니까?</p>
            <div className="mg-form-group">
                <label className="mg-v2-label">관리자 메모 (선택사항):</label>
                <textarea
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                    placeholder="입금 확인 완료"
                    className="mg-v2-textarea mg-v2-input"
                    style={{ width: '100%', minHeight: '80px', marginTop: '8px', padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: '8px', boxSizing: 'border-box' }}
                />
            </div>
        </UnifiedModal>
    );

    if (!isOpen || !scheduleData) {
        return null;
    }

    // 로딩 오버레이
    if (loading) {
        return (
            <>
                <UnifiedModal
                    isOpen={true}
                    onClose={onClose}
                    title="처리 중"
                    size="large"
                    loading={true}
                    showCloseButton={false}
                    backdropClick={false}
                    className="mg-v2-ad-b0kla"
                />
                {showCancelConfirm && renderCancelConfirm()}
                {showConfirmModal && renderConfirmModal()}
            </>
        );
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
     * 상태값을 한글로 변환 (코드값/한글 라벨 모두 처리, fallback 포함)
     */
    const convertStatusToKorean = (status) => {
        if (status == null || status === '') return '알 수 없음';
        const byValue = scheduleStatusOptions.find(opt => opt.value === status);
        if (byValue && byValue.label) return byValue.label;
        const byLabel = scheduleStatusOptions.find(opt => opt.label === status);
        if (byLabel && byLabel.label) return byLabel.label;
        const code = getStatusCodeValue(status);
        const fallbackMap = { CANCELLED: '취소됨', BOOKED: '예약됨', COMPLETED: '완료됨', CONFIRMED: '확정됨', VACATION: '휴가', AVAILABLE: '가능' };
        return fallbackMap[code] || status || '알 수 없음';
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

        return isStatus(resolveStatusForActions(displayData), vacationStatus) ||
               displayData.consultationType === 'VACATION' ||
               displayData.scheduleType === 'VACATION';
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
     * 상태 변경 처리
     * 성공 시 응답으로 모달 표시 데이터를 갱신해, 부모가 목록만 갱신해도 버튼/상태가 올바르게 보이도록 함.
     */
    const handleStatusChange = async(newStatus) => {
        try {
            setLoading(true);
            console.log('📝 스케줄 상태 변경:', scheduleData.id, newStatus);

            const response = await apiPut(`/api/v1/schedules/${scheduleData.id}`, {
                status: newStatus
            });

            if (response != null) {
                notificationManager.success('상태가 변경되었습니다.');
                onScheduleUpdated?.();
                if (newStatus === 'CONFIRMED') {
                  try {
                    window.dispatchEvent(new CustomEvent('admin-dashboard-refresh-stats'));
                  } catch (e) {
                    // CustomEvent 미지원 등 무시
                  }
                }
                const merged = {
                    ...scheduleData,
                    ...(typeof response === 'object' && response !== null ? response : {}),
                    status: (response && response.status) || newStatus,
                    statusCode: (response && response.status) || newStatus
                };
                setLocalScheduleOverride(merged);
            } else {
                throw new Error(response?.message || '상태 변경에 실패했습니다.');
            }
        } catch (error) {
            console.error('❌ 상태 변경 실패:', error);
            notificationManager.error(`상태 변경에 실패했습니다: ${error.message}`);
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
     * 예약 변경 — 부모에서 재예약 모달 오픈
     */
    const handleEditSchedule = () => {
        if (!scheduleData?.id) {
            notificationManager.error('스케줄 정보가 올바르지 않습니다.');
            return;
        }

        if (onScheduleUpdated) {
            onScheduleUpdated('edit', scheduleData);
        }

        onClose();
    };

    const canRescheduleByRole = user?.role === 'ADMIN' || user?.role === 'BRANCH_SUPER_ADMIN';

    if (!isOpen) return null;

    const displayData = localScheduleOverride ?? scheduleData;
    const statusForDisplay = resolveStatusForActions(displayData) ?? displayData.status;

    const renderMainActions = () => {
        if (isVacationEvent()) {
            return (
                <div style={{ width: '100%', textAlign: 'center' }}>
                    <p style={{ fontSize: '14px', color: 'var(--mg-primary-500)', fontWeight: 600 }}>
                        🏖️ 이 이벤트는 상담사의 휴가입니다.
                    </p>
                    <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                        해당 시간대에는 상담이 불가능합니다.
                    </p>
                </div>
            );
        }
        if (isClient) {
            return (
                <div style={{ width: '100%', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                    <p style={{ fontSize: '14px', fontWeight: 500 }}>
                        📅 예약 정보를 확인하실 수 있습니다.
                    </p>
                    <p style={{ fontSize: '13px', marginTop: '4px' }}>
                        예약 변경이 필요하신 경우 상담사에게 문의해주세요.
                    </p>
                </div>
            );
        }
        return (
            <div style={{ display: 'flex', gap: '8px', width: '100%', justifyContent: 'flex-end' }}>
                {isStatus(resolveStatusForActions(displayData), 'BOOKED') && (
                    <>
                        {canRescheduleByRole && (
                            <MGButton
                                type="button"
                                variant="outline"
                                className="mg-v2-btn--outline"
                                preventDoubleClick={false}
                                onClick={handleEditSchedule}
                                disabled={loading}
                            >
                                예약 변경
                            </MGButton>
                        )}
                        <MGButton
                            type="button"
                            variant="primary"
                            className="mg-v2-btn--primary"
                            preventDoubleClick={false}
                            onClick={() => setShowConfirmModal(true)}
                            disabled={loading}
                        >
                            예약 확정
                        </MGButton>
                        <MGButton
                            type="button"
                            variant="danger"
                            className="mg-v2-schedule-detail-btn--danger"
                            preventDoubleClick={false}
                            onClick={() => setShowCancelConfirm(true)}
                            disabled={loading}
                        >
                            예약 취소
                        </MGButton>
                    </>
                )}
                {isStatus(resolveStatusForActions(displayData), 'CONFIRMED') && (() => {
                    const completedStatus = scheduleStatusOptions.find(opt =>
                        opt.value === 'COMPLETED' || opt.label?.includes('완료')
                    )?.value || 'COMPLETED';
                    return (
                        <>
                            <MGButton
                                type="button"
                                variant="outline"
                                className="mg-v2-btn--outline"
                                preventDoubleClick={false}
                                onClick={handleWriteConsultationLog}
                                disabled={loading}
                            >
                                상담일지 작성
                            </MGButton>
                            <MGButton
                                type="button"
                                variant="primary"
                                className="mg-v2-btn--primary"
                                preventDoubleClick={false}
                                onClick={() => handleStatusChange(completedStatus)}
                                disabled={loading}
                            >
                                완료 처리
                            </MGButton>
                            <MGButton
                                type="button"
                                variant="danger"
                                className="mg-v2-schedule-detail-btn--danger"
                                preventDoubleClick={false}
                                onClick={() => setShowCancelConfirm(true)}
                                disabled={loading}
                            >
                                예약 취소
                            </MGButton>
                        </>
                    );
                })()}
                {isStatus(resolveStatusForActions(displayData), 'COMPLETED') && (() => {
                    const bookedStatus = scheduleStatusOptions.find(opt =>
                        opt.value === 'BOOKED' || opt.label?.includes('예약')
                    )?.value || 'BOOKED';
                    return (
                        <MGButton
                            type="button"
                            variant="outline"
                            className="mg-v2-btn--outline"
                            preventDoubleClick={false}
                            onClick={() => handleStatusChange(bookedStatus)}
                            disabled={loading}
                        >
                            다시 예약
                        </MGButton>
                    );
                })()}
                {isStatus(resolveStatusForActions(displayData), 'CANCELLED') && (() => {
                    const bookedStatus = scheduleStatusOptions.find(opt =>
                        opt.value === 'BOOKED' || opt.label?.includes('예약')
                    )?.value || 'BOOKED';
                    return (
                        <MGButton
                            type="button"
                            variant="outline"
                            className="mg-v2-btn--outline"
                            preventDoubleClick={false}
                            onClick={() => handleStatusChange(bookedStatus)}
                            disabled={loading}
                        >
                            다시 예약
                        </MGButton>
                    );
                })()}
            </div>
        );
    };

    return (
        <>
            {/* 메인 스케줄 상세 모달 */}
            <UnifiedModal
                isOpen={isOpen}
                onClose={onClose}
                title="일정 상세"
                size="large"
                backdropClick={true}
                showCloseButton={true}
                className="mg-v2-ad-b0kla"
                actions={renderMainActions()}
            >
                <div className="mg-v2-ad-modal__section">
                            <div className="section-title">상담 정보</div>
                            <div className="section-content" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ color: 'var(--color-text-secondary)', fontWeight: 500 }}>이벤트</span>
                                    <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}><SafeText>{displayData.title}</SafeText></span>
                                </div>
                    
                    {!isVacationEvent() && (() => {
                        let parsedConsultantName = displayData.consultantName;
                        let parsedClientName = displayData.clientName;
                        
                        if ((!parsedConsultantName || parsedConsultantName === '상담사 정보 없음' || parsedConsultantName === 'undefined') &&
                            (!parsedClientName || parsedClientName === '내담자 정보 없음' || parsedClientName === 'undefined')) {
                            const titleStr = toDisplayString(displayData.title, '');
                            if (titleStr && titleStr.includes(' - ')) {
                                const names = titleStr.split(' - ');
                                if (names.length === 2) {
                                    parsedConsultantName = names[0].trim();
                                    parsedClientName = names[1].trim();
                                }
                            }
                        }
                        
                        return (
                            <>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ color: 'var(--color-text-secondary)', fontWeight: 500 }}>상담사</span>
                                    <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}><SafeText fallback="상담사 정보 없음">{parsedConsultantName}</SafeText></span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ color: 'var(--color-text-secondary)', fontWeight: 500 }}>내담자</span>
                                    <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}><SafeText fallback="내담자 정보 없음">{parsedClientName}</SafeText></span>
                                </div>
                            </>
                        );
                    })()}
                    
                    {isVacationEvent() ? (
                        <>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ color: 'var(--color-text-secondary)', fontWeight: 500 }}>휴가 사유</span>
                                <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}><SafeText fallback="사유 없음">{displayData.description ?? displayData.reason}</SafeText></span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ color: 'var(--color-text-secondary)', fontWeight: 500 }}>휴가 유형</span>
                                <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}><SafeText>{getVacationTypeDisplay(displayData.vacationType)}</SafeText></span>
                            </div>
                        </>
                    ) : (
                        <>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ color: 'var(--color-text-secondary)', fontWeight: 500 }}>상담 유형</span>
                                <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}><SafeText>{convertConsultationTypeToKorean(displayData.consultationType)}</SafeText></span>
                            </div>
                        </>
                    )}
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: 'var(--color-text-secondary)', fontWeight: 500 }}>시간</span>
                        <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                            <SafeText>{displayData.startTime}</SafeText> - <SafeText>{displayData.endTime}</SafeText>
                        </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: '1px solid var(--color-border)' }}>
                        <span style={{ color: 'var(--color-text-secondary)', fontWeight: 500 }}>상태</span>
                        <span className={`mg-v2-badge mg-v2-badge-${getStatusColorClass(getStatusCodeValue(statusForDisplay))}`}>
                            <SafeText>{convertStatusToKorean(statusForDisplay)}</SafeText>
                        </span>
                    </div>
                            </div>
                        </div>
            </UnifiedModal>

            {showCancelConfirm && renderCancelConfirm()}
            {showConfirmModal && renderConfirmModal()}
            
            {/* 상담일지 작성 모달은 부모 컴포넌트에서 관리 */}
        </>
    );
};

export default ScheduleDetailModal;
