import React from 'react';
import { useNavigate } from 'react-router-dom';
import 'bootstrap-icons/font/bootstrap-icons.css';
import { QUICK_ACTIONS_CSS } from '../../constants/css';
import { DASHBOARD_ACTIONS } from '../../constants/dashboard';
import './QuickActions.css';

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
    <div className={QUICK_ACTIONS_CSS.CONTAINER}>
      <h3 className={QUICK_ACTIONS_CSS.SECTION_TITLE}>
        <i className="bi bi-lightning"></i>
        빠른 액션
      </h3>
      <div className={`${QUICK_ACTIONS_CSS.ACTION_GRID} ${(user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') ? 'admin-layout' : ''}`}>
        <button className={QUICK_ACTIONS_CSS.ACTION_BUTTON} onClick={goToProfile}>
          <i className={`${QUICK_ACTIONS_CSS.ACTION_ICON} ${DASHBOARD_ACTIONS.PROFILE.ICON}`}></i>
          <span className={QUICK_ACTIONS_CSS.ACTION_LABEL}>{DASHBOARD_ACTIONS.PROFILE.LABEL}</span>
        </button>
        <button className={QUICK_ACTIONS_CSS.ACTION_BUTTON} onClick={goToSchedule}>
          <i className={`${QUICK_ACTIONS_CSS.ACTION_ICON} ${DASHBOARD_ACTIONS.SCHEDULE.ICON}`}></i>
          <span className={QUICK_ACTIONS_CSS.ACTION_LABEL}>{DASHBOARD_ACTIONS.SCHEDULE.LABEL}</span>
        </button>
        
        {/* 관리자 전용 액션 */}
        {(user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') && (
          <>
            <button className={QUICK_ACTIONS_CSS.ACTION_BUTTON} onClick={goToMappingManagement}>
              <i className={`${QUICK_ACTIONS_CSS.ACTION_ICON} ${DASHBOARD_ACTIONS.MAPPING_MANAGEMENT.ICON}`}></i>
              <span className={QUICK_ACTIONS_CSS.ACTION_LABEL}>{DASHBOARD_ACTIONS.MAPPING_MANAGEMENT.LABEL}</span>
            </button>
            <button className={QUICK_ACTIONS_CSS.ACTION_BUTTON} onClick={goToCommonCodeManagement}>
              <i className={`${QUICK_ACTIONS_CSS.ACTION_ICON} ${DASHBOARD_ACTIONS.COMMON_CODES.ICON}`}></i>
              <span className={QUICK_ACTIONS_CSS.ACTION_LABEL}>{DASHBOARD_ACTIONS.COMMON_CODES.LABEL}</span>
            </button>
            <button className={QUICK_ACTIONS_CSS.ACTION_BUTTON} onClick={() => navigate('/admin/statistics')}>
              <i className={`${QUICK_ACTIONS_CSS.ACTION_ICON} ${DASHBOARD_ACTIONS.STATISTICS.ICON}`}></i>
              <span className={QUICK_ACTIONS_CSS.ACTION_LABEL}>{DASHBOARD_ACTIONS.STATISTICS.LABEL}</span>
            </button>
          </>
        )}
        
        <button className={QUICK_ACTIONS_CSS.ACTION_BUTTON} onClick={goToHelp}>
          <i className={`${QUICK_ACTIONS_CSS.ACTION_ICON} ${DASHBOARD_ACTIONS.HELP.ICON}`}></i>
          <span className={QUICK_ACTIONS_CSS.ACTION_LABEL}>{DASHBOARD_ACTIONS.HELP.LABEL}</span>
        </button>
        <button className={QUICK_ACTIONS_CSS.ACTION_BUTTON} onClick={goToSettings}>
          <i className={`${QUICK_ACTIONS_CSS.ACTION_ICON} ${DASHBOARD_ACTIONS.SETTINGS.ICON}`}></i>
          <span className={QUICK_ACTIONS_CSS.ACTION_LABEL}>{DASHBOARD_ACTIONS.SETTINGS.LABEL}</span>
        </button>
      </div>
    </div>
  );
};

export default QuickActions;
