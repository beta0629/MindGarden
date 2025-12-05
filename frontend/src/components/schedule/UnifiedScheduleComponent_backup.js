import React, { useState, useEffect, useCallback } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import ScheduleModal from './ScheduleModal';
import ScheduleDetailModal from './ScheduleDetailModal';
import VacationManagementModal from '../admin/VacationManagementModal';
import { apiGet } from '../../utils/ajax';
import { getStatusColor, getStatusIcon } from '../../utils/codeHelper';
import './ScheduleCalendar.css';

 * FullCalendar 기반 스케줄 관리 컴포넌트
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
const ScheduleCalendar = ({ userRole, userId }) => {
    const [events, setEvents] = useState([]);
    const [selectedDate, setSelectedDate] = useState(null);
    const [selectedInfo, setSelectedInfo] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [isVacationModalOpen, setIsVacationModalOpen] = useState(false);
    const [isDateActionModalOpen, setIsDateActionModalOpen] = useState(false);
    const [selectedSchedule, setSelectedSchedule] = useState(null);
    const [loading, setLoading] = useState(false);
    const [scheduleStatusOptions, setScheduleStatusOptions] = useState([]);
    const [loadingCodes, setLoadingCodes] = useState(false);
    
    const [consultants, setConsultants] = useState([]);
    const [selectedConsultantId, setSelectedConsultantId] = useState('');
    const [loadingConsultants, setLoadingConsultants] = useState(false);

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
                // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
                { value: 'BOOKED', label: '예약됨', icon: '📅', color: 'var(--mg-primary-500)', description: '예약된 일정' },
                // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
                { value: 'CONFIRMED', label: '확정됨', icon: '✅', color: 'var(--mg-purple-500)', description: '확정된 일정' },
                // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
                { value: 'IN_PROGRESS', label: '진행중', icon: '🔄', color: 'var(--mg-warning-500)', description: '진행 중인 일정' },
                // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
                { value: 'COMPLETED', label: '완료됨', icon: '🎉', color: '#059669', description: '완료된 일정' },
                // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
                { value: 'CANCELLED', label: '취소됨', icon: '❌', color: 'var(--mg-error-500)', description: '취소된 일정' },
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

     * 상태값을 한글로 변환 (동적 로드)
     */
    const convertStatusToKorean = (status) => {
        const statusOption = scheduleStatusOptions.find(option => option.value === status);
        return statusOption ? statusOption.label : status || "알 수 없음";
    };

     * 스케줄 데이터 로드
     */
    const loadSchedules = useCallback(async () => {
        setLoading(true);
        try {
            console.log('📅 스케줄 로드 시작:', { userId, userRole, selectedConsultantId });
            
            let url = `/api/schedules?userId=${userId}&userRole=${userRole}`;
            
            if (userRole === 'ADMIN' || userRole === 'BRANCH_SUPER_ADMIN' || userRole === 'HQ_MASTER' || userRole === 'SUPER_HQ_ADMIN') {
                url = '/api/schedules/admin';
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

            let vacationEvents = [];
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
        loadSchedules();
        loadScheduleStatusCodes();
        
        if (userRole === 'ADMIN' || userRole === 'BRANCH_SUPER_ADMIN') {
            loadConsultants();
        }
    }, [loadSchedules, loadScheduleStatusCodes, loadConsultants, userRole, selectedConsultantId]);

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
                backgroundColor = 'var(--mg-warning-500)';
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

     * 상담사별 색상 반환
     */
    const getConsultantColor = (consultantId) => {
        const colors = [
            'var(--mg-primary-500)', // 파란색
            'var(--mg-success-500)', // 녹색
            'var(--mg-warning-500)', // 주황색
            'var(--mg-error-500)', // 빨간색
            'var(--mg-purple-500)', // 보라색
            '#06b6d4', // 청록색
            '#84cc16', // 라임색
            '#f97316', // 오렌지색
            '#ec4899', // 핑크색
            '#6366f1'  // 인디고색
        ];
        
        const colorIndex = consultantId % colors.length;
        return colors[colorIndex];
    };



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

     * 스케줄 상태에 따른 색상 반환
     */
    const getEventColor = (status) => {
        switch (status) {
            // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
            case 'BOOKED':
                return 'var(--mg-primary-500)'; // 파란색 - 예약됨
            // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
            case 'IN_PROGRESS':
                return 'var(--mg-success-500)'; // 초록색 - 진행중
            // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
            case 'COMPLETED':
                return 'var(--mg-secondary-500)'; // 회색 - 완료
            // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
            case 'CANCELLED':
                return 'var(--mg-error-500)'; // 빨간색 - 취소
            case 'BLOCKED':
                return 'var(--mg-warning-500)'; // 노란색 - 차단
            default:
                return 'var(--mg-primary-500)';
        }
    };

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
        console.log('📅 ScheduleCalendar 컴포넌트에서 날짜 클릭 처리');
        
        const clickedDate = new Date(info.date);
        const today = new Date();
        today.setHours(0, 0, 0, 0); // 오늘 날짜의 시작 시간으로 설정
        clickedDate.setHours(0, 0, 0, 0); // 클릭한 날짜의 시작 시간으로 설정
        
        const isPastDate = clickedDate < today;
        
        if (userRole === 'ADMIN' || userRole === 'BRANCH_SUPER_ADMIN' || userRole === 'CONSULTANT') {
            if (isPastDate) {
                alert('과거 날짜에는 새로운 스케줄을 등록할 수 없습니다.\n기존 스케줄을 클릭하여 조회하실 수 있습니다.');
                return;
            }
            
            setSelectedDate(info.date);
            setSelectedInfo(info);
            console.log('📅 DateActionModal 열기 시도 - isDateActionModalOpen을 true로 설정');
            setIsDateActionModalOpen(true);
        } else {
            alert('스케줄 생성 권한이 없습니다.');
        }
    };

     * 스케줄 등록 클릭 핸들러
     */
    const handleScheduleClick = () => {
        console.log('📅 스케줄 등록 클릭');
        setIsDateActionModalOpen(false); // 선택 모달 닫기
        setTimeout(() => {
            setIsModalOpen(true); // 스케줄 모달 열기
        }, 100);
    };

     * 휴가 등록 클릭 핸들러
     */
    const handleVacationClick = () => {
        console.log('📅 휴가 등록 클릭');
        setIsDateActionModalOpen(false); // 선택 모달 닫기
        setTimeout(() => {
            setIsVacationModalOpen(true); // 휴가 모달 열기
        }, 100);
    };

     * 기존 이벤트 클릭 이벤트 핸들러
     */
    const handleEventClick = (info) => {
        console.log('📋 이벤트 클릭:', info.event.title);
        console.log('📋 이벤트 extendedProps:', info.event.extendedProps);
        
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
        
        console.log('📋 상담 유형 원본:', event.extendedProps.consultationType);
        console.log('👤 이벤트 상담사 정보:', {
            consultantId: event.extendedProps.consultantId,
            consultantName: event.extendedProps.consultantName,
            hasConsultantName: !!event.extendedProps.consultantName,
            allExtendedProps: event.extendedProps
        });
        
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
            console.warn('⚠️ 상담사 이름이 없음, ID로 대체:', consultantName);
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

        console.log('📋 변환된 상담 유형:', koreanConsultationType);
        console.log('👤 최종 상담사 이름:', consultantName);

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

     * 이벤트 드래그 앤 드롭 핸들러
     */
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

     * 모달 닫기
     */
    const handleModalClose = () => {
        setIsModalOpen(false);
        setSelectedDate(null);
        setSelectedInfo(null);
    };

     * 스케줄 생성 완료 후 콜백
     */
    const handleScheduleCreated = async () => {
        console.log('🔄 스케줄 생성 완료 - 캘린더 새로고침 시작');
        await loadSchedules(); // 스케줄 목록 새로고침
        handleModalClose();
        console.log('✅ 캘린더 새로고침 완료');
    };

     * 상세 모달 닫기 핸들러
     */
    const handleDetailModalClose = () => {
        setIsDetailModalOpen(false);
        setSelectedSchedule(null);
    };

     * 스케줄 업데이트 후 처리
     */
    const handleScheduleUpdated = () => {
        loadSchedules(); // 스케줄 목록 새로고침
    };

     * 강제 새로고침 함수
     */
    const forceRefresh = useCallback(async () => {
        console.log('🔄 강제 새로고침 시작');
        setEvents([]); // 이벤트 초기화
        await loadSchedules(); // 데이터 다시 로드
        console.log('✅ 강제 새로고침 완료');
    }, [loadSchedules]);

    return (
        <div className="schedule-calendar">
            <div className="calendar-header">
                <h2>📅 스케줄 관리</h2>
                <div className="header-actions">
                    {/* 상담사 선택 (어드민/수퍼어드민만) */}
                    {(userRole === 'ADMIN' || userRole === 'BRANCH_SUPER_ADMIN') && (
                        <select
                            value={selectedConsultantId}
                            onChange={(e) => {
                                try {
                                    console.log('👤 상담사 선택 변경:', e.target.value);
                                    setSelectedConsultantId(e.target.value);
                                } catch (error) {
                                    console.error('❌ 상담사 선택 오류:', error);
                                }
                            }}
                            className="consultant-filter-select"
                        >
                            <option value="">👥 전체 상담사</option>
                            {loadingConsultants ? (
                                <option disabled>상담사 목록을 불러오는 중...</option>
                            ) : (
                                consultants.map(consultant => (
                                    <option key={consultant.id} value={consultant.id}>
                                        👤 {consultant.name}
                                    </option>
                                ))
                            )}
                        </select>
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
                                consultant.isActive !== false && 
                                events.some(event => event.extendedProps?.consultantId === consultant.id)
                            ).map((consultant, index) => (
                                <div key={`consultant-${consultant.id}-${index}`} className="legend-item">
                                    <span 
                                        className="legend-color"
                                    ></span>
                                    <span>{consultant.name}</span>
                                </div>
                            ))}
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
                                            style={{ backgroundColor: option.color }}
                                        ></span>
                                        <span className="legend-text">
                                            {option.icon && <span className="legend-icon">{option.icon}</span>}
                                            {option.label}
                                        </span>
                                    </div>
                                ))
                            ) : (
                                <div key="loading-status" className="legend-item">
                                    <span className="legend-color" style={{ backgroundColor: '#e5e7eb' }}></span>
                                    <span>로딩 중</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {loading && (
                <div className="mg-loading">로딩중...</div>
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
                dayMaxEvents={true}
                weekends={true}
                events={events}
                dateClick={handleDateClick}
                eventClick={handleEventClick}
                eventDrop={handleEventDrop}
                editable={userRole === 'ADMIN' || userRole === 'BRANCH_SUPER_ADMIN'}
                droppable={userRole === 'ADMIN' || userRole === 'BRANCH_SUPER_ADMIN'}
                height="auto"
                slotMinTime="08:00:00"
                slotMaxTime="20:00:00"
                slotDuration="00:30:00"
                scrollTime="09:00:00"
                scrollTimeReset={false}
                allDaySlot={false}
                businessHours={{
                    daysOfWeek: [1, 2, 3, 4, 5], // 월-금
                    startTime: '09:00',
                    endTime: '18:00'
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
            {isDetailModalOpen && (
                <ScheduleDetailModal
                    isOpen={isDetailModalOpen}
                    onClose={handleDetailModalClose}
                    scheduleData={selectedSchedule}
                    onScheduleUpdated={handleScheduleUpdated}
                />
            )}

            {/* 날짜 액션 선택 모달 - 인라인 */}
            {isDateActionModalOpen && (
                console.log('📅 인라인 모달 렌더링 중...', { isDateActionModalOpen, selectedDate, userRole }),
                <div 
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'var(--mg-overlay)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 10000
                    }}
                    onClick={() => setIsDateActionModalOpen(false)}
                >
                    <div 
                        style={{
                            background: 'white',
                            borderRadius: '16px',
                            padding: '24px',
                            maxWidth: '400px',
                            width: '90%',
                            boxShadow: '0 20px 40px var(--mg-shadow-medium)'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                            <h3 style={{ margin: '0 0 8px 0', color: '#2c3e50' }}>
                                📅 {selectedDate ? selectedDate.toLocaleDateString('ko-KR', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                    weekday: 'long'
                                }) : ''}
                            </h3>
                            <p style={{ margin: 0, color: 'var(--mg-secondary-500)' }}>원하는 작업을 선택하세요</p>
                        </div>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <button 
                                onClick={handleScheduleClick}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    padding: '16px',
                                    border: '2px solid #e9ecef',
                                    borderRadius: '8px',
                                    background: 'white',
                                    cursor: 'pointer',
                                    width: '100%',
                                    textAlign: 'left',
                                    transition: 'all 0.3s ease'
                                }}
                                onMouseOver={(e) => {
                                    e.target.style.borderColor = 'var(--mg-primary-500)';
                                    e.target.style.background = '#f8f9ff';
                                }}
                                onMouseOut={(e) => {
                                    e.target.style.borderColor = '#e9ecef';
                                    e.target.style.background = 'white';
                                }}
                            >
                                <span style={{ fontSize: 'var(--font-size-xxl)', marginRight: '12px' }}>📋</span>
                                <div>
                                    <div style={{ fontWeight: '600', marginBottom: '4px' }}>일정 등록</div>
                                    <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--mg-secondary-500)' }}>상담 일정을 등록합니다</div>
                                </div>
                            </button>
                            
                            {(userRole === 'ADMIN' || userRole === 'BRANCH_SUPER_ADMIN') && (
                                <button 
                                    onClick={handleVacationClick}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        padding: '16px',
                                        border: '2px solid #e9ecef',
                                        borderRadius: '8px',
                                        background: 'white',
                                        cursor: 'pointer',
                                        width: '100%',
                                        textAlign: 'left',
                                        transition: 'all 0.3s ease'
                                    }}
                                    onMouseOver={(e) => {
                                        e.target.style.borderColor = 'var(--mg-warning-500)';
                                        e.target.style.background = '#fffbf0';
                                    }}
                                    onMouseOut={(e) => {
                                        e.target.style.borderColor = '#e9ecef';
                                        e.target.style.background = 'white';
                                    }}
                                >
                                    <span style={{ fontSize: 'var(--font-size-xxl)', marginRight: '12px' }}>🏖️</span>
                                    <div>
                                        <div style={{ fontWeight: '600', marginBottom: '4px' }}>휴가 등록</div>
                                        <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--mg-secondary-500)' }}>상담사의 휴가를 등록합니다</div>
                                    </div>
                                </button>
                            )}
                        </div>
                        
                        <div style={{ textAlign: 'center', marginTop: '24px' }}>
                            <button 
                                onClick={() => setIsDateActionModalOpen(false)}
                                style={{
                                    background: 'var(--mg-secondary-500)',
                                    color: 'white',
                                    border: 'none',
                                    padding: '12px 24px',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease'
                                }}
                                onMouseOver={(e) => {
                                    e.target.style.background = '#5a6268';
                                    e.target.style.transform = 'translateY(-1px)';
                                }}
                                onMouseOut={(e) => {
                                    e.target.style.background = 'var(--mg-secondary-500)';
                                    e.target.style.transform = 'translateY(0)';
                                }}
                            >
                                취소
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 휴가 등록 모달 */}
            {isVacationModalOpen && (
                <VacationManagementModal
                    isOpen={isVacationModalOpen}
                    onClose={() => setIsVacationModalOpen(false)}
                    selectedConsultant={null}
                    userRole={userRole}
                    selectedDate={selectedDate}
                    onVacationUpdated={() => {
                        console.log('휴가 정보가 업데이트되었습니다.');
                        loadSchedules(); // 스케줄 다시 로드
                    }}
                />
            )}
        </div>
    );
};

export default ScheduleCalendar;

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
    background: var(--mg-primary-500);
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
.legend-color.booked { background-color: var(--mg-primary-500); }
.legend-color.in-progress { background-color: var(--mg-success-500); }
.legend-color.completed { background-color: #6b7280; }
.legend-color.cancelled { background-color: var(--mg-error-500); }
.legend-color.blocked { background-color: var(--mg-warning-500); }

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


.fc {
    background: white;
    border-radius: 12px;
    box-shadow: 0 1px 3px 0 var(--mg-shadow-light);
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
    background: var(--mg-primary-500);
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

if (typeof document !== 'undefined') {
    const styleSheet = document.createElement('style');
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);
}
