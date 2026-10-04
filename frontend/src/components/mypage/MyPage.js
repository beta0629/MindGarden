import { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { sessionManager } from '../../utils/sessionManager';
import { withFormSubmit } from '../../utils/formSubmitWrapper';
import mypageApi from '../../utils/mypageApi';
import {
  isConsultantUserProfileRole,
  isOperatorCounselingDualRole,
  getMypageRoleDisplayLabel,
  resolveMypageCenterName
} from '../../constants/mypageProfileRoles';
import {
  mapProfileImageToSessionFields,
  mapProfileLoadResponseToForm,
  normalizeProfileFormNameField,
  pickSessionProfileNameForForm,
  resolveProfileImageFromApiResponse
} from '../../utils/mypageProfilePayload';
import notificationManager from '../../utils/notification';
import { resolveSessionUserId } from '../../utils/sessionUserIdentity';
import useUserIdScopedLoad from '../../hooks/useUserIdScopedLoad';
import ConfirmModal from '../common/ConfirmModal';
import UnifiedLoading from '../common/UnifiedLoading';
import AdminCommonLayout from '../layout/AdminCommonLayout';
import ClientWebPageShell from '../client/ClientWebPageShell';
import { ContentArea } from '../dashboard-v2/content';
import ErpPageShell from '../erp/shell/ErpPageShell';
import { useSession } from '../../contexts/SessionContext';
import { RoleUtils } from '../../constants/roles';
import ProfileSection, { PROFILE_OWNED_SECTIONS, getProfileAvatarSrc } from './components/ProfileSection';
import PrivacyConsentSection from './components/PrivacyConsentSection';
import SettingsSection from './components/SettingsSection';
import SecuritySection from './components/SecuritySection';
import SocialAccountsSection from './components/SocialAccountsSection';
import AccountManagementSection from './components/AccountManagementSection';
import ClientNotificationToggles from './components/ClientNotificationToggles';
import PasswordResetModal from './components/PasswordResetModal';
import PasswordChangeModal from './components/PasswordChangeModal';
import WithdrawalRequestModal from './components/WithdrawalRequestModal';
import WithdrawalPendingWidget from './components/WithdrawalPendingWidget';
import MypageQuietHeader from './shell/MypageQuietHeader';
import MypageLayout from './layout/MypageLayout';
import MypageAccountCard from './layout/MypageAccountCard';
import MypageRoleLinks from './layout/MypageRoleLinks';
import MypageSectionIndex from './layout/MypageSectionIndex';
import {
  MYPAGE_TITLE_ID,
  getSocialProviderLabel,
  MYPAGE_SOCIAL_LINK_DEFAULT_ERROR,
  MYPAGE_SOCIAL_LINK_DEFAULT_SUCCESS
} from '../../constants/mypageUi';
import {
  MYPAGE_SECTION_KEYS,
  MYPAGE_FEATURE_READY,
  MYPAGE_LAYOUT_COPY,
  MYPAGE_ROLE_LAYOUT_KEYS,
  MYPAGE_SOCIAL_PROVIDER_LABELS,
  resolveMypageRoleLayout,
  resolveMypageScrollTarget
} from '../../constants/mypageRoleLayout';
import { CLIENT_SHOP_ROUTES } from '../../constants/clientShopConstants';
import { fetchShopCart } from '../../services/clientShopService';
import { sumCartLineQuantities } from '../../utils/guestShopCart';
import { readReturnToFromSearch } from '../../utils/clientSettingsReturnTo';
import { formatPhoneNumber } from '../../utils/common';
import '../../styles/unified-design-tokens.css';
import '../../styles/tokens/design-v2-tokens.css';
import './MyPageClinicOs.css';
import { useTranslation } from 'react-i18next';
import i18n from '../../i18n';

const MYPAGE_PAGE_TEST_ID = 'client-mypage-page';
const MYPAGE_MAIN_ARIA = '마이페이지 본문';

const MyPage = () => {
  const { t } = useTranslation();
  const { user: sessionUser } = useSession();
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [localUser, setLocalUser] = useState(null);
  const [activeEditSection, setActiveEditSection] = useState(null);
  const [socialAccounts, setSocialAccounts] = useState([]);
  const [showPasswordResetModal, setShowPasswordResetModal] = useState(false);
  const [showPasswordChangeModal, setShowPasswordChangeModal] = useState(false);
  const [socialUnlinkTarget, setSocialUnlinkTarget] = useState(null);
  const [showLogoutOtherConfirm, setShowLogoutOtherConfirm] = useState(false);
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  const [withdrawalStatus, setWithdrawalStatus] = useState(null);
  const [cartQty, setCartQty] = useState(null);
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

  // P0 hotfix 2026-06-12: SessionContext.user 우선 사용. sessionManager.checkSession(true) 호출 회피.
  // 마이페이지 진입 시 loadUserInfo / loadSocialAccounts / loadWithdrawalStatus 가 동시에 호출되어
  // resolveMypageSessionUser → checkSession(true) 가 중복 발생, current-user 호출이 N배 증폭되던 문제 차단.
  // sessionManager 자체에도 in-flight dedup 이 추가되었으므로 안전망은 이중.
  // sessionUser 는 ref 로 읽는다. silent checkSession 이 같은 사용자를 새 객체로 넣어도 로더 identity 가
  // 바뀌지 않아야 진입 로드(프로필·소셜 계정)가 두 번 돌지 않는다. 재로드 기준은 userId 뿐이다.
  const sessionUserRef = useRef(sessionUser);
  sessionUserRef.current = sessionUser;

  const resolveMypageSessionUser = useCallback(async() => {
    let resolved = sessionUserRef.current || sessionManager.getUser();
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
    resolved = sessionManager.getUser() || sessionUserRef.current;
    return resolved || null;
  }, []);

  const loadUserInfo = useCallback(async() => {
    try {
      const currentUser = await resolveMypageSessionUser();
      if (!currentUser) {
        throw new Error(i18n.t('error:mypage.MyPage.t_2f7f087b'));
      }

      const counselingEnabled = Boolean(
        currentUser.counselingEnabled ?? sessionUserRef.current?.counselingEnabled
      );

      const response = await mypageApi.getProfileInfo(currentUser.role, currentUser.id, {
        counselingEnabled
      });

      if (response) {
        const mergedUser = {
          ...currentUser,
          ...response,
          counselingEnabled: counselingEnabled || response.counselingEnabled
        };
        setUser(mergedUser);
        const mapped = mapProfileLoadResponseToForm(currentUser.role, response, mergedUser);
        if (mapped) {
          setFormData(normalizeProfileFormNameField({
            ...mapped,
            counselingEnabled: mergedUser.counselingEnabled
          }));
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
  const roleLayout = resolveMypageRoleLayout(displayUser);
  const isClientLayout = roleLayout.key === MYPAGE_ROLE_LAYOUT_KEYS.CLIENT;

  const mypageUserId = resolveSessionUserId(sessionUser)
    ?? resolveSessionUserId(sessionManager.getUser())
    ?? resolveSessionUserId(localUser);
  useUserIdScopedLoad({
    userId: mypageUserId,
    loadFn: () => Promise.all([loadUserInfo(), loadSocialAccounts()])
  });

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

  const scrollToSection = useCallback((sectionKey) => {
    const target = sectionKey ? document.getElementById(sectionKey) : null;
    if (target && typeof target.scrollIntoView === 'function') {
      target.scrollIntoView({ block: 'start' });
      return;
    }
    if (typeof window.scrollTo === 'function') {
      window.scrollTo({ top: 0 });
    }
  }, []);

  // ?tab= (구 탭 딥링크) · #섹션 → 해당 섹션으로 스크롤. 없으면 맨 위.
  // 결제 화면의 휴대폰 인증 복귀(returnTo)는 휴대폰 행이 있는 기본 정보로.
  const hasClientReturnTo = isClientLayout && Boolean(readReturnToFromSearch(location.search));
  const scrollTarget = hasClientReturnTo
    ? MYPAGE_SECTION_KEYS.BASIC
    : resolveMypageScrollTarget({
      tab: searchParams.get('tab'),
      hash: location.hash,
      sections: roleLayout.sections
    });
  const scrolledTargetRef = useRef('');
  const sectionsReady = Boolean(user);
  useEffect(() => {
    if (!sectionsReady || !scrollTarget || scrolledTargetRef.current === scrollTarget) {
      return;
    }
    scrolledTargetRef.current = scrollTarget;
    scrollToSection(scrollTarget);
  }, [sectionsReady, scrollTarget, scrollToSection]);

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

  // 내담자 헤더 장바구니 뱃지 — 기존 장바구니 조회(GET)만 사용
  useEffect(() => {
    if (!isClientLayout) {
      return undefined;
    }
    let cancelled = false;
    const loadCartQty = async() => {
      try {
        const cart = await fetchShopCart();
        if (!cancelled) {
          setCartQty(sumCartLineQuantities(cart?.lines));
        }
      } catch {
        if (!cancelled) {
          setCartQty(null);
        }
      }
    };
    loadCartQty();
    return () => {
      cancelled = true;
    };
  }, [isClientLayout]);

  const handleSubmit = withFormSubmit(async(e, formDataToUpdate) => {
    if (e && e.preventDefault) {
      e.preventDefault();
    }

    const dataToUpdate = normalizeProfileFormNameField({ ...(formDataToUpdate || formData) });
    const currentUser = sessionManager.getUser() || sessionUser;
    if (!currentUser) {
      throw new Error(i18n.t('error:mypage.MyPage.t_2f7f087b'));
    }

    const response = await mypageApi.updateProfileInfo(
      currentUser.role,
      currentUser.id,
      dataToUpdate,
      {
        counselingEnabled: dataToUpdate.counselingEnabled ?? currentUser.counselingEnabled
      }
    );

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
        addressDetail: response.addressDetail ?? dataToUpdate.addressDetail,
        memo: response.memo ?? dataToUpdate.memo,
        specialty: response.specialty ?? dataToUpdate.specialty,
        qualifications: response.qualifications ?? dataToUpdate.qualifications,
        experience: response.experience ?? dataToUpdate.experience,
        availableTime: response.availableTime ?? dataToUpdate.availableTime,
        detailedIntroduction: response.detailedIntroduction ?? dataToUpdate.detailedIntroduction,
        education: response.education ?? dataToUpdate.education,
        awards: response.awards ?? dataToUpdate.awards,
        research: response.research ?? dataToUpdate.research
      };
    } else if (isOperatorCounselingDualRole(currentUser) && response) {
      dataAfterSave = {
        ...dataAfterSave,
        memo: response.memo ?? dataToUpdate.memo,
        specialty: response.specialty ?? dataToUpdate.specialty,
        qualifications: response.qualifications ?? dataToUpdate.qualifications,
        experience: response.experience ?? dataToUpdate.experience,
        availableTime: response.availableTime ?? dataToUpdate.availableTime,
        detailedIntroduction: response.detailedIntroduction ?? dataToUpdate.detailedIntroduction,
        education: response.education ?? dataToUpdate.education,
        awards: response.awards ?? dataToUpdate.awards,
        research: response.research ?? dataToUpdate.research
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
    const providerName = MYPAGE_SOCIAL_PROVIDER_LABELS[provider] || provider;
    try {
      notificationManager.show(`${providerName} 계정 연동을 시작합니다.`, 'info');
      const oauthUrl = await mypageApi.getOAuth2Url(provider);
      notificationManager.show(`${providerName}에서 권한을 승인해주세요.`, 'system');
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

  // 구 /client/settings?returnTo= (결제 화면 휴대폰 인증) — 인증 성공 후 원래 화면으로
  const handlePhoneChanged = useCallback(async() => {
    const returnTo = isClientLayout ? readReturnToFromSearch(location.search) : '';
    if (!returnTo) {
      return;
    }
    try {
      await sessionManager.checkSession(true);
    } catch (error) {
      console.warn('휴대폰 인증 후 세션 갱신 실패 — 원래 화면으로 이동:', error);
    }
    navigate(returnTo, { replace: true });
  }, [isClientLayout, location.search, navigate]);

  if (!displayUser) {
    if (RoleUtils.isClient(sessionUser)) {
      return (
        <ClientWebPageShell title={MYPAGE_LAYOUT_COPY.TITLE} titleId={MYPAGE_TITLE_ID}>
          <div aria-busy="true" aria-live="polite">
            <UnifiedLoading type="inline" text={MYPAGE_LAYOUT_COPY.LOADING} />
          </div>
        </ClientWebPageShell>
      );
    }
    return (
      <AdminCommonLayout
        title={t('common.labels.myPage')}
        className="mg-v2-dashboard-layout"
        loading
        loadingText={MYPAGE_LAYOUT_COPY.LOADING}
      />
    );
  }

  const profileSectionKeys = roleLayout.sections.filter((key) => PROFILE_OWNED_SECTIONS.includes(key));
  const displayName = pickSessionProfileNameForForm(displayUser) || formData.nickname || '';

  const sectionRenderers = {
    [MYPAGE_SECTION_KEYS.SECURITY]: () => (
      <SecuritySection
        key={MYPAGE_SECTION_KEYS.SECURITY}
        onPasswordChange={handlePasswordChange}
        onPasswordReset={handlePasswordReset}
        onRequestLogoutOtherDevices={() => setShowLogoutOtherConfirm(true)}
      />
    ),
    [MYPAGE_SECTION_KEYS.SOCIAL]: () => (
      <SocialAccountsSection
        key={MYPAGE_SECTION_KEYS.SOCIAL}
        socialAccounts={socialAccounts}
        onLinkAccount={handleLinkSocialAccount}
        onUnlinkAccount={requestUnlinkSocial}
      />
    ),
    [MYPAGE_SECTION_KEYS.PRIVACY]: () => (
      <PrivacyConsentSection
        key={MYPAGE_SECTION_KEYS.PRIVACY}
        editDisabled={activeEditSection != null}
      />
    ),
    [MYPAGE_SECTION_KEYS.ACCOUNT]: () => (
      <AccountManagementSection
        key={MYPAGE_SECTION_KEYS.ACCOUNT}
        onRequestWithdrawal={handleOpenWithdrawalModal}
        isWithdrawalPending={isWithdrawalPending}
        withdrawalStatus={withdrawalStatus}
        onWithdrawalCancelled={handleWithdrawalCancelled}
      />
    )
  };

  const renderSection = (key) => {
    if (PROFILE_OWNED_SECTIONS.includes(key)) {
      if (key !== profileSectionKeys[0]) {
        return null;
      }
      return (
        <ProfileSection
          key="profile-sections"
          user={user}
          displayUser={displayUser}
          formData={formData}
          onFormDataChange={setFormData}
          onUserChange={setUser}
          onSave={handleSubmit}
          onReloadProfile={loadUserInfo}
          onPhoneChanged={handlePhoneChanged}
          formatPhoneNumber={formatPhoneNumber}
          sections={profileSectionKeys}
          hideFields={roleLayout.hideFields}
          activeEditSection={activeEditSection}
          onEditSectionChange={setActiveEditSection}
          notifyExtra={isClientLayout ? <ClientNotificationToggles /> : null}
        />
      );
    }
    const render = sectionRenderers[key];
    return render ? render() : null;
  };

  const pendingNotice = isWithdrawalPending && !roleLayout.sections.includes(MYPAGE_SECTION_KEYS.ACCOUNT)
    ? (
      <WithdrawalPendingWidget
        withdrawalExpiresAt={withdrawalStatus?.withdrawalExpiresAt}
        withdrawalRequestedAt={withdrawalStatus?.withdrawalRequestedAt}
        onCancelled={handleWithdrawalCancelled}
      />
    )
    : null;

  const layoutNode = (
    <MypageLayout
      mode={roleLayout.layout}
      surface={roleLayout.surface}
      roleKey={roleLayout.key}
      notice={pendingNotice}
      account={(
        <MypageAccountCard
          displayName={displayName}
          centerName={resolveMypageCenterName(displayUser)}
          roleLabel={getMypageRoleDisplayLabel(displayUser)}
          avatarSrc={getProfileAvatarSrc(formData)}
        />
      )}
      links={(
        <MypageRoleLinks
          title={roleLayout.linksTitle}
          landing={roleLayout.linksLanding}
          links={roleLayout.links}
        />
      )}
      index={<MypageSectionIndex sections={roleLayout.sections} onNavigate={scrollToSection} />}
    >
      {roleLayout.sections.map(renderSection)}
      {MYPAGE_FEATURE_READY.SETTINGS ? <SettingsSection /> : null}
    </MypageLayout>
  );

  const modals = (
    <>
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

      {MYPAGE_FEATURE_READY.LOGOUT_OTHER_DEVICES ? (
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
      ) : null}
    </>
  );

  if (isClientLayout) {
    return (
      <ClientWebPageShell
        title={MYPAGE_LAYOUT_COPY.TITLE}
        titleId={MYPAGE_TITLE_ID}
        aside={null}
        cartBadgeQty={cartQty}
        cartHref={CLIENT_SHOP_ROUTES.CART}
      >
        <div className="mg-mypage-page" data-testid={MYPAGE_PAGE_TEST_ID}>
          {layoutNode}
        </div>
        {modals}
      </ClientWebPageShell>
    );
  }

  return (
    <AdminCommonLayout title={t('common.labels.myPage')} className="mg-v2-dashboard-layout">
      <ContentArea ariaLabel={MYPAGE_LAYOUT_COPY.TITLE}>
        <div className="mg-mypage-page" data-testid={MYPAGE_PAGE_TEST_ID}>
          <ErpPageShell headerSlot={<MypageQuietHeader />} mainAriaLabel={MYPAGE_MAIN_ARIA}>
            {layoutNode}
          </ErpPageShell>
        </div>
      </ContentArea>
      {modals}
    </AdminCommonLayout>
  );
};

export default MyPage;
