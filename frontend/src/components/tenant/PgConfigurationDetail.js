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
import AdminCommonLayout from '../layout/AdminCommonLayout';
import { DEFAULT_MENU_ITEMS } from '../dashboard-v2/constants/menuItems';
import UnifiedLoading from '../../components/common/UnifiedLoading';
import MGButton from '../../components/common/MGButton'; // 임시 비활성화
import './PgConfigurationDetail.css';
import { toDisplayString } from '../../utils/safeDisplay';
import SafeText from '../common/SafeText';

/**
 * PG 설정 상세 페이지
/**
 * 테넌트 포털에서 PG 설정의 상세 정보를 조회하는 페이지
/**
 * 
/**
 * @author CoreSolution
/**
 * @version 1.0.0
/**
 * @since 2025-01-XX
 */
const PgConfigurationDetail = () => {
  const navigate = useNavigate();
  const { configId } = useParams();
  const { user, isLoggedIn, isLoading: sessionLoading } = useSession();
  
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [showKeys, setShowKeys] = useState(false);
  const [decryptedKeys, setDecryptedKeys] = useState(null);
  const [loadingKeys, setLoadingKeys] = useState(false);
  
  const tenantId = user?.tenantId || user?.tenant_id;
  
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
      
      const detail = await getPgConfigurationDetail(tenantId, configId);
      setConfig(detail);
    } catch (err) {
      console.error('연결 테스트 실패:', err);
      showNotification('연결 테스트 중 오류가 발생했습니다.', 'error');
    } finally {
      setTestingConnection(false);
    }
  };
  
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
  
  const renderStatusBadge = (status) => {
    const statusConfig = {
      // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
      PENDING: { label: '대기 중', icon: Clock, color: 'warning' },
      // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
      APPROVED: { label: '승인됨', icon: CheckCircle, color: 'success' },
      // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
      REJECTED: { label: '거부됨', icon: XCircle, color: 'danger' },
      // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
      ACTIVE: { label: '활성화', icon: CheckCircle, color: 'success' },
      // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
      INACTIVE: { label: '비활성화', icon: XCircle, color: 'secondary' }
    };
    
    // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
    const config = statusConfig[status] || statusConfig.PENDING;
    const Icon = config.icon;
    
    return (
      <span className={`status-badge status-badge--${config.color}`}>
        <Icon size={14} />
        {toDisplayString(config.label)}
      </span>
    );
  };
  
  const renderApprovalBadge = (approvalStatus) => {
    const statusConfig = {
      // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
      PENDING: { label: '승인 대기', icon: Clock, color: 'warning' },
      // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
      APPROVED: { label: '승인됨', icon: CheckCircle, color: 'success' },
      // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
      REJECTED: { label: '거부됨', icon: XCircle, color: 'danger' }
    };
    
    // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
    const config = statusConfig[approvalStatus] || statusConfig.PENDING;
    const Icon = config.icon;
    
    return (
      <span className={`status-badge status-badge--${config.color}`}>
        <Icon size={14} />
        {toDisplayString(config.label)}
      </span>
    );
  };
  
  if (sessionLoading || loading) {
    return (
      <AdminCommonLayout title="PG 설정 상세" loading={true} loadingText="PG 설정 상세를 불러오는 중...">
        <div />
      </AdminCommonLayout>
    );
  }
  
  if (!isLoggedIn || !user) {
    return (
      <AdminCommonLayout title="PG 설정 상세">
        <div className="error-message">
          <AlertCircle size={24} />
          <p>로그인이 필요합니다.</p>
        </div>
      </AdminCommonLayout>
    );
  }
  
  if (!tenantId) {
    return (
      <AdminCommonLayout title="PG 설정 상세">
        <div className="error-message">
          <AlertCircle size={24} />
          <p>테넌트 정보를 찾을 수 없습니다.</p>
        </div>
      </AdminCommonLayout>
    );
  }
  
  if (error || !config) {
    return (
      <AdminCommonLayout title="PG 설정 상세">
        <div className="error-message">
          <AlertCircle size={24} />
          <p>{error || 'PG 설정을 찾을 수 없습니다.'}</p>
          <button className="mg-button"
            variant="secondary"
            onClick={() => navigate('/tenant/pg-configurations')}
          >
            <ArrowLeft size={18} />
            목록으로
          </button>
        </div>
      </AdminCommonLayout>
    );
  }
  
  return (
    <AdminCommonLayout title="PG 설정 상세">
        <div className="pg-config-detail" role="main" aria-label="PG 설정 상세 정보">
        {/* 헤더 */}
        <div className="pg-config-detail-header">
          <button className="mg-button"
            variant="secondary"
            onClick={() => navigate('/tenant/pg-configurations')}
          >
            <ArrowLeft size={18} />
            목록으로
          </button>
          
          <div className="header-title">
            <CreditCard size={32} aria-hidden="true" />
            <div>
              <h1 id="pg-config-title"><SafeText fallback="PG">{config.pgName ?? config.pgProvider}</SafeText></h1>
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
            // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
            {config.approvalStatus === 'PENDING' && (
              <>
                <button className="mg-button"
                  variant="secondary"
                  onClick={() => navigate(`/tenant/pg-configurations/${configId}/edit`)}
                >
                  <Edit size={18} />
                  수정
                </button>
                <button className="mg-button"
                  variant="danger"
                  onClick={() => setShowDeleteModal(true)}
                >
                  <Trash2 size={18} />
                  삭제
                </button>
              </>
            )}
            // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
            {config.status === 'APPROVED' && (
              <button className="mg-button"
                variant="secondary"
                onClick={handleTestConnection}
                disabled={testingConnection}
                loading={testingConnection}
              >
                <RefreshCw size={18} />
                연결 테스트
              </button>
            )}
          </div>
        </div>
        
        {/* 기본 정보 */}
        <section className="detail-section" aria-labelledby="basic-info-heading">
          <h2 id="basic-info-heading">기본 정보</h2>
          <div className="detail-grid">
            <div className="detail-item">
              <label>PG 제공자</label>
              <div className="detail-value"><SafeText>{config.pgProvider}</SafeText></div>
            </div>
            <div className="detail-item">
              <label>PG사 명칭</label>
              <div className="detail-value"><SafeText fallback="-">{config.pgName}</SafeText></div>
            </div>
            <div className="detail-item">
              <label>가맹점 ID</label>
              <div className="detail-value"><SafeText fallback="-">{config.merchantId}</SafeText></div>
            </div>
            <div className="detail-item">
              <label>스토어 ID</label>
              <div className="detail-value"><SafeText fallback="-">{config.storeId}</SafeText></div>
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
        </section>
        
        {/* URL 정보 */}
        {(config.webhookUrl || config.returnUrl || config.cancelUrl) && (
          <section className="detail-section" aria-labelledby="url-info-heading">
            <h2 id="url-info-heading">URL 정보</h2>
            <div className="detail-grid">
              {config.webhookUrl && (
                <div className="detail-item detail-item--full">
                  <label>웹훅 URL</label>
                  <div className="detail-value detail-value--url">
                    <a href={toDisplayString(config.webhookUrl, '#')} target="_blank" rel="noopener noreferrer">
                      <SafeText>{config.webhookUrl}</SafeText>
                      <ExternalLink size={14} />
                    </a>
                  </div>
                </div>
              )}
              {config.returnUrl && (
                <div className="detail-item detail-item--full">
                  <label>리턴 URL</label>
                  <div className="detail-value detail-value--url">
                    <a href={toDisplayString(config.returnUrl, '#')} target="_blank" rel="noopener noreferrer">
                      <SafeText>{config.returnUrl}</SafeText>
                      <ExternalLink size={14} />
                    </a>
                  </div>
                </div>
              )}
              {config.cancelUrl && (
                <div className="detail-item detail-item--full">
                  <label>취소 URL</label>
                  <div className="detail-value detail-value--url">
                    <a href={toDisplayString(config.cancelUrl, '#')} target="_blank" rel="noopener noreferrer">
                      <SafeText>{config.cancelUrl}</SafeText>
                      <ExternalLink size={14} />
                    </a>
                  </div>
                </div>
              )}
            </div>
        </section>
        )}
        
        {/* 키 정보 */}
        <section className="detail-section" aria-labelledby="key-info-heading">
          <h2 id="key-info-heading">키 정보</h2>
          <div className="key-info">
            {!showKeys ? (
              <div className="key-placeholder">
                <Key size={24} />
                <p>키 정보는 보안을 위해 암호화되어 저장됩니다.</p>
                <button className="mg-button"
                  variant="secondary"
                  onClick={handleDecryptKeys}
                  disabled={loadingKeys}
                  loading={loadingKeys}
                >
                  <Eye size={18} />
                  키 확인
                </button>
              </div>
            ) : (
              <div className="key-display">
                <div className="key-item">
                  <label>API 키</label>
                  <div className="key-value">
                    <code>{decryptedKeys?.apiKey || '***'}</code>
                    <button
                      className="key-copy-button"
                      onClick={() => {
                        navigator.clipboard.writeText(decryptedKeys?.apiKey || '');
                        showNotification('API 키가 복사되었습니다.', 'success');
                      }}
                      title="복사"
                    >
                      복사
                    </button>
                  </div>
                </div>
                <div className="key-item">
                  <label>시크릿 키</label>
                  <div className="key-value">
                    <code>{decryptedKeys?.secretKey || '***'}</code>
                    <button
                      className="key-copy-button"
                      onClick={() => {
                        navigator.clipboard.writeText(decryptedKeys?.secretKey || '');
                        showNotification('시크릿 키가 복사되었습니다.', 'success');
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
                <button className="mg-button"
                  variant="secondary"
                  size="small"
                  onClick={() => {
                    setShowKeys(false);
                    setDecryptedKeys(null);
                  }}
                >
                  <EyeOff size={18} />
                  숨기기
                </button>
              </div>
            )}
          </div>
        </section>
        
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
                <SafeText tag="div" className="test-result-message">{config.connectionTestMessage}</SafeText>
              )}
            </div>
          </div>
        )}
        
        {/* 승인 정보 */}
        <section className="detail-section" aria-labelledby="approval-info-heading">
          <h2 id="approval-info-heading">승인 정보</h2>
          // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
          {config.approvalStatus === 'PENDING' && (
            <div className="approval-status-pending">
              <Clock size={24} />
              <div>
                <h3>승인 대기 중</h3>
                <p>이 PG 설정은 운영 포털에서 승인 대기 중입니다. 승인 후 사용할 수 있습니다.</p>
                {config.requestedAt && (
                  <div className="request-info">
                    <span>요청 시각: {new Date(config.requestedAt).toLocaleString('ko-KR')}</span>
                    {config.requestedBy && <span>요청자: <SafeText>{config.requestedBy}</SafeText></span>}
                  </div>
                )}
              </div>
            </div>
          )}
          // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
          {config.approvalStatus === 'APPROVED' && (
            <div className="approval-status-approved">
              <CheckCircle size={24} />
              <div>
                <h3>승인됨</h3>
                <div className="detail-grid">
                  {config.approvedBy && (
                    <div className="detail-item">
                      <label>승인자</label>
                      <div className="detail-value"><SafeText>{config.approvedBy}</SafeText></div>
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
          // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
          {config.approvalStatus === 'REJECTED' && (
            <div className="approval-status-rejected">
              <XCircle size={24} />
              <div>
                <h3>거부됨</h3>
                {config.rejectionReason && (
                  <div className="detail-item detail-item--full">
                    <label>거부 사유</label>
                    <div className="detail-value detail-value--error">
                      <SafeText>{config.rejectionReason}</SafeText>
                    </div>
                  </div>
                )}
                {config.approvedBy && (
                  <div className="detail-item">
                    <label>처리자</label>
                    <div className="detail-value"><SafeText>{config.approvedBy}</SafeText></div>
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
        </section>
        
        {/* 비고 */}
        {config.notes && (
          <div className="detail-section">
            <h2>비고</h2>
            <SafeText tag="div" className="detail-notes">{config.notes}</SafeText>
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
                    <span className="history-action"><SafeText>{item.action}</SafeText></span>
                    <span className="history-time">
                      {new Date(item.changedAt).toLocaleString('ko-KR')}
                    </span>
                  </div>
                  {item.changedBy && (
                    <div className="history-user">
                      변경자: <SafeText>{item.changedBy}</SafeText>
                    </div>
                  )}
                  {item.description && (
                    <SafeText tag="div" className="history-description">{item.description}</SafeText>
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
                  정말로 <strong><SafeText>{config.pgName ?? config.pgProvider}</SafeText></strong> 설정을 삭제하시겠습니까?
                </p>
                <p className="warning-text">
                  이 작업은 되돌릴 수 없습니다.
                </p>
              </div>
              <div className="modal-footer">
                <button className="mg-button"
                  variant="secondary"
                  onClick={() => setShowDeleteModal(false)}
                >
                  취소
                </button>
                <button className="mg-button"
                  variant="danger"
                  onClick={handleDelete}
                  disabled={loading}
                >
                  삭제
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminCommonLayout>
  );
};

export default PgConfigurationDetail;

