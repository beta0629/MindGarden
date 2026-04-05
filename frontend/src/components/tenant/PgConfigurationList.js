import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CreditCard,
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  XCircle,
  Clock,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { useSession } from '../../contexts/SessionContext';
import { getPgConfigurations, deletePgConfiguration, testPgConnection } from '../../utils/pgApi';
import notificationManager from '../../utils/notification';
import AdminCommonLayout from '../layout/AdminCommonLayout';
import UnifiedLoading from '../common/UnifiedLoading';
import StatusBadge from '../common/StatusBadge';
import MGButton from '../common/MGButton';
import ContentArea from '../dashboard-v2/content/ContentArea';
import ContentHeader from '../dashboard-v2/content/ContentHeader';
import UnifiedModal from '../common/modals/UnifiedModal';
import '../../styles/unified-design-tokens.css';
import '../admin/AdminDashboard/AdminDashboardB0KlA.css';
import './PgConfigurationList.css';
import { toDisplayString } from '../../utils/safeDisplay';

/**
 * PG 설정 목록 페이지
 * 테넌트 포털에서 PG 설정 목록을 조회하고 관리
 *
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
const PgConfigurationList = () => {
  const navigate = useNavigate();
  const { user, isLoggedIn, isLoading: sessionLoading } = useSession();
  
  const [configurations, setConfigurations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [filters, setFilters] = useState({
    status: '',
    approvalStatus: '',
    search: ''
  });
  
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedConfig, setSelectedConfig] = useState(null);
  const [testingConnection, setTestingConnection] = useState(null);
  
  const tenantId = user?.tenantId || user?.tenant_id;
  
  const loadConfigurations = useCallback(async () => {
    if (!tenantId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const params = {};
      if (filters.status) params.status = filters.status;
      if (filters.approvalStatus) params.approvalStatus = filters.approvalStatus;
      
      const configs = await getPgConfigurations(tenantId, params);
      
      let filteredConfigs = configs;
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        filteredConfigs = configs.filter(config => 
          config.pgName?.toLowerCase().includes(searchLower) ||
          config.pgProvider?.toLowerCase().includes(searchLower) ||
          config.notes?.toLowerCase().includes(searchLower)
        );
      }
      
      setConfigurations(filteredConfigs);
    } catch (err) {
      console.error('PG 설정 목록 로드 실패:', err);
      setError('PG 설정 목록을 불러오는 중 오류가 발생했습니다.');
      notificationManager.error('PG 설정 목록 로드 실패');
    } finally {
      setLoading(false);
    }
  }, [tenantId, filters]);
  
  useEffect(() => {
    if (!sessionLoading && isLoggedIn && user && tenantId) {
      loadConfigurations();
    }
  }, [sessionLoading, isLoggedIn, user, tenantId, loadConfigurations]);
  
  const handleDelete = async () => {
    if (!selectedConfig || !tenantId) return;
    
    try {
      setLoading(true);
      await deletePgConfiguration(tenantId, selectedConfig.configId);
      notificationManager.success('PG 설정이 삭제되었습니다.');
      setShowDeleteModal(false);
      setSelectedConfig(null);
      loadConfigurations();
    } catch (err) {
      console.error('PG 설정 삭제 실패:', err);
      notificationManager.error('PG 설정 삭제 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleTestConnection = async (configId) => {
    if (!tenantId) return;
    
    try {
      setTestingConnection(configId);
      const result = await testPgConnection(tenantId, configId);
      
      if (result.success) {
        notificationManager.success('연결 테스트 성공');
      } else {
        notificationManager.error(`연결 테스트 실패: ${result.message}`);
      }
      
      loadConfigurations();
    } catch (err) {
      console.error('연결 테스트 실패:', err);
      notificationManager.error('연결 테스트 중 오류가 발생했습니다.');
    } finally {
      setTestingConnection(null);
    }
  };
  
  const renderStatusBadge = (status) => {
    const statusConfig = {
      PENDING: { label: '대기 중', variant: 'warning' },
      APPROVED: { label: '승인됨', variant: 'success' },
      REJECTED: { label: '거부됨', variant: 'danger' },
      ACTIVE: { label: '활성화', variant: 'success' },
      INACTIVE: { label: '비활성화', variant: 'neutral' }
    };
    const config = statusConfig[status] || statusConfig.PENDING;
    return <StatusBadge variant={config.variant}>{toDisplayString(config.label, '—')}</StatusBadge>;
  };

  const renderApprovalBadge = (approvalStatus) => {
    const statusConfig = {
      PENDING: { label: '승인 대기', variant: 'warning' },
      APPROVED: { label: '승인됨', variant: 'success' },
      REJECTED: { label: '거부됨', variant: 'danger' }
    };
    const config = statusConfig[approvalStatus] || statusConfig.PENDING;
    return <StatusBadge variant={config.variant}>{toDisplayString(config.label, '—')}</StatusBadge>;
  };
  
  if (sessionLoading || (loading && configurations.length === 0)) {
    return (
      <AdminCommonLayout title="PG 설정 목록">
        <div className="mg-v2-ad-b0kla mg-v2-pg-config-list">
          <div className="mg-v2-ad-b0kla__container">
            <UnifiedLoading type="page" text="PG 설정 목록을 불러오는 중..." variant="pulse" />
          </div>
        </div>
      </AdminCommonLayout>
    );
  }
  
  if (!isLoggedIn || !user) {
    return (
      <AdminCommonLayout title="PG 설정 목록">
        <div className="mg-v2-ad-b0kla mg-v2-pg-config-list">
          <div className="mg-v2-ad-b0kla__container">
            <div className="error-message">
              <AlertCircle size={24} />
              <p>로그인이 필요합니다.</p>
            </div>
          </div>
        </div>
      </AdminCommonLayout>
    );
  }

  if (!tenantId) {
    return (
      <AdminCommonLayout title="PG 설정 목록">
        <div className="mg-v2-ad-b0kla mg-v2-pg-config-list">
          <div className="mg-v2-ad-b0kla__container">
            <div className="error-message">
              <AlertCircle size={24} />
              <p>테넌트 정보를 찾을 수 없습니다.</p>
            </div>
          </div>
        </div>
      </AdminCommonLayout>
    );
  }
  
  return (
    <AdminCommonLayout title="PG 설정 목록">
      <div className="mg-v2-ad-b0kla mg-v2-pg-config-list">
        <div className="mg-v2-ad-b0kla__container">
          <ContentArea ariaLabel="PG 설정 목록">
            <ContentHeader
              title="PG 설정 관리"
              subtitle="결제 게이트웨이 설정을 조회·등록·관리합니다."
              titleId="pg-config-list-title"
              actions={
                <MGButton
                  type="button"
                  variant="primary"
                  size="medium"
                  onClick={() => navigate('/tenant/pg-configurations/new')}
                  preventDoubleClick={false}
                >
                  <Plus size={18} />
                  PG 설정 등록
                </MGButton>
              }
            />

        {/* 필터 및 검색 */}
        <div className="pg-config-list-filters mg-v2-pg-config-list__filters">
          <div className="search-box">
            <Search size={18} />
            <input
              type="text"
              placeholder="PG사명, 제공자, 비고로 검색..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="search-input"
              aria-label="PG 설정 검색"
            />
          </div>
          
          <div className="filter-group">
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="filter-select"
              aria-label="상태 필터"
            >
              <option value="">전체 상태</option>
              {/* 표준화: 상태값 공통코드 동적 조회 권장 getCommonCodes('STATUS_GROUP') */}
              <option value="PENDING">대기 중</option>
              <option value="APPROVED">승인됨</option>
              <option value="REJECTED">거부됨</option>
              <option value="ACTIVE">활성화</option>
              <option value="INACTIVE">비활성화</option>
            </select>
            
            <select
              value={filters.approvalStatus}
              onChange={(e) => setFilters(prev => ({ ...prev, approvalStatus: e.target.value }))}
              className="filter-select"
              aria-label="승인 상태 필터"
            >
              <option value="">전체 승인 상태</option>
              {/* 표준화: 승인 상태 공통코드 동적 조회 권장 */}
              <option value="PENDING">승인 대기</option>
              <option value="APPROVED">승인됨</option>
              <option value="REJECTED">거부됨</option>
            </select>
            
            <MGButton
              type="button"
              variant="secondary"
              size="small"
              onClick={loadConfigurations}
              preventDoubleClick={false}
            >
              <RefreshCw size={16} />
              새로고침
            </MGButton>
          </div>
        </div>
        
        {/* 에러 메시지 */}
        {error && (
          <div className="error-alert">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}
        
        {/* PG 설정 목록 */}
        {configurations.length === 0 ? (
          <div className="empty-state">
            <CreditCard size={48} />
            <h3>PG 설정이 없습니다</h3>
            <p>새로운 PG 설정을 등록해주세요.</p>
            <MGButton
              type="button"
              variant="primary"
              onClick={() => navigate('/tenant/pg-configurations/new')}
              preventDoubleClick={false}
            >
              <Plus size={18} />
              PG 설정 등록
            </MGButton>
          </div>
        ) : (
          <div className="pg-config-cards">
            {configurations.map((config) => (
              <div 
                key={config.configId} 
                className="pg-config-card"
                role="article"
                aria-label={`PG 설정: ${config.pgName || config.pgProvider}`}
              >
                <div className="card-header">
                  <div className="card-title">
                    <h3>{config.pgName || config.pgProvider}</h3>
                    <div className="card-badges">
                      {renderStatusBadge(config.status)}
                      {renderApprovalBadge(config.approvalStatus)}
                      {config.testMode && (
                        <StatusBadge variant="info">테스트 모드</StatusBadge>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="card-body">
                  <div className="card-info">
                    <div className="info-item">
                      <span className="info-label">PG 제공자:</span>
                      <span className="info-value">{config.pgProvider}</span>
                    </div>
                    {config.merchantId && (
                      <div className="info-item">
                        <span className="info-label">가맹점 ID:</span>
                        <span className="info-value">{config.merchantId}</span>
                      </div>
                    )}
                    {config.storeId && (
                      <div className="info-item">
                        <span className="info-label">스토어 ID:</span>
                        <span className="info-value">{config.storeId}</span>
                      </div>
                    )}
                    {config.notes && (
                      <div className="info-item">
                        <span className="info-label">비고:</span>
                        <span className="info-value">{config.notes}</span>
                      </div>
                    )}
                    {config.lastConnectionTestAt && (
                      <div className="info-item">
                        <span className="info-label">마지막 연결 테스트:</span>
                        <span className="info-value">
                          {new Date(config.lastConnectionTestAt).toLocaleString('ko-KR')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="card-footer">
                  <div className="card-actions">
                    <MGButton
                      type="button"
                      variant="secondary"
                      size="small"
                      onClick={() => navigate(`/tenant/pg-configurations/${config.configId}`)}
                      preventDoubleClick={false}
                    >
                      <Eye size={16} />
                      상세보기
                    </MGButton>

                    {config.status === 'APPROVED' && (
                      <MGButton
                        type="button"
                        variant="secondary"
                        size="small"
                        onClick={() => handleTestConnection(config.configId)}
                        disabled={testingConnection === config.configId}
                        loading={testingConnection === config.configId}
                        loadingText="테스트 중..."
                        preventDoubleClick={false}
                      >
                        <RefreshCw size={16} />
                        연결 테스트
                      </MGButton>
                    )}

                    {config.approvalStatus === 'PENDING' && (
                      <>
                        <MGButton
                          type="button"
                          variant="secondary"
                          size="small"
                          onClick={() => navigate(`/tenant/pg-configurations/${config.configId}/edit`)}
                          preventDoubleClick={false}
                        >
                          <Edit size={16} />
                          수정
                        </MGButton>
                        <MGButton
                          type="button"
                          variant="danger"
                          size="small"
                          onClick={() => {
                            setSelectedConfig(config);
                            setShowDeleteModal(true);
                          }}
                          preventDoubleClick={false}
                        >
                          <Trash2 size={16} />
                          삭제
                        </MGButton>
                      </>
                    )}
                  </div>

                  {config.approvalStatus === 'PENDING' && (
                    <div className="pending-notice">
                      <Clock size={14} />
                      <span>승인 대기 중입니다. 승인 후 사용 가능합니다.</span>
                    </div>
                  )}

                  {config.approvalStatus === 'REJECTED' && config.rejectionReason && (
                    <div className="rejected-notice">
                      <XCircle size={14} />
                      <span>거부됨: {config.rejectionReason}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* 삭제 확인 모달 */}
        <UnifiedModal
          isOpen={Boolean(showDeleteModal && selectedConfig)}
          onClose={() => setShowDeleteModal(false)}
          title="PG 설정 삭제"
          size="small"
          variant="confirm"
          className="mg-v2-ad-b0kla"
          backdropClick={!loading}
          loading={loading}
          actions={
            <>
              <MGButton
                type="button"
                variant="secondary"
                onClick={() => setShowDeleteModal(false)}
                disabled={loading}
                preventDoubleClick={false}
              >
                취소
              </MGButton>
              <MGButton
                type="button"
                variant="danger"
                onClick={handleDelete}
                disabled={loading}
                preventDoubleClick={false}
              >
                삭제
              </MGButton>
            </>
          }
        >
          {selectedConfig && (
            <>
              <p>
                정말로{' '}
                <strong>{selectedConfig.pgName || selectedConfig.pgProvider}</strong>
                {' '}설정을 삭제하시겠습니까?
              </p>
              <p className="warning-text">이 작업은 되돌릴 수 없습니다.</p>
            </>
          )}
        </UnifiedModal>
          </ContentArea>
        </div>
      </div>
    </AdminCommonLayout>
  );
};

export default PgConfigurationList;

