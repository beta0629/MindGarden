import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSession } from '../../contexts/SessionContext';
import {
  getPgConfigurationDetail,
  deletePgConfiguration,
  testPgConnection,
  getPortOneClientConfig
} from '../../utils/pgApi';
import { showNotification } from '../../utils/notification';
import AdminCommonLayout from '../layout/AdminCommonLayout';
import EntityRowActions from '../common/molecules/EntityRowActions';
import ListTableView from '../common/ListTableView';
import StatusBadge from '../common/StatusBadge';
import SafeErrorDisplay from '../common/SafeErrorDisplay';
import UnifiedLoading from '../common/UnifiedLoading';
import {
  SettingsButton,
  SettingsNotice,
  SettingsPageShell,
  SettingsSectionPanel,
  SettingsSummaryStrip
} from '../admin/settings-shell';
import UnifiedModal from '../common/modals/UnifiedModal';
import '../../styles/unified-design-tokens.css';
import './PgConfigurationDetailLegacyGlobals.css';
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
  ADMIN_SHOP_PG_HISTORY_CHANGE_SEPARATOR,
  ADMIN_SHOP_PG_HISTORY_PREVIEW,
  ADMIN_SHOP_PG_HISTORY_STATUS_LABELS,
  ADMIN_SHOP_PG_HISTORY_TYPE_LABELS,
  ADMIN_SHOP_SUITE_TEST_IDS,
  formatAdminShopCopy
} from '../../constants/adminShopSuite';
import {
  isPortoneWebhookSecretConfigured,
  maskPortoneChannelKey,
  parsePortoneSettingsJson
} from '../../utils/portonePgSettingsJson';
import { requestPortOnePayment } from '../../utils/portonePayment';

const PG_LIST_PATH = '/tenant/pg-configurations';
const EMPTY = '—';
const PG_DETAIL_TITLE_ID = 'pg-config-detail-title';
const PG_DETAIL_SHELL_CLASS = 'mg-v2-pg-config-detail pg-config-detail--clinic-os';

const HISTORY_COLUMNS = [
  { key: 'at', label: ADMIN_SHOP_PG_COPY.HISTORY_AT },
  { key: 'by', label: ADMIN_SHOP_PG_COPY.HISTORY_BY, hideOnMobile: true },
  { key: 'item', label: ADMIN_SHOP_PG_COPY.HISTORY_ITEM },
  { key: 'change', label: ADMIN_SHOP_PG_COPY.HISTORY_CHANGE }
];

/**
 * @param {string|number|null|undefined} value
 * @returns {string}
 */
const formatDateTime = (value) => (value ? new Date(value).toLocaleString('ko-KR') : EMPTY);

/**
 * 배지 1개: 거부 > 승인 대기 > 사용중 > 사용 안 함.
 *
 * @param {object} config
 * @returns {{ label: string, variant: string }}
 */
const resolvePgBadge = (config) => {
  if (config.approvalStatus === 'REJECTED' || config.status === 'REJECTED') {
    return { label: ADMIN_SHOP_PG_BADGE.REJECTED, variant: 'danger' };
  }
  if (config.approvalStatus === 'PENDING' || config.status === 'PENDING') {
    return { label: ADMIN_SHOP_PG_BADGE.PENDING, variant: 'warning' };
  }
  if (config.status === 'INACTIVE') {
    return { label: ADMIN_SHOP_PG_BADGE.INACTIVE, variant: 'neutral' };
  }
  return { label: ADMIN_SHOP_PG_BADGE.ACTIVE, variant: 'success' };
};

/**
 * @param {string|null|undefined} status
 * @returns {string}
 */
const formatHistoryStatus = (status) => {
  const key = toDisplayString(status, '').toUpperCase();
  return ADMIN_SHOP_PG_HISTORY_STATUS_LABELS[key] || toDisplayString(status, '');
};

/**
 * 변경 이력 한 줄 — 서버 필드 changeType · oldStatus/newStatus · notes.
 *
 * @param {object} item
 * @returns {{ label: string, change: string }}
 */
const describeHistoryItem = (item) => {
  const type = toDisplayString(item?.changeType, '').toUpperCase();
  const before = formatHistoryStatus(item?.oldStatus);
  const after = formatHistoryStatus(item?.newStatus);
  let change = toDisplayString(item?.notes, '');
  if (before && after && before !== after) {
    change = `${before}${ADMIN_SHOP_PG_HISTORY_CHANGE_SEPARATOR}${after}`;
  } else if (!change && after) {
    change = after;
  }
  return {
    label: ADMIN_SHOP_PG_HISTORY_TYPE_LABELS[type] || toDisplayString(item?.changeType, ''),
    change
  };
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
  const [smokePaymentLoading, setSmokePaymentLoading] = useState(false);
  const [smokeResultOpen, setSmokeResultOpen] = useState(false);
  const [smokeResultMessage, setSmokeResultMessage] = useState('');
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

  const renderMessage = (message, withRetry) => (
    <AdminCommonLayout title={ADMIN_SHOP_PG_COPY.TITLE}>
      <SettingsPageShell
        title={ADMIN_SHOP_PG_COPY.TITLE}
        titleId={PG_DETAIL_TITLE_ID}
        className={PG_DETAIL_SHELL_CLASS}
        actions={(
          <>
            {withRetry ? (
              <SettingsButton
                type="button"
                variant="ghost"
                onClick={() => setReloadKey((k) => k + 1)}
                preventDoubleClick={false}
              >
                {ADMIN_SHOP_PG_COPY.RETRY}
              </SettingsButton>
            ) : null}
            <SettingsButton
              type="button"
              variant="ghost"
              onClick={() => navigate(PG_LIST_PATH)}
              preventDoubleClick={false}
            >
              {ADMIN_SHOP_PG_COPY.BACK_TO_LIST}
            </SettingsButton>
          </>
        )}
      >
        <SafeErrorDisplay error={message} />
      </SettingsPageShell>
    </AdminCommonLayout>
  );

  if (sessionLoading || loading) {
    return (
      <AdminCommonLayout title={ADMIN_SHOP_PG_COPY.TITLE}>
        <SettingsPageShell
          title={ADMIN_SHOP_PG_COPY.TITLE}
          titleId={PG_DETAIL_TITLE_ID}
          className={PG_DETAIL_SHELL_CLASS}
        >
          <div className="mg-v2-loading-container" role="status" aria-live="polite" aria-busy="true">
            <UnifiedLoading type="inline" text={ADMIN_SHOP_PG_COPY.LOADING} />
          </div>
        </SettingsPageShell>
      </AdminCommonLayout>
    );
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

  const summaryItems = [
    {
      key: 'channel',
      label: config.testMode
        ? `${ADMIN_SHOP_PG_COPY.KEY_CHANNEL} · ${ADMIN_SHOP_PG_COPY.KEY_TEST_CHIP}`
        : ADMIN_SHOP_PG_COPY.KEY_CHANNEL,
      value: maskPortoneChannelKey(channelShown),
      caption: isPortone
        ? (liveKeyMissing ? ADMIN_SHOP_PG_COPY.KEY_LIVE_MISSING : ADMIN_SHOP_PG_COPY.KEY_LIVE_READY)
        : undefined
    },
    {
      key: 'store',
      label: ADMIN_SHOP_PG_COPY.KEY_STORE,
      value: maskPortoneChannelKey(config.storeId),
      caption: ADMIN_SHOP_PG_COPY.KEY_STORE_HINT
    },
    {
      key: 'test-mode',
      label: ADMIN_SHOP_PG_COPY.KEY_TEST_MODE,
      value: config.testMode ? ADMIN_SHOP_PG_COPY.TEST_MODE_ON : ADMIN_SHOP_PG_COPY.TEST_MODE_OFF,
      caption: config.testMode ? ADMIN_SHOP_PG_COPY.TEST_MODE_ON_HINT : ADMIN_SHOP_PG_COPY.TEST_MODE_OFF_HINT
    }
  ];

  const historyRows = visibleHistory.map((item, index) => ({
    ...item,
    rowKey: item.id != null ? `pg-history-${item.id}` : `${item.changedAt || ''}-${index}`,
    described: describeHistoryItem(item)
  }));

  const renderHistoryCell = (key, row) => {
    switch (key) {
      case 'at':
        return formatDateTime(row.changedAt);
      case 'by':
        return <SafeText fallback={EMPTY}>{row.changedBy}</SafeText>;
      case 'item':
        return <strong><SafeText fallback={EMPTY}>{row.described.label}</SafeText></strong>;
      case 'change':
        return <SafeText className="mg-v2-settings-muted" fallback={EMPTY}>{row.described.change}</SafeText>;
      default:
        return null;
    }
  };

  const approvalRejected = config.approvalStatus === 'REJECTED' && config.rejectionReason;

  return (
    <AdminCommonLayout title={ADMIN_SHOP_PG_COPY.TITLE}>
      <>
        <SettingsPageShell
          title={(
            <span className="pg-config-detail__title">
              {ADMIN_SHOP_PG_COPY.TITLE}
              <StatusBadge variant={badge.variant}>{badge.label}</StatusBadge>
            </span>
          )}
          titleId={PG_DETAIL_TITLE_ID}
          ariaLabel={ADMIN_SHOP_PG_COPY.TITLE}
          className={PG_DETAIL_SHELL_CLASS}
          actions={(
            <>
              {showSmoke ? (
                <SettingsButton
                  type="button"
                  variant="ghost"
                  onClick={handlePortOneSmokePayment}
                  disabled={smokePaymentLoading || config.status !== 'ACTIVE'}
                  loading={smokePaymentLoading}
                  title={config.status !== 'ACTIVE' ? ADMIN_SHOP_PG_COPY.SMOKE_NEEDS_ACTIVE : undefined}
                  preventDoubleClick={false}
                >
                  {ADMIN_SHOP_PG_COPY.SMOKE_OPEN}
                </SettingsButton>
              ) : null}
              {canTest ? (
                <SettingsButton
                  type="button"
                  variant="ghost"
                  onClick={handleTestConnection}
                  disabled={testingConnection}
                  loading={testingConnection}
                  preventDoubleClick={false}
                >
                  {ADMIN_SHOP_PG_COPY.TEST_CONNECTION}
                </SettingsButton>
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
              <SettingsButton
                type="button"
                variant="primary"
                onClick={() => navigate(`${PG_LIST_PATH}/${configId}/edit`)}
                disabled={!canEdit}
                title={canEdit ? undefined : ADMIN_SHOP_PG_COPY.EDIT_LOCKED}
                preventDoubleClick={false}
                data-testid={ADMIN_SHOP_SUITE_TEST_IDS.PG_EDIT}
              >
                {ADMIN_SHOP_PG_COPY.EDIT}
              </SettingsButton>
            </>
          )}
        >
          <div className="pg-config-detail__body" data-testid={ADMIN_SHOP_SUITE_TEST_IDS.PG_DETAIL}>
            <SettingsSummaryStrip
              items={summaryItems}
              ariaLabel={ADMIN_SHOP_PG_COPY.TITLE}
              testId={ADMIN_SHOP_SUITE_TEST_IDS.PG_KEYSTRIP}
            />

            <div className="pg-config-detail__layout">
              <div className="pg-config-detail__column">
                <SettingsSectionPanel
                  title={ADMIN_SHOP_PG_COPY.INFO_TITLE}
                  description={ADMIN_SHOP_PG_COPY.INFO_HINT}
                  body="form"
                >
                  <dl className="mg-v2-settings-kv">
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
                      <dd className="mg-v2-settings-mono"><SafeText fallback={EMPTY}>{config.merchantId}</SafeText></dd>
                    </div>
                    {isPortone ? (
                      <>
                        <div>
                          <dt>{ADMIN_SHOP_PG_COPY.INFO_CHANNEL_TEST}</dt>
                          <dd className="mg-v2-settings-mono"><SafeText>{maskPortoneChannelKey(parsed.channelKeyTest)}</SafeText></dd>
                        </div>
                        <div>
                          <dt>{ADMIN_SHOP_PG_COPY.INFO_CHANNEL_LIVE}</dt>
                          <dd className={liveKeyMissing ? 'mg-v2-settings-text--warning' : 'mg-v2-settings-mono'}>
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
                        <dd className="mg-v2-settings-mono"><SafeText>{config.webhookUrl}</SafeText></dd>
                      </div>
                    ) : null}
                    {config.returnUrl ? (
                      <div>
                        <dt>{ADMIN_SHOP_PG_COPY.URL_RETURN}</dt>
                        <dd className="mg-v2-settings-mono"><SafeText>{config.returnUrl}</SafeText></dd>
                      </div>
                    ) : null}
                    {config.cancelUrl ? (
                      <div>
                        <dt>{ADMIN_SHOP_PG_COPY.URL_CANCEL}</dt>
                        <dd className="mg-v2-settings-mono"><SafeText>{config.cancelUrl}</SafeText></dd>
                      </div>
                    ) : null}
                  </dl>
                </SettingsSectionPanel>

                {isPortone ? (
                  <SettingsSectionPanel
                    title={ADMIN_SHOP_PG_COPY.WEBHOOK_TITLE}
                    description={ADMIN_SHOP_PG_COPY.WEBHOOK_HINT}
                    actions={(
                      <StatusBadge
                        variant={webhookConfigured ? 'success' : 'warning'}
                        data-testid="pg-webhook-status"
                      >
                        {webhookConfigured ? ADMIN_SHOP_PG_COPY.WEBHOOK_SET : ADMIN_SHOP_PG_COPY.WEBHOOK_UNSET}
                      </StatusBadge>
                    )}
                    body="form"
                  >
                    <SettingsNotice tone="info">
                      <p>{ADMIN_SHOP_PG_COPY.WEBHOOK_OPS_ONLY_NOTICE}</p>
                    </SettingsNotice>
                  </SettingsSectionPanel>
                ) : null}
              </div>

              <div className="pg-config-detail__column">
                <SettingsSectionPanel title={ADMIN_SHOP_PG_COPY.STATUS_TITLE} body="form">
                  {config.lastConnectionTestAt ? (
                    <dl className="mg-v2-settings-kv">
                      <div>
                        <dt>{ADMIN_SHOP_PG_COPY.STATUS_LAST}</dt>
                        <dd className={config.connectionTestResult === 'SUCCESS' ? undefined : 'mg-v2-settings-text--danger'}>
                          {config.connectionTestResult === 'SUCCESS' ? ADMIN_SHOP_PG_COPY.STATUS_OK : ADMIN_SHOP_PG_COPY.STATUS_FAIL}
                        </dd>
                      </div>
                      <div>
                        <dt>{ADMIN_SHOP_PG_COPY.STATUS_AT}</dt>
                        <dd>{formatDateTime(config.lastConnectionTestAt)}</dd>
                      </div>
                      {config.connectionTestMessage ? (
                        <div>
                          <dt>{ADMIN_SHOP_PG_COPY.STATUS_RESULT}</dt>
                          <dd className="mg-v2-settings-muted"><SafeText>{config.connectionTestMessage}</SafeText></dd>
                        </div>
                      ) : null}
                    </dl>
                  ) : (
                    <p className="mg-v2-settings-muted">{ADMIN_SHOP_PG_COPY.STATUS_NONE}</p>
                  )}
                </SettingsSectionPanel>

                <SettingsSectionPanel title={ADMIN_SHOP_PG_COPY.APPROVAL_TITLE} body="form">
                  <dl className="mg-v2-settings-kv">
                    <div>
                      <dt>{ADMIN_SHOP_PG_COPY.APPROVAL_STATE}</dt>
                      <dd>
                        {ADMIN_SHOP_PG_COPY.APPROVAL_LABELS[config.approvalStatus] || ADMIN_SHOP_PG_COPY.APPROVAL_LABELS.PENDING}
                      </dd>
                    </div>
                    {config.approvalStatus === 'PENDING' ? (
                      <div>
                        <dt>{ADMIN_SHOP_PG_COPY.APPROVAL_REQUESTED_AT}</dt>
                        <dd>{formatDateTime(config.requestedAt)}</dd>
                      </div>
                    ) : (
                      <>
                        <div>
                          <dt>{ADMIN_SHOP_PG_COPY.APPROVAL_BY}</dt>
                          <dd><SafeText fallback={EMPTY}>{config.approvedBy}</SafeText></dd>
                        </div>
                        <div>
                          <dt>{ADMIN_SHOP_PG_COPY.APPROVAL_AT}</dt>
                          <dd>{formatDateTime(config.approvedAt)}</dd>
                        </div>
                      </>
                    )}
                  </dl>
                  {approvalRejected ? (
                    <SettingsNotice tone="danger">
                      <p>
                        <strong>{ADMIN_SHOP_PG_COPY.APPROVAL_REASON}</strong>
                        {' '}
                        <SafeText>{config.rejectionReason}</SafeText>
                      </p>
                    </SettingsNotice>
                  ) : null}
                </SettingsSectionPanel>

                {isPortone ? (
                  <SettingsSectionPanel title={ADMIN_SHOP_PG_COPY.CHECKLIST_TITLE} body="form">
                    <ol className="mg-v2-settings-list" data-testid={ADMIN_SHOP_SUITE_TEST_IDS.PG_CHECKLIST}>
                      {checklist.map((step, index) => {
                        let stateLabel = ADMIN_SHOP_PG_COPY.CHECKLIST_DONE;
                        let stateVariant = 'success';
                        if (!step.done) {
                          stateLabel = step.blocking ? ADMIN_SHOP_PG_COPY.CHECKLIST_NEEDED : ADMIN_SHOP_PG_COPY.CHECKLIST_WAIT;
                          stateVariant = step.blocking ? 'danger' : 'neutral';
                        }
                        return (
                          <li key={step.key} className="mg-v2-settings-list__row">
                            <span className="mg-v2-settings-list__main">
                              <span className="mg-v2-settings-list__title">{`${index + 1}. ${step.label}`}</span>
                            </span>
                            <StatusBadge variant={stateVariant}>{stateLabel}</StatusBadge>
                          </li>
                        );
                      })}
                    </ol>
                  </SettingsSectionPanel>
                ) : null}
              </div>
            </div>

            {history.length > 0 ? (
              <SettingsSectionPanel
                title={ADMIN_SHOP_PG_COPY.HISTORY_TITLE}
                body="plain"
                description={formatAdminShopCopy(ADMIN_SHOP_PG_COPY.HISTORY_PREVIEW, {
                  count: Math.min(history.length, ADMIN_SHOP_PG_HISTORY_PREVIEW)
                })}
                actions={history.length > ADMIN_SHOP_PG_HISTORY_PREVIEW ? (
                  <SettingsButton
                    type="button"
                    variant="ghost"
                    onClick={() => setHistoryExpanded((v) => !v)}
                    preventDoubleClick={false}
                  >
                    {historyExpanded
                      ? ADMIN_SHOP_PG_COPY.HISTORY_COLLAPSE
                      : formatAdminShopCopy(ADMIN_SHOP_PG_COPY.HISTORY_ALL, { count: history.length })}
                  </SettingsButton>
                ) : null}
              >
                <div className="mg-v2-settings-table" data-testid={ADMIN_SHOP_SUITE_TEST_IDS.PG_HISTORY}>
                  <ListTableView
                    columns={HISTORY_COLUMNS}
                    data={historyRows}
                    renderCell={renderHistoryCell}
                    rowKeyField="rowKey"
                  />
                </div>
              </SettingsSectionPanel>
            ) : null}
          </div>
        </SettingsPageShell>

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
              <SettingsButton
                type="button"
                variant="secondary"
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                preventDoubleClick={false}
              >
                {ADMIN_SHOP_PG_COPY.CANCEL}
              </SettingsButton>
              <SettingsButton
                type="button"
                variant="danger"
                onClick={handleDelete}
                disabled={deleting}
                loading={deleting}
                preventDoubleClick={false}
              >
                {ADMIN_SHOP_PG_COPY.DELETE_CONFIRM}
              </SettingsButton>
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
            <SettingsButton
              type="button"
              variant="secondary"
              onClick={() => setSmokeResultOpen(false)}
              preventDoubleClick={false}
            >
              {ADMIN_SHOP_PG_COPY.CLOSE}
            </SettingsButton>
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
