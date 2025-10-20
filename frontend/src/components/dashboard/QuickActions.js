import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, User, Calendar, MessageCircle, UserPlus, History, FileText, Link2, Code, BarChart3, HelpCircle, Settings } from 'lucide-react';
import ConsultantApplicationModal from '../common/ConsultantApplicationModal';

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
    <div className="mg-card">
      {/* 카드 헤더 */}
      <div className="mg-card-header mg-flex mg-align-center mg-gap-sm">
        <Zap size={20} style={{ color: 'var(--olive-green)' }} />
        <h3 className="mg-h4 mg-mb-0">빠른 액션</h3>
      </div>

      {/* 카드 바디 */}
      <div className="mg-card-body">
        <div className="quick-actions-grid">
          <button className="quick-action-btn" onClick={goToProfile}>
            <User size={24} />
            <span>프로필</span>
          </button>
          <button className="quick-action-btn" onClick={goToSchedule}>
            <Calendar size={24} />
            <span>스케줄</span>
          </button>
          
          {/* 메시지 버튼 (내담자/상담사) */}
          {(user?.role === 'CLIENT' || user?.role === 'CONSULTANT') && (
            <button className="quick-action-btn" onClick={goToMessages}>
              <MessageCircle size={24} />
              <span>{user?.role === 'CLIENT' ? '상담사 메시지' : '메시지 관리'}</span>
            </button>
          )}
          
          {/* 상담사 신청 버튼 (내담자 전용) - 임시 비활성화 */}
          {false && user?.role === 'CLIENT' && (
            <button 
              className="quick-action-btn"
              onClick={() => setShowConsultantApplicationModal(true)}
            >
              <UserPlus size={24} />
              <span>상담사 신청</span>
            </button>
          )}
          
          {/* 상담 내역 버튼 (모든 사용자) */}
          <button className="quick-action-btn" onClick={goToConsultationHistory}>
            <History size={24} />
            <span>상담 내역</span>
          </button>
          
          {/* 상담 리포트 버튼 (모든 사용자) */}
          <button className="quick-action-btn" onClick={goToConsultationReport}>
            <FileText size={24} />
            <span>상담 리포트</span>
          </button>
          
          {/* 관리자 전용 액션 */}
          {(user?.role === 'ADMIN' || user?.role === 'BRANCH_SUPER_ADMIN') && (
            <>
              <button className="quick-action-btn" onClick={goToMappingManagement}>
                <Link2 size={24} />
                <span>매칭 관리</span>
              </button>
              <button className="quick-action-btn" onClick={goToCommonCodeManagement}>
                <Code size={24} />
                <span>공통코드</span>
              </button>
              <button className="quick-action-btn" onClick={() => navigate('/admin/statistics')}>
                <BarChart3 size={24} />
                <span>통계</span>
              </button>
            </>
          )}
          
          <button className="quick-action-btn" onClick={goToHelp}>
            <HelpCircle size={24} />
            <span>도움말</span>
          </button>
          <button className="quick-action-btn" onClick={goToSettings}>
            <Settings size={24} />
            <span>설정</span>
          </button>
        </div>
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
