import React from 'react';
import ReactDOM from 'react-dom';
import { useSession } from '../../contexts/SessionContext';
import { authAPI } from '../../utils/ajax';
import { getDashboardPath } from '../../utils/session';
import notificationManager from '../../utils/notification';
import { sessionManager } from '../../utils/sessionManager';
import './DuplicateLoginModal.css';

const DuplicateLoginModal = () => {
  const { duplicateLoginModal, setDuplicateLoginModal } = useSession();
  

  const handleConfirm = async () => {
    if (!duplicateLoginModal.loginData) {
      console.error('❌ 로그인 데이터가 없습니다.');
      return;
    }

    try {
      console.log('🔔 중복 로그인 확인 처리 시작:', duplicateLoginModal.loginData);
      
      // 중복 로그인 확인 API 호출
      const response = await authAPI.confirmDuplicateLogin({
        email: duplicateLoginModal.loginData.email,
        password: duplicateLoginModal.loginData.password,
        confirmTerminate: true
      });

      if (response && response.success) {
        console.log('✅ 중복 로그인 확인 후 로그인 성공:', response.user);
        
        // 모달 닫기
        setDuplicateLoginModal({
          isOpen: false,
          message: '',
          loginData: null
        });
        
        // 세션에 사용자 정보 설정
        console.log('🔐 중복 로그인 성공 - 세션에 사용자 정보 설정 시작:', response.user);
        sessionManager.setUser(response.user, {
          accessToken: response.accessToken || 'duplicate_login_token',
          refreshToken: response.refreshToken || 'duplicate_login_refresh_token'
        });
        console.log('✅ 세션 설정 완료 - 사용자 정보 저장됨');
        
        // 성공 알림
        notificationManager.show('로그인에 성공했습니다.', 'success');
        
        // 역할에 따른 대시보드로 리다이렉트
        const userRole = response.user.role;
        console.log('🎯 중복 로그인 성공 후 리다이렉트:', userRole);
        
        setTimeout(() => {
          const dashboardPath = getDashboardPath(userRole);
          window.location.href = dashboardPath;
        }, 1000); // 1초 후 리다이렉트
      } else {
        console.log('❌ 중복 로그인 확인 후 로그인 실패:', response?.message);
        notificationManager.show(response?.message || '로그인에 실패했습니다.', 'error');
      }
    } catch (error) {
      console.error('❌ 중복 로그인 확인 처리 실패:', error);
      notificationManager.show('로그인 처리 중 오류가 발생했습니다.', 'error');
    }
  };

  const handleCancel = () => {
    console.log('❌ 중복 로그인 확인 취소');
    
    // 모달 닫기
    setDuplicateLoginModal({
      isOpen: false,
      message: '',
      loginData: null
    });
  };

  if (!duplicateLoginModal.isOpen) {
    return null;
  }

  return ReactDOM.createPortal(
    <div className="duplicate-login-modal-overlay">
      <div className="duplicate-login-modal-content">
        {/* 아이콘 */}
        <div className="duplicate-login-icon">
          ⚠️
        </div>
        
        {/* 제목 */}
        <h3 className="duplicate-login-title">
          중복 로그인 감지
        </h3>
        
        {/* 메시지 */}
        <p className="duplicate-login-message">
          {duplicateLoginModal.message}
        </p>
        
        {/* 버튼들 */}
        <div className="duplicate-login-actions">
          <button
            onClick={handleCancel}
            className="mg-btn mg-btn--secondary"
          >
            취소
          </button>
          
          <button
            onClick={handleConfirm}
            className="mg-btn mg-btn--primary"
          >
            기존 세션 종료하고 로그인
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default DuplicateLoginModal;
