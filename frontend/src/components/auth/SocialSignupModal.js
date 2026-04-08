import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatPhoneNumber, isValidEmail, isValidPassword } from '../../utils/common';
import { userAPI } from '../../utils/ajax';
import notificationManager from '../../utils/notification';
import PrivacyConsentModal from '../common/PrivacyConsentModal';
import MGButton from '../common/MGButton';
import UnifiedModal from '../common/modals/UnifiedModal';
import { toDisplayString, toErrorMessage } from '../../utils/safeDisplay';
import { redirectToLoginPageOnce } from '../../utils/sessionRedirect';
import { API_BASE_URL, API_ERROR_MESSAGES, API_STATUS } from '../../constants/api';
import '../../styles/auth/social-signup-modal.css';

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
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    nickname: '',
    password: '',
    confirmPassword: '',
    phone: ''
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
        name: socialUser.name || '',
        nickname: socialUser.nickname || '',
        password: '',
        confirmPassword: '',
        phone: ''
      }));
    }
  }, [socialUser, isOpen]);

  const handlePhoneChange = (e) => {
    const value = e.target.value;
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

  const togglePassword = (field) => {
    if (field === 'password') {
      setShowPassword(!showPassword);
    } else if (field === 'confirmPassword') {
      setShowConfirmPassword(!showConfirmPassword);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email || !isValidEmail(formData.email)) {
      newErrors.email = '올바른 이메일 형식이 아닙니다.';
    }

    if (!socialUser?.needsBranchMapping) {
      if (!formData.name.trim()) {
        newErrors.name = '이름을 입력해주세요.';
      } else if (formData.name.trim().length < 2) {
        newErrors.name = '이름은 2자 이상 입력해주세요.';
      }

      if (!formData.nickname.trim()) {
        newErrors.nickname = '닉네임을 입력해주세요.';
      } else if (formData.nickname.trim().length < 2) {
        newErrors.nickname = '닉네임은 2자 이상 입력해주세요.';
      }

      const trimmedPassword = (formData.password || '').trim();
      const trimmedConfirm = (formData.confirmPassword || '').trim();

      if (!trimmedPassword) {
        newErrors.password = '비밀번호를 입력해주세요.';
      } else if (trimmedPassword.length < 8) {
        newErrors.password = '비밀번호는 8자 이상 입력해주세요.';
      } else if (!isValidPassword(trimmedPassword)) {
        newErrors.password =
          '비밀번호는 8~100자이며, 영문 대소문자·숫자·특수문자(@$!%*?&)를 각각 포함하고, 연속·동일문자 3회 반복은 사용할 수 없습니다.';
      }

      if (!trimmedConfirm) {
        newErrors.confirmPassword = '비밀번호 확인을 입력해주세요.';
      } else if (trimmedPassword !== trimmedConfirm) {
        newErrors.confirmPassword = '비밀번호가 일치하지 않습니다.';
      }

      if (!formData.phone.trim()) {
        newErrors.phone = '휴대폰 번호를 입력해주세요.';
      } else if (formData.phone.replace(/\D/g, '').length !== 11) {
        newErrors.phone = '휴대폰 번호는 11자리여야 합니다.';
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
    e.preventDefault();

    if (!privacyConsents.privacy || !privacyConsents.terms) {
      setErrors({
        privacy: '개인정보 수집 및 이용 동의와 이용약관에 동의해주세요.'
      });
      return;
    }

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const signupData = {
        provider: socialUser.provider,
        providerUserId: socialUser.providerUserId,
        providerUsername: socialUser.name || socialUser.nickname,
        email: formData.email,
        name: formData.name,
        nickname: formData.nickname,
        password: (formData.password || '').trim(),
        phone: formData.phone,
        providerProfileImage: socialUser.profileImageUrl,
        branchCode: '',
        privacyConsent: privacyConsents.privacy,
        termsConsent: privacyConsents.terms,
        marketingConsent: privacyConsents.marketing
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
        const tenantSignupResponse = await fetch(
          `${API_BASE_URL}/api/v1/auth/social/signup?tenantId=${socialUser.tenantId}`,
          {
            method: 'POST',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(signupData)
          }
        );
        const bodyJson = await parseFetchJsonBodySafe(tenantSignupResponse);
        if (!tenantSignupResponse.ok) {
          const submitFailMsg = toDisplayString(
            messageFromFetchErrorBody(bodyJson),
            statusToFallbackMessage(tenantSignupResponse.status)
          );
          setErrors({ submit: submitFailMsg });
          notificationManager.show(submitFailMsg, 'error');
          return;
        }
        response = bodyJson || {};
      } else {
        response = await userAPI.socialSignup(signupData);
      }

      if (isSocialSignupSuccess(response)) {
        if (socialUser.needsBranchMapping) {
          notificationManager.show('계정이 활성화되었습니다. 다시 로그인해주세요.', 'success');
          onClose();
          redirectToLoginPageOnce();
        } else {
          onSignupSuccess(response);
          onClose();
        }
      } else {
        const submitFailMsg = toDisplayString(
          response.message,
          '회원가입에 실패했습니다.'
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
        '회원가입 처리 중 오류가 발생했습니다.'
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

  const modalTitle = socialUser?.needsBranchMapping ? '계정 활성화' : '간편 회원가입';
  const modalSubtitle = socialUser?.needsBranchMapping
    ? '계정을 활성화합니다'
    : '소셜 계정 정보로 간편하게 가입하세요';

  const isKakao = socialUser?.provider === 'KAKAO';
  const providerKey = isKakao ? 'kakao' : 'naver';
  const providerLabel = isKakao ? '카카오' : '네이버';
  const providerAction = socialUser?.needsBranchMapping ? '계정 활성화' : '가입';

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
            aria-label={toDisplayString(`${providerLabel} 계정`)}
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
                `${providerLabel} 계정으로 ${providerAction}`
              )}
            </span>
          </section>

          <form onSubmit={handleSubmit} className="social-signup-modal__form">
            {!socialUser?.needsBranchMapping && (
              <>
                <div className="mg-v2-form-group">
                  <label htmlFor="socialName" className="mg-v2-label">
                    이름 <span className="mg-v2-form-label-required">*</span>
                  </label>
                  <input
                    type="text"
                    id="socialName"
                    name="name"
                    className={`mg-v2-input mg-v2-w-full ${errors.name ? 'social-signup-modal__input--error' : ''}`}
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    placeholder="이름을 입력하세요"
                    autoComplete="name"
                  />
                  {errors.name && (
                    <span className="social-signup-modal__error-text">
                      {toDisplayString(errors.name)}
                    </span>
                  )}
                </div>

                <div className="mg-v2-form-group">
                  <label htmlFor="socialNickname" className="mg-v2-label">
                    닉네임 <span className="mg-v2-form-label-required">*</span>
                  </label>
                  <input
                    type="text"
                    id="socialNickname"
                    name="nickname"
                    className={`mg-v2-input mg-v2-w-full ${errors.nickname ? 'social-signup-modal__input--error' : ''}`}
                    value={formData.nickname}
                    onChange={handleInputChange}
                    required
                    placeholder="닉네임을 입력하세요"
                    autoComplete="nickname"
                  />
                  {errors.nickname && (
                    <span className="social-signup-modal__error-text">
                      {toDisplayString(errors.nickname)}
                    </span>
                  )}
                </div>
              </>
            )}

            <div className="mg-v2-form-group">
              <label htmlFor="socialEmail" className="mg-v2-label">
                이메일 <span className="mg-v2-form-label-required">*</span>
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
              <>
                <div className="mg-v2-form-group">
                  <label htmlFor="socialPassword" className="mg-v2-label">
                    비밀번호 <span className="mg-v2-form-label-required">*</span>
                  </label>
                  <div className="social-signup-modal__password-wrap">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="socialPassword"
                      name="password"
                      className={`mg-v2-input mg-v2-w-full ${errors.password ? 'social-signup-modal__input--error' : ''}`}
                      value={formData.password}
                      onChange={handleInputChange}
                      required
                      minLength="8"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      className="social-signup-modal__password-toggle"
                      onClick={() => togglePassword('password')}
                      aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
                    >
                      <i className={`bi bi-${showPassword ? 'eye-slash' : 'eye'}`} aria-hidden />
                    </button>
                  </div>
                  {errors.password && (
                    <span className="social-signup-modal__error-text">
                      {toDisplayString(errors.password)}
                    </span>
                  )}
                  <span className="mg-v2-form-help">
                    8자 이상의 안전한 비밀번호를 입력하세요
                  </span>
                </div>

                <div className="mg-v2-form-group">
                  <label htmlFor="socialPasswordConfirm" className="mg-v2-label">
                    비밀번호 확인 <span className="mg-v2-form-label-required">*</span>
                  </label>
                  <div className="social-signup-modal__password-wrap">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      id="socialPasswordConfirm"
                      name="confirmPassword"
                      className={`mg-v2-input mg-v2-w-full ${errors.confirmPassword ? 'social-signup-modal__input--error' : ''}`}
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      required
                      minLength="8"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      className="social-signup-modal__password-toggle"
                      onClick={() => togglePassword('confirmPassword')}
                      aria-label={showConfirmPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
                    >
                      <i
                        className={`bi bi-${showConfirmPassword ? 'eye-slash' : 'eye'}`}
                        aria-hidden
                      />
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <span className="social-signup-modal__error-text">
                      {toDisplayString(errors.confirmPassword)}
                    </span>
                  )}
                  <span className="mg-v2-form-help">
                    비밀번호를 한 번 더 입력하세요
                  </span>
                </div>
              </>
            )}

            {!socialUser?.needsBranchMapping && (
              <div className="mg-v2-form-group">
                <label htmlFor="socialPhone" className="mg-v2-label">
                  휴대폰 번호 <span className="mg-v2-form-label-required">*</span>
                </label>
                <input
                  type="tel"
                  id="socialPhone"
                  name="phone"
                  className={`mg-v2-input mg-v2-w-full ${errors.phone ? 'social-signup-modal__input--error' : ''}`}
                  value={formData.phone}
                  onChange={handlePhoneChange}
                  required
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
                  숫자만 입력하면 자동으로 하이픈이 추가됩니다
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
                  className="social-signup-modal__consent-open"
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
                className="social-signup-modal__action-btn"
                preventDoubleClick={false}
                onClick={handleDismiss}
              >
                취소
              </MGButton>
              <MGButton
                type="button"
                variant="primary"
                className="social-signup-modal__action-btn"
                loading={isLoading}
                loadingText={socialUser?.needsBranchMapping ? '처리 중...' : '가입 중...'}
                preventDoubleClick={false}
                onClick={handleSubmit}
              >
                {socialUser?.needsBranchMapping ? '계정 활성화 완료' : '회원가입 완료'}
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
