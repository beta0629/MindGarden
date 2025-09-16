import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import koLocale from '@fullcalendar/core/locales/ko.js';
import SimpleLayout from '../layout/SimpleLayout';
import ScheduleModal from './ScheduleModal';
import ScheduleDetailModal from './ScheduleDetailModal';
import VacationManagementModal from '../admin/VacationManagementModal';
import ClientInfoModal from '../consultant/ClientInfoModal';
import ConsultationLogModal from '../consultant/ConsultationLogModal';
import LoadingSpinner from '../common/LoadingSpinner';
import { useSession } from '../../contexts/SessionContext';
import { apiGet } from '../../utils/ajax';
import { getStatusColor, getStatusIcon } from '../../utils/codeHelper';
import { CONSULTATION_DURATIONS, BREAK_TIME_MINUTES } from '../../constants/schedule';
import './ScheduleCalendar.css';

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
  const navigate = useNavigate();
  const { user: sessionUser, isLoggedIn, isLoading: sessionLoading, hasPermission } = useSession();
  
  // 사용자 정보 결정 (prop > session > null)
  const displayUser = propUser || sessionUser;
  const userRole = propUserRole || displayUser?.role || 'CLIENT';
  const userId = propUserId || displayUser?.id;
  
  // 상태 관리
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [clients, setClients] = useState([]);
  const [consultationLogs, setConsultationLogs] = useState([]);
  const [vacations, setVacations] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // 모달 상태 관리
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [isConsultationLogModalOpen, setIsConsultationLogModalOpen] = useState(false);
  const [isVacationModalOpen, setIsVacationModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [selectedConsultation, setSelectedConsultation] = useState(null);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [selectedVacationDate, setSelectedVacationDate] = useState(null);
  
  const calendarRef = useRef(null);

  // 권한 확인 함수들
  const canViewSchedule = async () => {
    return await hasPermission('VIEW_SCHEDULE') || userRole === 'CONSULTANT' || userRole === 'CLIENT';
  };

  const canCreateSchedule = async () => {
    return await hasPermission('REGISTER_SCHEDULER') || userRole === 'CONSULTANT';
  };

  const canManageVacation = async () => {
    return await hasPermission('MANAGE_VACATION') || userRole === 'CONSULTANT';
  };

  const canViewClientInfo = async () => {
    return await hasPermission('VIEW_CLIENT_INFO') || userRole === 'CONSULTANT';
  };

  // 스케줄 데이터 로드
  const loadSchedules = useCallback(async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      const response = await apiGet(`/api/schedules?userId=${userId}&userRole=${userRole}`);
      
      if (response.success) {
        const scheduleEvents = response.data.map(schedule => ({
          id: schedule.id,
          title: schedule.title,
          start: schedule.startTime,
          end: schedule.endTime,
          date: schedule.date,
          allDay: false,
          backgroundColor: getStatusColor(schedule.status),
          borderColor: getStatusColor(schedule.status),
          extendedProps: {
            ...schedule,
            type: 'schedule'
          }
        }));
        
        setEvents(scheduleEvents);
      }
    } catch (error) {
      console.error('스케줄 로드 오류:', error);
    } finally {
      setLoading(false);
    }
  }, [userId, userRole]);

  // 휴가 데이터 로드
  const loadVacations = useCallback(async () => {
    if (!canManageVacation()) return;
    
    try {
      const response = await apiGet('/api/vacations');
      if (response.success) {
        setVacations(response.data);
      }
    } catch (error) {
      console.error('휴가 데이터 로드 오류:', error);
    }
  }, [userRole]);

  // 클라이언트 데이터 로드
  const loadClients = useCallback(async () => {
    if (!canViewClientInfo()) return;
    
    try {
      const response = await apiGet('/api/clients');
      if (response.success) {
        setClients(response.data);
      }
    } catch (error) {
      console.error('클라이언트 데이터 로드 오류:', error);
    }
  }, [userRole]);

  // 초기화
  useEffect(() => {
    if (sessionLoading) return;
    
    const initialize = async () => {
      if (await canViewSchedule()) {
        await Promise.all([
          loadSchedules(),
          loadVacations(),
          loadClients()
        ]);
      }
    };
    
    initialize();
  }, [sessionLoading, loadSchedules, loadVacations, loadClients]);

  // 이벤트 핸들러들
  const handleDateClick = async (info) => {
    if (await canCreateSchedule()) {
      setSelectedEvent(null);
      setModalMode('add');
      setIsModalOpen(true);
    }
  };

  const handleEventClick = async (info) => {
    const event = info.event;
    setSelectedEvent(event);
    setModalMode('view');
    setIsModalOpen(true);
  };

  const handleScheduleCreated = () => {
    loadSchedules();
    setIsModalOpen(false);
  };

  const handleScheduleUpdated = () => {
    loadSchedules();
    setIsModalOpen(false);
  };

  const handleScheduleDeleted = () => {
    loadSchedules();
    setIsModalOpen(false);
  };

  // 권한이 없으면 접근 거부
  if (sessionLoading) {
    return <LoadingSpinner />;
  }

  if (!isLoggedIn) {
    return (
      <div className="text-center p-5">
        <h3>로그인이 필요합니다.</h3>
        <button 
          className="btn btn-primary"
          onClick={() => navigate('/login')}
        >
          로그인하기
        </button>
      </div>
    );
  }

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <SimpleLayout>
      <div className="schedule-container">
        <div className="schedule-header">
          <h2>스케줄 관리</h2>
          <div className="schedule-actions">
            {canCreateSchedule() && (
              <button 
                className="btn btn-primary"
                onClick={() => {
                  setSelectedEvent(null);
                  setModalMode('add');
                  setIsModalOpen(true);
                }}
              >
                <i className="bi bi-plus"></i> 새 스케줄
              </button>
            )}
            {canManageVacation() && (
              <button 
                className="btn btn-outline-secondary"
                onClick={() => setIsVacationModalOpen(true)}
              >
                <i className="bi bi-calendar-x"></i> 휴가 관리
              </button>
            )}
          </div>
        </div>

        <div className="schedule-content">
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
            initialView="timeGridWeek"
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
            }}
            locale={koLocale}
            events={events}
            dateClick={handleDateClick}
            eventClick={handleEventClick}
            height="auto"
            slotMinTime="09:00:00"
            slotMaxTime="22:00:00"
            businessHours={{
              daysOfWeek: [1, 2, 3, 4, 5, 6],
              startTime: '09:00',
              endTime: '22:00'
            }}
            eventDisplay="block"
            dayMaxEvents={3}
            moreLinkClick="popover"
          />
        </div>

        {/* 모달들 */}
        {isModalOpen && (
          <ScheduleModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            selectedDate={selectedEvent?.start}
            selectedInfo={selectedEvent?.extendedProps}
            userRole={userRole}
            userId={userId}
            onScheduleCreated={handleScheduleCreated}
            onScheduleUpdated={handleScheduleUpdated}
            onScheduleDeleted={handleScheduleDeleted}
          />
        )}

        {isVacationModalOpen && canManageVacation() && (
          <VacationManagementModal
            isOpen={isVacationModalOpen}
            onClose={() => setIsVacationModalOpen(false)}
            consultantId={userId}
            onVacationUpdated={loadVacations}
          />
        )}

        {isClientModalOpen && canViewClientInfo() && (
          <ClientInfoModal
            isOpen={isClientModalOpen}
            onClose={() => setIsClientModalOpen(false)}
            client={selectedClient}
            mode={clientModalMode}
          />
        )}

        {isConsultationLogModalOpen && (
          <ConsultationLogModal
            isOpen={isConsultationLogModalOpen}
            onClose={() => setIsConsultationLogModalOpen(false)}
            schedule={selectedSchedule}
            onConsultationLogCreated={loadSchedules}
          />
        )}
      </div>
    </SimpleLayout>
  );
};

export default UnifiedScheduleComponent;
