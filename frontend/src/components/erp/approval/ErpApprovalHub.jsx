import { useSearchParams } from 'react-router-dom';
import AdminCommonLayout from '../../layout/AdminCommonLayout';
import OpsApprovalCenter from './OpsApprovalCenter';
import { APPROVAL_HUB_MODE_SUPER } from './erpApprovalHubRoutes';
import { OAC_PAGE_TITLE } from '../../../constants/opsApprovalCenterStrings';

/**
 * 단일 URL `/erp/approvals`에서 쿼리 mode에 따라 일반/상위 운영 승인 센터 표시.
 * Clinic-OS: quiet header → summary strip → stage table (OpsApprovalCenter).
 * 권한: 라우트 ProtectedRoute ADMIN + 본 화면 hard-money confirm.
 *
 * @returns {React.ReactElement}
 */
const ErpApprovalHub = () => {
  const [searchParams] = useSearchParams();
  const raw = searchParams.get('mode');
  const isSuper = raw === APPROVAL_HUB_MODE_SUPER;
  const mode = isSuper ? 'super' : 'admin';

  return (
    <AdminCommonLayout title={OAC_PAGE_TITLE}>
      <OpsApprovalCenter mode={mode} />
    </AdminCommonLayout>
  );
};

export default ErpApprovalHub;
