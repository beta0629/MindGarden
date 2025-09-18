import React from 'react';
import { useSession } from '../../contexts/SessionContext';
import { authAPI } from '../../utils/ajax';
import notificationManager from '../../utils/notification';
import { sessionManager } from '../../utils/sessionManager';

const DuplicateLoginModal = () => {
  const { duplicateLoginModal, setDuplicateLoginModal } = useSession();
  
  // 디버깅용 로그
  console.log('🔍 DuplicateLoginModal 렌더링:', duplicateLoginModal);

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
        console.log('🔐 세션에 사용자 정보 설정:', response.user);
        sessionManager.setUser(response.user, {
          accessToken: response.accessToken || 'duplicate_login_token',
          refreshToken: response.refreshToken || 'duplicate_login_refresh_token'
        });
        
        // 성공 알림
        notificationManager.show('로그인에 성공했습니다.', 'success');
        
        // 역할에 따른 대시보드로 리다이렉트
        const userRole = response.user.role;
        console.log('🎯 중복 로그인 성공 후 리다이렉트:', userRole);
        
        setTimeout(() => {
          if (userRole === 'ADMIN') {
            window.location.href = '/admin/dashboard';
          } else if (userRole === 'SUPER_ADMIN') {
            window.location.href = '/super-admin/dashboard';
          } else if (userRole === 'CONSULTANT') {
            window.location.href = '/consultant/dashboard';
          } else {
            window.location.href = '/client/dashboard';
          }
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

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '24px',
        maxWidth: '400px',
        width: '90%',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
        textAlign: 'center'
      }}>
        {/* 아이콘 */}
        <div style={{
          fontSize: '48px',
          marginBottom: '16px',
          color: '#f59e0b'
        }}>
          ⚠️
        </div>
        
        {/* 제목 */}
        <h3 style={{
          fontSize: '18px',
          fontWeight: '600',
          marginBottom: '12px',
          color: '#1f2937'
        }}>
          중복 로그인 감지
        </h3>
        
        {/* 메시지 */}
        <p style={{
          fontSize: '14px',
          color: '#6b7280',
          marginBottom: '24px',
          lineHeight: '1.5'
        }}>
          {duplicateLoginModal.message}
        </p>
        
        {/* 버튼들 */}
        <div style={{
          display: 'flex',
          gap: '12px',
          justifyContent: 'center'
        }}>
          <button
            onClick={handleCancel}
            style={{
              padding: '10px 20px',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              backgroundColor: 'white',
              color: '#6b7280',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => {
              e.target.style.backgroundColor = '#f9fafb';
            }}
            onMouseOut={(e) => {
              e.target.style.backgroundColor = 'white';
            }}
          >
            취소
          </button>
          
          <button
            onClick={handleConfirm}
            style={{
              padding: '10px 20px',
              border: 'none',
              borderRadius: '8px',
              backgroundColor: '#3b82f6',
              color: 'white',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => {
              e.target.style.backgroundColor = '#2563eb';
            }}
            onMouseOut={(e) => {
              e.target.style.backgroundColor = '#3b82f6';
            }}
          >
            기존 세션 종료하고 로그인
          </button>
        </div>
      </div>
    </div>
  );
};

export default DuplicateLoginModal;
