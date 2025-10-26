import { useState, useEffect, useCallback } from 'react';
import UnifiedLoading from '../common/UnifiedLoading';
import ScheduleModal from './ScheduleModal';
import ScheduleDetailModal from './ScheduleDetailModal';
import ConsultationLogModal from '../consultant/ConsultationLogModal';
import VacationManagementModal from '../admin/VacationManagementModal';
import DateActionModal from './DateActionModal';
import ScheduleHeader from '../ui/Schedule/ScheduleHeader';
import ScheduleLegend from '../ui/Schedule/ScheduleLegend';
import ScheduleCalendarView from '../ui/Schedule/ScheduleCalendarView';
import { apiGet } from '../../utils/ajax';
import { getStatusColor, getStatusIcon } from '../../utils/codeHelper';
// import './ScheduleCalendar.css'; // 제거: mindgarden-design-system.css 사용

/**
 * 스케줄 관리 컨테이너 컴포넌트
 * - 비즈니스 로직만 담당
 * - 상태 관리, 데이터 로드, 이벤트 핸들러
 * - Presentational 컴포넌트에 데이터와 핸들러 전달
 * 
 * @author MindGarden
 * @version 2.0.0 (Presentational/Container 분리)
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
            '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
            '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6366f1'
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
                backgroundColor = '#FF9800';
                allDay = false;
                break;
            case 'AFTERNOON':
                startDate.setHours(14, 0, 0);
                endDate = new Date(date + 'T18:00:00+09:00');
                title = '🌇 오후 휴무';
                backgroundColor = '#FF5722';
                allDay = false;
                break;
            case 'MORNING_HALF_1':
                endDate = new Date(date + 'T11:00:00+09:00');
                title = '🌄 오전 반반차 1';
                backgroundColor = '#FFC107';
                allDay = false;
                break;
            case 'MORNING_HALF_2':
                startDate.setHours(11, 0, 0);
                endDate = new Date(date + 'T13:00:00+09:00');
                title = '🌄 오전 반반차 2';
                backgroundColor = '#FFC107';
                allDay = false;
                break;
            case 'AFTERNOON_HALF_1':
                startDate.setHours(14, 0, 0);
                endDate = new Date(date + 'T16:00:00+09:00');
                title = '🌆 오후 반반차 1';
                backgroundColor = '#FF7043';
                allDay = false;
                break;
            case 'AFTERNOON_HALF_2':
                startDate.setHours(16, 0, 0);
                endDate = new Date(date + 'T18:00:00+09:00');
                title = '🌆 오후 반반차 2';
                backgroundColor = '#FF7043';
                allDay = false;
                break;
            case 'CUSTOM_TIME':
                if (startTime && endTime) {
                    startDate.setHours(parseInt(startTime.split(':')[0]), parseInt(startTime.split(':')[1]), 0);
                    endDate = new Date(date + 'T' + endTime + '+09:00');
                    title = '⏰ 사용자 정의 휴무';
                    backgroundColor = '#9C27B0';
                    allDay = false;
                } else {
                    endDate = new Date(date + 'T23:59:59+09:00');
                    title = '⏰ 사용자 정의 휴무';
                    backgroundColor = '#9C27B0';
                }
                break;
            case 'ALL_DAY':
            case 'FULL_DAY':
                endDate = new Date(date + 'T23:59:59+09:00');
                title = '🏖️ 하루 종일 휴무';
                backgroundColor = '#F44336';
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
                backgroundColor = '#F44336';
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
            textColor: '#fff',
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
            const response = await apiGet('/api/common-codes/STATUS');
            console.log('📋 스케줄 상태 코드 응답:', response);
            
            if (response && Array.isArray(response) && response.length > 0) {
                const statusOptions = await Promise.all(response.map(async (code) => {
                    try {
                        const [color, icon] = await Promise.all([
                            getStatusColor(code.codeValue, 'STATUS'),
                            getStatusIcon(code.codeValue, 'STATUS')
                        ]);
                        
                        return {
                            value: code.codeValue,
                            label: code.codeLabel,
                            color: color,
                            icon: icon,
                            description: code.codeDescription
                        };
                    } catch (error) {
                        console.error(`스케줄 상태 ${code.codeValue} 처리 오류:`, error);
                        return {
                            value: code.codeValue,
                            label: code.codeLabel,
                            color: '#6b7280',
                            icon: '📋',
                            description: code.codeDescription
                        };
                    }
                }));
                
                console.log('📋 변환된 상태 옵션 (동적 처리):', statusOptions);
                setScheduleStatusOptions(statusOptions);
            } else {
                console.warn('📋 스케줄 상태 코드 데이터가 없습니다:', response);
            }
        } catch (error) {
            console.error('일정 상태 코드 로드 실패:', error);
            setScheduleStatusOptions([
                { value: 'BOOKED', label: '예약됨', icon: '📅', color: '#3b82f6', description: '예약된 일정' },
                { value: 'CONFIRMED', label: '확정됨', icon: '✅', color: '#8b5cf6', description: '확정된 일정' },
                { value: 'IN_PROGRESS', label: '진행중', icon: '🔄', color: '#f59e0b', description: '진행 중인 일정' },
                { value: 'COMPLETED', label: '완료됨', icon: '🎉', color: '#059669', description: '완료된 일정' },
                { value: 'CANCELLED', label: '취소됨', icon: '❌', color: '#ef4444', description: '취소된 일정' },
                { value: 'BLOCKED', label: '차단됨', icon: '🚫', color: '#6b7280', description: '차단된 시간' }
            ]);
        } finally {
            setLoadingCodes(false);
        }
    }, []);

    const loadConsultants = useCallback(async () => {
        try {
            setLoadingConsultants(true);
            const response = await apiGet('/api/admin/consultants');
            
            if (response && response.success) {
                setConsultants(response.data || []);
            }
        } catch (error) {
            console.error('상담사 목록 로드 실패:', error);
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
                url = '/api/schedules/admin';
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

            let scheduleEvents = [];
            if (response && response.success) {
                console.log('📅 API 응답 데이터:', response);
                
                const schedules = response.data || response;
                
                if (Array.isArray(schedules)) {
                    scheduleEvents = schedules.map(schedule => {
                        console.log('📅 스케줄 데이터 처리:', schedule);
                        return {
                            id: schedule.id,
                            title: schedule.title || '상담',
                            start: `${schedule.date}T${schedule.startTime}`,
                            end: `${schedule.date}T${schedule.endTime}`,
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
                    });
                    console.log('📅 변환된 이벤트:', scheduleEvents);
                } else {
                    console.warn('📅 스케줄 데이터가 배열이 아닙니다:', schedules);
                }
            } else {
                console.warn('📅 API 응답 실패:', response);
            }

            const vacationEvents = [];
            if (userRole === 'ADMIN' || userRole === 'BRANCH_SUPER_ADMIN') {
                try {
                    const today = new Date();
                    const startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1).toISOString().split('T')[0];
                    const endDate = new Date(today.getFullYear(), today.getMonth() + 2, 0).toISOString().split('T')[0];
                    
                    const vacationResponse = await fetch(`/api/consultant/vacations`, {
                        method: 'GET',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include'
                    });
                    
                    if (vacationResponse.ok) {
                        const vacationResult = await vacationResponse.json();
                        console.log('🏖️ 어드민 휴가 API 응답:', vacationResult);
                        if (vacationResult.success && vacationResult.data) {
                            Object.entries(vacationResult.data).forEach(([consultantId, consultantVacations]) => {
                                console.log('🏖️ 상담사 휴가 데이터:', consultantId, consultantVacations);
                                Object.entries(consultantVacations).forEach(([date, vacationData]) => {
                                    if (!vacationData.consultantName) {
                                        vacationData.consultantName = `상담사 ${consultantId}`;
                                    }
                                    const vacationEvent = convertVacationToEvent(vacationData, consultantId, date);
                                    if (vacationEvent) {
                                        vacationEvents.push(vacationEvent);
                                        console.log('🏖️ 휴가 이벤트 추가:', vacationEvent);
                                    }
                                });
                            });
                        }
                    }
                } catch (error) {
                    console.error('휴가 데이터 로드 실패:', error);
                }
            }

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
        
        loadSchedules();
        loadScheduleStatusCodes();
        
        if (userRole === 'ADMIN' || userRole === 'BRANCH_SUPER_ADMIN') {
            loadConsultants();
        }
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
                alert('과거 날짜에는 휴가를 등록할 수 없습니다.');
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
                alert('과거 날짜에는 새로운 스케줄을 등록할 수 없습니다.\n기존 스케줄을 클릭하여 조회하실 수 있습니다.');
                return;
            }
            
            setSelectedDate(info.date);
            setSelectedInfo(info);
            setIsDateActionModalOpen(true);
        } else {
            alert('스케줄 생성 권한이 없습니다.');
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
            
            const scheduleData = {
                id: event.extendedProps.consultantId,
                title: event.title,
                consultantName: consultantName,
                clientName: '휴가',
                consultationType: 'VACATION',
                startTime: event.allDay ? '하루 종일' : formatTime(event.start),
                endTime: event.allDay ? '하루 종일' : formatTime(event.end),
                status: 'VACATION',
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
        
        let consultantName = event.extendedProps.consultantName;
        const consultantId = event.extendedProps.consultantId;
        
        if (!consultantName || consultantName === 'undefined' || consultantName === '알 수 없음') {
            if (consultantId && consultantId !== 'undefined') {
                consultantName = `상담사 ${consultantId}`;
            } else {
                consultantName = '상담사 정보 없음';
            }
        }
        
        let clientName = event.extendedProps.clientName;
        const clientId = event.extendedProps.clientId;
        
        if (!clientName || clientName === 'undefined' || clientName === '알 수 없음') {
            if (clientId && clientId !== 'undefined') {
                clientName = `클라이언트 ${clientId}`;
            } else {
                clientName = '클라이언트 정보 없음';
            }
        }

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
            const response = await fetch(`/api/schedules/${event.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    date: newStart.toISOString().split('T')[0],
                    startTime: newStart.toTimeString().split(' ')[0].slice(0, 5),
                    endTime: newEnd.toTimeString().split(' ')[0].slice(0, 5)
                })
            });

            if (!response.ok) {
                info.revert();
                alert('스케줄 이동에 실패했습니다.');
            } else {
                console.log('✅ 스케줄 이동 완료');
            }
        } catch (error) {
            console.error('스케줄 이동 오류:', error);
            info.revert();
            alert('스케줄 이동 중 오류가 발생했습니다.');
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
                <UnifiedLoading 
                    text="스케줄을 불러오는 중..." 
                    size="large" 
                    variant="pulse"
                    className="loading-spinner-fullscreen"
                />
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

            {isVacationModalOpen && (
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
