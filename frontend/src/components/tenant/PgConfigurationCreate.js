import { useNavigate } from 'react-router-dom';
import { useSession } from '../../contexts/SessionContext';
import { createPgConfiguration } from '../../utils/pgApi';
import { showNotification } from '../../utils/notification';
import AdminCommonLayout from '../layout/AdminCommonLayout';
import ContentArea from '../dashboard-v2/content/ContentArea';
import ContentHeader from '../dashboard-v2/content/ContentHeader';
import '../../styles/unified-design-tokens.css';
import '../admin/AdminDashboard/AdminDashboardB0KlA.css';
import PgConfigurationForm from './PgConfigurationForm';

/**
 * PG 설정 생성 페이지
 *
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
const PgConfigurationCreate = () => {
  const navigate = useNavigate();
  const { user } = useSession();
  
  const tenantId = user?.tenantId || user?.tenant_id;
  
  const handleSave = async (formData) => {
    if (!tenantId) {
      showNotification('테넌트 정보를 찾을 수 없습니다.', 'error');
      return;
    }
    
    await createPgConfiguration(tenantId, formData);
    navigate('/tenant/pg-configurations');
  };
  
  const handleCancel = () => {
    navigate('/tenant/pg-configurations');
  };
  
  if (!tenantId) {
    return (
      <AdminCommonLayout title="PG 설정 생성">
        <div className="mg-v2-ad-b0kla mg-v2-pg-config-create">
          <div className="mg-v2-ad-b0kla__container">
            <div className="error-message">
              <p>테넌트 정보를 찾을 수 없습니다.</p>
            </div>
          </div>
        </div>
      </AdminCommonLayout>
    );
  }

  return (
    <AdminCommonLayout title="PG 설정 생성">
      <div className="mg-v2-ad-b0kla mg-v2-pg-config-create">
        <div className="mg-v2-ad-b0kla__container">
          <ContentArea ariaLabel="PG 설정 등록">
            <ContentHeader
              title="PG 설정 등록"
              subtitle="결제 게이트웨이 설정 정보를 입력합니다. 암호화 저장 후 운영 승인 절차를 거칩니다."
              titleId="pg-config-create-title"
            />
            <div className="pg-config-create-page">
              <PgConfigurationForm
                onSave={handleSave}
                onCancel={handleCancel}
                mode="create"
                hidePageTitle
              />
            </div>
          </ContentArea>
        </div>
      </div>
    </AdminCommonLayout>
  );
};

export default PgConfigurationCreate;

