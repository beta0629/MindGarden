import React from 'react';
import { AlertTriangle, XCircle, Check } from 'lucide-react';
import { useSession } from '../../contexts/SessionContext';
import { authAPI } from '../../utils/ajax';
import notificationManager from '../../utils/notification';
import { sessionManager } from '../../utils/sessionManager';
import UnifiedModal from './modals/UnifiedModal';
import Button from '../ui/Button/Button';
import SafeText from './SafeText';

const DuplicateLoginModal = () => {
  const { duplicateLoginModal, setDuplicateLoginModal, checkSession } = useSession();

  const handleConfirm = async () => {
    if (!duplicateLoginModal.loginData) {
      console.error('❌ 로그인 데이터가 없습니다.');
      return;
    }

    try {
      console.log('🔔 중복 로그인 확인 처리 시작:', duplicateLoginModal.loginData);

      const response = await authAPI.confirmDuplicateLogin({
        email: duplicateLoginModal.loginData.email,
        password: duplicateLoginModal.loginData.password,
        confirmTerminate: true
      });

      if (response && response.user) {
        console.log('✅ 중복 로그인 확인 후 로그인 성공:', response.user);

        setDuplicateLoginModal({
          isOpen: false,
          message: '',
          loginData: null
        });

        console.log('🔐 중복 로그인 성공 - 세션에 사용자 정보 설정 시작:', response.user);
        sessionManager.setUser(response.user, {
          sessionId: response.sessionId || null
        });
        // SessionContext 동기화 (로그인 직후 공통코드 등에서 user 사용 가능하도록)
        await checkSession(true);
        console.log('✅ 세션 설정 완료 - 사용자 정보 저장됨');

        notificationManager.show('로그인에 성공했습니다.', 'success');

        const authResponse = {
          user: response.user,
          currentTenantRole: response.currentTenantRole || null
        };
        console.log('🎯 중복 로그인 성공 후 동적 대시보드 리다이렉트');

        setTimeout(async () => {
          try {

            const { getCurrentUserDashboard, getDynamicDashboardPath } = await import('../../utils/dashboardUtils');
            const dashboard = await getCurrentUserDashboard(
              response.user.tenantId,
              response.currentTenantRole?.tenantRoleId
            );
            if (dashboard) {
              const dashboardPath = getDynamicDashboardPath(dashboard);
              window.location.href = dashboardPath;
            } else {
              const { getLegacyDashboardPath } = await import('../../utils/dashboardUtils');
              window.location.href = getLegacyDashboardPath(response.user.role);
            }
          } catch (error) {
            console.error('대시보드 리다이렉트 실패:', error);
            window.location.href = '/dashboard';
          }
        }, 500);
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

    setDuplicateLoginModal({
      isOpen: false,
      message: '',
      loginData: null
    });
  };

  return (
    <UnifiedModal
      isOpen={!!duplicateLoginModal.isOpen}
      onClose={handleCancel}
      title="중복 로그인 감지"
      size="medium"
      backdropClick={false}
      showCloseButton
      zIndex={10000}
      actions={
        <>
          <Button variant="outline" size="medium" onClick={handleCancel} preventDoubleClick={false}>
            <XCircle size={20} className="mg-v2-icon-inline" />
            취소
          </Button>
          <Button variant="primary" size="medium" onClick={handleConfirm} preventDoubleClick={false}>
            <Check size={20} className="mg-v2-icon-inline" />
            기존 세션 종료하고 로그인
          </Button>
        </>
      }
    >
      <div className="mg-v2-empty-state">
        <AlertTriangle size={48} className="mg-v2-color-warning" />
        <SafeText className="mg-v2-text-base mg-v2-mt-md" tag="p">{duplicateLoginModal.message}</SafeText>
      </div>

      <div className="mg-v2-info-box mg-v2-mt-md">
        <p className="mg-v2-text-sm mg-v2-text-secondary">
          기존 세션을 종료하면 현재 기기에서 로그인할 수 있습니다.
        </p>
      </div>
    </UnifiedModal>
  );
};

export default DuplicateLoginModal;
