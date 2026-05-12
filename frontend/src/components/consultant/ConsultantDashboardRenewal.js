/**
 * ConsultantDashboardRenewal — 상담사 대시보드 리뉴얼
 *
 * ConsultantAppShell 위에 배치. 오늘 스케줄, 미작성 일지 알림,
 * 긴급 내담자, 빠른 액션 바를 카드형 UI로 구성.
 *
 * @author MindGarden
 * @since 2026-05-12
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar, FileText, Clock, MessageSquare,
  AlertTriangle, ChevronRight, RefreshCw,
  CalendarPlus, Settings
} from 'lucide-react';
import { useSession } from '../../contexts/SessionContext';
import TenantAwareApiClient from '../../utils/TenantAwareApiClient';
import './ConsultantDashboardRenewal.css';

const API_ENDPOINTS = {
  DASHBOARD: '/api/v1/consultants',
  SCHEDULES: '/api/v1/schedules',
  RECORDS: '/api/v1/consultants',
};

const SCHEDULE_STATUS = {
  ACTIVE: 'ACTIVE',
  WAITING: 'WAITING',
  COMPLETED: 'COMPLETED',
};

const getAccentClass = (status) => {
  switch (status) {
    case SCHEDULE_STATUS.COMPLETED: return 'cr-schedule-card__accent--completed';
    case SCHEDULE_STATUS.WAITING: return 'cr-schedule-card__accent--waiting';
    default: return '';
  }
};

const formatTime = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false });
};

const getTimeRange = (start, end) => {
  return `${formatTime(start)} - ${formatTime(end)}`;
};

const getCountdown = (startTime) => {
  if (!startTime) return '';
  const now = new Date();
  const start = new Date(startTime);
  const diff = start - now;
  if (diff <= 0) return '진행 중';
  const hours = Math.floor(diff / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  if (hours > 0) return `${hours}시간 ${minutes}분 후`;
  return `${minutes}분 후`;
};

const getInitials = (name) => {
  if (!name) return '?';
  return name.charAt(0);
};

const SkeletonDashboard = () => (
  <div className="cr-dashboard" aria-busy="true" aria-label="로딩 중">
    <div className="cr-skeleton cr-skeleton--greeting" />
    <div className="cr-dashboard__section">
      <div className="cr-skeleton cr-skeleton--card" />
      <div className="cr-skeleton cr-skeleton--card" />
    </div>
    <div className="cr-quick-actions">
      <div className="cr-skeleton cr-skeleton--action" />
      <div className="cr-skeleton cr-skeleton--action" />
      <div className="cr-skeleton cr-skeleton--action" />
    </div>
  </div>
);

const EmptySchedule = ({ onAction }) => (
  <div className="cr-empty-state">
    <Calendar size={48} className="cr-empty-state__icon" />
    <p className="cr-empty-state__text">오늘 예정된 상담이 없습니다</p>
    <button className="cr-empty-state__cta" onClick={onAction} type="button">
      일정 추가하기
    </button>
  </div>
);

const ErrorState = ({ message, onRetry }) => (
  <div className="cr-error" role="alert">
    <AlertTriangle size={40} className="cr-error__icon" />
    <p className="cr-error__text">{message}</p>
    <button className="cr-error__retry" onClick={onRetry} type="button">
      <RefreshCw size={16} /> 다시 시도
    </button>
  </div>
);

const ScheduleCard = ({ schedule, onOpenLog, onDetail }) => {
  const timeRange = getTimeRange(schedule.startTime, schedule.endTime);
  const countdown = getCountdown(schedule.startTime);
  const clientName = schedule.clientName || schedule.userName || '내담자';
  const statusClass = getAccentClass(schedule.status);
  const sessionType = schedule.sessionType || schedule.consultationType || '';

  return (
    <article
      className="cr-schedule-card"
      onClick={() => onDetail?.(schedule)}
      role="button"
      tabIndex={0}
      aria-label={`${timeRange} ${clientName} 상담`}
    >
      <div className={`cr-schedule-card__accent ${statusClass}`} />
      <div className="cr-schedule-card__body">
        <span className="cr-schedule-card__time">{timeRange}</span>
        <div className="cr-schedule-card__client">
          <span className="cr-schedule-card__avatar" aria-hidden="true">
            {getInitials(clientName)}
          </span>
          <span className="cr-schedule-card__client-name">{clientName}</span>
        </div>
        {sessionType && (
          <span className="cr-schedule-card__tag">{sessionType}</span>
        )}
        {countdown && (
          <span className="cr-schedule-card__countdown">{countdown}</span>
        )}
      </div>
      <div className="cr-schedule-card__actions" onClick={(e) => e.stopPropagation()}>
        {schedule.status !== SCHEDULE_STATUS.COMPLETED && (
          <button
            className="cr-schedule-card__action-btn"
            onClick={() => onOpenLog?.(schedule)}
            type="button"
          >
            일지 작성
          </button>
        )}
      </div>
    </article>
  );
};

const UrgentClientCard = ({ client, onClick }) => (
  <article
    className="cr-urgent-card"
    onClick={() => onClick?.(client)}
    role="button"
    tabIndex={0}
    aria-label={`긴급 내담자: ${client.clientName || client.name}`}
  >
    <span className="cr-urgent-card__avatar" aria-hidden="true">
      {getInitials(client.clientName || client.name)}
    </span>
    <div className="cr-urgent-card__info">
      <div className="cr-urgent-card__name">{client.clientName || client.name}</div>
      <div className="cr-urgent-card__reason">{client.reason || client.alertMessage || '위험 지표 감지'}</div>
    </div>
    <AlertTriangle size={20} className="cr-urgent-card__indicator" />
  </article>
);

const QuickActionButton = ({ icon: Icon, label, onClick }) => (
  <button className="cr-quick-action" onClick={onClick} type="button">
    <div className="cr-quick-action__icon">
      <Icon size={22} />
    </div>
    <span className="cr-quick-action__label">{label}</span>
  </button>
);

const ConsultantDashboardRenewal = () => {
  const { user, isLoading: sessionLoading } = useSession();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [todaySchedules, setTodaySchedules] = useState([]);
  const [incompleteCount, setIncompleteCount] = useState(0);
  const [urgentClients, setUrgentClients] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const userName = user?.name || user?.username || '선생님';

  const fetchDashboardData = useCallback(async () => {
    if (!user?.id) return;
    try {
      setError(null);
      const today = new Date().toISOString().split('T')[0];

      const [schedulesRes, recordsRes] = await Promise.allSettled([
        TenantAwareApiClient.get(`${API_ENDPOINTS.SCHEDULES}`, {
          consultantId: user.id,
          startDate: today,
          endDate: today,
        }),
        TenantAwareApiClient.get(
          `${API_ENDPOINTS.RECORDS}/${user.id}/consultation-records`,
          { status: 'PENDING' }
        ),
      ]);

      if (schedulesRes.status === 'fulfilled') {
        const schedules = Array.isArray(schedulesRes.value)
          ? schedulesRes.value
          : schedulesRes.value?.data || schedulesRes.value?.content || [];
        const sorted = schedules.sort(
          (a, b) => new Date(a.startTime) - new Date(b.startTime)
        );
        setTodaySchedules(sorted);
      }

      if (recordsRes.status === 'fulfilled') {
        const records = recordsRes.value;
        if (typeof records === 'number') {
          setIncompleteCount(records);
        } else if (Array.isArray(records)) {
          setIncompleteCount(records.length);
        } else if (records?.totalElements != null) {
          setIncompleteCount(records.totalElements);
        } else if (records?.count != null) {
          setIncompleteCount(records.count);
        }
      }

      try {
        const urgentRes = await TenantAwareApiClient.get(
          `${API_ENDPOINTS.DASHBOARD}/${user.id}/urgent-clients`
        );
        const urgents = Array.isArray(urgentRes) ? urgentRes : urgentRes?.data || [];
        setUrgentClients(urgents);
      } catch {
        setUrgentClients([]);
      }
    } catch (err) {
      console.error('[대시보드] 데이터 로드 실패:', err);
      setError('대시보드 데이터를 불러올 수 없습니다.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!sessionLoading && user?.id) {
      fetchDashboardData();
    } else if (!sessionLoading) {
      setLoading(false);
    }
  }, [sessionLoading, user?.id, fetchDashboardData]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTodaySchedules((prev) => [...prev]);
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const handleOpenLog = (schedule) => {
    navigate(`/consultant/consultation-record/${schedule.id || schedule.consultationId}`);
  };

  const handleScheduleDetail = (schedule) => {
    navigate('/consultant/schedule');
  };

  const handleGoToRecords = () => {
    navigate('/consultant/consultation-records');
  };

  const handleGoToClient = (client) => {
    navigate(`/consultant/client/${client.clientId || client.id}`);
  };

  const quickActions = [
    { icon: CalendarPlus, label: '일정 추가', action: () => navigate('/consultant/schedule') },
    { icon: FileText, label: '일지 작성', action: () => navigate('/consultant/consultation-records') },
    { icon: MessageSquare, label: '메시지', action: () => navigate('/consultant/messages') },
    { icon: Settings, label: '근무 설정', action: () => navigate('/consultant/availability') },
  ];

  if (sessionLoading || loading) {
    return <SkeletonDashboard />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={handleRefresh} />;
  }

  return (
    <div className="cr-dashboard">
      {refreshing && (
        <div className="cr-pull-indicator" aria-live="polite">
          <RefreshCw size={16} /> 새로고침 중...
        </div>
      )}

      {/* 인사 섹션 */}
      <section className="cr-dashboard__greeting" aria-label="인사">
        <div className="cr-dashboard__greeting-name">
          안녕하세요, {userName} 선생님!
        </div>
        <div className="cr-dashboard__greeting-subtitle">
          오늘 {todaySchedules.length}건의 상담이 예정되어 있습니다.
        </div>
      </section>

      {/* 미작성 일지 알림 */}
      {incompleteCount > 0 && (
        <div
          className="cr-dashboard__alert"
          onClick={handleGoToRecords}
          role="button"
          tabIndex={0}
          aria-label={`미작성 일지 ${incompleteCount}건`}
        >
          <AlertTriangle size={20} className="cr-dashboard__alert-icon" />
          <span className="cr-dashboard__alert-text">
            미작성 일지 <strong>{incompleteCount}건</strong>이 있습니다.
          </span>
          <span className="cr-dashboard__alert-badge">{incompleteCount}</span>
          <ChevronRight size={18} className="cr-dashboard__alert-arrow" />
        </div>
      )}

      {/* 오늘의 스케줄 */}
      <section className="cr-dashboard__section" aria-label="오늘의 스케줄">
        <div className="cr-dashboard__section-header">
          <h2 className="cr-dashboard__section-title">
            <Clock size={20} />
            오늘의 스케줄
          </h2>
          <button
            className="cr-dashboard__section-link"
            onClick={() => navigate('/consultant/schedule')}
            type="button"
          >
            전체 보기
          </button>
        </div>
        {todaySchedules.length === 0 ? (
          <EmptySchedule onAction={() => navigate('/consultant/schedule')} />
        ) : (
          todaySchedules.map((schedule) => (
            <ScheduleCard
              key={schedule.id || schedule.scheduleId}
              schedule={schedule}
              onOpenLog={handleOpenLog}
              onDetail={handleScheduleDetail}
            />
          ))
        )}
      </section>

      {/* 긴급 내담자 */}
      {urgentClients.length > 0 && (
        <section className="cr-dashboard__section" aria-label="긴급 내담자">
          <div className="cr-dashboard__section-header">
            <h2 className="cr-dashboard__section-title">
              <AlertTriangle size={20} />
              긴급 내담자
            </h2>
          </div>
          {urgentClients.map((client) => (
            <UrgentClientCard
              key={client.clientId || client.id}
              client={client}
              onClick={handleGoToClient}
            />
          ))}
        </section>
      )}

      {/* 빠른 액션 */}
      <section className="cr-dashboard__section" aria-label="빠른 액션">
        <h2 className="cr-dashboard__section-title">빠른 액션</h2>
        <div className="cr-quick-actions">
          {quickActions.map((action) => (
            <QuickActionButton
              key={action.label}
              icon={action.icon}
              label={action.label}
              onClick={action.action}
            />
          ))}
        </div>
      </section>
    </div>
  );
};

export default ConsultantDashboardRenewal;
