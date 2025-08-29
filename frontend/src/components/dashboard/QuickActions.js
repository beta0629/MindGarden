import React from 'react';
import { useNavigate } from 'react-router-dom';
import 'bootstrap-icons/font/bootstrap-icons.css';

const QuickActions = ({ user }) => {
  const navigate = useNavigate();

  const goToProfile = () => {
    navigate(`/${user?.role?.toLowerCase()}/profile`);
  };

  const goToSchedule = () => {
    if (user?.role === 'CONSULTANT') {
      navigate('/consultant/schedule');
    } else {
      navigate(`/${user?.role?.toLowerCase()}/schedule`);
    }
  };

  const goToHelp = () => {
    navigate('/help');
  };

  const goToSettings = () => {
    navigate(`/${user?.role?.toLowerCase()}/settings`);
  };

  return (
    <div className="quick-actions">
      <h3 className="section-title">
        <i className="bi bi-lightning"></i>
        빠른 액션
      </h3>
      <div className="action-buttons">
        <button className="action-btn" onClick={goToProfile}>
          <i className="bi bi-person-circle"></i>
          <span>프로필 편집</span>
        </button>
        <button className="action-btn" onClick={goToSchedule}>
          <i className="bi bi-calendar-check"></i>
          <span>일정 관리</span>
        </button>
        <button className="action-btn" onClick={goToHelp}>
          <i className="bi bi-question-circle"></i>
          <span>도움말</span>
        </button>
        <button className="action-btn" onClick={goToSettings}>
          <i className="bi bi-gear"></i>
          <span>설정</span>
        </button>
      </div>
    </div>
  );
};

export default QuickActions;
