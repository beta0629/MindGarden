import React, { useState, useEffect, useCallback } from 'react';
import ScheduleDetailModal from './ScheduleDetailModal';
import ScheduleModal from './ScheduleModal';
import VacationManagementModal from '../admin/VacationManagementModal';
import TimeSelectionModal from './TimeSelectionModal';
import UnifiedLoading from '../../components/common/UnifiedLoading';
import { useSession } from '../../contexts/SessionContext';
import { apiGet, apiPut } from '../../utils/ajax';
import { getStatusColor, getStatusIcon } from '../../utils/codeHelper';
import notificationManager from '../../utils/notification';

import ScheduleCalendarHeader from './ScheduleCalendar/ScheduleCalendarHeader';
import ScheduleCalendarLegend from './ScheduleCalendar/ScheduleCalendarLegend';
import ScheduleCalendarCore from './ScheduleCalendar/ScheduleCalendarCore';
import ScheduleCalendarMobileZoom from './ScheduleCalendar/ScheduleCalendarMobileZoom';
import {
    formatTime,
    convertStatusToKorean,
    convertConsultationTypeToKorean,
    getConsultantColor,
    getEventColor,
    convertVacationToEvent,
    checkIsMobile,
    generateTimeSlots,
    isTimeSlotBooked
} from './ScheduleCalendar/ScheduleCalendarUtils';

/**
 * FullCalendar 기반 스케줄 관리 컴포넌트 (리팩토링됨)
 * 
 * @author MindGarden
 * @version 2.0.0
/**
 * @since 2024-12-19
 */
const ScheduleCalendar = ({ userRole, userId }) => {
    const { user: sessionUser } = useSession();
    
    const currentUser = sessionUser;
    const currentUserRole = userRole || currentUser?.role || 'CLIENT';
    const currentUserId = userId || currentUser?.id;
    
    const [events, setEvents] = useState([]);
    const [selectedDate, setSelectedDate] = useState(null);
    const [selectedInfo, setSelectedInfo] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [isVacationModalOpen, setIsVacationModalOpen] = useState(false);
    const [isDateActionModalOpen, setIsDateActionModalOpen] = useState(false);
    const [showTimeSelectionModal, setShowTimeSelectionModal] = useState(false);
    const [selectedSchedule, setSelectedSchedule] = useState(null);
    const [bookedTimes, setBookedTimes] = useState([]);
    const [loadingAvailableTimes, setLoadingAvailableTimes] = useState(false);
    const [loading, setLoading] = useState(false);
    const [scheduleStatusOptions, setScheduleStatusOptions] = useState([]);
    const [loadingCodes, setLoadingCodes] = useState(false);
    
    const [isMobileZoomOpen, setIsMobileZoomOpen] = useState(false);
    const [mobileZoomDate, setMobileZoomDate] = useState(null);
    const [mobileZoomSchedules, setMobileZoomSchedules] = useState([]);
    const [isMobile, setIsMobile] = useState(false);
    const [forceMobileMode, setForceMobileMode] = useState(false);
    
    const [consultants, setConsultants] = useState([]);
    const [selectedConsultantId, setSelectedConsultantId] = useState('');
    const [loadingConsultants, setLoadingConsultants] = useState(false);

    const loadScheduleStatusCodes = useCallback(async () => {
        try {
            setLoadingCodes(true);
            const response = await apiGet('/api/v1/common-codes/STATUS');
            console.log('📋 스케줄 상태 코드 응답:', response);
            
            if (response && Array.isArray(response) && response.length > 0) {
                // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
                const allowedStatuses = ['AVAILABLE', 'BOOKED', 'CONFIRMED', 'VACATION', 'COMPLETED', 'CANCELLED'];
                const filteredResponse = response.filter(code => allowedStatuses.includes(code.codeValue));
                
                const statusOptions = filteredResponse.map(code => ({
                    value: code.codeValue,
                    label: code.codeLabel,
                    color: code.colorCode || 'var(--mg-gray-500)',
                    icon: code.icon || '📋',
                    description: code.codeDescription
                }));
                
                console.log('📋 변환된 상태 옵션 (동적 처리):', statusOptions);
                setScheduleStatusOptions(statusOptions);
            } else {
                console.warn('📋 스케줄 상태 코드 데이터가 없습니다:', response);
            }
        } catch (error) {
            console.error('일정 상태 코드 로드 실패:', error);
            setScheduleStatusOptions([
                { value: 'AVAILABLE', label: '가능', icon: '✅', color: 'var(--mg-success-500)', description: '예약 가능한 시간대' },
                // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
                { value: 'BOOKED', label: '예약됨', icon: '📅', color: 'var(--mg-primary-500)', description: '예약된 일정' },
                // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
                { value: 'CONFIRMED', label: '확정됨', icon: '✅', color: 'var(--mg-info-500)', description: '확정된 일정' },
                { value: 'VACATION', label: '휴가', icon: '🏖️', color: 'var(--mg-warning-500)', description: '휴가로 인한 비활성' },
                // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
                { value: 'COMPLETED', label: '완료', icon: '✅', color: 'var(--mg-secondary-500)', description: '완료된 일정' },
                // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
                { value: 'CANCELLED', label: '취소됨', icon: '❌', color: 'var(--mg-error-500)', description: '취소된 일정' }
            ]);
        } finally {
            setLoadingCodes(false);
        }
    }, []);

    const loadConsultants = useCallback(async () => {
        if (currentUserRole === 'CLIENT') {
            console.log('👤 내담자 - 상담사 목록 로드 생략');
            setConsultants([]);
            return;
        }
        
        try {
            setLoadingConsultants(true);
            
            console.log('🔍 사용자 정보 확인:', {
                currentUser,
                currentUserRole,
                branchId: currentUser?.branchId,
                branchCode: currentUser?.branchCode
            });
            
            const apiEndpoint = '/api/v1/admin/consultants/with-vacation?date=' + new Date().toISOString().split('T')[0];
            
            console.log('🔍 조건 확인:', {
                currentUserRole,
                isBranchSuperAdmin: currentUserRole === 'BRANCH_SUPER_ADMIN',
                hasBranchId: !!currentUser?.branchId,
                branchId: currentUser?.branchId
            });
            
            // 브랜치 개념 제거됨 (표준화 2025-12-05)
            // if (currentUserRole === 'BRANCH_SUPER_ADMIN' && currentUser?.branchId) {
            //     apiEndpoint = `/api/v1/admin/consultants/by-branch/${currentUser.branchId}`;
            //     console.log('🏢 지점 어드민 - 지점별 상담사 조회:', currentUser.branchId);
            // } else {
                console.log('🏢 전체 상담사 조회 - 이유:', {
                    role: currentUserRole,
                    isBranchSuperAdmin: currentUserRole === 'BRANCH_SUPER_ADMIN',
                    hasBranchId: !!currentUser?.branchId,
                    branchId: currentUser?.branchId
                });
            // }
            
            console.log('📡 API 엔드포인트:', apiEndpoint);
            const response = await apiGet(apiEndpoint);
            
            if (response && response.success) {
                const consultantData = response.data || [];
                console.log('👥 로드된 상담사 목록:', consultantData);
                setConsultants(consultantData);
            }
        } catch (error) {
            console.error('상담사 목록 로드 실패:', error);
            setConsultants([]);
        } finally {
            setLoadingConsultants(false);
        }
    }, [currentUserRole, currentUser?.branchId]);

/**
     * 스케줄 데이터 로드
     */
    const loadSchedules = useCallback(async () => {
        setLoading(true);
        try {
            console.log('📅 스케줄 로드 시작:', { currentUserId, currentUserRole, selectedConsultantId });
            
            let url = `/api/schedules?userId=${currentUserId}&userRole=${currentUserRole}`;
            
            if (currentUserRole === 'ADMIN' || currentUserRole === 'BRANCH_SUPER_ADMIN' || currentUserRole === 'HQ_MASTER' || currentUserRole === 'SUPER_HQ_ADMIN') {
                url = '/api/v1/schedules/admin';
                if (selectedConsultantId && selectedConsultantId !== '') {
                    url += `?consultantId=${selectedConsultantId}`;
                    console.log('🔍 상담사 필터링 적용:', selectedConsultantId);
                } else {
                    console.log('🔍 전체 상담사 조회');
                }
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
                        console.log('👤 상담사 정보:', {
                            consultantId: schedule.consultantId,
                            consultantName: schedule.consultantName,
                            hasConsultantName: !!schedule.consultantName,
                            scheduleData: schedule
                        });
                        const isVacation = schedule.status === 'VACATION';
                        const eventColor = isVacation ? getEventColor(schedule.status) : getConsultantColor(schedule.consultantId);
                        
                        return {
                            id: schedule.id,
                            title: schedule.title || '상담',
                            start: `${schedule.date}T${schedule.startTime}`,
                            end: `${schedule.date}T${schedule.endTime}`,
                            backgroundColor: eventColor,
                            borderColor: eventColor,
                            className: `schedule-event status-${schedule.status?.toLowerCase()}`,
                            extendedProps: {
                                id: schedule.id,
                                consultantId: schedule.consultantId,
                                consultantName: schedule.consultantName,
                                clientId: schedule.clientId,
                                clientName: schedule.clientName,
                                status: schedule.status,
                                statusKorean: convertStatusToKorean(schedule.status, scheduleStatusOptions),
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
            if (currentUserRole === 'ADMIN' || currentUserRole === 'BRANCH_SUPER_ADMIN') {
                try {
                    const today = new Date();
                    const startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1).toISOString().split('T')[0];
                    const endDate = new Date(today.getFullYear(), today.getMonth() + 2, 0).toISOString().split('T')[0];
                    
                    const vacationResponse = await fetch(`/api/v1/consultants/availability/vacations`, {
                        method: 'GET',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include'
                    });
                    
                    if (vacationResponse.ok) {
                        const vacationResult = await vacationResponse.json();
                        console.log('🏖️ 휴가 데이터:', vacationResult);
                        
                        if (vacationResult.success && vacationResult.data) {
                            const vacationData = vacationResult.data;
                            
                            Object.keys(vacationData).forEach(consultantId => {
                                const consultantVacations = vacationData[consultantId];
                                consultantVacations.forEach(vacation => {
                                    const vacationEvent = convertVacationToEvent(vacation, consultantId, vacation.date);
                                    vacationEvents.push(vacationEvent);
                                });
                            });
                        }
                    }
                } catch (vacationError) {
                    console.error('휴가 데이터 로드 실패:', vacationError);
                }
            }

            const allEvents = [...scheduleEvents, ...vacationEvents];
            setEvents(allEvents);
            
        } catch (error) {
            console.error('스케줄 로드 실패:', error);
            notificationManager.error('스케줄을 불러오는데 실패했습니다.');
        } finally {
            setLoading(false);
        }
    }, [currentUserId, currentUserRole, selectedConsultantId, scheduleStatusOptions]);

    const openMobileZoom = useCallback((date, dayEvents = []) => {
        setMobileZoomDate(date);
        setMobileZoomSchedules(dayEvents);
        setIsMobileZoomOpen(true);
    }, []);

    const closeMobileZoom = useCallback(() => {
        setIsMobileZoomOpen(false);
        setMobileZoomDate(null);
        setMobileZoomSchedules([]);
    }, []);

    const handleMobileZoomScheduleClick = useCallback((schedule) => {
        closeMobileZoom();
        showDetailModal(schedule);
    }, [closeMobileZoom]);

    const handleMobileZoomAddSchedule = useCallback(() => {
        closeMobileZoom();
        setSelectedDate(mobileZoomDate);
        setIsModalOpen(true);
    }, [closeMobileZoom, mobileZoomDate]);

    useEffect(() => {
        const checkMobile = () => {
            const newIsMobile = checkIsMobile(forceMobileMode);
            console.log('📱 모바일 모드 체크:', {
                forceMobileMode,
                newIsMobile
            });
            setIsMobile(newIsMobile);
        };
        
        checkMobile();
        window.addEventListener('resize', checkMobile);
        
        return () => window.removeEventListener('resize', checkMobile);
    }, [forceMobileMode]);

    useEffect(() => {
        loadScheduleStatusCodes();
        loadConsultants();
    }, [loadScheduleStatusCodes, loadConsultants]);

    useEffect(() => {
        loadSchedules();
    }, [loadSchedules]);

    useEffect(() => {
        loadSchedules();
    }, [selectedConsultantId, loadSchedules]);

    const handleDateClick = (info) => {
        console.log('📅 날짜 클릭:', info);
        
        if (currentUserRole === 'CLIENT') {
            notificationManager.info('일정은 상담사가 관리합니다.');
            return;
        }
        
        if (isMobile) {
            const clickedDate = new Date(info.date);
            const today = new Date();
            
            if (clickedDate < today.setHours(0, 0, 0, 0)) {
                notificationManager.warning('과거 날짜는 선택할 수 없습니다.');
                return;
            }
            
            const dayEvents = events.filter(event => {
                const eventDate = new Date(event.start);
                return eventDate.toDateString() === clickedDate.toDateString();
            });
            
            openMobileZoom(info.dateStr, dayEvents);
        } else {
            if (currentUserRole === 'ADMIN' || currentUserRole === 'BRANCH_SUPER_ADMIN') {
                const clickedDate = new Date(info.date);
                const today = new Date();
                
                if (clickedDate < today.setHours(0, 0, 0, 0)) {
                    notificationManager.warning('과거 날짜는 선택할 수 없습니다.');
                    return;
                }
                
                const dayEvents = events.filter(event => {
                    const eventDate = new Date(event.start);
                    return eventDate.toDateString() === clickedDate.toDateString();
                });
                
                setSelectedDate(info.dateStr);
                setSelectedInfo(info);
                setIsDateActionModalOpen(true);
            } else {
                const clickedDate = new Date(info.date);
                const dayEvents = events.filter(event => {
                    const eventDate = new Date(event.start);
                    return eventDate.toDateString() === clickedDate.toDateString();
                });
                
                setSelectedDate(info.dateStr);
                setIsModalOpen(true);
            }
        }
    };

    const handleEventClick = (info) => {
        console.log('📅 이벤트 클릭:', info);
        showDetailModal(info.event);
    };

    const showDetailModal = (event) => {
        console.log('📅 상세 모달 표시 - 원본 이벤트:', event);
        console.log('📅 이벤트 extendedProps:', event.extendedProps);
        console.log('📅 이벤트 start:', event.start);
        console.log('📅 이벤트 end:', event.end);
        console.log('📅 이벤트 title:', event.title);
        
        let scheduleData = event;
        if (event.extendedProps) {
            const eventStart = event.start instanceof Date ? event.start : new Date(event.start);
            const eventEnd = event.end instanceof Date ? event.end : new Date(event.end);
            
            scheduleData = {
                id: event.id,
                consultantId: event.extendedProps.consultantId,
                consultantName: event.extendedProps.consultantName,
                clientId: event.extendedProps.clientId,
                clientName: event.extendedProps.clientName,
                status: event.extendedProps.status,
                statusKorean: event.extendedProps.statusKorean,
                type: event.extendedProps.type,
                consultationType: event.extendedProps.consultationType || event.extendedProps.type,
                description: event.extendedProps.description,
                title: event.title,
                date: eventStart.toISOString().split('T')[0],
                startTime: eventStart.toTimeString().split(' ')[0].substring(0, 5),
                endTime: eventEnd ? eventEnd.toTimeString().split(' ')[0].substring(0, 5) : ''
            };
        }
        
        console.log('📅 추출된 스케줄 데이터:', scheduleData);
        console.log('📅 상담 유형:', scheduleData.consultationType);
        console.log('📅 상태:', scheduleData.status);
        console.log('📅 시간:', scheduleData.startTime, '-', scheduleData.endTime);
        
        setSelectedSchedule(scheduleData);
        setIsDetailModalOpen(true);
    };

    const handleEventDrop = async (info) => {
        console.log('📅 이벤트 드롭:', info);
        
        try {
            const event = info.event;
            const newStart = event.start;
            const newEnd = event.end;
            
            const response = await apiPut(`/api/v1/schedules/${event.id}`, {
                date: newStart.toISOString().split('T')[0],
                startTime: newStart.toTimeString().split(' ')[0].substring(0, 5),
                endTime: newEnd.toTimeString().split(' ')[0].substring(0, 5)
            });
            
            if (response && (response.success !== false)) {
                notificationManager.success('일정이 업데이트되었습니다.');
                loadSchedules(); // 스케줄 다시 로드
            } else {
                info.revert();
                notificationManager.error('일정 업데이트에 실패했습니다.');
            }
        } catch (error) {
            console.error('일정 업데이트 실패:', error);
            info.revert();
            notificationManager.error('일정 업데이트에 실패했습니다.');
        }
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
        setSelectedDate(null);
        setSelectedInfo(null);
    };

    const handleScheduleCreated = async () => {
        console.log('📅 일정 생성됨');
        await loadSchedules();
        setIsModalOpen(false);
        setSelectedDate(null);
    };

    const handleDetailModalClose = () => {
        setIsDetailModalOpen(false);
        setSelectedSchedule(null);
    };

    const handleScheduleUpdated = () => {
        console.log('📅 일정 업데이트됨');
        loadSchedules();
        setIsDetailModalOpen(false);
        setSelectedSchedule(null);
    };

    const handleTimeSelectionConfirm = async () => {
        try {
            const response = await fetch(`/api/schedules/${selectedSchedule.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    startTime: selectedSchedule.startTime,
                    endTime: selectedSchedule.endTime
                })
            });
            
            if (response.ok) {
                notificationManager.success('일정 시간이 업데이트되었습니다.');
                setShowTimeSelectionModal(false);
                loadSchedules();
            } else {
                const errorData = await response.json().catch(() => ({}));
                notificationManager.error(errorData.message || '일정 시간 업데이트에 실패했습니다.');
            }
        } catch (error) {
            console.error('일정 시간 업데이트 실패:', error);
            notificationManager.error('일정 시간 업데이트에 실패했습니다.');
        }
    };

    const forceRefresh = useCallback(async () => {
        console.log('🔄 강제 새로고침');
        await Promise.all([
            loadScheduleStatusCodes(),
            loadConsultants(),
            loadSchedules()
        ]);
    }, [loadScheduleStatusCodes, loadConsultants, loadSchedules]);

    return (
        <div className="mg-v2-schedule-calendar mg-mobile-container">
            {loading && <UnifiedLoading type="inline" text="스케줄을 불러오는 중..." />}
            
            {/* 헤더 */}
            <ScheduleCalendarHeader
                currentUserRole={currentUserRole}
                consultants={consultants}
                selectedConsultantId={selectedConsultantId}
                setSelectedConsultantId={setSelectedConsultantId}
                loadingConsultants={loadingConsultants}
                onRefresh={forceRefresh}
                isMobile={isMobile}
                forceMobileMode={forceMobileMode}
                setForceMobileMode={setForceMobileMode}
                loading={loading}
            />

            {/* 범례 */}
            <ScheduleCalendarLegend
                scheduleStatusOptions={scheduleStatusOptions}
                consultants={consultants}
                getConsultantColor={getConsultantColor}
            />

            {/* 메인 달력 */}
            <ScheduleCalendarCore
                events={events}
                onDateClick={handleDateClick}
                onEventClick={handleEventClick}
                onEventDrop={handleEventDrop}
                isMobile={isMobile}
                forceMobileMode={forceMobileMode}
                readOnly={currentUserRole === 'CLIENT'}
            />

            {/* 모바일 확대 모달 */}
            <ScheduleCalendarMobileZoom
                isOpen={isMobileZoomOpen}
                date={mobileZoomDate}
                schedules={mobileZoomSchedules}
                onClose={closeMobileZoom}
                onScheduleClick={handleMobileZoomScheduleClick}
                onAddSchedule={handleMobileZoomAddSchedule}
            />

            {/* 기존 모달들 */}
            <ScheduleModal
                isOpen={isModalOpen}
                onClose={handleModalClose}
                selectedDate={selectedDate}
                selectedInfo={selectedInfo}
                currentUser={currentUser}
                currentUserRole={currentUserRole}
                currentUserId={currentUserId}
                consultants={consultants}
                scheduleStatusOptions={scheduleStatusOptions}
                onScheduleCreated={handleScheduleCreated}
            />

            <ScheduleDetailModal
                isOpen={isDetailModalOpen}
                onClose={handleDetailModalClose}
                scheduleData={selectedSchedule}
                currentUser={currentUser}
                currentUserRole={currentUserRole}
                onScheduleUpdated={handleScheduleUpdated}
            />

            <VacationManagementModal
                isOpen={isVacationModalOpen}
                onClose={() => setIsVacationModalOpen(false)}
                consultants={consultants}
                onVacationCreated={() => {
                    setIsVacationModalOpen(false);
                    loadSchedules();
                }}
            />

            <TimeSelectionModal
                isOpen={showTimeSelectionModal}
                onClose={() => setShowTimeSelectionModal(false)}
                selectedSchedule={selectedSchedule}
                bookedTimes={bookedTimes}
                timeSlots={generateTimeSlots()}
                isTimeSlotBooked={(startTime, endTime) => isTimeSlotBooked(startTime, endTime, bookedTimes)}
                onConfirm={handleTimeSelectionConfirm}
            />
        </div>
    );
};

export default ScheduleCalendar;