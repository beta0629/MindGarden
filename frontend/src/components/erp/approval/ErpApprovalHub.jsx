import { useSearchParams } from 'react-router-dom';
import AdminApprovalDashboard from '../AdminApprovalDashboard';
import SuperAdminApprovalDashboard from '../SuperAdminApprovalDashboard';
import { APPROVAL_HUB_MODE_SUPER } from './erpApprovalHubRoutes';

/**
 * 단일 URL `/erp/approvals`에서 쿼리 mode에 따라 일반/상위 승인 대시보드 표시.
 * 권한 검증은 각 대시보드 기존 동작에 위임.
 *
 * @returns {React.ReactElement}
 */
const ErpApprovalHub = () => {
  const [searchParams] = useSearchParams();
  const raw = searchParams.get('mode');
  const isSuper = raw === APPROVAL_HUB_MODE_SUPER;

  if (isSuper) {
    return <SuperAdminApprovalDashboard />;
  }
  return <AdminApprovalDashboard />;
};

export default ErpApprovalHub;
