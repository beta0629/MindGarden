import { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useSearchParams } from 'react-router-dom';
import UnifiedLoading from '../../components/common/UnifiedLoading';
import ScheduleModal from './ScheduleModal';
import ScheduleDetailModal from './ScheduleDetailModal';
import RescheduleScheduleModal from './RescheduleScheduleModal';
import ConsultationLogModal from '../consultant/ConsultationLogModal';
import VacationManagementModal from '../admin/VacationManagementModal';
import ConsultantVacationModal from '../consultant/ConsultantVacationModal';
import DateActionModal from './DateActionModal';
import ScheduleHeader from '../ui/Schedule/ScheduleHeader';
import ScheduleLegend from '../ui/Schedule/ScheduleLegend';
import ScheduleCalendarView from '../ui/Schedule/ScheduleCalendarView';
import { apiGet } from '../../utils/ajax';
import StandardizedApi from '../../utils/standardizedApi';
import {
  buildScheduleDatetimeUpdateBody,
  hasConsultantScheduleTimeOverlap,
  isPastDateOnly
} from '../../utils/scheduleRescheduleUtils';
import { getStatusColor, getStatusIcon } from '../../utils/codeHelper';
import { getCommonCodes } from '../../utils/commonCodeApi';
import notificationManager from '../../utils/notification';
import {
  CALENDAR_EXTENDED_TYPE_KR_PUBLIC_HOLIDAY,
  CALENDAR_EXTENDED_TYPE_VACATION,
  CLIENT_SCHEDULE_NOTES_CLIENT_WIDE_UNRESOLVED_COUNT_FIELD,
  CLIENT_SCHEDULE_NOTES_UNRESOLVED_COUNT_FIELD,
  SCHEDULE_MAPPING_ID_FIELD,
  SCHEDULE_REMAINING_SESSIONS_FIELD,
  SCHEDULE_SESSION_SEQUENCE_FIELD,
  SCHEDULE_TOTAL_SESSIONS_FIELD,
  parseClientScheduleNotesClientWideUnresolvedCount,
  parseClientScheduleNotesUnresolvedCount,
  parseScheduleSessionCount
} from '../../constants/schedule';
import { KR_PUBLIC_HOLIDAY_FULLCALENDAR_EVENTS } from '../../utils/krPublicHolidays';
import { decorateScheduleEventsForSameDayPending } from './utils/sameDayPendingEventDecorator';
import { USER_ROLES, LEGACY_USER_ROLES } from '../../constants/roles';
import '../admin/AdminDashboard/AdminDashboardB0KlA.css';
import './ScheduleB0KlA.css';
import { useTranslation } from 'react-i18next';

// T5 표준화 2026-05-21: API 경로 리터럴 → 로컬 상수 (운영 게이트 P0)
const API_SCHEDULES_ADMIN = '/api/v1/schedules/admin';


/** 캘린더 관리자 권한(통합 스케줄 STAFF 동기화): 로드·필터·날짜 액션·재예약 */
const isAdminLikeScheduleUserRole = (role) =>
  role === USER_ROLES.ADMIN || role === LEGACY_USER_ROLES.BRANCH_SUPER_ADMIN || role === USER_ROLES.STAFF;

/**
 * 스케줄 관리 컨테이너 컴포넌트
/**
 * - 비즈니스 로직만 담당
/**
 * - 상태 관리, 데이터 로드, 이벤트 핸들러
/**
 * - Presentational 컴포넌트에 데이터와 핸들러 전달
/**
 * 
/**
 * @author Core Solution
/**
 * @version 2.0.0 (Presentational/Container 분리)
/**
 * @since 2024-12-19
 */
/** refetchTrigger: 부모에서 변경 시 캘린더 데이터 재로드(통합 스케줄 화면 등) */
/** onDropFromExternal: (date, mappingPayload) => void — 외부 매칭 카드 드롭 시 호출(통합 스케줄 화면) */
/**
 * mappingPaymentTimingByMappingId: Map|object {mappingId → paymentTiming} —
 * 옵션 B SAME_DAY_CARD 매핑의 가예약 일정에 별도 시각(점선·prefix) 적용을 위한 룩업.
 * 통합 스케줄 화면 등 매핑 메타를 보유한 부모만 전달한다. 미전달 시 데코레이션 미적용.
 */
const UnifiedScheduleComponent = ({
  userRole,
  userId,
  refetchTrigger,
  onDropFromExternal,
  hideScheduleTitle = false,
  integratedMonthEventLayout = false,
  calendarSkin,
  /** 명시 시 우선. 미지정이면 `onDropFromExternal` 존재 여부로 통합 스케줄 잠금 추론 */
  disableCalendarEventDrag: disableCalendarEventDragProp,
  acceptExternalCalendarDrops: acceptExternalCalendarDropsProp,
  mappingPaymentTimingByMappingId
}) => {
    const { t } = useTranslation();
    const resolvedDisableCalendarEventDrag =
        disableCalendarEventDragProp !== undefined && disableCalendarEventDragProp !== null
            ? Boolean(disableCalendarEventDragProp)
            : typeof onDropFromExternal === 'function';
    const resolvedAcceptExternalCalendarDrops =
        acceptExternalCalendarDropsProp !== undefined && acceptExternalCalendarDropsProp !== null
            ? Boolean(acceptExternalCalendarDropsProp)
            : true;

    console.log('📅 UnifiedScheduleComponent 렌더링:', { userRole, userId });
    
    // ========== 상태 관리 ==========
    const [events, setEvents] = useState([]);
    const [selectedDate, setSelectedDate] = useState(null);
    const [selectedInfo, setSelectedInfo] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [isConsultationLogModalOpen, setIsConsultationLogModalOpen] = useState(false);
    const [isVacationModalOpen, setIsVacationModalOpen] = useState(false);
    const [isDateActionModalOpen, setIsDateActionModalOpen] = useState(false);
    const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
    const [reschedulePayload, setReschedulePayload] = useState(null);
    const [selectedSchedule, setSelectedSchedule] = useState(null);
    const [loading, setLoading] = useState(false);
    const [scheduleStatusOptions, setScheduleStatusOptions] = useState([]);
    const [loadingCodes, setLoadingCodes] = useState(false);
    
    // URL 쿼리 파라미 (스케줄 페이지 직행 시 초기 필터)
    const [searchParams] = useSearchParams();
    const consultantIdFromUrl = searchParams.get('consultantId');
    const clientIdFromUrl = searchParams.get('clientId');

    // 상담사 필터링 상태
    const [consultants, setConsultants] = useState([]);
    const [selectedConsultantId, setSelectedConsultantId] = useState(consultantIdFromUrl || '');
    const [clientIdFilter, setClientIdFilter] = useState(clientIdFromUrl || '');
    const [loadingConsultants, setLoadingConsultants] = useState(false);

    // ========== 유틸리티 함수 ==========
    const formatTime = (timeObj) => {
        if (!timeObj) return t('schedule:UnifiedScheduleComponent.t_f7548f70');
        try {
            return timeObj.toLocaleTimeString('ko-KR', { 
                hour: '2-digit', 
                minute: '2-digit' 
            });
        } catch (error) {
            console.warn('시간 변환 오류:', error);
            return t('schedule:UnifiedScheduleComponent.t_f7548f70');
        }
    };

    const convertStatusToKorean = (status) => {
        const statusOption = scheduleStatusOptions.find(option => option.value === status);
        return statusOption ? statusOption.label : status || t('schedule:UnifiedScheduleComponent.t_8916b639');
    };

    const convertConsultationTypeToKorean = (consultationType) => {
        const typeMap = {
            'INDIVIDUAL': t('schedule:UnifiedScheduleComponent.t_efda14c0'),
            'COUPLE': t('schedule:UnifiedScheduleComponent.t_62b69843'),
            'FAMILY': t('schedule:UnifiedScheduleComponent.t_aaa928a6'),
            'INITIAL': t('schedule:UnifiedScheduleComponent.t_d90982dc'),
            'GROUP': t('schedule:UnifiedScheduleComponent.t_607ecaca')
        };
        return typeMap[consultationType] || consultationType || t('schedule:UnifiedScheduleComponent.t_8916b639');
    };

    const getConsultantColor = (consultantId) => {
        const colors = [
            'var(--ad-b0kla-green)', 'var(--ad-b0kla-blue)', 'var(--ad-b0kla-orange)',
            'var(--ad-b0kla-green)', 'var(--ad-b0kla-blue)', 'var(--ad-b0kla-orange)',
            'var(--mg-primary-500)', 'var(--mg-info-500)', 'var(--mg-warning-500)', 'var(--mg-success-600)'
        ];
        const colorIndex = consultantId % colors.length;
        return colors[colorIndex];
    };

    const convertVacationToEvent = (vacationData, consultantId, date) => {
        const { type, reason, startTime, endTime, consultantName } = vacationData;
        const startDate = new Date(`${date}T00:00:00+09:00`);
        let endDate, title, backgroundColor, allDay = true;
        
        switch (type) {
            case 'MORNING':
                endDate = new Date(`${date}T13:00:00+09:00`);
                title = t('schedule:UnifiedScheduleComponent.t_4086e200');
                backgroundColor = 'var(--ad-b0kla-orange)';
                allDay = false;
                break;
            case 'AFTERNOON':
                startDate.setHours(14, 0, 0);
                endDate = new Date(`${date}T20:00:00+09:00`);
                title = t('schedule:UnifiedScheduleComponent.t_03a4088f');
                backgroundColor = 'var(--ad-b0kla-danger)';
                allDay = false;
                break;
            case 'MORNING_HALF_1':
                endDate = new Date(`${date}T11:00:00+09:00`);
                title = t('schedule:UnifiedScheduleComponent.t_27ce5a99');
                backgroundColor = 'var(--ad-b0kla-orange)';
                allDay = false;
                break;
            case 'MORNING_HALF_2':
                startDate.setHours(11, 0, 0);
                endDate = new Date(`${date}T13:00:00+09:00`);
                title = t('schedule:UnifiedScheduleComponent.t_0b305409');
                backgroundColor = 'var(--ad-b0kla-orange)';
                allDay = false;
                break;
            case 'AFTERNOON_HALF_1':
                startDate.setHours(14, 0, 0);
                endDate = new Date(`${date}T16:00:00+09:00`);
                title = t('schedule:UnifiedScheduleComponent.t_b66d49f8');
                backgroundColor = 'var(--ad-b0kla-danger)';
                allDay = false;
                break;
            case 'AFTERNOON_HALF_2':
                startDate.setHours(16, 0, 0);
                endDate = new Date(`${date}T20:00:00+09:00`);
                title = t('schedule:UnifiedScheduleComponent.t_1b553c84');
                backgroundColor = 'var(--ad-b0kla-danger)';
                allDay = false;
                break;
            case 'CUSTOM_TIME':
                if (startTime && endTime) {
                    startDate.setHours(parseInt(startTime.split(':')[0]), parseInt(startTime.split(':')[1]), 0);
                    endDate = new Date(`${date}T${endTime}+09:00`);
                    title = t('schedule:UnifiedScheduleComponent.t_4e2cc1a9');
                    backgroundColor = 'var(--ad-b0kla-blue)';
                    allDay = false;
                } else {
                    endDate = new Date(`${date}T23:59:59+09:00`);
                    title = t('schedule:UnifiedScheduleComponent.t_4e2cc1a9');
                    backgroundColor = 'var(--ad-b0kla-blue)';
                }
                break;
            case 'ALL_DAY':
            case 'FULL_DAY':
                endDate = new Date(`${date}T23:59:59+09:00`);
                title = t('schedule:UnifiedScheduleComponent.t_2017dfc0');
                backgroundColor = 'var(--ad-b0kla-danger)';
                allDay = true;
                break;
            default:
                if (startTime && endTime) {
                    startDate.setHours(parseInt(startTime.split(':')[0]), parseInt(startTime.split(':')[1]), 0);
                    endDate = new Date(`${date}T${endTime}+09:00`);
                    allDay = false;
                } else {
                    endDate = new Date(`${date}T23:59:59+09:00`);
                    allDay = true;
                }
                title = t('schedule:UnifiedScheduleComponent.t_ec6faefc');
                backgroundColor = 'var(--ad-b0kla-danger)';
                break;
        }
        
        return {
            id: `vacation-${consultantId}_${date}`,
            title: title,
            start: startDate.toISOString(),
            end: endDate.toISOString(),
            allDay: allDay,
            backgroundColor: backgroundColor,
            borderColor: backgroundColor,
            textColor: 'var(--mg-white)',
            className: 'vacation-event',
            extendedProps: {
                type: CALENDAR_EXTENDED_TYPE_VACATION,
                vacationType: type,
                reason: reason,
                date: date,
                startTime: startTime,
                endTime: endTime,
                consultantId: consultantId,
                consultantName: consultantName
            }
        };
    };

    // ========== 데이터 로드 ==========
    const loadScheduleStatusCodes = useCallback(async() => {
        try {
            setLoadingCodes(true);
            // 공통코드 API 사용 (표준화된 방법)
            const codes = await getCommonCodes('SCHEDULE_STATUS');
            console.log('📋 스케줄 상태 코드 응답:', codes);
            
            if (codes && Array.isArray(codes) && codes.length > 0) {
                const statusOptions = await Promise.all(codes.map(async(code) => {
                    try {
                        const [color, icon] = await Promise.all([
                            getStatusColor(code.codeValue, 'SCHEDULE_STATUS'),
                            getStatusIcon(code.codeValue, 'SCHEDULE_STATUS')
                        ]);
                        
                        return {
                            value: code.codeValue,
                            label: code.koreanName || code.codeLabel,
                            color: code.colorCode || color,
                            icon: code.icon || icon,
                            description: code.codeDescription
                        };
                    } catch (error) {
                        console.error(`스케줄 상태 ${code.codeValue} 처리 오류:`, error);
                        return {
                            value: code.codeValue,
                            label: code.koreanName || code.codeLabel,
                            color: code.colorCode || 'var(--mg-gray-500)',
                            icon: code.icon || '📋',
                            description: code.codeDescription
                        };
                    }
                }));
                
                console.log('📋 변환된 상태 옵션 (공통코드 기반):', statusOptions);
                setScheduleStatusOptions(statusOptions);
            } else {
                console.warn('📋 스케줄 상태 코드 데이터가 없습니다. 공통코드에서 조회하세요.');
                setScheduleStatusOptions([]); // 하드코딩된 fallback 제거
            }
        } catch (error) {
            console.error('일정 상태 코드 로드 실패:', error);
            // 하드코딩된 fallback 제거 - 공통코드에서만 조회
            setScheduleStatusOptions([]);
            notificationManager.error(t('schedule:UnifiedScheduleComponent.t_e72bdf24'));
        } finally {
            setLoadingCodes(false);
        }
    }, []);

    const loadConsultants = useCallback(async() => {
        try {
            setLoadingConsultants(true);
            const dateStr = new Date().toISOString().split('T')[0];
            console.log('👥 상담사 목록 로드 시작: date=', dateStr);
            
            const response = await apiGet(`/api/v1/admin/consultants/with-vacation?date=${dateStr}`);
            
            console.log('👥 상담사 목록 API 응답:', response);
            console.log('👥 응답 타입:', typeof response, Array.isArray(response));
            
            // apiGet은 이미 ApiResponse의 data를 추출하므로, response는 { consultants: [...], count: N } 형태
            let consultantsList = [];
            
            if (response) {
                if (response.consultants && Array.isArray(response.consultants)) {
                    consultantsList = response.consultants;
                    console.log('👥 response.consultants에서 추출:', consultantsList.length, '개');
                } else if (Array.isArray(response)) {
                    consultantsList = response;
                    console.log('👥 response (배열)에서 추출:', consultantsList.length, t('schedule:UnifiedScheduleComponent.t_11600c9a'));
                } else if (response.data && Array.isArray(response.data)) {
                    consultantsList = response.data;
                    console.log('👥 response.data (배열)에서 추출:', consultantsList.length, t('schedule:UnifiedScheduleComponent.t_11600c9a'));
                } else if (response.success && response.data) {
                    if (response.data.consultants && Array.isArray(response.data.consultants)) {
                        consultantsList = response.data.consultants;
                        console.log('👥 response.success.data.consultants에서 추출:', consultantsList.length, '개');
                    } else if (Array.isArray(response.data)) {
                        consultantsList = response.data;
                        console.log('👥 response.success.data (배열)에서 추출:', consultantsList.length, t('schedule:UnifiedScheduleComponent.t_11600c9a'));
                    }
                }
            }
            
            console.log('👥 최종 상담사 목록:', consultantsList);
            setConsultants(consultantsList);
        } catch (error) {
            console.error('❌ 상담사 목록 로드 실패:', error);
            setConsultants([]);
        } finally {
            setLoadingConsultants(false);
        }
    }, []);

    const loadSchedules = useCallback(async() => {
        // 관리자·스텝·지점수퍼관리자는 userId 없이도 전체 조회 가능
        const isAdmin = isAdminLikeScheduleUserRole(userRole);
        
        // 관리자가 아니면서 userId가 없으면 로드하지 않음
        if (!isAdmin && !userId) {
            console.warn('⚠️ userId가 없어 스케줄을 로드하지 않습니다');
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            console.log('📅 스케줄 로드 시작:', { userId, userRole, selectedConsultantId });
            
            let url = '';
            
            // 상담사는 자신의 스케줄만 조회
            if (userRole === USER_ROLES.CONSULTANT) {
                url = `/api/v1/schedules/consultant/${userId}`;
                console.log('🔍 상담사 자신의 스케줄만 조회:', userId);
            }
            // 관리자·스텝은 관리자 API 사용
            else if (isAdminLikeScheduleUserRole(userRole)) {
                url = API_SCHEDULES_ADMIN;
                if (selectedConsultantId && selectedConsultantId !== '') {
                    url += `?consultantId=${selectedConsultantId}`;
                    console.log('🔍 상담사 필터링 적용:', selectedConsultantId);
                    // TODO: API clientId 지원 시 url += `&clientId=${clientIdFilter}`;
                } else {
                    console.log('🔍 전체 상담사 조회');
                }
            }
            // 기타 사용자 (내담자 등)
            else {
                url = `/api/v1/schedules?userId=${userId}&userRole=${userRole}`;
                console.log('🔍 일반 사용자 스케줄 조회');
            }
            
            const timestamp = new Date().getTime();
            const separator = url.includes('?') ? '&' : '?';
            const response = await apiGet(`${url}${separator}_t=${timestamp}`);

            console.log('📅 API 응답:', response);
            console.log('📅 API 응답 타입:', typeof response, Array.isArray(response));
            console.log('📅 API 응답 키:', response ? Object.keys(response) : 'null');

            let scheduleEvents = [];
            
            const formatTimeStr = (timeData) => {
                if (!timeData) return '00:00:00';
                if (Array.isArray(timeData)) {
                    const h = String(timeData[0] || 0).padStart(2, '0');
                    const m = String(timeData[1] || 0).padStart(2, '0');
                    const s = String(timeData[2] || 0).padStart(2, '0');
                    return `${h}:${m}:${s}`;
                }
                return (String(timeData).includes('T') ? String(timeData).split('T')[1] : String(timeData)).split('.')[0];
            };
            
            // apiGet은 이미 ApiResponse의 data를 추출하므로, response는 data 부분만 받음
            // 응답 구조: { schedules: [...], count: N, ... } 또는 배열
            
            // 응답이 배열인 경우 (상담사 API 응답)
            if (Array.isArray(response)) {
                console.log('📅 배열 형태 응답 받음:', response);
                scheduleEvents = response.map(schedule => {
                    console.log('📅 스케줄 데이터 처리:', schedule);
                    
                    // 날짜/시간 형식 검증 및 변환
                    let startDateStr = '';
                    let endDateStr = '';
                    
                    if (schedule.date) {
                        // LocalDate는 "YYYY-MM-DD" 형식
                        const dateStr = schedule.date.includes('T') 
                            ? schedule.date.split('T')[0] 
                            : schedule.date;
                        
                        // LocalTime은 배열 또는 "HH:mm:ss" 형식
                        const startTimeStr = formatTimeStr(schedule.startTime);
                        const endTimeStr = formatTimeStr(schedule.endTime);
                        
                        startDateStr = `${dateStr}T${startTimeStr}`;
                        endDateStr = `${dateStr}T${endTimeStr}`;
                    } else {
                        console.error('❌ 스케줄에 날짜가 없습니다:', schedule);
                        return null;
                    }
                    
                    const isCompleted = schedule.status === 'COMPLETED' || schedule.status === t('schedule:UnifiedScheduleComponent.t_1f74613e');
                    return {
                        id: schedule.id,
                        title: schedule.title || t('schedule:UnifiedScheduleComponent.t_c023a4c5'),
                        start: startDateStr,
                        end: endDateStr,
                        backgroundColor: getConsultantColor(schedule.consultantId),
                        borderColor: getConsultantColor(schedule.consultantId),
                        className: `schedule-event status-${schedule.status?.toLowerCase()}`,
                        editable: !isCompleted,
                        extendedProps: {
                            id: schedule.id,
                            [SCHEDULE_MAPPING_ID_FIELD]: schedule[SCHEDULE_MAPPING_ID_FIELD]
                                || schedule.mappingId
                                || schedule.scheduleMappingId
                                || schedule.mapping_id
                                || schedule.schedule_mapping_id
                                || undefined,
                            [SCHEDULE_TOTAL_SESSIONS_FIELD]: parseScheduleSessionCount(
                                schedule[SCHEDULE_TOTAL_SESSIONS_FIELD] ?? schedule.total_sessions
                            ),
                            [SCHEDULE_REMAINING_SESSIONS_FIELD]: parseScheduleSessionCount(
                                schedule[SCHEDULE_REMAINING_SESSIONS_FIELD] ?? schedule.remaining_sessions
                            ),
                            [SCHEDULE_SESSION_SEQUENCE_FIELD]: parseScheduleSessionCount(
                                schedule[SCHEDULE_SESSION_SEQUENCE_FIELD] ?? schedule.session_sequence
                            ),
                            pastSessionCount: parseScheduleSessionCount(
                                schedule.pastSessionCount ?? schedule.past_session_count
                            ),
                            combinedUsedSessions: parseScheduleSessionCount(
                                schedule.combinedUsedSessions ?? schedule.combined_used_sessions
                            ),
                            combinedTotalSessions: parseScheduleSessionCount(
                                schedule.combinedTotalSessions ?? schedule.combined_total_sessions
                            ),
                            consultantId: schedule.consultantId,
                            consultantName: schedule.consultantName,
                            consultantPhone: schedule.consultantPhone,
                            consultantEmail: schedule.consultantEmail,
                            clientId: schedule.clientId,
                            clientName: schedule.clientName,
                            clientPhone: schedule.clientPhone,
                            clientMobile: schedule.clientMobile || schedule.clientPhone,
                            clientEmail: schedule.clientEmail,
                            status: schedule.status,
                            statusKorean: convertStatusToKorean(schedule.status),
                            type: schedule.scheduleType,
                            consultationType: schedule.consultationType,
                            description: schedule.description,
                            [CLIENT_SCHEDULE_NOTES_UNRESOLVED_COUNT_FIELD]: parseClientScheduleNotesUnresolvedCount(
                                schedule[CLIENT_SCHEDULE_NOTES_UNRESOLVED_COUNT_FIELD]
                            ),
                            [CLIENT_SCHEDULE_NOTES_CLIENT_WIDE_UNRESOLVED_COUNT_FIELD]:
                                parseClientScheduleNotesClientWideUnresolvedCount(
                                    schedule[CLIENT_SCHEDULE_NOTES_CLIENT_WIDE_UNRESOLVED_COUNT_FIELD]
                                )
                        }
                    };
                }).filter(event => event !== null); // null 제거
                
                console.log('📅 변환된 이벤트:', scheduleEvents);
                console.log('📅 이벤트 개수:', scheduleEvents.length);
            }
            // 응답이 객체인 경우 (apiGet이 이미 data를 추출했으므로, response는 data 부분)
            else if (response && typeof response === 'object' && !Array.isArray(response)) {
                console.log('📅 객체 형태 응답 받음:', response);
                
                // apiGet이 이미 ApiResponse의 data를 추출했으므로, response는 { schedules: [...], count: N } 형태
                let schedules = [];
                
                // response.schedules가 있는 경우 (관리자 API 응답)
                if (response.schedules && Array.isArray(response.schedules)) {
                    schedules = response.schedules;
                    console.log('📅 response.schedules에서 추출:', schedules.length, '개');
                } 
                // response.data.schedules가 있는 경우 (이중 래핑된 경우)
                else if (response.data && response.data.schedules && Array.isArray(response.data.schedules)) {
                    schedules = response.data.schedules;
                    console.log('📅 response.data.schedules에서 추출:', schedules.length, '개');
                }
                // response.data가 배열인 경우
                else if (response.data && Array.isArray(response.data)) {
                    schedules = response.data;
                    console.log('📅 response.data (배열)에서 추출:', schedules.length, t('schedule:UnifiedScheduleComponent.t_11600c9a'));
                }
                // response.success가 있고 response.data가 있는 경우 (원본 ApiResponse 구조)
                else if (response.success && response.data) {
                    if (response.data.schedules && Array.isArray(response.data.schedules)) {
                        schedules = response.data.schedules;
                        console.log('📅 response.success.data.schedules에서 추출:', schedules.length, '개');
                    } else if (Array.isArray(response.data)) {
                        schedules = response.data;
                        console.log('📅 response.success.data (배열)에서 추출:', schedules.length, t('schedule:UnifiedScheduleComponent.t_11600c9a'));
                    }
                } else {
                    console.warn('⚠️ 응답 형식을 파악할 수 없습니다:', response);
                }
                
                console.log('📅 최종 추출된 스케줄 데이터:', schedules);
                console.log('📅 스케줄 개수:', schedules.length);
                
                if (Array.isArray(schedules) && schedules.length > 0) {
                    scheduleEvents = schedules.map(schedule => {
                        console.log('📅 스케줄 데이터 처리:', schedule);
                        
                        // 날짜/시간 형식 검증 및 변환
                        let startDateStr = '';
                        let endDateStr = '';
                        
                        if (schedule.date) {
                            // LocalDate는 "YYYY-MM-DD" 형식
                            const dateStr = schedule.date.includes('T') 
                                ? schedule.date.split('T')[0] 
                                : schedule.date;
                            
                            // LocalTime은 배열 또는 "HH:mm:ss" 형식
                            const startTimeStr = formatTimeStr(schedule.startTime);
                            const endTimeStr = formatTimeStr(schedule.endTime);
                            
                            startDateStr = `${dateStr}T${startTimeStr}`;
                            endDateStr = `${dateStr}T${endTimeStr}`;
                            
                            console.log('📅 날짜 변환:', { 
                                originalDate: schedule.date, 
                                originalStartTime: schedule.startTime,
                                originalEndTime: schedule.endTime,
                                startDateStr, 
                                endDateStr 
                            });
                        } else {
                            console.error('❌ 스케줄에 날짜가 없습니다:', schedule);
                            return null;
                        }
                        
                        const isCompleted = schedule.status === 'COMPLETED' || schedule.status === t('schedule:UnifiedScheduleComponent.t_1f74613e');
                        return {
                            id: schedule.id,
                            title: schedule.title || t('schedule:UnifiedScheduleComponent.t_c023a4c5'),
                            start: startDateStr,
                            end: endDateStr,
                            backgroundColor: getConsultantColor(schedule.consultantId),
                            borderColor: getConsultantColor(schedule.consultantId),
                            className: `schedule-event status-${schedule.status?.toLowerCase()}`,
                            editable: !isCompleted,
                            extendedProps: {
                                id: schedule.id,
                                [SCHEDULE_MAPPING_ID_FIELD]: schedule[SCHEDULE_MAPPING_ID_FIELD]
                                    || schedule.mappingId
                                    || schedule.scheduleMappingId
                                    || schedule.mapping_id
                                    || schedule.schedule_mapping_id
                                    || undefined,
                                [SCHEDULE_TOTAL_SESSIONS_FIELD]: parseScheduleSessionCount(
                                    schedule[SCHEDULE_TOTAL_SESSIONS_FIELD] ?? schedule.total_sessions
                                ),
                                [SCHEDULE_REMAINING_SESSIONS_FIELD]: parseScheduleSessionCount(
                                    schedule[SCHEDULE_REMAINING_SESSIONS_FIELD] ?? schedule.remaining_sessions
                                ),
                                [SCHEDULE_SESSION_SEQUENCE_FIELD]: parseScheduleSessionCount(
                                    schedule[SCHEDULE_SESSION_SEQUENCE_FIELD] ?? schedule.session_sequence
                                ),
                                pastSessionCount: parseScheduleSessionCount(
                                    schedule.pastSessionCount ?? schedule.past_session_count
                                ),
                                combinedUsedSessions: parseScheduleSessionCount(
                                    schedule.combinedUsedSessions ?? schedule.combined_used_sessions
                                ),
                                combinedTotalSessions: parseScheduleSessionCount(
                                    schedule.combinedTotalSessions ?? schedule.combined_total_sessions
                                ),
                                consultantId: schedule.consultantId,
                                consultantName: schedule.consultantName,
                                consultantProfessionalProviderTypeCode: schedule.consultantProfessionalProviderTypeCode,
                                consultantPhone: schedule.consultantPhone,
                                consultantEmail: schedule.consultantEmail,
                                clientId: schedule.clientId,
                                clientName: schedule.clientName,
                                clientPhone: schedule.clientPhone,
                                clientMobile: schedule.clientMobile || schedule.clientPhone,
                                clientEmail: schedule.clientEmail,
                                status: schedule.status,
                                statusKorean: convertStatusToKorean(schedule.status),
                                type: schedule.scheduleType,
                                consultationType: schedule.consultationType,
                                description: schedule.description,
                                [CLIENT_SCHEDULE_NOTES_UNRESOLVED_COUNT_FIELD]: parseClientScheduleNotesUnresolvedCount(
                                    schedule[CLIENT_SCHEDULE_NOTES_UNRESOLVED_COUNT_FIELD]
                                ),
                                [CLIENT_SCHEDULE_NOTES_CLIENT_WIDE_UNRESOLVED_COUNT_FIELD]:
                                    parseClientScheduleNotesClientWideUnresolvedCount(
                                        schedule[CLIENT_SCHEDULE_NOTES_CLIENT_WIDE_UNRESOLVED_COUNT_FIELD]
                                    )
                            }
                        };
                    }).filter(event => event !== null); // null 제거
                    
                    console.log('📅 변환된 이벤트:', scheduleEvents);
                    console.log('📅 이벤트 개수:', scheduleEvents.length);
                } else {
                    console.warn('📅 스케줄 데이터가 배열이 아니거나 비어있습니다:', schedules);
                }
            } else {
                console.warn('📅 API 응답 실패 또는 빈 응답:', response);
            }

            // 표준화 2025-12-08: 휴가 이벤트는 상담사 목록에 이미 포함되어 있으므로 별도 로드 불필요
            // 성능 개선: 불필요한 API 호출 제거
            const vacationEvents = [];

            const allEvents = [
                ...scheduleEvents,
                ...vacationEvents,
                ...KR_PUBLIC_HOLIDAY_FULLCALENDAR_EVENTS
            ];
            setEvents(allEvents);
            console.log('📅 모든 이벤트 데이터 로드 완료:', allEvents);
        } catch (error) {
            console.error('스케줄 로드 실패:', error);
        } finally {
            setLoading(false);
        }
    }, [userId, userRole, selectedConsultantId, clientIdFilter]);

    // URL 쿼리 변경 시 selectedConsultantId, clientIdFilter 동기화
    useEffect(() => {
        const consultantId = searchParams.get('consultantId');
        const clientId = searchParams.get('clientId');
        if (consultantId) {
            setSelectedConsultantId(consultantId);
        }
        if (clientId) {
            setClientIdFilter(clientId);
        }
    }, [searchParams]);

    // 부모에서 refetchTrigger 변경 시 스케줄만 재로드 (통합 스케줄 화면에서 저장 후 캘린더 갱신)
    useEffect(() => {
        if (refetchTrigger != null && refetchTrigger > 0 && (isAdminLikeScheduleUserRole(userRole) || userId)) {
            loadSchedules();
        }
    }, [refetchTrigger, userRole, userId, loadSchedules]);

    useEffect(() => {
        console.log('🔍 UnifiedScheduleComponent useEffect 실행:', { userId, userRole, selectedConsultantId });

        // 표준화 2025-12-08: 성능 개선 - 병렬 로딩 적용
        const loadData = async() => {
            const promises = [];
            const isAdmin = isAdminLikeScheduleUserRole(userRole);

            // 스케줄 로드 (필수)
            // 관리자·스텝은 userId 없이도 로드 가능
            if (isAdmin || userId) {
                promises.push(loadSchedules());
            }

            // 공통코드 로드 (필수)
            promises.push(loadScheduleStatusCodes());

            // 상담사 목록 로드 (관리자만, 선택적)
            if (isAdmin) {
                promises.push(loadConsultants());
            }

            // 모든 데이터를 병렬로 로드
            await Promise.all(promises);
        };

        loadData();
    }, [userId, userRole, selectedConsultantId]);

    // ========== 이벤트 핸들러 ==========
    const handleDateClick = (info) => {
        console.log('📅 날짜 클릭:', info.dateStr);
        
        const clickedDate = new Date(info.date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        clickedDate.setHours(0, 0, 0, 0);
        
        const isPastDate = clickedDate < today;
        
        // 상담사는 휴가만 등록 가능
        if (userRole === USER_ROLES.CONSULTANT) {
            if (isPastDate) {
                notificationManager.warning(t('schedule:UnifiedScheduleComponent.t_4f49954f'));
                return;
            }
            
            // 상담사는 바로 휴가 등록 모달 열기
            setSelectedDate(info.date);
            setSelectedInfo(info);
            setIsVacationModalOpen(true);
            return;
        }
        
        // 관리자·스텝은 스케줄/휴가 선택 모달 표시
        if (isAdminLikeScheduleUserRole(userRole)) {
            if (isPastDate) {
                notificationManager.warning(t('schedule:UnifiedScheduleComponent.t_6a4cece6'));
                return;
            }
            
            setSelectedDate(info.date);
            setSelectedInfo(info);
            setIsDateActionModalOpen(true);
            return;
        }

        // 내담자: 캘린더 조회 전용 — 스케줄 생성 권한 없음
        if (userRole === USER_ROLES.CLIENT) {
            notificationManager.info(t('schedule:UnifiedScheduleComponent.t_3d31a46b'));
            return;
        }

        notificationManager.warning(t('schedule:UnifiedScheduleComponent.t_92aa6c16'));
    };

    const handleScheduleClick = () => {
        console.log('📅 스케줄 등록 클릭');
        setIsDateActionModalOpen(false);
        setTimeout(() => {
            setIsModalOpen(true);
        }, 100);
    };

    const handleVacationClick = () => {
        console.log('📅 휴가 등록 클릭');
        setIsDateActionModalOpen(false);
        setTimeout(() => {
            setIsVacationModalOpen(true);
        }, 100);
    };

    const handleEventClick = (info) => {
        console.log('📋 이벤트 클릭:', info.event.title);
        
        const { event } = info;

        if (event.extendedProps?.type === CALENDAR_EXTENDED_TYPE_KR_PUBLIC_HOLIDAY) {
            return;
        }
        
        if (event.extendedProps.type === CALENDAR_EXTENDED_TYPE_VACATION) {
            console.log('🏖️ 휴가 이벤트 클릭');
            
            let { consultantName } = event.extendedProps;
            if (!consultantName || consultantName === 'undefined' || consultantName === t('schedule:UnifiedScheduleComponent.t_8916b639')) {
                if (event.extendedProps.consultantId && event.extendedProps.consultantId !== 'undefined') {
                    consultantName = t('schedule:UnifiedScheduleComponent.t_b09a1acc');
                } else {
                    consultantName = t('schedule:UnifiedScheduleComponent.t_44b8c965');
                }
            }
            
            // 공통코드에서 VACATION 상태값 조회
            const vacationStatus = scheduleStatusOptions.find(opt => 
                opt.value === 'VACATION' || opt.label?.includes(t('schedule:UnifiedScheduleComponent.t_4cdf9ae5'))
            )?.value || 'VACATION'; // fallback (공통코드 미로드 시)
            
            const consultantIdVal = event.extendedProps.consultantId;
            const scheduleData = {
                id: event.id,
                scheduleId: null,
                consultantId: consultantIdVal != null && consultantIdVal !== '' ? consultantIdVal : undefined,
                calendarEventType: CALENDAR_EXTENDED_TYPE_VACATION,
                title: event.title,
                consultantName: consultantName,
                clientName: t('schedule:UnifiedScheduleComponent.t_4cdf9ae5'),
                consultationType: 'VACATION',
                startTime: event.allDay ? '하루 종일' : formatTime(event.start),
                endTime: event.allDay ? '하루 종일' : formatTime(event.end),
                status: vacationStatus,
                description: event.extendedProps.reason || event.extendedProps.description || t('schedule:UnifiedScheduleComponent.t_4cdf9ae5'),
                reason: event.extendedProps.reason || event.extendedProps.description || t('schedule:UnifiedScheduleComponent.t_4cdf9ae5'),
                vacationType: event.extendedProps.vacationType,
                date: event.extendedProps.date
            };

            setSelectedSchedule(scheduleData);
            setIsDetailModalOpen(true);
            return;
        }
        
        const koreanStatus = event.extendedProps.statusKorean || convertStatusToKorean(event.extendedProps.status);
        const koreanConsultationType = convertConsultationTypeToKorean(event.extendedProps.consultationType);
        
        const consultantName = event.extendedProps.consultantName || t('schedule:UnifiedScheduleComponent.t_44b8c965');
        const clientName = event.extendedProps.clientName || t('schedule:UnifiedScheduleComponent.t_032787e1');

        const startDate = event.start;
        const endDate = event.end;
        const sessionDateStr = (() => {
            if (!startDate) return '';
            if (startDate instanceof Date) {
                const y = startDate.getFullYear();
                const m = String(startDate.getMonth() + 1).padStart(2, '0');
                const d = String(startDate.getDate()).padStart(2, '0');
                return `${y}-${m}-${d}`;
            }
            if (typeof startDate === 'string' && startDate.includes('T')) {
                return startDate.split('T')[0];
            }
            return '';
        })();

        const startAsDate = startDate instanceof Date ? startDate : new Date(startDate);
        const endAsDate = endDate instanceof Date ? endDate : new Date(endDate);
        const apiStartHm = Number.isNaN(startAsDate.getTime())
            ? '09:00'
            : startAsDate.toTimeString().split(' ')[0].slice(0, 5);
        const apiEndHm = Number.isNaN(endAsDate.getTime())
            ? '10:00'
            : endAsDate.toTimeString().split(' ')[0].slice(0, 5);

        const scheduleData = {
            id: event.extendedProps.id,
            scheduleId: event.extendedProps.id,
            mappingId: event.extendedProps.mappingId ?? undefined,
            title: event.title,
            consultantName: consultantName,
            clientName: clientName,
            consultantPhone: event.extendedProps.consultantPhone,
            consultantEmail: event.extendedProps.consultantEmail,
            clientPhone: event.extendedProps.clientPhone,
            clientMobile: event.extendedProps.clientMobile,
            clientEmail: event.extendedProps.clientEmail,
            consultationType: koreanConsultationType,
            consultationTypeCode: event.extendedProps.consultationType,
            startTime: formatTime(event.start),
            endTime: formatTime(event.end),
            status: koreanStatus,
            statusCode: event.extendedProps.status,
            clientId: event.extendedProps.clientId ?? undefined,
            consultantId: event.extendedProps.consultantId ?? undefined,
            sessionDate: sessionDateStr || undefined,
            date: sessionDateStr || undefined,
            apiDate: sessionDateStr || undefined,
            apiStartTime: apiStartHm,
            apiEndTime: apiEndHm,
            [SCHEDULE_TOTAL_SESSIONS_FIELD]: parseScheduleSessionCount(
                event.extendedProps[SCHEDULE_TOTAL_SESSIONS_FIELD]
            ),
            [SCHEDULE_REMAINING_SESSIONS_FIELD]: parseScheduleSessionCount(
                event.extendedProps[SCHEDULE_REMAINING_SESSIONS_FIELD]
            ),
            [SCHEDULE_SESSION_SEQUENCE_FIELD]: parseScheduleSessionCount(
                event.extendedProps[SCHEDULE_SESSION_SEQUENCE_FIELD]
            ),
            pastSessionCount: parseScheduleSessionCount(event.extendedProps.pastSessionCount),
            combinedUsedSessions: parseScheduleSessionCount(event.extendedProps.combinedUsedSessions),
            combinedTotalSessions: parseScheduleSessionCount(event.extendedProps.combinedTotalSessions),
            [CLIENT_SCHEDULE_NOTES_UNRESOLVED_COUNT_FIELD]: event.extendedProps[CLIENT_SCHEDULE_NOTES_UNRESOLVED_COUNT_FIELD],
            [CLIENT_SCHEDULE_NOTES_CLIENT_WIDE_UNRESOLVED_COUNT_FIELD]: event.extendedProps[CLIENT_SCHEDULE_NOTES_CLIENT_WIDE_UNRESOLVED_COUNT_FIELD]
        };

        setSelectedSchedule(scheduleData);
        setIsDetailModalOpen(true);
    };

    const handleEventDrop = async(info) => {
        console.log('🔄 이벤트 이동:', info.event.title);
        
        const { event } = info;

        if (event.extendedProps?.type === CALENDAR_EXTENDED_TYPE_KR_PUBLIC_HOLIDAY) {
            info.revert();
            return;
        }

        const status = event.extendedProps?.status;

        // 완료된 스케줄은 드래그 이동 불가
        if (status === 'COMPLETED' || status === t('schedule:UnifiedScheduleComponent.t_1f74613e')) {
            info.revert();
            notificationManager.warning(t('schedule:UnifiedScheduleComponent.t_5c8ac544'));
            return;
        }

        const newStart = event.start;
        const newEnd = event.end;

        if (isPastDateOnly(newStart)) {
            info.revert();
            notificationManager.warning(t('schedule:UnifiedScheduleComponent.t_07d3fa9e'));
            return;
        }

        const movedConsultantId = event.extendedProps?.consultantId;
        if (
            hasConsultantScheduleTimeOverlap(events, event.id, movedConsultantId, newStart, newEnd)
        ) {
            info.revert();
            notificationManager.warning(t('schedule:UnifiedScheduleComponent.t_b308792e'));
            return;
        }

        try {
            const body = buildScheduleDatetimeUpdateBody(newStart, newEnd);
            await StandardizedApi.put(`/api/v1/schedules/${event.id}`, body);

            console.log('✅ 스케줄 이동 완료');
            notificationManager.success(t('schedule:UnifiedScheduleComponent.t_8c3f9ec7'));
            await loadSchedules(); // 스케줄 다시 로드
        } catch (error) {
            console.error('스케줄 이동 오류:', error);
            info.revert();
            notificationManager.error(t('schedule:UnifiedScheduleComponent.t_68ed75e7'));
        }
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
        setSelectedDate(null);
        setSelectedInfo(null);
    };

    const handleScheduleCreated = async() => {
        console.log('🔄 스케줄 생성 완료 - 캘린더 새로고침 시작');
        await loadSchedules();
        handleModalClose();
        console.log('✅ 캘린더 새로고침 완료');
    };

    const handleDetailModalClose = () => {
        setIsDetailModalOpen(false);
        setSelectedSchedule(null);
    };

    const handleScheduleUpdated = (action, payload) => {
        if (action === 'edit' && payload && payload.id) {
            setReschedulePayload(payload);
            setIsRescheduleModalOpen(true);
            return;
        }
        loadSchedules();
    };

    const handleRescheduleModalClose = () => {
        setIsRescheduleModalOpen(false);
        setReschedulePayload(null);
    };

    const handleRescheduleSuccess = async() => {
        await loadSchedules();
    };

    // 상담일지 모달 핸들러
    const handleConsultationLogModalOpen = (scheduleData) => {
        setSelectedSchedule(scheduleData);
        setIsConsultationLogModalOpen(true);
    };

    const handleConsultationLogModalClose = () => {
        setIsConsultationLogModalOpen(false);
        setSelectedSchedule(null);
    };

    const handleConsultationLogSaved = () => {
        loadSchedules();
        handleConsultationLogModalClose();
    };

    const forceRefresh = useCallback(async() => {
        console.log('🔄 강제 새로고침 시작');
        setEvents([]);
        await loadSchedules();
        console.log('✅ 강제 새로고침 완료');
    }, [loadSchedules]);

    const handleConsultantChange = (e) => {
        try {
            console.log('👤 상담사 선택 변경:', e.target.value);
            setSelectedConsultantId(e.target.value);
        } catch (error) {
            console.error('❌ 상담사 선택 오류:', error);
        }
    };

    // ========== 렌더링 (Presentational 컴포넌트 사용) ==========
    return (
        <div className="mg-v2-schedule-calendar mg-v2-ad-b0kla">
            <ScheduleHeader
                userRole={userRole}
                consultants={consultants}
                selectedConsultantId={selectedConsultantId}
                loadingConsultants={loadingConsultants}
                onConsultantChange={handleConsultantChange}
                onRefresh={forceRefresh}
                hideTitle={hideScheduleTitle}
            />

            <ScheduleLegend
                consultants={consultants}
                events={events}
                scheduleStatusOptions={scheduleStatusOptions}
                getConsultantColor={getConsultantColor}
                calendarSkin={calendarSkin}
            />

            {loading && (
                <UnifiedLoading type="inline" text="스케줄을 불러오는 중..." />
            )}

            <ScheduleCalendarView
                events={decorateScheduleEventsForSameDayPending(events, mappingPaymentTimingByMappingId)}
                userRole={userRole}
                onDateClick={handleDateClick}
                onEventClick={handleEventClick}
                onEventDrop={handleEventDrop}
                onExternalEventReceive={onDropFromExternal}
                integratedMonthEventLayout={integratedMonthEventLayout}
                calendarSkin={calendarSkin}
                disableCalendarEventDrag={resolvedDisableCalendarEventDrag}
                acceptExternalCalendarDrops={resolvedAcceptExternalCalendarDrops}
            />

            {/* 모달들 */}
            {isModalOpen && (
                <ScheduleModal
                    isOpen={isModalOpen}
                    onClose={handleModalClose}
                    selectedDate={selectedDate}
                    selectedInfo={selectedInfo}
                    userRole={userRole}
                    userId={userId}
                    onScheduleCreated={handleScheduleCreated}
                />
            )}

            {isDetailModalOpen && (
                <ScheduleDetailModal
                    isOpen={isDetailModalOpen}
                    onClose={handleDetailModalClose}
                    scheduleData={selectedSchedule}
                    onScheduleUpdated={handleScheduleUpdated}
                    onConsultationLogOpen={handleConsultationLogModalOpen}
                />
            )}

            {isDateActionModalOpen && (
                <DateActionModal
                    isOpen={isDateActionModalOpen}
                    onClose={() => setIsDateActionModalOpen(false)}
                    selectedDate={selectedDate}
                    userRole={userRole}
                    onScheduleClick={handleScheduleClick}
                    onVacationClick={handleVacationClick}
                />
            )}

            {isVacationModalOpen && userRole === USER_ROLES.CONSULTANT && (
                <ConsultantVacationModal
                    isOpen={isVacationModalOpen}
                    onClose={() => setIsVacationModalOpen(false)}
                    selectedDate={selectedDate}
                    consultantId={userId}
                    onVacationUpdated={() => {
                        console.log('휴가 정보가 업데이트되었습니다.');
                        loadSchedules();
                    }}
                />
            )}

            {isVacationModalOpen && userRole !== USER_ROLES.CONSULTANT && (
                <VacationManagementModal
                    isOpen={isVacationModalOpen}
                    onClose={() => setIsVacationModalOpen(false)}
                    selectedConsultant={null}
                    userRole={userRole}
                    selectedDate={selectedDate}
                    onVacationUpdated={() => {
                        console.log('휴가 정보가 업데이트되었습니다.');
                        loadSchedules();
                    }}
                />
            )}

            {/* 상담일지 작성 모달 */}
            {isConsultationLogModalOpen && (
                <ConsultationLogModal
                    isOpen={isConsultationLogModalOpen}
                    onClose={handleConsultationLogModalClose}
                    scheduleData={selectedSchedule}
                    onSave={handleConsultationLogSaved}
                />
            )}

            {isAdminLikeScheduleUserRole(userRole) && (
                <RescheduleScheduleModal
                    isOpen={isRescheduleModalOpen}
                    onClose={handleRescheduleModalClose}
                    schedulePayload={reschedulePayload}
                    events={events}
                    onSuccess={handleRescheduleSuccess}
                />
            )}
        </div>
    );
};

UnifiedScheduleComponent.propTypes = {
  userRole: PropTypes.string.isRequired,
  userId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  refetchTrigger: PropTypes.number,
  onDropFromExternal: PropTypes.func,
  hideScheduleTitle: PropTypes.bool,
  integratedMonthEventLayout: PropTypes.bool,
  calendarSkin: PropTypes.oneOf(['integrated']),
  disableCalendarEventDrag: PropTypes.bool,
  acceptExternalCalendarDrops: PropTypes.bool,
  /** 옵션 B 가예약 시각 구분용 — Map 또는 일반 객체. mappingId(문자열/숫자) → paymentTiming */
  mappingPaymentTimingByMappingId: PropTypes.oneOfType([
    PropTypes.instanceOf(Map),
    PropTypes.object
  ])
};

export default UnifiedScheduleComponent;
