import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSession } from '../../contexts/SessionContext';
import { getPgConfigurationDetail, updatePgConfiguration } from '../../utils/pgApi';
import { showNotification } from '../../utils/notification';
import AdminCommonLayout from '../layout/AdminCommonLayout';
import ContentArea from '../dashboard-v2/content/ContentArea';
import ContentHeader from '../dashboard-v2/content/ContentHeader';
import '../../styles/unified-design-tokens.css';
import './PgConfigurationForm.css';
import PgConfigurationForm from './PgConfigurationForm';
import { useTranslation } from 'react-i18next';
import { ADMIN_SHOP_PG_COPY } from '../../constants/adminShopSuite';

/**
 * PG 설정 수정 페이지
 *
 * <p>승인·운영 후에도 수정 가능. 저장 시 재승인(approvalStatus=PENDING)이 되며
 * ACTIVE 설정은 운영 결제를 유지한다.</p>
 *
 * @author CoreSolution
 * @version 1.1.0
 * @since 2025-01-XX
 */
const PgConfigurationEdit = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id: configId } = useParams();
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
      <AdminCommonLayout
        title={t('admin.actions.editPgSettings')}
        loading
        loadingText={t('common:tenant.PgConfigurationDetail.t_f7022e97', {
          defaultValue: 'PG 설정을 불러오는 중...'
        })}
      />
    );
  }

  if (!config) {
    return (
      <AdminCommonLayout title={t('admin.actions.editPgSettings')}>
        <ContentArea
          ariaLabel="PG 설정 수정"
          className="mg-v2-pg-config-edit pg-config-edit--clinic-os"
        >
          <div className="error-message">
            <p>PG 설정을 찾을 수 없습니다.</p>
          </div>
        </ContentArea>
      </AdminCommonLayout>
    );
  }

  const showReapprovalSubtitle = config.status === 'ACTIVE'
    || config.status === 'APPROVED'
    || config.approvalStatus === 'APPROVED'
    || config.approvalStatus === 'REJECTED';

  return (
    <AdminCommonLayout title={t('admin.actions.editPgSettings')}>
      <ContentArea
        ariaLabel="PG 설정 수정"
        className="mg-v2-pg-config-edit pg-config-edit--clinic-os"
      >
        <ContentHeader
          title="결제 연결"
          subtitle={showReapprovalSubtitle
            ? ADMIN_SHOP_PG_COPY.EDIT_REAPPROVAL_NOTICE
            : '카드·간편결제 · 저장 후 승인 요청'}
          titleId="pg-config-edit-title"
        />
        <div className="pg-config-form-stage">
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
    </AdminCommonLayout>
  );
};

export default PgConfigurationEdit;
