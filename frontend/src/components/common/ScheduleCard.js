/**
 * 스케줄 카드 컴포넌트
/**
 * 
/**
 * @author Core Solution
/**
 * @version 1.0.0
/**
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
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../erp/common/erpMgButtonProps';
import MGButton from './MGButton';
import SafeText from './SafeText';

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

  const formatTime = (timeString) => {
    if (!timeString) return '';
    return timeString.substring(0, 5); // HH:mm 형식으로 변환
  };

  const renderActionButtons = () => {
    if (!showActions) return null;

    const actions = [];

    if (onView) {
      actions.push(
        <MGButton
          key="view"
          type="button"
          variant="outline"
          size="small"
          preventDoubleClick={false}
          className={buildErpMgButtonClassName({
            variant: 'outline',
            size: 'sm',
            loading: false,
            className: 'schedule-action-btn view'
          })}
          loadingText={ERP_MG_BUTTON_LOADING_TEXT}
          onClick={() => onView(schedule)}
          title={SCHEDULE_ACTION_LABELS.view}
        >
          <i className={SCHEDULE_ACTION_ICONS.view} />
        </MGButton>
      );
    }

    // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
    if (schedule.status === 'BOOKED' && onConfirm) {
      actions.push(
        <MGButton
          key="confirm"
          type="button"
          variant="outline"
          size="small"
          preventDoubleClick={false}
          className={buildErpMgButtonClassName({
            variant: 'outline',
            size: 'sm',
            loading: false,
            className: 'schedule-action-btn confirm'
          })}
          loadingText={ERP_MG_BUTTON_LOADING_TEXT}
          onClick={() => onConfirm(schedule)}
          title={SCHEDULE_ACTION_LABELS.confirm}
        >
          <i className={SCHEDULE_ACTION_ICONS.confirm} />
        </MGButton>
      );
    }

    // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
    if (schedule.status === 'CONFIRMED' && onComplete) {
      actions.push(
        <MGButton
          key="complete"
          type="button"
          variant="outline"
          size="small"
          preventDoubleClick={false}
          className={buildErpMgButtonClassName({
            variant: 'outline',
            size: 'sm',
            loading: false,
            className: 'schedule-action-btn complete'
          })}
          loadingText={ERP_MG_BUTTON_LOADING_TEXT}
          onClick={() => onComplete(schedule)}
          title={SCHEDULE_ACTION_LABELS.complete}
        >
          <i className={SCHEDULE_ACTION_ICONS.complete} />
        </MGButton>
      );
    }

    // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
    if ((schedule.status === 'BOOKED' || schedule.status === 'CONFIRMED') && onCancel) {
      actions.push(
        <MGButton
          key="cancel"
          type="button"
          variant="outline"
          size="small"
          preventDoubleClick={false}
          className={buildErpMgButtonClassName({
            variant: 'outline',
            size: 'sm',
            loading: false,
            className: 'schedule-action-btn cancel'
          })}
          loadingText={ERP_MG_BUTTON_LOADING_TEXT}
          onClick={() => onCancel(schedule)}
          title={SCHEDULE_ACTION_LABELS.cancel}
        >
          <i className={SCHEDULE_ACTION_ICONS.cancel} />
        </MGButton>
      );
    }

    if (onEdit) {
      actions.push(
        <MGButton
          key="edit"
          type="button"
          variant="outline"
          size="small"
          preventDoubleClick={false}
          className={buildErpMgButtonClassName({
            variant: 'outline',
            size: 'sm',
            loading: false,
            className: 'schedule-action-btn edit'
          })}
          loadingText={ERP_MG_BUTTON_LOADING_TEXT}
          onClick={() => onEdit(schedule)}
          title={SCHEDULE_ACTION_LABELS.edit}
        >
          <i className={SCHEDULE_ACTION_ICONS.edit} />
        </MGButton>
      );
    }

    if (onDelete) {
      actions.push(
        <MGButton
          key="delete"
          type="button"
          variant="outline"
          size="small"
          preventDoubleClick={false}
          className={buildErpMgButtonClassName({
            variant: 'outline',
            size: 'sm',
            loading: false,
            className: 'schedule-action-btn delete'
          })}
          loadingText={ERP_MG_BUTTON_LOADING_TEXT}
          onClick={() => onDelete(schedule)}
          title={SCHEDULE_ACTION_LABELS.delete}
        >
          <i className={SCHEDULE_ACTION_ICONS.delete} />
        </MGButton>
      );
    }

    return actions;
  };

  return (
    <div className="schedule-card">
      <div className="schedule-card-header">
        <div className="schedule-card-title">
          <SafeText tag="h3" fallback="제목 없음">{schedule.title}</SafeText>
          <span 
            className="schedule-status-badge"
            data-status={schedule.status}
          >
            <SafeText>{STATUS_LABELS[schedule.status] ?? schedule.status}</SafeText>
          </span>
        </div>
        <div className="schedule-card-actions">
          {renderActionButtons()}
        </div>
      </div>
      
      <div className="schedule-card-content">
        <div className="schedule-card-info">
          <div className="schedule-info-item">
            <i className="bi bi-calendar" />
            <span>{formatDate(schedule.date)}</span>
          </div>
          <div className="schedule-info-item">
            <i className="bi bi-clock" />
            <span>{formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}</span>
          </div>
          <div className="schedule-info-item">
            <i className="bi bi-person" />
            <SafeText tag="span" fallback="상담사 정보 없음">{schedule.consultantName}</SafeText>
          </div>
          {schedule.clientName && (
            <div className="schedule-info-item">
              <i className="bi bi-person-circle" />
              <SafeText tag="span">{schedule.clientName}</SafeText>
            </div>
          )}
          {schedule.consultationType && (
            <div className="schedule-info-item">
              <i className="bi bi-tag" />
              <SafeText tag="span">{schedule.consultationType}</SafeText>
            </div>
          )}
        </div>
        
        {schedule.description && (
          <div className="schedule-card-description">
            <SafeText tag="p">{schedule.description}</SafeText>
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

export default ScheduleCard;
