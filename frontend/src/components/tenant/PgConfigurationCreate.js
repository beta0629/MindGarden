import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '../../contexts/SessionContext';
import { createPgConfiguration } from '../../utils/pgApi';
import { showNotification } from '../../utils/notification';
import SimpleLayout from '../layout/SimpleLayout';
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
      <SimpleLayout>
        <div className="error-message">
          <p>테넌트 정보를 찾을 수 없습니다.</p>
        </div>
      </SimpleLayout>
    );
  }
  
  return (
    <SimpleLayout>
      <div className="pg-config-create-page">
        <PgConfigurationForm
          tenantId={tenantId}
          onSave={handleSave}
          onCancel={handleCancel}
          mode="create"
        />
      </div>
    </SimpleLayout>
  );
};

export default PgConfigurationCreate;

