import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CreditCard, 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  RefreshCw,
  Power,
  PowerOff
} from 'lucide-react';
import { useSession } from '../../contexts/SessionContext';
import { getPgConfigurations, deletePgConfiguration, testPgConnection } from '../../utils/pgApi';
import { showNotification } from '../../utils/notification';
import SimpleLayout from '../layout/SimpleLayout';
import UnifiedLoading from '../common/UnifiedLoading';
import MGButton from '../common/MGButton';
import './PgConfigurationList.css';

/**
 * PG 설정 목록 페이지
 * 테넌트 포털에서 PG 설정 목록을 조회하고 관리하는 페이지
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
const PgConfigurationList = () => {
  const navigate = useNavigate();
  const { user, isLoggedIn, isLoading: sessionLoading } = useSession();
  
  // 상태 관리
  const [configurations, setConfigurations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // 필터 및 검색
  const [filters, setFilters] = useState({
    status: '',
    approvalStatus: '',
    search: ''
  });
  
  // 모달 상태
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedConfig, setSelectedConfig] = useState(null);
  const [testingConnection, setTestingConnection] = useState(null);
  
  // 테넌트 ID (세션에서 가져오기)
  const tenantId = user?.tenantId || user?.tenant_id;
  
  // PG 설정 목록 로드
  const loadConfigurations = useCallback(async () => {
    if (!tenantId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const params = {};
      if (filters.status) params.status = filters.status;
      if (filters.approvalStatus) params.approvalStatus = filters.approvalStatus;
      
      const configs = await getPgConfigurations(tenantId, params);
      
      // 검색 필터 적용
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
      showNotification('PG 설정 목록 로드 실패', 'error');
    } finally {
      setLoading(false);
    }
  }, [tenantId, filters]);
  
  useEffect(() => {
    if (!sessionLoading && isLoggedIn && user && tenantId) {
      loadConfigurations();
    }
  }, [sessionLoading, isLoggedIn, user, tenantId, loadConfigurations]);
  
  // PG 설정 삭제
  const handleDelete = async () => {
    if (!selectedConfig || !tenantId) return;
    
    try {
      setLoading(true);
      await deletePgConfiguration(tenantId, selectedConfig.configId);
      showNotification('PG 설정이 삭제되었습니다.', 'success');
      setShowDeleteModal(false);
      setSelectedConfig(null);
      loadConfigurations();
    } catch (err) {
      console.error('PG 설정 삭제 실패:', err);
      showNotification('PG 설정 삭제 중 오류가 발생했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  };
  
  // 연결 테스트
  const handleTestConnection = async (configId) => {
    if (!tenantId) return;
    
    try {
      setTestingConnection(configId);
      const result = await testPgConnection(tenantId, configId);
      
      if (result.success) {
        showNotification('연결 테스트 성공', 'success');
      } else {
        showNotification(`연결 테스트 실패: ${result.message}`, 'error');
      }
      
      // 목록 새로고침
      loadConfigurations();
    } catch (err) {
      console.error('연결 테스트 실패:', err);
      showNotification('연결 테스트 중 오류가 발생했습니다.', 'error');
    } finally {
      setTestingConnection(null);
    }
  };
  
  // 상태 배지 렌더링
  const renderStatusBadge = (status) => {
    const statusConfig = {
      PENDING: { label: '대기 중', icon: Clock, color: 'warning' },
      APPROVED: { label: '승인됨', icon: CheckCircle, color: 'success' },
      REJECTED: { label: '거부됨', icon: XCircle, color: 'danger' },
      ACTIVE: { label: '활성화', icon: Power, color: 'success' },
      INACTIVE: { label: '비활성화', icon: PowerOff, color: 'secondary' }
    };
    
    const config = statusConfig[status] || statusConfig.PENDING;
    const Icon = config.icon;
    
    return (
      <span className={`status-badge status-badge--${config.color}`}>
        <Icon size={14} />
        {config.label}
      </span>
    );
  };
  
  // 승인 상태 배지 렌더링
  const renderApprovalBadge = (approvalStatus) => {
    const statusConfig = {
      PENDING: { label: '승인 대기', icon: Clock, color: 'warning' },
      APPROVED: { label: '승인됨', icon: CheckCircle, color: 'success' },
      REJECTED: { label: '거부됨', icon: XCircle, color: 'danger' }
    };
    
    const config = statusConfig[approvalStatus] || statusConfig.PENDING;
    const Icon = config.icon;
    
    return (
      <span className={`status-badge status-badge--${config.color}`}>
        <Icon size={14} />
        {config.label}
      </span>
    );
  };
  
  if (sessionLoading || loading && configurations.length === 0) {
    return (
      <SimpleLayout>
        <UnifiedLoading />
      </SimpleLayout>
    );
  }
  
  if (!isLoggedIn || !user) {
    return (
      <SimpleLayout>
        <div className="error-message">
          <AlertCircle size={24} />
          <p>로그인이 필요합니다.</p>
        </div>
      </SimpleLayout>
    );
  }
  
  if (!tenantId) {
    return (
      <SimpleLayout>
        <div className="error-message">
          <AlertCircle size={24} />
          <p>테넌트 정보를 찾을 수 없습니다.</p>
        </div>
      </SimpleLayout>
    );
  }
  
  return (
    <SimpleLayout>
      <div className="pg-config-list">
        {/* 헤더 */}
        <div className="pg-config-list-header">
          <div className="header-title">
            <CreditCard size={32} />
            <div>
              <h1>PG 설정 관리</h1>
              <p>결제 게이트웨이 설정을 관리합니다.</p>
            </div>
          </div>
          <MGButton
            variant="primary"
            onClick={() => navigate(`/tenant/pg-configurations/new`)}
          >
            <Plus size={18} />
            PG 설정 등록
          </MGButton>
        </div>
        
        {/* 필터 및 검색 */}
        <div className="pg-config-list-filters">
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
              <option value="PENDING">승인 대기</option>
              <option value="APPROVED">승인됨</option>
              <option value="REJECTED">거부됨</option>
            </select>
            
            <MGButton
              variant="secondary"
              size="small"
              onClick={loadConfigurations}
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
              variant="primary"
              onClick={() => navigate(`/tenant/pg-configurations/new`)}
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
                        <span className="status-badge status-badge--info">
                          테스트 모드
                        </span>
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
                        <span className="info-label">Merchant ID:</span>
                        <span className="info-value">{config.merchantId}</span>
                      </div>
                    )}
                    {config.storeId && (
                      <div className="info-item">
                        <span className="info-label">Store ID:</span>
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
                      variant="secondary"
                      size="small"
                      onClick={() => navigate(`/tenant/pg-configurations/${config.configId}`)}
                    >
                      <Eye size={16} />
                      상세보기
                    </MGButton>
                    
                    {config.status === 'APPROVED' && (
                      <MGButton
                        variant="secondary"
                        size="small"
                        onClick={() => handleTestConnection(config.configId)}
                        disabled={testingConnection === config.configId}
                        loading={testingConnection === config.configId}
                      >
                        <RefreshCw size={16} />
                        연결 테스트
                      </MGButton>
                    )}
                    
                    {config.approvalStatus === 'PENDING' && (
                      <>
                        <MGButton
                          variant="secondary"
                          size="small"
                          onClick={() => navigate(`/tenant/pg-configurations/${config.configId}/edit`)}
                        >
                          <Edit size={16} />
                          수정
                        </MGButton>
                        <MGButton
                          variant="danger"
                          size="small"
                          onClick={() => {
                            setSelectedConfig(config);
                            setShowDeleteModal(true);
                          }}
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
              </div>
            ))}
          </div>
        )}
        
        {/* 삭제 확인 모달 */}
        {showDeleteModal && selectedConfig && (
          <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>PG 설정 삭제</h2>
                <button 
                  className="modal-close"
                  onClick={() => setShowDeleteModal(false)}
                >
                  ×
                </button>
              </div>
              <div className="modal-body">
                <p>
                  정말로 <strong>{selectedConfig.pgName || selectedConfig.pgProvider}</strong> 설정을 삭제하시겠습니까?
                </p>
                <p className="warning-text">
                  이 작업은 되돌릴 수 없습니다.
                </p>
              </div>
              <div className="modal-footer">
                <MGButton
                  variant="secondary"
                  onClick={() => setShowDeleteModal(false)}
                >
                  취소
                </MGButton>
                <MGButton
                  variant="danger"
                  onClick={handleDelete}
                  disabled={loading}
                >
                  삭제
                </MGButton>
              </div>
            </div>
          </div>
        )}
      </div>
    </SimpleLayout>
  );
};

export default PgConfigurationList;

