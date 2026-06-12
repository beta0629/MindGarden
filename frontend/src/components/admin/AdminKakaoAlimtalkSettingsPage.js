/**
 * 테넌트 카카오 알림톡 비시크릿 설정 (템플릿 코드·키 참조)
 *
 * @author CoreSolution
 * @since 2026-04-24
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
import { RoleUtils } from '../../constants/roles';
import { useSession } from '../../contexts/SessionContext';
import notificationManager from '../../utils/notification';
import { toDisplayString } from '../../utils/safeDisplay';
import '../../styles/unified-design-tokens.css';
import './AdminDashboard/AdminDashboardB0KlA.css';
import './AdminKakaoAlimtalkSettingsPage.css';
import { useTranslation } from 'react-i18next';

const TEMPLATE_MAX_LEN = 120;
const REF_MAX_LEN = 200;

const TEMPLATE_FIELD_SPECS = [
  { key: 'templateConsultationConfirmed', i18nKey: 'kakao.templates.consultationConfirmed', fallback: '상담 확정' },
  { key: 'templateConsultationReminder', i18nKey: 'kakao.templates.consultationReminder', fallback: '상담 리마인더' },
  { key: 'templateConsultationCancelled', i18nKey: 'kakao.templates.consultationCancelled', fallback: '상담 취소' },
  { key: 'templateRefundCompleted', i18nKey: 'kakao.templates.refundCompleted', fallback: '환불 완료' },
  { key: 'templateScheduleChanged', i18nKey: 'kakao.templates.scheduleChanged', fallback: '일정 변경' },
  { key: 'templatePaymentCompleted', i18nKey: 'kakao.templates.paymentCompleted', fallback: '결제 완료' },
  { key: 'templateDepositPendingReminder', i18nKey: 'kakao.templates.depositPendingReminder', fallback: '입금 대기 리마인더' }
];

const REF_FIELD_SPECS = [
  { key: 'kakaoApiKeyRef', i18nKey: 'kakao.refs.apiKey', fallback: '카카오 API 키 참조(시크릿 저장 금지)' },
  { key: 'kakaoSenderKeyRef', i18nKey: 'kakao.refs.senderKey', fallback: '발신 프로필 키 참조(시크릿 저장 금지)' }
];

const buildInitialForm = () => ({
  alimtalkEnabled: true,
  templateConsultationConfirmed: '',
  templateConsultationReminder: '',
  templateConsultationCancelled: '',
  templateRefundCompleted: '',
  templateScheduleChanged: '',
  templatePaymentCompleted: '',
  templateDepositPendingReminder: '',
  kakaoApiKeyRef: '',
  kakaoSenderKeyRef: ''
});

const mapApiToForm = (data) => {
  if (!data || typeof data !== 'object') {
    return buildInitialForm();
  }
  const base = buildInitialForm();
  return {
    ...base,
    alimtalkEnabled: data.alimtalkEnabled !== false,
    templateConsultationConfirmed: toDisplayString(data.templateConsultationConfirmed, ''),
    templateConsultationReminder: toDisplayString(data.templateConsultationReminder, ''),
    templateConsultationCancelled: toDisplayString(data.templateConsultationCancelled, ''),
    templateRefundCompleted: toDisplayString(data.templateRefundCompleted, ''),
    templateScheduleChanged: toDisplayString(data.templateScheduleChanged, ''),
    templatePaymentCompleted: toDisplayString(data.templatePaymentCompleted, ''),
    templateDepositPendingReminder: toDisplayString(data.templateDepositPendingReminder, ''),
    kakaoApiKeyRef: toDisplayString(data.kakaoApiKeyRef, ''),
    kakaoSenderKeyRef: toDisplayString(data.kakaoSenderKeyRef, '')
  };
};

const AdminKakaoAlimtalkSettingsPage = () => {
  const { t } = useTranslation(['settings', 'common']);
  const navigate = useNavigate();
  const { user, isLoggedIn, isLoading: sessionLoading } = useSession();
  const toggleId = useId();
  const pageTitleId = 'admin-kakao-alimtalk-settings-title';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [saveError, setSaveError] = useState(null);
  const [form, setForm] = useState(buildInitialForm);
  const [tenantIdLine, setTenantIdLine] = useState('');

  const allowed = RoleUtils.isAdmin(user) || RoleUtils.isStaff(user);

  const loadSettings = useCallback(async() => {
    setLoadError(null);
    setLoading(true);
    try {
      const res = await StandardizedApi.get(API.KAKAO_ALIMTALK_SETTINGS);
      if (res && res.success === true && res.data) {
        setForm(mapApiToForm(res.data));
        setTenantIdLine(toDisplayString(res.data.tenantId, ''));
      } else {
        setLoadError(t('settings:kakao.loadFail'));
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
      notificationManager.show(t('settings:kakao.accessDenied'), 'error');
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
        alimtalkEnabled: Boolean(form.alimtalkEnabled),
        templateConsultationConfirmed: form.templateConsultationConfirmed || null,
        templateConsultationReminder: form.templateConsultationReminder || null,
        templateConsultationCancelled: form.templateConsultationCancelled || null,
        templateRefundCompleted: form.templateRefundCompleted || null,
        templateScheduleChanged: form.templateScheduleChanged || null,
        templatePaymentCompleted: form.templatePaymentCompleted || null,
        templateDepositPendingReminder: form.templateDepositPendingReminder || null,
        kakaoApiKeyRef: form.kakaoApiKeyRef || null,
        kakaoSenderKeyRef: form.kakaoSenderKeyRef || null
      };
      const res = await StandardizedApi.put(API.KAKAO_ALIMTALK_SETTINGS, body);
      if (res && res.success === true) {
        notificationManager.success(t('settings:kakao.saveSuccess'));
        if (res.data) {
          setForm(mapApiToForm(res.data));
          setTenantIdLine(toDisplayString(res.data.tenantId, tenantIdLine));
        }
      } else {
        setSaveError(t('settings:kakao.saveFail'));
      }
    } catch (err) {
      setSaveError(err);
    } finally {
      setSaving(false);
    }
  };

  if (sessionLoading || !allowed) {
    return (
      <AdminCommonLayout title={t('settings:kakao.title')} className="mg-v2-dashboard-layout">
        <UnifiedLoading text={t('settings:loadingShort')} />
      </AdminCommonLayout>
    );
  }

  return (
    <AdminCommonLayout title={t('settings:kakao.title')} className="mg-v2-dashboard-layout">
      <div className="mg-v2-ad-b0kla mg-v2-kakao-alimtalk-settings" data-testid="admin-kakao-alimtalk-settings">
        <ContentArea>
          <ContentHeader
            titleId={pageTitleId}
            title={t('settings:kakao.title')}
            subtitle={t('settings:kakao.subtitle')}
          />
          {loading ? (
            <UnifiedLoading text={t('settings:kakao.loading')} />
          ) : (
            <form className="mg-kakao-alimtalk__form" onSubmit={handleSubmit} noValidate>
              <SafeErrorDisplay error={loadError} />
              <SafeErrorDisplay error={saveError} />

              <ContentSection title={t('settings:kakao.section.info')}>
                <p className="mg-kakao-alimtalk__hint">
                  {t('settings:kakao.infoHint')}
                </p>
                {tenantIdLine ? (
                  <p className="mg-kakao-alimtalk__readonly-line">
                    {t('settings:kakao.tenantIdLabel')} {tenantIdLine}
                  </p>
                ) : null}
              </ContentSection>

              <ContentSection title={t('settings:kakao.section.enabled')}>
                <label className="mg-kakao-alimtalk__toggle" htmlFor={toggleId}>
                  <input
                    id={toggleId}
                    type="checkbox"
                    checked={Boolean(form.alimtalkEnabled)}
                    onChange={(ev) => handleChange('alimtalkEnabled', ev.target.checked)}
                  />
                  {t('settings:kakao.enabledLabel')}
                </label>
              </ContentSection>

              <ContentSection variant="card" title={t('settings:kakao.section.templates')}>
                {TEMPLATE_FIELD_SPECS.map((spec) => (
                  <div key={spec.key} className="mg-kakao-alimtalk__field">
                    <label htmlFor={`kakao-field-${spec.key}`}>{t(`settings:${spec.i18nKey}`, spec.fallback)}</label>
                    <input
                      id={`kakao-field-${spec.key}`}
                      className="mg-kakao-alimtalk__input"
                      type="text"
                      maxLength={TEMPLATE_MAX_LEN}
                      value={form[spec.key] || ''}
                      onChange={(ev) => handleChange(spec.key, ev.target.value)}
                      autoComplete="off"
                    />
                  </div>
                ))}
              </ContentSection>

              <ContentSection title={t('settings:kakao.section.refs')}>
                {REF_FIELD_SPECS.map((spec) => (
                  <div key={spec.key} className="mg-kakao-alimtalk__field">
                    <label htmlFor={`kakao-ref-${spec.key}`}>{t(`settings:${spec.i18nKey}`, spec.fallback)}</label>
                    <input
                      id={`kakao-ref-${spec.key}`}
                      className="mg-kakao-alimtalk__input"
                      type="text"
                      maxLength={REF_MAX_LEN}
                      value={form[spec.key] || ''}
                      onChange={(ev) => handleChange(spec.key, ev.target.value)}
                      autoComplete="off"
                    />
                  </div>
                ))}
              </ContentSection>

              <div className="mg-kakao-alimtalk__actions">
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
                  {t('settings:kakao.reload')}
                </MGButton>
              </div>
            </form>
          )}
        </ContentArea>
      </div>
    </AdminCommonLayout>
  );
};

export default AdminKakaoAlimtalkSettingsPage;
