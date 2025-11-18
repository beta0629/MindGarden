import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  CreditCard, 
  ArrowLeft, 
  Edit, 
  Trash2, 
  RefreshCw,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Info,
  History,
  Key,
  ExternalLink
} from 'lucide-react';
import { useSession } from '../../contexts/SessionContext';
import { 
  getPgConfigurationDetail, 
  deletePgConfiguration, 
  testPgConnection,
  decryptPgKeys
} from '../../utils/pgApi';
import { showNotification } from '../../utils/notification';
import SimpleLayout from '../layout/SimpleLayout';
import UnifiedLoading from '../common/UnifiedLoading';
import MGButton from '../common/MGButton';
import './PgConfigurationDetail.css';

/**
 * PG 설정 상세 페이지
 * 테넌트 포털에서 PG 설정의 상세 정보를 조회하는 페이지
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
const PgConfigurationDetail = () => {
  const navigate = useNavigate();
  const { configId } = useParams();
  const { user, isLoggedIn, isLoading: sessionLoading } = useSession();
  
  // 상태 관리
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [showKeys, setShowKeys] = useState(false);
  const [decryptedKeys, setDecryptedKeys] = useState(null);
  const [loadingKeys, setLoadingKeys] = useState(false);
  
  // 테넌트 ID
  const tenantId = user?.tenantId || user?.tenant_id;
  
  // PG 설정 상세 로드
  useEffect(() => {
    if (!tenantId || !configId) return;
    
    const loadDetail = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const detail = await getPgConfigurationDetail(tenantId, configId);
        setConfig(detail);
      } catch (err) {
        console.error('PG 설정 상세 로드 실패:', err);
        setError('PG 설정 정보를 불러오는 중 오류가 발생했습니다.');
        showNotification('PG 설정 정보 로드 실패', 'error');
      } finally {
        setLoading(false);
      }
    };
    
    if (!sessionLoading && isLoggedIn && user && tenantId) {
      loadDetail();
    }
  }, [tenantId, configId, sessionLoading, isLoggedIn, user]);
  
  // PG 설정 삭제
  const handleDelete = async () => {
    if (!tenantId || !configId) return;
    
    try {
      setLoading(true);
      await deletePgConfiguration(tenantId, configId);
      showNotification('PG 설정이 삭제되었습니다.', 'success');
      navigate('/tenant/pg-configurations');
    } catch (err) {
      console.error('PG 설정 삭제 실패:', err);
      showNotification('PG 설정 삭제 중 오류가 발생했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  };
  
  // 연결 테스트
  const handleTestConnection = async () => {
    if (!tenantId || !configId) return;
    
    try {
      setTestingConnection(true);
      const result = await testPgConnection(tenantId, configId);
      
      if (result.success) {
        showNotification('연결 테스트 성공', 'success');
      } else {
        showNotification(`연결 테스트 실패: ${result.message}`, 'error');
      }
      
      // 상세 정보 새로고침
      const detail = await getPgConfigurationDetail(tenantId, configId);
      setConfig(detail);
    } catch (err) {
      console.error('연결 테스트 실패:', err);
      showNotification('연결 테스트 중 오류가 발생했습니다.', 'error');
    } finally {
      setTestingConnection(false);
    }
  };
  
  // 키 복호화
  const handleDecryptKeys = async () => {
    if (!tenantId || !configId) return;
    
    try {
      setLoadingKeys(true);
      const keys = await decryptPgKeys(tenantId, configId);
      setDecryptedKeys(keys);
      setShowKeys(true);
      showNotification('키 복호화 완료', 'success');
    } catch (err) {
      console.error('키 복호화 실패:', err);
      showNotification('키 복호화 중 오류가 발생했습니다.', 'error');
    } finally {
      setLoadingKeys(false);
    }
  };
  
  // 상태 배지 렌더링
  const renderStatusBadge = (status) => {
    const statusConfig = {
      PENDING: { label: '대기 중', icon: Clock, color: 'warning' },
      APPROVED: { label: '승인됨', icon: CheckCircle, color: 'success' },
      REJECTED: { label: '거부됨', icon: XCircle, color: 'danger' },
      ACTIVE: { label: '활성화', icon: CheckCircle, color: 'success' },
      INACTIVE: { label: '비활성화', icon: XCircle, color: 'secondary' }
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
  
  if (sessionLoading || loading) {
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
  
  if (error || !config) {
    return (
      <SimpleLayout>
        <div className="error-message">
          <AlertCircle size={24} />
          <p>{error || 'PG 설정을 찾을 수 없습니다.'}</p>
          <MGButton
            variant="secondary"
            onClick={() => navigate('/tenant/pg-configurations')}
          >
            <ArrowLeft size={18} />
            목록으로
          </MGButton>
        </div>
      </SimpleLayout>
    );
  }
  
  return (
    <SimpleLayout>
        <div className="pg-config-detail" role="main" aria-label="PG 설정 상세 정보">
        {/* 헤더 */}
        <div className="pg-config-detail-header">
          <MGButton
            variant="secondary"
            onClick={() => navigate('/tenant/pg-configurations')}
          >
            <ArrowLeft size={18} />
            목록으로
          </MGButton>
          
          <div className="header-title">
            <CreditCard size={32} aria-hidden="true" />
            <div>
              <h1 id="pg-config-title">{config.pgName || config.pgProvider}</h1>
              <div className="header-badges">
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
          
          <div className="header-actions">
            {config.approvalStatus === 'PENDING' && (
              <>
                <MGButton
                  variant="secondary"
                  onClick={() => navigate(`/tenant/pg-configurations/${configId}/edit`)}
                >
                  <Edit size={18} />
                  수정
                </MGButton>
                <MGButton
                  variant="danger"
                  onClick={() => setShowDeleteModal(true)}
                >
                  <Trash2 size={18} />
                  삭제
                </MGButton>
              </>
            )}
            {config.status === 'APPROVED' && (
              <MGButton
                variant="secondary"
                onClick={handleTestConnection}
                disabled={testingConnection}
                loading={testingConnection}
              >
                <RefreshCw size={18} />
                연결 테스트
              </MGButton>
            )}
          </div>
        </div>
        
        {/* 기본 정보 */}
        <section className="detail-section" aria-labelledby="basic-info-heading">
          <h2 id="basic-info-heading">기본 정보</h2>
          <div className="detail-grid">
            <div className="detail-item">
              <label>PG 제공자</label>
              <div className="detail-value">{config.pgProvider}</div>
            </div>
            <div className="detail-item">
              <label>PG사 명칭</label>
              <div className="detail-value">{config.pgName || '-'}</div>
            </div>
            <div className="detail-item">
              <label>Merchant ID</label>
              <div className="detail-value">{config.merchantId || '-'}</div>
            </div>
            <div className="detail-item">
              <label>Store ID</label>
              <div className="detail-value">{config.storeId || '-'}</div>
            </div>
            <div className="detail-item">
              <label>테스트 모드</label>
              <div className="detail-value">
                {config.testMode ? '예' : '아니오'}
              </div>
            </div>
            <div className="detail-item">
              <label>등록일</label>
              <div className="detail-value">
                {config.createdAt ? new Date(config.createdAt).toLocaleString('ko-KR') : '-'}
              </div>
            </div>
          </div>
        </div>
        
        {/* URL 정보 */}
        {(config.webhookUrl || config.returnUrl || config.cancelUrl) && (
          <section className="detail-section" aria-labelledby="url-info-heading">
            <h2 id="url-info-heading">URL 정보</h2>
            <div className="detail-grid">
              {config.webhookUrl && (
                <div className="detail-item detail-item--full">
                  <label>Webhook URL</label>
                  <div className="detail-value detail-value--url">
                    <a href={config.webhookUrl} target="_blank" rel="noopener noreferrer">
                      {config.webhookUrl}
                      <ExternalLink size={14} />
                    </a>
                  </div>
                </div>
              )}
              {config.returnUrl && (
                <div className="detail-item detail-item--full">
                  <label>Return URL</label>
                  <div className="detail-value detail-value--url">
                    <a href={config.returnUrl} target="_blank" rel="noopener noreferrer">
                      {config.returnUrl}
                      <ExternalLink size={14} />
                    </a>
                  </div>
                </div>
              )}
              {config.cancelUrl && (
                <div className="detail-item detail-item--full">
                  <label>Cancel URL</label>
                  <div className="detail-value detail-value--url">
                    <a href={config.cancelUrl} target="_blank" rel="noopener noreferrer">
                      {config.cancelUrl}
                      <ExternalLink size={14} />
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* 키 정보 */}
        <section className="detail-section" aria-labelledby="key-info-heading">
          <h2 id="key-info-heading">키 정보</h2>
          <div className="key-info">
            {!showKeys ? (
              <div className="key-placeholder">
                <Key size={24} />
                <p>키 정보는 보안을 위해 암호화되어 저장됩니다.</p>
                <MGButton
                  variant="secondary"
                  onClick={handleDecryptKeys}
                  disabled={loadingKeys}
                  loading={loadingKeys}
                >
                  <Eye size={18} />
                  키 확인
                </MGButton>
              </div>
            ) : (
              <div className="key-display">
                <div className="key-item">
                  <label>API Key</label>
                  <div className="key-value">
                    <code>{decryptedKeys?.apiKey || '***'}</code>
                    <button
                      className="key-copy-button"
                      onClick={() => {
                        navigator.clipboard.writeText(decryptedKeys?.apiKey || '');
                        showNotification('API Key가 복사되었습니다.', 'success');
                      }}
                      title="복사"
                    >
                      복사
                    </button>
                  </div>
                </div>
                <div className="key-item">
                  <label>Secret Key</label>
                  <div className="key-value">
                    <code>{decryptedKeys?.secretKey || '***'}</code>
                    <button
                      className="key-copy-button"
                      onClick={() => {
                        navigator.clipboard.writeText(decryptedKeys?.secretKey || '');
                        showNotification('Secret Key가 복사되었습니다.', 'success');
                      }}
                      title="복사"
                    >
                      복사
                    </button>
                  </div>
                </div>
                {decryptedKeys?.decryptedAt && (
                  <div className="key-info-footer">
                    <Info size={14} />
                    <span>복호화 시각: {new Date(decryptedKeys.decryptedAt).toLocaleString('ko-KR')}</span>
                  </div>
                )}
                <MGButton
                  variant="secondary"
                  size="small"
                  onClick={() => {
                    setShowKeys(false);
                    setDecryptedKeys(null);
                  }}
                >
                  <EyeOff size={18} />
                  숨기기
                </MGButton>
              </div>
            )}
          </div>
        </div>
        
        {/* 연결 테스트 결과 */}
        {config.lastConnectionTestAt && (
          <div className="detail-section">
            <h2>연결 테스트 결과</h2>
            <div className="connection-test-result">
              <div className="test-result-header">
                <div className="test-result-status">
                  {config.connectionTestResult === 'SUCCESS' ? (
                    <CheckCircle size={20} className="success" />
                  ) : (
                    <XCircle size={20} className="error" />
                  )}
                  <span className={`test-result-label ${config.connectionTestResult === 'SUCCESS' ? 'success' : 'error'}`}>
                    {config.connectionTestResult === 'SUCCESS' ? '성공' : '실패'}
                  </span>
                </div>
                <div className="test-result-time">
                  {new Date(config.lastConnectionTestAt).toLocaleString('ko-KR')}
                </div>
              </div>
              {config.connectionTestMessage && (
                <div className="test-result-message">
                  {config.connectionTestMessage}
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* 승인 정보 */}
        <section className="detail-section" aria-labelledby="approval-info-heading">
          <h2 id="approval-info-heading">승인 정보</h2>
          {config.approvalStatus === 'PENDING' && (
            <div className="approval-status-pending">
              <Clock size={24} />
              <div>
                <h3>승인 대기 중</h3>
                <p>이 PG 설정은 운영 포털에서 승인 대기 중입니다. 승인 후 사용할 수 있습니다.</p>
                {config.requestedAt && (
                  <div className="request-info">
                    <span>요청 시각: {new Date(config.requestedAt).toLocaleString('ko-KR')}</span>
                    {config.requestedBy && <span>요청자: {config.requestedBy}</span>}
                  </div>
                )}
              </div>
            </div>
          )}
          {config.approvalStatus === 'APPROVED' && (
            <div className="approval-status-approved">
              <CheckCircle size={24} />
              <div>
                <h3>승인됨</h3>
                <div className="detail-grid">
                  {config.approvedBy && (
                    <div className="detail-item">
                      <label>승인자</label>
                      <div className="detail-value">{config.approvedBy}</div>
                    </div>
                  )}
                  {config.approvedAt && (
                    <div className="detail-item">
                      <label>승인 시각</label>
                      <div className="detail-value">
                        {new Date(config.approvedAt).toLocaleString('ko-KR')}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          {config.approvalStatus === 'REJECTED' && (
            <div className="approval-status-rejected">
              <XCircle size={24} />
              <div>
                <h3>거부됨</h3>
                {config.rejectionReason && (
                  <div className="detail-item detail-item--full">
                    <label>거부 사유</label>
                    <div className="detail-value detail-value--error">
                      {config.rejectionReason}
                    </div>
                  </div>
                )}
                {config.approvedBy && (
                  <div className="detail-item">
                    <label>처리자</label>
                    <div className="detail-value">{config.approvedBy}</div>
                  </div>
                )}
                {config.approvedAt && (
                  <div className="detail-item">
                    <label>처리 시각</label>
                    <div className="detail-value">
                      {new Date(config.approvedAt).toLocaleString('ko-KR')}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* 비고 */}
        {config.notes && (
          <div className="detail-section">
            <h2>비고</h2>
            <div className="detail-notes">
              {config.notes}
            </div>
          </div>
        )}
        
        {/* 변경 이력 */}
        {config.history && config.history.length > 0 && (
          <div className="detail-section">
            <h2>
              <History size={20} />
              변경 이력
            </h2>
            <div className="history-list">
              {config.history.map((item, index) => (
                <div key={index} className="history-item">
                  <div className="history-header">
                    <span className="history-action">{item.action}</span>
                    <span className="history-time">
                      {new Date(item.changedAt).toLocaleString('ko-KR')}
                    </span>
                  </div>
                  {item.changedBy && (
                    <div className="history-user">
                      변경자: {item.changedBy}
                    </div>
                  )}
                  {item.description && (
                    <div className="history-description">
                      {item.description}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* 삭제 확인 모달 */}
        {showDeleteModal && (
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
                  정말로 <strong>{config.pgName || config.pgProvider}</strong> 설정을 삭제하시겠습니까?
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

export default PgConfigurationDetail;

