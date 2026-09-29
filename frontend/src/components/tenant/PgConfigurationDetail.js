import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Info } from 'lucide-react';
import { useSession } from '../../contexts/SessionContext';
import {
  getPgConfigurationDetail,
  deletePgConfiguration,
  testPgConnection,
  decryptPgKeys,
  getPortOneClientConfig,
  patchPgConfigurationWebhookSecret
} from '../../utils/pgApi';
import { showNotification } from '../../utils/notification';
import AdminCommonLayout from '../layout/AdminCommonLayout';
import MGButton from '../common/MGButton';
import EntityRowActions from '../common/molecules/EntityRowActions';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../erp/common/erpMgButtonProps';
import ContentArea from '../dashboard-v2/content/ContentArea';
import ContentHeader from '../dashboard-v2/content/ContentHeader';
import UnifiedModal from '../common/modals/UnifiedModal';
import '../../styles/unified-design-tokens.css';
import '../../styles/shop/AdminShopSuite.css';
import './PgConfigurationDetail.css';
import { toDisplayString } from '../../utils/safeDisplay';
import SafeText from '../common/SafeText';
import {
  PG_PROVIDER_IAMPORT,
  PORTONE_REVIEW_SMOKE_AMOUNT_KRW
} from '../../constants/portonePgConfiguration';
import {
  ADMIN_SHOP_PG_BADGE,
  ADMIN_SHOP_PG_COPY,
  ADMIN_SHOP_PG_HISTORY_PREVIEW,
  ADMIN_SHOP_SUITE_TEST_IDS,
  formatAdminShopCopy
} from '../../constants/adminShopSuite';
import {
  isPortoneWebhookSecretConfigured,
  maskPortoneChannelKey,
  parsePortoneSettingsJson
} from '../../utils/portonePgSettingsJson';
import { requestPortOnePayment } from '../../utils/portonePayment';
import { AdminShopNotice } from '../admin/shop/AdminShopSuiteParts';

const PG_LIST_PATH = '/tenant/pg-configurations';
const EMPTY = '—';

/**
 * @param {string|number|null|undefined} value
 * @returns {string}
 */
const formatDateTime = (value) => (value ? new Date(value).toLocaleString('ko-KR') : EMPTY);

/**
 * 배지 1개: 거부 > 승인 대기 > 사용중 > 사용 안 함.
 *
 * @param {object} config
 * @returns {{ label: string, tone: string }}
 */
const resolvePgBadge = (config) => {
  if (config.approvalStatus === 'REJECTED' || config.status === 'REJECTED') {
    return { label: ADMIN_SHOP_PG_BADGE.REJECTED, tone: 'amber' };
  }
  if (config.approvalStatus === 'PENDING' || config.status === 'PENDING') {
    return { label: ADMIN_SHOP_PG_BADGE.PENDING, tone: 'amber' };
  }
  if (config.status === 'INACTIVE') {
    return { label: ADMIN_SHOP_PG_BADGE.INACTIVE, tone: 'expired' };
  }
  return { label: ADMIN_SHOP_PG_BADGE.ACTIVE, tone: 'paid' };
};

/**
 * @param {Array<object>|undefined} history
 * @returns {Array<object>}
 */
const sortHistoryDesc = (history) => (Array.isArray(history) ? [...history] : [])
  .sort((a, b) => new Date(b?.changedAt || 0) - new Date(a?.changedAt || 0));

/**
 * 결제 연결 (PG 설정 상세) — 열쇠 스트립 + 연결 정보 + 상태·승인·체크리스트 + 변경 이력
 *
 * @author CoreSolution
 * @version 2.0.0
 * @since 2025-01-XX
 */
const PgConfigurationDetail = () => {
  const navigate = useNavigate();
  const { id: configId } = useParams();
  const { user, isLoggedIn, isLoading: sessionLoading } = useSession();

  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [showKeys, setShowKeys] = useState(false);
  const [decryptedKeys, setDecryptedKeys] = useState(null);
  const [loadingKeys, setLoadingKeys] = useState(false);
  const [smokePaymentLoading, setSmokePaymentLoading] = useState(false);
  const [smokeResultOpen, setSmokeResultOpen] = useState(false);
  const [smokeResultMessage, setSmokeResultMessage] = useState('');
  const [webhookSecretInput, setWebhookSecretInput] = useState('');
  const [savingWebhookSecret, setSavingWebhookSecret] = useState(false);
  const [historyExpanded, setHistoryExpanded] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

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
        setError(ADMIN_SHOP_PG_COPY.LOAD_FAILED);
      } finally {
        setLoading(false);
      }
    };

    if (!sessionLoading && isLoggedIn && user && tenantId) {
      loadDetail();
    }
  }, [tenantId, configId, sessionLoading, isLoggedIn, user, reloadKey]);

  const handleDelete = async() => {
    if (!tenantId || !configId) return;
    try {
      setDeleting(true);
      await deletePgConfiguration(tenantId, configId);
      showNotification(ADMIN_SHOP_PG_COPY.DELETED, 'success');
      navigate(PG_LIST_PATH);
    } catch (err) {
      console.error('PG 설정 삭제 실패:', err);
      showNotification(ADMIN_SHOP_PG_COPY.DELETE_FAILED, 'error');
    } finally {
      setDeleting(false);
    }
  };

  const handleTestConnection = async() => {
    if (!tenantId || !configId) return;
    try {
      setTestingConnection(true);
      const result = await testPgConnection(tenantId, configId);
      if (result.success) {
        showNotification(ADMIN_SHOP_PG_COPY.TEST_OK, 'success');
      } else {
        showNotification(`${ADMIN_SHOP_PG_COPY.TEST_FAIL} ${toDisplayString(result.message, '')}`, 'error');
      }
      const detail = await getPgConfigurationDetail(tenantId, configId);
      setConfig(detail);
    } catch (err) {
      console.error('연결 테스트 실패:', err);
      showNotification(ADMIN_SHOP_PG_COPY.TEST_FAIL, 'error');
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
    } catch (err) {
      console.error('키 복호화 실패:', err);
      showNotification(ADMIN_SHOP_PG_COPY.LOAD_FAILED, 'error');
    } finally {
      setLoadingKeys(false);
    }
  };

  /**
   * PG/카드사 심사용 — 포트원 결제 모듈 호출 스모크 (주문 없이 소액).
   */
  const handlePortOneSmokePayment = async() => {
    if (!tenantId) {
      return;
    }
    try {
      setSmokePaymentLoading(true);
      const clientConfig = await getPortOneClientConfig(tenantId);
      const paymentId = `test_${Date.now()}`;
      const result = await requestPortOnePayment({
        storeId: clientConfig.storeId,
        channelKey: clientConfig.channelKey,
        paymentId,
        orderName: ADMIN_SHOP_PG_COPY.SMOKE_ORDER_NAME,
        totalAmount: PORTONE_REVIEW_SMOKE_AMOUNT_KRW,
        currency: 'KRW'
      });
      if (result?.code) {
        setSmokeResultMessage(`모듈 호출 결과(오류): ${result.code} — ${result.message || ''}`);
        showNotification('테스트 결제 모듈에서 오류가 반환되었습니다.', 'error');
      } else {
        setSmokeResultMessage(
          `모듈 호출 성공. paymentId=${result?.paymentId || paymentId}, txId=${result?.txId || '-'}`
        );
        showNotification('테스트 결제 모듈이 호출되었습니다.', 'success');
      }
      setSmokeResultOpen(true);
    } catch (err) {
      console.error('포트원 테스트 결제 모듈 호출 실패:', err);
      const msg = err?.message || err?.response?.data?.message || '테스트 결제 모듈 호출 실패';
      setSmokeResultMessage(String(msg));
      setSmokeResultOpen(true);
      showNotification(String(msg), 'error');
    } finally {
      setSmokePaymentLoading(false);
    }
  };

  /**
   * ACTIVE 포함 모든 상태에서 웹훅 시크릿만 갱신 (재승인 없음).
   */
  const handleSaveWebhookSecret = async() => {
    if (!tenantId || !configId) {
      return;
    }
    const trimmed = webhookSecretInput != null ? String(webhookSecretInput).trim() : '';
    if (!trimmed) {
      showNotification(ADMIN_SHOP_PG_COPY.WEBHOOK_EMPTY, 'error');
      return;
    }
    try {
      setSavingWebhookSecret(true);
      await patchPgConfigurationWebhookSecret(tenantId, configId, trimmed);
      const detail = await getPgConfigurationDetail(tenantId, configId);
      setConfig(detail);
      setWebhookSecretInput('');
      showNotification(ADMIN_SHOP_PG_COPY.WEBHOOK_SAVED, 'success');
    } catch (err) {
      console.error('웹훅 시크릿 저장 실패:', err);
      showNotification(ADMIN_SHOP_PG_COPY.WEBHOOK_FAILED, 'error');
    } finally {
      setSavingWebhookSecret(false);
    }
  };

  const copyKey = (value) => {
    navigator.clipboard.writeText(value || '');
    showNotification(ADMIN_SHOP_PG_COPY.KEYS_COPIED, 'success');
  };

  const renderMessage = (message, withRetry) => (
    <AdminCommonLayout title={ADMIN_SHOP_PG_COPY.TITLE}>
      <ContentArea ariaLabel={ADMIN_SHOP_PG_COPY.TITLE} className="mg-v2-pg-config-detail pg-config-detail--clinic-os admin-shop-suite">
        <AdminShopNotice tone="error">
          <p>{message}</p>
          <span className="admin-shop-suite__header-actions">
            {withRetry ? (
              <MGButton
                type="button"
                variant="secondary"
                className={buildErpMgButtonClassName({ variant: 'secondary', size: 'sm' })}
                onClick={() => setReloadKey((k) => k + 1)}
                preventDoubleClick={false}
              >
                {ADMIN_SHOP_PG_COPY.RETRY}
              </MGButton>
            ) : null}
            <MGButton
              type="button"
              variant="secondary"
              className={buildErpMgButtonClassName({ variant: 'secondary', size: 'sm' })}
              onClick={() => navigate(PG_LIST_PATH)}
              preventDoubleClick={false}
            >
              {ADMIN_SHOP_PG_COPY.BACK_TO_LIST}
            </MGButton>
          </span>
        </AdminShopNotice>
      </ContentArea>
    </AdminCommonLayout>
  );

  if (sessionLoading || loading) {
    return <AdminCommonLayout title={ADMIN_SHOP_PG_COPY.TITLE} loading loadingText={ADMIN_SHOP_PG_COPY.LOADING} />;
  }
  if (!isLoggedIn || !user) {
    return renderMessage(ADMIN_SHOP_PG_COPY.LOGIN_REQUIRED, false);
  }
  if (!tenantId) {
    return renderMessage(ADMIN_SHOP_PG_COPY.TENANT_REQUIRED, false);
  }
  if (error || !config) {
    return renderMessage(error || ADMIN_SHOP_PG_COPY.LOAD_FAILED, true);
  }

  const isPortone = config.pgProvider === PG_PROVIDER_IAMPORT;
  const parsed = isPortone ? parsePortoneSettingsJson(config.settingsJson) : {};
  const liveKeyMissing = isPortone && !toDisplayString(parsed.channelKey, '').trim();
  const webhookConfigured = isPortone && isPortoneWebhookSecretConfigured(config);
  const badge = resolvePgBadge(config);
  const canEdit = config.approvalStatus === 'PENDING';
  const canTest = config.status === 'APPROVED' || config.status === 'ACTIVE';
  const showSmoke = isPortone && Boolean(config.testMode)
    && (config.status === 'ACTIVE' || config.status === 'APPROVED' || config.approvalStatus === 'APPROVED');
  const history = sortHistoryDesc(config.history);
  const visibleHistory = historyExpanded ? history : history.slice(0, ADMIN_SHOP_PG_HISTORY_PREVIEW);
  const providerLabel = isPortone ? ADMIN_SHOP_PG_COPY.PROVIDER_PORTONE : toDisplayString(config.pgProvider, EMPTY);
  const channelShown = config.testMode ? parsed.channelKeyTest : parsed.channelKey;

  const checklist = [
    { key: 'live', label: ADMIN_SHOP_PG_COPY.CHECKLIST_LIVE_KEY, done: !liveKeyMissing, blocking: true },
    { key: 'webhook', label: ADMIN_SHOP_PG_COPY.CHECKLIST_WEBHOOK, done: webhookConfigured, blocking: true },
    { key: 'test-off', label: ADMIN_SHOP_PG_COPY.CHECKLIST_TEST_OFF, done: !config.testMode, blocking: false }
  ];

  return (
    <AdminCommonLayout title={ADMIN_SHOP_PG_COPY.TITLE}>
      <>
        <ContentArea
          ariaLabel={ADMIN_SHOP_PG_COPY.TITLE}
          className="mg-v2-pg-config-detail pg-config-detail--clinic-os admin-shop-suite"
        >
          <div className="admin-shop-suite" data-testid={ADMIN_SHOP_SUITE_TEST_IDS.PG_DETAIL}>
            <ContentHeader
              titleId="pg-config-detail-title"
              title={(
                <span className="admin-shop-suite__modal-title">
                  {ADMIN_SHOP_PG_COPY.TITLE}
                  <span className={`admin-shop-suite__chip admin-shop-suite__chip--${badge.tone}`}>{badge.label}</span>
                </span>
              )}
              subtitle={isPortone ? ADMIN_SHOP_PG_COPY.SUBTITLE_PORTONE : toDisplayString(config.pgName, '')}
              actions={(
                <div className="admin-shop-suite__header-actions">
                  {showSmoke ? (
                    <MGButton
                      type="button"
                      variant="secondary"
                      className={buildErpMgButtonClassName({ variant: 'secondary', size: 'md', loading: smokePaymentLoading })}
                      loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                      onClick={handlePortOneSmokePayment}
                      disabled={smokePaymentLoading || config.status !== 'ACTIVE'}
                      loading={smokePaymentLoading}
                      title={config.status !== 'ACTIVE' ? ADMIN_SHOP_PG_COPY.SMOKE_NEEDS_ACTIVE : undefined}
                      preventDoubleClick={false}
                    >
                      {ADMIN_SHOP_PG_COPY.SMOKE_OPEN}
                    </MGButton>
                  ) : null}
                  {canTest ? (
                    <MGButton
                      type="button"
                      variant="secondary"
                      className={buildErpMgButtonClassName({ variant: 'secondary', size: 'md', loading: testingConnection })}
                      loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                      onClick={handleTestConnection}
                      disabled={testingConnection}
                      loading={testingConnection}
                      preventDoubleClick={false}
                    >
                      {ADMIN_SHOP_PG_COPY.TEST_CONNECTION}
                    </MGButton>
                  ) : null}
                  <EntityRowActions
                    ariaLabel={ADMIN_SHOP_PG_COPY.MENU_ARIA}
                    items={[
                      {
                        id: 'list',
                        label: ADMIN_SHOP_PG_COPY.MENU_LIST,
                        onClick: () => navigate(PG_LIST_PATH)
                      },
                      {
                        id: 'delete',
                        label: ADMIN_SHOP_PG_COPY.MENU_DELETE,
                        variant: 'destructive',
                        hidden: !canEdit,
                        onClick: () => setShowDeleteModal(true)
                      }
                    ]}
                  />
                  <MGButton
                    type="button"
                    variant="primary"
                    className={buildErpMgButtonClassName({ variant: 'primary', size: 'md' })}
                    onClick={() => navigate(`${PG_LIST_PATH}/${configId}/edit`)}
                    disabled={!canEdit}
                    title={canEdit ? undefined : ADMIN_SHOP_PG_COPY.EDIT_LOCKED}
                    preventDoubleClick={false}
                    data-testid={ADMIN_SHOP_SUITE_TEST_IDS.PG_EDIT}
                  >
                    {ADMIN_SHOP_PG_COPY.EDIT}
                  </MGButton>
                </div>
              )}
            />

            <section className="admin-shop-suite__keystrip" data-testid={ADMIN_SHOP_SUITE_TEST_IDS.PG_KEYSTRIP}>
              <div>
                <span className="admin-shop-suite__section-head">
                  <span className="admin-shop-suite__eyebrow">{ADMIN_SHOP_PG_COPY.KEY_CHANNEL}</span>
                  {config.testMode ? (
                    <span className="admin-shop-suite__chip admin-shop-suite__chip--amber">{ADMIN_SHOP_PG_COPY.KEY_TEST_CHIP}</span>
                  ) : null}
                </span>
                <strong className="admin-shop-suite__mono"><SafeText>{maskPortoneChannelKey(channelShown)}</SafeText></strong>
                {isPortone ? (
                  <span className={liveKeyMissing ? 'admin-shop-suite__text-amber' : 'admin-shop-suite__muted'}>
                    {liveKeyMissing ? ADMIN_SHOP_PG_COPY.KEY_LIVE_MISSING : ADMIN_SHOP_PG_COPY.KEY_LIVE_READY}
                  </span>
                ) : null}
              </div>
              <div>
                <span className="admin-shop-suite__eyebrow">{ADMIN_SHOP_PG_COPY.KEY_STORE}</span>
                <strong className="admin-shop-suite__mono"><SafeText>{maskPortoneChannelKey(config.storeId)}</SafeText></strong>
                <span className="admin-shop-suite__muted">{ADMIN_SHOP_PG_COPY.KEY_STORE_HINT}</span>
              </div>
              <div>
                <span className="admin-shop-suite__eyebrow">{ADMIN_SHOP_PG_COPY.KEY_TEST_MODE}</span>
                <strong>{config.testMode ? ADMIN_SHOP_PG_COPY.TEST_MODE_ON : ADMIN_SHOP_PG_COPY.TEST_MODE_OFF}</strong>
                <span className="admin-shop-suite__muted">
                  {config.testMode ? ADMIN_SHOP_PG_COPY.TEST_MODE_ON_HINT : ADMIN_SHOP_PG_COPY.TEST_MODE_OFF_HINT}
                </span>
              </div>
            </section>

            <div className="admin-shop-suite__layout admin-shop-suite__layout--pg">
              <div className="admin-shop-suite__stack">
                <section className="admin-shop-suite__card" aria-labelledby="pg-info-heading">
                  <div className="admin-shop-suite__card-head">
                    <h2 id="pg-info-heading" className="admin-shop-suite__card-title">{ADMIN_SHOP_PG_COPY.INFO_TITLE}</h2>
                    <span className="admin-shop-suite__card-hint">{ADMIN_SHOP_PG_COPY.INFO_HINT}</span>
                  </div>
                  <dl className="admin-shop-suite__kv">
                    <div>
                      <dt>{ADMIN_SHOP_PG_COPY.INFO_PROVIDER}</dt>
                      <dd><SafeText>{providerLabel}</SafeText></dd>
                    </div>
                    <div>
                      <dt>{ADMIN_SHOP_PG_COPY.INFO_NAME}</dt>
                      <dd><SafeText fallback={EMPTY}>{config.pgName}</SafeText></dd>
                    </div>
                    <div>
                      <dt>{ADMIN_SHOP_PG_COPY.INFO_MERCHANT}</dt>
                      <dd className="admin-shop-suite__mono"><SafeText fallback={EMPTY}>{config.merchantId}</SafeText></dd>
                    </div>
                    <div>
                      <dt>{ADMIN_SHOP_PG_COPY.INFO_API_SECRET}</dt>
                      <dd>
                        {ADMIN_SHOP_PG_COPY.INFO_API_SECRET_VALUE}
                        {' '}
                        <button
                          type="button"
                          className="admin-shop-suite__copy-btn"
                          onClick={showKeys ? () => { setShowKeys(false); setDecryptedKeys(null); } : handleDecryptKeys}
                          disabled={loadingKeys}
                        >
                          {showKeys ? ADMIN_SHOP_PG_COPY.KEYS_HIDE : ADMIN_SHOP_PG_COPY.MENU_KEYS}
                        </button>
                      </dd>
                    </div>
                    {isPortone ? (
                      <>
                        <div>
                          <dt>{ADMIN_SHOP_PG_COPY.INFO_CHANNEL_TEST}</dt>
                          <dd className="admin-shop-suite__mono"><SafeText>{maskPortoneChannelKey(parsed.channelKeyTest)}</SafeText></dd>
                        </div>
                        <div>
                          <dt>{ADMIN_SHOP_PG_COPY.INFO_CHANNEL_LIVE}</dt>
                          <dd className={liveKeyMissing ? 'admin-shop-suite__text-amber' : 'admin-shop-suite__mono'}>
                            {liveKeyMissing
                              ? ADMIN_SHOP_PG_COPY.INFO_MISSING
                              : <SafeText>{maskPortoneChannelKey(parsed.channelKey)}</SafeText>}
                          </dd>
                        </div>
                      </>
                    ) : null}
                    <div>
                      <dt>{ADMIN_SHOP_PG_COPY.INFO_CREATED}</dt>
                      <dd>{formatDateTime(config.createdAt)}</dd>
                    </div>
                    <div>
                      <dt>{ADMIN_SHOP_PG_COPY.INFO_NOTES}</dt>
                      <dd><SafeText fallback={EMPTY}>{config.notes}</SafeText></dd>
                    </div>
                    {config.webhookUrl ? (
                      <div>
                        <dt>{ADMIN_SHOP_PG_COPY.URL_WEBHOOK}</dt>
                        <dd className="admin-shop-suite__mono"><SafeText>{config.webhookUrl}</SafeText></dd>
                      </div>
                    ) : null}
                    {config.returnUrl ? (
                      <div>
                        <dt>{ADMIN_SHOP_PG_COPY.URL_RETURN}</dt>
                        <dd className="admin-shop-suite__mono"><SafeText>{config.returnUrl}</SafeText></dd>
                      </div>
                    ) : null}
                    {config.cancelUrl ? (
                      <div>
                        <dt>{ADMIN_SHOP_PG_COPY.URL_CANCEL}</dt>
                        <dd className="admin-shop-suite__mono"><SafeText>{config.cancelUrl}</SafeText></dd>
                      </div>
                    ) : null}
                  </dl>
                  {showKeys ? (
                    <dl className="admin-shop-suite__kv">
                      <div>
                        <dt>{ADMIN_SHOP_PG_COPY.KEYS_API}</dt>
                        <dd className="admin-shop-suite__mono">
                          <SafeText>{decryptedKeys?.apiKey || '***'}</SafeText>
                          <button type="button" className="admin-shop-suite__copy-btn" onClick={() => copyKey(decryptedKeys?.apiKey)}>
                            {ADMIN_SHOP_PG_COPY.KEYS_COPY}
                          </button>
                        </dd>
                      </div>
                      <div>
                        <dt>{ADMIN_SHOP_PG_COPY.KEYS_SECRET}</dt>
                        <dd className="admin-shop-suite__mono">
                          <SafeText>{decryptedKeys?.secretKey || '***'}</SafeText>
                          <button type="button" className="admin-shop-suite__copy-btn" onClick={() => copyKey(decryptedKeys?.secretKey)}>
                            {ADMIN_SHOP_PG_COPY.KEYS_COPY}
                          </button>
                        </dd>
                      </div>
                      {decryptedKeys?.decryptedAt ? (
                        <div>
                          <dt>{ADMIN_SHOP_PG_COPY.KEYS_DECRYPTED_AT}</dt>
                          <dd>{formatDateTime(decryptedKeys.decryptedAt)}</dd>
                        </div>
                      ) : null}
                    </dl>
                  ) : null}
                </section>

                {isPortone ? (
                  <section className="admin-shop-suite__card" aria-labelledby="webhook-secret-heading">
                    <div className="admin-shop-suite__card-head">
                      <h2 id="webhook-secret-heading" className="admin-shop-suite__card-title admin-shop-suite__modal-title">
                        {ADMIN_SHOP_PG_COPY.WEBHOOK_TITLE}
                        <span className={`admin-shop-suite__chip ${webhookConfigured ? 'admin-shop-suite__chip--paid' : 'admin-shop-suite__chip--amber'}`}>
                          {webhookConfigured ? ADMIN_SHOP_PG_COPY.WEBHOOK_SET : ADMIN_SHOP_PG_COPY.WEBHOOK_UNSET}
                        </span>
                      </h2>
                      <span className="admin-shop-suite__card-hint">{ADMIN_SHOP_PG_COPY.WEBHOOK_HINT}</span>
                    </div>
                    <div className="admin-shop-suite__input-suffix">
                      <label htmlFor="pg-webhook-secret-input" className="sr-only">
                        {ADMIN_SHOP_PG_COPY.WEBHOOK_TITLE}
                      </label>
                      <input
                        id="pg-webhook-secret-input"
                        type="password"
                        className="admin-shop-suite__input"
                        value={webhookSecretInput}
                        onChange={(e) => setWebhookSecretInput(e.target.value)}
                        placeholder={webhookConfigured
                          ? ADMIN_SHOP_PG_COPY.WEBHOOK_PLACEHOLDER_REPLACE
                          : ADMIN_SHOP_PG_COPY.WEBHOOK_PLACEHOLDER}
                        autoComplete="new-password"
                        disabled={savingWebhookSecret}
                      />
                      <MGButton
                        type="button"
                        variant="secondary"
                        className={buildErpMgButtonClassName({ variant: 'secondary', size: 'md', loading: savingWebhookSecret })}
                        loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                        onClick={handleSaveWebhookSecret}
                        disabled={savingWebhookSecret || !String(webhookSecretInput || '').trim()}
                        loading={savingWebhookSecret}
                        preventDoubleClick={false}
                        data-testid={ADMIN_SHOP_SUITE_TEST_IDS.PG_WEBHOOK_SAVE}
                      >
                        {ADMIN_SHOP_PG_COPY.WEBHOOK_SAVE}
                      </MGButton>
                    </div>
                    <AdminShopNotice icon={<Info size={14} aria-hidden="true" />}>
                      <p>{ADMIN_SHOP_PG_COPY.WEBHOOK_NOTICE}</p>
                    </AdminShopNotice>
                  </section>
                ) : null}
              </div>

              <div className="admin-shop-suite__stack">
                <section className="admin-shop-suite__card" aria-labelledby="pg-status-heading">
                  <h2 id="pg-status-heading" className="admin-shop-suite__card-title">{ADMIN_SHOP_PG_COPY.STATUS_TITLE}</h2>
                  {config.lastConnectionTestAt ? (
                    <>
                      <div className="admin-shop-suite__row-line">
                        <span>{ADMIN_SHOP_PG_COPY.STATUS_LAST}</span>
                        <span className={config.connectionTestResult === 'SUCCESS'
                          ? 'admin-shop-suite__row-line-value'
                          : 'admin-shop-suite__text-brick'}
                        >
                          {config.connectionTestResult === 'SUCCESS' ? ADMIN_SHOP_PG_COPY.STATUS_OK : ADMIN_SHOP_PG_COPY.STATUS_FAIL}
                        </span>
                      </div>
                      <div className="admin-shop-suite__row-line">
                        <span>{ADMIN_SHOP_PG_COPY.STATUS_AT}</span>
                        <span className="admin-shop-suite__row-line-value">{formatDateTime(config.lastConnectionTestAt)}</span>
                      </div>
                      {config.connectionTestMessage ? (
                        <div className="admin-shop-suite__row-line">
                          <span>{ADMIN_SHOP_PG_COPY.STATUS_RESULT}</span>
                          <SafeText className="admin-shop-suite__muted">{config.connectionTestMessage}</SafeText>
                        </div>
                      ) : null}
                    </>
                  ) : (
                    <p className="admin-shop-suite__muted">{ADMIN_SHOP_PG_COPY.STATUS_NONE}</p>
                  )}
                </section>

                <section className="admin-shop-suite__card" aria-labelledby="pg-approval-heading">
                  <h2 id="pg-approval-heading" className="admin-shop-suite__card-title">{ADMIN_SHOP_PG_COPY.APPROVAL_TITLE}</h2>
                  <div className="admin-shop-suite__row-line">
                    <span>{ADMIN_SHOP_PG_COPY.APPROVAL_STATE}</span>
                    <span className="admin-shop-suite__row-line-value">
                      {ADMIN_SHOP_PG_COPY.APPROVAL_LABELS[config.approvalStatus] || ADMIN_SHOP_PG_COPY.APPROVAL_LABELS.PENDING}
                    </span>
                  </div>
                  {config.approvalStatus === 'PENDING' ? (
                    <div className="admin-shop-suite__row-line">
                      <span>{ADMIN_SHOP_PG_COPY.APPROVAL_REQUESTED_AT}</span>
                      <span className="admin-shop-suite__row-line-value">{formatDateTime(config.requestedAt)}</span>
                    </div>
                  ) : (
                    <>
                      <div className="admin-shop-suite__row-line">
                        <span>{ADMIN_SHOP_PG_COPY.APPROVAL_BY}</span>
                        <span className="admin-shop-suite__row-line-value"><SafeText fallback={EMPTY}>{config.approvedBy}</SafeText></span>
                      </div>
                      <div className="admin-shop-suite__row-line">
                        <span>{ADMIN_SHOP_PG_COPY.APPROVAL_AT}</span>
                        <span className="admin-shop-suite__row-line-value">{formatDateTime(config.approvedAt)}</span>
                      </div>
                    </>
                  )}
                  {config.approvalStatus === 'REJECTED' && config.rejectionReason ? (
                    <AdminShopNotice tone="error">
                      <p>
                        <strong>{ADMIN_SHOP_PG_COPY.APPROVAL_REASON}</strong>
                        {' '}
                        <SafeText>{config.rejectionReason}</SafeText>
                      </p>
                    </AdminShopNotice>
                  ) : null}
                </section>

                {isPortone ? (
                  <section className="admin-shop-suite__card" aria-labelledby="pg-checklist-heading">
                    <h2 id="pg-checklist-heading" className="admin-shop-suite__card-title">{ADMIN_SHOP_PG_COPY.CHECKLIST_TITLE}</h2>
                    <ol className="admin-shop-suite__checklist" data-testid={ADMIN_SHOP_SUITE_TEST_IDS.PG_CHECKLIST}>
                      {checklist.map((step, index) => {
                        let stateLabel = ADMIN_SHOP_PG_COPY.CHECKLIST_DONE;
                        let stateClass = 'admin-shop-suite__muted';
                        if (!step.done) {
                          stateLabel = step.blocking ? ADMIN_SHOP_PG_COPY.CHECKLIST_NEEDED : ADMIN_SHOP_PG_COPY.CHECKLIST_WAIT;
                          stateClass = step.blocking ? 'admin-shop-suite__text-brick' : 'admin-shop-suite__muted';
                        }
                        return (
                          <li
                            key={step.key}
                            className={step.done ? 'admin-shop-suite__checklist-item--done' : 'admin-shop-suite__checklist-item--todo'}
                          >
                            <span className="admin-shop-suite__num">{index + 1}</span>
                            <span>{step.label}</span>
                            <span className={stateClass}>{stateLabel}</span>
                          </li>
                        );
                      })}
                    </ol>
                  </section>
                ) : null}
              </div>
            </div>

            {history.length > 0 ? (
              <section className="admin-shop-suite__card" aria-labelledby="pg-history-heading">
                <div className="admin-shop-suite__card-head">
                  <h2 id="pg-history-heading" className="admin-shop-suite__card-title">{ADMIN_SHOP_PG_COPY.HISTORY_TITLE}</h2>
                  <span className="admin-shop-suite__card-hint">
                    {formatAdminShopCopy(ADMIN_SHOP_PG_COPY.HISTORY_PREVIEW, {
                      count: Math.min(history.length, ADMIN_SHOP_PG_HISTORY_PREVIEW)
                    })}
                    {history.length > ADMIN_SHOP_PG_HISTORY_PREVIEW ? (
                      <>
                        {' · '}
                        <button
                          type="button"
                          className="admin-shop-suite__copy-btn"
                          onClick={() => setHistoryExpanded((v) => !v)}
                        >
                          {historyExpanded
                            ? ADMIN_SHOP_PG_COPY.HISTORY_COLLAPSE
                            : formatAdminShopCopy(ADMIN_SHOP_PG_COPY.HISTORY_ALL, { count: history.length })}
                        </button>
                      </>
                    ) : null}
                  </span>
                </div>
                <div className="admin-shop-suite__table-wrap">
                  <table className="admin-shop-suite__ledger" data-testid={ADMIN_SHOP_SUITE_TEST_IDS.PG_HISTORY}>
                    <thead>
                      <tr>
                        <th scope="col">{ADMIN_SHOP_PG_COPY.HISTORY_AT}</th>
                        <th scope="col">{ADMIN_SHOP_PG_COPY.HISTORY_BY}</th>
                        <th scope="col">{ADMIN_SHOP_PG_COPY.HISTORY_ITEM}</th>
                        <th scope="col">{ADMIN_SHOP_PG_COPY.HISTORY_CHANGE}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleHistory.map((item, index) => (
                        <tr key={`${item.changedAt || ''}-${index}`}>
                          <td className="admin-shop-suite__num">{formatDateTime(item.changedAt)}</td>
                          <td><SafeText fallback={EMPTY}>{item.changedBy}</SafeText></td>
                          <td><strong><SafeText fallback={EMPTY}>{item.action}</SafeText></strong></td>
                          <td className="admin-shop-suite__muted"><SafeText fallback={EMPTY}>{item.description}</SafeText></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            ) : null}
          </div>
        </ContentArea>

        <UnifiedModal
          isOpen={Boolean(showDeleteModal && config)}
          onClose={() => setShowDeleteModal(false)}
          title={ADMIN_SHOP_PG_COPY.DELETE_TITLE}
          size="small"
          variant="confirm"
          backdropClick={!deleting}
          loading={deleting}
          actions={(
            <>
              <MGButton
                type="button"
                variant="secondary"
                className={buildErpMgButtonClassName({ variant: 'secondary', size: 'md' })}
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                preventDoubleClick={false}
              >
                {ADMIN_SHOP_PG_COPY.CANCEL}
              </MGButton>
              <MGButton
                type="button"
                variant="danger"
                className={buildErpMgButtonClassName({ variant: 'danger', size: 'md', loading: deleting })}
                loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                onClick={handleDelete}
                disabled={deleting}
                preventDoubleClick={false}
              >
                {ADMIN_SHOP_PG_COPY.DELETE_CONFIRM}
              </MGButton>
            </>
          )}
        >
          <p>
            <SafeText>
              {formatAdminShopCopy(ADMIN_SHOP_PG_COPY.DELETE_BODY, {
                name: toDisplayString(config.pgName ?? config.pgProvider, EMPTY)
              })}
            </SafeText>
          </p>
        </UnifiedModal>

        <UnifiedModal
          isOpen={smokeResultOpen}
          onClose={() => setSmokeResultOpen(false)}
          title={ADMIN_SHOP_PG_COPY.SMOKE_RESULT_TITLE}
          size="small"
          variant="info"
          backdropClick
          actions={(
            <MGButton
              type="button"
              variant="secondary"
              className={buildErpMgButtonClassName({ variant: 'secondary', size: 'md' })}
              onClick={() => setSmokeResultOpen(false)}
              preventDoubleClick={false}
            >
              {ADMIN_SHOP_PG_COPY.CLOSE}
            </MGButton>
          )}
        >
          <p>
            <SafeText>{smokeResultMessage}</SafeText>
          </p>
        </UnifiedModal>
      </>
    </AdminCommonLayout>
  );
};

export default PgConfigurationDetail;
