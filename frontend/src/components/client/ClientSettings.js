import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import AdminCommonLayout from '../layout/AdminCommonLayout';
import ContentArea from '../dashboard-v2/content/ContentArea';
import ContentHeader from '../dashboard-v2/content/ContentHeader';
import MGButton from '../common/MGButton';
import { buildErpMgButtonClassName } from '../erp/common/erpMgButtonProps';
import { useSession } from '../../contexts/SessionContext';
import StandardizedApi from '../../utils/standardizedApi';
import notificationManager from '../../utils/notification';
import UnifiedLoading from '../../components/common/UnifiedLoading';
import '../../styles/unified-design-tokens.css';
import '../admin/AdminDashboard/AdminDashboardB0KlA.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './ClientSettings.css';

const CLIENT_SETTINGS_TITLE_ID = 'client-settings-page-title';

const ClientSettings = () => {
  const { t } = useTranslation(['settings']);
  const { user } = useSession();
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({
    notifications: true,
    emailNotifications: true,
    smsNotifications: false,
    privacyMode: false,
    maxConcurrentSessions: 1
  });
  const [message, setMessage] = useState(null);

  useEffect(() => {
    if (user?.id) {
      loadSettings();
    }
  }, [user?.id]);

  const loadSettings = async() => {
    try {
      const response = await StandardizedApi.get(`/api/clients/${user.id}/settings`);
      if (response.success && response.data) {
        setSettings(prev => ({ ...prev, ...response.data }));
      }
    } catch (error) {
      console.error(t('settings:status.loadFail', '설정 로드 실패'), error);
    } finally {
      setLoading(false);
    }
  };

  const pageShell = (body) => (
    <div className="mg-v2-ad-b0kla" data-testid="client-settings-page">
      <div className="mg-v2-ad-b0kla__container">
        <ContentArea ariaLabel={t('settings:client.pageArea', '내담자 설정')}>
          <ContentHeader
            title={t('settings:client.title', '계정 설정')}
            subtitle={t('settings:client.subtitle', '개인정보 및 알림 설정을 관리할 수 있습니다.')}
            titleId={CLIENT_SETTINGS_TITLE_ID}
          />
          <main aria-labelledby={CLIENT_SETTINGS_TITLE_ID}>
            {body}
          </main>
        </ContentArea>
      </div>
    </div>
  );

  const handleSettingChange = async(key, value) => {
    try {
      const newSettings = { ...settings, [key]: value };
      const response = await StandardizedApi.post(`/api/clients/${user.id}/settings`, newSettings);
      
      if (response.success) {
        setSettings(newSettings);
        setMessage(t('settings:status.saveSuccess', '설정이 저장되었습니다.'));
        setTimeout(() => setMessage(null), 3000);
      } else {
        notificationManager.error(t('settings:status.saveFail', '설정 저장 실패'), response.message || t('settings:status.cannotSave', '설정을 저장할 수 없습니다.'));
      }
    } catch (error) {
      console.error(t('settings:status.saveFail', '설정 저장 실패'), error);
      notificationManager.error(t('common.status.error', '오류'), t('settings:status.saveError', '설정 저장 중 오류가 발생했습니다.'));
    }
  };

  if (loading) {
    return (
      <AdminCommonLayout title={t('settings:page.title', '설정')} className="mg-v2-dashboard-layout">
        {pageShell(
          <div aria-busy="true" aria-live="polite">
            <UnifiedLoading type="inline" text={t('common.status.loading', '로딩중...')} />
          </div>
        )}
      </AdminCommonLayout>
    );
  }

  return (
    <AdminCommonLayout title={t('settings:page.title', '설정')} className="mg-v2-dashboard-layout">
      {pageShell(
      <div className="client-settings-container">
        <div className="client-settings-card">
          {message && (
            <div className="client-settings-message">
              <i className="bi bi-check-circle" /> {message}
            </div>
          )}

          <div className="client-settings-content">
            {/* 알림 설정 */}
            <div className="client-settings-section">
              <h3 className="client-settings-section-title">
                <i className="bi bi-bell" />
                {t('settings:notification.title', '알림 설정')}
              </h3>
              
              <div className="client-settings-options">
                <div className="client-settings-option">
                  <div>
                    <h4>{t('settings:notification.all.label', '전체 알림')}</h4>
                    <p>{t('settings:notification.all.description', '모든 알림을 받습니다')}</p>
                  </div>
                  <div className="form-check form-switch">
                    <input
                      className="form-check-input client-settings-switch"
                      type="checkbox"
                      checked={settings.notifications}
                      onChange={(e) => handleSettingChange('notifications', e.target.checked)}
                    />
                  </div>
                </div>

                <div className="client-settings-option">
                  <div>
                    <h4>{t('settings:notification.email.label', '이메일 알림')}</h4>
                    <p>{t('settings:notification.email.descriptionShort', '이메일로 알림을 받습니다')}</p>
                  </div>
                  <div className="form-check form-switch">
                    <input
                      className="form-check-input client-settings-switch"
                      type="checkbox"
                      checked={settings.emailNotifications}
                      onChange={(e) => handleSettingChange('emailNotifications', e.target.checked)}
                    />
                  </div>
                </div>

                <div className="client-settings-option">
                  <div>
                    <h4>{t('settings:notification.sms.label', 'SMS 알림')}</h4>
                    <p>{t('settings:notification.sms.descriptionShort', 'SMS로 알림을 받습니다')}</p>
                  </div>
                  <div className="form-check form-switch">
                    <input
                      className="form-check-input client-settings-switch"
                      type="checkbox"
                      checked={settings.smsNotifications}
                      onChange={(e) => handleSettingChange('smsNotifications', e.target.checked)}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 프라이버시 설정 */}
            <div className="client-settings-section">
              <h3 className="client-settings-section-title">
                <i className="bi bi-shield-check" />
                {t('settings:privacy.title', '프라이버시')}
              </h3>
              
              <div className="client-settings-options">
                <div className="client-settings-option">
                  <div>
                    <h4>{t('settings:privacy.mode.label', '프라이버시 모드')}</h4>
                    <p>{t('settings:privacy.mode.description', '개인정보를 더 안전하게 보호합니다')}</p>
                  </div>
                  <div className="form-check form-switch">
                    <input
                      className="form-check-input client-settings-switch"
                      type="checkbox"
                      checked={settings.privacyMode}
                      onChange={(e) => handleSettingChange('privacyMode', e.target.checked)}
                    />
                  </div>
                </div>

                <div className="client-settings-option">
                  <label>{t('settings:session.concurrentLimit', '동시 상담 제한')}</label>
                  <select
                    className="client-settings-select"
                    value={settings.maxConcurrentSessions}
                    onChange={(e) => handleSettingChange('maxConcurrentSessions', parseInt(e.target.value))}
                  >
                    <option value={1}>{t('settings:option.sessionCount1', '1개')}</option>
                    <option value={2}>{t('settings:option.sessionCount2', '2개')}</option>
                    <option value={3}>{t('settings:option.sessionCount3', '3개')}</option>
                  </select>
                </div>
              </div>
            </div>

            {/* 저장 버튼 */}
            <div className="client-settings-footer">
              <MGButton
                variant="primary"
                className={`${buildErpMgButtonClassName({ variant: 'primary', loading: false })} client-settings-save-btn`}
                onClick={() => setMessage(t('settings:status.saveSuccess', '설정이 저장되었습니다.'))}
                preventDoubleClick={false}
              >
                {t('settings:action.save', '설정 저장')}
              </MGButton>
            </div>
          </div>
        </div>
      </div>
      )}
    </AdminCommonLayout>
  );
};

export default ClientSettings;
