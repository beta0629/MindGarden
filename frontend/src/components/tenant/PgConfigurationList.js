import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ICONS } from '../../constants/icons';
import { useSession } from '../../contexts/SessionContext';
import { getPgConfigurations, deletePgConfiguration, testPgConnection } from '../../utils/pgApi';
import notificationManager from '../../utils/notification';
import { runResourceLoad, softRefresh } from '../../utils/softRefresh';
import AdminCommonLayout from '../layout/AdminCommonLayout';
import StatusBadge from '../common/StatusBadge';
import SafeText from '../common/SafeText';
import SafeErrorDisplay from '../common/SafeErrorDisplay';
import UnifiedLoading from '../common/UnifiedLoading';
import EmptyState from '../common/EmptyState';
import ListTableView from '../common/ListTableView';
import TabChipRow from '../common/TabChipRow';
import {
  SettingsButton,
  SettingsPageShell,
  SettingsSectionPanel,
  SettingsSummaryStrip
} from '../admin/settings-shell';
import UnifiedModal from '../common/modals/UnifiedModal';
import '../../styles/unified-design-tokens.css';
import './PgConfigurationLegacyGlobals.css';
import './PgConfigurationList.css';
import { toDisplayString } from '../../utils/safeDisplay';
import { maskPortoneChannelKey } from '../../utils/portonePgSettingsJson';
import { useTranslation } from 'react-i18next';
import { isPgConfigDeletable } from './pgConfigurationListUtils';
import { ADMIN_SHOP_PG_COPY } from '../../constants/adminShopSuite';
import {
  PG_LIST_APPROVAL_BADGE,
  PG_LIST_COPY,
  PG_LIST_QUICK_FILTER,
  PG_LIST_STATUS_BADGE,
  formatPgListCount
} from '../../constants/pgConfigurationList';

const CreditCardIcon = ICONS.CREDIT_CARD;

export { isPgConfigDeletable };

const PG_LIST_TITLE_ID = 'pg-config-list-title';
const PG_LIST_ARIA_LABEL = PG_LIST_COPY.ARIA_LABEL;
const PG_LIST_SHELL_CLASS = 'mg-v2-pg-config-list pg-config-list--clinic-os';

/**
 * PG 설정 목록 페이지
 * 테넌트 포털에서 PG 설정 목록을 조회하고 관리
 *
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
const PgConfigurationList = () => {
  const { t } = useTranslation();
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
  const [deleting, setDeleting] = useState(false);
  const [testingConnection, setTestingConnection] = useState(null);
  
  const tenantId = user?.tenantId || user?.tenant_id;
  
  /**
   * @param {{ silent?: boolean }} [options] silent=true 이면 페이지 로딩 미사용
   */
  const loadConfigurations = useCallback(async(options = {}) => {
    if (!tenantId) return;
    
    try {
      await runResourceLoad(options, setLoading, async() => {
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
      });
    } catch (err) {
      console.error('PG 설정 목록 로드 실패:', err);
      setError('PG 설정 목록을 불러오는 중 오류가 발생했습니다.');
      notificationManager.error('PG 설정 목록 로드 실패');
    }
  }, [tenantId, filters]);
  
  useEffect(() => {
    if (!sessionLoading && isLoggedIn && user && tenantId) {
      loadConfigurations();
    }
  }, [sessionLoading, isLoggedIn, user, tenantId, loadConfigurations]);

  const handleDelete = async() => {
    if (!selectedConfig || !tenantId) return;
    
    try {
      setDeleting(true);
      await deletePgConfiguration(tenantId, selectedConfig.configId);
      notificationManager.success('PG 설정이 삭제되었습니다.');
      setShowDeleteModal(false);
      setSelectedConfig(null);
      await softRefresh(loadConfigurations);
    } catch (err) {
      console.error('PG 설정 삭제 실패:', err);
      const errorMessage =
        err?.response?.data?.message ||
        err?.message ||
        'PG 설정 삭제 중 오류가 발생했습니다.';
      notificationManager.error(errorMessage);
    } finally {
      setDeleting(false);
    }
  };
  
  const handleTestConnection = async(configId) => {
    if (!tenantId) return;
    
    try {
      setTestingConnection(configId);
      const result = await testPgConnection(tenantId, configId);
      
      if (result.success) {
        notificationManager.success('연결 테스트 성공');
      } else {
        notificationManager.error(`연결 테스트 실패: ${result.message}`);
      }
      
      await softRefresh(loadConfigurations);
    } catch (err) {
      console.error('연결 테스트 실패:', err);
      notificationManager.error('연결 테스트 중 오류가 발생했습니다.');
    } finally {
      setTestingConnection(null);
    }
  };
  
  const renderStatusBadge = (status) => {
    const badge = PG_LIST_STATUS_BADGE[status] || PG_LIST_STATUS_BADGE.PENDING;
    return <StatusBadge variant={badge.variant}>{toDisplayString(badge.label, '—')}</StatusBadge>;
  };

  const renderApprovalBadge = (approvalStatus) => {
    const badge = PG_LIST_APPROVAL_BADGE[approvalStatus] || PG_LIST_APPROVAL_BADGE.PENDING;
    return <StatusBadge variant={badge.variant}>{toDisplayString(badge.label, '—')}</StatusBadge>;
  };

  if (sessionLoading || (loading && configurations.length === 0)) {
    return (
      <AdminCommonLayout title={ADMIN_SHOP_PG_COPY.TITLE}>
        <SettingsPageShell
          title={ADMIN_SHOP_PG_COPY.TITLE}
          titleId={PG_LIST_TITLE_ID}
          ariaLabel={PG_LIST_ARIA_LABEL}
          className={PG_LIST_SHELL_CLASS}
        >
          <div className="mg-v2-loading-container" role="status" aria-live="polite" aria-busy="true">
            <UnifiedLoading type="inline" text={t('common:tenant.PgConfigurationList.t_38760583')} />
          </div>
        </SettingsPageShell>
      </AdminCommonLayout>
    );
  }
  
  if (!isLoggedIn || !user) {
    return (
      <AdminCommonLayout title={ADMIN_SHOP_PG_COPY.TITLE}>
        <SettingsPageShell
          title={ADMIN_SHOP_PG_COPY.TITLE}
          titleId={PG_LIST_TITLE_ID}
          ariaLabel={PG_LIST_ARIA_LABEL}
          className={PG_LIST_SHELL_CLASS}
        >
          <SafeErrorDisplay error={t('common:tenant.PgConfigurationList.t_5271ee34')} />
        </SettingsPageShell>
      </AdminCommonLayout>
    );
  }

  if (!tenantId) {
    return (
      <AdminCommonLayout title={ADMIN_SHOP_PG_COPY.TITLE}>
        <SettingsPageShell
          title={ADMIN_SHOP_PG_COPY.TITLE}
          titleId={PG_LIST_TITLE_ID}
          ariaLabel={PG_LIST_ARIA_LABEL}
          className={PG_LIST_SHELL_CLASS}
        >
          <SafeErrorDisplay error={t('common:tenant.PgConfigurationList.t_8f990fec')} />
        </SettingsPageShell>
      </AdminCommonLayout>
    );
  }

  const summaryTotal = configurations.length;
  const summaryPending = configurations.filter((c) => c.approvalStatus === 'PENDING').length;
  const summaryActive = configurations.filter((c) => c.status === 'ACTIVE').length;

  const handleSummaryFilter = (kind) => {
    if (kind === PG_LIST_QUICK_FILTER.ALL) {
      setFilters((prev) => ({ ...prev, status: '', approvalStatus: '' }));
      return;
    }
    if (kind === PG_LIST_QUICK_FILTER.PENDING) {
      setFilters((prev) => ({ ...prev, status: '', approvalStatus: 'PENDING' }));
      return;
    }
    if (kind === PG_LIST_QUICK_FILTER.ACTIVE) {
      setFilters((prev) => ({ ...prev, status: 'ACTIVE', approvalStatus: '' }));
    }
  };

  let quickFilterKey = PG_LIST_QUICK_FILTER.CUSTOM;
  if (!filters.status && !filters.approvalStatus) {
    quickFilterKey = PG_LIST_QUICK_FILTER.ALL;
  } else if (!filters.status && filters.approvalStatus === 'PENDING') {
    quickFilterKey = PG_LIST_QUICK_FILTER.PENDING;
  } else if (filters.status === 'ACTIVE' && !filters.approvalStatus) {
    quickFilterKey = PG_LIST_QUICK_FILTER.ACTIVE;
  }

  const summaryItems = [
    { key: 'all', label: PG_LIST_COPY.SUMMARY_ALL, value: formatPgListCount(summaryTotal) },
    { key: 'pending', label: PG_LIST_COPY.SUMMARY_PENDING, value: formatPgListCount(summaryPending) },
    { key: 'active', label: PG_LIST_COPY.SUMMARY_ACTIVE, value: formatPgListCount(summaryActive) }
  ];

  const quickFilterItems = [
    { key: PG_LIST_QUICK_FILTER.ALL, label: PG_LIST_COPY.SUMMARY_ALL },
    { key: PG_LIST_QUICK_FILTER.PENDING, label: PG_LIST_COPY.SUMMARY_PENDING },
    { key: PG_LIST_QUICK_FILTER.ACTIVE, label: PG_LIST_COPY.SUMMARY_ACTIVE }
  ];

  const listColumns = [
    { key: 'name', label: PG_LIST_COPY.COL_NAME },
    { key: 'provider', label: t('common:tenant.PgConfigurationList.t_6fa6eaf8'), hideOnMobile: true },
    { key: 'merchant', label: t('common:tenant.PgConfigurationList.t_028977fd'), hideOnMobile: true },
    { key: 'store', label: t('common:tenant.PgConfigurationList.t_74c0ddf7'), hideOnMobile: true },
    { key: 'lastTest', label: t('common:tenant.PgConfigurationList.t_4521343d'), hideOnMobile: true },
    { key: 'status', label: PG_LIST_COPY.COL_STATUS },
    { key: 'actions', label: PG_LIST_COPY.COL_ACTIONS }
  ];

  const renderNameCell = (config) => (
    <span
      className="mg-v2-settings-table__cell-stack"
      aria-label={`${PG_LIST_COPY.ROW_ARIA_PREFIX}${toDisplayString(config.pgName || config.pgProvider, '')}`}
    >
      <strong><SafeText>{config.pgName || config.pgProvider}</SafeText></strong>
      {config.notes ? <SafeText className="mg-v2-settings-muted">{config.notes}</SafeText> : null}
      {config.approvalStatus === 'PENDING' ? (
        <span className="mg-v2-settings-text--warning">{t('common:tenant.PgConfigurationList.t_5f44a8c3')}</span>
      ) : null}
      {config.approvalStatus === 'REJECTED' && config.rejectionReason ? (
        <span className="mg-v2-settings-text--danger">
          {PG_LIST_COPY.REJECTED_PREFIX}
          <SafeText>{config.rejectionReason}</SafeText>
        </span>
      ) : null}
    </span>
  );

  const renderActionsCell = (config) => (
    <span className="pg-config-list__row-actions">
      <SettingsButton
        type="button"
        variant="secondary"
        onClick={() => navigate(`/tenant/pg-configurations/${config.configId}`)}
        preventDoubleClick={false}
      >
        {t('common:tenant.PgConfigurationList.t_7ffb5a8b')}
      </SettingsButton>
      {config.status === 'APPROVED' && (
        <SettingsButton
          type="button"
          variant="ghost"
          onClick={() => handleTestConnection(config.configId)}
          disabled={testingConnection === config.configId}
          loading={testingConnection === config.configId}
          preventDoubleClick={false}
        >
          {t('common:tenant.PgConfigurationList.t_3da5c18d')}
        </SettingsButton>
      )}
      {config.approvalStatus === 'PENDING' && (
        <SettingsButton
          type="button"
          variant="ghost"
          onClick={() => navigate(`/tenant/pg-configurations/${config.configId}/edit`)}
          preventDoubleClick={false}
        >
          {t('common.actions.edit')}
        </SettingsButton>
      )}
      {isPgConfigDeletable(config) && (
        <SettingsButton
          type="button"
          variant="danger"
          onClick={() => {
            setSelectedConfig(config);
            setShowDeleteModal(true);
          }}
          preventDoubleClick={false}
        >
          {t('admin.actions.delete')}
        </SettingsButton>
      )}
    </span>
  );

  const renderListCell = (key, config) => {
    switch (key) {
      case 'name':
        return renderNameCell(config);
      case 'provider':
        return <SafeText>{config.pgProvider}</SafeText>;
      case 'merchant':
        return <SafeText className="mg-v2-settings-mono" fallback="—">{config.merchantId}</SafeText>;
      case 'store':
        return config.storeId
          ? <SafeText className="mg-v2-settings-mono">{maskPortoneChannelKey(config.storeId)}</SafeText>
          : '—';
      case 'lastTest':
        return config.lastConnectionTestAt
          ? new Date(config.lastConnectionTestAt).toLocaleString('ko-KR')
          : '—';
      case 'status':
        return (
          <span className="pg-config-list__badges">
            {renderStatusBadge(config.status)}
            {renderApprovalBadge(config.approvalStatus)}
            {config.testMode && (
              <StatusBadge variant="info">{t('common:tenant.PgConfigurationList.t_cfd49442')}</StatusBadge>
            )}
          </span>
        );
      case 'actions':
        return renderActionsCell(config);
      default:
        return null;
    }
  };

  return (
    <AdminCommonLayout title={ADMIN_SHOP_PG_COPY.TITLE}>
      <>
        <SettingsPageShell
          title={ADMIN_SHOP_PG_COPY.TITLE}
          titleId={PG_LIST_TITLE_ID}
          ariaLabel={PG_LIST_ARIA_LABEL}
          className={PG_LIST_SHELL_CLASS}
          actions={(
            <SettingsButton
              type="button"
              variant="primary"
              onClick={() => navigate('/tenant/pg-configurations/new')}
              preventDoubleClick={false}
            >
              {t('common:tenant.PgConfigurationList.t_61ce87de')}
            </SettingsButton>
          )}
          tabs={(
            <TabChipRow
              items={quickFilterItems}
              activeKey={quickFilterKey}
              onChange={handleSummaryFilter}
              ariaLabel={PG_LIST_COPY.QUICK_FILTER_ARIA}
            />
          )}
          summary={(
            <SettingsSummaryStrip
              items={summaryItems}
              ariaLabel={PG_LIST_COPY.SUMMARY_ARIA}
              testId="pg-config-list-summary"
            />
          )}
        >
          <SettingsSectionPanel body="plain" ariaLabel={PG_LIST_ARIA_LABEL}>
            <div className="mg-v2-settings-toolbar">
              <input
                type="text"
                placeholder={t('common:tenant.PgConfigurationList.t_4598635c')}
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="mg-v2-form-input"
                aria-label={t('common:tenant.PgConfigurationList.t_75c13af6')}
              />
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="mg-v2-select"
                aria-label={t('common:tenant.PgConfigurationList.t_1dfdb50f')}
              >
                <option value="">{t('common:tenant.PgConfigurationList.t_21caa442')}</option>
                {/* 표준화: 상태값 공통코드 동적 조회 권장 getCommonCodes('STATUS_GROUP') */}
                <option value="PENDING">{t('common:tenant.PgConfigurationList.t_ec425b26')}</option>
                <option value="APPROVED">{t('common.labels.approved')}</option>
                <option value="REJECTED">{t('admin.labels.rejected')}</option>
                <option value="ACTIVE">{t('common:tenant.PgConfigurationList.t_bbf831ad')}</option>
                <option value="INACTIVE">{t('common:tenant.PgConfigurationList.t_8ff58636')}</option>
              </select>
              <select
                value={filters.approvalStatus}
                onChange={(e) => setFilters(prev => ({ ...prev, approvalStatus: e.target.value }))}
                className="mg-v2-select"
                aria-label={t('common:tenant.PgConfigurationList.t_b2a166d3')}
              >
                <option value="">{t('common:tenant.PgConfigurationList.t_82f25333')}</option>
                {/* 표준화: 승인 상태 공통코드 동적 조회 권장 */}
                <option value="PENDING">{t('common:tenant.PgConfigurationList.t_f5aaa7c5')}</option>
                <option value="APPROVED">{t('common.labels.approved')}</option>
                <option value="REJECTED">{t('admin.labels.rejected')}</option>
              </select>
              <span className="mg-v2-settings-toolbar__spacer" />
              <SettingsButton
                type="button"
                variant="ghost"
                onClick={loadConfigurations}
                preventDoubleClick={false}
              >
                {t('admin.actions.refresh')}
              </SettingsButton>
            </div>

            <SafeErrorDisplay error={error} />

            <div className="pg-config-list__stage">
              {configurations.length === 0 ? (
                <EmptyState
                  icon={<CreditCardIcon aria-hidden="true" />}
                  title={t('common:tenant.PgConfigurationList.t_8755c9a8')}
                  description={t('common:tenant.PgConfigurationList.t_72539156')}
                  action={(
                    <SettingsButton
                      type="button"
                      variant="secondary"
                      onClick={() => navigate('/tenant/pg-configurations/new')}
                      preventDoubleClick={false}
                    >
                      {t('common:tenant.PgConfigurationList.t_61ce87de')}
                    </SettingsButton>
                  )}
                />
              ) : (
                <div className="mg-v2-settings-table" data-testid="pg-config-list-table">
                  <ListTableView
                    columns={listColumns}
                    data={configurations}
                    renderCell={renderListCell}
                    rowKeyField="configId"
                  />
                </div>
              )}
            </div>
          </SettingsSectionPanel>
        </SettingsPageShell>

        {/* 삭제 확인 모달 */}
        <UnifiedModal
          isOpen={Boolean(showDeleteModal && selectedConfig)}
          onClose={() => setShowDeleteModal(false)}
          title={t('common:tenant.PgConfigurationList.t_bb36d692')}
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
                {t('admin.actions.cancel')}
              </SettingsButton>
              <SettingsButton
                type="button"
                variant="danger"
                onClick={handleDelete}
                disabled={deleting}
                loading={deleting}
                preventDoubleClick={false}
              >
                {t('admin.actions.delete')}
              </SettingsButton>
            </>
          )}
        >
          {selectedConfig && (
            <>
              <p>
                {PG_LIST_COPY.DELETE_CONFIRM_PREFIX}
                <strong><SafeText>{selectedConfig.pgName || selectedConfig.pgProvider}</SafeText></strong>
                {PG_LIST_COPY.DELETE_CONFIRM_SUFFIX}
              </p>
              <p className="mg-v2-settings-text--danger">{t('common:tenant.PgConfigurationList.t_cdfb991d')}</p>
            </>
          )}
        </UnifiedModal>
      </>
    </AdminCommonLayout>
  );
};

export default PgConfigurationList;
