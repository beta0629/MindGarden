import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { sessionManager } from '../../utils/sessionManager';
import { withFormSubmit } from '../../utils/formSubmitWrapper';
import mypageApi from '../../utils/mypageApi';
import notificationManager from '../../utils/notification';
import ConfirmModal from '../common/ConfirmModal';
import AdminCommonLayout from '../layout/AdminCommonLayout';
import { ContentArea, ContentHeader } from '../dashboard-v2/content';
import { useSession } from '../../contexts/SessionContext';
import ProfileSection from './components/ProfileSection';
import PrivacyConsentSection from './components/PrivacyConsentSection';
import SettingsSection from './components/SettingsSection';
import SecuritySection from './components/SecuritySection';
import SocialAccountsSection from './components/SocialAccountsSection';
import PasswordResetModal from './components/PasswordResetModal';
import PasswordChangeModal from './components/PasswordChangeModal';
import {
  MYPAGE_TITLE_ID,
  MYPAGE_TAB_SET,
  MYPAGE_TAB_ORDER,
  MYPAGE_TAB_LABELS,
  MYPAGE_TAB_KEYS,
  getSocialProviderLabel
} from '../../constants/mypageUi';
import MGButton from '../common/MGButton';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../erp/common/erpMgButtonProps';
import '../../styles/unified-design-tokens.css';
import '../admin/AdminDashboard/AdminDashboardB0KlA.css';
import './MyPageRenewal.css';

const TAB_IDS = {
  profile: 'mg-mypage-tab-profile',
  settings: 'mg-mypage-tab-settings',
  security: 'mg-mypage-tab-security',
  social: 'mg-mypage-tab-social',
  privacy: 'mg-mypage-tab-privacy'
};

const PANEL_IDS = {
  profile: 'mg-mypage-panel-profile',
  settings: 'mg-mypage-panel-settings',
  security: 'mg-mypage-panel-security',
  social: 'mg-mypage-panel-social',
  privacy: 'mg-mypage-panel-privacy'
};

const MyPage = () => {
  const { user: sessionUser } = useSession();
  const [searchParams, setSearchParams] = useSearchParams();
  const [user, setUser] = useState(null);
  const [localUser, setLocalUser] = useState(null);
  const [activeTab, setActiveTab] = useState(MYPAGE_TAB_KEYS.PROFILE);
  const [socialAccounts, setSocialAccounts] = useState([]);
  const [showPasswordResetModal, setShowPasswordResetModal] = useState(false);
  const [showPasswordChangeModal, setShowPasswordChangeModal] = useState(false);
  const [socialUnlinkTarget, setSocialUnlinkTarget] = useState(null);
  const [showLogoutOtherConfirm, setShowLogoutOtherConfirm] = useState(false);
  const [formData, setFormData] = useState({
    userId: '',
    nickname: '',
    email: '',
    phone: '',
    gender: '',
    postalCode: '',
    address: '',
    addressDetail: '',
    profileImage: null,
    profileImageType: 'DEFAULT_ICON',
    socialProvider: null,
    socialProfileImage: null
  });

  const visibleTabs = MYPAGE_TAB_ORDER.filter((key) => MYPAGE_TAB_SET.has(key));

  const formatPhoneNumber = (phone) => {
    if (!phone) return '';
    const numbers = phone.replace(/[^0-9]/g, '');
    if (numbers.length <= 3) {
      return numbers;
    }
    if (numbers.length <= 7) {
      return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    }
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
  };

  const setTabInUrl = useCallback(
    (tab) => {
      setActiveTab(tab);
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set('tab', tab);
          return next;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  const loadUserInfo = useCallback(async() => {
    try {
      const currentUser = sessionManager.getUser() || sessionUser;
      if (!currentUser) {
        throw new Error('세션에 사용자 정보가 없습니다');
      }

      const response = await mypageApi.getProfileInfo(currentUser.role, currentUser.id);

      if (response) {
        setUser(response);
        setFormData({
          userId: response.userId || response.name || '',
          nickname: response.nickname || '',
          email: response.email || '',
          phone: response.phone || response.phoneNumber || '',
          gender: response.gender || '',
          postalCode: response.postalCode || '',
          address: response.address || '',
          addressDetail: response.addressDetail || '',
          profileImage: response.profileImage || response.profileImageUrl || null,
          profileImageType: response.profileImageType || 'DEFAULT_ICON',
          socialProvider: response.socialProvider || null,
          socialProfileImage: response.socialProfileImage || null
        });
      }
    } catch (error) {
      console.error('사용자 정보 로드 실패:', error);
      const currentUser = sessionManager.getUser() || sessionUser;
      if (currentUser) {
        const formDataToSet = {
          userId: currentUser.userId || currentUser.name || '',
          nickname: currentUser.nickname || '',
          email: currentUser.email || '',
          phone: currentUser.phone || currentUser.phoneNumber || '',
          gender: currentUser.gender || '',
          profileImage: currentUser.profileImage || currentUser.profileImageUrl || null,
          profileImageType: currentUser.profileImageType || 'DEFAULT_ICON',
          socialProvider: currentUser.socialProvider || null,
          socialProfileImage: currentUser.socialProfileImage || null
        };
        setUser(currentUser);
        setFormData(formDataToSet);
      }
    }
  }, [sessionUser]);

  const loadSocialAccounts = useCallback(async() => {
    try {
      const currentUser = sessionManager.getUser() || sessionUser;
      if (!currentUser) {
        setSocialAccounts([]);
        return;
      }

      const response = await mypageApi.getSocialAccounts(currentUser.role, currentUser.id);
      const list = Array.isArray(response) ? response : response?.data || [];
      setSocialAccounts(list);
    } catch (error) {
      console.error('소셜 계정 정보 로드 실패:', error);
      setSocialAccounts([]);
    }
  }, [sessionUser]);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setLocalUser(parsedUser);
      } catch (error) {
        console.error('사용자 정보 파싱 오류:', error);
      }
    }
  }, []);

  const displayUser = user || localUser || sessionUser;

  useEffect(() => {
    loadUserInfo();
    loadSocialAccounts();
  }, [loadUserInfo, loadSocialAccounts]);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && MYPAGE_TAB_SET.has(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const linkStatus = urlParams.get('link');
    const provider = urlParams.get('provider');
    const message = urlParams.get('message');

    if (linkStatus && provider && message) {
      if (linkStatus === 'success') {
        notificationManager.show(
          `${provider === 'KAKAO' ? '카카오' : '네이버'} 계정 연동이 완료되었습니다.`,
          'success'
        );
        loadSocialAccounts();
        window.history.replaceState({}, document.title, window.location.pathname);
      } else if (linkStatus === 'error') {
        notificationManager.show(
          `${provider === 'KAKAO' ? '카카오' : '네이버'} 계정 연동 실패: ${message}`,
          'error'
        );
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, [loadSocialAccounts]);

  useEffect(() => {
    if (activeTab === MYPAGE_TAB_KEYS.SOCIAL) {
      loadSocialAccounts();
    }
  }, [activeTab, loadSocialAccounts]);

  const handleSubmit = withFormSubmit(async(e, formDataToUpdate) => {
    if (e && e.preventDefault) {
      e.preventDefault();
    }

    const dataToUpdate = formDataToUpdate || formData;
    const currentUser = sessionManager.getUser() || sessionUser;
    if (!currentUser) {
      throw new Error('세션에 사용자 정보가 없습니다');
    }

    const requestData = {
      ...dataToUpdate,
      profileImageUrl: dataToUpdate.profileImage,
      gender: dataToUpdate.gender,
      memo: dataToUpdate.memo || '',
      specialty: dataToUpdate.specialty || '',
      qualifications: dataToUpdate.qualifications || '',
      experience: dataToUpdate.experience || '',
      availableTime: dataToUpdate.availableTime || '',
      detailedIntroduction: dataToUpdate.detailedIntroduction || '',
      education: dataToUpdate.education || '',
      awards: dataToUpdate.awards || '',
      research: dataToUpdate.research || '',
      hourlyRate: dataToUpdate.hourlyRate || null
    };

    const response = await mypageApi.updateProfileInfo(currentUser.role, currentUser.id, requestData);

    setUser((prev) => ({
      ...prev,
      userId: response.userId || dataToUpdate.userId,
      nickname: response.nickname || dataToUpdate.nickname,
      phone: response.phone || dataToUpdate.phone,
      gender: response.gender || dataToUpdate.gender,
      profileImage: dataToUpdate.profileImage || response.profileImage,
      profileImageType: dataToUpdate.profileImageType || response.profileImageType
    }));

    setFormData({
      ...dataToUpdate,
      profileImage: dataToUpdate.profileImage || response.profileImage,
      profileImageType: dataToUpdate.profileImageType || response.profileImageType
    });

    if (sessionManager.user) {
      sessionManager.user = {
        ...sessionManager.user,
        userId: dataToUpdate.userId,
        nickname: dataToUpdate.nickname,
        phone: dataToUpdate.phone,
        gender: dataToUpdate.gender,
        profileImage: dataToUpdate.profileImage
      };
      sessionManager.notifyListeners();
    }

    await sessionManager.checkSession();

    setUser((prev) => ({
      ...prev,
      ...dataToUpdate
    }));
    setFormData(dataToUpdate);

    notificationManager.show('프로필이 저장되었습니다.', 'success');
  });

  const handlePasswordReset = () => {
    setShowPasswordResetModal(true);
  };

  const handlePasswordResetSuccess = () => {
    notificationManager.show('비밀번호 재설정 이메일이 발송되었습니다. 이메일을 확인해주세요.', 'success');
  };

  const handlePasswordChange = () => {
    setShowPasswordChangeModal(true);
  };

  const handlePasswordChangeSuccess = () => {
    notificationManager.show('비밀번호가 변경되었습니다.', 'success');
  };

  const handleLinkSocialAccount = async(provider) => {
    try {
      notificationManager.show(
        `${provider === 'KAKAO' ? '카카오' : '네이버'} 계정 연동을 시작합니다.`,
        'info'
      );
      const oauthUrl = await mypageApi.getOAuth2Url(provider);
      notificationManager.show(`${provider === 'KAKAO' ? '카카오' : '네이버'}에서 권한을 승인해주세요.`, 'system');
      window.location.href = oauthUrl;
    } catch (error) {
      console.error('소셜 계정 연동 URL 생성 실패:', error);
      notificationManager.show(`소셜 계정 연동을 시작할 수 없습니다: ${error.message}`, 'error');
    }
  };

  const requestUnlinkSocial = (provider, accountId) => {
    setSocialUnlinkTarget({ provider, accountId });
  };

  const confirmUnlinkSocial = async() => {
    if (!socialUnlinkTarget) return;
    const { provider, accountId } = socialUnlinkTarget;
    try {
      await mypageApi.unlinkSocialAccount(provider, accountId);
      notificationManager.show('소셜 계정 연동이 해제되었습니다.', 'success');
      loadSocialAccounts();
    } catch (error) {
      console.error('소셜 계정 연동 해제 실패:', error);
      notificationManager.show(`연동 해제에 실패했습니다: ${error.message}`, 'error');
    } finally {
      setSocialUnlinkTarget(null);
    }
  };

  const handleSupportClick = () => {
    notificationManager.show('고객센터 연결은 준비 중입니다.', 'info');
  };

  const handleLogoutClick = async() => {
    try {
      await sessionManager.logout();
    } catch (error) {
      console.error('로그아웃 실패:', error);
      notificationManager.show('로그아웃 중 오류가 발생했습니다.', 'error');
    }
  };

  if (!displayUser) {
    return (
      <AdminCommonLayout title="마이페이지" loading loadingText="사용자 정보를 불러오는 중..." />
    );
  }

  return (
    <AdminCommonLayout title="마이페이지">
      <ContentArea ariaLabel="마이페이지">
        <div className="mg-mypage">
          <div className="mg-v2-ad-b0kla__container">
            <ContentHeader
              title="마이페이지"
              subtitle="프로필, 설정, 보안, 소셜 계정, 개인정보 동의를 한곳에서 관리합니다."
              titleId={MYPAGE_TITLE_ID}
              actions={
                <div className="mg-mypage__header-actions">
                  <MGButton
                    type="button"
                    variant="outline"
                    className={buildErpMgButtonClassName({ variant: 'outline', size: 'md', loading: false })}
                    loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                    onClick={handleSupportClick}
                  >
                    고객센터
                  </MGButton>
                  <MGButton
                    type="button"
                    variant="outline"
                    className={buildErpMgButtonClassName({ variant: 'outline', size: 'md', loading: false })}
                    loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                    onClick={handleLogoutClick}
                  >
                    로그아웃
                  </MGButton>
                </div>
              }
            />

        <nav className="mg-mypage__tabs" aria-label="마이페이지 섹션">
          <ul className="mg-mypage__tab-list mg-v2-ad-b0kla__pill-toggle" role="tablist">
            {visibleTabs.map((tabKey) => (
              <li key={tabKey} className="mg-mypage__tab-item">
                <MGButton
                  type="button"
                  role="tab"
                  id={TAB_IDS[tabKey]}
                  aria-selected={activeTab === tabKey}
                  aria-controls={PANEL_IDS[tabKey]}
                  variant="outline"
                  className={buildErpMgButtonClassName({
                    variant: 'outline',
                    size: 'md',
                    loading: false,
                    className: `mg-v2-ad-b0kla__pill${activeTab === tabKey ? ' mg-v2-ad-b0kla__pill--active' : ''}`
                  })}
                  loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                  onClick={() => setTabInUrl(tabKey)}
                  preventDoubleClick={false}
                >
                  {MYPAGE_TAB_LABELS[tabKey]}
                </MGButton>
              </li>
            ))}
          </ul>
        </nav>

        <section className="mg-mypage__main" aria-labelledby={MYPAGE_TITLE_ID}>
          <div className="mg-mypage__tab-panels">
            <section
              className="mg-mypage__panel"
              role="tabpanel"
              id={PANEL_IDS.profile}
              aria-labelledby={TAB_IDS.profile}
              hidden={activeTab !== MYPAGE_TAB_KEYS.PROFILE}
            >
              <div className="mg-mypage__panel-inner">
                <ProfileSection
                  user={user}
                  displayUser={displayUser}
                  formData={formData}
                  onFormDataChange={setFormData}
                  onUserChange={setUser}
                  onSave={handleSubmit}
                  formatPhoneNumber={formatPhoneNumber}
                />
              </div>
            </section>

            <section
              className="mg-mypage__panel"
              role="tabpanel"
              id={PANEL_IDS.settings}
              aria-labelledby={TAB_IDS.settings}
              hidden={activeTab !== MYPAGE_TAB_KEYS.SETTINGS}
            >
              <div className="mg-mypage__panel-inner">
                <SettingsSection />
              </div>
            </section>

            <section
              className="mg-mypage__panel"
              role="tabpanel"
              id={PANEL_IDS.security}
              aria-labelledby={TAB_IDS.security}
              hidden={activeTab !== MYPAGE_TAB_KEYS.SECURITY}
            >
              <div className="mg-mypage__panel-inner">
                <SecuritySection
                  onPasswordChange={handlePasswordChange}
                  onPasswordReset={handlePasswordReset}
                  onRequestLogoutOtherDevices={() => setShowLogoutOtherConfirm(true)}
                />
              </div>
            </section>

            <section
              className="mg-mypage__panel"
              role="tabpanel"
              id={PANEL_IDS.social}
              aria-labelledby={TAB_IDS.social}
              hidden={activeTab !== MYPAGE_TAB_KEYS.SOCIAL}
            >
              <div className="mg-mypage__panel-inner">
                <SocialAccountsSection
                  socialAccounts={socialAccounts}
                  onLinkAccount={handleLinkSocialAccount}
                  onUnlinkAccount={requestUnlinkSocial}
                  onSupportClick={handleSupportClick}
                />
              </div>
            </section>

            <section
              className="mg-mypage__panel"
              role="tabpanel"
              id={PANEL_IDS.privacy}
              aria-labelledby={TAB_IDS.privacy}
              hidden={activeTab !== MYPAGE_TAB_KEYS.PRIVACY}
            >
              <div className="mg-mypage__panel-inner">
                <PrivacyConsentSection />
              </div>
            </section>
          </div>
        </section>
          </div>
        </div>
      </ContentArea>

      <PasswordResetModal
        isOpen={showPasswordResetModal}
        onClose={() => setShowPasswordResetModal(false)}
        onSuccess={handlePasswordResetSuccess}
      />

      <PasswordChangeModal
        isOpen={showPasswordChangeModal}
        onClose={() => setShowPasswordChangeModal(false)}
        onSuccess={handlePasswordChangeSuccess}
      />

      <ConfirmModal
        isOpen={!!socialUnlinkTarget}
        onClose={() => setSocialUnlinkTarget(null)}
        onConfirm={confirmUnlinkSocial}
        title="연결 해제"
        message={
          socialUnlinkTarget
            ? `${getSocialProviderLabel(socialUnlinkTarget.provider)} 계정 연결을 해제할까요? 해제 후에는 해당 계정으로 로그인할 수 없을 수 있습니다.`
            : ''
        }
        confirmText="연결 해제"
        cancelText="취소"
        type="danger"
      />

      <ConfirmModal
        isOpen={showLogoutOtherConfirm}
        onClose={() => setShowLogoutOtherConfirm(false)}
        onConfirm={() => {
          setShowLogoutOtherConfirm(false);
          notificationManager.show('다른 기기 세션 일괄 종료 API는 준비 중입니다.', 'info');
        }}
        title="다른 기기 로그아웃"
        message="다른 기기에서 로그인된 세션을 모두 종료할까요? 이 기기는 유지됩니다."
        confirmText="확인"
        cancelText="취소"
        type="warning"
      />
    </AdminCommonLayout>
  );
};

export default MyPage;
