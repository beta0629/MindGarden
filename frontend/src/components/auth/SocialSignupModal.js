import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatPhoneNumber, isValidEmail } from '../../utils/common';
import {
  isValidKoreanMobileDigits,
  normalizeKoreanMobileDigits
} from '../../utils/koreanMobilePhone';
import StandardizedApi from '../../utils/standardizedApi';
import {
  API_BASE_URL,
  API_ERROR_MESSAGES,
  API_STATUS,
  AUTH_API
} from '../../constants/api';
import notificationManager from '../../utils/notification';
import PrivacyConsentModal from '../common/PrivacyConsentModal';
import MGButton from '../common/MGButton';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../erp/common/erpMgButtonProps';
import UnifiedModal from '../common/modals/UnifiedModal';
import { toDisplayString, toErrorMessage } from '../../utils/safeDisplay';
import { redirectToLoginPageOnce } from '../../utils/sessionRedirect';
import { SOCIAL_SIGNUP_CHANNEL_HELP } from '../../constants/loginDisplay';
import '../../styles/auth/social-signup-modal.css';
import { useTranslation } from 'react-i18next';

const statusToFallbackMessage = (status) => {
  switch (status) {
    case API_STATUS.UNAUTHORIZED:
      return API_ERROR_MESSAGES.UNAUTHORIZED;
    case API_STATUS.FORBIDDEN:
      return API_ERROR_MESSAGES.FORBIDDEN;
    case API_STATUS.NOT_FOUND:
      return API_ERROR_MESSAGES.NOT_FOUND;
    case API_STATUS.INTERNAL_SERVER_ERROR:
      return API_ERROR_MESSAGES.SERVER_ERROR;
    default:
      return API_ERROR_MESSAGES.NETWORK_ERROR;
  }
};

/**
 * fetch 응답 본문을 안전하게 JSON으로 파싱한다. (HTML/빈 본문 대응)
 * @param {Response} fetchResponse
 * @returns {Promise<object|null>}
 */
const messageFromFetchErrorBody = (bodyJson) => {
  if (!bodyJson || typeof bodyJson !== 'object') {
    return '';
  }
  const nestedMsg =
    bodyJson.data && typeof bodyJson.data === 'object' ? bodyJson.data.message : '';
  return bodyJson.message || bodyJson.error || nestedMsg || '';
};

const parseFetchJsonBodySafe = async(fetchResponse) => {
  let text;
  try {
    text = await fetchResponse.text();
  } catch {
    return null;
  }
  if (!text || !String(text).trim()) {
    return null;
  }
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
};

const isSocialSignupSuccess = (payload) => {
  if (!payload || typeof payload !== 'object') {
    return false;
  }
  if (payload.success === true) {
    return true;
  }
  return payload.userId != null && Boolean(payload.email);
};

const SocialSignupModal = ({
  isOpen,
  onClose,
  socialUser,
  onSignupSuccess
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    displayName: '',
    phone: ''
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const [showPrivacyConsent, setShowPrivacyConsent] = useState(false);
  const [privacyConsents, setPrivacyConsents] = useState({
    privacy: false,
    terms: false,
    marketing: false
  });

  useEffect(() => {
    if (socialUser && isOpen) {
      setFormData((prev) => ({
        ...prev,
        email: socialUser.email || '',
        displayName: (socialUser.name || socialUser.nickname || '').trim(),
        phone: ''
      }));
    }
  }, [socialUser, isOpen]);

  const handlePhoneChange = (e) => {
    const { value } = e.target;
    const cleaned = value.replace(/\D/g, '');

    if (cleaned.length <= 13) {
      const formatted = formatPhoneNumber(cleaned);
      setFormData((prev) => ({
        ...prev,
        phone: formatted
      }));

      if (errors.phone) {
        setErrors((prev) => ({
          ...prev,
          phone: ''
        }));
      }
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email || !isValidEmail(formData.email)) {
      newErrors.email = t('auth:SocialSignupModal.t_13a1b03d');
    }

    if (!socialUser?.needsBranchMapping) {
      const dn = (formData.displayName || '').trim();
      if (!dn) {
        newErrors.displayName = t('auth:SocialSignupModal.t_1096a3f8');
      } else if (dn.length < 2) {
        newErrors.displayName = t('auth:SocialSignupModal.t_925c99e1');
      }

      const phoneDigits = normalizeKoreanMobileDigits(formData.phone);
      if (phoneDigits && !isValidKoreanMobileDigits(phoneDigits)) {
        newErrors.phone = t('auth:SocialSignupModal.t_04f28a33');
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePrivacyConsent = (consents) => {
    setPrivacyConsents(consents);
    setShowPrivacyConsent(false);
  };

  const openPrivacyConsent = () => {
    setShowPrivacyConsent(true);
  };

  const handleSummaryPrivacyChange = (e) => {
    if (e.target.checked) {
      openPrivacyConsent();
      return;
    }
    setPrivacyConsents((prev) => ({ ...prev, privacy: false, terms: false }));
  };

  const handleSummaryTermsChange = (e) => {
    if (e.target.checked) {
      openPrivacyConsent();
      return;
    }
    setPrivacyConsents((prev) => ({ ...prev, terms: false }));
  };

  const handleSummaryMarketingChange = (e) => {
    setPrivacyConsents((prev) => ({ ...prev, marketing: e.target.checked }));
  };

  const handleSubmit = async(e) => {
    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault();
    }

    if (!privacyConsents.privacy || !privacyConsents.terms) {
      setErrors({
        privacy: t('auth:SocialSignupModal.t_394bc3f4')
      });
      return;
    }

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const displayName =
        (formData.displayName || '').trim() ||
        (socialUser.name || '').trim() ||
        (socialUser.nickname || '').trim();
      const phoneDigits = normalizeKoreanMobileDigits(formData.phone);

      const signupData = {
        provider: socialUser.provider,
        providerUserId: socialUser.providerUserId,
        providerUsername: displayName || socialUser.name || socialUser.nickname,
        email: formData.email,
        name: displayName || socialUser.name || socialUser.nickname,
        nickname: displayName || socialUser.nickname || socialUser.name,
        ...(phoneDigits ? { phone: phoneDigits } : {}),
        providerProfileImage: socialUser.profileImageUrl,
        branchCode: '',
        privacyConsent: privacyConsents.privacy,
        termsConsent: privacyConsents.terms,
        marketingConsent: privacyConsents.marketing,
        agreeTerms: privacyConsents.terms,
        agreeMarketing: privacyConsents.marketing
      };

      let response;
      if (socialUser.isAcademySignup && socialUser.tenantId) {
        const academySignupResponse = await fetch(
          `${API_BASE_URL}/api/v1/academy/registration/social-signup?tenantId=${socialUser.tenantId}`,
          {
            method: 'POST',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(signupData)
          }
        );
        const bodyJson = await parseFetchJsonBodySafe(academySignupResponse);
        if (!academySignupResponse.ok) {
          const submitFailMsg = toDisplayString(
            messageFromFetchErrorBody(bodyJson),
            statusToFallbackMessage(academySignupResponse.status)
          );
          setErrors({ submit: submitFailMsg });
          notificationManager.show(submitFailMsg, 'error');
          return;
        }
        response = bodyJson || {};
      } else if (socialUser.tenantId) {
        try {
          response = await StandardizedApi.post(
            `${AUTH_API.SOCIAL_SIGNUP}?tenantId=${encodeURIComponent(socialUser.tenantId)}`,
            signupData
          );
        } catch (error) {
          const submitFailMsg = toDisplayString(
            toErrorMessage(error?.response?.data ?? error, ''),
            statusToFallbackMessage(error?.status)
          );
          setErrors({ submit: submitFailMsg });
          notificationManager.show(submitFailMsg, 'error');
          return;
        }
      } else {
        try {
          response = await StandardizedApi.post(AUTH_API.SOCIAL_SIGNUP, signupData);
        } catch (error) {
          const submitFailMsg = toDisplayString(
            toErrorMessage(error?.response?.data ?? error, ''),
            statusToFallbackMessage(error?.status)
          );
          setErrors({ submit: submitFailMsg });
          notificationManager.show(submitFailMsg, 'error');
          return;
        }
      }

      if (isSocialSignupSuccess(response)) {
        if (socialUser.needsBranchMapping) {
          notificationManager.show(t('auth:SocialSignupModal.t_2a0f1b15'), 'success');
          onClose();
          redirectToLoginPageOnce();
        } else {
          onSignupSuccess(response);
          onClose();
        }
      } else {
        const submitFailMsg = toDisplayString(
          response.message,
          t('auth:SocialSignupModal.t_e144fb1d')
        );
        setErrors({ submit: submitFailMsg });
        notificationManager.show(submitFailMsg, 'error');
      }
    } catch (error) {
      console.error('간편 회원가입 오류:', error);
      const fromThrown =
        typeof error?.message === 'string' && error.message.trim().length > 0
          ? error.message.trim()
          : '';
      const submitErrMsg = toDisplayString(
        fromThrown || toErrorMessage(error?.response?.data ?? error, ''),
        t('auth:SocialSignupModal.t_278b8500')
      );
      setErrors({ submit: submitErrMsg });
      notificationManager.show(submitErrMsg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDismiss = () => {
    onClose();
    navigate('/login');
  };

  const modalTitle = socialUser?.needsBranchMapping ? '계정 활성화' : t('auth:SocialSignupModal.t_5a98d720');
  const modalSubtitle = socialUser?.needsBranchMapping
    ? '계정을 활성화합니다'
    : t('auth:SocialSignupModal.t_3f220312');

  const isKakao = socialUser?.provider === 'KAKAO';
  const providerKey = isKakao ? 'kakao' : 'naver';
  const providerLabel = isKakao ? '카카오' : t('auth:SocialSignupModal.t_4c2122fb');
  const providerAction = socialUser?.needsBranchMapping ? '계정 활성화' : t('auth:SocialSignupModal.t_8b92576f');

  return (
    <>
      <UnifiedModal
        isOpen={isOpen}
        onClose={handleDismiss}
        title={modalTitle}
        subtitle={modalSubtitle}
        size="medium"
        variant="form"
        backdropClick
        showCloseButton
      >
        <div className="social-signup-modal">
          <section
            className="social-signup-modal__provider"
            aria-label={toDisplayString(t('auth:SocialSignupModal.t_58fd029d'))}
          >
            <span
              className="social-signup-modal__provider-badge"
              data-provider={providerKey}
            >
              <i
                className={`bi bi-${isKakao ? 'chat-dots-fill' : 'chat-square-fill'} social-signup-modal__provider-icon`}
                aria-hidden
              />
            </span>
            <span className="social-signup-modal__provider-name">
              {toDisplayString(
                t('auth:SocialSignupModal.t_3bfa55ba')
              )}
            </span>
          </section>

          <form onSubmit={handleSubmit} className="social-signup-modal__form">
            {!socialUser?.needsBranchMapping && (
              <div className="mg-v2-form-group">
                <label htmlFor="socialDisplayName" className="mg-v2-label">
                  이름(표시명) <span className="mg-v2-form-label-required">*</span>
                </label>
                <input
                  type="text"
                  id="socialDisplayName"
                  name="displayName"
                  className={`mg-v2-input mg-v2-w-full ${errors.displayName ? 'social-signup-modal__input--error' : ''}`}
                  value={formData.displayName}
                  onChange={handleInputChange}
                  required
                  placeholder="닉네임 또는 이름"
                  autoComplete="name"
                />
                {errors.displayName && (
                  <span className="social-signup-modal__error-text">
                    {toDisplayString(errors.displayName)}
                  </span>
                )}
                <span className="mg-v2-form-help">
                  {SOCIAL_SIGNUP_CHANNEL_HELP}
                </span>
              </div>
            )}

            <div className="mg-v2-form-group">
              <label htmlFor="socialEmail" className="mg-v2-label">
                {t('common.labels.email')} <span className="mg-v2-form-label-required">*</span>
              </label>
              <input
                type="email"
                id="socialEmail"
                name="email"
                className={`mg-v2-input mg-v2-w-full ${errors.email ? 'social-signup-modal__input--error' : ''}`}
                value={formData.email}
                readOnly
                disabled
                autoComplete="email"
              />
              {errors.email && (
                <span className="social-signup-modal__error-text">
                  {toDisplayString(errors.email)}
                </span>
              )}
              <span className="mg-v2-form-help">
                소셜 계정의 이메일이 자동으로 입력됩니다
              </span>
            </div>

            {!socialUser?.needsBranchMapping && (
              <div className="mg-v2-form-group">
                <label htmlFor="socialPhone" className="mg-v2-label">
                  휴대폰 번호 (선택)
                </label>
                <input
                  type="tel"
                  id="socialPhone"
                  name="phone"
                  className={`mg-v2-input mg-v2-w-full ${errors.phone ? 'social-signup-modal__input--error' : ''}`}
                  value={formData.phone}
                  onChange={handlePhoneChange}
                  maxLength="13"
                  placeholder="010-0000-0000"
                  autoComplete="tel"
                />
                {errors.phone && (
                  <span className="social-signup-modal__error-text">
                    {toDisplayString(errors.phone)}
                  </span>
                )}
                <span className="mg-v2-form-help">
                  입력 시 11자리 휴대폰 번호 형식이어야 합니다. 비워 두면 가입 시 수집하지 않습니다.
                </span>
              </div>
            )}

            <div className="mg-v2-form-group">
              <div className="social-signup-modal__consent-block">
                <h3 className="social-signup-modal__consent-heading">
                  <i className="bi bi-shield-check" aria-hidden />
                  개인정보 수집 및 이용 동의
                </h3>

                <div className="social-signup-modal__consent-list">
                  <label className="mg-v2-form-checkbox">
                    <input
                      type="checkbox"
                      checked={privacyConsents.privacy}
                      onChange={handleSummaryPrivacyChange}
                    />
                    <span>
                      개인정보 처리방침 동의{' '}
                      <span className="mg-v2-form-label-required">*</span>
                    </span>
                  </label>

                  <label className="mg-v2-form-checkbox">
                    <input
                      type="checkbox"
                      checked={privacyConsents.terms}
                      onChange={handleSummaryTermsChange}
                    />
                    <span>
                      이용약관 동의{' '}
                      <span className="mg-v2-form-label-required">*</span>
                    </span>
                  </label>

                  <label className="mg-v2-form-checkbox">
                    <input
                      type="checkbox"
                      checked={privacyConsents.marketing}
                      onChange={handleSummaryMarketingChange}
                    />
                    <span>마케팅 정보 수신 동의 (선택)</span>
                  </label>
                </div>

                <MGButton
                  type="button"
                  variant="outline"
                  fullWidth
                  preventDoubleClick={false}
                  onClick={openPrivacyConsent}
                  className={`${buildErpMgButtonClassName({ variant: 'outline', size: 'md', loading: false })} social-signup-modal__consent-open`}
                  loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                >
                  <i className="bi bi-file-text" aria-hidden="true" />
                  약관 전문 보기 및 동의
                </MGButton>

                {errors.privacy && (
                  <div className="social-signup-modal__error-text" role="alert">
                    <i className="bi bi-exclamation-triangle" aria-hidden />
                    <span>{toDisplayString(errors.privacy)}</span>
                  </div>
                )}
              </div>
            </div>

            {errors.submit && (
              <div className="social-signup-modal__error-banner" role="alert">
                <i className="bi bi-exclamation-triangle" aria-hidden />
                <span>{toDisplayString(errors.submit)}</span>
              </div>
            )}

            <div className="social-signup-modal__actions">
              <MGButton
                type="button"
                variant="secondary"
                className={`${buildErpMgButtonClassName({ variant: 'secondary', size: 'md', loading: false })} social-signup-modal__action-btn`}
                loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                preventDoubleClick={false}
                onClick={handleDismiss}
              >
                {t('common.actions.cancel')}
              </MGButton>
              <MGButton
                type="button"
                variant="primary"
                className={`${buildErpMgButtonClassName({ variant: 'primary', size: 'md', loading: isLoading })} social-signup-modal__action-btn`}
                loading={isLoading}
                loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                preventDoubleClick={false}
                onClick={handleSubmit}
              >
                {socialUser?.needsBranchMapping ? '계정 활성화 완료' : t('auth:SocialSignupModal.t_59e75cc1')}
              </MGButton>
            </div>
          </form>
        </div>
      </UnifiedModal>

      <PrivacyConsentModal
        isOpen={showPrivacyConsent}
        onClose={() => setShowPrivacyConsent(false)}
        onConsent={handlePrivacyConsent}
        title="개인정보 수집 및 이용 동의"
        showMarketingConsent={true}
      />
    </>
  );
};

export default SocialSignupModal;
