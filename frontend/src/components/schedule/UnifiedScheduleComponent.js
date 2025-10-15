import React, { useState, useEffect, useCallback } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import ScheduleModal from './ScheduleModal';
import ScheduleDetailModal from './ScheduleDetailModal';
import VacationManagementModal from '../admin/VacationManagementModal';
import DateActionModal from './DateActionModal';
import TimeSelectionModal from './TimeSelectionModal';
import UnifiedLoading from '../common/UnifiedLoading';
import CustomSelect from '../common/CustomSelect';
import { useSession } from '../../contexts/SessionContext';
import { apiGet } from '../../utils/ajax';
import { getStatusColor, getStatusIcon } from '../../utils/codeHelper';
import notificationManager from '../../utils/notification';
// import { initializeDesignSystem, getConsultantColor as getConsultantColorFromSystem } from '../../utils/designSystemHelper';
import './ScheduleCalendar.css';
import '../common/ScheduleList.css';

/**
 * 통합된 스케줄 관리 컴포넌트
 * - 모든 역할(상담사, 관리자, 클라이언트)에서 사용
 * - 역할별 권한에 따른 기능 제한
 * - 중앙화된 스케줄 관리
 * 
 * @author MindGarden
 * @version 2.0.0
 * @since 2025-09-16
 */
const UnifiedScheduleComponent = ({ 
  user: propUser, 
  userRole: propUserRole,
  userId: propUserId,
  view = 'calendar' // 'calendar', 'list'
}) => {
  // 세션 정보 가져오기
  const { user: sessionUser } = useSession();
  
  // 사용자 정보 결정 (prop > session > null)
  const currentUser = propUser || sessionUser;
  const userRole = propUserRole || currentUser?.role || 'CLIENT';
  const userId = propUserId || currentUser?.id;
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
    
    // 상담사 필터링 상태
    const [consultants, setConsultants] = useState([]);
    const [selectedConsultantId, setSelectedConsultantId] = useState('');
    const [loadingConsultants, setLoadingConsultants] = useState(false);

    // 시간 포맷팅 함수
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

    // 일정 상태 코드 로드
    const loadScheduleStatusCodes = useCallback(async () => {
        try {
            setLoadingCodes(true);
            const response = await apiGet('/api/common-codes/group/STATUS');
            console.log('📋 스케줄 상태 코드 응답:', response);
            
            if (response && Array.isArray(response) && response.length > 0) {
                // 우리가 원하는 6개 상태만 필터링
                const allowedStatuses = ['AVAILABLE', 'BOOKED', 'CONFIRMED', 'VACATION', 'COMPLETED', 'CANCELLED'];
                const filteredResponse = response.filter(code => allowedStatuses.includes(code.codeValue));
                
                // 하드코딩된 색상/아이콘 사용
                const statusOptions = filteredResponse.map(code => {
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
                        color: color,
                        icon: icon,
                        description: code.codeDescription
                    };
                });
                
                console.log('📋 변환된 상태 옵션 (동적 처리):', statusOptions);
                setScheduleStatusOptions(statusOptions);
            } else {
                console.warn('📋 스케줄 상태 코드 데이터가 없습니다:', response);
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

    // 상담사 목록 로드
    const loadConsultants = useCallback(async () => {
        try {
            setLoadingConsultants(true);
            
            // 디버깅을 위한 사용자 정보 로그
            console.log('🔍 사용자 정보 확인:', {
                currentUser,
                currentUserRole: userRole,
                branchId: currentUser?.branchId,
                branchCode: currentUser?.branchCode
            });
            
            // 사용자 역할에 따른 API 엔드포인트 결정
            let apiEndpoint = '/api/admin/consultants';
            
            // 지점 어드민인 경우 자신의 지점 상담사만 조회
            console.log('🔍 조건 확인:', {
                userRole,
                isBranchSuperAdmin: userRole === 'BRANCH_SUPER_ADMIN',
                hasBranchId: !!currentUser?.branchId,
                branchId: currentUser?.branchId
            });
            
            if (userRole === 'BRANCH_SUPER_ADMIN' && currentUser?.branchId) {
                apiEndpoint = `/api/admin/consultants/by-branch/${currentUser.branchId}`;
                console.log('🏢 지점 어드민 - 지점별 상담사 조회:', currentUser.branchId);
            } else {
                console.log('🏢 전체 상담사 조회 - 이유:', {
                    role: userRole,
                    isBranchSuperAdmin: userRole === 'BRANCH_SUPER_ADMIN',
                    hasBranchId: !!currentUser?.branchId,
                    branchId: currentUser?.branchId
                });
            }
            
            console.log('📡 API 엔드포인트:', apiEndpoint);
            const response = await apiGet(apiEndpoint);
            
            if (response && response.success) {
                const consultantData = response.data || [];
                console.log('👥 로드된 상담사 목록:', consultantData);
                setConsultants(consultantData);
                
                // 김선희, 김선희2 상담사 정보 확인
                const kimConsultants = consultantData.filter(consultant => 
                    consultant.name && consultant.name.includes('김선희')
                );
                console.log('🎨 김선희 관련 상담사들:', kimConsultants);
                
                kimConsultants.forEach(consultant => {
                    console.log(`🎨 ${consultant.name} - ID: ${consultant.id}, isActive: ${consultant.isActive}`);
                });
            }
        } catch (error) {
            console.error('상담사 목록 로드 실패:', error);
            setConsultants([]);
        } finally {
            setLoadingConsultants(false);
        }
    }, [userRole, currentUser?.branchId]);

    /**
     * 상태값을 한글로 변환 (동적 로드)
     */
    const convertStatusToKorean = (status) => {
        const statusOption = scheduleStatusOptions.find(option => option.value === status);
        return statusOption ? statusOption.label : status || "알 수 없음";
    };

    /**
     * 스케줄 데이터 로드
     */
    const loadSchedules = useCallback(async () => {
        setLoading(true);
        try {
            console.log('📅 스케줄 로드 시작:', { userId, userRole, selectedConsultantId });
            
            // API URL 결정
            let url = `/api/schedules?userId=${userId}&userRole=${userRole}`;
            
            // 어드민인 경우 상담사 필터링 지원
            if (userRole === 'ADMIN' || userRole === 'BRANCH_SUPER_ADMIN' || userRole === 'HQ_MASTER' || userRole === 'SUPER_HQ_ADMIN') {
                url = '/api/schedules/admin';
                if (selectedConsultantId && selectedConsultantId !== '') {
                    url += `?consultantId=${selectedConsultantId}`;
                    console.log('🔍 상담사 필터링 적용:', selectedConsultantId);
                } else {
                    console.log('🔍 전체 상담사 조회');
                }
            }
            
            // 실제 API 호출 (캐시 방지를 위해 timestamp 추가)
            const timestamp = new Date().getTime();
            const separator = url.includes('?') ? '&' : '?';
            const response = await apiGet(`${url}${separator}_t=${timestamp}`);

            let scheduleEvents = [];
            if (response && response.success) {
                console.log('📅 API 응답 데이터:', response);
                
                // API 응답 구조에 따라 데이터 추출
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
                        // 휴가는 노란색, 나머지는 상담사별 색상 사용
                        const isVacation = schedule.status === 'VACATION';
                        const eventColor = isVacation ? getEventColor(schedule.status) : getConsultantColor(schedule.consultantId);
                        
                        // 디버깅: 상담사별 색상 확인
                        console.log(`🎨 상담사 색상 적용: ${schedule.consultantName} (ID: ${schedule.consultantId}) -> ${eventColor}`);
                        
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

            // 어드민인 경우 모든 상담사의 휴가 데이터 로드
            let vacationEvents = [];
            if (userRole === 'ADMIN' || userRole === 'BRANCH_SUPER_ADMIN') {
                try {
                    const today = new Date();
                    const startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1).toISOString().split('T')[0];
                    const endDate = new Date(today.getFullYear(), today.getMonth() + 2, 0).toISOString().split('T')[0];
                    
                    // 날짜 범위로 휴가 조회 (date 파라미터 제거)
                    const vacationResponse = await fetch(`/api/consultant/vacations`, {
                        method: 'GET',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include'
                    });
                    
                    if (vacationResponse.ok) {
                        const vacationResult = await vacationResponse.json();
                        console.log('🏖️ 어드민 휴가 API 응답:', vacationResult);
                        if (vacationResult.success && vacationResult.data) {
                            // 모든 상담사의 휴가 데이터를 이벤트로 변환
                            Object.entries(vacationResult.data).forEach(([consultantId, consultantVacations]) => {
                                console.log('🏖️ 상담사 휴가 데이터:', consultantId, consultantVacations);
                                Object.entries(consultantVacations).forEach(([date, vacationData]) => {
                                    // 상담사 이름을 휴가 데이터에 추가 (이미 백엔드에서 제공됨)
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

            // 스케줄 이벤트와 휴가 이벤트 합치기
            const allEvents = [...scheduleEvents, ...vacationEvents];
            setEvents(allEvents);
            console.log('📅 모든 이벤트 데이터 로드 완료:', allEvents);
        } catch (error) {
            console.error('스케줄 로드 실패:', error);
        } finally {
            setLoading(false);
        }
    }, [userId, userRole, selectedConsultantId]);

    // 상담사별 색상 상태
    const [consultantColors, setConsultantColors] = useState([]);
    
    // 상담사별 색상 로드 (새로운 디자인 시스템 사용)
    const loadConsultantColors = useCallback(async () => {
        try {
            console.log('🎨 상담사별 색상만 로드 시작');
            const response = await fetch('/api/admin/css-themes/consultant-colors');
            const data = await response.json();
            
            if (data.success && data.colors) {
                setConsultantColors(data.colors);
                console.log('🎨 상담사별 색상 로드 완료:', data.colors);
            } else {
                console.warn('🎨 상담사별 색상 로드 실패, 기본값 사용');
                setConsultantColors([
                    '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
                    '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6366f1'
                ]);
            }
        } catch (error) {
            console.error('🎨 상담사별 색상 로드 오류:', error);
            setConsultantColors([
                '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
                '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6366f1'
            ]);
        }
    }, []);

    // 스케줄 데이터 로드
    useEffect(() => {
        loadConsultantColors(); // 상담사별 색상 로드
        loadSchedules();
        loadScheduleStatusCodes();
        
        // 어드민인 경우 상담사 목록도 로드
        if (userRole === 'ADMIN' || userRole === 'BRANCH_SUPER_ADMIN') {
            loadConsultants();
        }
    }, [loadConsultantColors, loadSchedules, loadScheduleStatusCodes, loadConsultants, userRole, selectedConsultantId]);

    // 상담사 이전 이벤트 감지하여 스케줄 새로고침
    useEffect(() => {
        const handleConsultantTransferred = (event) => {
            console.log('🔄 상담사 이전 감지 - 스케줄 새로고침:', event.detail);
            loadSchedules();
            if (userRole === 'ADMIN' || userRole === 'BRANCH_SUPER_ADMIN') {
                loadConsultants(); // 상담사 목록도 새로고침
            }
        };

        window.addEventListener('consultantTransferred', handleConsultantTransferred);
        
        return () => {
            window.removeEventListener('consultantTransferred', handleConsultantTransferred);
        };
    }, [loadSchedules, loadConsultants, userRole]);

    /**
     * 휴가 데이터를 캘린더 이벤트로 변환
     */
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
                // 종일 휴가 처리
                endDate = new Date(date + 'T23:59:59+09:00');
                title = '🏖️ 하루 종일 휴무';
                backgroundColor = '#F44336';
                allDay = true;
                break;
            default:
                // 기타 휴가 유형
                if (startTime && endTime) {
                    // 시간 정보가 있는 경우
                    startDate.setHours(parseInt(startTime.split(':')[0]), parseInt(startTime.split(':')[1]), 0);
                    endDate = new Date(date + 'T' + endTime + '+09:00');
                    allDay = false;
                } else {
                    // 시간 정보가 없는 경우 하루 종일
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

    /**
     * 상담사별 색상 반환 (새로운 디자인 시스템 사용)
     */
    const getConsultantColor = (consultantId) => {
        console.log(`🎨 getConsultantColor 호출: consultantId=${consultantId}, consultantColors.length=${consultantColors?.length}`);
        
        // 색상 배열이 로드되지 않은 경우 기본 색상 반환
        if (!consultantColors || consultantColors.length === 0) {
            const defaultColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
            const colorIndex = consultantId % defaultColors.length;
            const selectedColor = defaultColors[colorIndex];
            console.log(`🎨 기본 색상 사용: consultantId=${consultantId}, colorIndex=${colorIndex}, color=${selectedColor}`);
            return selectedColor;
        }
        
        // 상담사 ID를 기반으로 일관된 색상 할당
        const colorIndex = consultantId % consultantColors.length;
        const selectedColor = consultantColors[colorIndex];
        
        console.log(`🎨 동적 색상 사용: consultantId=${consultantId}, colorIndex=${colorIndex}, color=${selectedColor}`);
        
        return selectedColor;
    };



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
     * 스케줄 상태에 따른 색상 반환
     */
    const getEventColor = (status) => {
        switch (status) {
            case 'AVAILABLE':
                return '#28a745'; // 초록색 - 가능
            case 'BOOKED':
                return '#007bff'; // 파란색 - 예약됨
            case 'CONFIRMED':
                return '#17a2b8'; // 청록색 - 확정됨
            case 'VACATION':
                return '#ffc107'; // 노란색 - 휴가
            case 'COMPLETED':
                return '#6c757d'; // 회색 - 완료
            case 'CANCELLED':
                return '#dc3545'; // 빨간색 - 취소
            default:
                return '#007bff';
        }
    };

    /**
     * 날짜 클릭 이벤트 핸들러
     */
    const handleDateClick = (info) => {
        console.log('📅 날짜 클릭:', info.dateStr);
        console.log('📅 현재 상태:', { 
            userRole, 
            isDateActionModalOpen, 
            isModalOpen, 
            isVacationModalOpen 
        });
        console.log('📅 UnifiedScheduleComponent 컴포넌트에서 날짜 클릭 처리');
        
        // 과거 날짜인지 확인
        const clickedDate = new Date(info.date);
        const today = new Date();
        today.setHours(0, 0, 0, 0); // 오늘 날짜의 시작 시간으로 설정
        clickedDate.setHours(0, 0, 0, 0); // 클릭한 날짜의 시작 시간으로 설정
        
        const isPastDate = clickedDate < today;
        
        // 상담사는 휴가 등록만 가능
        if (userRole === 'CONSULTANT') {
            if (isPastDate) {
                notificationManager.show('warning', '과거 날짜에는 휴가를 등록할 수 없습니다.');
                return;
            }
            
            setSelectedDate(info.date);
            setSelectedInfo(info);
            console.log('📅 휴가 등록 모달 열기');
            setIsVacationModalOpen(true);
        }
        // 관리자는 스케줄과 휴가 모두 등록 가능
        else if (userRole === 'ADMIN' || userRole === 'BRANCH_SUPER_ADMIN') {
            if (isPastDate) {
                notificationManager.show('warning', '과거 날짜에는 새로운 스케줄을 등록할 수 없습니다. 기존 스케줄을 클릭하여 조회하실 수 있습니다.');
                return;
            }
            
            setSelectedDate(info.date);
            setSelectedInfo(info);
            console.log('📅 DateActionModal 열기 시도 - isDateActionModalOpen을 true로 설정');
            setIsDateActionModalOpen(true);
        } else {
            notificationManager.show('error', '스케줄 생성 권한이 없습니다.');
        }
    };

    /**
     * 스케줄 등록 클릭 핸들러
     */
    const handleScheduleClick = () => {
        console.log('📅 스케줄 등록 클릭');
        setIsDateActionModalOpen(false); // 선택 모달 닫기
        setTimeout(() => {
            setIsModalOpen(true); // 스케줄 모달 열기
        }, 100);
    };

    /**
     * 휴가 등록 클릭 핸들러
     */
    const handleVacationClick = () => {
        console.log('📅 휴가 등록 클릭');
        setIsDateActionModalOpen(false); // 선택 모달 닫기
        setTimeout(() => {
            setIsVacationModalOpen(true); // 휴가 모달 열기
        }, 100);
    };

    /**
     * 이벤트 클릭 이벤트 핸들러 - 바로 상세 모달 표시
     */
    const handleEventClick = (info) => {
        try {
            console.log('📋 이벤트 클릭 시작:', info);
            console.log('📋 이벤트 제목:', info.event.title);
            console.log('📋 이벤트 extendedProps:', info.event.extendedProps);
            console.log('📋 현재 모달 상태 - isDetailModalOpen:', isDetailModalOpen);
            
            const event = info.event;
            console.log('📋 showDetailModal 호출 전');
            showDetailModal(event);
            console.log('📋 showDetailModal 호출 후');
        } catch (error) {
            console.error('❌ 이벤트 클릭 처리 중 오류:', error);
            notificationManager.show('error', '이벤트를 불러오는 중 오류가 발생했습니다.');
        }
    };
    
    
    /**
     * 상세 모달 표시 함수
     */
    const showDetailModal = (event) => {
        try {
            console.log('📋 showDetailModal 시작:', event);
            console.log('📋 event.extendedProps:', event.extendedProps);
            
            // 휴가 이벤트인지 확인
            if (event.extendedProps.type === 'vacation') {
            console.log('🏖️ 휴가 이벤트 클릭');
            
            // 휴가 이벤트용 데이터 설정
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
        
        // 일반 스케줄 이벤트 처리
        console.log('📋 상담 유형 원본:', event.extendedProps.consultationType);
        console.log('👤 이벤트 상담사 정보:', {
            consultantId: event.extendedProps.consultantId,
            consultantName: event.extendedProps.consultantName,
            hasConsultantName: !!event.extendedProps.consultantName,
            allExtendedProps: event.extendedProps
        });
        
        const koreanStatus = event.extendedProps.statusKorean || convertStatusToKorean(event.extendedProps.status);
        const koreanConsultationType = convertConsultationTypeToKorean(event.extendedProps.consultationType);
        
        // 상담사 이름이 없거나 undefined인 경우 처리
        let consultantName = event.extendedProps.consultantName;
        const consultantId = event.extendedProps.consultantId;
        
        if (!consultantName || consultantName === 'undefined' || consultantName === '알 수 없음') {
            if (consultantId && consultantId !== 'undefined') {
                consultantName = `상담사 ${consultantId}`;
            } else {
                consultantName = '상담사 정보 없음';
            }
            console.warn('⚠️ 상담사 이름이 없음, ID로 대체:', consultantName);
        }
        
        // 클라이언트 이름 처리
        let clientName = event.extendedProps.clientName;
        const clientId = event.extendedProps.clientId;
        
        if (!clientName || clientName === 'undefined' || clientName === '알 수 없음') {
            if (clientId && clientId !== 'undefined') {
                clientName = `클라이언트 ${clientId}`;
            } else {
                clientName = '클라이언트 정보 없음';
            }
        }

        console.log('📋 변환된 상담 유형:', koreanConsultationType);
        console.log('👤 최종 상담사 이름:', consultantName);

        // 스케줄 상세 정보 설정
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

        console.log('📋 최종 스케줄 데이터:', scheduleData);
        console.log('📋 모달 열기 전 상태 - isDetailModalOpen:', isDetailModalOpen);
        
        setSelectedSchedule(scheduleData);
        setIsDetailModalOpen(true);
        
        console.log('📋 모달 열기 완료 - isDetailModalOpen:', true);
        } catch (error) {
            console.error('❌ showDetailModal 처리 중 오류:', error);
            notificationManager.show('error', '상세 정보를 불러오는 중 오류가 발생했습니다.');
        }
    };

    /**
     * 기존 예약 정보 조회
     */
    const loadBookedTimes = async (date, consultantId) => {
        try {
            setLoadingAvailableTimes(true);
            console.log('📅 예약 정보 조회 시작:', { date, consultantId });
            
            const response = await fetch(`/api/schedules/available-times/${date}?consultantId=${consultantId || ''}`);
            const data = await response.json();
            
            console.log('📅 API 응답:', { response: response.status, data });
            
            if (data.success) {
                const bookedTimes = data.bookedTimes || [];
                setBookedTimes(bookedTimes);
                console.log('📅 예약된 시간대 설정 완료:', bookedTimes);
                console.log('📅 예약된 시간대 개수:', bookedTimes.length);
            } else {
                console.error('❌ 예약 정보 조회 실패:', data.message);
                setBookedTimes([]);
            }
        } catch (error) {
            console.error('❌ 예약 정보 조회 오류:', error);
            setBookedTimes([]);
        } finally {
            setLoadingAvailableTimes(false);
        }
    };

    /**
     * 시간대 슬롯 생성 (30분 단위)
     */
    const generateTimeSlots = () => {
        const slots = [];
        const startHour = 9;  // 09:00부터
        const endHour = 20;   // 20:00까지
        
        for (let hour = startHour; hour < endHour; hour++) {
            // 30분 단위로 슬롯 생성
            slots.push({
                startTime: `${hour.toString().padStart(2, '0')}:00`,
                endTime: `${hour.toString().padStart(2, '0')}:30`,
                duration: '50분'
            });
            slots.push({
                startTime: `${hour.toString().padStart(2, '0')}:30`,
                endTime: `${(hour + 1).toString().padStart(2, '0')}:00`,
                duration: '50분'
            });
        }
        
        return slots;
    };

    /**
     * 시간대가 예약되어 있는지 확인
     */
    const isTimeSlotBooked = (startTime, endTime) => {
        console.log('🔍 시간 충돌 검사:', { startTime, endTime, bookedTimes });
        
        const isBooked = bookedTimes.some(booked => {
            const bookedStart = booked.startTime;
            const bookedEnd = booked.endTime;
            
            console.log('🔍 예약된 시간대와 비교:', { 
                bookedStart, 
                bookedEnd, 
                startTime, 
                endTime,
                overlap: (startTime < bookedEnd && endTime > bookedStart)
            });
            
            // 시간 겹침 확인
            return (startTime < bookedEnd && endTime > bookedStart);
        });
        
        console.log('🔍 최종 결과:', { startTime, endTime, isBooked });
        return isBooked;
    };

    /**
     * 이벤트 드래그 앤 드롭 핸들러
     */
    const handleEventDrop = async (info) => {
        console.log('🔄 이벤트 이동:', info.event.title);
        
        const event = info.event;
        const newStart = event.start;
        const newEnd = event.end;

        // 이벤트를 원래 위치로 되돌리기
        info.revert();

        // 드래그된 스케줄 데이터 준비
        const scheduleData = {
            id: event.id,
            title: event.title,
            date: newStart.toISOString().split('T')[0],
            startTime: newStart.toTimeString().split(' ')[0].slice(0, 5),
            endTime: newEnd.toTimeString().split(' ')[0].slice(0, 5),
            clientName: event.extendedProps?.clientName || '',
            consultantName: event.extendedProps?.consultantName || '',
            status: event.extendedProps?.status || 'BOOKED',
            description: event.extendedProps?.description || '',
            clientId: event.extendedProps?.clientId,
            consultantId: event.extendedProps?.consultantId
        };

        // 기존 예약 정보 조회
        await loadBookedTimes(scheduleData.date, scheduleData.consultantId);

        // 시간 선택 모달 열기
        setSelectedSchedule(scheduleData);
        setShowTimeSelectionModal(true);
    };

    /**
     * 모달 닫기
     */
    const handleModalClose = () => {
        setIsModalOpen(false);
        setSelectedDate(null);
        setSelectedInfo(null);
    };

    /**
     * 시간 선택 확인 핸들러
     */
    const handleTimeSelectionConfirm = async () => {
        if (!selectedSchedule) return;

        try {
            const response = await fetch(`/api/schedules/${selectedSchedule.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    date: selectedSchedule.date,
                    startTime: selectedSchedule.startTime,
                    endTime: selectedSchedule.endTime
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`스케줄 업데이트 실패: ${response.status} - ${errorData.message || response.statusText}`);
            }

            console.log('✅ 스케줄 시간 변경 완료');
            
            // 모달 닫기
            setShowTimeSelectionModal(false);
            setSelectedSchedule(null);
            
            // 스케줄 목록 새로고침
            loadSchedules();
            
        } catch (error) {
            console.error('❌ 스케줄 시간 변경 실패:', error);
            notificationManager.show({
                message: '스케줄 시간 변경에 실패했습니다.',
                type: 'error',
                duration: 5000
            });
        }
    };

    /**
     * 스케줄 생성 완료 후 콜백
     */
    const handleScheduleCreated = async () => {
        console.log('🔄 스케줄 생성 완료 - 캘린더 새로고침 시작');
        await loadSchedules(); // 스케줄 목록 새로고침
        handleModalClose();
        console.log('✅ 캘린더 새로고침 완료');
    };

    /**
     * 상세 모달 닫기 핸들러
     */
    const handleDetailModalClose = () => {
        setIsDetailModalOpen(false);
        setSelectedSchedule(null);
    };

    /**
     * 스케줄 업데이트 후 처리
     */
    const handleScheduleUpdated = (mode, scheduleData) => {
        if (mode === 'edit') {
            // 드래그 앤 드롭 모드 활성화
            console.log('🔄 드래그 앤 드롭 모드 활성화:', scheduleData);
            // 캘린더에서 해당 이벤트를 드래그 가능한 상태로 변경
            // 또는 드래그 모드 안내 메시지 표시
            notificationManager.info('이제 캘린더에서 이벤트를 드래그하여 시간을 변경할 수 있습니다.');
        } else {
            // 일반적인 새로고침
            loadSchedules();
        }
    };

    /**
     * 강제 새로고침 함수
     */
    const forceRefresh = useCallback(async () => {
        console.log('🔄 강제 새로고침 시작');
        setEvents([]); // 이벤트 초기화
        await loadSchedules(); // 데이터 다시 로드
        console.log('✅ 강제 새로고침 완료');
    }, [loadSchedules]);

    return (
        <>
            <div className="schedule-calendar">
            <div className="calendar-header">
                <h2>📅 스케줄 관리</h2>
                <div className="header-actions">
                    {/* 상담사용 휴가 등록 버튼 */}
                    {userRole === 'CONSULTANT' && (
                        <button 
                            onClick={() => setIsVacationModalOpen(true)}
                            className="vacation-button"
                            title="휴가 등록"
                        >
                            🏖️ 휴가 등록
                        </button>
                    )}
                    
                    {/* 상담사 선택 (어드민/수퍼어드민만) */}
                    {(userRole === 'ADMIN' || userRole === 'BRANCH_SUPER_ADMIN') && (
                        <CustomSelect
                            value={selectedConsultantId}
                            onChange={(value) => {
                                try {
                                    console.log('👤 상담사 선택 변경:', value);
                                    setSelectedConsultantId(value);
                                } catch (error) {
                                    console.error('❌ 상담사 선택 오류:', error);
                                }
                            }}
                            placeholder="👥 전체 상담사"
                            className="consultant-filter-select"
                            loading={loadingConsultants}
                            options={[
                                { value: '', label: '👥 전체 상담사' },
                                ...consultants.map(consultant => ({
                                    value: consultant.id,
                                    label: `👤 ${consultant.name}`
                                }))
                            ]}
                        />
                    )}
                    
                    <button 
                        onClick={forceRefresh}
                        className="refresh-button"
                        title="데이터 강제 새로고침"
                    >
                        🔄 새로고침
                    </button>
                </div>
                <div className="calendar-legend">
                    <div className="legend-section">
                        <div className="legend-title">상담사별 색상</div>
                        <div className="legend-items consultant-legend">
                            {consultants.filter(consultant => 
                                // 활성 상담사이면서 실제 스케줄이 있는 경우만 표시
                                consultant.isActive !== false && 
                                events.some(event => event.extendedProps?.consultantId === consultant.id)
                            ).map((consultant, index) => {
                                const consultantColor = getConsultantColor(consultant.id);
                                return (
                                    <div key={`consultant-${consultant.id}-${index}`} className="legend-item">
                                        <span 
                                            className="legend-color" 
                                            style={{ backgroundColor: consultantColor }}
                                        ></span>
                                        <span>{consultant.name}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                    
                    <div className="legend-section">
                        <div className="legend-title">스케줄 상태</div>
                        <div className="legend-items">
                            {scheduleStatusOptions && scheduleStatusOptions.length > 0 ? (
                                scheduleStatusOptions.map((option, index) => (
                                    <div key={option.value || `status-${index}`} className="legend-item">
                                        <span 
                                            className="legend-color" 
                                            data-bg-color={option.color}
                                        ></span>
                                        <span className="legend-text">
                                            {option.icon && <span className="legend-icon">{option.icon}</span>}
                                            {option.label}
                                        </span>
                                    </div>
                                ))
                            ) : (
                                <div key="loading-status" className="legend-item">
                                    <span className="legend-color" data-bg-color="#e5e7eb"></span>
                                    <span>로딩 중</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {loading && (
                <UnifiedLoading 
                    text="스케줄을 불러오는 중..." 
                    size="large" 
                    variant="default"
                    fullscreen={true}
                />
            )}

            <FullCalendar
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                headerToolbar={{
                    left: 'prev,next today',
                    center: 'title',
                    right: 'dayGridMonth,timeGridWeek,timeGridDay'
                }}
                initialView="dayGridMonth"
                defaultView="dayGridMonth"
                locale="ko"
                selectable={true}
                selectMirror={true}
                dayMaxEvents={false}
                weekends={true}
                events={events}
                dateClick={handleDateClick}
                eventClick={handleEventClick}
                eventDrop={handleEventDrop}
                editable={userRole === 'ADMIN' || userRole === 'BRANCH_SUPER_ADMIN' || userRole === 'BRANCH_ADMIN'}
                droppable={userRole === 'ADMIN' || userRole === 'BRANCH_SUPER_ADMIN' || userRole === 'BRANCH_ADMIN'}
                height="auto"
                slotMinTime="10:00:00"
                slotMaxTime="20:00:00"
                slotDuration="00:30:00"
                scrollTime="10:00:00"
                scrollTimeReset={false}
                allDaySlot={false}
                businessHours={{
                    daysOfWeek: [1, 2, 3, 4, 5], // 월-금
                    startTime: '10:00',
                    endTime: '20:00'
                }}
                expandRows={true}
                stickyHeaderDates={true}
                eventDisplay="block"
                displayEventTime={true}
                displayEventEnd={true}
            />

            {/* 스케줄 생성/수정 모달 */}
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

            {/* 스케줄 상세 정보 모달 */}
            {console.log('🔍 UnifiedScheduleComponent: isDetailModalOpen =', isDetailModalOpen, 'selectedSchedule =', selectedSchedule)}
            {isDetailModalOpen && (
                <ScheduleDetailModal
                    isOpen={isDetailModalOpen}
                    onClose={handleDetailModalClose}
                    scheduleData={selectedSchedule}
                    onScheduleUpdated={handleScheduleUpdated}
                />
            )}


            {/* 날짜 액션 선택 모달 */}
            {console.log('🔍 UnifiedScheduleComponent: isDateActionModalOpen =', isDateActionModalOpen)}
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

            {/* 휴가 등록 모달 */}
            {isVacationModalOpen && (
                <VacationManagementModal
                    isOpen={isVacationModalOpen}
                    onClose={() => setIsVacationModalOpen(false)}
                    selectedConsultant={userRole === 'CONSULTANT' ? { id: userId, name: '나' } : null}
                    userRole={userRole}
                    selectedDate={selectedDate}
                    onVacationUpdated={() => {
                        console.log('휴가 정보가 업데이트되었습니다.');
                        loadSchedules(); // 스케줄 다시 로드
                    }}
                />
            )}

            {/* 시간 선택 모달 */}
            <TimeSelectionModal
                isOpen={showTimeSelectionModal}
                onClose={() => setShowTimeSelectionModal(false)}
                selectedSchedule={selectedSchedule}
                onScheduleUpdate={setSelectedSchedule}
                availableTimes={generateTimeSlots()}
                isTimeSlotBooked={isTimeSlotBooked}
                onConfirm={handleTimeSelectionConfirm}
            />
            </div>
        </>
    );
};

export default UnifiedScheduleComponent;

// CSS 스타일
const styles = `
.schedule-calendar {
    padding: 20px;
    background: #f8fafc;
    min-height: 100vh;
}

.calendar-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    flex-wrap: wrap;
    gap: 15px;
}

.header-actions {
    display: flex;
    gap: 10px;
}

.refresh-button {
    background: #3b82f6;
    color: white;
    border: none;
    border-radius: 6px;
    padding: 8px 16px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
}

.refresh-button:hover {
    background: #2563eb;
    transform: translateY(-1px);
}

.refresh-button:active {
    background: #1d4ed8;
    transform: translateY(0);
}

.vacation-button {
    background: #f59e0b;
    color: white;
    border: none;
    border-radius: 6px;
    padding: 8px 16px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    margin-right: 10px;
}

.vacation-button:hover {
    background: #d97706;
    transform: translateY(-1px);
}

.vacation-button:active {
    background: #b45309;
    transform: translateY(0);
}

.calendar-header h2 {
    color: #1e293b;
    margin: 0;
    font-size: 24px;
    font-weight: 600;
}

.calendar-legend {
    display: flex;
    gap: 30px;
    flex-wrap: wrap;
}

.legend-section {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.legend-title {
    font-size: 14px;
    font-weight: 600;
    color: #475569;
    margin-bottom: 5px;
}

.legend-items {
    display: flex;
    gap: 15px;
    flex-wrap: wrap;
}

.consultant-legend {
    max-width: 400px;
    flex-wrap: wrap;
}

.legend-item {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    color: #64748b;
}

.legend-color {
    width: 12px;
    height: 12px;
    border-radius: 3px;
    flex-shrink: 0;
}

.legend-color.available { background-color: #e5e7eb; }
.legend-color.booked { background-color: #3b82f6; }
.legend-color.in-progress { background-color: #10b981; }
.legend-color.completed { background-color: #6b7280; }
.legend-color.cancelled { background-color: #ef4444; }
.legend-color.blocked { background-color: #f59e0b; }

.loading-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(255, 255, 255, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
}

/* 하드코딩된 로딩 스타일 제거됨 - UnifiedLoading 컴포넌트 사용 */

/* FullCalendar 커스터마이징 */
.fc {
    background: white;
    border-radius: 12px;
    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
    overflow: hidden;
}

.fc-toolbar {
    padding: 20px;
    background: #f8fafc;
    border-bottom: 1px solid #e2e8f0;
}

.fc-toolbar-title {
    font-size: 20px;
    font-weight: 600;
    color: #1e293b;
}

.fc-button {
    background: #3b82f6;
    border: none;
    border-radius: 6px;
    padding: 8px 16px;
    font-size: 14px;
    font-weight: 500;
    color: white;
    transition: all 0.2s;
}

.fc-button:hover {
    background: #2563eb;
    transform: translateY(-1px);
}

.fc-button:active {
    background: #1d4ed8;
    transform: translateY(0);
}

.fc-button-primary:not(:disabled):active,
.fc-button-primary:not(:disabled).fc-button-active {
    background: #1d4ed8;
    border-color: #1d4ed8;
}

.fc-daygrid-event {
    border-radius: 4px;
    border: none;
    padding: 2px 6px;
    font-size: 12px;
    font-weight: 500;
}

.fc-timegrid-event {
    border-radius: 4px;
    border: none;
    padding: 2px 6px;
    font-size: 12px;
    font-weight: 500;
}

.fc-event-title {
    font-weight: 500;
}

.fc-timegrid-slot {
    height: 40px;
}

.fc-timegrid-slot-label {
    font-size: 12px;
    color: #64748b;
}

.fc-daygrid-day-number {
    font-weight: 500;
    color: #374151;
}

.fc-day-today {
    background-color: #fef3c7;
}

.fc-day-today .fc-daygrid-day-number {
    color: #d97706;
    font-weight: 600;
}

/* 툴팁 스타일 */
.event-tooltip {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 9999;
    background: white;
    border: 2px solid #667eea;
    border-radius: 12px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
    padding: 20px;
    max-width: 300px;
    animation: tooltipFadeIn 0.3s ease-out;
}

.tooltip-content h4 {
    margin: 0 0 12px 0;
    color: #667eea;
    font-size: 16px;
    font-weight: 600;
}

.tooltip-content p {
    margin: 'var(--spacing-sm) 0',
    font-size: 14px;
    color: #374151;
}

.tooltip-hint {
    font-style: italic;
    color: #6b7280;
    font-size: 12px;
    margin-top: 12px;
    text-align: center;
}

@keyframes tooltipFadeIn {
    from {
        opacity: 0;
        transform: translate(-50%, -50%) scale(0.9);
    }
    to {
        opacity: 1;
        transform: translate(-50%, -50%) scale(1);
    }
}


/* 반응형 디자인 */
@media (max-width: 768px) {
    .calendar-header {
        flex-direction: column;
        align-items: flex-start;
    }
    
    .calendar-legend {
        width: 100%;
        gap: 20px;
    }
    
    .legend-items {
        gap: 10px;
    }
    
    .consultant-legend {
        max-width: 100%;
    }
    
    .fc-toolbar {
        padding: 15px;
    }
    
    .fc-toolbar-title {
        font-size: 18px;
    }
    
    .fc-button {
        padding: 6px 12px;
        font-size: 12px;
    }
}
`;

// 스타일을 DOM에 추가
if (typeof document !== 'undefined') {
    const styleSheet = document.createElement('style');
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);
}
