import React, { useState } from 'react';
// import UnifiedLoading from '../../components/common/UnifiedLoading'; // 임시 비활성화
import { useNavigate } from 'react-router-dom';

import ConsultantApplicationModal from '../common/ConsultantApplicationModal';
import MGButton from '../common/MGButton';
import { RoleUtils } from '../../constants/roles';
const QuickActions = ({ user }) => {
  const navigate = useNavigate();
  const [showConsultantApplicationModal, setShowConsultantApplicationModal] = useState(false);

  const goToProfile = () => {
    navigate(`/${user?.role?.toLowerCase()}/mypage`);
  };

  const goToSchedule = () => {
    if (RoleUtils.isConsultant(user)) {
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
    if (RoleUtils.isClient(user)) {
      navigate('/client/messages');
    } else if (RoleUtils.isConsultant(user)) {
      navigate('/consultant/messages');
    }
  };

  const handleConsultantApplicationSuccess = (result) => {
    console.log('상담사 신청 성공:', result);
    // 페이지 새로고침 또는 사용자 정보 업데이트
    window.location.reload();
  };

  const actionBtnProps = {
    type: 'button',
    variant: 'outline',
    size: 'medium',
    className: 'quick-action-btn',
    preventDoubleClick: false
  };

  return (
    <div className="mg-card">
      {/* 카드 헤더 */}
      <div className="mg-card-header mg-flex mg-align-center mg-gap-sm">
        
        <h3 className="mg-h4 mg-mb-0">빠른 액션</h3>
      </div>

      {/* 카드 바디 */}
      <div className="mg-card-body">
        <div className="quick-actions-grid">
          <MGButton {...actionBtnProps} onClick={goToProfile}>
            프로필
          </MGButton>
          <MGButton {...actionBtnProps} onClick={goToSchedule}>
            스케줄
          </MGButton>

          {/* 메시지 버튼 (내담자/상담사) */}
          {(RoleUtils.isClient(user) || RoleUtils.isConsultant(user)) && (
            <MGButton {...actionBtnProps} onClick={goToMessages}>
              {RoleUtils.isClient(user) ? '상담사 메시지' : '메시지 관리'}
            </MGButton>
          )}

          {/* 상담사 신청 버튼 (내담자 전용) - 임시 비활성화 */}
          {false && RoleUtils.isClient(user) && (
            <MGButton
              {...actionBtnProps}
              onClick={() => setShowConsultantApplicationModal(true)}
            >
              상담사 신청
            </MGButton>
          )}

          {/* 상담 내역 버튼 (모든 사용자) */}
          <MGButton {...actionBtnProps} onClick={goToConsultationHistory}>
            상담 내역
          </MGButton>

          {/* 상담 리포트 버튼 (모든 사용자) */}
          <MGButton {...actionBtnProps} onClick={goToConsultationReport}>
            상담 리포트
          </MGButton>

          {/* 관리자 전용 액션 */}
          {RoleUtils.isAdmin(user) && (
            <>
              <MGButton {...actionBtnProps} onClick={goToMappingManagement}>
                매칭 시스템
              </MGButton>
              <MGButton {...actionBtnProps} onClick={goToCommonCodeManagement}>
                공통코드
              </MGButton>
              <MGButton {...actionBtnProps} onClick={() => navigate('/admin/statistics')}>
                통계
              </MGButton>
            </>
          )}

          <MGButton {...actionBtnProps} onClick={goToHelp}>
            도움말
          </MGButton>
          <MGButton {...actionBtnProps} onClick={goToSettings}>
            설정
          </MGButton>
        </div>
      </div>

      {/* 상담사 신청 모달 */}
      <ConsultantApplicationModal
        isOpen={showConsultantApplicationModal}
        onClose={() => setShowConsultantApplicationModal(false)}
        userId={user?.id}
        user={user}
        onSuccess={handleConsultantApplicationSuccess}
      />
    </div>
  );
};

export default QuickActions;
