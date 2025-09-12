import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import koLocale from '@fullcalendar/core/locales/ko.js';
import SimpleLayout from '../layout/SimpleLayout';
import ClientInfoModal from './ClientInfoModal';
import LoadingSpinner from '../common/LoadingSpinner';
import ConsultationLogModal from './ConsultationLogModal';
import ConsultationLogModalNew from './ConsultationLogModal';
import EventModal from './EventModal';
import VacationModal from './VacationModal';
import { CONSULTATION_DURATIONS, BREAK_TIME_MINUTES } from '../../constants/schedule';
import { useSession } from '../../contexts/SessionContext';
import './ConsultantSchedule.css';



const ConsultantSchedule = () => {
  const navigate = useNavigate();
  const { user, isLoggedIn, isLoading: sessionLoading, hasPermission } = useSession();
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [clients, setClients] = useState([]);
  const [consultationLogs, setConsultationLogs] = useState([]);
  
  // 모달 상태 관리
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [isConsultationLogModalOpen, setIsConsultationLogModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [selectedConsultation, setSelectedConsultation] = useState(null);
  const [clientModalMode, setClientModalMode] = useState('view');
  const [consultationLogModalMode, setConsultationLogModalMode] = useState('add');
  const [isConsultationLogModalNewOpen, setIsConsultationLogModalNewOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [consultationLogCompleteCallback, setConsultationLogCompleteCallback] = useState(null);
  
  // 휴무 관련 상태
  const [isVacationModalOpen, setIsVacationModalOpen] = useState(false);
  const [selectedVacationDate, setSelectedVacationDate] = useState(null);
  const [vacations, setVacations] = useState([]);
  
  const calendarRef = useRef(null);

  // 세션 체크 및 권한 확인
  useEffect(() => {
    if (sessionLoading) {
      console.log('⏳ 세션 로딩 중...');
      return;
    }

    if (!isLoggedIn) {
      console.log('❌ 로그인되지 않음, 로그인 페이지로 이동');
      navigate('/login', { replace: true });
      return;
    }

    // 동적 권한 시스템으로 스케줄 권한 확인
    const checkSchedulePermission = async () => {
      const hasScheduleAccess = await hasPermission('REGISTER_SCHEDULER') || user?.role === 'CONSULTANT';
      
      if (!hasScheduleAccess) {
        console.log('❌ 스케줄 권한 없음, 대시보드로 이동');
        navigate('/dashboard', { replace: true });
        return;
      }
    };
    
    checkSchedulePermission();
  }, [isLoggedIn, sessionLoading, user, navigate]);

  // 사용자 권한 확인
  const userRole = user?.role || 'CONSULTANT';
  const isConsultant = userRole === 'CONSULTANT';
  const isAdmin = userRole === 'ADMIN' || userRole === 'BRANCH_SUPER_ADMIN';

  // 실제 매핑된 내담자 데이터 로드
  useEffect(() => {
    if (!user?.id) {
      console.log('❌ 사용자 ID가 없습니다.');
      return;
    }

    const currentConsultantId = user.id;
    console.log('👤 상담사 ID:', currentConsultantId);

    // 실제 API에서 매핑된 내담자 데이터 가져오기
    const loadMappedClients = async () => {
      try {
        console.log('👤 매핑된 내담자 목록 로드 시작 - 상담사 ID:', currentConsultantId);
        
        const response = await fetch(`/api/admin/mappings/consultant/${currentConsultantId}/clients`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include'
        });

        if (response.ok) {
          const responseData = await response.json();
          console.log('👤 API 응답 데이터:', responseData);
          
          // 백엔드 API 응답 구조: { success: true, data: [...], count: ... }
          const mappingsData = responseData.data || [];
          
          if (!Array.isArray(mappingsData)) {
            console.error('매핑 데이터가 배열이 아닙니다:', mappingsData);
            setClients([]);
            return [];
          }
          
          // 매핑 데이터에서 내담자 정보 추출
          const mappedClients = mappingsData.map((mapping, index) => ({
            id: `client-${mapping.client.id}-${mapping.id}`, // 매핑 ID 포함하여 고유성 보장
            originalId: mapping.client.id,
            name: mapping.client.name,
            email: mapping.client.email,
            phone: mapping.client.phone,
            type: 'client',
            mappingId: mapping.id,
            remainingSessions: mapping.remainingSessions,
            packageName: mapping.packageName,
            paymentStatus: mapping.paymentStatus,
            // 기본값 설정
            age: '0',
            address: '',
            addressDetail: '',
            postalCode: '',
            consultationPurpose: '상담 진행 중',
            consultationHistory: '이전 상담 경험 없음',
            emergencyContact: '',
            emergencyPhone: '',
            notes: '상담 진행 중',
            registrationDate: new Date().toISOString().split('T')[0],
            registeredBy: 'ADMIN_001'
          }));
          
          setClients(mappedClients);
          console.log('👤 매핑된 내담자 목록 로드 완료:', mappedClients);
          
          return mappedClients;
        } else {
          console.error('매핑된 내담자 목록 로드 실패:', response.status, response.statusText);
          setClients([]);
          return [];
        }
      } catch (error) {
        console.error('매핑된 내담자 목록 로드 오류:', error);
        setClients([]);
        return [];
      }
    };

    // 샘플 상담 일지 데이터
    const sampleConsultationLogs = [
      {
        id: '1',
        clientId: '1',
        consultationDate: '2025-08-25',
        startTime: '2025-08-25T09:00:00',
        endTime: '2025-08-25T10:00:00',
        consultationType: '초기상담',
        mainIssues: '직장 스트레스 및 업무 압박감',
        consultationContent: '스트레스 관리 기법 소개, 호흡법 및 이완 훈련 실습',
        clientResponse: '적극적으로 참여하며 호흡법에 관심을 보임',
        progressNotes: '첫 상담으로 신뢰 관계 형성에 중점',
        nextPlan: '스트레스 일기 작성, 정기적인 이완 훈련',
        recommendations: '규칙적인 운동, 충분한 수면, 취미 활동',
        mood: '보통',
        riskAssessment: '낮음',
        notes: '다음 상담에서 더 구체적인 스트레스 원인 파악 예정'
      }
    ];
    setConsultationLogs(sampleConsultationLogs);

    // 내담자 데이터 로드 후 스케줄 데이터 로드
    loadMappedClients().then((mappedClients) => {
      // 실제 스케줄 데이터 로드

      // 실제 스케줄 데이터 로드
      loadEvents();
    });
  }, [user?.id]);

  // 일정 클릭 시 모달 열기 및 팝오버 자동 닫기
  const handleEventClick = (clickInfo) => {
    // 팝오버 자동 닫기
    closeAllPopovers();
    
    // 휴무 이벤트는 클릭해도 아무 동작하지 않음
    if (clickInfo.event.id && clickInfo.event.id.startsWith('vacation-')) {
      console.log('🏖️ 휴무 이벤트 클릭 - 동작 없음');
      return;
    }
    
    setSelectedEvent(clickInfo.event);
    setModalMode('edit');
    setIsModalOpen(true);
  };

  // 일정 우클릭 시 컨텍스트 메뉴 (내담자 정보, 상담 일지 등)
  const handleEventContextMenu = (clickInfo) => {
    clickInfo.jsEvent.preventDefault();
    
    // 팝오버 자동 닫기
    closeAllPopovers();
    
    setSelectedEvent(clickInfo.event);
    
    // 컨텍스트 메뉴 표시 (간단한 버튼으로 구현)
    const event = clickInfo.event;
    if (event.extendedProps.clientId) {
      // 등록된 내담자인 경우
      const client = clients.find(c => c.id === event.extendedProps.clientId);
      if (client) {
        setSelectedClient(client);
        setClientModalMode('view');
        setIsClientModalOpen(true);
      }
    }
  };

  // 모든 팝오버 닫기 함수
  const closeAllPopovers = () => {
    const popoverElements = document.querySelectorAll('.fc-popover');
    popoverElements.forEach(popover => {
      if (popover.style.display !== 'none') {
        popover.style.display = 'none';
      }
    });
  };

  // 휴무 관련 함수들
  const loadVacations = async () => {
    if (!user?.id) {
      console.log('🏖️ 사용자 ID가 없어서 휴무 데이터 로드 건너뜀');
      return;
    }
    
    try {
      console.log('🏖️ 휴무 데이터 로드 시작:', user.id);
      
      const response = await fetch(`/api/consultant/${user.id}/vacation`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });
      
      console.log('🏖️ 휴무 API 응답 상태:', response.status);
      
      if (response.ok) {
        const result = await response.json();
        console.log('🏖️ 휴무 API 응답 데이터:', result);
        if (result.success) {
          setVacations(result.data || []);
          console.log('🏖️ 휴무 데이터 로드 완료:', result.data);
        } else {
          console.error('🏖️ 휴무 API 응답 실패:', result.message);
        }
      } else {
        console.error('🏖️ 휴무 데이터 로드 실패:', response.status);
      }
    } catch (error) {
      console.error('🏖️ 휴무 데이터 로드 오류:', error);
    }
  };

  // 이벤트 로드 함수
  const loadEvents = async () => {
    if (!user?.id) {
      console.log('📅 사용자 ID가 없어서 이벤트 로드 건너뜀');
      return;
    }
    
    console.log('📅 이벤트 로드 시작:', user.id);
    console.log('🔍 현재 사용자 정보:', user);
    
    try {
      // 스케줄 데이터 로드
      const scheduleResponse = await fetch(`/api/schedules/consultant/${user.id}/my-schedules`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });
      
      let scheduleEvents = [];
      if (scheduleResponse.ok) {
        const schedules = await scheduleResponse.json();
        if (schedules && schedules.length > 0) {
          console.log('📅 스케줄 데이터 로드 완료:', schedules);
          
          // 스케줄을 캘린더 이벤트로 변환
          scheduleEvents = schedules.map((schedule, index) => {
            const dateStr = schedule.date;
            const startTimeStr = schedule.startTime;
            const endTimeStr = schedule.endTime;
            
            const startDateTime = new Date(`${dateStr}T${startTimeStr}+09:00`);
            const endDateTime = new Date(`${dateStr}T${endTimeStr}+09:00`);
            
            const client = clients.find(c => c.originalId === schedule.clientId);
            
            return {
              id: `schedule-${schedule.id}`,
              title: schedule.title || '상담',
              start: startDateTime.toISOString(),
              end: endDateTime.toISOString(),
              backgroundColor: index === 0 ? '#4CAF50' : index === 1 ? '#2196F3' : '#FF9800',
              borderColor: index === 0 ? '#4CAF50' : index === 1 ? '#2196F3' : '#FF9800',
              textColor: '#fff',
              extendedProps: {
                scheduleId: schedule.id,
                clientId: schedule.clientId,
                consultantId: schedule.consultantId,
                title: schedule.title,
                description: schedule.description,
                consultationType: schedule.consultationType || '미지정',
                status: schedule.status,
                scheduleType: schedule.scheduleType,
                clientName: client?.name || '미지정',
                notes: schedule.description || ''
              }
            };
          });
        }
      }
      
      // 휴무 데이터 로드 (현재 월 기준으로 3개월 범위)
      const today = new Date();
      const startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1).toISOString().split('T')[0];
      const endDate = new Date(today.getFullYear(), today.getMonth() + 2, 0).toISOString().split('T')[0];
      
      const vacationResponse = await fetch(`/api/consultant/${user.id}/vacation?startDate=${startDate}&endDate=${endDate}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });
      
      let vacationEvents = [];
      if (vacationResponse.ok) {
        const vacationResult = await vacationResponse.json();
        if (vacationResult.success) {
          vacationEvents = convertVacationsToEvents(vacationResult.data || []);
        }
      }
      
      // 스케줄 이벤트와 휴무 이벤트 합치기
      const allEvents = [...scheduleEvents, ...vacationEvents];
      
      setEvents(allEvents);
      console.log('📅 모든 이벤트 데이터 로드 완료:', allEvents);
      
      // 캘린더 강제 새로고침
      if (calendarRef.current) {
        calendarRef.current.getApi().refetchEvents();
        console.log('📅 캘린더 이벤트 새로고침 완료');
      }
    } catch (error) {
      console.error('이벤트 데이터 로드 오류:', error);
      setEvents([]);
    }
  };

  const handleVacationSuccess = (vacationData) => {
    console.log('🏖️ 휴무 설정 성공:', vacationData);
    // 휴무 데이터 새로고침
    loadVacations();
    // 캘린더 이벤트 새로고침
    loadEvents();
    
    // 캘린더 강제 새로고침
    setTimeout(() => {
      if (calendarRef.current) {
        calendarRef.current.getApi().refetchEvents();
        console.log('🏖️ 휴무 설정 후 캘린더 새로고침 완료');
      }
    }, 100);
  };

  const handleVacationClick = (dateStr) => {
    console.log('🏖️ 휴무 설정 클릭:', dateStr);
    setSelectedVacationDate(dateStr);
    setIsVacationModalOpen(true);
  };

  // 휴무를 캘린더 이벤트로 변환
  const convertVacationsToEvents = (vacations) => {
    return vacations.map(vacation => {
      const { date, type, reason, startTime, endTime } = vacation;
      const startDate = new Date(date + 'T00:00:00+09:00');
      let endDate, title, backgroundColor, allDay = true;
      
      switch (type) {
        case 'MORNING':
          endDate = new Date(date + 'T12:00:00+09:00');
          title = '🌅 오전 휴무';
          backgroundColor = '#FF9800';
          break;
        case 'AFTERNOON':
          startDate.setHours(13, 0, 0);
          endDate = new Date(date + 'T18:00:00+09:00');
          title = '🌇 오후 휴무';
          backgroundColor = '#FF5722';
          break;
        case 'MORNING_HALF':
          endDate = new Date(date + 'T11:00:00+09:00');
          title = '🌄 오전 반반차';
          backgroundColor = '#FFC107';
          break;
        case 'AFTERNOON_HALF':
          startDate.setHours(14, 0, 0);
          endDate = new Date(date + 'T16:00:00+09:00');
          title = '🌆 오후 반반차';
          backgroundColor = '#FF7043';
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
        default:
          endDate = new Date(date + 'T23:59:59+09:00');
          title = '🏖️ 하루 종일 휴무';
          backgroundColor = '#F44336';
          break;
      }
      
      return {
        id: `vacation-${vacation.id}`,
        title: title,
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        backgroundColor: backgroundColor,
        borderColor: backgroundColor,
        textColor: '#fff',
        allDay: allDay,
        extendedProps: {
          type: 'vacation',
          vacationType: type,
          reason: reason,
          date: date,
          startTime: startTime,
          endTime: endTime,
          isVacation: true
        }
      };
    });
  };

  // 내담자 정보 관련 함수들
  const handleClientSave = (clientData) => {
    if (clientModalMode === 'add') {
      // 상담사는 새 내담자 등록 불가
      if (isConsultant) {
        alert('상담사는 새 내담자를 등록할 수 없습니다. 관리자에게 문의하세요.');
        return;
      }
      
      const newClient = {
        ...clientData,
        id: Date.now().toString()
      };
      setClients([...clients, newClient]);
    } else {
      // 상담사는 누락된 정보만 수정 가능
      if (isConsultant) {
        const updatedClient = validateConsultantEdit(selectedClient, clientData);
        if (updatedClient) {
          setClients(clients.map(client => 
            client.id === selectedClient.id ? updatedClient : client
          ));
        }
      } else {
        // 관리자는 전체 수정 가능
        setClients(clients.map(client => 
          client.id === selectedClient.id ? { ...client, ...clientData } : client
        ));
      }
    }
  };

  // 상담사 권한으로 내담자 정보 수정 검증
  const validateConsultantEdit = (originalClient, newData) => {
    // 상담사는 할당된 내담자만 수정 가능
    const isAssignedClient = clients.some(client => client.id === originalClient.id);
    if (!isAssignedClient) {
      alert('할당되지 않은 내담자 정보는 수정할 수 없습니다.');
      return null;
    }
    
    const allowedFields = [
      'phone', 'email', 'address', 'addressDetail', 'postalCode',
      'consultationPurpose', 'consultationHistory', 'emergencyContact', 
      'emergencyPhone', 'notes'
    ];
    
    const restrictedFields = ['name', 'age', 'registrationDate', 'registeredBy'];
    
    // 제한된 필드가 변경되었는지 확인
    for (const field of restrictedFields) {
      if (originalClient[field] !== newData[field]) {
        const fieldNames = {
          'name': '이름',
          'age': '나이',
          'registrationDate': '등록일',
          'registeredBy': '등록자'
        };
        alert(`상담사는 내담자의 ${fieldNames[field]}를 수정할 수 없습니다.`);
        return null;
      }
    }
    
    // 허용된 필드만 업데이트
    const updatedClient = { ...originalClient };
    for (const field of allowedFields) {
      if (newData[field] !== undefined) {
        updatedClient[field] = newData[field];
      }
    }
    
    return updatedClient;
  };

  const handleConsultationLogSave = (logData) => {
    if (consultationLogModalMode === 'add') {
      const newLog = {
        ...logData,
        id: Date.now().toString()
      };
      setConsultationLogs([...consultationLogs, newLog]);
    } else {
      setConsultationLogs(consultationLogs.map(log => 
        log.id === selectedConsultation.id ? { ...log, ...logData } : log
      ));
    }
  };

  // 내담자 정보 보기
  const handleViewClientInfo = (clientId) => {
    const client = clients.find(c => c.id === clientId);
    if (client) {
      setSelectedClient(client);
      setClientModalMode('view');
      setIsClientModalOpen(true);
    }
  };

  // 상담 일지 작성
  const handleWriteConsultationLog = (event, onComplete) => {
    // 스케줄 데이터를 상담일지 모달에 전달
    const scheduleData = {
      id: event.id,
      title: event.title,
      startTime: event.start ? (event.start instanceof Date ? event.start.toISOString() : event.start) : null,
      endTime: event.end ? (event.end instanceof Date ? event.end.toISOString() : event.end) : null,
      clientId: event.extendedProps?.clientId,
      consultantId: event.extendedProps?.consultantId,
      consultationType: event.extendedProps?.consultationType,
      status: event.extendedProps?.status,
      notes: event.extendedProps?.notes
    };
    
    setSelectedSchedule(scheduleData);
    setIsConsultationLogModalNewOpen(true);
    
    // 상담일지 작성 완료 콜백 저장
    if (onComplete) {
      setConsultationLogCompleteCallback(() => onComplete);
    }
  };

  // 할당된 내담자 목록 표시
  const showAssignedClientsList = () => {
    if (clients.length === 0) {
      alert('현재 할당된 내담자가 없습니다.');
      return;
    }
    
    const clientList = clients.map(client => 
      `• ${client.name} (${client.age}세) - ${client.consultationPurpose?.substring(0, 30)}...`
    ).join('\n');
    
    alert(`📋 할당된 내담자 목록 (${clients.length}명)\n\n${clientList}`);
  };

  // 날짜 클릭 시 (휴무 설정 옵션 제공)
  const handleDateClick = (arg) => {
    // 팝오버 자동 닫기
    closeAllPopovers();
    
    const dateStr = arg.dateStr;
    const isPast = new Date(dateStr) < new Date();
    
    if (isPast) {
      alert('과거 날짜는 휴무를 설정할 수 없습니다.');
      return;
    }
    
    // 바로 휴무 설정 모달 열기
    handleVacationClick(dateStr);
  };

  // 상담 유형별 색상 매핑
  const getConsultationColor = (consultationType) => {
    const colorMap = {
      '초기상담': { bg: '#4CAF50', border: '#4CAF50' },
      '진행상담': { bg: '#2196F3', border: '#2196F3' },
      '종결상담': { bg: '#FF9800', border: '#FF9800' },
      '긴급상담': { bg: '#f44336', border: '#f44336' }
    };
    return colorMap[consultationType] || { bg: '#4CAF50', border: '#4CAF50' };
  };

  // 일정 추가/수정
  const handleSaveEvent = (eventData) => {
    const colors = getConsultationColor(eventData.consultationType);
    
    if (modalMode === 'add') {
      const newEvent = {
        id: Date.now().toString(),
        title: eventData.title,
        start: eventData.start,
        end: eventData.end,
        backgroundColor: colors.bg,
        borderColor: colors.border,
        textColor: '#fff',
        extendedProps: {
          clientName: eventData.clientName,
          consultationType: eventData.consultationType,
          notes: eventData.notes
        }
      };
      setEvents([...events, newEvent]);
    } else {
      // 일정 수정 로직
      setEvents(events.map(event => 
        event.id === selectedEvent.id 
          ? { 
              ...event, 
              ...eventData,
              backgroundColor: colors.bg,
              borderColor: colors.border
            }
          : event
      ));
    }
    setIsModalOpen(false);
    setSelectedEvent(null);
  };

  // 일정 삭제
  const handleDeleteEvent = () => {
    if (selectedEvent) {
      setEvents(events.filter(event => event.id !== selectedEvent.id));
      setIsModalOpen(false);
      setSelectedEvent(null);
    }
  };

  // 상담 타입별 시간 자동 설정, 휴식시간 적용, 시간 충돌 검사 기능을 추가하여 더 직관적인 일정관리를 구현합니다.
  const handleConsultationTypeChange = (startTime, consultationType, setFormData) => {
    if (startTime && consultationType) {
      const endTime = calculateEndTime(startTime, consultationType);
      setFormData(prev => ({ ...prev, end: endTime }));
    }
  };

  // 시작 시간 변경 시 종료 시간 자동 업데이트
  const handleStartTimeChange = (startTime, consultationType, setFormData) => {
    if (startTime && consultationType) {
      const endTime = calculateEndTime(startTime, consultationType);
      setFormData(prev => ({ ...prev, end: endTime }));
    }
  };

  // 시간 충돌 검사
  const hasTimeConflict = (startTime, endTime, excludeEventId = null) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    
    return events.some(event => {
      if (excludeEventId && event.id === excludeEventId) return false;
      
      const eventStart = new Date(event.start);
      const eventEnd = new Date(event.end);
      
      // 시간이 겹치는지 확인 (휴식시간 포함)
      return (start < eventEnd && end > eventStart);
    });
  };

  // 상담 타입에 따른 종료 시간 자동 계산
  const calculateEndTime = (startTime, consultationType) => {
    const start = new Date(startTime);
    const duration = CONSULTATION_DURATIONS[consultationType] || 50;
    
    // 상담 시간 + 휴식시간
    const end = new Date(start.getTime() + (duration + BREAK_TIME_MINUTES) * 60000);
    return end.toISOString().slice(0, 16);
  };

  return (
    <SimpleLayout>
      <div className="consultant-schedule">
      <div className="schedule-header">
        <h1>📅 상담 일정 관리</h1>
        <p>상담 일정을 관리하고 조회할 수 있습니다.</p>
      </div>

      <div className="schedule-controls">
        <div className="control-buttons">
          
          {/* 관리자만 새 내담자 등록 가능 */}
          {isAdmin && (
            <button 
              className="add-client-btn"
              onClick={() => {
                closeAllPopovers();
                setSelectedClient(null);
                setClientModalMode('add');
                setIsClientModalOpen(true);
              }}
            >
              👤 새 내담자 등록
            </button>
          )}
          
          <button 
            className="view-clients-btn"
            onClick={() => {
              closeAllPopovers();
              // 할당된 내담자 목록 표시
              showAssignedClientsList();
            }}
          >
            📋 내담자 목록 ({clients.length}명)
          </button>
        </div>
      </div>

      <div className="calendar-container">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
          }}
          initialView="dayGridMonth"
          editable={true}
          selectable={true}
          selectMirror={true}
          dayMaxEvents={5}
          moreLinkClick="popover"
          moreLinkContent={(args) => `+${args.num}개 더보기`}
          weekends={true}
          events={events}
          locale={koLocale}
          eventClick={handleEventClick}
          eventDidMount={(info) => {
            // 우클릭 이벤트 추가
            info.el.addEventListener('contextmenu', (e) => {
              e.preventDefault();
              handleEventContextMenu({
                event: info.event,
                jsEvent: e
              });
            });
          }}
          dateClick={handleDateClick}
          select={handleDateClick}
          height="auto"
          eventTimeFormat={{
            hour: '2-digit',
            minute: '2-digit',
            meridiem: false,
            hour12: false
          }}
          slotMinTime="08:00:00"
          slotMaxTime="20:00:00"
          allDaySlot={false}
          slotDuration="00:30:00"
          slotLabelInterval="01:00:00"
          eventDisplay="block"
          eventShortHeight={20}
          eventMinHeight={20}
          eventMinWidth={30}
          eventTextColor="#ffffff"
          eventBackgroundColor="#4CAF50"
          eventBorderColor="#4CAF50"
          eventOverlap={false}
          slotEventOverlap={false}
          ref={calendarRef}
        />
      </div>

            {/* 일정 추가/수정 모달 */}
      {isModalOpen && (
        <EventModal
          event={selectedEvent}
          mode={modalMode}
          userRole="CONSULTANT"
          onSave={handleSaveEvent}
          onDelete={handleDeleteEvent}
          onWriteConsultationLog={handleWriteConsultationLog}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedEvent(null);
            // 모달 닫힐 때 팝오버도 정리
            closeAllPopovers();
          }}
        />
      )}

      {/* 내담자 정보 모달 */}
      {isClientModalOpen && (
        <ClientInfoModal
          client={selectedClient}
          isOpen={isClientModalOpen}
          onClose={() => {
            setIsClientModalOpen(false);
            setSelectedClient(null);
            closeAllPopovers();
          }}
          onSave={handleClientSave}
          mode={clientModalMode}
        />
      )}

      {/* 상담 일지 모달 */}
      {isConsultationLogModalOpen && (
        <ConsultationLogModal
          consultation={selectedConsultation}
          isOpen={isConsultationLogModalOpen}
          onClose={() => {
            setIsConsultationLogModalOpen(false);
            setSelectedConsultation(null);
            closeAllPopovers();
          }}
          onSave={handleConsultationLogSave}
          mode={consultationLogModalMode}
        />
      )}

      {/* 새로운 상담일지 작성 모달 */}
      {isConsultationLogModalNewOpen && (
        <ConsultationLogModalNew
          isOpen={isConsultationLogModalNewOpen}
          onClose={() => {
            setIsConsultationLogModalNewOpen(false);
            setSelectedSchedule(null);
            closeAllPopovers();
          }}
          scheduleData={selectedSchedule}
          onSave={(recordData) => {
            console.log('상담일지 저장됨:', recordData);
            // 상담일지 작성 완료 콜백 실행
            if (consultationLogCompleteCallback) {
              consultationLogCompleteCallback();
              setConsultationLogCompleteCallback(null);
            }
          }}
        />
      )}

      {/* 휴무 설정 모달 */}
      {isVacationModalOpen && (
        <VacationModal
          isOpen={isVacationModalOpen}
          onClose={() => {
            setIsVacationModalOpen(false);
            setSelectedVacationDate(null);
          }}
          onSuccess={handleVacationSuccess}
          selectedDate={selectedVacationDate}
          consultantId={user?.id}
        />
      )}
      </div>
    </SimpleLayout>
  );
};

// 로딩 상태 처리 (컴포넌트 외부로 이동)
const ConsultantScheduleWithLoading = () => {
  const { isLoading: sessionLoading } = useSession();
  
  if (sessionLoading) {
    return (
      <div className="tablet-schedule-page">
        <div className="loading-container">
          <LoadingSpinner 
            text="세션 확인 중..." 
            size="medium"
            className="loading-spinner-inline"
          />
        </div>
      </div>
    );
  }
  
  return <ConsultantSchedule />;
};



export default ConsultantScheduleWithLoading;
