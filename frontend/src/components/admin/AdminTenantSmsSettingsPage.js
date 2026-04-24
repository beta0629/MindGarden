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
        setLoadError('설정을 불러오지 못했습니다.');
      }
    } catch (e) {
      setLoadError(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (sessionLoading) {
      return;
    }
    if (!isLoggedIn || !user) {
      navigate('/login', { replace: true });
      return;
    }
    if (!allowed) {
      notificationManager.show('접근 권한이 없습니다.', 'error');
      navigate('/', { replace: true });
      return;
    }
    loadSettings();
  }, [sessionLoading, isLoggedIn, user, allowed, navigate, loadSettings]);

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
        notificationManager.success('문자 메시지(SMS) 설정을 저장했습니다.');
        if (res.data) {
          setForm(mapApiToForm(res.data));
          setTenantIdLine(toDisplayString(res.data.tenantId, tenantIdLine));
        }
      } else {
        setSaveError('저장에 실패했습니다.');
      }
    } catch (err) {
      setSaveError(err);
    } finally {
      setSaving(false);
    }
  };

  if (sessionLoading || !allowed) {
    return (
      <AdminCommonLayout title="문자 메시지(SMS)" className="mg-v2-dashboard-layout">
        <UnifiedLoading text="로딩 중..." />
      </AdminCommonLayout>
    );
  }

  return (
    <AdminCommonLayout title="문자 메시지(SMS)" className="mg-v2-dashboard-layout">
      <div className="mg-v2-ad-b0kla mg-v2-tenant-sms-settings" data-testid="admin-tenant-sms-settings">
        <ContentArea>
          <ContentHeader
            titleId={pageTitleId}
            title="문자 메시지(SMS)"
            subtitle="테넌트별 비시크릿 설정만 저장합니다. API 키·시크릿 본문은 넣지 말고 참조 식별자만 등록하세요."
          />
          {loading ? (
            <UnifiedLoading text="설정을 불러오는 중..." />
          ) : (
            <form className="mg-tenant-sms__form" onSubmit={handleSubmit} noValidate>
              <SafeErrorDisplay error={loadError} />
              <SafeErrorDisplay error={saveError} />

              <ContentSection title="안내">
                <p className="mg-tenant-sms__hint">
                  발송 시 참조 문자열이 있으면 Spring 설정·환경 변수에서 값을 조회하고, 없으면 애플리케이션 기본
                  sms.auth 설정을 사용합니다.
                </p>
                {tenantIdLine ? (
                  <p className="mg-tenant-sms__readonly-line">
                    테넌트 ID: {tenantIdLine}
                  </p>
                ) : null}
              </ContentSection>

              <ContentSection title="SMS 사용">
                <label className="mg-tenant-sms__toggle" htmlFor={toggleId}>
                  <input
                    id={toggleId}
                    type="checkbox"
                    checked={Boolean(form.smsEnabled)}
                    onChange={(ev) => handleChange('smsEnabled', ev.target.checked)}
                  />
                  이 테넌트에서 SMS 발송 사용
                </label>
              </ContentSection>

              <ContentSection variant="card" title="연동">
                <div className="mg-tenant-sms__field">
                  <label htmlFor="tenant-sms-provider">프로바이더</label>
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
                  <label htmlFor="tenant-sms-sender">발신 번호</label>
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

              <ContentSection title="키 참조">
                <div className="mg-tenant-sms__field">
                  <label htmlFor="tenant-sms-api-key-ref">API 키 참조(시크릿 저장 금지)</label>
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
                  <label htmlFor="tenant-sms-api-secret-ref">API 시크릿 참조(시크릿 저장 금지)</label>
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
                  저장
                </MGButton>
                <MGButton
                  type="button"
                  className={buildErpMgButtonClassName({ variant: 'outline' })}
                  disabled={saving || loading}
                  onClick={() => loadSettings()}
                >
                  다시 불러오기
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
