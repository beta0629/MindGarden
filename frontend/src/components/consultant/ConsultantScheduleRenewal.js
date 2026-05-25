/**
 * ConsultantScheduleRenewal — 스케줄 캘린더 리뉴얼
 *
 * 주간/일간 뷰, 상담 블록 카드(아바타·시간·상태), 상담 시작/완료,
 * 바텀시트 상세 모달.
 *
 * @author MindGarden
 * @since 2026-05-12
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft, ChevronRight, Calendar, X
} from 'lucide-react';
import { useSession } from '../../contexts/SessionContext';
import TenantAwareApiClient from '../../utils/TenantAwareApiClient';
import useMediaQuery from '../../hooks/useMediaQuery';
import UnifiedScheduleComponent from '../schedule/UnifiedScheduleComponent';
import { USER_ROLES } from '../../constants/roles';
import '../admin/AdminDashboard/AdminDashboardB0KlA.css';
import './ConsultantScheduleRenewal.css';
import { SCHEDULE_API } from '../../constants/api';
import { useTranslation } from 'react-i18next';

/**
 * 데스크탑 진입 기준 — 디자인 핸드오프 §4.2 (--mg-breakpoint-lg = 1024px 동치).
 * 사용자 컨펌 Q1=preserve: 1024px 이상은 어드민 캘린더, 1024px 미만은 기존 day-bar UX 유지.
 */
const DESKTOP_MEDIA_QUERY = '(min-width: 1024px)';

const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'];

const VIEW_TYPES = {
  WEEKLY: 'WEEKLY',
  DAILY: 'DAILY'
};

const STATUS_LABELS = {
  SCHEDULED: '예정',
  BOOKED: '예약 확정',
  ACTIVE: '진행중',
  COMPLETED: '완료',
  CANCELLED: '취소',
  CONFIRMED: '확정'
};

const getStatusBadgeClass = (status) => {
  switch (status) {
    case 'ACTIVE': return 'cr-schedule-detail__status-badge--active';
    case 'COMPLETED': return 'cr-schedule-detail__status-badge--completed';
    default: return '';
  }
};

const getBorderClass = (status) => {
  switch (status) {
    case 'COMPLETED': return 'cr-schedule-detail--completed';
    case 'CANCELLED': return 'cr-schedule-detail--cancelled';
    default: return '';
  }
};

const formatTime = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false });
};

const getInitials = (name) => name ? name.charAt(0) : '?';

const getWeekDates = (baseDate) => {
  const d = new Date(baseDate);
  const dayOfWeek = d.getDay();
  const start = new Date(d);
  start.setDate(d.getDate() - dayOfWeek);
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    return date;
  });
};

const isSameDay = (d1, d2) => {
  return d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();
};

const formatDateStr = (d) => d.toISOString().split('T')[0];

const formatWeekLabel = (dates) => {
  if (!dates.length) return '';
  const start = dates[0];
  const end = dates[dates.length - 1];
  return `${start.getMonth() + 1}월 ${start.getDate()}일 - ${end.getMonth() + 1}월 ${end.getDate()}일`;
};

const ScheduleSkeleton = () => (
  <div className="cr-schedule" aria-busy="true">
    <div className="cr-schedule__skeleton-daybar">
      {Array.from({ length: 7 }, (_, i) => (
        <div key={i} className="cr-schedule__skeleton-day" />
      ))}
    </div>
    {Array.from({ length: 3 }, (_, i) => (
      <div key={i} className="cr-schedule__skeleton-card" />
    ))}
  </div>
);

const BottomSheet = ({ schedule, onClose, onStartConsultation, onCompleteConsultation, onWriteLog }) => {
  const { t } = useTranslation();
  if (!schedule) return null;
  const clientName = schedule.clientName || schedule.userName || '내담자';
  const timeRange = `${formatTime(schedule.startTime)} - ${formatTime(schedule.endTime)}`;
  const status = schedule.status || 'SCHEDULED';

  return (
    <div className="cr-bottomsheet-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="상담 상세">
      <div className="cr-bottomsheet" onClick={(e) => e.stopPropagation()}>
        <div className="cr-bottomsheet__handle">
          <div className="cr-bottomsheet__handle-bar" />
        </div>
        <div className="cr-bottomsheet__content">
          <div className="cr-bottomsheet__header">
            <h2 className="cr-bottomsheet__title">상담 상세</h2>
            <button onClick={onClose} aria-label={t('common.actions.close')} type="button" className="cr-icon-button">
              <X size={24} color="var(--mg-color-text-secondary)" />
            </button>
          </div>

          <div className="cr-bottomsheet__field">
            <span className="cr-bottomsheet__label">{t('common.labels.client')}</span>
            <span className="cr-bottomsheet__value">{clientName}</span>
          </div>
          <div className="cr-bottomsheet__field">
            <span className="cr-bottomsheet__label">시간</span>
            <span className="cr-bottomsheet__value">{timeRange}</span>
          </div>
          <div className="cr-bottomsheet__field">
            <span className="cr-bottomsheet__label">{t('common.labels.status')}</span>
            <span className="cr-bottomsheet__value">{STATUS_LABELS[status] || status}</span>
          </div>
          {schedule.sessionType && (
            <div className="cr-bottomsheet__field">
              <span className="cr-bottomsheet__label">상담 유형</span>
              <span className="cr-bottomsheet__value">{schedule.sessionType}</span>
            </div>
          )}

          <div className="cr-bottomsheet__actions">
            {(status === 'BOOKED' || status === 'CONFIRMED') && (
              <button
                className="cr-bottomsheet__btn cr-bottomsheet__btn--primary"
                onClick={() => onStartConsultation?.(schedule)}
                type="button"
              >
                상담 시작
              </button>
            )}
            {status === 'ACTIVE' && (
              <button
                className="cr-bottomsheet__btn cr-bottomsheet__btn--primary"
                onClick={() => onCompleteConsultation?.(schedule)}
                type="button"
              >
                상담 완료
              </button>
            )}
            <button
              className="cr-bottomsheet__btn cr-bottomsheet__btn--secondary"
              onClick={() => onWriteLog?.(schedule)}
              type="button"
            >
              일지 작성
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ConsultantScheduleRenewal = () => {
  const { t } = useTranslation();
  const { user, isLoading: sessionLoading } = useSession();
  const navigate = useNavigate();
  const isDesktop = useMediaQuery(DESKTOP_MEDIA_QUERY);
  const [viewType, setViewType] = useState(VIEW_TYPES.WEEKLY);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [baseDate, setBaseDate] = useState(new Date());
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSchedule, setSelectedSchedule] = useState(null);

  const weekDates = useMemo(() => getWeekDates(baseDate), [baseDate]);
  const today = useMemo(() => new Date(), []);

  const fetchSchedules = useCallback(async() => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const startDate = formatDateStr(weekDates[0]);
      const endDate = formatDateStr(weekDates[6]);
      const res = await TenantAwareApiClient.get(SCHEDULE_API.SCHEDULES, {
        consultantId: user.id,
        startDate,
        endDate
      });
      const data = Array.isArray(res) ? res : res?.data || res?.content || [];
      setSchedules(data);
    } catch (err) {
      console.error('[스케줄] 로드 실패:', err);
      setSchedules([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id, weekDates]);

  useEffect(() => {
    if (sessionLoading) {
      return;
    }
    if (isDesktop) {
      // 데스크탑은 UnifiedScheduleComponent 가 자체 fetch — 본 페이지는 로딩만 해제
      setLoading(false);
      return;
    }
    if (user?.id) {
      fetchSchedules();
    } else {
      setLoading(false);
    }
  }, [sessionLoading, isDesktop, user?.id, fetchSchedules]);

  const schedulesForDate = useMemo(() => {
    return schedules
      .filter((s) => {
        const sDate = new Date(s.startTime || s.scheduleDate);
        return isSameDay(sDate, selectedDate);
      })
      .sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
  }, [schedules, selectedDate]);

  const hasScheduleOnDate = useCallback((date) => {
    return schedules.some((s) => {
      const sDate = new Date(s.startTime || s.scheduleDate);
      return isSameDay(sDate, date);
    });
  }, [schedules]);

  const handlePrevWeek = () => {
    const d = new Date(baseDate);
    d.setDate(d.getDate() - 7);
    setBaseDate(d);
  };

  const handleNextWeek = () => {
    const d = new Date(baseDate);
    d.setDate(d.getDate() + 7);
    setBaseDate(d);
  };

  const handleToday = () => {
    const now = new Date();
    setBaseDate(now);
    setSelectedDate(now);
  };

  const handleStartConsultation = async(schedule) => {
    try {
      await TenantAwareApiClient.put(
        `${SCHEDULE_API.SCHEDULES}/${schedule.id || schedule.scheduleId}/status`,
        { status: 'ACTIVE' }
      );
      setSelectedSchedule(null);
      fetchSchedules();
    } catch (err) {
      console.error('[스케줄] 상담 시작 실패:', err);
    }
  };

  const handleCompleteConsultation = async(schedule) => {
    try {
      await TenantAwareApiClient.put(
        `${SCHEDULE_API.SCHEDULES}/${schedule.id || schedule.scheduleId}/status`,
        { status: 'COMPLETED' }
      );
      setSelectedSchedule(null);
      fetchSchedules();
    } catch (err) {
      console.error('[스케줄] 상담 완료 실패:', err);
    }
  };

  const handleWriteLog = (schedule) => {
    setSelectedSchedule(null);
    navigate(`/consultant/consultation-record/${schedule.id || schedule.consultationId}`);
  };

  if (sessionLoading || (loading && !isDesktop)) {
    return <ScheduleSkeleton />;
  }

  /**
   * 데스크탑 분기 — 어드민 통합 캘린더 컴포넌트 재사용 (옵션 A).
   * 모바일 분기는 본 컴포넌트의 day-bar + 타임라인 + 바텀시트 UX 유지(Q1=preserve).
   * SSOT: docs/project-management/2026-05-23/CALENDAR_OPTION_A_DESIGN_HANDOFF.md §4
   */
  if (isDesktop) {
    return (
      <div
        className="cr-schedule cr-schedule--desktop"
        data-calendar-skin="integrated"
        data-layout-context="consultant-renewal-schedule"
      >
        <UnifiedScheduleComponent
          userRole={user?.role || USER_ROLES.CONSULTANT}
          userId={user?.id}
          integratedMonthEventLayout
          calendarSkin="integrated"
        />
      </div>
    );
  }

  return (
    <div className="cr-schedule">
      {/* 뷰 전환 탭 */}
      <div className="cr-schedule__view-tabs" role="tablist">
        <button
          className={`cr-schedule__view-tab ${viewType === VIEW_TYPES.WEEKLY ? 'cr-schedule__view-tab--active' : ''}`}
          onClick={() => setViewType(VIEW_TYPES.WEEKLY)}
          role="tab"
          aria-selected={viewType === VIEW_TYPES.WEEKLY}
          type="button"
        >
          주간
        </button>
        <button
          className={`cr-schedule__view-tab ${viewType === VIEW_TYPES.DAILY ? 'cr-schedule__view-tab--active' : ''}`}
          onClick={() => setViewType(VIEW_TYPES.DAILY)}
          role="tab"
          aria-selected={viewType === VIEW_TYPES.DAILY}
          type="button"
        >
          일간
        </button>
      </div>

      {/* 주간 네비게이션 */}
      <div className="cr-schedule__week-header">
        <div className="cr-schedule__week-nav">
          <button
            className="cr-schedule__week-nav-btn"
            onClick={handlePrevWeek}
            aria-label="이전 주"
            type="button"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="cr-schedule__week-label">{formatWeekLabel(weekDates)}</span>
          <button
            className="cr-schedule__week-nav-btn"
            onClick={handleNextWeek}
            aria-label="다음 주"
            type="button"
          >
            <ChevronRight size={18} />
          </button>
        </div>
        <button
          className="cr-schedule__today-btn"
          onClick={handleToday}
          type="button"
        >
          {t('common.labels.today')}
        </button>
      </div>

      {/* 7일 날짜 바 */}
      <div className="cr-schedule__day-bar" role="listbox" aria-label="날짜 선택">
        {weekDates.map((date) => {
          const isToday = isSameDay(date, today);
          const isSelected = isSameDay(date, selectedDate);
          const hasSchedule = hasScheduleOnDate(date);

          return (
            <div
              key={date.toISOString()}
              className={[
                'cr-schedule__day-cell',
                isSelected && 'cr-schedule__day-cell--selected',
                isToday && 'cr-schedule__day-cell--today'
              ].filter(Boolean).join(' ')}
              onClick={() => setSelectedDate(new Date(date))}
              role="option"
              aria-selected={isSelected}
              tabIndex={-1}
              aria-label={`${date.getMonth() + 1}월 ${date.getDate()}일 ${DAY_NAMES[date.getDay()]}요일`}
            >
              <span className="cr-schedule__day-name">{DAY_NAMES[date.getDay()]}</span>
              <span className="cr-schedule__day-number">{date.getDate()}</span>
              {hasSchedule && !isSelected && <span className="cr-schedule__day-dot" />}
            </div>
          );
        })}
      </div>

      {/* 타임라인 */}
      {schedulesForDate.length === 0 ? (
        <div className="cr-schedule__empty">
          <Calendar size={48} className="cr-schedule__empty-icon" />
          <p className="cr-schedule__empty-text">
            {selectedDate.getMonth() + 1}월 {selectedDate.getDate()}일에 예정된 상담이 없습니다
          </p>
          <button
            className="cr-schedule__empty-cta"
            onClick={() => navigate('/consultant/renewal/availability')}
            type="button"
          >
            <Calendar size={16} aria-hidden /> 근무 가능 시간
          </button>
        </div>
      ) : (
        <div className="cr-schedule__timeline">
          {schedulesForDate.map((schedule) => {
            const clientName = schedule.clientName || schedule.userName || '내담자';
            const status = schedule.status || 'SCHEDULED';
            const timeRange = `${formatTime(schedule.startTime)} - ${formatTime(schedule.endTime)}`;

            return (
              <div key={schedule.id || schedule.scheduleId} className="cr-schedule__timeline-item">
                <span className="cr-schedule__timeline-time">
                  {formatTime(schedule.startTime)}
                </span>
                <div
                  className={`cr-schedule-detail ${getBorderClass(status)}`}
                  onClick={() => setSelectedSchedule(schedule)}
                  role="button"
                  tabIndex={0}
                >
                  <div className="cr-schedule-detail__header">
                    <span className="cr-schedule-detail__time-range">{timeRange}</span>
                    <span className={`cr-schedule-detail__status-badge ${getStatusBadgeClass(status)}`}>
                      {STATUS_LABELS[status] || status}
                    </span>
                  </div>
                  <div className="cr-schedule-detail__client-row">
                    <span className="cr-schedule-detail__avatar" aria-hidden="true">
                      {getInitials(clientName)}
                    </span>
                    <div className="cr-schedule-detail__client-info">
                      <div className="cr-schedule-detail__client-name">{clientName}</div>
                      {schedule.sessionType && (
                        <div className="cr-schedule-detail__session-type">{schedule.sessionType}</div>
                      )}
                    </div>
                  </div>
                  {viewType === VIEW_TYPES.DAILY && (
                    <div className="cr-schedule-detail__actions" onClick={(e) => e.stopPropagation()}>
                      {(status === 'BOOKED' || status === 'CONFIRMED') && (
                        <button
                          className="cr-schedule-detail__action-btn cr-schedule-detail__action-btn--primary"
                          onClick={() => handleStartConsultation(schedule)}
                          type="button"
                        >
                          상담 시작
                        </button>
                      )}
                      {status === 'ACTIVE' && (
                        <button
                          className="cr-schedule-detail__action-btn cr-schedule-detail__action-btn--primary"
                          onClick={() => handleCompleteConsultation(schedule)}
                          type="button"
                        >
                          상담 완료
                        </button>
                      )}
                      <button
                        className="cr-schedule-detail__action-btn cr-schedule-detail__action-btn--secondary"
                        onClick={() => handleWriteLog(schedule)}
                        type="button"
                      >
                        일지
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 바텀시트 상세 모달 */}
      {selectedSchedule && (
        <BottomSheet
          schedule={selectedSchedule}
          onClose={() => setSelectedSchedule(null)}
          onStartConsultation={handleStartConsultation}
          onCompleteConsultation={handleCompleteConsultation}
          onWriteLog={handleWriteLog}
        />
      )}
    </div>
  );
};

export default ConsultantScheduleRenewal;
