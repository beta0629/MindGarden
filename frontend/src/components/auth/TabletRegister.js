import React, { useState, useEffect } from 'react';
import UnifiedLoading from '../common/UnifiedLoading';
import { useNavigate } from 'react-router-dom';
import CommonPageTemplate from '../common/CommonPageTemplate';
import { apiGet } from '../../utils/ajax';
import csrfTokenManager from '../../utils/csrfTokenManager';
import notificationManager from '../../utils/notification';

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
    branchCode: '',
    agreeTerms: false,
    agreePrivacy: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [oauth2Config, setOauth2Config] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [genderOptions, setGenderOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [branches, setBranches] = useState([]);
  const [isLoadingBranches, setIsLoadingBranches] = useState(false);

  // OAuth2 설정 가져오기
  useEffect(() => {
    getOAuth2Config();
  }, []);

  // 지점 목록 로드
  useEffect(() => {
    const loadBranches = async () => {
      try {
        setIsLoadingBranches(true);
        const response = await apiGet('/api/auth/branches');
        if (response?.branches?.length) {
          setBranches(response.branches);
          setErrors(prev => ({
            ...prev,
            branchCode: ''
          }));
        } else {
          setBranches([]);
        }
      } catch (error) {
        console.error('지점 목록 로드 실패:', error);
        setBranches([]);
        setErrors(prev => ({
          ...prev,
          branchCode: '지점 목록을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.'
        }));
      } finally {
        setIsLoadingBranches(false);
      }
    };

    loadBranches();
  }, []);

  // 성별 코드 로드
  useEffect(() => {
    const loadGenderCodes = async () => {
      try {
        setLoading(true);
        const response = await apiGet('/api/common-codes/GENDER');
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
        // 실패 시 기본값 설정
        setGenderOptions([
          { value: 'MALE', label: '남성', icon: '♂️', color: '#3b82f6' },
          { value: 'FEMALE', label: '여성', icon: '♀️', color: '#ec4899' },
          { value: 'OTHER', label: '기타', icon: '⚧', color: '#6b7280' }
        ]);
      } finally {
        setLoading(false);
      }
    };

    loadGenderCodes();
  }, []);

  const getOAuth2Config = async () => {
    try {
      const response = await fetch('/api/auth/config/oauth2');
      if (response.ok) {
        const config = await response.json();
        setOauth2Config(config);
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
    
    // 에러 메시지 제거
    if (errors[name]) {
      setErrors(prev => ({
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

    if (!formData.branchCode) {
      newErrors.branchCode = '지점을 선택해주세요.';
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
      const response = await csrfTokenManager.post('/api/auth/register', formData);

      if (response.ok) {
        const result = await response.json();
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

  /*
   * 소셜 회원가입 기능은 현재 미사용 상태입니다.
   * 추후 재활성화 시 아래 구현을 복원하세요.
   *
   * const kakaoLogin = () => { ... };
   * const naverLogin = () => { ... };
   */

  return (
    <CommonPageTemplate>
      <div className="tablet-register-page tablet-page">
        <main className="tablet-main">
          <div className="tablet-container">
            <div className="register-container">
              {/* 회원가입 폼 섹션 */}
              <div className="register-form-section">
                <div className="form-container">
                  <h2 className="form-title">회원가입</h2>
                  <p className="form-subtitle">새로운 계정을 만들어 서비스를 이용하세요</p>
                  
                  <form onSubmit={handleSubmit} className="register-form">
                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="name" className="form-label">이름 *</label>
                        <div className="input-wrapper">
                          <div className="input-icon">
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                              <path d="M10 10C12.7614 10 15 7.76142 15 5C15 2.23858 12.7614 0 10 0C7.23858 0 5 2.23858 5 5C5 7.76142 7.23858 10 10 10Z" stroke="var(--secondary-400)" strokeWidth="1.5"/>
                              <path d="M20 20C20 15.5817 15.5228 12 10 12C4.47715 12 0 15.5817 0 20" stroke="var(--secondary-400)" strokeWidth="1.5"/>
                            </svg>
                          </div>
                          <input 
                            type="text" 
                            id="name" 
                            name="name" 
                            className={`form-input ${errors.name ? 'error' : ''}`}
                            placeholder="이름을 입력하세요" 
                            value={formData.name}
                            onChange={handleInputChange}
                            required 
                          />
                        </div>
                        {errors.name && <span className="error-message">{errors.name}</span>}
                      </div>
                      
                      <div className="form-group">
                        <label htmlFor="nickname" className="form-label">닉네임</label>
                        <div className="input-wrapper">
                          <div className="input-icon">
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                              <path d="M10 10C12.7614 10 15 7.76142 15 5C15 2.23858 12.7614 0 10 0C7.23858 0 5 2.23858 5 5C5 7.76142 7.23858 10 10 10Z" stroke="var(--secondary-400)" strokeWidth="1.5"/>
                              <path d="M20 20C20 15.5817 15.5228 12 10 12C4.47715 12 0 15.5817 0 20" stroke="var(--secondary-400)" strokeWidth="1.5"/>
                            </svg>
                          </div>
                          <input 
                            type="text" 
                            id="nickname" 
                            name="nickname" 
                            className="form-input"
                            placeholder="닉네임을 입력하세요"
                            value={formData.nickname}
                            onChange={handleInputChange}
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="email" className="form-label">이메일 *</label>
                      <div className="input-wrapper">
                        <div className="input-icon">
                          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                            <path d="M2.5 5.83333C2.5 4.91286 3.24619 4.16667 4.16667 4.16667H15.8333C16.7538 4.16667 17.5 4.91286 17.5 5.83333V14.1667C17.5 15.0871 16.7538 15.8333 15.8333 15.8333H4.16667C3.24619 15.8333 2.5 15.0871 2.5 14.1667V5.83333Z" stroke="var(--secondary-400)" strokeWidth="1.5"/>
                            <path d="M17.5 5.83333L10 10.8333L2.5 5.83333" stroke="var(--secondary-400)" strokeWidth="1.5"/>
                          </svg>
                        </div>
                        <input 
                          type="email" 
                          id="email" 
                          name="email" 
                          className={`form-input ${errors.email ? 'error' : ''}`}
                          placeholder="이메일을 입력하세요" 
                          value={formData.email}
                          onChange={handleInputChange}
                          required 
                        />
                      </div>
                      {errors.email && <span className="error-message">{errors.email}</span>}
                    </div>
                    
                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="password" className="form-label">비밀번호 *</label>
                        <div className="input-wrapper">
                          <div className="input-icon">
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                              <path d="M15 8.33333V6.66667C15 4.08934 12.9107 2 10.3333 2C7.756 2 5.66667 4.08934 5.66667 6.66667V8.33333" stroke="var(--secondary-400)" strokeWidth="1.5"/>
                              <rect x="3.33333" y="8.33333" width="14" height="9.66667" rx="1" stroke="var(--secondary-400)" strokeWidth="1.5"/>
                              <circle cx="10" cy="13" r="1" fill="var(--secondary-400)"/>
                            </svg>
                          </div>
                          <input 
                            type={showPassword ? "text" : "password"} 
                            id="password" 
                            name="password" 
                            className={`form-input ${errors.password ? 'error' : ''}`}
                            placeholder="8자 이상 입력하세요" 
                            value={formData.password}
                            onChange={handleInputChange}
                            required 
                            minLength="8"
                          />
                          <button 
                            type="button" 
                            className="password-toggle" 
                            onClick={() => togglePassword('password')}
                          >
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                              <path d="M10 4.16667C6.25 4.16667 3.33333 6.66667 2.5 10C3.33333 13.3333 6.25 15.8333 10 15.8333C13.75 15.8333 16.6667 13.3333 17.5 10C16.6667 6.66667 13.75 4.16667 10 4.16667Z" stroke="var(--secondary-400)" strokeWidth="1.5"/>
                              <circle cx="10" cy="10" r="2.5" stroke="var(--secondary-400)" strokeWidth="1.5"/>
                            </svg>
                          </button>
                        </div>
                        {errors.password && <span className="error-message">{errors.password}</span>}
                      </div>
                      
                      <div className="form-group">
                        <label htmlFor="confirmPassword" className="form-label">비밀번호 확인 *</label>
                        <div className="input-wrapper">
                          <div className="input-icon">
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                              <path d="M15 8.33333V6.66667C15 4.08934 12.9107 2 10.3333 2C7.756 2 5.66667 4.08934 5.66667 6.66667V8.33333" stroke="var(--secondary-400)" strokeWidth="1.5"/>
                              <rect x="3.33333" y="8.33333" width="14" height="9.66667" rx="1" stroke="var(--secondary-400)" strokeWidth="1.5"/>
                              <circle cx="10" cy="13" r="1" fill="var(--secondary-400)"/>
                            </svg>
                          </div>
                          <input 
                            type={showConfirmPassword ? "text" : "password"} 
                            id="confirmPassword" 
                            name="confirmPassword" 
                            className={`form-input ${errors.confirmPassword ? 'error' : ''}`}
                            placeholder="비밀번호를 다시 입력하세요" 
                            value={formData.confirmPassword}
                            onChange={handleInputChange}
                            required 
                            minLength="8"
                          />
                          <button 
                            type="button" 
                            className="password-toggle" 
                            onClick={() => togglePassword('confirmPassword')}
                          >
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                              <path d="M10 4.16667C6.25 4.16667 3.33333 6.66667 2.5 10C3.33333 13.3333 6.25 15.8333 10 15.8333C13.75 15.8333 16.6667 13.3333 17.5 10C16.6667 6.66667 13.75 4.16667 10 4.16667Z" stroke="var(--secondary-400)" strokeWidth="1.5"/>
                              <circle cx="10" cy="10" r="2.5" stroke="var(--secondary-400)" strokeWidth="1.5"/>
                            </svg>
                          </button>
                        </div>
                        {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
                      </div>
                    </div>
                    
                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="phone" className="form-label">휴대폰 번호 *</label>
                        <div className="input-wrapper">
                          <div className="input-icon">
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                              <path d="M15 2.5H5C4.11929 2.5 3.5 3.11929 3.5 4V16C3.5 16.8807 4.11929 17.5 5 17.5H15C15.8807 17.5 16.5 16.8807 16.5 16V4C16.5 3.11929 15.8807 2.5 15 2.5Z" stroke="var(--secondary-400)" strokeWidth="1.5"/>
                              <path d="M12.5 15C12.5 15.2761 12.2761 15.5 12 15.5C11.7239 15.5 11.5 15.2761 11.5 15C11.5 14.7239 11.7239 14.5 12 14.5C12.2761 14.5 12.5 14.7239 12.5 15Z" fill="var(--secondary-400)"/>
                            </svg>
                          </div>
                          <input 
                            type="tel" 
                            id="phone" 
                            name="phone" 
                            className={`form-input ${errors.phone ? 'error' : ''}`}
                            placeholder="010-0000-0000" 
                            value={formData.phone}
                            onChange={handleInputChange}
                            required 
                            maxLength="13"
                          />
                        </div>
                        {errors.phone && <span className="error-message">{errors.phone}</span>}
                      </div>
                      
                      <div className="form-group">
                        <label htmlFor="gender" className="form-label">성별</label>
                        <div className="input-wrapper">
                          <div className="input-icon">
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                              <path d="M10 10C12.7614 10 15 7.76142 15 5C15 2.23858 12.7614 0 10 0C7.23858 0 5 2.23858 5 5C5 7.76142 7.23858 10 10 10Z" stroke="var(--secondary-400)" strokeWidth="1.5"/>
                              <path d="M20 20C20 15.5817 15.5228 12 10 12C4.47715 12 0 15.5817 0 20" stroke="var(--secondary-400)" strokeWidth="1.5"/>
                            </svg>
                          </div>
                          <select 
                            id="gender" 
                            name="gender" 
                            className="form-select"
                            value={formData.gender}
                            onChange={handleInputChange}
                            disabled={loading}
                          >
                            <option value="">성별을 선택하세요</option>
                            {genderOptions.map(option => (
                              <option key={option.value} value={option.value}>
                                {option.icon} {option.label} ({option.value})
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                
                <div className="form-group">
                  <label htmlFor="branchCode" className="form-label">지점 선택 *</label>
                  {isLoadingBranches ? (
                    <div className="form-input">
                      지점 목록을 불러오는 중입니다...
                    </div>
                  ) : (
                    <select
                      id="branchCode"
                      name="branchCode"
                      className={`form-select ${errors.branchCode ? 'error' : ''}`}
                      value={formData.branchCode}
                      onChange={handleInputChange}
                      required
                      disabled={branches.length === 0}
                    >
                      <option value="">지점을 선택하세요</option>
                      {branches.map((branch) => (
                        <option key={branch.branchCode} value={branch.branchCode}>
                          {branch.branchName} ({branch.branchCode})
                        </option>
                      ))}
                    </select>
                  )}
                  {errors.branchCode && <span className="error-message">{errors.branchCode}</span>}
                </div>
                    
                    <div className="form-group">
                      <label htmlFor="birthDate" className="form-label">생년월일</label>
                      <div className="input-wrapper">
                        <div className="input-icon">
                          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                            <path d="M6.5 2.5H13.5M6.5 2.5V1.25C6.5 0.559644 7.05964 0 7.75 0C8.44036 0 9 0.559644 9 1.25V2.5M6.5 2.5H5C4.11929 2.5 3.5 3.11929 3.5 4V17C3.5 17.8807 4.11929 18.5 5 18.5H15C15.8807 18.5 16.5 17.8807 16.5 17V4C16.5 3.11929 15.8807 2.5 15 2.5H13.5M9 2.5V1.25C9 0.559644 9.55964 0 10.25 0C10.9404 0 11.5 0.559644 11.5 1.25V2.5M9 2.5H11.5" stroke="var(--secondary-400)" strokeWidth="1.5"/>
                            <path d="M3.5 7H16.5" stroke="var(--secondary-400)" strokeWidth="1.5"/>
                          </svg>
                        </div>
                        <input 
                          type="date" 
                          id="birthDate" 
                          name="birthDate" 
                          className="form-input"
                          value={formData.birthDate}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                    
                    <div className="form-options">
                      <label className="checkbox-wrapper">
                        <input 
                          type="checkbox" 
                          id="agreeTerms" 
                          name="agreeTerms"
                          checked={formData.agreeTerms}
                          onChange={handleInputChange}
                          required
                        />
                        <span className="checkmark"></span>
                        <a href="#" className="link">이용약관</a>에 동의합니다
                      </label>
                      {errors.agreeTerms && <span className="error-message">{errors.agreeTerms}</span>}
                      
                      <label className="checkbox-wrapper">
                        <input 
                          type="checkbox" 
                          id="agreePrivacy" 
                          name="agreePrivacy"
                          checked={formData.agreePrivacy}
                          onChange={handleInputChange}
                          required
                        />
                        <span className="checkmark"></span>
                        <a href="#" className="link">개인정보처리방침</a>에 동의합니다
                      </label>
                      {errors.agreePrivacy && <span className="error-message">{errors.agreePrivacy}</span>}
                    </div>
                    
                    <button type="submit" className="register-button" disabled={isLoading}>
                      <span className="button-text">
                        {isLoading ? '회원가입 중...' : '회원가입'}
                      </span>
                      <div className="button-icon">
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                          <path d="M3.33333 10H16.6667M16.6667 10L11.6667 5M16.6667 10L11.6667 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                    </button>
                  </form>
                  
                  <div className="divider">
                    <span>또는</span>
                  </div>
                  
                  {/* 소셜 회원가입 기능은 현재 비활성화 상태입니다.
                  <div className="social-signup">
                    <button className="social-button kakao" onClick={kakaoLogin}>
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <path
                          d="M10 2C5.58172 2 2 5.58172 2 10C2 14.4183 5.58172 18 10 18C14.4183 18 18 14.4183 18 10C18 5.58172 14.4183 2 10 2Z"
                          fill="currentColor"
                        />
                        <path
                          d="M10 6C7.79086 6 6 7.79086 6 10C6 12.2091 7.79086 14 10 14C12.2091 14 14 12.2091 14 10C14 7.79086 12.2091 6 10 6Z"
                          fill="currentColor"
                        />
                      </svg>
                      카카오로 회원가입
                    </button>
                    
                    <button className="social-button naver" onClick={naverLogin}>
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <rect width="20" height="20" rx="2" fill="currentColor"/>
                        <path d="M6 6L14 14M14 6L6 14" stroke="var(--color-white)" strokeWidth="2"/>
                      </svg>
                      네이버로 회원가입
                    </button>
                  </div>
                  */}
                  
                  <div className="login-link">
                    <p>이미 계정이 있으신가요? <a href="/login" className="link">로그인</a></p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </CommonPageTemplate>
  );
};

export default TabletRegister;
