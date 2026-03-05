import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiGet } from '../../utils/ajax';
import csrfTokenManager from '../../utils/csrfTokenManager';
import notificationManager from '../../utils/notification';
import CustomSelect from '../common/CustomSelect';
import './AuthPageCommon.css';

const TabletRegister = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    nickname: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    gender: '',
    birthDate: '',
    agreeTerms: false,
    agreePrivacy: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [genderOptions, setGenderOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [emailCheckStatus, setEmailCheckStatus] = useState(null); // 'checking' | 'duplicate' | 'available' | null
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);

  // OAuth2 설정 가져오기
  useEffect(() => {
    getOAuth2Config();
  }, []);

  // 성별 코드 로드
  useEffect(() => {
    const loadGenderCodes = async () => {
      try {
        setLoading(true);
        const response = await apiGet('/api/v1/common-codes/GENDER');
        if (response && response.length > 0) {
          const options = response.map(code => ({
            value: code.codeValue,
            label: code.codeLabel,
            icon: code.icon,
            color: code.colorCode
          }));
          setGenderOptions(options);
        }
      } catch (error) {
        console.error('성별 코드 로드 실패:', error);
        setGenderOptions([
          { value: 'MALE', label: '남성', icon: '♂️', color: 'var(--mg-primary-500)' },
          { value: 'FEMALE', label: '여성', icon: '♀️', color: 'var(--mg-primary-500)' },
          { value: 'OTHER', label: '기타', icon: '⚧', color: 'var(--mg-text-secondary)' }
        ]);
      } finally {
        setLoading(false);
      }
    };

    loadGenderCodes();
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

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    if (name === 'email') {
      setEmailCheckStatus(null);
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
      const response = await apiGet(`/api/v1/auth/duplicate-check/email?email=${encodeURIComponent(email)}`);
      if (response && typeof response.isDuplicate === 'boolean') {
        if (response.isDuplicate) {
          setEmailCheckStatus('duplicate');
          notificationManager.show('이미 사용 중인 이메일입니다.', 'error');
        } else {
          setEmailCheckStatus('available');
          notificationManager.show('사용 가능한 이메일입니다.', 'success');
        }
      } else {
        setEmailCheckStatus(null);
        notificationManager.show('이메일 중복 확인 중 오류가 발생했습니다.', 'error');
      }
    } catch (error) {
      console.error('이메일 중복 확인 오류:', error);
      setEmailCheckStatus(null);
      notificationManager.show('이메일 중복 확인 중 오류가 발생했습니다.', 'error');
    } finally {
      setIsCheckingEmail(false);
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

    setIsLoading(true);

    try {
      const { branchCode, ...payload } = formData;
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

  const genderSelectOptions = genderOptions.map(opt => ({
    value: opt.value,
    label: opt.label
  }));

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
            <div className="mg-v2-form-row">
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

              <div className="mg-v2-form-group">
                <label htmlFor="nickname" className="mg-v2-form-label">닉네임</label>
                <input
                  type="text"
                  id="nickname"
                  name="nickname"
                  className="mg-v2-form-input"
                  placeholder="닉네임을 입력하세요"
                  value={formData.nickname}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="mg-v2-form-group">
              <label htmlFor="email" className="mg-v2-form-label">이메일 *</label>
              <div className="mg-v2-form-email-row">
                <input
                  type="email"
                  id="email"
                  name="email"
                  className={`mg-v2-form-input ${errors.email ? 'mg-v2-input error' : ''}`}
                  placeholder="이메일을 입력하세요"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
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

            <div className="mg-v2-form-row">
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

              <div className="mg-v2-form-group">
                <label htmlFor="gender" className="mg-v2-form-label">성별</label>
                <CustomSelect
                  value={formData.gender}
                  onChange={(val) => {
                    setFormData(prev => ({ ...prev, gender: val }));
                    if (errors.gender) setErrors(prev => ({ ...prev, gender: '' }));
                  }}
                  options={genderSelectOptions}
                  placeholder="성별을 선택하세요"
                  className="mg-v2-form-select"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="mg-v2-form-group">
              <label htmlFor="birthDate" className="mg-v2-form-label">생년월일</label>
              <input
                type="date"
                id="birthDate"
                name="birthDate"
                className="mg-v2-form-input"
                value={formData.birthDate}
                onChange={handleInputChange}
              />
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
                <a href="#!">이용약관</a>에 동의합니다
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
                <a href="#!">개인정보처리방침</a>에 동의합니다
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
                  <span className="mg-v2-spinner"></span>
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
    </div>
  );
};

export default TabletRegister;
