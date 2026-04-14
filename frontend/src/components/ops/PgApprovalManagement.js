import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ICONS } from '../../constants/icons';

const CheckCircleIcon = ICONS.CHECK_CIRCLE;
const XCircleIcon = ICONS.X_CIRCLE;
const ClockIcon = ICONS.CLOCK;
const SearchIcon = ICONS.SEARCH;
const AlertCircleIcon = ICONS.ALERT_CIRCLE;
const KeyIcon = ICONS.KEY;
const ExternalLinkIcon = ICONS.EXTERNAL_LINK;
import { useSession } from '../../contexts/SessionContext';
import { 
  getPendingPgConfigurations,
  getPgConfigurationDetailForOps,
  approvePgConfiguration,
  rejectPgConfiguration,
  testPgConnectionForOps,
  decryptPgKeysForOps
} from '../../utils/pgOpsApi';
import { showNotification } from '../../utils/notification';
import AdminCommonLayout from '../layout/AdminCommonLayout';
import { ContentArea, ContentHeader } from '../dashboard-v2/content';
import { DEFAULT_MENU_ITEMS } from '../dashboard-v2/constants/menuItems';
import UnifiedLoading from '../../components/common/UnifiedLoading';
import MGButton from '../common/MGButton';
import SafeText from '../common/SafeText';
import UnifiedModal from '../common/modals/UnifiedModal';
import { toDisplayString } from '../../utils/safeDisplay';
import './PgApprovalManagement.css';

/**
 * 운영 포털에서 테넌트 PG 설정 승인·거부를 관리하는 페이지
 *
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */

const PG_APPROVAL_PAGE_TITLE_ID = 'pg-approval-management-title';

const PgApprovalManagement = () => {
  const navigate = useNavigate();
  const { user, isLoggedIn, isLoading: sessionLoading } = useSession();
  
  // 상태 관리
  const [pendingConfigs, setPendingConfigs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // 필터 및 검색
  const [filters, setFilters] = useState({
    tenantId: '',
    pgProvider: '',
    search: ''
  });
  
  // 모달 상태
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedConfig, setSelectedConfig] = useState(null);
  const [configDetail, setConfigDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  
  // 승인/거부 폼 상태
  const [approvalForm, setApprovalForm] = useState({
    testConnection: false,
    notes: ''
  });
  const [rejectForm, setRejectForm] = useState({
    rejectionReason: ''
  });
  
  // 연결 테스트 상태
  const [testingConnection, setTestingConnection] = useState(null);
  const [testResult, setTestResult] = useState(null);
  
  // 키 복호화 상태
  const [showKeys, setShowKeys] = useState(false);
  const [decryptedKeys, setDecryptedKeys] = useState(null);
  const [loadingKeys, setLoadingKeys] = useState(false);
  
  // 승인 대기 목록 로드
  const loadPendingConfigurations = useCallback(async() => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {};
      if (filters.tenantId) params.tenantId = filters.tenantId;
      if (filters.pgProvider) params.pgProvider = filters.pgProvider;
      
      const configs = await getPendingPgConfigurations(params);
      
      // 검색 필터 적용
      let filteredConfigs = configs;
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        filteredConfigs = configs.filter(config => 
          config.pgName?.toLowerCase().includes(searchLower) ||
          config.pgProvider?.toLowerCase().includes(searchLower) ||
          config.tenantId?.toLowerCase().includes(searchLower) ||
          config.notes?.toLowerCase().includes(searchLower)
        );
      }
      
      setPendingConfigs(filteredConfigs);
    } catch (err) {
      console.error('승인 대기 목록 로드 실패:', err);
      setError('승인 대기 목록을 불러오는 중 오류가 발생했습니다.');
      showNotification('승인 대기 목록 로드 실패', 'error');
    } finally {
      setLoading(false);
    }
  }, [filters]);
  
  useEffect(() => {
    if (!sessionLoading && isLoggedIn && user) {
      // 권한 확인 (ADMIN 또는 OPS 역할)
      const allowedRoles = ['ADMIN', 'STAFF'];
      if (!allowedRoles.includes(user.role)) {
        showNotification('접근 권한이 없습니다.', 'error');
        navigate('/');
        return;
      }
      
      loadPendingConfigurations();
    }
  }, [sessionLoading, isLoggedIn, user, loadPendingConfigurations, navigate]);
  
  // PG 설정 상세 조회
  const loadConfigDetail = async(configId) => {
    try {
      setLoadingDetail(true);
      const detail = await getPgConfigurationDetailForOps(configId);
      setConfigDetail(detail);
      setShowDetailModal(true);
    } catch (err) {
      console.error('PG 설정 상세 조회 실패:', err);
      showNotification('PG 설정 정보를 불러오는 중 오류가 발생했습니다.', 'error');
    } finally {
      setLoadingDetail(false);
    }
  };
  
  // 연결 테스트
  const handleTestConnection = async(configId) => {
    try {
      setTestingConnection(configId);
      setTestResult(null);
      
      const result = await testPgConnectionForOps(configId);
      
      // 결과에 configId 추가 (어떤 설정의 결과인지 추적)
      setTestResult({
        ...result,
        configId: configId,
        testedAt: new Date().toISOString()
      });
      
      if (result.success) {
        showNotification('연결 테스트 성공', 'success');
      } else {
        showNotification(`연결 테스트 실패: ${result.message}`, 'error');
      }
      
      // 목록 새로고침 (연결 테스트 결과가 업데이트되었을 수 있음)
      setTimeout(() => {
        loadPendingConfigurations();
      }, 1000);
    } catch (err) {
      console.error('연결 테스트 실패:', err);
      const errorMessage = err.response?.data?.message || err.message || '연결 테스트 중 오류가 발생했습니다.';
      showNotification(errorMessage, 'error');
      
      setTestResult({
        success: false,
        message: errorMessage,
        configId: configId,
        testedAt: new Date().toISOString()
      });
    } finally {
      setTestingConnection(null);
    }
  };
  
  // 키 복호화
  const handleDecryptKeys = async(configId) => {
    try {
      setLoadingKeys(true);
      const keys = await decryptPgKeysForOps(configId);
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
  
  // 승인 처리
  const handleApprove = async() => {
    if (!selectedConfig) return;
    
    try {
      setLoading(true);
      
      // 연결 테스트 옵션이 활성화되어 있으면 먼저 테스트 수행
      if (approvalForm.testConnection) {
        try {
          setTestingConnection(selectedConfig.configId);
          const testResult = await testPgConnectionForOps(selectedConfig.configId);
          
          if (!testResult.success) {
            showNotification(
              `연결 테스트 실패: ${testResult.message}. 승인을 계속하시겠습니까?`,
              'warning'
            );
            // 사용자에게 계속 진행할지 물어볼 수 있지만, 여기서는 경고만 표시하고 계속 진행
          } else {
            showNotification('연결 테스트 성공', 'success');
            // 테스트 결과를 모달에 표시
            setTestResult({
              ...testResult,
              configId: selectedConfig.configId,
              testedAt: new Date().toISOString()
            });
          }
        } catch (testErr) {
          console.error('연결 테스트 실패:', testErr);
          showNotification('연결 테스트 중 오류가 발생했습니다. 승인을 계속 진행합니다.', 'warning');
        } finally {
          setTestingConnection(null);
        }
      }
      
      const request = {
        approvedBy: user?.userId || user?.name || user?.id || 'system',
        testConnection: approvalForm.testConnection,
        approvalNote: approvalForm.notes || null
      };
      
      await approvePgConfiguration(selectedConfig.configId, request);
      showNotification('PG 설정이 승인되었습니다.', 'success');
      handleCloseApprovalModal();
      setTestResult(null);
      loadPendingConfigurations();
    } catch (err) {
      console.error('PG 설정 승인 실패:', err);
      showNotification(
        err.response?.data?.message || 'PG 설정 승인 중 오류가 발생했습니다.',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };
  
  // 거부 처리
  const handleReject = async() => {
    if (!selectedConfig || !rejectForm.rejectionReason.trim()) {
      showNotification('거부 사유를 입력해주세요.', 'error');
      return;
    }
    
    if (rejectForm.rejectionReason.trim().length < 10) {
      showNotification('거부 사유는 최소 10자 이상 입력해주세요.', 'error');
      return;
    }
    
    try {
      setLoading(true);
      const request = {
        rejectedBy: user?.userId || user?.name || user?.id || 'system',
        rejectionReason: rejectForm.rejectionReason.trim()
      };
      
      await rejectPgConfiguration(selectedConfig.configId, request);
      showNotification('PG 설정이 거부되었습니다. 테넌트에게 알림이 전송됩니다.', 'success');
      handleCloseRejectModal();
      loadPendingConfigurations();
    } catch (err) {
      console.error('PG 설정 거부 실패:', err);
      showNotification(
        err.response?.data?.message || 'PG 설정 거부 중 오류가 발생했습니다.',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };
  
  const handleCloseApprovalModal = useCallback(() => {
    setShowApprovalModal(false);
    setSelectedConfig(null);
    setApprovalForm({ testConnection: false, notes: '' });
  }, []);

  const handleCloseRejectModal = useCallback(() => {
    setShowRejectModal(false);
    setSelectedConfig(null);
    setRejectForm({ rejectionReason: '' });
  }, []);

  const handleCloseDetailModal = useCallback(() => {
    setShowDetailModal(false);
    setConfigDetail(null);
    setShowKeys(false);
    setDecryptedKeys(null);
  }, []);

  // PG 제공자 옵션
  const pgProviders = [
    { value: '', label: '전체' },
    { value: 'TOSS', label: '토스페이먼츠' },
    { value: 'IAMPORT', label: '아임포트' },
    { value: 'KAKAO', label: '카카오페이' },
    { value: 'NAVER', label: '네이버페이' },
    { value: 'PAYPAL', label: '페이팔' },
    { value: 'STRIPE', label: '스트라이프' }
  ];
  
  if (sessionLoading || loading && pendingConfigs.length === 0) {
    return (
      <AdminCommonLayout title="PG 설정 승인 관리">
        <ContentArea ariaLabel="PG 설정 승인 관리">
          <UnifiedLoading type="inline" text="PG 설정 목록을 불러오는 중..." />
        </ContentArea>
      </AdminCommonLayout>
    );
  }
  
  if (!isLoggedIn || !user) {
    return (
      <AdminCommonLayout title="PG 설정 승인 관리">
        <ContentArea ariaLabel="PG 설정 승인 관리">
          <div className="error-message">
            <AlertCircleIcon size={24} />
            <p>로그인이 필요합니다.</p>
          </div>
        </ContentArea>
      </AdminCommonLayout>
    );
  }
  
  return (
    <AdminCommonLayout title="PG 설정 승인 관리">
      <ContentArea ariaLabel="PG 설정 승인 관리">
        <ContentHeader
          title="PG 설정 승인 관리"
          subtitle="테넌트가 등록한 PG 설정을 검토하고 승인/거부합니다."
          titleId={PG_APPROVAL_PAGE_TITLE_ID}
        />

        <div className="pg-approval-management">
        {/* 필터 및 검색 */}
        <div className="pg-approval-filters">
          <div className="search-box">
            <SearchIcon size={18} />
            <input
              type="text"
              placeholder="PG사명, 제공자, 테넌트 ID, 비고로 검색..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="search-input"
              aria-label="PG 설정 검색"
            />
          </div>
          
          <div className="filter-group">
            <input
              type="text"
              placeholder="테넌트 ID"
              value={filters.tenantId}
              onChange={(e) => setFilters(prev => ({ ...prev, tenantId: e.target.value }))}
              className="filter-input"
              aria-label="테넌트 ID 필터"
            />
            
            <select
              value={filters.pgProvider}
              onChange={(e) => setFilters(prev => ({ ...prev, pgProvider: e.target.value }))}
              className="filter-select"
              aria-label="PG 제공자 필터"
            >
              {pgProviders.map(provider => (
                <option key={provider.value} value={provider.value}>
                  {toDisplayString(provider.label)}
                </option>
              ))}
            </select>
            
            <MGButton
              variant="secondary"
              size="small"
              onClick={loadPendingConfigurations}
            >
              새로고침
            </MGButton>
          </div>
        </div>
        
        {/* 에러 메시지 */}
        {error && (
          <div className="error-alert">
            <AlertCircleIcon size={20} />
            <span><SafeText>{error}</SafeText></span>
          </div>
        )}
        
        {/* 승인 대기 목록 */}
        {pendingConfigs.length === 0 ? (
          <div className="empty-state">
            <CheckCircleIcon size={48} />
            <h3>승인 대기 중인 PG 설정이 없습니다</h3>
            <p>모든 PG 설정이 처리되었습니다.</p>
          </div>
        ) : (
          <div className="pg-approval-cards">
            {pendingConfigs.map((config) => (
              <div 
                key={config.configId} 
                className="pg-approval-card"
                role="article"
                aria-label={toDisplayString(`PG 설정 승인 대기: ${config.pgName || config.pgProvider}`)}
              >
                <div className="card-header">
                  <div className="card-title">
                    <h3><SafeText>{config.pgName || config.pgProvider}</SafeText></h3>
                    <div className="card-badges">
                      <span className="status-badge status-badge--warning">
                        <ClockIcon size={14} />
                        승인 대기
                      </span>
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
                      <span className="info-label">테넌트 ID:</span>
                      <span className="info-value"><SafeText>{config.tenantId}</SafeText></span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">PG 제공자:</span>
                      <span className="info-value"><SafeText>{config.pgProvider}</SafeText></span>
                    </div>
                    {config.merchantId && (
                      <div className="info-item">
                        <span className="info-label">가맹점 ID:</span>
                        <span className="info-value"><SafeText>{config.merchantId}</SafeText></span>
                      </div>
                    )}
                    {config.requestedAt && (
                      <div className="info-item">
                        <span className="info-label">요청 시각:</span>
                        <span className="info-value">
                          {toDisplayString(new Date(config.requestedAt).toLocaleString('ko-KR'))}
                        </span>
                      </div>
                    )}
                    {config.requestedBy && (
                      <div className="info-item">
                        <span className="info-label">요청자:</span>
                        <span className="info-value"><SafeText>{config.requestedBy}</SafeText></span>
                      </div>
                    )}
                    {config.notes && (
                      <div className="info-item">
                        <span className="info-label">비고:</span>
                        <span className="info-value"><SafeText>{config.notes}</SafeText></span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="card-footer">
                  <div className="card-actions">
                    <MGButton
                      variant="secondary"
                      size="small"
                      onClick={() => loadConfigDetail(config.configId)}
                      disabled={loadingDetail}
                    >
                      상세보기
                    </MGButton>
                    
                    <MGButton
                      variant="secondary"
                      size="small"
                      onClick={() => handleTestConnection(config.configId)}
                      disabled={testingConnection === config.configId}
                      loading={testingConnection === config.configId}
                    >
                      연결 테스트
                    </MGButton>
                    
                    <MGButton
                      variant="success"
                      size="small"
                      onClick={() => {
                        setSelectedConfig(config);
                        setShowApprovalModal(true);
                      }}
                    >
                      승인
                    </MGButton>
                    
                    <MGButton
                      variant="danger"
                      size="small"
                      onClick={() => {
                        setSelectedConfig(config);
                        setShowRejectModal(true);
                      }}
                    >
                      거부
                    </MGButton>
                  </div>
                  
                  {testResult && testResult.configId === config.configId && (
                    <div className={`test-result ${testResult.success ? 'success' : 'error'}`}>
                      {testResult.success ? (
                        <CheckCircleIcon size={14} />
                      ) : (
                        <XCircleIcon size={14} />
                      )}
                      <span><SafeText>{testResult.message}</SafeText></span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        
        <UnifiedModal
          isOpen={showApprovalModal && !!selectedConfig}
          onClose={handleCloseApprovalModal}
          title="PG 설정 승인"
          size="medium"
          variant="form"
          className="mg-v2-ad-b0kla"
          backdropClick={!loading}
          loading={loading}
          actions={
            selectedConfig ? (
              <>
                <MGButton
                  variant="secondary"
                  onClick={handleCloseApprovalModal}
                  disabled={loading}
                >
                  취소
                </MGButton>
                <MGButton
                  variant="success"
                  onClick={handleApprove}
                  disabled={loading}
                  loading={loading}
                >
                  승인
                </MGButton>
              </>
            ) : null
          }
        >
          {selectedConfig && (
            <>
              <div className="approval-info">
                <p>
                  <strong><SafeText>{selectedConfig.pgName || selectedConfig.pgProvider}</SafeText></strong> 설정을 승인하시겠습니까?
                </p>
                <div className="approval-details">
                  <div className="detail-row">
                    <span className="detail-label">테넌트 ID:</span>
                    <span className="detail-value"><SafeText>{selectedConfig.tenantId}</SafeText></span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">PG 제공자:</span>
                    <span className="detail-value"><SafeText>{selectedConfig.pgProvider}</SafeText></span>
                  </div>
                </div>
              </div>

              <div className="approval-options">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={approvalForm.testConnection}
                    onChange={(e) => setApprovalForm(prev => ({ ...prev, testConnection: e.target.checked }))}
                    className="form-checkbox"
                  />
                  <span>승인 전 연결 테스트 수행</span>
                </label>
                <small className="help-text">
                  연결 테스트를 수행하여 PG 설정이 정상적으로 작동하는지 확인합니다.
                </small>

                {testResult && testResult.configId === selectedConfig.configId && (
                  <div className={`test-result-preview ${testResult.success ? 'success' : 'error'}`}>
                    {testResult.success ? (
                      <CheckCircleIcon size={16} />
                    ) : (
                      <XCircleIcon size={16} />
                    )}
                    <span>
                      <SafeText>
                        {testResult.success ? '연결 테스트 성공' : `연결 테스트 실패: ${toDisplayString(testResult.message)}`}
                      </SafeText>
                    </span>
                    {testResult.testedAt && (
                      <small>
                        ({toDisplayString(new Date(testResult.testedAt).toLocaleString('ko-KR'))})
                      </small>
                    )}
                  </div>
                )}

                {approvalForm.testConnection && !testResult && (
                  <MGButton
                    variant="secondary"
                    size="small"
                    onClick={() => handleTestConnection(selectedConfig.configId)}
                    disabled={testingConnection === selectedConfig.configId}
                    loading={testingConnection === selectedConfig.configId}
                    className="mg-button-test-connection"
                  >
                    지금 테스트하기
                  </MGButton>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="approvalNotes">승인 메모 (선택)</label>
                <textarea
                  id="approvalNotes"
                  value={approvalForm.notes}
                  onChange={(e) => setApprovalForm(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="승인 관련 메모를 입력하세요"
                  className="form-textarea"
                  rows={3}
                  maxLength={500}
                />
                <small className="char-count">
                  {approvalForm.notes.length} / 500
                </small>
              </div>
            </>
          )}
        </UnifiedModal>

        <UnifiedModal
          isOpen={showRejectModal && !!selectedConfig}
          onClose={handleCloseRejectModal}
          title="PG 설정 거부"
          size="medium"
          variant="form"
          className="mg-v2-ad-b0kla"
          backdropClick={!loading}
          loading={loading}
          actions={
            selectedConfig ? (
              <>
                <MGButton
                  variant="secondary"
                  onClick={handleCloseRejectModal}
                  disabled={loading}
                >
                  취소
                </MGButton>
                <MGButton
                  variant="danger"
                  onClick={handleReject}
                  disabled={loading || !rejectForm.rejectionReason.trim()}
                  loading={loading}
                >
                  거부
                </MGButton>
              </>
            ) : null
          }
        >
          {selectedConfig && (
            <>
              <div className="reject-info">
                <p>
                  <strong><SafeText>{selectedConfig.pgName || selectedConfig.pgProvider}</SafeText></strong> 설정을 거부하시겠습니까?
                </p>
                <p className="warning-text">
                  거부 사유는 테넌트에게 전달됩니다.
                </p>
              </div>

              <div className="form-group">
                <label htmlFor="rejectionReason" className="required">
                  거부 사유 <span className="required-mark">*</span>
                </label>
                <textarea
                  id="rejectionReason"
                  value={rejectForm.rejectionReason}
                  onChange={(e) => setRejectForm(prev => ({ ...prev, rejectionReason: e.target.value }))}
                  placeholder="거부 사유를 입력하세요"
                  className="form-textarea"
                  rows={4}
                  required
                  maxLength={1000}
                />
                <small className="char-count">
                  {rejectForm.rejectionReason.length} / 1000
                </small>
              </div>
            </>
          )}
        </UnifiedModal>

        <UnifiedModal
          isOpen={showDetailModal && !!configDetail}
          onClose={handleCloseDetailModal}
          title="PG 설정 상세 정보"
          size="large"
          variant="detail"
          className="mg-v2-ad-b0kla"
          backdropClick
          actions={
            <MGButton variant="secondary" onClick={handleCloseDetailModal}>
              닫기
            </MGButton>
          }
        >
          {configDetail && (
            <div className="modal-body--scrollable">
              <div className="detail-section">
                <h3>기본 정보</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <label>테넌트 ID</label>
                    <div className="detail-value"><SafeText>{configDetail.tenantId}</SafeText></div>
                  </div>
                  <div className="detail-item">
                    <label>PG 제공자</label>
                    <div className="detail-value"><SafeText>{configDetail.pgProvider}</SafeText></div>
                  </div>
                  <div className="detail-item">
                    <label>PG사 명칭</label>
                    <div className="detail-value"><SafeText fallback="-">{configDetail.pgName}</SafeText></div>
                  </div>
                  <div className="detail-item">
                    <label>가맹점 ID</label>
                    <div className="detail-value"><SafeText fallback="-">{configDetail.merchantId}</SafeText></div>
                  </div>
                  <div className="detail-item">
                    <label>스토어 ID</label>
                    <div className="detail-value"><SafeText fallback="-">{configDetail.storeId}</SafeText></div>
                  </div>
                  <div className="detail-item">
                    <label>테스트 모드</label>
                    <div className="detail-value">{configDetail.testMode ? '예' : '아니오'}</div>
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <h3>키 정보</h3>
                <div className="key-info">
                  {!showKeys ? (
                    <div className="key-placeholder">
                      <KeyIcon size={24} />
                      <p>키 정보는 보안을 위해 암호화되어 저장됩니다.</p>
                      <MGButton
                        variant="secondary"
                        onClick={() => handleDecryptKeys(configDetail.configId)}
                        disabled={loadingKeys}
                        loading={loadingKeys}
                      >
                        키 확인
                      </MGButton>
                    </div>
                  ) : (
                    <div className="key-display">
                      <div className="key-item">
                        <label>API 키</label>
                        <div className="key-value">
                          <code><SafeText>{decryptedKeys?.apiKey || '***'}</SafeText></code>
                          <MGButton
                            type="button"
                            variant="secondary"
                            size="small"
                            className="key-copy-button"
                            preventDoubleClick={false}
                            onClick={() => {
                              navigator.clipboard.writeText(decryptedKeys?.apiKey || '');
                              showNotification('API 키가 복사되었습니다.', 'success');
                            }}
                            title={toDisplayString('복사')}
                          >
                            복사
                          </MGButton>
                        </div>
                      </div>
                      <div className="key-item">
                        <label>시크릿 키</label>
                        <div className="key-value">
                          <code><SafeText>{decryptedKeys?.secretKey || '***'}</SafeText></code>
                          <MGButton
                            type="button"
                            variant="secondary"
                            size="small"
                            className="key-copy-button"
                            preventDoubleClick={false}
                            onClick={() => {
                              navigator.clipboard.writeText(decryptedKeys?.secretKey || '');
                              showNotification('시크릿 키가 복사되었습니다.', 'success');
                            }}
                            title={toDisplayString('복사')}
                          >
                            복사
                          </MGButton>
                        </div>
                      </div>
                      <MGButton
                        variant="secondary"
                        size="small"
                        onClick={() => {
                          setShowKeys(false);
                          setDecryptedKeys(null);
                        }}
                      >
                        숨기기
                      </MGButton>
                    </div>
                  )}
                </div>
              </div>

              {(configDetail.webhookUrl || configDetail.returnUrl || configDetail.cancelUrl) && (
                <div className="detail-section">
                  <h3>URL 정보</h3>
                  <div className="detail-grid">
                    {configDetail.webhookUrl && (
                      <div className="detail-item detail-item--full">
                        <label>Webhook URL</label>
                        <div className="detail-value detail-value--url">
                          <a href={toDisplayString(configDetail.webhookUrl, '#')} target="_blank" rel="noopener noreferrer">
                            <SafeText>{configDetail.webhookUrl}</SafeText>
                            <ExternalLinkIcon size={14} />
                          </a>
                        </div>
                      </div>
                    )}
                    {configDetail.returnUrl && (
                      <div className="detail-item detail-item--full">
                        <label>Return URL</label>
                        <div className="detail-value detail-value--url">
                          <a href={toDisplayString(configDetail.returnUrl, '#')} target="_blank" rel="noopener noreferrer">
                            <SafeText>{configDetail.returnUrl}</SafeText>
                            <ExternalLinkIcon size={14} />
                          </a>
                        </div>
                      </div>
                    )}
                    {configDetail.cancelUrl && (
                      <div className="detail-item detail-item--full">
                        <label>Cancel URL</label>
                        <div className="detail-value detail-value--url">
                          <a href={toDisplayString(configDetail.cancelUrl, '#')} target="_blank" rel="noopener noreferrer">
                            <SafeText>{configDetail.cancelUrl}</SafeText>
                            <ExternalLinkIcon size={14} />
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {configDetail.notes && (
                <div className="detail-section">
                  <h3>비고</h3>
                  <div className="detail-notes">
                    <SafeText>{configDetail.notes}</SafeText>
                  </div>
                </div>
              )}
            </div>
          )}
        </UnifiedModal>
        </div>
      </ContentArea>
    </AdminCommonLayout>
  );
};

export default PgApprovalManagement;

