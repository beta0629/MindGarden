/**
 * 테넌트 SMS 비시크릿 설정(프로바이더·발신번호·키 참조)
 *
 * @author CoreSolution
 * @since 2026-04-25
 */

import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminCommonLayout from '../layout/AdminCommonLayout';
import { ContentArea, ContentHeader, ContentSection } from '../dashboard-v2/content';
import UnifiedLoading from '../common/UnifiedLoading';
import MGButton from '../common/MGButton';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../erp/common/erpMgButtonProps';
import SafeErrorDisplay from '../common/SafeErrorDisplay';
import SettingSwitchRow from '../common/molecules/SettingSwitchRow';
import StandardizedApi from '../../utils/standardizedApi';
import { API } from '../../constants/api';
import { RoleUtils } from '../../constants/roles';
import { useSession } from '../../contexts/SessionContext';
import { useConfirm, useSettingToggleSave } from '../../hooks';
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

/** PUT 본문 — 확정 스냅샷 텍스트 + 지정 boolean (dirty 폼 텍스트 제외) */
const buildSmsPutBodyFromCommitted = (committed, smsEnabled) => ({
  smsEnabled: Boolean(smsEnabled),
  provider: committed.provider || null,
  senderNumber: committed.senderNumber || null,
  apiKeyRef: committed.apiKeyRef || null,
  apiSecretRef: committed.apiSecretRef || null
});

const AdminTenantSmsSettingsPage = () => {
  const { t } = useTranslation(['settings', 'common']);
  const navigate = useNavigate();
  const { user, isLoggedIn, isLoading: sessionLoading } = useSession();
  const toggleId = useId();
  const pageTitleId = 'admin-tenant-sms-settings-title';
  const [confirmEnable, ConfirmEnableModal] = useConfirm({ variant: 'warning' });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [saveError, setSaveError] = useState(null);
  const [form, setForm] = useState(buildInitialForm);
  const [tenantIdLine, setTenantIdLine] = useState('');
  /** 마지막 로드·저장 확정값 — 토글 PUT 시 dirty 텍스트 미포함 */
  const committedRef = useRef(buildInitialForm());

  const allowed = RoleUtils.isAdmin(user) || RoleUtils.isStaff(user);

  const loadSettings = useCallback(async() => {
    setLoadError(null);
    setLoading(true);
    try {
      const res = await StandardizedApi.get(API.TENANT_SMS_SETTINGS);
      if (res && res.success === true && res.data) {
        const mapped = mapApiToForm(res.data);
        committedRef.current = mapped;
        setForm(mapped);
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

  const saveSmsEnabled = useCallback(async(next) => {
    const body = buildSmsPutBodyFromCommitted(committedRef.current, next);
    const res = await StandardizedApi.put(API.TENANT_SMS_SETTINGS, body);
    if (!(res && res.success === true)) {
      throw new Error(t('settings:sms.toggleSaveFail'));
    }
    if (res.data) {
      const serverForm = mapApiToForm(res.data);
      committedRef.current = serverForm;
      setForm((prev) => ({
        ...prev,
        smsEnabled: serverForm.smsEnabled
      }));
      setTenantIdLine(toDisplayString(res.data.tenantId, tenantIdLine));
    } else {
      committedRef.current = {
        ...committedRef.current,
        smsEnabled: Boolean(next)
      };
    }
  }, [t, tenantIdLine]);

  const confirmSmsEnable = useCallback(async({ next }) => {
    if (!next) {
      return true;
    }
    return confirmEnable({
      message: t('settings:sms.confirmEnableOn')
    });
  }, [confirmEnable, t]);

  const {
    busy: smsEnabledBusy,
    disabled: smsEnabledDisabled,
    onCheckedChange: onSmsEnabledCheckedChange
  } = useSettingToggleSave({
    value: Boolean(form.smsEnabled),
    onValueChange: (next) => setForm((prev) => ({ ...prev, smsEnabled: next })),
    save: saveSmsEnabled,
    requireConfirm: (next) => next === true,
    confirm: confirmSmsEnable,
    optimistic: true,
    onSuccess: () => {
      notificationManager.success(t('settings:sms.toggleSaveSuccess'));
    },
    onError: (error) => {
      const msg = error?.message != null
        ? toDisplayString(error.message, t('settings:sms.toggleSaveFail'))
        : t('settings:sms.toggleSaveFail');
      notificationManager.show(msg, 'error');
    }
  });

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
          const mapped = mapApiToForm(res.data);
          committedRef.current = mapped;
          setForm(mapped);
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
                <SettingSwitchRow
                  id={toggleId}
                  label={t('settings:sms.enabledLabel')}
                  hint={t('settings:sms.toggleImmediateHint')}
                  statusLabel={form.smsEnabled
                    ? t('common:label.on')
                    : t('common:label.off')}
                  checked={Boolean(form.smsEnabled)}
                  onCheckedChange={onSmsEnabledCheckedChange}
                  disabled={smsEnabledDisabled || saving}
                  isPending={smsEnabledBusy}
                  ariaLabel={t('settings:sms.enabledLabel')}
                />
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
                  disabled={saving || smsEnabledBusy}
                  loading={saving}
                  loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                >
                  {t('common:actions.save')}
                </MGButton>
                <MGButton
                  type="button"
                  className={buildErpMgButtonClassName({ variant: 'outline' })}
                  disabled={saving || loading || smsEnabledBusy}
                  onClick={() => loadSettings()}
                >
                  {t('settings:sms.reload')}
                </MGButton>
              </div>
            </form>
          )}
        </ContentArea>
      </div>
      <ConfirmEnableModal />
    </AdminCommonLayout>
  );
};

export default AdminTenantSmsSettingsPage;
