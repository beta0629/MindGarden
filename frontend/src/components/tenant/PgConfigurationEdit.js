import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSession } from '../../contexts/SessionContext';
import { getPgConfigurationDetail, updatePgConfiguration } from '../../utils/pgApi';
import { showNotification } from '../../utils/notification';
import AdminCommonLayout from '../layout/AdminCommonLayout';
import ContentArea from '../dashboard-v2/content/ContentArea';
import ContentHeader from '../dashboard-v2/content/ContentHeader';
import UnifiedLoading from '../common/UnifiedLoading';
import '../../styles/unified-design-tokens.css';
import '../admin/AdminDashboard/AdminDashboardB0KlA.css';
import PgConfigurationForm from './PgConfigurationForm';

/**
 * PG 설정 수정 페이지
 *
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
const PgConfigurationEdit = () => {
  const navigate = useNavigate();
  const { configId } = useParams();
  const { user, isLoggedIn, isLoading: sessionLoading } = useSession();
  
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const tenantId = user?.tenantId || user?.tenant_id;
  
  useEffect(() => {
    if (!tenantId || !configId) return;
    
    const loadConfig = async() => {
      try {
        setLoading(true);
        const detail = await getPgConfigurationDetail(tenantId, configId);
        setConfig(detail);
      } catch (err) {
        console.error('PG 설정 로드 실패:', err);
        showNotification('PG 설정 정보를 불러오는 중 오류가 발생했습니다.', 'error');
        navigate('/tenant/pg-configurations');
      } finally {
        setLoading(false);
      }
    };
    
    if (!sessionLoading && isLoggedIn && user && tenantId) {
      loadConfig();
    }
  }, [tenantId, configId, sessionLoading, isLoggedIn, user, navigate]);

  useEffect(() => {
    if (!config) return;
    if (config.approvalStatus !== 'PENDING') {
      showNotification('승인 대기 상태인 설정만 수정할 수 있습니다.', 'error');
      navigate(`/tenant/pg-configurations/${configId}`, { replace: true });
    }
  }, [config, configId, navigate]);

  const handleSave = async(formData) => {
    if (!tenantId || !configId) {
      showNotification('테넌트 정보를 찾을 수 없습니다.', 'error');
      return;
    }
    
    await updatePgConfiguration(tenantId, configId, formData);
    navigate(`/tenant/pg-configurations/${configId}`);
  };
  
  const handleCancel = () => {
    navigate(`/tenant/pg-configurations/${configId}`);
  };
  
  if (sessionLoading || loading) {
    return (
      <AdminCommonLayout title="PG 설정 수정">
        <div className="mg-v2-ad-b0kla mg-v2-pg-config-edit">
          <div className="mg-v2-ad-b0kla__container">
            <UnifiedLoading type="inline" text="PG 설정을 불러오는 중..." variant="pulse" />
          </div>
        </div>
      </AdminCommonLayout>
    );
  }

  if (!config) {
    return (
      <AdminCommonLayout title="PG 설정 수정">
        <div className="mg-v2-ad-b0kla mg-v2-pg-config-edit">
          <div className="mg-v2-ad-b0kla__container">
            <div className="error-message">
              <p>PG 설정을 찾을 수 없습니다.</p>
            </div>
          </div>
        </div>
      </AdminCommonLayout>
    );
  }

  if (config.approvalStatus !== 'PENDING') {
    return (
      <AdminCommonLayout title="PG 설정 수정">
        <div className="mg-v2-ad-b0kla mg-v2-pg-config-edit">
          <div className="mg-v2-ad-b0kla__container">
            <UnifiedLoading type="inline" text="상세 화면으로 이동합니다..." variant="pulse" />
          </div>
        </div>
      </AdminCommonLayout>
    );
  }

  return (
    <AdminCommonLayout title="PG 설정 수정">
      <div className="mg-v2-ad-b0kla mg-v2-pg-config-edit">
        <div className="mg-v2-ad-b0kla__container">
          <ContentArea ariaLabel="PG 설정 수정">
            <ContentHeader
              title="PG 설정 수정"
              subtitle="승인 대기 중인 설정만 수정할 수 있습니다. 저장 시 다시 승인 절차가 진행됩니다."
              titleId="pg-config-edit-title"
            />
            <div className="pg-config-edit-page">
              <PgConfigurationForm
                initialData={config}
                onSave={handleSave}
                onCancel={handleCancel}
                mode="edit"
                hidePageTitle
                tenantId={tenantId}
                configId={configId}
              />
            </div>
          </ContentArea>
        </div>
      </div>
    </AdminCommonLayout>
  );
};

export default PgConfigurationEdit;

