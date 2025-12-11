import { useState, useEffect, useCallback } from 'react';
import UnifiedLoading from '../../components/common/UnifiedLoading';
import ScheduleModal from './ScheduleModal';
import ScheduleDetailModal from './ScheduleDetailModal';
import ConsultationLogModal from '../consultant/ConsultationLogModal';
import VacationManagementModal from '../admin/VacationManagementModal';
import ConsultantVacationModal from '../consultant/ConsultantVacationModal';
import DateActionModal from './DateActionModal';
import ScheduleHeader from '../ui/Schedule/ScheduleHeader';
import ScheduleLegend from '../ui/Schedule/ScheduleLegend';
import ScheduleCalendarView from '../ui/Schedule/ScheduleCalendarView';
import { apiGet, apiPut } from '../../utils/ajax';
import { getStatusColor, getStatusIcon } from '../../utils/codeHelper';
import { getCommonCodes } from '../../utils/commonCodeApi';
import notificationManager from '../../utils/notification';
// import './ScheduleCalendar.css'; // 제거: mindgarden-design-system.css 사용

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
 * @author MindGarden
/**
 * @version 2.0.0 (Presentational/Container 분리)
/**
 * @since 2024-12-19
 */
const UnifiedScheduleComponent = ({ userRole, userId }) => {
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
    const [selectedSchedule, setSelectedSchedule] = useState(null);
    const [loading, setLoading] = useState(false);
    const [scheduleStatusOptions, setScheduleStatusOptions] = useState([]);
    const [loadingCodes, setLoadingCodes] = useState(false);
    
    // 상담사 필터링 상태
    const [consultants, setConsultants] = useState([]);
    const [selectedConsultantId, setSelectedConsultantId] = useState('');
    const [loadingConsultants, setLoadingConsultants] = useState(false);

    // ========== 유틸리티 함수 ==========
    const formatTime = (timeObj) => {
        if (!timeObj) return '시간 미정';
        try {
            return timeObj.toLocaleTimeString('ko-KR', { 
                hour: '2-digit', 
                minute: '2-digit' 
            });
        } catch (error) {
            console.warn('시간 변환 오류:', error);
            return '시간 미정';
        }
    };

    const convertStatusToKorean = (status) => {
        const statusOption = scheduleStatusOptions.find(option => option.value === status);
        return statusOption ? statusOption.label : status || "알 수 없음";
    };

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

    const getConsultantColor = (consultantId) => {
        const colors = [
            'var(--mg-primary-500)', 'var(--mg-success-500)', 'var(--mg-warning-500)', 'var(--mg-error-500)', 'var(--mg-purple-500)',
            'var(--mg-info-500)', 'var(--mg-success-500)', 'var(--mg-warning-500)', 'var(--mg-pink-500)', 'var(--mg-primary-600)'
        ];
        const colorIndex = consultantId % colors.length;
        return colors[colorIndex];
    };

    const convertVacationToEvent = (vacationData, consultantId, date) => {
        const { type, reason, startTime, endTime, consultantName } = vacationData;
        const startDate = new Date(date + 'T00:00:00+09:00');
        let endDate, title, backgroundColor, allDay = true;
        
        switch (type) {
            case 'MORNING':
                endDate = new Date(date + 'T13:00:00+09:00');
                title = '🌅 오전 휴무';
                backgroundColor = 'var(--mg-warning-500)';
                allDay = false;
                break;
            case 'AFTERNOON':
                startDate.setHours(14, 0, 0);
                endDate = new Date(date + 'T18:00:00+09:00');
                title = '🌇 오후 휴무';
                backgroundColor = 'var(--mg-error-700)';
                allDay = false;
                break;
            case 'MORNING_HALF_1':
                endDate = new Date(date + 'T11:00:00+09:00');
                title = '🌄 오전 반반차 1';
                backgroundColor = 'var(--mg-warning-500)';
                allDay = false;
                break;
            case 'MORNING_HALF_2':
                startDate.setHours(11, 0, 0);
                endDate = new Date(date + 'T13:00:00+09:00');
                title = '🌄 오전 반반차 2';
                backgroundColor = 'var(--mg-warning-500)';
                allDay = false;
                break;
            case 'AFTERNOON_HALF_1':
                startDate.setHours(14, 0, 0);
                endDate = new Date(date + 'T16:00:00+09:00');
                title = '🌆 오후 반반차 1';
                backgroundColor = 'var(--mg-error-600)';
                allDay = false;
                break;
            case 'AFTERNOON_HALF_2':
                startDate.setHours(16, 0, 0);
                endDate = new Date(date + 'T18:00:00+09:00');
                title = '🌆 오후 반반차 2';
                backgroundColor = 'var(--mg-error-600)';
                allDay = false;
                break;
            case 'CUSTOM_TIME':
                if (startTime && endTime) {
                    startDate.setHours(parseInt(startTime.split(':')[0]), parseInt(startTime.split(':')[1]), 0);
                    endDate = new Date(date + 'T' + endTime + '+09:00');
                    title = '⏰ 사용자 정의 휴무';
                    backgroundColor = 'var(--mg-purple-700)';
                    allDay = false;
                } else {
                    endDate = new Date(date + 'T23:59:59+09:00');
                    title = '⏰ 사용자 정의 휴무';
                    backgroundColor = 'var(--mg-purple-700)';
                }
                break;
            case 'ALL_DAY':
            case 'FULL_DAY':
                endDate = new Date(date + 'T23:59:59+09:00');
                title = '🏖️ 하루 종일 휴무';
                backgroundColor = 'var(--mg-error-500)';
                allDay = true;
                break;
            default:
                if (startTime && endTime) {
                    startDate.setHours(parseInt(startTime.split(':')[0]), parseInt(startTime.split(':')[1]), 0);
                    endDate = new Date(date + 'T' + endTime + '+09:00');
                    allDay = false;
                } else {
                    endDate = new Date(date + 'T23:59:59+09:00');
                    allDay = true;
                }
                title = '🏖️ 휴무';
                backgroundColor = 'var(--mg-error-500)';
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
                type: 'vacation',
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
    const loadScheduleStatusCodes = useCallback(async () => {
        try {
            setLoadingCodes(true);
            // 공통코드 API 사용 (표준화된 방법)
            const codes = await getCommonCodes('SCHEDULE_STATUS');
            console.log('📋 스케줄 상태 코드 응답:', codes);
            
            if (codes && Array.isArray(codes) && codes.length > 0) {
                const statusOptions = await Promise.all(codes.map(async (code) => {
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
            notificationManager.error('스케줄 상태 코드를 불러올 수 없습니다. 관리자에게 문의하세요.');
        } finally {
            setLoadingCodes(false);
        }
    }, []);

    const loadConsultants = useCallback(async () => {
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
                    console.log('👥 response (배열)에서 추출:', consultantsList.length, '개');
                } else if (response.data && Array.isArray(response.data)) {
                    consultantsList = response.data;
                    console.log('👥 response.data (배열)에서 추출:', consultantsList.length, '개');
                } else if (response.success && response.data) {
                    if (response.data.consultants && Array.isArray(response.data.consultants)) {
                        consultantsList = response.data.consultants;
                        console.log('👥 response.success.data.consultants에서 추출:', consultantsList.length, '개');
                    } else if (Array.isArray(response.data)) {
                        consultantsList = response.data;
                        console.log('👥 response.success.data (배열)에서 추출:', consultantsList.length, '개');
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

    const loadSchedules = useCallback(async () => {
        // userId가 없으면 로드하지 않음
        if (!userId) {
            console.warn('⚠️ userId가 없어 스케줄을 로드하지 않습니다');
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            console.log('📅 스케줄 로드 시작:', { userId, userRole, selectedConsultantId });
            
            let url = '';
            
            // 상담사는 자신의 스케줄만 조회
            if (userRole === 'CONSULTANT') {
                url = `/api/schedules/consultant/${userId}`;
                console.log('🔍 상담사 자신의 스케줄만 조회:', userId);
            }
            // 관리자는 관리자 API 사용
            else if (userRole === 'ADMIN' || userRole === 'BRANCH_SUPER_ADMIN' || userRole === 'HQ_MASTER' || userRole === 'SUPER_HQ_ADMIN') {
                url = '/api/v1/schedules/admin';
                if (selectedConsultantId && selectedConsultantId !== '') {
                    url += `?consultantId=${selectedConsultantId}`;
                    console.log('🔍 상담사 필터링 적용:', selectedConsultantId);
                } else {
                    console.log('🔍 전체 상담사 조회');
                }
            }
            // 기타 사용자 (내담자 등)
            else {
                url = `/api/schedules?userId=${userId}&userRole=${userRole}`;
                console.log('🔍 일반 사용자 스케줄 조회');
            }
            
            const timestamp = new Date().getTime();
            const separator = url.includes('?') ? '&' : '?';
            const response = await apiGet(`${url}${separator}_t=${timestamp}`);

            console.log('📅 API 응답:', response);
            console.log('📅 API 응답 타입:', typeof response, Array.isArray(response));
            console.log('📅 API 응답 키:', response ? Object.keys(response) : 'null');

            let scheduleEvents = [];
            
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
                        
                        // LocalTime은 "HH:mm:ss" 또는 "HH:mm" 형식
                        const startTimeStr = schedule.startTime 
                            ? (schedule.startTime.includes('T') 
                                ? schedule.startTime.split('T')[1] 
                                : schedule.startTime).split('.')[0] // 밀리초 제거
                            : '00:00:00';
                        
                        const endTimeStr = schedule.endTime 
                            ? (schedule.endTime.includes('T') 
                                ? schedule.endTime.split('T')[1] 
                                : schedule.endTime).split('.')[0] // 밀리초 제거
                            : '00:00:00';
                        
                        startDateStr = `${dateStr}T${startTimeStr}`;
                        endDateStr = `${dateStr}T${endTimeStr}`;
                    } else {
                        console.error('❌ 스케줄에 날짜가 없습니다:', schedule);
                        return null;
                    }
                    
                    return {
                        id: schedule.id,
                        title: schedule.title || '상담',
                        start: startDateStr,
                        end: endDateStr,
                        backgroundColor: getConsultantColor(schedule.consultantId),
                        borderColor: getConsultantColor(schedule.consultantId),
                        className: `schedule-event status-${schedule.status?.toLowerCase()}`,
                        extendedProps: {
                            id: schedule.id,
                            consultantId: schedule.consultantId,
                            consultantName: schedule.consultantName,
                            clientId: schedule.clientId,
                            clientName: schedule.clientName,
                            status: schedule.status,
                            statusKorean: convertStatusToKorean(schedule.status),
                            type: schedule.scheduleType,
                            consultationType: schedule.consultationType,
                            description: schedule.description
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
                    console.log('📅 response.data (배열)에서 추출:', schedules.length, '개');
                }
                // response.success가 있고 response.data가 있는 경우 (원본 ApiResponse 구조)
                else if (response.success && response.data) {
                    if (response.data.schedules && Array.isArray(response.data.schedules)) {
                        schedules = response.data.schedules;
                        console.log('📅 response.success.data.schedules에서 추출:', schedules.length, '개');
                    } else if (Array.isArray(response.data)) {
                        schedules = response.data;
                        console.log('📅 response.success.data (배열)에서 추출:', schedules.length, '개');
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
                            
                            // LocalTime은 "HH:mm:ss" 또는 "HH:mm" 형식
                            const startTimeStr = schedule.startTime 
                                ? (schedule.startTime.includes('T') 
                                    ? schedule.startTime.split('T')[1] 
                                    : schedule.startTime).split('.')[0] // 밀리초 제거
                                : '00:00:00';
                            
                            const endTimeStr = schedule.endTime 
                                ? (schedule.endTime.includes('T') 
                                    ? schedule.endTime.split('T')[1] 
                                    : schedule.endTime).split('.')[0] // 밀리초 제거
                                : '00:00:00';
                            
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
                        
                        return {
                            id: schedule.id,
                            title: schedule.title || '상담',
                            start: startDateStr,
                            end: endDateStr,
                            backgroundColor: getConsultantColor(schedule.consultantId),
                            borderColor: getConsultantColor(schedule.consultantId),
                            className: `schedule-event status-${schedule.status?.toLowerCase()}`,
                            extendedProps: {
                                id: schedule.id,
                                consultantId: schedule.consultantId,
                                consultantName: schedule.consultantName,
                                clientId: schedule.clientId,
                                clientName: schedule.clientName,
                                status: schedule.status,
                                statusKorean: convertStatusToKorean(schedule.status),
                                type: schedule.scheduleType,
                                consultationType: schedule.consultationType,
                                description: schedule.description
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

            const allEvents = [...scheduleEvents, ...vacationEvents];
            setEvents(allEvents);
            console.log('📅 모든 이벤트 데이터 로드 완료:', allEvents);
        } catch (error) {
            console.error('스케줄 로드 실패:', error);
        } finally {
            setLoading(false);
        }
    }, [userId, userRole, selectedConsultantId]);

    useEffect(() => {
        console.log('🔍 UnifiedScheduleComponent useEffect 실행:', { userId, userRole, selectedConsultantId });
        
        // 표준화 2025-12-08: 성능 개선 - 병렬 로딩 적용
        const loadData = async () => {
            const promises = [];
            
            // 스케줄 로드 (필수)
            if (userId) {
                promises.push(loadSchedules());
            }
            
            // 공통코드 로드 (필수)
            promises.push(loadScheduleStatusCodes());
            
            // 상담사 목록 로드 (관리자만, 선택적)
            if (userRole === 'ADMIN' || userRole === 'BRANCH_SUPER_ADMIN') {
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
        if (userRole === 'CONSULTANT') {
            if (isPastDate) {
                notificationManager.warning('과거 날짜에는 휴가를 등록할 수 없습니다.');
                return;
            }
            
            // 상담사는 바로 휴가 등록 모달 열기
            setSelectedDate(info.date);
            setSelectedInfo(info);
            setIsVacationModalOpen(true);
            return;
        }
        
        // 관리자는 스케줄/휴가 선택 모달 표시
        if (userRole === 'ADMIN' || userRole === 'BRANCH_SUPER_ADMIN' || userRole === 'HQ_MASTER' || userRole === 'SUPER_HQ_ADMIN') {
            if (isPastDate) {
                notificationManager.warning('과거 날짜에는 새로운 스케줄을 등록할 수 없습니다. 기존 스케줄을 클릭하여 조회하실 수 있습니다.');
                return;
            }
            
            setSelectedDate(info.date);
            setSelectedInfo(info);
            setIsDateActionModalOpen(true);
        } else {
            notificationManager.warning('스케줄 생성 권한이 없습니다.');
        }
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
        
        const event = info.event;
        
        if (event.extendedProps.type === 'vacation') {
            console.log('🏖️ 휴가 이벤트 클릭');
            
            let consultantName = event.extendedProps.consultantName;
            if (!consultantName || consultantName === 'undefined' || consultantName === '알 수 없음') {
                if (event.extendedProps.consultantId && event.extendedProps.consultantId !== 'undefined') {
                    consultantName = `상담사 ${event.extendedProps.consultantId}`;
                } else {
                    consultantName = '상담사 정보 없음';
                }
            }
            
            // 공통코드에서 VACATION 상태값 조회
            const vacationStatus = scheduleStatusOptions.find(opt => 
                opt.value === 'VACATION' || opt.label?.includes('휴가')
            )?.value || 'VACATION'; // fallback (공통코드 미로드 시)
            
            const scheduleData = {
                id: event.extendedProps.consultantId,
                title: event.title,
                consultantName: consultantName,
                clientName: '휴가',
                consultationType: 'VACATION',
                startTime: event.allDay ? '하루 종일' : formatTime(event.start),
                endTime: event.allDay ? '하루 종일' : formatTime(event.end),
                status: vacationStatus,
                description: event.extendedProps.reason || event.extendedProps.description || '휴가',
                reason: event.extendedProps.reason || event.extendedProps.description || '휴가',
                vacationType: event.extendedProps.vacationType,
                date: event.extendedProps.date
            };

            setSelectedSchedule(scheduleData);
            setIsDetailModalOpen(true);
            return;
        }
        
        const koreanStatus = event.extendedProps.statusKorean || convertStatusToKorean(event.extendedProps.status);
        const koreanConsultationType = convertConsultationTypeToKorean(event.extendedProps.consultationType);
        
        const consultantName = event.extendedProps.consultantName || '상담사 정보 없음';
        const clientName = event.extendedProps.clientName || '내담자 정보 없음';

        const scheduleData = {
            id: event.extendedProps.id,
            title: event.title,
            consultantName: consultantName,
            clientName: clientName,
            consultationType: koreanConsultationType,
            startTime: formatTime(event.start),
            endTime: formatTime(event.end),
            status: koreanStatus
        };

        setSelectedSchedule(scheduleData);
        setIsDetailModalOpen(true);
    };

    const handleEventDrop = async (info) => {
        console.log('🔄 이벤트 이동:', info.event.title);
        
        const event = info.event;
        const newStart = event.start;
        const newEnd = event.end;

        try {
            await apiPut(`/api/v1/schedules/${event.id}`, {
                date: newStart.toISOString().split('T')[0],
                startTime: newStart.toTimeString().split(' ')[0].slice(0, 5),
                endTime: newEnd.toTimeString().split(' ')[0].slice(0, 5)
            });

            console.log('✅ 스케줄 이동 완료');
            notificationManager.success('스케줄 이동이 완료되었습니다.');
            await loadSchedules(); // 스케줄 다시 로드
        } catch (error) {
            console.error('스케줄 이동 오류:', error);
            info.revert();
            notificationManager.error('스케줄 이동 중 오류가 발생했습니다.');
        }
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
        setSelectedDate(null);
        setSelectedInfo(null);
    };

    const handleScheduleCreated = async () => {
        console.log('🔄 스케줄 생성 완료 - 캘린더 새로고침 시작');
        await loadSchedules();
        handleModalClose();
        console.log('✅ 캘린더 새로고침 완료');
    };

    const handleDetailModalClose = () => {
        setIsDetailModalOpen(false);
        setSelectedSchedule(null);
    };

    const handleScheduleUpdated = () => {
        loadSchedules();
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

    const forceRefresh = useCallback(async () => {
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
        <div className="mg-v2-schedule-calendar">
            <ScheduleHeader
                userRole={userRole}
                consultants={consultants}
                selectedConsultantId={selectedConsultantId}
                loadingConsultants={loadingConsultants}
                onConsultantChange={handleConsultantChange}
                onRefresh={forceRefresh}
            />

            <ScheduleLegend
                consultants={consultants}
                events={events}
                scheduleStatusOptions={scheduleStatusOptions}
                getConsultantColor={getConsultantColor}
            />

            {loading && (
                <UnifiedLoading type="inline" text="스케줄을 불러오는 중..." />
            )}

            <ScheduleCalendarView
                events={events}
                userRole={userRole}
                onDateClick={handleDateClick}
                onEventClick={handleEventClick}
                onEventDrop={handleEventDrop}
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

            {isVacationModalOpen && userRole === 'CONSULTANT' && (
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

            {isVacationModalOpen && userRole !== 'CONSULTANT' && (
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
        </div>
    );
};

export default UnifiedScheduleComponent;
