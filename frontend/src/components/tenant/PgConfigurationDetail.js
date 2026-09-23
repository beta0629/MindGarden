import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ICONS } from '../../constants/icons';

const AlertCircleIcon = ICONS.ALERT_CIRCLE;
import { useSession } from '../../contexts/SessionContext';
import {
  getPgConfigurationDetail,
  deletePgConfiguration,
  testPgConnection,
  updatePgConfiguration,
  updatePortonePgSettings
} from '../../utils/pgApi';
import { showNotification } from '../../utils/notification';
import AdminCommonLayout from '../layout/AdminCommonLayout';
import MGButton from '../common/MGButton';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../erp/common/erpMgButtonProps';
import ContentArea from '../dashboard-v2/content/ContentArea';
import ContentHeader from '../dashboard-v2/content/ContentHeader';
import UnifiedModal from '../common/modals/UnifiedModal';
import { EntityRowActions } from '../common';
import '../../styles/unified-design-tokens.css';
import './PgConfigurationForm.css';
import './PgConfigurationDetail.css';
import SafeText from '../common/SafeText';
import { useTranslation } from 'react-i18next';
import { PG_PROVIDER_IAMPORT } from '../../constants/portonePgConfiguration';
import { parsePortoneSettingsJson } from '../../utils/portonePgSettingsJson';
import PgConfigurationForm from './PgConfigurationForm';
import { isPgConfigDeletable } from './pgConfigurationListUtils';

const PG_DETAIL_FORM_ID = 'pg-config-detail-form';

/**
 * PG 설정 상세 — Clinic-OS 편집 가능 2열 「연결 정보」+ 열쇠 스트립
 *
 * @author CoreSolution
 * @since 2025-01-XX
 */
const PgConfigurationDetail = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id: configId } = useParams();
  const { user, isLoggedIn, isLoading: sessionLoading } = useSession();

  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [formSaving, setFormSaving] = useState(false);

  const tenantId = user?.tenantId || user?.tenant_id;
  const userId = user?.id;
  const hasConfigRef = useRef(false);

  useEffect(() => {
    hasConfigRef.current = Boolean(config);
  }, [config]);

  const isActiveLike = Boolean(
    config
      && (config.status === 'ACTIVE'
        || config.status === 'APPROVED'
        || config.approvalStatus === 'APPROVED')
  );

  useEffect(() => {
    if (!tenantId || !configId) return;
    if (sessionLoading || !isLoggedIn) return;

    let cancelled = false;

    const loadDetail = async() => {
      const softRefresh = hasConfigRef.current;
      try {
        if (!softRefresh) {
          setLoading(true);
        }
        setError(null);

        const detail = await getPgConfigurationDetail(tenantId, configId);
        if (!cancelled) {
          setConfig(detail);
        }
      } catch (err) {
        console.error('PG 설정 상세 로드 실패:', err);
        if (!cancelled) {
          setError('PG 설정 정보를 불러오는 중 오류가 발생했습니다.');
          showNotification('PG 설정 정보 로드 실패', 'error');
        }
      } finally {
        if (!softRefresh && !cancelled) {
          setLoading(false);
        }
      }
    };

    loadDetail();

    return () => {
      cancelled = true;
    };
  }, [tenantId, configId, sessionLoading, isLoggedIn, userId]);

  const handleDelete = async() => {
    if (!tenantId || !configId) return;

    try {
      setDeleting(true);
      await deletePgConfiguration(tenantId, configId);
      showNotification('PG 설정이 삭제되었습니다.', 'success');
      navigate('/tenant/pg-configurations');
    } catch (err) {
      console.error('PG 설정 삭제 실패:', err);
      showNotification('PG 설정 삭제 중 오류가 발생했습니다.', 'error');
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

  /**
   * 저장: ACTIVE IAMPORT + 시크릿 미입력 → PATCH(채널/테스트모드만).
   * 그 외(시크릿 입력·PENDING 등) → PUT. 공란 시크릿은 PUT body에서 제외.
   *
   * @param {object} payload Form buildSavePayload
   * @returns {Promise<void>}
   */
  const handleSave = async(payload) => {
    if (!tenantId || !configId || !config) {
      showNotification('테넌트 정보를 찾을 수 없습니다.', 'error');
      return;
    }

    const secret = payload?.secretKey != null ? String(payload.secretKey).trim() : '';
    const isIamport = config.pgProvider === PG_PROVIDER_IAMPORT;
    const parsed = parsePortoneSettingsJson(payload?.settingsJson);

    if (isIamport && isActiveLike && !secret) {
      const storeChanged = String(payload?.storeId || '').trim()
        !== String(config.storeId || '').trim();
      const merchantChanged = String(payload?.merchantId || '').trim()
        !== String(config.merchantId || '').trim();
      if (storeChanged || merchantChanged) {
        showNotification('스토어·가맹 변경 시 API 시크릿을 입력하세요.', 'error');
        throw new Error('SECRET_REQUIRED_FOR_FULL_SAVE');
      }
      await updatePortonePgSettings(tenantId, configId, {
        testMode: !!payload.testMode,
        portoneChannelKey: parsed.channelKey || '',
        portoneChannelKeyTest: parsed.channelKeyTest || ''
      });
    } else {
      const putBody = { ...payload };
      if (!secret) {
        delete putBody.secretKey;
        delete putBody.apiKey;
      }
      await updatePgConfiguration(tenantId, configId, putBody);
    }

    const detail = await getPgConfigurationDetail(tenantId, configId);
    setConfig(detail);
  };

  const handleFormLoadingChange = useCallback((next) => {
    setFormSaving(!!next);
  }, []);

  const renderConnectionBadge = (cfg) => {
    if (!cfg) {
      return null;
    }
    if (cfg.approvalStatus === 'REJECTED') {
      return (
        <span className="status-badge status-badge--ship-rejected">
          거부
        </span>
      );
    }
    if (cfg.approvalStatus === 'PENDING') {
      return (
        <span className="status-badge status-badge--ship-pending">
          승인 대기
        </span>
      );
    }
    if (
      cfg.status === 'ACTIVE'
      || cfg.approvalStatus === 'APPROVED'
      || cfg.status === 'APPROVED'
    ) {
      return (
        <span className="status-badge status-badge--ship-active">
          사용중
        </span>
      );
    }
    return (
      <span className="status-badge status-badge--ship-pending">
        승인 대기
      </span>
    );
  };

  if ((sessionLoading && !config) || (loading && !config)) {
    return (
      <AdminCommonLayout
        title={t('admin.labels.pgSettingsDetail')}
        loading
        loadingText={t('common:tenant.PgConfigurationDetail.t_f7022e97')}
      />
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

  const providerSubtitle = config.pgProvider === PG_PROVIDER_IAMPORT
    ? '카드·간편결제 · 승인 후 사용 · 포트원'
    : '카드·간편결제 · 승인 후 사용';

  return (
    <AdminCommonLayout title={t('admin.labels.pgSettingsDetail')}>
      <>
        <ContentArea
          ariaLabel="PG 설정 상세 정보"
          className="mg-v2-pg-config-detail pg-config-detail--clinic-os"
        >
          <nav className="pg-config-detail__crumb" aria-label="경로">
            결제 연결 / <b>상세</b>
          </nav>
          <ContentHeader
            title="결제 연결"
            subtitle={providerSubtitle}
            titleId="pg-config-detail-title"
            actions={
              <div className="mg-v2-pg-config-detail__header-toolbar pg-config-detail__actions-row">
                {renderConnectionBadge(config)}
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
                    목록
                  </MGButton>
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
                    disabled={testingConnection || formSaving}
                    loading={testingConnection}
                    preventDoubleClick={false}
                  >
                    연결 시험
                  </MGButton>
                  <MGButton
                    type="submit"
                    form={PG_DETAIL_FORM_ID}
                    variant="primary"
                    size="small"
                    className={buildErpMgButtonClassName({
                      variant: 'primary',
                      size: 'sm',
                      loading: formSaving,
                      className: 'pg-config-detail__save-cta'
                    })}
                    loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                    disabled={formSaving}
                    loading={formSaving}
                    preventDoubleClick={false}
                  >
                    저장
                  </MGButton>
                  <EntityRowActions
                    ariaLabel="추가 작업"
                    items={[
                      {
                        id: 'delete-pg-config',
                        label: t('admin.actions.delete'),
                        variant: 'destructive',
                        disabled: !isPgConfigDeletable(config),
                        title: isPgConfigDeletable(config)
                          ? undefined
                          : '활성 설정은 비활성화 후 삭제',
                        onClick: isPgConfigDeletable(config)
                          ? () => setShowDeleteModal(true)
                          : undefined
                      }
                    ]}
                  />
                </div>
              </div>
            }
          />
          <main className="pg-config-detail pg-config-detail__body">
            {config.approvalStatus === 'PENDING' && (
              <div className="pg-config-detail__rail" role="status">
                승인 대기 — 저장 후 운영 승인되면 결제를 받을 수 있습니다 · 승인은 별도 화면
              </div>
            )}

            <PgConfigurationForm
              key={`${configId}-${config.updatedAt || config.lastModifiedAt || config.status || 'edit'}`}
              initialData={config}
              onSave={handleSave}
              onCancel={() => navigate('/tenant/pg-configurations')}
              mode="edit"
              hidePageTitle
              hideFooter
              formId={PG_DETAIL_FORM_ID}
              showConnectionMeta
              onLoadingChange={handleFormLoadingChange}
              tenantId={tenantId}
              configId={configId}
            />
          </main>
        </ContentArea>

        <UnifiedModal
          isOpen={Boolean(showDeleteModal && config)}
          onClose={() => setShowDeleteModal(false)}
          title={t('common:tenant.PgConfigurationDetail.t_bb36d807')}
          size="small"
          variant="confirm"
          backdropClick={!deleting}
          loading={deleting}
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
                disabled={deleting}
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
                  loading: deleting
                })}
                loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                onClick={handleDelete}
                disabled={deleting}
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
