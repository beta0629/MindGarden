import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import 'bootstrap-icons/font/bootstrap-icons.css';
import { QUICK_ACTIONS_CSS } from '../../constants/css';
import { DASHBOARD_ACTIONS } from '../../constants/dashboard';
import ConsultantApplicationModal from '../common/ConsultantApplicationModal';
import './QuickActions.css';

const QuickActions = ({ user }) => {
  const navigate = useNavigate();
  const [showConsultantApplicationModal, setShowConsultantApplicationModal] = useState(false);

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

  const goToConsultationHistory = () => {
    navigate('/consultation-history');
  };

  const goToConsultationReport = () => {
    navigate('/consultation-report');
  };

  const goToMessages = () => {
    if (user?.role === 'CLIENT') {
      navigate('/client/messages');
    } else if (user?.role === 'CONSULTANT') {
      navigate('/consultant/messages');
    }
  };

  const handleConsultantApplicationSuccess = (result) => {
    console.log('상담사 신청 성공:', result);
    // 페이지 새로고침 또는 사용자 정보 업데이트
    window.location.reload();
  };

  return (
    <div className={QUICK_ACTIONS_CSS.CONTAINER}>
      <h3 className={QUICK_ACTIONS_CSS.SECTION_TITLE}>
        <i className="bi bi-lightning"></i>
        빠른 액션
      </h3>
      <div className={`${QUICK_ACTIONS_CSS.ACTION_GRID} ${(user?.role === 'ADMIN' || user?.role === 'BRANCH_SUPER_ADMIN') ? 'admin-layout' : ''}`}>
        <button className={QUICK_ACTIONS_CSS.ACTION_BUTTON} onClick={goToProfile}>
          <i className={`${QUICK_ACTIONS_CSS.ACTION_ICON} ${DASHBOARD_ACTIONS.PROFILE.ICON}`}></i>
          <span className={QUICK_ACTIONS_CSS.ACTION_LABEL}>{DASHBOARD_ACTIONS.PROFILE.LABEL}</span>
        </button>
        <button className={QUICK_ACTIONS_CSS.ACTION_BUTTON} onClick={goToSchedule}>
          <i className={`${QUICK_ACTIONS_CSS.ACTION_ICON} ${DASHBOARD_ACTIONS.SCHEDULE.ICON}`}></i>
          <span className={QUICK_ACTIONS_CSS.ACTION_LABEL}>{DASHBOARD_ACTIONS.SCHEDULE.LABEL}</span>
        </button>
        
        {/* 메시지 버튼 (내담자/상담사) */}
        {(user?.role === 'CLIENT' || user?.role === 'CONSULTANT') && (
          <button className={QUICK_ACTIONS_CSS.ACTION_BUTTON} onClick={goToMessages}>
            <i className={`${QUICK_ACTIONS_CSS.ACTION_ICON} bi-chat-dots`}></i>
            <span className={QUICK_ACTIONS_CSS.ACTION_LABEL}>
              {user?.role === 'CLIENT' ? '상담사 메시지' : '메시지 관리'}
            </span>
          </button>
        )}
        
        {/* 상담사 신청 버튼 (내담자 전용) - 임시 비활성화 */}
        {false && user?.role === 'CLIENT' && (
          <button 
            className={`${QUICK_ACTIONS_CSS.ACTION_BUTTON} consultant-application-btn quick-actions-gradient-btn`}
            onClick={() => setShowConsultantApplicationModal(true)}
          >
            <i className={`${QUICK_ACTIONS_CSS.ACTION_ICON} bi-person-plus`}></i>
            <span className={QUICK_ACTIONS_CSS.ACTION_LABEL}>상담사 신청</span>
          </button>
        )}
        
        {/* 상담 내역 버튼 (모든 사용자) */}
        <button className={QUICK_ACTIONS_CSS.ACTION_BUTTON} onClick={goToConsultationHistory}>
          <i className={`${QUICK_ACTIONS_CSS.ACTION_ICON} ${DASHBOARD_ACTIONS.CONSULTATION_HISTORY.ICON}`}></i>
          <span className={QUICK_ACTIONS_CSS.ACTION_LABEL}>{DASHBOARD_ACTIONS.CONSULTATION_HISTORY.LABEL}</span>
        </button>
        
        {/* 상담 리포트 버튼 (모든 사용자) */}
        <button className={QUICK_ACTIONS_CSS.ACTION_BUTTON} onClick={goToConsultationReport}>
          <i className={`${QUICK_ACTIONS_CSS.ACTION_ICON} ${DASHBOARD_ACTIONS.CONSULTATION_REPORT.ICON}`}></i>
          <span className={QUICK_ACTIONS_CSS.ACTION_LABEL}>{DASHBOARD_ACTIONS.CONSULTATION_REPORT.LABEL}</span>
        </button>
        
        {/* 관리자 전용 액션 */}
        {(user?.role === 'ADMIN' || user?.role === 'BRANCH_SUPER_ADMIN') && (
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
      
      {/* 상담사 신청 모달 */}
      <ConsultantApplicationModal
        isOpen={showConsultantApplicationModal}
        onClose={() => setShowConsultantApplicationModal(false)}
        userId={user?.id}
        userRole={user?.role}
        onSuccess={handleConsultantApplicationSuccess}
      />
    </div>
  );
};

export default QuickActions;
