/**
 * 사용자 설정 페이지
 * 테마 설정과 기타 사용자 설정을 관리하는 페이지
 */

import {useState, useEffect} from 'react';
import {useNavigate} from 'react-router-dom';

import {useTheme, useThemeChange, useThemeColors} from '../../hooks/useTheme';
import SimpleLayout from '../layout/SimpleLayout';
import Button from '../ui/Button/Button';
import Card from '../ui/Card/Card';
import CardContent from '../ui/Card/CardContent';
import CardHeader from '../ui/Card/CardHeader';
import Icon from '../ui/Icon/Icon';
import ThemeSelector from '../ui/ThemeSelector/ThemeSelector';
import './UserSettings.css';

const UserSettings = ({user, onSettingsUpdate}) => {const {currentTheme, availableThemes} = useTheme();
  const {changeToTheme, applyCustomTheme, resetToDefault, isLoading, error} = useThemeChange();
  const themeColors = useThemeColors();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState('theme');
  const [showThemeSelector, setShowThemeSelector] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState({emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    marketingEmails: false});

  // 사용자 정보가 변경되면 설정 업데이트
  useEffect(() => {if (user) {// 알림 설정 로드 (실제로는 API에서 가져와야 함)
      setNotificationSettings({emailNotifications: user.emailNotifications ?? true,
        pushNotifications: user.pushNotifications ?? true,
        smsNotifications: user.smsNotifications ?? false,
        marketingEmails: user.marketingEmails ?? false});}}, [user]);

  // 테마 변경 핸들러
  const handleThemeChange = async(newTheme) => {try {const result = await changeToTheme(newTheme.type);
      if (result.success) {onSettingsUpdate?.({theme: newTheme});
        setShowThemeSelector(false);}} catch (err) {console.error('테마 변경 실패:', err);}};

  // 커스텀 테마 적용 핸들러
  const handleCustomThemeApply = async(baseThemeType, customColors) => {try {const result = await applyCustomTheme(baseThemeType, customColors);
      if (result.success) {onSettingsUpdate?.({theme: result.theme});
        setShowThemeSelector(false);}} catch (err) {console.error('커스텀 테마 적용 실패:', err);}};

  // 테마 초기화 핸들러
  const handleThemeReset = async() => {try {const result = await resetToDefault();
      if (result.success) {onSettingsUpdate?.({theme: result.theme});}} catch (err) {console.error('테마 초기화 실패:', err);}};

  // 알림 설정 변경 핸들러
  const handleNotificationChange = (setting, value) => {const newSettings = {...notificationSettings, [setting]: value};
    setNotificationSettings(newSettings);
    onSettingsUpdate?.({notifications: newSettings});};

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
                      <h3 className="mg-v2-v2-v2-h3 mg-v2-v2-v2-text-primary">{currentTheme.name}</h3>
                      <p className="mg-v2-v2-v2-text-muted">{currentTheme.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="mg-v2-v2-v2-theme-actions">
                <Button
                  variant="primary"
                  onClick={() => setShowThemeSelector(true)}
                  icon="PALETTE"
                >
                  테마 변경
                </Button>
                <Button
                  variant="outline"
                  onClick={handleThemeReset}
                  icon="REFRESH_CW"
                  loading={isLoading}
                >
                  기본값으로 초기화
                </Button>
              </div>
            </div>

            {showThemeSelector && (<div className="mg-v2-v2-v2-theme-selector-modal">
                <Card variant="default">
                  <CardHeader>
                    <div className="mg-v2-v2-v2-flex mg-v2-v2-v2-items-center mg-v2-v2-v2-justify-between">
                      <h3 className="mg-v2-v2-v2-h3 mg-v2-v2-v2-text-primary">테마 선택</h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowThemeSelector(false)}
                        icon="X"
                      />
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
                <h3 className="mg-v2-v2-v2-h3 mg-v2-v2-v2-text-primary mg-v2-v2-v2-mb-lg">알림 설정</h3>
                
                <div className="mg-v2-v2-v2-setting-item">
                  <div className="mg-v2-v2-v2-flex mg-v2-v2-v2-items-center mg-v2-v2-v2-justify-between">
                    <div>
                      <h4 className="mg-v2-v2-v2-h4 mg-v2-v2-v2-text-primary">이메일 알림</h4>
                      <p className="mg-v2-v2-v2-text-sm mg-v2-v2-v2-text-muted">중요한 업데이트와 알림을 이메일로 받습니다</p>
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
                      <h4 className="mg-v2-v2-v2-h4 mg-v2-v2-v2-text-primary">푸시 알림</h4>
                      <p className="mg-v2-v2-v2-text-sm mg-v2-v2-v2-text-muted">브라우저 푸시 알림을 받습니다</p>
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
                      <h4 className="mg-v2-v2-v2-h4 mg-v2-v2-v2-text-primary">SMS 알림</h4>
                      <p className="mg-v2-v2-v2-text-sm mg-v2-v2-v2-text-muted">긴급한 알림을 SMS로 받습니다</p>
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
                      <h4 className="mg-v2-v2-v2-h4 mg-v2-v2-v2-text-primary">마케팅 이메일</h4>
                      <p className="mg-v2-v2-v2-text-sm mg-v2-v2-v2-text-muted">프로모션과 새로운 기능 소식을 받습니다</p>
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
                <h3 className="mg-v2-v2-v2-h3 mg-v2-v2-v2-text-primary mg-v2-v2-v2-mb-lg">계정 설정</h3>
                
                <div className="mg-v2-v2-v2-setting-item">
                  <div className="mg-v2-v2-v2-flex mg-v2-v2-v2-items-center mg-v2-v2-v2-gap-md">
                    <Icon name="USER" size="MD" color="PRIMARY" />
                    <div>
                      <h4 className="mg-v2-v2-v2-h4 mg-v2-v2-v2-text-primary">사용자명</h4>
                      <p className="mg-v2-v2-v2-text-sm mg-v2-v2-v2-text-muted">{user?.username}</p>
                    </div>
                  </div>
                </div>

                <div className="mg-v2-v2-v2-setting-item">
                  <div className="mg-v2-v2-v2-flex mg-v2-v2-v2-items-center mg-v2-v2-v2-gap-md">
                    <Icon name="MAIL" size="MD" color="PRIMARY" />
                    <div>
                      <h4 className="mg-v2-v2-v2-h4 mg-v2-v2-v2-text-primary">이메일</h4>
                      <p className="mg-v2-v2-v2-text-sm mg-v2-v2-v2-text-muted">{user?.email}</p>
                    </div>
                  </div>
                </div>

                <div className="mg-v2-v2-v2-setting-item">
                  <div className="mg-v2-v2-v2-flex mg-v2-v2-v2-items-center mg-v2-v2-v2-gap-md">
                    <Icon name="SHIELD" size="MD" color="PRIMARY" />
                    <div>
                      <h4 className="mg-v2-v2-v2-h4 mg-v2-v2-v2-text-primary">역할</h4>
                      <p className="mg-v2-v2-v2-text-sm mg-v2-v2-v2-text-muted">{user?.role}</p>
                    </div>
                  </div>
                </div>

                <div className="mg-v2-v2-v2-setting-item">
                  <div className="mg-v2-v2-v2-flex mg-v2-v2-v2-items-center mg-v2-v2-v2-gap-md">
                    <Icon name="CALENDAR" size="MD" color="PRIMARY" />
                    <div>
                      <h4 className="mg-v2-v2-v2-h4 mg-v2-v2-v2-text-primary">가입일</h4>
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
        <p className="mg-v2-v2-v2-text-muted">사용자 정보를 불러오는 중...</p>
      </div>);}

  return (<SimpleLayout>
      <div className="mg-v2-v2-v2-user-settings">
        <div className="mg-v2-v2-v2-settings-header">
          <div className="mg-v2-v2-v2-flex mg-v2-v2-v2-items-center mg-v2-v2-v2-gap-md mg-v2-v2-v2-mb-md">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-DEFAULT_VALUES.CURRENT_PAGE)}
              icon="ARROW_LEFT"
            >
              뒤로가기
            </Button>
          </div>
          <h1 className="mg-v2-v2-v2-h1 mg-v2-v2-v2-text-primary">설정</h1>
          <p className="mg-v2-v2-v2-text-muted">계정과 환경 설정을 관리하세요</p>
        </div>

        <div className="mg-v2-v2-v2-settings-layout">
          {/* 사이드바 */}
          <div className="mg-v2-v2-v2-settings-sidebar">
            <Card variant="minimal">
              <CardContent>
                <nav className="mg-v2-v2-v2-settings-nav">
                  <button
                    className={`mg-v2-nav-item ${activeTab === 'theme' ? 'mg-v2-nav-item--active' : ''}`}
                    onClick={() => setActiveTab('theme')}
                  >
                    <Icon name="PALETTE" size="SM" color={activeTab === 'theme' ? 'PRIMARY' : 'MUTED'} />
                    테마 설정
                  </button>
                  <button
                    className={`mg-v2-nav-item ${activeTab === 'notifications' ? 'mg-v2-nav-item--active' : ''}`}
                    onClick={() => setActiveTab('notifications')}
                  >
                    <Icon name="BELL" size="SM" color={activeTab === 'notifications' ? 'PRIMARY' : 'MUTED'} />
                    알림 설정
                  </button>
                  <button
                    className={`mg-v2-nav-item ${activeTab === 'account' ? 'mg-v2-nav-item--active' : ''}`}
                    onClick={() => setActiveTab('account')}
                  >
                    <Icon name="USER" size="SM" color={activeTab === 'account' ? 'PRIMARY' : 'MUTED'} />
                    계정 정보
                  </button>
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
            <span>{error}</span>
          </div>)}
      </div>
    </SimpleLayout>);};

export default UserSettings;
