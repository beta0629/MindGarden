/**
 * 스케줄 카드 컴포넌트
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-09-05
 */

import React from 'react';
import PropTypes from 'prop-types';
import { 
  STATUS_LABELS, 
  STATUS_COLORS, 
  STATUS_TEXT_COLORS,
  SCHEDULE_ACTION_LABELS,
  SCHEDULE_ACTION_ICONS,
  DATE_FORMATS,
  TIME_FORMATS
} from '../../constants/schedule';
import './ScheduleCard.css';

const ScheduleCard = ({ 
  schedule, 
  onView, 
  onEdit, 
  onDelete, 
  onConfirm, 
  onCancel, 
  onComplete,
  showActions = true 
}) => {
  // 날짜 포맷팅
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'short'
    });
  };

  // 시간 포맷팅
  const formatTime = (timeString) => {
    if (!timeString) return '';
    return timeString.substring(0, 5); // HH:mm 형식으로 변환
  };

  // 액션 버튼 렌더링
  const renderActionButtons = () => {
    if (!showActions) return null;

    const actions = [];

    // 기본 액션들
    if (onView) {
      actions.push(
        <button
          key="view"
          className="schedule-action-btn view"
          onClick={() => onView(schedule)}
          title={SCHEDULE_ACTION_LABELS.view}
        >
          <i className={SCHEDULE_ACTION_ICONS.view}></i>
        </button>
      );
    }

    // 상태별 액션들
    if (schedule.status === 'BOOKED' && onConfirm) {
      actions.push(
        <button
          key="confirm"
          className="schedule-action-btn confirm"
          onClick={() => onConfirm(schedule)}
          title={SCHEDULE_ACTION_LABELS.confirm}
        >
          <i className={SCHEDULE_ACTION_ICONS.confirm}></i>
        </button>
      );
    }

    if (schedule.status === 'CONFIRMED' && onComplete) {
      actions.push(
        <button
          key="complete"
          className="schedule-action-btn complete"
          onClick={() => onComplete(schedule)}
          title={SCHEDULE_ACTION_LABELS.complete}
        >
          <i className={SCHEDULE_ACTION_ICONS.complete}></i>
        </button>
      );
    }

    if ((schedule.status === 'BOOKED' || schedule.status === 'CONFIRMED') && onCancel) {
      actions.push(
        <button
          key="cancel"
          className="schedule-action-btn cancel"
          onClick={() => onCancel(schedule)}
          title={SCHEDULE_ACTION_LABELS.cancel}
        >
          <i className={SCHEDULE_ACTION_ICONS.cancel}></i>
        </button>
      );
    }

    if (onEdit) {
      actions.push(
        <button
          key="edit"
          className="schedule-action-btn edit"
          onClick={() => onEdit(schedule)}
          title={SCHEDULE_ACTION_LABELS.edit}
        >
          <i className={SCHEDULE_ACTION_ICONS.edit}></i>
        </button>
      );
    }

    if (onDelete) {
      actions.push(
        <button
          key="delete"
          className="schedule-action-btn delete"
          onClick={() => onDelete(schedule)}
          title={SCHEDULE_ACTION_LABELS.delete}
        >
          <i className={SCHEDULE_ACTION_ICONS.delete}></i>
        </button>
      );
    }

    return actions;
  };

  return (
    <div className="schedule-card">
      <div className="schedule-card-header">
        <div className="schedule-card-title">
          <h3>{schedule.title || '제목 없음'}</h3>
          <span 
            className="schedule-status-badge"
            data-status={schedule.status}
          >
            {STATUS_LABELS[schedule.status] || schedule.status}
          </span>
        </div>
        <div className="schedule-card-actions">
          {renderActionButtons()}
        </div>
      </div>
      
      <div className="schedule-card-content">
        <div className="schedule-card-info">
          <div className="schedule-info-item">
            <i className="bi bi-calendar"></i>
            <span>{formatDate(schedule.date)}</span>
          </div>
          <div className="schedule-info-item">
            <i className="bi bi-clock"></i>
            <span>{formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}</span>
          </div>
          <div className="schedule-info-item">
            <i className="bi bi-person"></i>
            <span>{schedule.consultantName || '상담사 정보 없음'}</span>
          </div>
          {schedule.clientName && (
            <div className="schedule-info-item">
              <i className="bi bi-person-circle"></i>
              <span>{schedule.clientName}</span>
            </div>
          )}
          {schedule.consultationType && (
            <div className="schedule-info-item">
              <i className="bi bi-tag"></i>
              <span>{schedule.consultationType}</span>
            </div>
          )}
        </div>
        
        {schedule.description && (
          <div className="schedule-card-description">
            <p>{schedule.description}</p>
          </div>
        )}
      </div>
    </div>
  );
};

ScheduleCard.propTypes = {
  schedule: PropTypes.object.isRequired,
  onView: PropTypes.func,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
  onConfirm: PropTypes.func,
  onCancel: PropTypes.func,
  onComplete: PropTypes.func,
  showActions: PropTypes.bool
};

ScheduleCard.defaultProps = {
  onView: null,
  onEdit: null,
  onDelete: null,
  onConfirm: null,
  onCancel: null,
  onComplete: null,
  showActions: true
};

export default ScheduleCard;
