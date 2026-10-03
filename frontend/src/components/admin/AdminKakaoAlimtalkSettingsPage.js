/**
 * 테넌트 카카오 알림톡 비시크릿 설정 (템플릿 코드·키 참조)
 *
 * @author CoreSolution
 * @since 2026-04-24
 */

import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminCommonLayout from '../layout/AdminCommonLayout';
import { SettingsButton, SettingsPageShell, SettingsSectionPanel } from './settings-shell';
import SafeErrorDisplay from '../common/SafeErrorDisplay';
import SettingSwitchRow from '../common/molecules/SettingSwitchRow';
import StandardizedApi from '../../utils/standardizedApi';
import { API } from '../../constants/api';
import { RoleUtils } from '../../constants/roles';
import { useSession } from '../../contexts/SessionContext';
import { useConfirm, useSettingToggleSave } from '../../hooks';
import notificationManager from '../../utils/notification';
import { isApiMutationSuccess, resolveApiObjectData } from '../../utils/apiResponseNormalize';
import { toDisplayString } from '../../utils/safeDisplay';
import { runResourceLoad, softRefresh } from '../../utils/softRefresh';
import '../../styles/unified-design-tokens.css';
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

/** PUT 본문 — 확정 스냅샷 텍스트 + 지정 boolean (dirty 폼 텍스트 제외) */
const buildAlimtalkPutBodyFromCommitted = (committed, alimtalkEnabled) => ({
  alimtalkEnabled: Boolean(alimtalkEnabled),
  templateConsultationConfirmed: committed.templateConsultationConfirmed || null,
  templateConsultationReminder: committed.templateConsultationReminder || null,
  templateConsultationCancelled: committed.templateConsultationCancelled || null,
  templateRefundCompleted: committed.templateRefundCompleted || null,
  templateScheduleChanged: committed.templateScheduleChanged || null,
  templatePaymentCompleted: committed.templatePaymentCompleted || null,
  templateDepositPendingReminder: committed.templateDepositPendingReminder || null,
  kakaoApiKeyRef: committed.kakaoApiKeyRef || null,
  kakaoSenderKeyRef: committed.kakaoSenderKeyRef || null
});

const AdminKakaoAlimtalkSettingsPage = () => {
  const { t } = useTranslation(['settings', 'common']);
  const navigate = useNavigate();
  const { user, isLoggedIn, isLoading: sessionLoading } = useSession();
  const toggleId = useId();
  const pageTitleId = 'admin-kakao-alimtalk-settings-title';
  const [confirmEnable, ConfirmEnableModal] = useConfirm({ variant: 'warning' });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [saveError, setSaveError] = useState(null);
  const [form, setForm] = useState(buildInitialForm);
  const [tenantIdLine, setTenantIdLine] = useState('');
  /** 서버 값 로드 성공 여부 — 실패 시 빈 폼으로 저장값을 덮어쓰지 않도록 저장·토글 차단 */
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  /** 마지막 로드·저장 확정값 — 토글 PUT 시 dirty 텍스트 미포함 */
  const committedRef = useRef(buildInitialForm());

  const allowed = RoleUtils.isAdmin(user) || RoleUtils.isStaff(user);

  /**
   * @param {{ silent?: boolean }} [options] silent=true 이면 AdminCommonLayout loading 미사용
   */
  const loadSettings = useCallback(async(options = {}) => {
    setLoadError(null);
    try {
      await runResourceLoad(options, setLoading, async() => {
        const res = await StandardizedApi.get(API.KAKAO_ALIMTALK_SETTINGS);
        const data = resolveApiObjectData(res);
        if (data) {
          const mapped = mapApiToForm(data);
          committedRef.current = mapped;
          setForm(mapped);
          setTenantIdLine(toDisplayString(data.tenantId, ''));
          setSettingsLoaded(true);
        } else {
          setSettingsLoaded(false);
          setLoadError(t('settings:kakao.loadFail'));
        }
      });
    } catch (e) {
      setSettingsLoaded(false);
      setLoadError(e);
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
  }, [sessionLoading, isLoggedIn, user?.id, allowed, navigate, loadSettings, t]);

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const saveAlimtalkEnabled = useCallback(async(next) => {
    const body = buildAlimtalkPutBodyFromCommitted(committedRef.current, next);
    const res = await StandardizedApi.put(API.KAKAO_ALIMTALK_SETTINGS, body);
    if (!isApiMutationSuccess(res)) {
      throw new Error(t('settings:kakao.toggleSaveFail'));
    }
    const saved = resolveApiObjectData(res);
    if (saved) {
      const serverForm = mapApiToForm(saved);
      committedRef.current = serverForm;
      setForm((prev) => ({
        ...prev,
        alimtalkEnabled: serverForm.alimtalkEnabled
      }));
      setTenantIdLine(toDisplayString(saved.tenantId, tenantIdLine));
    } else {
      committedRef.current = {
        ...committedRef.current,
        alimtalkEnabled: Boolean(next)
      };
    }
  }, [t, tenantIdLine]);

  const confirmAlimtalkEnable = useCallback(async({ next }) => {
    if (!next) {
      return true;
    }
    return confirmEnable({
      message: t('settings:kakao.confirmEnableOn')
    });
  }, [confirmEnable, t]);

  const {
    busy: alimtalkBusy,
    disabled: alimtalkDisabled,
    onCheckedChange: onAlimtalkCheckedChange
  } = useSettingToggleSave({
    value: Boolean(form.alimtalkEnabled),
    onValueChange: (next) => setForm((prev) => ({ ...prev, alimtalkEnabled: next })),
    save: saveAlimtalkEnabled,
    requireConfirm: (next) => next === true,
    confirm: confirmAlimtalkEnable,
    optimistic: true,
    onSuccess: () => {
      notificationManager.success(t('settings:kakao.toggleSaveSuccess'));
    },
    onError: (error) => {
      const msg = error?.message != null
        ? toDisplayString(error.message, t('settings:kakao.toggleSaveFail'))
        : t('settings:kakao.toggleSaveFail');
      notificationManager.show(msg, 'error');
    }
  });

  const handleSubmit = async(e) => {
    e.preventDefault();
    if (!settingsLoaded) {
      return;
    }
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
      if (isApiMutationSuccess(res)) {
        notificationManager.success(t('settings:kakao.saveSuccess'));
        const saved = resolveApiObjectData(res);
        if (saved) {
          const mapped = mapApiToForm(saved);
          committedRef.current = mapped;
          setForm(mapped);
          setTenantIdLine(toDisplayString(saved.tenantId, tenantIdLine));
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
      <AdminCommonLayout
        title={t('settings:kakao.title')}
        className="mg-v2-dashboard-layout"
        loading
        loadingText={t('settings:loadingShort')}
      />
    );
  }

  return (
    <AdminCommonLayout
      title={t('settings:kakao.title')}
      className="mg-v2-dashboard-layout"
      loading={loading && !tenantIdLine}
      loadingText={t('settings:kakao.loading')}
    >
      <SettingsPageShell
        title={t('settings:kakao.title')}
        titleId={pageTitleId}
        className="mg-v2-kakao-alimtalk-settings"
      >
        <form
          className="mg-kakao-alimtalk__form"
          onSubmit={handleSubmit}
          noValidate
          data-testid="admin-kakao-alimtalk-settings"
        >
          <SafeErrorDisplay error={loadError} />
          <SafeErrorDisplay error={saveError} />

          <SettingsSectionPanel title={t('settings:kakao.section.info')} body="plain">
            <p className="mg-v2-settings-muted">
              {t('settings:kakao.infoHint')}
            </p>
            {tenantIdLine ? (
              <p className="mg-kakao-alimtalk__readonly-line">
                {t('settings:kakao.tenantIdLabel')} {tenantIdLine}
              </p>
            ) : null}
          </SettingsSectionPanel>

          <SettingsSectionPanel title={t('settings:kakao.section.enabled')}>
            <SettingSwitchRow
              id={toggleId}
              label={t('settings:kakao.enabledLabel')}
              hint={t('settings:kakao.toggleImmediateHint')}
              statusLabel={form.alimtalkEnabled
                ? t('common:label.on')
                : t('common:label.off')}
              checked={Boolean(form.alimtalkEnabled)}
              onCheckedChange={onAlimtalkCheckedChange}
              disabled={alimtalkDisabled || saving || !settingsLoaded}
              isPending={alimtalkBusy}
              ariaLabel={t('settings:kakao.enabledLabel')}
            />
          </SettingsSectionPanel>

          <SettingsSectionPanel title={t('settings:kakao.section.templates')}>
            <div className="mg-v2-settings-form-grid">
              {TEMPLATE_FIELD_SPECS.map((spec) => (
                <div key={spec.key} className="mg-v2-settings-field">
                  <label className="mg-v2-form-label" htmlFor={`kakao-field-${spec.key}`}>
                    {t(`settings:${spec.i18nKey}`, spec.fallback)}
                  </label>
                  <input
                    id={`kakao-field-${spec.key}`}
                    className="mg-v2-form-input"
                    type="text"
                    maxLength={TEMPLATE_MAX_LEN}
                    value={form[spec.key] || ''}
                    onChange={(ev) => handleChange(spec.key, ev.target.value)}
                    autoComplete="off"
                  />
                </div>
              ))}
            </div>
          </SettingsSectionPanel>

          <SettingsSectionPanel title={t('settings:kakao.section.refs')}>
            <div className="mg-v2-settings-form-grid">
              {REF_FIELD_SPECS.map((spec) => (
                <div key={spec.key} className="mg-v2-settings-field">
                  <label className="mg-v2-form-label" htmlFor={`kakao-ref-${spec.key}`}>
                    {t(`settings:${spec.i18nKey}`, spec.fallback)}
                  </label>
                  <input
                    id={`kakao-ref-${spec.key}`}
                    className="mg-v2-form-input"
                    type="text"
                    maxLength={REF_MAX_LEN}
                    value={form[spec.key] || ''}
                    onChange={(ev) => handleChange(spec.key, ev.target.value)}
                    autoComplete="off"
                  />
                </div>
              ))}
            </div>
          </SettingsSectionPanel>

          <div className="mg-v2-settings-actions">
            <SettingsButton
              variant="ghost"
              type="button"
              preventDoubleClick
              disabled={saving || loading || alimtalkBusy}
              onClick={() => softRefresh(loadSettings)}
            >
              {t('settings:kakao.reload')}
            </SettingsButton>
            <SettingsButton
              variant="primary"
              type="submit"
              disabled={saving || alimtalkBusy || !settingsLoaded}
              loading={saving}
            >
              {t('settings:kakao.action.saveTemplatesAndRefs')}
            </SettingsButton>
          </div>
        </form>
      </SettingsPageShell>
      <ConfirmEnableModal />
    </AdminCommonLayout>
  );
};

export default AdminKakaoAlimtalkSettingsPage;
