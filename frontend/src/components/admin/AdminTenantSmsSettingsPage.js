/**
 * 테넌트 SMS 비시크릿 설정(프로바이더·발신번호·키 참조)
 *
 * @author CoreSolution
 * @since 2026-04-25
 */

import React, { useCallback, useEffect, useId, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminCommonLayout from '../layout/AdminCommonLayout';
import { ContentArea, ContentHeader, ContentSection } from '../dashboard-v2/content';
import UnifiedLoading from '../common/UnifiedLoading';
import MGButton from '../common/MGButton';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../erp/common/erpMgButtonProps';
import SafeErrorDisplay from '../common/SafeErrorDisplay';
import StandardizedApi from '../../utils/standardizedApi';
import { API } from '../../constants/api';
import { USER_ROLES } from '../../constants/roles';
import { useSession } from '../../contexts/SessionContext';
import notificationManager from '../../utils/notification';
import { toDisplayString } from '../../utils/safeDisplay';
import '../../styles/unified-design-tokens.css';
import './AdminDashboard/AdminDashboardB0KlA.css';
import './AdminTenantSmsSettingsPage.css';
import { useTranslation } from 'react-i18next';

const PROVIDER_MAX_LEN = 120;
const SENDER_MAX_LEN = 32;
const REF_MAX_LEN = 200;

const buildInitialForm = () => ({
  smsEnabled: true,
  provider: '',
  senderNumber: '',
  apiKeyRef: '',
  apiSecretRef: ''
});

const mapApiToForm = (data) => {
  if (!data || typeof data !== 'object') {
    return buildInitialForm();
  }
  const base = buildInitialForm();
  return {
    ...base,
    smsEnabled: data.smsEnabled !== false,
    provider: toDisplayString(data.provider, ''),
    senderNumber: toDisplayString(data.senderNumber, ''),
    apiKeyRef: toDisplayString(data.apiKeyRef, ''),
    apiSecretRef: toDisplayString(data.apiSecretRef, '')
  };
};

const AdminTenantSmsSettingsPage = () => {
  const { t } = useTranslation(['settings', 'common']);
  const navigate = useNavigate();
  const { user, isLoggedIn, isLoading: sessionLoading } = useSession();
  const toggleId = useId();
  const pageTitleId = 'admin-tenant-sms-settings-title';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [saveError, setSaveError] = useState(null);
  const [form, setForm] = useState(buildInitialForm);
  const [tenantIdLine, setTenantIdLine] = useState('');

  const allowed = user && (user.role === USER_ROLES.ADMIN || user.role === USER_ROLES.STAFF);

  const loadSettings = useCallback(async() => {
    setLoadError(null);
    setLoading(true);
    try {
      const res = await StandardizedApi.get(API.TENANT_SMS_SETTINGS);
      if (res && res.success === true && res.data) {
        setForm(mapApiToForm(res.data));
        setTenantIdLine(toDisplayString(res.data.tenantId, ''));
      } else {
        setLoadError(t('settings:sms.loadFail'));
      }
    } catch (e) {
      setLoadError(e);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    if (sessionLoading) {
      return;
    }
    if (!isLoggedIn || !user) {
      navigate('/login', { replace: true });
      return;
    }
    if (!allowed) {
      notificationManager.show(t('settings:sms.accessDenied'), 'error');
      navigate('/', { replace: true });
      return;
    }
    loadSettings();
  }, [sessionLoading, isLoggedIn, user, allowed, navigate, loadSettings, t]);

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async(e) => {
    e.preventDefault();
    setSaveError(null);
    setSaving(true);
    try {
      const body = {
        smsEnabled: Boolean(form.smsEnabled),
        provider: form.provider || null,
        senderNumber: form.senderNumber || null,
        apiKeyRef: form.apiKeyRef || null,
        apiSecretRef: form.apiSecretRef || null
      };
      const res = await StandardizedApi.put(API.TENANT_SMS_SETTINGS, body);
      if (res && res.success === true) {
        notificationManager.success(t('settings:sms.saveSuccess'));
        if (res.data) {
          setForm(mapApiToForm(res.data));
          setTenantIdLine(toDisplayString(res.data.tenantId, tenantIdLine));
        }
      } else {
        setSaveError(t('settings:sms.saveFail'));
      }
    } catch (err) {
      setSaveError(err);
    } finally {
      setSaving(false);
    }
  };

  if (sessionLoading || !allowed) {
    return (
      <AdminCommonLayout title={t('settings:sms.title')} className="mg-v2-dashboard-layout">
        <UnifiedLoading text={t('settings:loadingShort')} />
      </AdminCommonLayout>
    );
  }

  return (
    <AdminCommonLayout title={t('settings:sms.title')} className="mg-v2-dashboard-layout">
      <div className="mg-v2-ad-b0kla mg-v2-tenant-sms-settings" data-testid="admin-tenant-sms-settings">
        <ContentArea>
          <ContentHeader
            titleId={pageTitleId}
            title={t('settings:sms.title')}
            subtitle={t('settings:sms.subtitle')}
          />
          {loading ? (
            <UnifiedLoading text={t('settings:sms.loading')} />
          ) : (
            <form className="mg-tenant-sms__form" onSubmit={handleSubmit} noValidate>
              <SafeErrorDisplay error={loadError} />
              <SafeErrorDisplay error={saveError} />

              <ContentSection title={t('settings:sms.section.info')}>
                <p className="mg-tenant-sms__hint">
                  {t('settings:sms.infoHint')}
                </p>
                {tenantIdLine ? (
                  <p className="mg-tenant-sms__readonly-line">
                    {t('settings:sms.tenantIdLabel')} {tenantIdLine}
                  </p>
                ) : null}
              </ContentSection>

              <ContentSection title={t('settings:sms.section.enabled')}>
                <label className="mg-tenant-sms__toggle" htmlFor={toggleId}>
                  <input
                    id={toggleId}
                    type="checkbox"
                    checked={Boolean(form.smsEnabled)}
                    onChange={(ev) => handleChange('smsEnabled', ev.target.checked)}
                  />
                  {t('settings:sms.enabledLabel')}
                </label>
              </ContentSection>

              <ContentSection variant="card" title={t('settings:sms.section.integration')}>
                <div className="mg-tenant-sms__field">
                  <label htmlFor="tenant-sms-provider">{t('settings:sms.fields.provider')}</label>
                  <input
                    id="tenant-sms-provider"
                    className="mg-tenant-sms__input"
                    type="text"
                    maxLength={PROVIDER_MAX_LEN}
                    value={form.provider || ''}
                    onChange={(ev) => handleChange('provider', ev.target.value)}
                    autoComplete="off"
                  />
                </div>
                <div className="mg-tenant-sms__field">
                  <label htmlFor="tenant-sms-sender">{t('settings:sms.fields.senderNumber')}</label>
                  <input
                    id="tenant-sms-sender"
                    className="mg-tenant-sms__input"
                    type="text"
                    maxLength={SENDER_MAX_LEN}
                    value={form.senderNumber || ''}
                    onChange={(ev) => handleChange('senderNumber', ev.target.value)}
                    autoComplete="off"
                  />
                </div>
              </ContentSection>

              <ContentSection title={t('settings:sms.section.refs')}>
                <div className="mg-tenant-sms__field">
                  <label htmlFor="tenant-sms-api-key-ref">{t('settings:sms.fields.apiKeyRef')}</label>
                  <input
                    id="tenant-sms-api-key-ref"
                    className="mg-tenant-sms__input"
                    type="text"
                    maxLength={REF_MAX_LEN}
                    value={form.apiKeyRef || ''}
                    onChange={(ev) => handleChange('apiKeyRef', ev.target.value)}
                    autoComplete="off"
                  />
                </div>
                <div className="mg-tenant-sms__field">
                  <label htmlFor="tenant-sms-api-secret-ref">{t('settings:sms.fields.apiSecretRef')}</label>
                  <input
                    id="tenant-sms-api-secret-ref"
                    className="mg-tenant-sms__input"
                    type="text"
                    maxLength={REF_MAX_LEN}
                    value={form.apiSecretRef || ''}
                    onChange={(ev) => handleChange('apiSecretRef', ev.target.value)}
                    autoComplete="off"
                  />
                </div>
              </ContentSection>

              <div className="mg-tenant-sms__actions">
                <MGButton
                  type="submit"
                  className={buildErpMgButtonClassName({ variant: 'primary' })}
                  disabled={saving}
                  loading={saving}
                  loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                >
                  {t('common:actions.save')}
                </MGButton>
                <MGButton
                  type="button"
                  className={buildErpMgButtonClassName({ variant: 'outline' })}
                  disabled={saving || loading}
                  onClick={() => loadSettings()}
                >
                  {t('settings:sms.reload')}
                </MGButton>
              </div>
            </form>
          )}
        </ContentArea>
      </div>
    </AdminCommonLayout>
  );
};

export default AdminTenantSmsSettingsPage;
