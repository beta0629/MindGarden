import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { sessionManager } from '../../utils/sessionManager';
import { withFormSubmit } from '../../utils/formSubmitWrapper';
import mypageApi from '../../utils/mypageApi';
import { isConsultantUserProfileRole } from '../../constants/mypageProfileRoles';
import {
  buildProfileUpdatePayload,
  mapProfileImageToSessionFields,
  mapProfileLoadResponseToForm,
  normalizeProfileFormNameField,
  pickSessionProfileNameForForm,
  resolveProfileImageFromApiResponse
} from '../../utils/mypageProfilePayload';
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
import WithdrawalRequestModal from './components/WithdrawalRequestModal';
import WithdrawalPendingWidget from './components/WithdrawalPendingWidget';
import {
  MYPAGE_TITLE_ID,
  MYPAGE_TAB_SET,
  MYPAGE_TAB_ORDER,
  MYPAGE_TAB_LABELS,
  MYPAGE_TAB_KEYS,
  getSocialProviderLabel,
  MYPAGE_SOCIAL_LINK_DEFAULT_ERROR,
  MYPAGE_SOCIAL_LINK_DEFAULT_SUCCESS
} from '../../constants/mypageUi';
import MGButton from '../common/MGButton';
import SegmentedTabs from '../common/SegmentedTabs';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../erp/common/erpMgButtonProps';
import { formatPhoneNumber } from '../../utils/common';
import '../../styles/unified-design-tokens.css';
import '../admin/AdminDashboard/AdminDashboardB0KlA.css';
import './MyPageRenewal.css';
import { useTranslation } from 'react-i18next';
import i18n from '../../i18n';

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
  const { t } = useTranslation();
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
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  const [withdrawalStatus, setWithdrawalStatus] = useState(null);
  const [formData, setFormData] = useState({
    userId: '',
    nickname: '',
    email: '',
    phone: '',
    gender: '',
    postalCode: '',
    address: '',
    addressDetail: '',
    addressType: 'HOME',
    profileImage: null,
    profileImageType: 'DEFAULT_ICON',
    socialProvider: null,
    socialProfileImage: null,
    memo: '',
    specialty: '',
    qualifications: '',
    experience: '',
    availableTime: '',
    detailedIntroduction: '',
    education: '',
    awards: '',
    research: '',
    hourlyRate: null,
    notificationChannelPreference: 'TENANT_DEFAULT',
    tenantNotificationChannelKakaoAvailable: undefined,
    tenantNotificationChannelSmsAvailable: undefined,
    tenantDefaultNotificationChannelHint: undefined,
    notificationChannelPreferenceUiAdjusted: undefined
  });

  const visibleTabs = MYPAGE_TAB_ORDER.filter((key) => MYPAGE_TAB_SET.has(key));

  // P0 hotfix 2026-06-12: SessionContext.user 우선 사용. sessionManager.checkSession(true) 호출 회피.
  // 마이페이지 진입 시 loadUserInfo / loadSocialAccounts / loadWithdrawalStatus 가 동시에 호출되어
  // resolveMypageSessionUser → checkSession(true) 가 중복 발생, current-user 호출이 N배 증폭되던 문제 차단.
  // sessionManager 자체에도 in-flight dedup 이 추가되었으므로 안전망은 이중.
  const resolveMypageSessionUser = useCallback(async() => {
    let resolved = sessionUser || sessionManager.getUser();
    if (resolved) {
      return resolved;
    }
    const raw = localStorage.getItem('userInfo');
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object' && parsed.id != null) {
          return parsed;
        }
      } catch (parseError) {
        console.error('userInfo 파싱 오류:', parseError);
      }
    }
    await sessionManager.checkSession(true);
    resolved = sessionManager.getUser() || sessionUser;
    return resolved || null;
  }, [sessionUser]);

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
      const currentUser = await resolveMypageSessionUser();
      if (!currentUser) {
        throw new Error(i18n.t('error:mypage.MyPage.t_2f7f087b'));
      }

      const response = await mypageApi.getProfileInfo(currentUser.role, currentUser.id);

      if (response) {
        setUser(response);
        const mapped = mapProfileLoadResponseToForm(currentUser.role, response);
        if (mapped) {
          setFormData(normalizeProfileFormNameField(mapped));
        }
        const profileImageFromApi = resolveProfileImageFromApiResponse(currentUser.role, response);
        if (profileImageFromApi && sessionManager.user) {
          sessionManager.user = {
            ...sessionManager.user,
            ...mapProfileImageToSessionFields(profileImageFromApi)
          };
          sessionManager.notifyListeners();
        }
      }
    } catch (error) {
      console.error('사용자 정보 로드 실패:', error);
      const currentUser = await resolveMypageSessionUser();
      if (currentUser) {
        const formDataToSet = {
          userId: pickSessionProfileNameForForm(currentUser),
          nickname: currentUser.nickname || '',
          email: currentUser.email || '',
          phone: currentUser.phone || currentUser.phoneNumber || '',
          gender: currentUser.gender || '',
          postalCode: '',
          address: '',
          addressDetail: '',
          addressType: 'HOME',
          profileImage: currentUser.profileImage || currentUser.profileImageUrl || null,
          profileImageType: currentUser.profileImageType || 'DEFAULT_ICON',
          socialProvider: currentUser.socialProvider || null,
          socialProfileImage: currentUser.socialProfileImage || null,
          memo: '',
          specialty: '',
          qualifications: '',
          experience: '',
          availableTime: '',
          detailedIntroduction: '',
          education: '',
          awards: '',
          research: '',
          hourlyRate: null,
          notificationChannelPreference: 'TENANT_DEFAULT',
          tenantNotificationChannelKakaoAvailable: undefined,
          tenantNotificationChannelSmsAvailable: undefined,
          tenantDefaultNotificationChannelHint: undefined,
          notificationChannelPreferenceUiAdjusted: undefined
        };
        setUser(currentUser);
        setFormData(normalizeProfileFormNameField(formDataToSet));
      }
    }
  }, [resolveMypageSessionUser]);

  const loadSocialAccounts = useCallback(async() => {
    try {
      const currentUser = await resolveMypageSessionUser();
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
  }, [resolveMypageSessionUser]);

  useEffect(() => {
    const storedUser = localStorage.getItem('userInfo');
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

  // P0 hotfix 2026-06-12: 탭 복귀 시 loadUserInfo 자동 재호출은 30초 쿨다운 적용 (current-user 폭증 차단)
  const lastVisibilityLoadAtRef = useRef(0);
  useEffect(() => {
    const VISIBILITY_RELOAD_COOLDOWN_MS = 30 * 1000;
    const onVisibility = () => {
      if (document.visibilityState !== 'visible') return;
      const now = Date.now();
      if (now - lastVisibilityLoadAtRef.current < VISIBILITY_RELOAD_COOLDOWN_MS) {
        return;
      }
      lastVisibilityLoadAtRef.current = now;
      loadUserInfo();
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [loadUserInfo]);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && MYPAGE_TAB_SET.has(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  useEffect(() => {
    let linkStatus = searchParams.get('link');
    const provider = searchParams.get('provider');
    const message = searchParams.get('message');
    const legacySuccessParam = searchParams.get('success');

    if (!linkStatus && legacySuccessParam && provider
        && (provider === 'KAKAO' || provider === 'NAVER')) {
      linkStatus = 'success';
    }

    if (!linkStatus || !provider) {
      return;
    }

    const providerLabel = getSocialProviderLabel(provider);
    const messageTrimmed = message != null ? String(message).trim() : '';
    const legacyTrimmed = legacySuccessParam != null ? String(legacySuccessParam).trim() : '';

    if (linkStatus === 'success') {
      const text = messageTrimmed.length > 0
        ? messageTrimmed
        : (legacyTrimmed.length > 0 ? legacyTrimmed : MYPAGE_SOCIAL_LINK_DEFAULT_SUCCESS(providerLabel));
      notificationManager.show(text, 'success');
      loadSocialAccounts();
    } else if (linkStatus === 'error') {
      const text = messageTrimmed.length > 0
        ? `${providerLabel} 계정 연동 실패: ${messageTrimmed}`
        : MYPAGE_SOCIAL_LINK_DEFAULT_ERROR(providerLabel);
      notificationManager.show(text, 'error');
    }

    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      ['tab', 'link', 'provider', 'message', 'success'].forEach((key) => next.delete(key));
      return next;
    }, { replace: true });
  }, [loadSocialAccounts, searchParams, setSearchParams]);

  useEffect(() => {
    if (activeTab === MYPAGE_TAB_KEYS.SOCIAL) {
      loadSocialAccounts();
    }
  }, [activeTab, loadSocialAccounts]);

  const handleSubmit = withFormSubmit(async(e, formDataToUpdate) => {
    if (e && e.preventDefault) {
      e.preventDefault();
    }

    const dataToUpdate = normalizeProfileFormNameField({ ...(formDataToUpdate || formData) });
    const currentUser = sessionManager.getUser() || sessionUser;
    if (!currentUser) {
      throw new Error(i18n.t('error:mypage.MyPage.t_2f7f087b'));
    }

    const requestData = buildProfileUpdatePayload(currentUser.role, dataToUpdate);

    const response = await mypageApi.updateProfileInfo(currentUser.role, currentUser.id, requestData);

    const nextProfileImage = isConsultantUserProfileRole(currentUser.role)
      ? (response.profileImageUrl || dataToUpdate.profileImage)
      : (response.profileImage || dataToUpdate.profileImage);

    let dataAfterSave = {
      ...dataToUpdate,
      profileImage: nextProfileImage,
      profileImageType: dataToUpdate.profileImageType || response?.profileImageType
    };
    if (isConsultantUserProfileRole(currentUser.role) && response) {
      dataAfterSave = {
        ...dataAfterSave,
        postalCode: response.postalCode ?? dataToUpdate.postalCode,
        address: response.address ?? dataToUpdate.address,
        addressDetail: response.addressDetail ?? dataToUpdate.addressDetail
      };
    }

    if (response) {
      dataAfterSave = {
        ...dataAfterSave,
        notificationChannelPreference:
          response.notificationChannelPreference ?? dataAfterSave.notificationChannelPreference,
        tenantNotificationChannelKakaoAvailable: response.tenantNotificationChannelKakaoAvailable,
        tenantNotificationChannelSmsAvailable: response.tenantNotificationChannelSmsAvailable,
        tenantDefaultNotificationChannelHint: response.tenantDefaultNotificationChannelHint,
        notificationChannelPreferenceUiAdjusted: response.notificationChannelPreferenceUiAdjusted
      };
    }

    setUser((prev) => {
      if (!isConsultantUserProfileRole(currentUser.role)) {
        return {
          ...prev,
          ...response,
          profileImage: nextProfileImage,
          profileImageType: dataToUpdate.profileImageType || response.profileImageType,
          notificationChannelPreference: response.notificationChannelPreference,
          tenantNotificationChannelKakaoAvailable: response.tenantNotificationChannelKakaoAvailable,
          tenantNotificationChannelSmsAvailable: response.tenantNotificationChannelSmsAvailable,
          tenantDefaultNotificationChannelHint: response.tenantDefaultNotificationChannelHint,
          notificationChannelPreferenceUiAdjusted: response.notificationChannelPreferenceUiAdjusted
        };
      }
      if (!response) {
        return { ...prev, profileImage: nextProfileImage };
      }
      return {
        ...prev,
        nickname: response.nickname,
        phone: response.phone,
        gender: response.gender,
        email: response.email,
        name: response.name,
        profileImageUrl: response.profileImageUrl,
        profileImage: nextProfileImage,
        profileImageType: dataToUpdate.profileImageType || response.profileImageType,
        postalCode: response.postalCode,
        address: response.address,
        addressDetail: response.addressDetail,
        memo: response.memo,
        specialty: response.specialty,
        qualifications: response.qualifications,
        experience: response.experience,
        availableTime: response.availableTime,
        detailedIntroduction: response.detailedIntroduction,
        education: response.education,
        awards: response.awards,
        research: response.research,
        hourlyRate: response.hourlyRate,
        notificationChannelPreference: response.notificationChannelPreference,
        tenantNotificationChannelKakaoAvailable: response.tenantNotificationChannelKakaoAvailable,
        tenantNotificationChannelSmsAvailable: response.tenantNotificationChannelSmsAvailable,
        tenantDefaultNotificationChannelHint: response.tenantDefaultNotificationChannelHint,
        notificationChannelPreferenceUiAdjusted: response.notificationChannelPreferenceUiAdjusted
      };
    });

    if (sessionManager.user) {
      sessionManager.user = {
        ...sessionManager.user,
        userId: dataAfterSave.userId,
        nickname: dataAfterSave.nickname,
        phone: dataAfterSave.phone,
        gender: dataAfterSave.gender,
        ...mapProfileImageToSessionFields(nextProfileImage)
      };
      sessionManager.notifyListeners();
    }

    await sessionManager.checkSession();

    setUser((prev) => ({
      ...prev,
      ...dataAfterSave
    }));
    setFormData(normalizeProfileFormNameField(dataAfterSave));

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

  const loadWithdrawalStatus = useCallback(async() => {
    try {
      const response = await mypageApi.getWithdrawalStatus();
      const payload =
        response && typeof response === 'object' && response.data && typeof response.data === 'object'
          ? response.data
          : response;
      setWithdrawalStatus(payload || null);
    } catch (error) {
      console.error('탈퇴 상태 조회 실패:', error);
      setWithdrawalStatus(null);
    }
  }, []);

  useEffect(() => {
    loadWithdrawalStatus();
  }, [loadWithdrawalStatus]);

  const handleOpenWithdrawalModal = () => {
    setShowWithdrawalModal(true);
  };

  const handleWithdrawalRequestSuccess = () => {
    loadWithdrawalStatus();
  };

  const handleWithdrawalCancelled = () => {
    loadWithdrawalStatus();
  };

  const isWithdrawalPending =
    !!withdrawalStatus && withdrawalStatus.lifecycleState === 'WITHDRAWAL_PENDING';

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
      await loadSocialAccounts();
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
      <AdminCommonLayout
        title={t('common.labels.myPage')}
        className="mg-v2-dashboard-layout"
        loading
        loadingText="사용자 정보를 불러오는 중..."
      />
    );
  }

  return (
    <AdminCommonLayout title={t('common.labels.myPage')} className="mg-v2-dashboard-layout">
      <ContentArea ariaLabel="마이페이지">
        <div className="mg-mypage" data-testid="client-mypage-page">
          <div className="mg-v2-ad-b0kla__container">
            <ContentHeader
              title={t('common.labels.myPage')}
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

        {isWithdrawalPending ? (
          <WithdrawalPendingWidget
            withdrawalExpiresAt={withdrawalStatus?.withdrawalExpiresAt}
            withdrawalRequestedAt={withdrawalStatus?.withdrawalRequestedAt}
            onCancelled={handleWithdrawalCancelled}
          />
        ) : null}

        <nav className="mg-mypage__tabs" aria-label="마이페이지 섹션">
          <SegmentedTabs
            ariaLabel="마이페이지 섹션"
            items={visibleTabs.map((tabKey) => ({
              value: tabKey,
              label: MYPAGE_TAB_LABELS[tabKey],
              id: TAB_IDS[tabKey],
              ariaControls: PANEL_IDS[tabKey],
            }))}
            activeValue={activeTab}
            onChange={setTabInUrl}
            size="md"
            className="mg-mypage__tab-list mg-v2-ad-b0kla__pill-toggle"
          />
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
                  onReloadProfile={loadUserInfo}
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
                  onRequestWithdrawal={handleOpenWithdrawalModal}
                  isWithdrawalPending={isWithdrawalPending}
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

      <WithdrawalRequestModal
        isOpen={showWithdrawalModal}
        onClose={() => setShowWithdrawalModal(false)}
        onSuccess={handleWithdrawalRequestSuccess}
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
