import React from 'react';
import ReactDOM from 'react-dom';
import { AlertTriangle, XCircle, Check } from 'lucide-react';
import { useSession } from '../../contexts/SessionContext';
import { authAPI } from '../../utils/ajax';
import { redirectToDynamicDashboard } from '../../utils/dashboardUtils';
import notificationManager from '../../utils/notification';
import { sessionManager } from '../../utils/sessionManager';

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
      // apiPost는 ApiResponse 래퍼에서 data를 추출하여 반환하므로,
      // response는 { user, sessionId } 형태입니다.
      const response = await authAPI.confirmDuplicateLogin({
        email: duplicateLoginModal.loginData.email,
        password: duplicateLoginModal.loginData.password,
        confirmTerminate: true
      });

      // apiPost가 ApiResponse.data를 반환하므로 response.user를 체크
      if (response && response.user) {
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
          sessionId: response.sessionId || null
        });
        console.log('✅ 세션 설정 완료 - 사용자 정보 저장됨');
        
        // 성공 알림
        notificationManager.show('로그인에 성공했습니다.', 'success');
        
        // 동적 대시보드 라우팅
        const authResponse = {
          user: response.user,
          currentTenantRole: response.currentTenantRole || null
        };
        console.log('🎯 중복 로그인 성공 후 동적 대시보드 리다이렉트');
        
        // 로그인 페이지의 UnifiedLogin과 동일한 로직으로 처리
        // 세션 확인 후 대시보드로 리다이렉트
        setTimeout(async () => {
          try {
            // 세션 확인
            await sessionManager.checkSession(true);
            
            // redirectToDynamicDashboard 사용 (navigate 없이 window.location 사용)
            const { redirectToDynamicDashboard } = await import('../../utils/dashboardUtils');
            
            // window.location을 사용해야 하므로 navigate 없이 처리
            // 하지만 redirectToDynamicDashboard는 navigate를 받으므로,
            // 직접 처리
            const { getCurrentUserDashboard, getDynamicDashboardPath } = await import('../../utils/dashboardUtils');
            const dashboard = await getCurrentUserDashboard(
              response.user.tenantId,
              response.currentTenantRole?.tenantRoleId
            );
            if (dashboard) {
              const dashboardPath = getDynamicDashboardPath(dashboard);
              window.location.href = dashboardPath;
            } else {
              // 레거시 폴백
              const { getLegacyDashboardPath } = await import('../../utils/dashboardUtils');
              window.location.href = getLegacyDashboardPath(response.user.role);
            }
          } catch (error) {
            console.error('대시보드 리다이렉트 실패:', error);
            // 에러 발생 시에도 대시보드로 이동
            window.location.href = '/dashboard';
          }
        }, 500); // 500ms 후 리다이렉트 (세션 설정 시간 확보)
      } else {
        console.log('❌ 중복 로그인 확인 후 로그인 실패:', response);
        notificationManager.show('로그인에 실패했습니다.', 'error');
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
    <div className="mg-v2-modal-overlay mg-v2-modal-overlay--high-z">
      <div className="mg-v2-modal" onClick={(e) => e.stopPropagation()}>
        <div className="mg-v2-modal-header">
          <div className="mg-v2-modal-title-wrapper">
            <AlertTriangle size={28} className="mg-v2-modal-title-icon" />
            <h2 className="mg-v2-modal-title">중복 로그인 감지</h2>
          </div>
          <button className="mg-v2-modal-close" onClick={handleCancel} aria-label="닫기">
            <XCircle size={24} />
          </button>
        </div>
        
        <div className="mg-v2-modal-body">
          <div className="mg-v2-empty-state">
            <AlertTriangle size={48} className="mg-v2-color-warning" />
            <p className="mg-v2-text-base mg-v2-mt-md">{duplicateLoginModal.message}</p>
          </div>
          
          <div className="mg-v2-info-box mg-v2-mt-md">
            <p className="mg-v2-text-sm mg-v2-text-secondary">
              기존 세션을 종료하면 현재 기기에서 로그인할 수 있습니다.
            </p>
          </div>
        </div>

        <div className="mg-v2-modal-footer">
          <button
            onClick={handleCancel}
            className="mg-v2-button mg-v2-button--secondary"
          >
            <XCircle size={20} className="mg-v2-icon-inline" />
            취소
          </button>
          
          <button
            onClick={handleConfirm}
            className="mg-v2-button mg-v2-button--primary"
          >
            <Check size={20} className="mg-v2-icon-inline" />
            기존 세션 종료하고 로그인
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default DuplicateLoginModal;
