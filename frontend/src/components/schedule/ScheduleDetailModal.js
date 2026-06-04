import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import StandardizedApi from '../../utils/standardizedApi';
import { getCommonCodes } from '../../utils/commonCodeApi';
import notificationManager from '../../utils/notification';
import { useSession } from '../../contexts/SessionContext';
import { RoleUtils, USER_ROLES, LEGACY_USER_ROLES } from '../../constants/roles';
import UnifiedModal from '../common/modals/UnifiedModal';
import '../admin/AdminDashboard/AdminDashboardB0KlA.css';
import './ScheduleB0KlA.css';
import '../../styles/main.css';
import SafeText from '../common/SafeText';
import MGButton from '../common/MGButton';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../erp/common/erpMgButtonProps';
import { toDisplayString, toSafeNumber } from '../../utils/safeDisplay';
import { useNavigate } from 'react-router-dom';
import { ADMIN_ROUTES } from '../../constants/adminRoutes';
import {
    CALENDAR_EXTENDED_TYPE_VACATION,
    SCHEDULE_REMAINING_SESSIONS_FIELD,
    SCHEDULE_SESSION_SEQUENCE_FIELD,
    SCHEDULE_TOTAL_SESSIONS_FIELD,
    parseScheduleSessionCount
} from '../../constants/schedule';
import ClientSummaryField from '../consultant/molecules/ClientSummaryField';
import StatusBadge from '../common/StatusBadge';
import ScheduleClientNotesSection from './ScheduleClientNotesSection';
import SchedulePartyQuickViewModal from './molecules/SchedulePartyQuickViewModal';
import { ProfileCard } from '../ui/Card/index';
import { applyPartyPiiPolicy } from '../../utils/partyPiiDisplay';
import { getProfessionalProviderTypeLabel } from '../../constants/professionalProviderRoles';
import { useTranslation } from 'react-i18next';

    /** 일정 상세·중첩 요약·확인 모달 z-index (부모 < 요약 < 확인) */
const SCHEDULE_DETAIL_Z_INDEX_MAIN = 1040;
const SCHEDULE_DETAIL_Z_INDEX_PARTY_QUICK = 1140;
const SCHEDULE_DETAIL_Z_INDEX_CONFIRM = 1240;
/** 요약에서 비어 있음 표시 */
const SCHEDULE_DETAIL_DISPLAY_PLACEHOLDER = '\u2014';

/** 상담일지 deep link 노출 가능한 상태 코드 (TENTATIVE/CANCELLED 제외) */
const CONSULTATION_LOG_LINK_VISIBLE_STATUSES = Object.freeze([
    'BOOKED',
    'CONFIRMED',
    'COMPLETED'
]);

/**
 * 모달의 회기 라벨(사용/총) 계산.
 *
 * <p>로직 우선순위:
 * <ol>
 *   <li>백엔드 합산값({@code combinedUsedSessions}/{@code combinedTotalSessions}) 이 있으면 SSOT 로 사용.</li>
 *   <li>없으면 {@code pastSessionCount} + 매핑 단위 사용 회기로 합산. 매핑 단위는
 *       {@code sessionSequence}(1-based) 우선, 없으면 ({@code totalSessions} - {@code remainingSessions}) fallback.</li>
 *   <li>{@code pastSessionCount} null/0/음수 → 0 으로 안전 처리 (신규 내담자 정책).</li>
 *   <li>단회기({@code totalSessions <= 1}) 또는 매핑 정보 부족 시 null 반환 (모달 비표시).</li>
 * </ol>
 *
 * @param {object} schedule 모달에 표시중인 schedule 객체
 * @returns {{ used: number|null, total: number|null }}
 */
/**
 * 일정 상세 모달의 "누적 상담" 라벨용 lifetime 합산 정보 산출.
 *
 * <p>백엔드 SSOT ({@code clientLifetimeSessionCount}) 가 있으면 우선 사용.
 * 없으면 ({@code pastSessionCount ?? 0}) 단독 fallback.</p>
 *
 * @param {object} schedule
 * @returns {{ past: number, current: number, total: number|null }}
 *   past = 외부 과거 회기수 (0 처리), current = lifetime - past, total = 합산 (null = 비표시)
 */
function resolveModalLifetimeSessionInfo(schedule) {
    if (!schedule) {
        return { past: 0, current: 0, total: null };
    }
    const past = parseScheduleSessionCount(schedule.pastSessionCount);
    const pastSafe = past !== null && past > 0 ? past : 0;
    const backendLifetime = parseScheduleSessionCount(schedule.clientLifetimeSessionCount);
    if (backendLifetime !== null && backendLifetime >= 0) {
        return {
            past: pastSafe,
            current: Math.max(0, backendLifetime - pastSafe),
            total: backendLifetime
        };
    }
    if (pastSafe > 0) {
        return { past: pastSafe, current: 0, total: pastSafe };
    }
    return { past: 0, current: 0, total: null };
}

function resolveModalSessionInfo(schedule) {
    if (!schedule) {
        return { used: null, total: null };
    }
    const backendCombinedTotal = parseScheduleSessionCount(schedule.combinedTotalSessions);
    const backendCombinedUsed = parseScheduleSessionCount(schedule.combinedUsedSessions);
    if (backendCombinedTotal !== null && backendCombinedUsed !== null && backendCombinedTotal > 1) {
        return {
            used: Math.max(0, Math.min(backendCombinedTotal, backendCombinedUsed)),
            total: backendCombinedTotal
        };
    }
    const total = parseScheduleSessionCount(
        schedule[SCHEDULE_TOTAL_SESSIONS_FIELD] ?? schedule.totalSessions
    );
    if (total === null || total <= 1) {
        return { used: null, total: null };
    }
    const past = parseScheduleSessionCount(schedule.pastSessionCount);
    const pastSafe = past !== null && past > 0 ? past : 0;
    const sequence = parseScheduleSessionCount(
        schedule[SCHEDULE_SESSION_SEQUENCE_FIELD] ?? schedule.sessionSequence
    );
    let usedFromMapping = null;
    if (sequence !== null && sequence > 0) {
        usedFromMapping = Math.min(sequence, total);
    } else {
        const remaining = parseScheduleSessionCount(
            schedule[SCHEDULE_REMAINING_SESSIONS_FIELD] ?? schedule.remainingSessions
        );
        if (remaining !== null && remaining >= 0 && remaining <= total) {
            usedFromMapping = total - remaining;
        }
    }
    if (usedFromMapping === null) {
        return { used: null, total: pastSafe + total };
    }
    return { used: pastSafe + usedFromMapping, total: pastSafe + total };
}

/**
 * yyyy-MM-dd 문자열로 정규화 (Date·문자열 모두 허용, 실패 시 null).
 *
 * @param {string|Date|undefined} raw
 * @returns {string|null}
 */
function toIsoDateString(raw) {
    if (!raw) {
        return null;
    }
    if (raw instanceof Date) {
        if (Number.isNaN(raw.getTime())) {
            return null;
        }
        const y = raw.getFullYear();
        const m = String(raw.getMonth() + 1).padStart(2, '0');
        const d = String(raw.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }
    if (typeof raw !== 'string') {
        return null;
    }
    const trimmed = raw.trim();
    const isoMatch = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (!isoMatch) {
        return null;
    }
    const y = isoMatch[1];
    const m = String(isoMatch[2]).padStart(2, '0');
    const d = String(isoMatch[3]).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

/**
 * 상담일지 deep link 가 노출 가능한 일정인지 판정.
 * - 과거 또는 당일 (date <= today) 일정만 노출 (미래 제외)
 * - 상태가 BOOKED·CONFIRMED·COMPLETED 인 경우만 (TENTATIVE/CANCELLED 제외)
 * - 휴가 이벤트는 비활성
 *
 * @param {object} schedule
 * @param {string} statusCode 정규화된 상태 코드
 * @param {boolean} isVacation 휴가 이벤트 여부
 * @param {Date} [now]
 * @returns {boolean}
 */
function shouldShowConsultationLogLink(schedule, statusCode, isVacation, now = new Date()) {
    if (!schedule || isVacation) {
        return false;
    }
    if (!CONSULTATION_LOG_LINK_VISIBLE_STATUSES.includes(statusCode)) {
        return false;
    }
    const sessionDate = toIsoDateString(
        schedule.sessionDate || schedule.date || schedule.apiDate
    );
    if (!sessionDate) {
        return false;
    }
    const todayIso = toIsoDateString(now);
    if (!todayIso) {
        return false;
    }
    return sessionDate <= todayIso;
}

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
    const { t } = useTranslation();
    const { user } = useSession();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [showCancelConfirm, setShowCancelConfirm] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [adminNote, setAdminNote] = useState('');
    const [scheduleStatusOptions, setScheduleStatusOptions] = useState([]);
    const [loadingCodes, setLoadingCodes] = useState(false);
    /** 상태 변경 성공 시 API 응답으로 갱신한 데이터 (모달이 닫히지 않을 때 최신 상태 표시) */
    const [localScheduleOverride, setLocalScheduleOverride] = useState(null);
    /** 상세 | 특이사항 (통합 스케줄 SSOT, 휴가·내담자 포털에서는 탭 미노출) */
    const [activeDetailTab, setActiveDetailTab] = useState('detail');
    /** 특이사항 미해소 건수(탭 배지) — ScheduleClientNotesSection 콜백 */
    const [clientNotesUnresolvedCount, setClientNotesUnresolvedCount] = useState(0);
    /** ADMIN/STAFF: 내담자·상담사 읽기 전용 요약(중첩 UnifiedModal 1겹) */
    const [partyQuickView, setPartyQuickView] = useState(null);
    const clientPartyTriggerRef = useRef(null);
    const consultantPartyTriggerRef = useRef(null);
    const partyQuickViewRef = useRef(null);

    const isClient = RoleUtils.isClient(user);

    useEffect(() => {
        partyQuickViewRef.current = partyQuickView;
    }, [partyQuickView]);

    useEffect(() => {
        if (!isOpen) {
            setPartyQuickView(null);
        }
    }, [isOpen]);

    useEffect(() => {
        if (showCancelConfirm || showConfirmModal || loading) {
            setPartyQuickView(null);
        }
    }, [showCancelConfirm, showConfirmModal, loading]);

    /** 코드값/한글 라벨 모두 고려해 공통코드 value로 정규화 */
    const getStatusCodeValue = (codeOrLabel) => {
        if (codeOrLabel == null || codeOrLabel === '') return codeOrLabel;
        const knownCodes = [
            'BOOKED',
            'CONFIRMED',
            'COMPLETED',
            'CANCELLED',
            'VACATION',
            'AVAILABLE',
            'TENTATIVE_PENDING_PAYMENT'
        ];
        if (knownCodes.includes(String(codeOrLabel).trim())) return String(codeOrLabel).trim();
        const byValue = scheduleStatusOptions.find(opt => opt.value === codeOrLabel);
        if (byValue) return byValue.value;
        const byLabel = scheduleStatusOptions.find(opt => (opt.label && opt.label === codeOrLabel));
        if (byLabel) return byLabel.value;
        if (typeof codeOrLabel === 'string') {
            if (/취소|취소됨/.test(codeOrLabel)) return 'CANCELLED';
            if (/가예약|TENTATIVE_PENDING_PAYMENT|결제\s*대기\s*\(가예약\)/.test(codeOrLabel)) {
                return 'TENTATIVE_PENDING_PAYMENT';
            }
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
            st === t('schedule:ScheduleDetailModal.t_8916b639');
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
            notificationManager.error(t('schedule:ScheduleDetailModal.t_e72bdf24'));
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

    useEffect(() => {
        setActiveDetailTab('detail');
        setClientNotesUnresolvedCount(0);
    }, [isOpen, scheduleData?.id]);

    const handleClientNotesSummary = useCallback((summary) => {
        const n = summary?.unresolvedCount;
        setClientNotesUnresolvedCount(typeof n === 'number' && !Number.isNaN(n) ? n : 0);
    }, []);

    const handlePartyQuickViewClose = useCallback((opts) => {
        const skipFocusRestore = opts?.skipFocusRestore === true;
        const v = partyQuickViewRef.current;
        setPartyQuickView(null);
        if (!skipFocusRestore) {
            queueMicrotask(() => {
                if (v === 'client') {
                    clientPartyTriggerRef.current?.focus();
                } else if (v === 'consultant') {
                    consultantPartyTriggerRef.current?.focus();
                }
            });
        }
    }, []);

    const handleOpenUserManagementFromParty = useCallback((type) => {
        handlePartyQuickViewClose({ skipFocusRestore: true });
        navigate(`${ADMIN_ROUTES.USER_MANAGEMENT}?type=${type}`);
    }, [handlePartyQuickViewClose, navigate]);

    const partyNameParse = useMemo(() => {
        const dd = localScheduleOverride ?? scheduleData;
        if (!dd) {
            return { parsedClientName: '', parsedConsultantName: '' };
        }
        let parsedConsultantName = dd.consultantName;
        let parsedClientName = dd.clientName;

        if ((!parsedConsultantName || parsedConsultantName === t('schedule:ScheduleDetailModal.t_44b8c965') || parsedConsultantName === 'undefined') &&
            (!parsedClientName || parsedClientName === t('schedule:ScheduleDetailModal.t_032787e1') || parsedClientName === 'undefined')) {
            const titleStr = toDisplayString(dd.title, '');
            if (titleStr && titleStr.includes(' - ')) {
                const names = titleStr.split(' - ');
                if (names.length === 2) {
                    parsedConsultantName = names[0].trim();
                    parsedClientName = names[1].trim();
                }
            }
        }

        return { parsedClientName, parsedConsultantName };
    }, [localScheduleOverride, scheduleData]);

    /**
     * 예약 취소 처리 (TDZ 방지: renderCancelConfirm에서 참조)
     */
    const handleCancelSchedule = async() => {
        try {
            setLoading(true);
            console.log('❌ 스케줄 취소 요청:', scheduleData?.id);
            const cancelledStatusOption = scheduleStatusOptions.find(opt =>
                opt.value === 'CANCELLED' || opt.label?.includes(t('schedule:ScheduleDetailModal.t_19b2d19b'))
            );
            const statusCode = cancelledStatusOption?.value ?? 'CANCELLED';
            const response = await StandardizedApi.put(`/api/v1/schedules/${scheduleData.id}`, {
                status: statusCode,
                description: t('schedule:ScheduleDetailModal.t_4da34051')
            });
            if (response != null) {
                notificationManager.success(t('schedule:ScheduleDetailModal.t_f70065ae'));
                onScheduleUpdated?.();
                onClose();
            } else {
                throw new Error(t('schedule:ScheduleDetailModal.t_4659e40d'));
            }
        } catch (error) {
            console.error('❌ 예약 취소 실패:', error);
            notificationManager.error(t('schedule:ScheduleDetailModal.t_dc4ce696'));
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
            notificationManager.error(t('schedule:ScheduleDetailModal.t_70e5dfa5'));
            return;
        }
        setLoading(true);
        try {
            console.log('✅ 예약 확정 요청:', scheduleData.id);
            const confirmRole = encodeURIComponent(user?.role || USER_ROLES.ADMIN);
            const response = await StandardizedApi.put(
                `/api/v1/schedules/${scheduleData.id}/confirm?userRole=${confirmRole}`,
                { adminNote: adminNote || t('schedule:ScheduleDetailModal.t_2709bbf3') }
            );
            if (response != null) {
                notificationManager.success(t('schedule:ScheduleDetailModal.t_cb46263d'));
                onScheduleUpdated?.();
                try {
                  window.dispatchEvent(new CustomEvent('admin-dashboard-refresh-stats'));
                } catch (e) {
                  // CustomEvent 미지원 등 무시
                }
                onClose();
            } else {
                throw new Error(t('schedule:ScheduleDetailModal.t_6e90da17'));
            }
        } catch (error) {
            console.error('❌ 예약 확정 실패:', error);
            notificationManager.error(t('schedule:ScheduleDetailModal.t_fd96349e'));
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
            title={t('schedule:ScheduleDetailModal.t_98f3fec9')}
            size="large"
            variant="confirm"
            zIndex={SCHEDULE_DETAIL_Z_INDEX_CONFIRM}
            backdropClick={!loading}
            showCloseButton={!loading}
            loading={loading}
            className="mg-v2-ad-b0kla"
            actions={(
                <div className="schedule-detail-modal__footer-actions">
                    <MGButton
                        type="button"
                        variant="outline"
                        className={buildErpMgButtonClassName({
                          variant: 'outline',
                          size: 'md',
                          loading: false,
                          className: 'mg-v2-btn--outline'
                        })}
                        loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                        preventDoubleClick={false}
                        onClick={() => setShowCancelConfirm(false)}
                        disabled={loading}
                    >
                        {t('schedule:ScheduleDetailModal.t_cfef357d')}
                    </MGButton>
                    <MGButton
                        type="button"
                        variant="danger"
                        className={buildErpMgButtonClassName({
                          variant: 'danger',
                          size: 'md',
                          loading,
                          className: 'mg-v2-schedule-detail-btn--danger'
                        })}
                        loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                        preventDoubleClick={false}
                        onClick={handleCancelSchedule}
                        loading={loading}
                    >
                        {t('schedule:ScheduleDetailModal.t_dd7bb7ae')}
                    </MGButton>
                </div>
            )}
        >
            <p>{t('schedule:ScheduleDetailModal.t_e45e3fc9')}</p>
        </UnifiedModal>
    );

    /**
     * 예약 확정 확인 모달 (TDZ 방지: loading early return 전에 정의)
     */
    const renderConfirmModal = () => (
        <UnifiedModal
            isOpen={showConfirmModal}
            onClose={() => setShowConfirmModal(false)}
            title={t('schedule:ScheduleDetailModal.t_a64e8746')}
            size="large"
            variant="confirm"
            zIndex={SCHEDULE_DETAIL_Z_INDEX_CONFIRM}
            backdropClick={!loading}
            showCloseButton={!loading}
            loading={loading}
            className="mg-v2-ad-b0kla"
            actions={(
                <div className="schedule-detail-modal__footer-actions">
                    <MGButton
                        type="button"
                        variant="outline"
                        className={buildErpMgButtonClassName({
                          variant: 'outline',
                          size: 'md',
                          loading: false,
                          className: 'mg-v2-btn--outline'
                        })}
                        loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                        preventDoubleClick={false}
                        onClick={() => setShowConfirmModal(false)}
                        disabled={loading}
                    >
                        {t('common.actions.cancel')}
                    </MGButton>
                    <MGButton
                        type="button"
                        variant="primary"
                        className={buildErpMgButtonClassName({
                          variant: 'primary',
                          size: 'md',
                          loading,
                          className: 'mg-v2-btn--primary'
                        })}
                        loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                        preventDoubleClick={false}
                        onClick={handleConfirmSchedule}
                        loading={loading}
                    >
                        {t('schedule:ScheduleDetailModal.t_55536106')}
                    </MGButton>
                </div>
            )}
        >
            <p>{t('schedule:ScheduleDetailModal.t_31b8f8ba')}</p>
            <div className="mg-form-group">
                <label className="mg-v2-label">{t('schedule:ScheduleDetailModal.t_ba4baffb')}</label>
                <textarea
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                    placeholder={t('schedule:ScheduleDetailModal.t_2709bbf3')}
                    className="mg-v2-textarea mg-v2-input schedule-detail-modal__admin-note-input"
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
                    title={t('schedule:ScheduleDetailModal.t_bd04d7e4')}
                    size="large"
                    loading={true}
                    showCloseButton={false}
                    backdropClick={false}
                    zIndex={SCHEDULE_DETAIL_Z_INDEX_MAIN}
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
            'INDIVIDUAL': t('schedule:ScheduleDetailModal.t_efda14c0'),
            'COUPLE': t('schedule:ScheduleDetailModal.t_62b69843'),
            'FAMILY': t('schedule:ScheduleDetailModal.t_aaa928a6'),
            'INITIAL': t('schedule:ScheduleDetailModal.t_d90982dc'),
            'GROUP': t('schedule:ScheduleDetailModal.t_607ecaca')
        };
        return typeMap[consultationType] || consultationType || t('schedule:ScheduleDetailModal.t_8916b639');
    };

/**
     * 상태값을 한글로 변환 (코드값/한글 라벨 모두 처리, fallback 포함)
     */
    const convertStatusToKorean = (status) => {
        if (status == null || status === '') return t('schedule:ScheduleDetailModal.t_8916b639');
        const byValue = scheduleStatusOptions.find(opt => opt.value === status);
        if (byValue && byValue.label) return byValue.label;
        const byLabel = scheduleStatusOptions.find(opt => opt.label === status);
        if (byLabel && byLabel.label) return byLabel.label;
        const code = getStatusCodeValue(status);
        const fallbackMap = {
            CANCELLED: t('schedule:ScheduleDetailModal.t_3aa9e7ee'),
            BOOKED: t('schedule:ScheduleDetailModal.t_69692a2a'),
            COMPLETED: t('schedule:ScheduleDetailModal.t_1f74613e'),
            CONFIRMED: t('schedule:ScheduleDetailModal.t_b8a98744'),
            VACATION: t('schedule:ScheduleDetailModal.t_4cdf9ae5'),
            AVAILABLE: t('schedule:ScheduleDetailModal.t_9614672b'),
            TENTATIVE_PENDING_PAYMENT: t('schedule:ScheduleDetailModal.t_35205a43')
        };
        return fallbackMap[code] || status || t('schedule:ScheduleDetailModal.t_8916b639');
    };

/**
     * 휴가 이벤트 여부 — FullCalendar `extendedProps.type === 'vacation'` 와 동일 SSOT
     * (모달에는 extendedProps 없음 → `calendarEventType` 또는 레거시 `type` 필드로 전달)
     */
    const isVacationEvent = () => {
        const dd = localScheduleOverride ?? scheduleData;
        if (!dd) return false;
        if (dd.calendarEventType === CALENDAR_EXTENDED_TYPE_VACATION) return true;
        if (dd.type === CALENDAR_EXTENDED_TYPE_VACATION) return true;
        return false;
    };

/**
     * 휴가 유형을 표시용으로 변환
     */
    const getVacationTypeDisplay = (vacationType) => {
        const typeMap = {
            'ALL_DAY': t('schedule:ScheduleDetailModal.t_c59d51f5'),
            'FULL_DAY': t('schedule:ScheduleDetailModal.t_c59d51f5'),
            'MORNING': t('schedule:ScheduleDetailModal.t_31408297'),
            'MORNING_HALF_1': t('schedule:ScheduleDetailModal.t_64e76ae5'),
            'MORNING_HALF_2': t('schedule:ScheduleDetailModal.t_ebbd7667'),
            'AFTERNOON': t('schedule:ScheduleDetailModal.t_5a929057'),
            'AFTERNOON_HALF_1': t('schedule:ScheduleDetailModal.t_96dea9f3'),
            'AFTERNOON_HALF_2': t('schedule:ScheduleDetailModal.t_63c6a9c2'),
            'CUSTOM_TIME': t('schedule:ScheduleDetailModal.t_a5e8754f')
        };
        return typeMap[vacationType] || t('schedule:ScheduleDetailModal.t_81a22ad8');
    };

    /**
     * 상태 변경 처리
     * 성공 시 응답으로 모달 표시 데이터를 갱신해, 부모가 목록만 갱신해도 버튼/상태가 올바르게 보이도록 함.
     */
    const handleStatusChange = async(newStatus) => {
        try {
            setLoading(true);
            console.log('📝 스케줄 상태 변경:', scheduleData.id, newStatus);

            const response = await StandardizedApi.put(`/api/v1/schedules/${scheduleData.id}`, {
                status: newStatus
            });

            if (response != null) {
                notificationManager.success(t('schedule:ScheduleDetailModal.t_decb7579'));
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
                throw new Error(response?.message || t('schedule:ScheduleDetailModal.t_6a68eb67'));
            }
        } catch (error) {
            console.error('❌ 상태 변경 실패:', error);
            notificationManager.error(t('schedule:ScheduleDetailModal.t_d034ac4a'));
        } finally {
            setLoading(false);
        }
    };

/**
     * 상담일지 작성 처리
     */
    const handleWriteConsultationLog = () => {
        if (!scheduleData?.id) {
            notificationManager.error(t('schedule:ScheduleDetailModal.t_70e5dfa5'));
            return;
        }
        
        console.log('📝 상담일지 작성 요청:', scheduleData.id);
        onClose();
        onConsultationLogOpen?.(scheduleData);
    };

/**
     * 상담일지 조회/수정 페이지로 이동 (과거·당일 일정 한정).
     * 쿼리 파라미터로 scheduleId/date/clientId 를 전달해 자동 필터링.
     */
    const handleOpenConsultationLogView = () => {
        if (!scheduleData?.id) {
            notificationManager.error(t('schedule:ScheduleDetailModal.t_70e5dfa5'));
            return;
        }
        const data = localScheduleOverride ?? scheduleData;
        const sessionDate = toIsoDateString(
            data.sessionDate || data.date || data.apiDate
        );
        const params = new URLSearchParams();
        if (data.id != null) {
            params.set('scheduleId', String(data.id));
        }
        if (sessionDate) {
            params.set('date', sessionDate);
        }
        if (data.clientId != null) {
            params.set('clientId', String(data.clientId));
        }
        const queryString = params.toString();
        const target = queryString
            ? `${ADMIN_ROUTES.CONSULTATION_LOGS}?${queryString}`
            : ADMIN_ROUTES.CONSULTATION_LOGS;
        onClose();
        navigate(target);
    };


/**
     * 예약 변경 — 부모에서 재예약 모달 오픈
     */
    const handleEditSchedule = () => {
        if (!scheduleData?.id) {
            notificationManager.error(t('schedule:ScheduleDetailModal.t_70e5dfa5'));
            return;
        }

        if (onScheduleUpdated) {
            onScheduleUpdated('edit', scheduleData);
        }

        onClose();
    };

    const canRescheduleByRole = user?.role === USER_ROLES.ADMIN || user?.role === LEGACY_USER_ROLES.BRANCH_SUPER_ADMIN;

    if (!isOpen) return null;

    const displayData = localScheduleOverride ?? scheduleData;
    const statusForDisplay = resolveStatusForActions(displayData) ?? displayData.status;
    const showNotesTab = !isVacationEvent() && (RoleUtils.isAdmin(user) || RoleUtils.isStaff(user));
    const canPartyQuickSummary = showNotesTab;
    const { parsedClientName, parsedConsultantName } = partyNameParse;
    const sessionInfo = resolveModalSessionInfo(displayData);
    const lifetimeSessionInfo = resolveModalLifetimeSessionInfo(displayData);
    const lifetimeSessionPast = lifetimeSessionInfo.past;
    const lifetimeSessionCurrent = lifetimeSessionInfo.current;
    const lifetimeSessionTotal = lifetimeSessionInfo.total;
    const consultationLogLinkVisible = shouldShowConsultationLogLink(
        displayData,
        getStatusCodeValue(statusForDisplay),
        isVacationEvent()
    ) && !isClient;

    const buildPartySummaryRows = (kind) => {
        const dash = SCHEDULE_DETAIL_DISPLAY_PLACEHOLDER;
        const datePart = toDisplayString(
            displayData.sessionDate || displayData.date || displayData.apiDate,
            ''
        ).trim();
        const timePart = `${toDisplayString(displayData.startTime, '').trim()}–${toDisplayString(displayData.endTime, '').trim()}`.trim();
        const dateTimeLine = [datePart, timePart].filter(Boolean).join(' ') || dash;
        const statusLine = toDisplayString(convertStatusToKorean(statusForDisplay), dash);
        const typeLine = displayData.consultationTypeCode
            ? toDisplayString(convertConsultationTypeToKorean(displayData.consultationTypeCode), dash)
            : toDisplayString(displayData.consultationType, dash);

        if (kind === 'client') {
            const clientPhoneRaw =
                displayData.clientPhone || displayData.clientMobile || displayData.phone;
            const clientEmailRaw = displayData.clientEmail || displayData.email;
            return [
                { label: t('schedule:ScheduleDetailModal.t_9aa18e50'), value: toDisplayString(parsedClientName, dash) },
                { label: t('schedule:ScheduleDetailModal.t_7db258e6'), value: toDisplayString(displayData.clientId, dash) },
                {
                    label: t('schedule:ScheduleDetailModal.t_4374db90'),
                    value: toDisplayString(
                        applyPartyPiiPolicy(clientPhoneRaw, 'phone', user),
                        dash
                    )
                },
                {
                    label: t('schedule:ScheduleDetailModal.t_3c37764a'),
                    value: toDisplayString(applyPartyPiiPolicy(clientEmailRaw, 'email', user), dash)
                },
                { label: t('schedule:ScheduleDetailModal.t_27e729aa'), value: statusLine },
                { label: t('schedule:ScheduleDetailModal.t_c6c6281f'), value: typeLine },
                { label: t('schedule:ScheduleDetailModal.t_abfcf6cf'), value: dateTimeLine }
            ];
        }

        return [
            { label: t('schedule:ScheduleDetailModal.t_9aa18e50'), value: toDisplayString(parsedConsultantName, dash) },
            { label: t('schedule:ScheduleDetailModal.t_7db258e6'), value: toDisplayString(displayData.consultantId, dash) },
            {
                label: t('schedule:ScheduleDetailModal.t_4374db90'),
                value: toDisplayString(
                    applyPartyPiiPolicy(displayData.consultantPhone, 'phone', user),
                    dash
                )
            },
            {
                label: t('schedule:ScheduleDetailModal.t_3c37764a'),
                value: toDisplayString(
                    applyPartyPiiPolicy(displayData.consultantEmail, 'email', user),
                    dash
                )
            },
            { label: t('schedule:ScheduleDetailModal.t_27e729aa'), value: statusLine },
            { label: t('schedule:ScheduleDetailModal.t_c6c6281f'), value: typeLine },
            { label: t('schedule:ScheduleDetailModal.t_abfcf6cf'), value: dateTimeLine }
        ];
    };

    const effectiveTab = showNotesTab && activeDetailTab === 'notes' ? 'notes' : 'detail';

    /** 입금 전 가예약(TENTATIVE_PENDING_PAYMENT)은 예약됨(BOOKED)과 동일한 관리 액션(변경·확정·취소) */
    const isBookedOrTentativePending = () => {
        const s = resolveStatusForActions(displayData);
        return isStatus(s, 'BOOKED') || isStatus(s, 'TENTATIVE_PENDING_PAYMENT');
    };

    const renderMainActions = () => {
        if (isVacationEvent()) {
            return (
                <div className="schedule-detail-modal__footer-msg">
                    <p className="schedule-detail-modal__footer-msg-lead">
                        {t('schedule:ScheduleDetailModal.t_cb2cab8e')}
                    </p>
                    <p className="schedule-detail-modal__footer-msg-sub">
                        {t('schedule:ScheduleDetailModal.t_d403d748')}
                    </p>
                </div>
            );
        }
        if (isClient) {
            return (
                <div className="schedule-detail-modal__footer-msg schedule-detail-modal__footer-msg--client">
                    <p className="schedule-detail-modal__footer-msg-lead schedule-detail-modal__footer-msg-lead--neutral">
                        {t('schedule:ScheduleDetailModal.t_43407f7e')}
                    </p>
                    <p className="schedule-detail-modal__footer-msg-sub">
                        {t('schedule:ScheduleDetailModal.t_d8085f4b')}
                    </p>
                </div>
            );
        }
        return (
            <>
                {isBookedOrTentativePending() && (
                    <>
                        {canRescheduleByRole && (
                            <MGButton
                                type="button"
                                variant="outline"
                                className={buildErpMgButtonClassName({
                                  variant: 'outline',
                                  size: 'md',
                                  loading: false,
                                  className: 'mg-v2-btn--outline'
                                })}
                                loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                                preventDoubleClick={false}
                                onClick={handleEditSchedule}
                                disabled={loading}
                            >
                                {t('schedule:ScheduleDetailModal.t_a8136a0a')}
                            </MGButton>
                        )}
                        <MGButton
                            type="button"
                            variant="primary"
                            className={buildErpMgButtonClassName({
                              variant: 'primary',
                              size: 'md',
                              loading: false,
                              className: 'mg-v2-btn--primary'
                            })}
                            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                            preventDoubleClick={false}
                            onClick={() => setShowConfirmModal(true)}
                            disabled={loading}
                        >
                            {t('schedule:ScheduleDetailModal.t_a64e8746')}
                        </MGButton>
                        <MGButton
                            type="button"
                            variant="danger"
                            className={buildErpMgButtonClassName({
                              variant: 'danger',
                              size: 'md',
                              loading: false,
                              className: 'mg-v2-schedule-detail-btn--danger'
                            })}
                            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                            preventDoubleClick={false}
                            onClick={() => setShowCancelConfirm(true)}
                            disabled={loading}
                        >
                            {t('schedule:ScheduleDetailModal.t_7f40dc74')}
                        </MGButton>
                    </>
                )}
                {isStatus(resolveStatusForActions(displayData), 'CONFIRMED') && (() => {
                    const completedStatus = scheduleStatusOptions.find(opt =>
                        opt.value === 'COMPLETED' || opt.label?.includes(t('schedule:ScheduleDetailModal.t_8d868037'))
                    )?.value || 'COMPLETED';
                    return (
                        <>
                            <MGButton
                                type="button"
                                variant="outline"
                                className={buildErpMgButtonClassName({
                                  variant: 'outline',
                                  size: 'md',
                                  loading: false,
                                  className: 'mg-v2-btn--outline'
                                })}
                                loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                                preventDoubleClick={false}
                                onClick={handleWriteConsultationLog}
                                disabled={loading}
                            >
                                {t('schedule:ScheduleDetailModal.t_a0658140')}
                            </MGButton>
                            <MGButton
                                type="button"
                                variant="primary"
                                className={buildErpMgButtonClassName({
                                  variant: 'primary',
                                  size: 'md',
                                  loading: false,
                                  className: 'mg-v2-btn--primary'
                                })}
                                loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                                preventDoubleClick={false}
                                onClick={() => handleStatusChange(completedStatus)}
                                disabled={loading}
                            >
                                {t('schedule:ScheduleDetailModal.t_a9f9a032')}
                            </MGButton>
                            <MGButton
                                type="button"
                                variant="danger"
                                className={buildErpMgButtonClassName({
                                  variant: 'danger',
                                  size: 'md',
                                  loading: false,
                                  className: 'mg-v2-schedule-detail-btn--danger'
                                })}
                                loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                                preventDoubleClick={false}
                                onClick={() => setShowCancelConfirm(true)}
                                disabled={loading}
                            >
                                {t('schedule:ScheduleDetailModal.t_7f40dc74')}
                            </MGButton>
                        </>
                    );
                })()}
                {isStatus(resolveStatusForActions(displayData), 'COMPLETED') && (() => {
                    const bookedStatus = scheduleStatusOptions.find(opt =>
                        opt.value === 'BOOKED' || opt.label?.includes(t('schedule:ScheduleDetailModal.t_17f4b478'))
                    )?.value || 'BOOKED';
                    return (
                        <MGButton
                            type="button"
                            variant="outline"
                            className={buildErpMgButtonClassName({
                              variant: 'outline',
                              size: 'md',
                              loading: false,
                              className: 'mg-v2-btn--outline'
                            })}
                            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                            preventDoubleClick={false}
                            onClick={() => handleStatusChange(bookedStatus)}
                            disabled={loading}
                        >
                            {t('schedule:ScheduleDetailModal.t_2b4049c1')}
                        </MGButton>
                    );
                })()}
                {isStatus(resolveStatusForActions(displayData), 'CANCELLED') && (() => {
                    const bookedStatus = scheduleStatusOptions.find(opt =>
                        opt.value === 'BOOKED' || opt.label?.includes(t('schedule:ScheduleDetailModal.t_17f4b478'))
                    )?.value || 'BOOKED';
                    return (
                        <MGButton
                            type="button"
                            variant="outline"
                            className={buildErpMgButtonClassName({
                              variant: 'outline',
                              size: 'md',
                              loading: false,
                              className: 'mg-v2-btn--outline'
                            })}
                            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                            preventDoubleClick={false}
                            onClick={() => handleStatusChange(bookedStatus)}
                            disabled={loading}
                        >
                            {t('schedule:ScheduleDetailModal.t_2b4049c1')}
                        </MGButton>
                    );
                })()}
            </>
        );
    };

    return (
        <>
            {/* 메인 스케줄 상세 모달 */}
            <UnifiedModal
                isOpen={isOpen}
                onClose={onClose}
                title={t('schedule:ScheduleDetailModal.t_9cd38a93')}
                size="large"
                backdropClick={true}
                showCloseButton={true}
                zIndex={SCHEDULE_DETAIL_Z_INDEX_MAIN}
                closeOnEscape={!partyQuickView}
                className="mg-v2-ad-b0kla"
                actions={(
                    <div className="schedule-detail-modal__footer-actions mg-v2-ad-b0kla__modal-actions">
                        {consultationLogLinkVisible && (
                            <MGButton
                                type="button"
                                variant="outline"
                                className={buildErpMgButtonClassName({
                                    variant: 'outline',
                                    size: 'md',
                                    loading: false,
                                    className: 'mg-v2-btn--outline schedule-detail-modal__btn--log-link'
                                })}
                                loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                                preventDoubleClick={false}
                                onClick={handleOpenConsultationLogView}
                                disabled={loading}
                                aria-label={t(
                                    'schedule:ScheduleDetailModal.openConsultationLogViewAria',
                                    { date: toIsoDateString(displayData.sessionDate || displayData.date || displayData.apiDate) || '' }
                                )}
                                data-testid="schedule-detail-open-consultation-log"
                            >
                                {t('schedule:ScheduleDetailModal.openConsultationLogView')}
                            </MGButton>
                        )}
                        {renderMainActions()}
                    </div>
                )}
            >
                {showNotesTab ? (
                    <div className="schedule-detail-modal__tabs mg-v2-ad-b0kla__segmented-control">
                        <div
                            className="schedule-detail-modal__tabs__track"
                            role="tablist"
                            aria-label={t('schedule:ScheduleDetailModal.t_b07dbada')}
                        >
                            <MGButton
                                type="button"
                                variant={activeDetailTab === 'detail' ? 'primary' : 'outline'}
                                className={`${buildErpMgButtonClassName({
                                    variant: activeDetailTab === 'detail' ? 'primary' : 'outline',
                                    size: 'sm',
                                    loading: false,
                                    className: activeDetailTab === 'detail' ? 'mg-v2-btn--primary' : 'mg-v2-btn--outline'
                                })} mg-v2-ad-b0kla__segmented-item`.trim()}
                                loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                                preventDoubleClick={false}
                                onClick={() => setActiveDetailTab('detail')}
                                aria-selected={activeDetailTab === 'detail'}
                                role="tab"
                            >
                                {t('schedule:ScheduleDetailModal.t_bb446431')}
                            </MGButton>
                            <MGButton
                                type="button"
                                variant={activeDetailTab === 'notes' ? 'primary' : 'outline'}
                                className={`${buildErpMgButtonClassName({
                                    variant: activeDetailTab === 'notes' ? 'primary' : 'outline',
                                    size: 'sm',
                                    loading: false,
                                    className: activeDetailTab === 'notes' ? 'mg-v2-btn--primary' : 'mg-v2-btn--outline'
                                })} mg-v2-ad-b0kla__segmented-item`.trim()}
                                loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                                preventDoubleClick={false}
                                onClick={() => setActiveDetailTab('notes')}
                                aria-selected={activeDetailTab === 'notes'}
                                role="tab"
                            >
                                특이사항
                                {clientNotesUnresolvedCount > 0
                                    ? ` (${clientNotesUnresolvedCount})`
                                    : ''}
                            </MGButton>
                        </div>
                    </div>
                ) : null}
                {effectiveTab === 'notes' ? (
                    <ScheduleClientNotesSection
                        scheduleData={displayData}
                        user={user}
                        onSummaryChange={handleClientNotesSummary}
                    />
                ) : (
                <div className="mg-v2-ad-modal__section">
                    {showNotesTab ? (
                        <div className="schedule-detail-modal__persist-note-hint" role="note">
                            <SafeText>
                                {toDisplayString(
                                    t('schedule:ScheduleDetailModal.t_a00dbe79'),
                                    ''
                                )}
                            </SafeText>
                        </div>
                    ) : null}
                    <div className="schedule-detail-modal__summary-strip">
                        <div className="schedule-detail-modal__summary-item">
                            <span className="schedule-detail-modal__summary-label">{t('common.labels.status')}</span>
                            <StatusBadge status={getStatusCodeValue(statusForDisplay)}>
                                {toDisplayString(convertStatusToKorean(statusForDisplay), SCHEDULE_DETAIL_DISPLAY_PLACEHOLDER)}
                            </StatusBadge>
                        </div>
                        <div className="schedule-detail-modal__summary-item">
                            <span className="schedule-detail-modal__summary-label">{t('schedule:ScheduleDetailModal.t_80577c5f')}</span>
                            <span className="schedule-detail-modal__summary-value">
                                <SafeText>{isVacationEvent() ? getVacationTypeDisplay(displayData.vacationType) : convertConsultationTypeToKorean(displayData.consultationType)}</SafeText>
                            </span>
                        </div>
                        <div className="schedule-detail-modal__summary-item">
                            <span className="schedule-detail-modal__summary-label">{t('schedule:ScheduleDetailModal.t_6c35133c')}</span>
                            <span className="schedule-detail-modal__summary-value">
                                <SafeText>{displayData.startTime}</SafeText> - <SafeText>{displayData.endTime}</SafeText>
                            </span>
                        </div>
                        {!isVacationEvent() && sessionInfo.total !== null && sessionInfo.used !== null && (
                            <div
                                className="schedule-detail-modal__summary-item schedule-detail-modal__summary-item--sessions"
                                data-testid="schedule-detail-session-info"
                            >
                                <span className="schedule-detail-modal__summary-label">
                                    {t('schedule:ScheduleDetailModal.sessionInfoLabel')}
                                </span>
                                <span className="schedule-detail-modal__summary-value">
                                    <SafeText>
                                        {t('schedule:ScheduleDetailModal.sessionInfoValue', {
                                            used: sessionInfo.used,
                                            total: sessionInfo.total
                                        })}
                                    </SafeText>
                                </span>
                            </div>
                        )}
                        {!isVacationEvent() && lifetimeSessionTotal !== null && (
                            <div
                                className="schedule-detail-modal__summary-item schedule-detail-modal__summary-item--lifetime-sessions"
                                data-testid="schedule-detail-lifetime-session-info"
                            >
                                <span className="schedule-detail-modal__summary-label">
                                    {t('schedule:ScheduleDetailModal.lifetimeSessionInfoLabel')}
                                </span>
                                <span className="schedule-detail-modal__summary-value">
                                    <SafeText>
                                        {t('schedule:ScheduleDetailModal.lifetimeSessionInfoValue', {
                                            past: lifetimeSessionPast,
                                            current: lifetimeSessionCurrent,
                                            total: lifetimeSessionTotal
                                        })}
                                    </SafeText>
                                </span>
                            </div>
                        )}
                        {showNotesTab && (
                            <div className="schedule-detail-modal__summary-item">
                                <span className="schedule-detail-modal__summary-label">{t('schedule:ScheduleDetailModal.t_e5261918')}</span>
                                <span className="schedule-detail-modal__summary-value">
                                    <SafeText>
                                        {toSafeNumber(clientNotesUnresolvedCount, 0) > 0
                                            ? t('schedule:ScheduleDetailModal.t_bb03a4c6')
                                            : t('schedule:ScheduleDetailModal.t_d58fa73a')}
                                    </SafeText>
                                </span>
                            </div>
                        )}
                    </div>

                    {!isVacationEvent() && (
                            <div className="schedule-detail-modal__parties">
                                {canPartyQuickSummary && displayData.clientId ? (
                                    <ProfileCard
                                        ref={clientPartyTriggerRef}
                                        variant="compact"
                                        avatar={{ displayName: parsedClientName }}
                                        name={<SafeText fallback="내담자 정보 없음">{parsedClientName}</SafeText>}
                                        badges={<span className="schedule-detail-modal__party-role-label">{t('common.labels.client')}</span>}
                                        onClick={() => setPartyQuickView('client')}
                                        className="schedule-detail-modal__party-card--trigger"
                                        aria-haspopup="dialog"
                                        aria-expanded={partyQuickView === 'client'}
                                        aria-label={`내담자 요약 열기, ${toDisplayString(parsedClientName, '내담자')}`}
                                        renderActions={() => (
                                            <span className="schedule-detail-modal__party-card-hint">{t('schedule:ScheduleDetailModal.t_c72a6f07')}</span>
                                        )}
                                    />
                                ) : (
                                    <ProfileCard
                                        variant="compact"
                                        avatar={{ displayName: parsedClientName }}
                                        name={<SafeText fallback="내담자 정보 없음">{parsedClientName}</SafeText>}
                                        badges={<span className="schedule-detail-modal__party-role-label">{t('common.labels.client')}</span>}
                                        renderActions={canPartyQuickSummary ? () => (
                                            <span className="schedule-detail-modal__party-link--disabled">{t('schedule:ScheduleDetailModal.t_e870adbf')}</span>
                                        ) : undefined}
                                    />
                                )}
                                {canPartyQuickSummary && displayData.consultantId ? (
                                    <ProfileCard
                                        ref={consultantPartyTriggerRef}
                                        variant="compact"
                                        avatar={{ displayName: parsedConsultantName }}
                                        name={<SafeText fallback="상담사 정보 없음">{parsedConsultantName}</SafeText>}
                                        badges={
                                          <span className="schedule-detail-modal__party-role-label">
                                            {getProfessionalProviderTypeLabel(displayData.consultantProfessionalProviderTypeCode) || t('schedule:ScheduleDetailModal.t_293bb79c')}
                                          </span>
                                        }
                                        onClick={() => setPartyQuickView('consultant')}
                                        className="schedule-detail-modal__party-card--trigger"
                                        aria-haspopup="dialog"
                                        aria-expanded={partyQuickView === 'consultant'}
                                        aria-label={`상담사 요약 열기, ${toDisplayString(parsedConsultantName, '상담사')}`}
                                        renderActions={() => (
                                            <span className="schedule-detail-modal__party-card-hint">{t('schedule:ScheduleDetailModal.t_c72a6f07')}</span>
                                        )}
                                    />
                                ) : (
                                    <ProfileCard
                                        variant="compact"
                                        avatar={{ displayName: parsedConsultantName }}
                                        name={<SafeText fallback="상담사 정보 없음">{parsedConsultantName}</SafeText>}
                                        badges={
                                          <span className="schedule-detail-modal__party-role-label">
                                            {getProfessionalProviderTypeLabel(displayData.consultantProfessionalProviderTypeCode) || t('schedule:ScheduleDetailModal.t_293bb79c')}
                                          </span>
                                        }
                                        renderActions={canPartyQuickSummary ? () => (
                                            <span className="schedule-detail-modal__party-link--disabled">{t('schedule:ScheduleDetailModal.t_e870adbf')}</span>
                                        ) : undefined}
                                    />
                                )}
                            </div>
                    )}

                    <div className="section-content schedule-detail-modal__detail-rows">
                        <ClientSummaryField label={t('schedule:ScheduleDetailModal.t_bff20dc3')} className="schedule-detail-modal__detail-row">
                            <SafeText>{displayData.title}</SafeText>
                        </ClientSummaryField>
                        {isVacationEvent() && (
                            <ClientSummaryField label={t('schedule:ScheduleDetailModal.t_772af33f')} className="schedule-detail-modal__detail-row">
                                <SafeText fallback="사유 없음">{displayData.description ?? displayData.reason}</SafeText>
                            </ClientSummaryField>
                        )}
                    </div>
                </div>
                )}
            </UnifiedModal>

            {showCancelConfirm && renderCancelConfirm()}
            {showConfirmModal && renderConfirmModal()}

            {canPartyQuickSummary && partyQuickView ? (
                <SchedulePartyQuickViewModal
                    isOpen
                    onClose={() => handlePartyQuickViewClose()}
                    title={partyQuickView === 'client' ? '내담자 요약' : t('schedule:ScheduleDetailModal.t_49b67be5')}
                    zIndex={SCHEDULE_DETAIL_Z_INDEX_PARTY_QUICK}
                    rows={buildPartySummaryRows(partyQuickView)}
                    userManagementType={partyQuickView}
                    onOpenInUserManagement={handleOpenUserManagementFromParty}
                />
            ) : null}

            {/* 상담일지 작성 모달은 부모 컴포넌트에서 관리 */}
        </>
    );
};

export default ScheduleDetailModal;
export {
    resolveModalSessionInfo,
    shouldShowConsultationLogLink,
    toIsoDateString,
    CONSULTATION_LOG_LINK_VISIBLE_STATUSES
};
