import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiGet } from '../../utils/ajax';
import csrfTokenManager from '../../utils/csrfTokenManager';
import notificationManager from '../../utils/notification';
import UnifiedModal from '../common/modals/UnifiedModal';
import { TermsOfServiceContent } from '../common/TermsOfService';
import { PrivacyPolicyContent } from '../common/PrivacyPolicy';
import '../common/PrivacyPolicy.css';
import './AuthPageCommon.css';

/** 주민번호 7번째 자리로 성별 코드 반환 (1,3: 남성 / 2,4: 여성 / 그 외: 기타) */
const GENDER_FROM_RRN = {
  '1': 'MALE',
  '3': 'MALE',
  '2': 'FEMALE',
  '4': 'FEMALE'
};
const GENDER_LABEL = { MALE: '남성', FEMALE: '여성', OTHER: '기타' };

/** 이메일 입력 시 제안할 도메인 목록 (클릭하면 입력란에 적용) */
const EMAIL_DOMAINS = ['@gmail.com', '@naver.com', '@daum.net', '@kakao.com', '@hanmail.net', '@nate.com', '@yahoo.co.kr', '@outlook.com'];

const TabletRegister = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    gender: '',
    rrnFirst6: '',
    rrnLast1: '',
    agreeTerms: false,
    agreePrivacy: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [emailCheckStatus, setEmailCheckStatus] = useState(null); // 'checking' | 'duplicate' | 'available' | null
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [emailSuggestionsOpen, setEmailSuggestionsOpen] = useState(false);
  const [termsModalOpen, setTermsModalOpen] = useState(false);
  const [privacyModalOpen, setPrivacyModalOpen] = useState(false);

  useEffect(() => {
    getOAuth2Config();
  }, []);

  const getOAuth2Config = async () => {
    try {
      const response = await fetch('/api/v1/auth/config/oauth2');
      if (response.ok) {
        // OAuth2 설정 사용 시 활용
      }
    } catch (error) {
      console.error('OAuth2 설정을 가져오는데 실패했습니다:', error);
    }
  };

  /** 이메일 중복 여부만 API로 확인. true: 중복, false: 사용가능, 예외 시 null */
  const checkEmailDuplicate = async (email) => {
    const trimmed = email?.trim();
    if (!trimmed) return null;
    try {
      const response = await apiGet(`/api/v1/auth/duplicate-check/email?email=${encodeURIComponent(trimmed)}`);
      if (response && typeof response.isDuplicate === 'boolean') {
        return response.isDuplicate;
      }
      return null;
    } catch (error) {
      console.error('이메일 중복 확인 오류:', error);
      return null;
    }
  };

  const handleEmailDuplicateCheck = async () => {
    const email = formData.email?.trim();
    if (!email) {
      notificationManager.show('이메일을 입력해주세요.', 'warning');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      notificationManager.show('올바른 이메일 형식을 입력해주세요.', 'warning');
      return;
    }

    setIsCheckingEmail(true);
    setEmailCheckStatus('checking');
    try {
      const isDuplicate = await checkEmailDuplicate(email);
      if (isDuplicate === true) {
        setEmailCheckStatus('duplicate');
        notificationManager.show('이미 사용 중인 이메일입니다.', 'error');
      } else if (isDuplicate === false) {
        setEmailCheckStatus('available');
        notificationManager.show('사용 가능한 이메일입니다.', 'success');
      } else {
        setEmailCheckStatus(null);
        notificationManager.show('이메일 중복 확인 중 오류가 발생했습니다.', 'error');
      }
    } finally {
      setIsCheckingEmail(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    let nextValue = type === 'checkbox' ? checked : value;
    if (name === 'rrnFirst6') {
      nextValue = value.replaceAll(/\D/g, '').slice(0, 6);
    } else if (name === 'rrnLast1') {
      nextValue = value.replaceAll(/\D/g, '').slice(0, 1);
    }

    setFormData(prev => {
      const next = { ...prev, [name]: nextValue };
      if (name === 'rrnLast1' && nextValue.length === 1) {
        next.gender = GENDER_FROM_RRN[nextValue] || 'OTHER';
      }
      return next;
    });

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    if (name === 'email') {
      setEmailCheckStatus(null);
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

    if (!formData.name.trim()) {
      newErrors.name = '이름을 입력해주세요.';
    }

    if (!formData.email.trim()) {
      newErrors.email = '이메일을 입력해주세요.';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = '올바른 이메일 형식을 입력해주세요.';
    }

    if (!formData.password) {
      newErrors.password = '비밀번호를 입력해주세요.';
    } else if (formData.password.length < 8) {
      newErrors.password = '비밀번호는 8자 이상이어야 합니다.';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = '비밀번호 확인을 입력해주세요.';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = '비밀번호가 일치하지 않습니다.';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = '휴대폰 번호를 입력해주세요.';
    }

    if (formData.rrnFirst6.length !== 6 || !/^\d{6}$/.test(formData.rrnFirst6)) {
      newErrors.rrnFirst6 = '주민번호 앞 6자리를 입력해주세요.';
    }
    if (formData.rrnLast1.length !== 1 || !/^\d$/.test(formData.rrnLast1)) {
      newErrors.rrnLast1 = '주민번호 뒤 1자리를 입력해주세요.';
    }

    if (!formData.agreeTerms) {
      newErrors.agreeTerms = '이용약관에 동의해주세요.';
    }

    if (!formData.agreePrivacy) {
      newErrors.agreePrivacy = '개인정보처리방침에 동의해주세요.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (emailCheckStatus !== 'available') {
      const isDuplicate = await checkEmailDuplicate(formData.email);
      if (isDuplicate === true) {
        setEmailCheckStatus('duplicate');
        notificationManager.show('이미 사용 중인 이메일입니다. 이메일 중복확인을 해주세요.', 'error');
        return;
      }
      if (isDuplicate === false) {
        setEmailCheckStatus('available');
      } else {
        notificationManager.show('이메일 중복 확인 중 오류가 발생했습니다.', 'error');
        return;
      }
    }

    setIsLoading(true);

    try {
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        phone: formData.phone.trim(),
        gender: formData.gender || 'OTHER',
        agreeTerms: formData.agreeTerms,
        agreePrivacy: formData.agreePrivacy
      };
      const response = await csrfTokenManager.post('/api/v1/auth/register', payload);

      if (response.ok) {
        await response.json();
        notificationManager.show('회원가입이 완료되었습니다!', 'info');
        navigate('/login');
      } else {
        const error = await response.json();
        notificationManager.show(error.message || '회원가입에 실패했습니다.', 'error');
      }
    } catch (error) {
      console.error('회원가입 오류:', error);
      notificationManager.show('회원가입 중 오류가 발생했습니다.', 'info');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mg-v2-auth-container">
      <div className="mg-v2-auth-hero">
        <div className="mg-v2-auth-hero-content">
          <h1 className="mg-v2-auth-hero-logo">CoreSolution</h1>
          <p className="mg-v2-auth-hero-slogan">비즈니스의 핵심을 솔루션하다</p>
        </div>
      </div>

      <div className="mg-v2-auth-content">
        <div className="mg-v2-auth-form-wrapper">
          <div>
            <h2 className="mg-v2-auth-title">회원가입</h2>
            <p className="mg-v2-auth-subtitle">CoreSolution 서비스 이용을 위해 정보를 입력해주세요.</p>
          </div>

          <form onSubmit={handleSubmit} className="mg-v2-auth-form">
            <div className="mg-v2-form-group">
              <label htmlFor="name" className="mg-v2-form-label">이름 *</label>
              <input
                type="text"
                id="name"
                name="name"
                className={`mg-v2-form-input ${errors.name ? 'mg-v2-input error' : ''}`}
                placeholder="이름을 입력하세요"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
              {errors.name && <span className="mg-v2-error-text">{errors.name}</span>}
            </div>

            <div className="mg-v2-form-row">
              <div className="mg-v2-form-group">
                <label htmlFor="rrnFirst6" className="mg-v2-form-label">주민번호 앞 6자리</label>
                <input
                  type="text"
                  id="rrnFirst6"
                  name="rrnFirst6"
                  inputMode="numeric"
                  maxLength={6}
                  className={`mg-v2-form-input ${errors.rrnFirst6 ? 'mg-v2-input error' : ''}`}
                  placeholder="900101"
                  value={formData.rrnFirst6}
                  onChange={handleInputChange}
                />
                {errors.rrnFirst6 && <span className="mg-v2-error-text">{errors.rrnFirst6}</span>}
              </div>
              <div className="mg-v2-form-group">
                <label htmlFor="rrnLast1" className="mg-v2-form-label">주민번호 뒤 1자리</label>
                <input
                  type="text"
                  id="rrnLast1"
                  name="rrnLast1"
                  inputMode="numeric"
                  maxLength={1}
                  className={`mg-v2-form-input ${errors.rrnLast1 ? 'mg-v2-input error' : ''}`}
                  placeholder="1"
                  value={formData.rrnLast1}
                  onChange={handleInputChange}
                />
                {errors.rrnLast1 && <span className="mg-v2-error-text">{errors.rrnLast1}</span>}
              </div>
            </div>

            <div className="mg-v2-form-group">
              <span className="mg-v2-form-label">성별</span>
              <p className="mg-v2-form-readonly">
                성별: {formData.gender ? GENDER_LABEL[formData.gender] : '주민번호 뒤 1자리 입력 시 자동 표시'}
              </p>
            </div>

            <div className="mg-v2-form-group" style={{ position: 'relative' }}>
              <label htmlFor="email" className="mg-v2-form-label">이메일 *</label>
              <div className="mg-v2-form-email-row">
                <div style={{ position: 'relative', flex: 1, minWidth: 0 }}>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    autoComplete="email"
                    className={`mg-v2-form-input ${errors.email ? 'mg-v2-input error' : ''}`}
                    placeholder="이메일을 입력하세요"
                    value={formData.email}
                    onChange={handleInputChange}
                    onFocus={() => setEmailSuggestionsOpen(true)}
                    onBlur={() => {
                      setTimeout(() => setEmailSuggestionsOpen(false), 150);
                      const email = formData.email?.trim();
                      if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                        handleEmailDuplicateCheck();
                      }
                    }}
                    required
                  />
                  {emailSuggestionsOpen && (
                    <ul
                      className="mg-v2-email-suggestions"
                      role="listbox"
                      aria-label="이메일 도메인 제안"
                      id="email-suggestions-listbox"
                    >
                      {EMAIL_DOMAINS.map((domain) => {
                        const prefix = formData.email?.includes('@')
                          ? formData.email.slice(0, formData.email.indexOf('@')).trim() || 'example'
                          : (formData.email?.trim() || 'example');
                        const fullEmail = prefix + domain;
                        return (
                          <li
                            key={domain}
                            role="option"
                            aria-selected="false"
                            className="mg-v2-email-suggestion-item"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              setFormData((prev) => ({ ...prev, email: fullEmail }));
                              setEmailCheckStatus(null);
                              setEmailSuggestionsOpen(false);
                            }}
                          >
                            {fullEmail}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleEmailDuplicateCheck}
                  disabled={isCheckingEmail || !formData.email?.trim()}
                  className="mg-v2-button mg-v2-button-secondary mg-v2-auth-email-check-btn"
                >
                  {isCheckingEmail ? '확인 중...' : '중복확인'}
                </button>
              </div>
              {emailCheckStatus === 'duplicate' && (
                <small className="mg-v2-form-help mg-v2-form-help--error">이미 사용 중인 이메일입니다.</small>
              )}
              {emailCheckStatus === 'available' && (
                <small className="mg-v2-form-help mg-v2-form-help--success">사용 가능한 이메일입니다.</small>
              )}
              {errors.email && <span className="mg-v2-error-text">{errors.email}</span>}
            </div>

            <div className="mg-v2-form-row">
              <div className="mg-v2-form-group">
                <label htmlFor="password" className="mg-v2-form-label">비밀번호 *</label>
                <div className="mg-v2-password-wrapper">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    className={`mg-v2-form-input ${errors.password ? 'mg-v2-input error' : ''}`}
                    placeholder="8자 이상 입력하세요"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    minLength="8"
                  />
                  <button
                    type="button"
                    className="mg-v2-password-toggle"
                    onClick={() => togglePassword('password')}
                  >
                    {showPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
                {errors.password && <span className="mg-v2-error-text">{errors.password}</span>}
              </div>

              <div className="mg-v2-form-group">
                <label htmlFor="confirmPassword" className="mg-v2-form-label">비밀번호 확인 *</label>
                <div className="mg-v2-password-wrapper">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    name="confirmPassword"
                    className={`mg-v2-form-input ${errors.confirmPassword ? 'mg-v2-input error' : ''}`}
                    placeholder="비밀번호를 다시 입력하세요"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    required
                    minLength="8"
                  />
                  <button
                    type="button"
                    className="mg-v2-password-toggle"
                    onClick={() => togglePassword('confirmPassword')}
                  >
                    {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
                {errors.confirmPassword && <span className="mg-v2-error-text">{errors.confirmPassword}</span>}
              </div>
            </div>

            <div className="mg-v2-form-group">
              <label htmlFor="phone" className="mg-v2-form-label">휴대폰 번호 *</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                className={`mg-v2-form-input ${errors.phone ? 'mg-v2-input error' : ''}`}
                placeholder="010-0000-0000"
                value={formData.phone}
                onChange={handleInputChange}
                required
                maxLength="13"
              />
              {errors.phone && <span className="mg-v2-error-text">{errors.phone}</span>}
            </div>

            <div className="mg-v2-checkbox-group">
              <input
                type="checkbox"
                id="agreeTerms"
                name="agreeTerms"
                checked={formData.agreeTerms}
                onChange={handleInputChange}
                required
              />
              <label htmlFor="agreeTerms">
                <button type="button" className="mg-v2-link-button" onClick={(e) => { e.preventDefault(); setTermsModalOpen(true); }}>
                  이용약관
                </button>
                {' '}에 동의합니다
              </label>
            </div>
            {errors.agreeTerms && (
              <span className="mg-v2-error-text" style={{ marginTop: '-20px', marginBottom: '20px' }}>
                {errors.agreeTerms}
              </span>
            )}

            <div className="mg-v2-checkbox-group">
              <input
                type="checkbox"
                id="agreePrivacy"
                name="agreePrivacy"
                checked={formData.agreePrivacy}
                onChange={handleInputChange}
                required
              />
              <label htmlFor="agreePrivacy">
                <button type="button" className="mg-v2-link-button" onClick={(e) => { e.preventDefault(); setPrivacyModalOpen(true); }}>
                  개인정보처리방침
                </button>
                {' '}에 동의합니다
              </label>
            </div>
            {errors.agreePrivacy && (
              <span className="mg-v2-error-text" style={{ marginTop: '-20px', marginBottom: '20px' }}>
                {errors.agreePrivacy}
              </span>
            )}

            <button type="submit" className="mg-v2-button-primary" disabled={isLoading}>
              {isLoading ? (
                <>
                  <span className="mg-v2-spinner" aria-hidden="true" />
                  {' '}
                  회원가입 중...
                </>
              ) : (
                '회원가입'
              )}
            </button>
          </form>

          <Link to="/login" className="mg-v2-link-text">
            이미 계정이 있으신가요? 로그인
          </Link>
        </div>
      </div>

      <UnifiedModal
        isOpen={termsModalOpen}
        onClose={() => setTermsModalOpen(false)}
        title="이용약관"
        size="large"
        showCloseButton
      >
        <div className="mg-modal-terms-body">
          <TermsOfServiceContent />
        </div>
      </UnifiedModal>

      <UnifiedModal
        isOpen={privacyModalOpen}
        onClose={() => setPrivacyModalOpen(false)}
        title="개인정보처리방침"
        size="large"
        showCloseButton
      >
        <div className="mg-modal-terms-body">
          <PrivacyPolicyContent />
        </div>
      </UnifiedModal>
    </div>
  );
};

export default TabletRegister;
