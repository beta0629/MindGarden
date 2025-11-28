import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSession } from '../../contexts/SessionContext';
import { getPgConfigurationDetail, updatePgConfiguration } from '../../utils/pgApi';
import { showNotification } from '../../utils/notification';
import SimpleLayout from '../layout/SimpleLayout';
import UnifiedLoading from '../common/UnifiedLoading';
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
    
    const loadConfig = async () => {
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
  
  const handleSave = async (formData) => {
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
      <SimpleLayout>
        <UnifiedLoading />
      </SimpleLayout>
    );
  }
  
  if (!config) {
    return (
      <SimpleLayout>
        <div className="error-message">
          <p>PG 설정을 찾을 수 없습니다.</p>
        </div>
      </SimpleLayout>
    );
  }
  
  // 승인 대기 상태가 아니면 수정 불가
  if (config.approvalStatus !== 'PENDING') {
    showNotification('승인 대기 상태인 설정만 수정할 수 있습니다.', 'error');
    navigate(`/tenant/pg-configurations/${configId}`);
    return null;
  }
  
  return (
    <SimpleLayout>
      <div className="pg-config-edit-page">
        <PgConfigurationForm
          tenantId={tenantId}
          initialData={config}
          onSave={handleSave}
          onCancel={handleCancel}
          mode="edit"
        />
      </div>
    </SimpleLayout>
  );
};

export default PgConfigurationEdit;

