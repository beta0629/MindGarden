import React from 'react';
import { useNavigate } from 'react-router-dom';
import 'bootstrap-icons/font/bootstrap-icons.css';

/**
 * 상담사용 스케줄 빠른 접근 컴포넌트
 */
const ScheduleQuickAccess = ({ user }) => {
  const navigate = useNavigate();

  // 상담사가 아닌 경우 렌더링하지 않음
  if (user?.role !== 'CONSULTANT') {
    return null;
  }

  const handleScheduleClick = () => {
    navigate('/consultant/schedule');
  };

  return (
    <div className="schedule-quick-access">
      <div className="schedule-quick-access-header">
        <h3 className="schedule-quick-access-title">
          <i className="bi bi-calendar-check schedule-quick-access-icon"></i>
          스케줄 관리
        </h3>
        <button 
          className="mg-btn mg-btn--outline mg-btn--primary mg-btn--sm"
          onClick={handleScheduleClick}
        >
          <i className="bi bi-arrow-right"></i>
          전체보기
        </button>
      </div>

      {/* 통합 스케줄 카드 */}
      <div
        className="schedule-quick-access-card"
        onClick={handleScheduleClick}
      >
        <div className="schedule-quick-access-card-content">
          <div className="schedule-quick-access-card-icon">
            <i className="bi bi-calendar-check"></i>
          </div>
          <div className="schedule-quick-access-card-text">
            <h4 className="schedule-quick-access-card-title">
              스케줄 관리
            </h4>
            <p className="schedule-quick-access-card-description">
              오늘의 스케줄, 다가오는 상담, 새 일정 등록
            </p>
          </div>
          <div className="schedule-quick-access-card-arrow">
            opacity: 0.8,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 16px',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '20px',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <i className="bi bi-arrow-right"></i>
            스케줄 페이지로 이동
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScheduleQuickAccess;
