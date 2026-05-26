import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ICONS } from '../../constants/icons';

const CheckCircleIcon = ICONS.CHECK_CIRCLE;
const XCircleIcon = ICONS.X_CIRCLE;
const ClockIcon = ICONS.CLOCK;
const AlertCircleIcon = ICONS.ALERT_CIRCLE;
const InfoIcon = ICONS.INFO;
const HistoryIcon = ICONS.HISTORY;
const KeyIcon = ICONS.KEY;
const ExternalLinkIcon = ICONS.EXTERNAL_LINK;
import { useSession } from '../../contexts/SessionContext';
import { 
  getPgConfigurationDetail, 
  deletePgConfiguration, 
  testPgConnection,
  decryptPgKeys
} from '../../utils/pgApi';
import { showNotification } from '../../utils/notification';
import AdminCommonLayout from '../layout/AdminCommonLayout';
import UnifiedLoading from '../common/UnifiedLoading';
import MGButton from '../common/MGButton';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../erp/common/erpMgButtonProps';
import ContentArea from '../dashboard-v2/content/ContentArea';
import ContentHeader from '../dashboard-v2/content/ContentHeader';
import UnifiedModal from '../common/modals/UnifiedModal';
import '../../styles/unified-design-tokens.css';
import '../admin/AdminDashboard/AdminDashboardB0KlA.css';
import './PgConfigurationDetail.css';
import { toDisplayString } from '../../utils/safeDisplay';
import SafeText from '../common/SafeText';
import { useTranslation } from 'react-i18next';

/**
 * PG 설정 상세 페이지
 * 테넌트 포털에서 PG 설정의 상세 정보를 조회
 *
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
const PgConfigurationDetail = () => {
  const { t } = useTranslation();
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
    
    const loadDetail = async() => {
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
  
  const handleDelete = async() => {
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
  
  const handleTestConnection = async() => {
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
  
  const handleDecryptKeys = async() => {
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
      PENDING: { label: '대기 중', icon: ClockIcon, color: 'warning' },
      APPROVED: { label: '승인됨', icon: CheckCircleIcon, color: 'success' },
      REJECTED: { label: '거부됨', icon: XCircleIcon, color: 'danger' },
      ACTIVE: { label: '활성화', icon: CheckCircleIcon, color: 'success' },
      INACTIVE: { label: '비활성화', icon: XCircleIcon, color: 'secondary' }
    };
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
      PENDING: { label: '승인 대기', icon: ClockIcon, color: 'warning' },
      APPROVED: { label: '승인됨', icon: CheckCircleIcon, color: 'success' },
      REJECTED: { label: '거부됨', icon: XCircleIcon, color: 'danger' }
    };
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
      <AdminCommonLayout title={t('admin.labels.pgSettingsDetail')}>
        <ContentArea ariaLabel="PG 설정 상세" className="mg-v2-pg-config-detail">
          <UnifiedLoading type="inline" text={t('common:tenant.PgConfigurationDetail.t_f7022e97')} variant="pulse" />
        </ContentArea>
      </AdminCommonLayout>
    );
  }
  
  if (!isLoggedIn || !user) {
    return (
      <AdminCommonLayout title={t('admin.labels.pgSettingsDetail')}>
        <ContentArea ariaLabel="PG 설정 상세" className="mg-v2-pg-config-detail">
          <div className="error-message">
            <AlertCircleIcon size={24} />
            <p>{t('common:tenant.PgConfigurationDetail.t_5271ee34')}</p>
          </div>
        </ContentArea>
      </AdminCommonLayout>
    );
  }

  if (!tenantId) {
    return (
      <AdminCommonLayout title={t('admin.labels.pgSettingsDetail')}>
        <ContentArea ariaLabel="PG 설정 상세" className="mg-v2-pg-config-detail">
          <div className="error-message">
            <AlertCircleIcon size={24} />
            <p>{t('common:tenant.PgConfigurationDetail.t_8f990fec')}</p>
          </div>
        </ContentArea>
      </AdminCommonLayout>
    );
  }

  if (error || !config) {
    return (
      <AdminCommonLayout title={t('admin.labels.pgSettingsDetail')}>
        <ContentArea ariaLabel="PG 설정 상세 오류" className="mg-v2-pg-config-detail">
          <div className="error-message">
            <AlertCircleIcon size={24} />
            <p>{error || 'PG 설정을 찾을 수 없습니다.'}</p>
            <MGButton
              type="button"
              variant="secondary"
              className={buildErpMgButtonClassName({ variant: 'secondary', size: 'md', loading: false })}
              loadingText={ERP_MG_BUTTON_LOADING_TEXT}
              onClick={() => navigate('/tenant/pg-configurations')}
              preventDoubleClick={false}
            >
              {t('common:tenant.PgConfigurationDetail.t_6305eb23')}
            </MGButton>
          </div>
        </ContentArea>
      </AdminCommonLayout>
    );
  }
  
  return (
    <AdminCommonLayout title={t('admin.labels.pgSettingsDetail')}>
      <>
        <ContentArea ariaLabel="PG 설정 상세 정보" className="mg-v2-pg-config-detail">
            <ContentHeader
              title={toDisplayString(config.pgName ?? config.pgProvider, 'PG')}
              subtitle={toDisplayString(config.pgProvider, 'PG 제공자')}
              titleId="pg-config-detail-title"
              actions={
                <div className="mg-v2-pg-config-detail__header-toolbar">
                  <div className="pg-config-detail__header-badges">
                    {renderStatusBadge(config.status)}
                    {renderApprovalBadge(config.approvalStatus)}
                    {config.testMode && (
                      <span className="status-badge status-badge--info">{t('common:tenant.PgConfigurationDetail.t_cfd49442')}</span>
                    )}
                  </div>
                  <div className="pg-config-detail__header-buttons">
                    <MGButton
                      type="button"
                      variant="secondary"
                      size="small"
                      className={buildErpMgButtonClassName({ variant: 'secondary', size: 'sm', loading: false })}
                      loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                      onClick={() => navigate('/tenant/pg-configurations')}
                      preventDoubleClick={false}
                    >
                      {t('common:tenant.PgConfigurationDetail.t_6305eb23')}
                    </MGButton>
                    {config.approvalStatus === 'PENDING' && (
                      <>
                        <MGButton
                          type="button"
                          variant="secondary"
                          size="small"
                          className={buildErpMgButtonClassName({ variant: 'secondary', size: 'sm', loading: false })}
                          loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                          onClick={() => navigate(`/tenant/pg-configurations/${configId}/edit`)}
                          preventDoubleClick={false}
                        >
                          {t('common.actions.edit')}
                        </MGButton>
                        <MGButton
                          type="button"
                          variant="danger"
                          size="small"
                          className={buildErpMgButtonClassName({ variant: 'danger', size: 'sm', loading: false })}
                          loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                          onClick={() => setShowDeleteModal(true)}
                          preventDoubleClick={false}
                        >
                          {t('admin.actions.delete')}
                        </MGButton>
                      </>
                    )}
                    {config.status === 'APPROVED' && (
                      <MGButton
                        type="button"
                        variant="secondary"
                        size="small"
                        className={buildErpMgButtonClassName({
                          variant: 'secondary',
                          size: 'sm',
                          loading: testingConnection
                        })}
                        loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                        onClick={handleTestConnection}
                        disabled={testingConnection}
                        loading={testingConnection}
                        preventDoubleClick={false}
                      >
                        {t('common:tenant.PgConfigurationDetail.t_3da5c18d')}
                      </MGButton>
                    )}
                  </div>
                </div>
              }
            />
            <main className="pg-config-detail pg-config-detail__body">
        {/* 기본 정보 */}
        <section className="detail-section" aria-labelledby="basic-info-heading">
          <h2 id="basic-info-heading">{t('common:tenant.PgConfigurationDetail.t_eb7f501b')}</h2>
          <div className="detail-grid">
            <div className="detail-item">
              <label>{t('common:tenant.PgConfigurationDetail.t_491fa1fa')}</label>
              <div className="detail-value"><SafeText>{config.pgProvider}</SafeText></div>
            </div>
            <div className="detail-item">
              <label>{t('common:tenant.PgConfigurationDetail.t_9be04456')}</label>
              <div className="detail-value"><SafeText fallback="-">{config.pgName}</SafeText></div>
            </div>
            <div className="detail-item">
              <label>{t('common:tenant.PgConfigurationDetail.t_fd31712d')}</label>
              <div className="detail-value"><SafeText fallback="-">{config.merchantId}</SafeText></div>
            </div>
            <div className="detail-item">
              <label>{t('common:tenant.PgConfigurationDetail.t_ed6daa8a')}</label>
              <div className="detail-value"><SafeText fallback="-">{config.storeId}</SafeText></div>
            </div>
            <div className="detail-item">
              <label>{t('common:tenant.PgConfigurationDetail.t_cfd49442')}</label>
              <div className="detail-value">
                {config.testMode ? '예' : '아니오'}
              </div>
            </div>
            <div className="detail-item">
              <label>{t('common:tenant.PgConfigurationDetail.t_6f80446e')}</label>
              <div className="detail-value">
                {config.createdAt ? new Date(config.createdAt).toLocaleString('ko-KR') : '-'}
              </div>
            </div>
          </div>
        </section>
        
        {/* URL 정보 */}
        {(config.webhookUrl || config.returnUrl || config.cancelUrl) && (
          <section className="detail-section" aria-labelledby="url-info-heading">
            <h2 id="url-info-heading">{t('common:tenant.PgConfigurationDetail.t_bef186e5')}</h2>
            <div className="detail-grid">
              {config.webhookUrl && (
                <div className="detail-item detail-item--full">
                  <label>{t('common:tenant.PgConfigurationDetail.t_08d56e4c')}</label>
                  <div className="detail-value detail-value--url">
                    <a href={toDisplayString(config.webhookUrl, '#')} target="_blank" rel="noopener noreferrer">
                      <SafeText>{config.webhookUrl}</SafeText>
                      <ExternalLinkIcon size={14} />
                    </a>
                  </div>
                </div>
              )}
              {config.returnUrl && (
                <div className="detail-item detail-item--full">
                  <label>{t('common:tenant.PgConfigurationDetail.t_075badce')}</label>
                  <div className="detail-value detail-value--url">
                    <a href={toDisplayString(config.returnUrl, '#')} target="_blank" rel="noopener noreferrer">
                      <SafeText>{config.returnUrl}</SafeText>
                      <ExternalLinkIcon size={14} />
                    </a>
                  </div>
                </div>
              )}
              {config.cancelUrl && (
                <div className="detail-item detail-item--full">
                  <label>{t('common:tenant.PgConfigurationDetail.t_73f8dcaf')}</label>
                  <div className="detail-value detail-value--url">
                    <a href={toDisplayString(config.cancelUrl, '#')} target="_blank" rel="noopener noreferrer">
                      <SafeText>{config.cancelUrl}</SafeText>
                      <ExternalLinkIcon size={14} />
                    </a>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}
        
        {/* 키 정보 */}
        <section className="detail-section" aria-labelledby="key-info-heading">
          <h2 id="key-info-heading">{t('common:tenant.PgConfigurationDetail.t_5688ba74')}</h2>
          <div className="key-info">
            {!showKeys ? (
              <div className="key-placeholder">
                <KeyIcon size={24} />
                <p>{t('common:tenant.PgConfigurationDetail.t_59ff126a')}</p>
                <MGButton
                  type="button"
                  variant="secondary"
                  className={buildErpMgButtonClassName({
                    variant: 'secondary',
                    size: 'md',
                    loading: loadingKeys
                  })}
                  loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                  onClick={handleDecryptKeys}
                  disabled={loadingKeys}
                  loading={loadingKeys}
                  preventDoubleClick={false}
                >
                  {t('common:tenant.PgConfigurationDetail.t_0086a11b')}
                </MGButton>
              </div>
            ) : (
              <div className="key-display">
                <div className="key-item">
                  <label>{t('common:tenant.PgConfigurationDetail.t_84a0aecd')}</label>
                  <div className="key-value">
                    <code>{decryptedKeys?.apiKey || '***'}</code>
                    <MGButton
                      type="button"
                      className={buildErpMgButtonClassName({
                        variant: 'outline',
                        size: 'sm',
                        loading: false,
                        className: 'key-copy-button'
                      })}
                      loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                      onClick={() => {
                        navigator.clipboard.writeText(decryptedKeys?.apiKey || '');
                        showNotification('API 키가 복사되었습니다.', 'success');
                      }}
                      title={t('common:tenant.PgConfigurationDetail.t_a55b1ecb')}
                      variant="outline"
                      size="small"
                      preventDoubleClick={false}
                    >
                      {t('common:tenant.PgConfigurationDetail.t_a55b1ecb')}
                    </MGButton>
                  </div>
                </div>
                <div className="key-item">
                  <label>{t('common:tenant.PgConfigurationDetail.t_84414129')}</label>
                  <div className="key-value">
                    <code>{decryptedKeys?.secretKey || '***'}</code>
                    <MGButton
                      type="button"
                      className={buildErpMgButtonClassName({
                        variant: 'outline',
                        size: 'sm',
                        loading: false,
                        className: 'key-copy-button'
                      })}
                      loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                      onClick={() => {
                        navigator.clipboard.writeText(decryptedKeys?.secretKey || '');
                        showNotification('시크릿 키가 복사되었습니다.', 'success');
                      }}
                      title={t('common:tenant.PgConfigurationDetail.t_a55b1ecb')}
                      variant="outline"
                      size="small"
                      preventDoubleClick={false}
                    >
                      {t('common:tenant.PgConfigurationDetail.t_a55b1ecb')}
                    </MGButton>
                  </div>
                </div>
                {decryptedKeys?.decryptedAt && (
                  <div className="key-info-footer">
                    <InfoIcon size={14} />
                    <span>복호화 시각: {new Date(decryptedKeys.decryptedAt).toLocaleString('ko-KR')}</span>
                  </div>
                )}
                <MGButton
                  type="button"
                  variant="secondary"
                  size="small"
                  className={buildErpMgButtonClassName({ variant: 'secondary', size: 'sm', loading: false })}
                  loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                  onClick={() => {
                    setShowKeys(false);
                    setDecryptedKeys(null);
                  }}
                  preventDoubleClick={false}
                >
                  {t('admin.labels.hide')}
                </MGButton>
              </div>
            )}
          </div>
        </section>
        
        {/* 연결 테스트 결과 */}
        {config.lastConnectionTestAt && (
          <div className="detail-section">
            <h2>{t('common:tenant.PgConfigurationDetail.t_94d2ddf9')}</h2>
            <div className="connection-test-result">
              <div className="test-result-header">
                <div className="test-result-status">
                  {config.connectionTestResult === 'SUCCESS' ? (
                    <CheckCircleIcon size={20} className="success" />
                  ) : (
                    <XCircleIcon size={20} className="error" />
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
          <h2 id="approval-info-heading">{t('common:tenant.PgConfigurationDetail.t_52de78a8')}</h2>
          {config.approvalStatus === 'PENDING' && (
            <div className="approval-status-pending">
              <ClockIcon size={24} />
              <div>
                <h3>{t('common:tenant.PgConfigurationDetail.t_464a0c5d')}</h3>
                <p>{t('common:tenant.PgConfigurationDetail.t_d53d999d')}</p>
                {config.requestedAt && (
                  <div className="request-info">
                    <span>요청 시각: {new Date(config.requestedAt).toLocaleString('ko-KR')}</span>
                    {config.requestedBy && <span>{t('common:tenant.PgConfigurationDetail.t_17102fe2')} <SafeText>{config.requestedBy}</SafeText></span>}
                  </div>
                )}
              </div>
            </div>
          )}
          {config.approvalStatus === 'APPROVED' && (
            <div className="approval-status-approved">
              <CheckCircleIcon size={24} />
              <div>
                <h3>{t('common.labels.approved')}</h3>
                <div className="detail-grid">
                  {config.approvedBy && (
                    <div className="detail-item">
                      <label>{t('common:tenant.PgConfigurationDetail.t_f5c67354')}</label>
                      <div className="detail-value"><SafeText>{config.approvedBy}</SafeText></div>
                    </div>
                  )}
                  {config.approvedAt && (
                    <div className="detail-item">
                      <label>{t('common:tenant.PgConfigurationDetail.t_be138184')}</label>
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
              <XCircleIcon size={24} />
              <div>
                <h3>{t('admin.labels.rejected')}</h3>
                {config.rejectionReason && (
                  <div className="detail-item detail-item--full">
                    <label>{t('common:tenant.PgConfigurationDetail.t_9ec8e88f')}</label>
                    <div className="detail-value detail-value--error">
                      <SafeText>{config.rejectionReason}</SafeText>
                    </div>
                  </div>
                )}
                {config.approvedBy && (
                  <div className="detail-item">
                    <label>{t('common:tenant.PgConfigurationDetail.t_269206b7')}</label>
                    <div className="detail-value"><SafeText>{config.approvedBy}</SafeText></div>
                  </div>
                )}
                {config.approvedAt && (
                  <div className="detail-item">
                    <label>{t('common:tenant.PgConfigurationDetail.t_e1c71060')}</label>
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
            <h2>{t('common:tenant.PgConfigurationDetail.t_75cffa41')}</h2>
            <SafeText tag="div" className="detail-notes">{config.notes}</SafeText>
          </div>
        )}
        
        {/* 변경 이력 */}
        {config.history && config.history.length > 0 && (
          <div className="detail-section">
            <h2>
              <HistoryIcon size={20} />
              {t('common:tenant.PgConfigurationDetail.t_14bf3e5b')}
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
                      {t('common:tenant.PgConfigurationDetail.t_fc272f0f')} <SafeText>{item.changedBy}</SafeText>
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
            </main>
        </ContentArea>

        {/* 삭제 확인 모달 */}
        <UnifiedModal
          isOpen={Boolean(showDeleteModal && config)}
          onClose={() => setShowDeleteModal(false)}
          title={t('common:tenant.PgConfigurationDetail.t_bb36d692')}
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
                className={buildErpMgButtonClassName({
                  variant: 'secondary',
                  size: 'md',
                  loading: false
                })}
                loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                onClick={() => setShowDeleteModal(false)}
                disabled={loading}
                preventDoubleClick={false}
              >
                {t('admin.actions.cancel')}
              </MGButton>
              <MGButton
                type="button"
                variant="danger"
                className={buildErpMgButtonClassName({
                  variant: 'danger',
                  size: 'md',
                  loading: loading
                })}
                loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                onClick={handleDelete}
                disabled={loading}
                preventDoubleClick={false}
              >
                {t('admin.actions.delete')}
              </MGButton>
            </>
          }
        >
          {config && (
            <>
              <p>
                정말로{' '}
                <strong>
                  <SafeText>{config.pgName ?? config.pgProvider}</SafeText>
                </strong>
                {' '}설정을 삭제하시겠습니까?
              </p>
              <p className="warning-text">{t('common:tenant.PgConfigurationDetail.t_cdfb991d')}</p>
            </>
          )}
        </UnifiedModal>
      </>
    </AdminCommonLayout>
  );
};

export default PgConfigurationDetail;

