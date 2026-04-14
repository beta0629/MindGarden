/**
 * Schedule Widget - 표준화된 스케줄 빠른 접근 위젯
/**
 * ScheduleQuickAccess 컴포넌트를 위젯으로 변환
/**
 * 
/**
 * @author CoreSolution
/**
 * @version 2.0.0 (위젯 표준화 업그레이드)
/**
 * @since 2025-11-29
 */

import React from 'react';

import { useNavigate } from 'react-router-dom';
import BaseWidget from './BaseWidget';
import MGButton from '../../common/MGButton';
import { RoleUtils } from '../../../constants/roles';
import './ScheduleWidget.css';
const ScheduleWidget = ({ widget, user }) => {
  const navigate = useNavigate();

  // 상담사 전용 (다른 역할은 숨김)
  if (!RoleUtils.isConsultant(user)) {
    return null;
  }

  // 스케줄 페이지로 이동
  const handleScheduleClick = () => {
    navigate('/consultant/schedule');
  };

  // 새 일정 등록으로 이동
  const handleNewScheduleClick = () => {
    navigate('/consultant/schedule?action=new');
  };

  return (
    <BaseWidget
      widget={widget}
      user={user}
      loading={false}
      error={null}
      isEmpty={false}
      customActions={[
        {
          label: '전체보기',
          onClick: handleScheduleClick
        }
      ]}
    >
      <div className="schedule-widget-content">
        {/* 메인 스케줄 카드 */}
        <div
          className="schedule-main-card"
          onClick={handleScheduleClick}
        >
          <div className="schedule-card-icon" />
          <div className="schedule-card-content">
            <h3 className="schedule-card-title">
              스케줄 관리
            </h3>
            <p className="schedule-card-description">
              오늘의 스케줄, 다가오는 상담, 새 일정 등록
            </p>
          </div>
          <div className="schedule-card-arrow" />
        </div>

        {/* 빠른 액션 버튼들 */}
        <div className="schedule-quick-actions">
          <MGButton
            className="schedule-action-btn primary"
            variant="primary"
            type="button"
            onClick={handleScheduleClick}
          >
            
            오늘의 스케줄
          </MGButton>

          <MGButton
            className="schedule-action-btn secondary"
            variant="outline"
            type="button"
            onClick={handleNewScheduleClick}
          >
            
            새 일정 등록
          </MGButton>
        </div>

        {/* 상담사 전용 안내 메시지 */}
        <div className="schedule-consultant-message">
          <div className="consultant-message-icon">
            💼
          </div>
          <p className="consultant-message-text">
            상담사님의 효율적인 스케줄 관리를 위한 전용 공간입니다
          </p>
        </div>
      </div>
    </BaseWidget>
  );
};

export default ScheduleWidget;