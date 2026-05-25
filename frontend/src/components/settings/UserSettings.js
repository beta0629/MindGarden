/**
 * 사용자 설정 페이지
/**
 * 테마 설정과 기타 사용자 설정을 관리하는 페이지
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { useTheme } from '../../hooks/useTheme';
import SimpleLayout from '../layout/SimpleLayout';
import MGButton from '../common/MGButton';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../erp/common/erpMgButtonProps';
import Card from '../ui/Card/Card';
import CardContent from '../ui/Card/CardContent';
import CardHeader from '../ui/Card/CardHeader';
import Icon from '../ui/Icon/Icon';
import ThemeSelector from '../ui/ThemeSelector/ThemeSelector';
import SafeText from '../common/SafeText';
import './UserSettings.css';
import { useTranslation } from 'react-i18next';

const UserSettings = ({ user, onSettingsUpdate }) => {
    const { t } = useTranslation(['settings', 'common']); const {
    currentTheme,
    changeToTheme,
    applyCustomTheme,
    resetToDefault,
    isLoading,
    error,
    themeColors } = useTheme();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState('theme');
  const [showThemeSelector, setShowThemeSelector] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState({ emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    marketingEmails: false });

  // 사용자 정보가 변경되면 설정 업데이트
  useEffect(() => {if (user) {// 알림 설정 로드 (실제로는 API에서 가져와야 함)
      setNotificationSettings({ emailNotifications: user.emailNotifications ?? true,
        pushNotifications: user.pushNotifications ?? true,
        smsNotifications: user.smsNotifications ?? false,
        marketingEmails: user.marketingEmails ?? false });}}, [user]);

  const handleThemeChange = async(newTheme) => {try {const result = await changeToTheme(newTheme.type);
      if (result.success) {onSettingsUpdate?.({ theme: newTheme });
        setShowThemeSelector(false);}} catch (err) {console.error(t('settings:theme.change'), err);}};

  const handleCustomThemeApply = async(baseThemeType, customColors) => {try {const result = await applyCustomTheme(baseThemeType, customColors);
      if (result.success) {onSettingsUpdate?.({ theme: result.theme });
        setShowThemeSelector(false);}} catch (err) {console.error(t('settings:status.saveFail'), err);}};

  const handleThemeReset = async() => {try {const result = await resetToDefault();
      if (result.success) {onSettingsUpdate?.({ theme: result.theme });}} catch (err) {console.error(t('settings:theme.resetToDefault'), err);}};

  // 알림 설정 변경 핸들러
  const handleNotificationChange = (setting, value) => {const newSettings = { ...notificationSettings, [setting]: value };
    setNotificationSettings(newSettings);
    onSettingsUpdate?.({ notifications: newSettings });};

  // 탭 렌더링
  const renderTabContent = () => {switch (activeTab) {case 'theme':
        return (<div className="mg-v2-v2-v2-theme-settings">
            <div className="mg-v2-v2-v2-current-theme-display">
              <Card variant="gradient">
                <CardContent>
                  <div className="mg-v2-v2-v2-flex mg-v2-v2-v2-items-center mg-v2-v2-v2-gap-md">
                    <div 
                      className="mg-v2-v2-v2-theme-preview-circle"
                      data-theme-color={themeColors.primary}
                    />
                    <div>
                      <SafeText tag="h3" className="mg-v2-v2-v2-h3 mg-v2-v2-v2-text-primary">
                        {currentTheme?.name}
                      </SafeText>
                      <SafeText tag="p" className="mg-v2-v2-v2-text-muted">
                        {currentTheme?.description}
                      </SafeText>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="mg-v2-v2-v2-theme-actions">
                <MGButton
                  variant="primary"
                  className={buildErpMgButtonClassName({
                    variant: 'primary',
                    size: 'md',
                    loading: false
                  })}
                  loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                  onClick={() => setShowThemeSelector(true)}
                >
                  <Icon name="PALETTE" size="LG" color="PRIMARY" />
                  {t('settings:theme.change')}
                </MGButton>
                <MGButton
                  variant="outline"
                  className={buildErpMgButtonClassName({
                    variant: 'outline',
                    size: 'md',
                    loading: isLoading
                  })}
                  loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                  onClick={handleThemeReset}
                  loading={isLoading}
                >
                  <Icon name="REFRESH_CW" size="LG" color="PRIMARY" />
                  {t('settings:theme.resetToDefault')}
                </MGButton>
              </div>
            </div>

            {showThemeSelector && (<div className="mg-v2-v2-v2-theme-selector-modal">
                <Card variant="default">
                  <CardHeader>
                    <div className="mg-v2-v2-v2-flex mg-v2-v2-v2-items-center mg-v2-v2-v2-justify-between">
                      <h3 className="mg-v2-v2-v2-h3 mg-v2-v2-v2-text-primary">{t('settings:theme.select')}</h3>
                      <MGButton
                        variant="outline"
                        size="small"
                        className={buildErpMgButtonClassName({ variant: 'outline', size: 'sm', loading: false })}
                        loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                        onClick={() => setShowThemeSelector(false)}
                        title={t('common.actions.close')}
                        aria-label={t('common.actions.close')}
                      >
                        <Icon name="X" size="SM" />
                      </MGButton>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ThemeSelector
                      onThemeChange={handleThemeChange}
                      showPreview={true}
                      showCustomColors={true}
                    />
                  </CardContent>
                </Card>
              </div>)}
          </div>);

      case 'notifications':
        return (<div className="mg-v2-v2-v2-notification-settings">
            <Card variant="default">
              <CardContent>
                <h3 className="mg-v2-v2-v2-h3 mg-v2-v2-v2-text-primary mg-v2-v2-v2-mb-lg">{t('settings:notification.title')}</h3>
                
                <div className="mg-v2-v2-v2-setting-item">
                  <div className="mg-v2-v2-v2-flex mg-v2-v2-v2-items-center mg-v2-v2-v2-justify-between">
                    <div>
                      <h4 className="mg-v2-v2-v2-h4 mg-v2-v2-v2-text-primary">{t('settings:notification.email.label')}</h4>
                      <p className="mg-v2-v2-v2-text-sm mg-v2-v2-v2-text-muted">{t('settings:notification.email.description')}</p>
                    </div>
                    <label className="mg-v2-v2-v2-toggle">
                      <input
                        type="checkbox"
                        checked={notificationSettings.emailNotifications}
                        onChange={(e) => handleNotificationChange('emailNotifications', e.target.checked)}
                      />
                      <span className="mg-v2-v2-v2-toggle-slider" />
                    </label>
                  </div>
                </div>

                <div className="mg-v2-v2-v2-setting-item">
                  <div className="mg-v2-v2-v2-flex mg-v2-v2-v2-items-center mg-v2-v2-v2-justify-between">
                    <div>
                      <h4 className="mg-v2-v2-v2-h4 mg-v2-v2-v2-text-primary">{t('settings:notification.push.label')}</h4>
                      <p className="mg-v2-v2-v2-text-sm mg-v2-v2-v2-text-muted">{t('settings:notification.push.description')}</p>
                    </div>
                    <label className="mg-v2-v2-v2-toggle">
                      <input
                        type="checkbox"
                        checked={notificationSettings.pushNotifications}
                        onChange={(e) => handleNotificationChange('pushNotifications', e.target.checked)}
                      />
                      <span className="mg-v2-v2-v2-toggle-slider" />
                    </label>
                  </div>
                </div>

                <div className="mg-v2-v2-v2-setting-item">
                  <div className="mg-v2-v2-v2-flex mg-v2-v2-v2-items-center mg-v2-v2-v2-justify-between">
                    <div>
                      <h4 className="mg-v2-v2-v2-h4 mg-v2-v2-v2-text-primary">{t('settings:notification.sms.label')}</h4>
                      <p className="mg-v2-v2-v2-text-sm mg-v2-v2-v2-text-muted">{t('settings:notification.sms.description')}</p>
                    </div>
                    <label className="mg-v2-v2-v2-toggle">
                      <input
                        type="checkbox"
                        checked={notificationSettings.smsNotifications}
                        onChange={(e) => handleNotificationChange('smsNotifications', e.target.checked)}
                      />
                      <span className="mg-v2-v2-v2-toggle-slider" />
                    </label>
                  </div>
                </div>

                <div className="mg-v2-v2-v2-setting-item">
                  <div className="mg-v2-v2-v2-flex mg-v2-v2-v2-items-center mg-v2-v2-v2-justify-between">
                    <div>
                      <h4 className="mg-v2-v2-v2-h4 mg-v2-v2-v2-text-primary">{t('settings:notification.marketing.label')}</h4>
                      <p className="mg-v2-v2-v2-text-sm mg-v2-v2-v2-text-muted">{t('settings:notification.marketing.description')}</p>
                    </div>
                    <label className="mg-v2-v2-v2-toggle">
                      <input
                        type="checkbox"
                        checked={notificationSettings.marketingEmails}
                        onChange={(e) => handleNotificationChange('marketingEmails', e.target.checked)}
                      />
                      <span className="mg-v2-v2-v2-toggle-slider" />
                    </label>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>);

      case 'account':
        return (<div className="mg-v2-v2-v2-account-settings">
            <Card variant="default">
              <CardContent>
                <h3 className="mg-v2-v2-v2-h3 mg-v2-v2-v2-text-primary mg-v2-v2-v2-mb-lg">{t('settings:account.title')}</h3>
                
                <div className="mg-v2-v2-v2-setting-item">
                  <div className="mg-v2-v2-v2-flex mg-v2-v2-v2-items-center mg-v2-v2-v2-gap-md">
                    <Icon name="USER" size="MD" color="PRIMARY" />
                    <div>
                      <h4 className="mg-v2-v2-v2-h4 mg-v2-v2-v2-text-primary">{t('settings:account.userId')}</h4>
                      <p className="mg-v2-v2-v2-text-sm mg-v2-v2-v2-text-muted">{user?.userId}</p>
                    </div>
                  </div>
                </div>

                <div className="mg-v2-v2-v2-setting-item">
                  <div className="mg-v2-v2-v2-flex mg-v2-v2-v2-items-center mg-v2-v2-v2-gap-md">
                    <Icon name="MAIL" size="MD" color="PRIMARY" />
                    <div>
                      <h4 className="mg-v2-v2-v2-h4 mg-v2-v2-v2-text-primary">{t('admin.labels.email')}</h4>
                      <p className="mg-v2-v2-v2-text-sm mg-v2-v2-v2-text-muted">{user?.email}</p>
                    </div>
                  </div>
                </div>

                <div className="mg-v2-v2-v2-setting-item">
                  <div className="mg-v2-v2-v2-flex mg-v2-v2-v2-items-center mg-v2-v2-v2-gap-md">
                    <Icon name="SHIELD" size="MD" color="PRIMARY" />
                    <div>
                      <h4 className="mg-v2-v2-v2-h4 mg-v2-v2-v2-text-primary">{t('settings:account.role')}</h4>
                      <p className="mg-v2-v2-v2-text-sm mg-v2-v2-v2-text-muted">{user?.role}</p>
                    </div>
                  </div>
                </div>

                <div className="mg-v2-v2-v2-setting-item">
                  <div className="mg-v2-v2-v2-flex mg-v2-v2-v2-items-center mg-v2-v2-v2-gap-md">
                    <Icon name="CALENDAR" size="MD" color="PRIMARY" />
                    <div>
                      <h4 className="mg-v2-v2-v2-h4 mg-v2-v2-v2-text-primary">{t('settings:account.joinDate')}</h4>
                      <p className="mg-v2-v2-v2-text-sm mg-v2-v2-v2-text-muted">
                        {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>);

      default:
        return null;}};

  if (!user) {return (<div className="mg-v2-v2-v2-loading">
        <Icon name="LOADER" size="LG" color="PRIMARY" />
        <p className="mg-v2-v2-v2-text-muted">{t('settings:status.loading')}</p>
      </div>);}

  return (<SimpleLayout>
      <div className="mg-v2-v2-v2-user-settings">
        <div className="mg-v2-v2-v2-settings-header">
          <div className="mg-v2-v2-v2-flex mg-v2-v2-v2-items-center mg-v2-v2-v2-gap-md mg-v2-v2-v2-mb-md">
            <MGButton
              variant="outline"
              size="small"
              className={buildErpMgButtonClassName({ variant: 'outline', size: 'sm', loading: false })}
              loadingText={ERP_MG_BUTTON_LOADING_TEXT}
              onClick={() => navigate(-1)}
            >
              <Icon name="ARROW_LEFT" size="SM" />
              {t('settings:action.back')}
            </MGButton>
          </div>
          <h1 className="mg-v2-v2-v2-h1 mg-v2-v2-v2-text-primary">{t('settings:page.title')}</h1>
          <p className="mg-v2-v2-v2-text-muted">{t('settings:page.description')}</p>
        </div>

        <div className="mg-v2-v2-v2-settings-layout">
          {/* 사이드바 */}
          <div className="mg-v2-v2-v2-settings-sidebar">
            <Card variant="minimal">
              <CardContent>
                <nav className="mg-v2-v2-v2-settings-nav">
                  <MGButton
                    type="button"
                    variant="outline"
                    className={buildErpMgButtonClassName({
                      variant: 'outline',
                      size: 'md',
                      loading: false,
                      className: `mg-v2-nav-item ${activeTab === 'theme' ? 'mg-v2-nav-item--active' : ''}`
                    })}
                    loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                    onClick={() => setActiveTab('theme')}
                    preventDoubleClick={false}
                  >
                    <Icon name="PALETTE" size="SM" color={activeTab === 'theme' ? 'PRIMARY' : 'MUTED'} />
                    {t('settings:nav.theme')}
                  </MGButton>
                  <MGButton
                    type="button"
                    variant="outline"
                    className={buildErpMgButtonClassName({
                      variant: 'outline',
                      size: 'md',
                      loading: false,
                      className: `mg-v2-nav-item ${activeTab === 'notifications' ? 'mg-v2-nav-item--active' : ''}`
                    })}
                    loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                    onClick={() => setActiveTab('notifications')}
                    preventDoubleClick={false}
                  >
                    <Icon name="BELL" size="SM" color={activeTab === 'notifications' ? 'PRIMARY' : 'MUTED'} />
                    {t('settings:nav.notifications')}
                  </MGButton>
                  <MGButton
                    type="button"
                    variant="outline"
                    className={buildErpMgButtonClassName({
                      variant: 'outline',
                      size: 'md',
                      loading: false,
                      className: `mg-v2-nav-item ${activeTab === 'account' ? 'mg-v2-nav-item--active' : ''}`
                    })}
                    loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                    onClick={() => setActiveTab('account')}
                    preventDoubleClick={false}
                  >
                    <Icon name="USER" size="SM" color={activeTab === 'account' ? 'PRIMARY' : 'MUTED'} />
                    {t('settings:nav.account')}
                  </MGButton>
                </nav>
              </CardContent>
            </Card>
          </div>

          {/* 메인 컨텐츠 */}
          <div className="mg-v2-v2-v2-settings-content">
            {renderTabContent()}
          </div>
        </div>

        {/* 에러 메시지 */}
        {error && (<div className="mg-v2-v2-v2-error-message">
            <Icon name="ALERT_TRIANGLE" size="SM" color="ERROR" />
            <SafeText>{error}</SafeText>
          </div>)}
      </div>
    </SimpleLayout>);};

export default UserSettings;
