import React from 'react';
import { useNavigate } from 'react-router-dom';
import 'bootstrap-icons/font/bootstrap-icons.css';

const QuickActions = ({ user }) => {
  const navigate = useNavigate();

  const goToProfile = () => {
    navigate(`/${user?.role?.toLowerCase()}/mypage`);
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

  const goToMappingManagement = () => {
    navigate('/admin/mapping-management');
  };

  const goToCommonCodeManagement = () => {
    navigate('/admin/common-codes');
  };

  return (
    <div className="quick-actions">
      <h3 className="section-title">
        <i className="bi bi-lightning"></i>
        빠른 액션
      </h3>
      <div className={`action-buttons ${(user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') ? 'admin-layout' : ''}`}>
        <button className="action-btn" onClick={goToProfile}>
          <i className="bi bi-person-circle"></i>
          <span>마이페이지</span>
        </button>
        <button className="action-btn" onClick={goToSchedule}>
          <i className="bi bi-calendar-check"></i>
          <span>일정 관리</span>
        </button>
        
        {/* 관리자 전용 액션 */}
        {(user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') && (
          <>
            <button className="action-btn" onClick={goToMappingManagement}>
              <i className="bi bi-link-45deg"></i>
              <span>매핑 관리</span>
            </button>
            <button className="action-btn" onClick={goToCommonCodeManagement}>
              <i className="bi bi-code-square"></i>
              <span>공통코드 관리</span>
            </button>
          </>
        )}
        
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
