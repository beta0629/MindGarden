import React, { useState, useEffect } from 'react';
// import UnifiedLoading from '../../components/common/UnifiedLoading'; // 임시 비활성화
import { useNavigate, Link } from 'react-router-dom';
import { apiGet } from '../../utils/ajax';
import csrfTokenManager from '../../utils/csrfTokenManager';
import notificationManager from '../../utils/notification';
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
    // ⚠️ 표준화 2025-12-05: Deprecated - 브랜치 개념 제거
    branchCode: '',
    agreeTerms: false,
    agreePrivacy: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
        const response = await apiGet('/api/v1/auth/branches');
        if (response?.branches?.length) {
          setBranches(response.branches);
          setErrors(prev => ({
            ...prev,
            // ⚠️ 표준화 2025-12-05: Deprecated - 브랜치 개념 제거
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
          // ⚠️ 표준화 2025-12-05: Deprecated - 브랜치 개념 제거
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
        // 실패 시 기본값 설정
        setGenderOptions([
          { value: 'MALE', label: '남성', icon: '♂️', color: 'var(--mg-primary-500)' },
          // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #ec4899 -> var(--mg-custom-ec4899)
          { value: 'FEMALE', label: '여성', icon: '♀️', color: '#ec4899' },
          // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #6b7280 -> var(--mg-custom-6b7280)
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
      const response = await fetch('/api/v1/auth/config/oauth2');
      if (response.ok) {
        // const config = await response.json();
        // setOauth2Config(config);
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
      // ⚠️ 표준화 2025-12-05: Deprecated - 브랜치 개념 제거
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
      const response = await csrfTokenManager.post('/api/v1/auth/register', formData);

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

  /*
/**
   * 소셜 회원가입 기능은 현재 미사용 상태입니다.
/**
   * 추후 재활성화 시 아래 구현을 복원하세요.
   *
/**
   * const kakaoLogin = () => { ... };
/**
   * const naverLogin = () => { ... };
   */

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
                <label htmlFor="name" className="mg-v2-label">이름 *</label>
                <input 
                  type="text" 
                  id="name" 
                  name="name" 
                  className={`mg-v2-input ${errors.name ? 'error' : ''}`}
                  placeholder="이름을 입력하세요" 
                  value={formData.name}
                  onChange={handleInputChange}
                  required 
                />
                {errors.name && <span className="mg-v2-error-text">{errors.name}</span>}
              </div>
              
              <div className="mg-v2-form-group">
                <label htmlFor="nickname" className="mg-v2-label">닉네임</label>
                <input 
                  type="text" 
                  id="nickname" 
                  name="nickname" 
                  className="mg-v2-input"
                  placeholder="닉네임을 입력하세요"
                  value={formData.nickname}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            
            <div className="mg-v2-form-group">
              <label htmlFor="email" className="mg-v2-label">이메일 *</label>
              <input 
                type="email" 
                id="email" 
                name="email" 
                className={`mg-v2-input ${errors.email ? 'error' : ''}`}
                placeholder="이메일을 입력하세요" 
                value={formData.email}
                onChange={handleInputChange}
                required 
              />
              {errors.email && <span className="mg-v2-error-text">{errors.email}</span>}
            </div>
            
            <div className="mg-v2-form-row">
              <div className="mg-v2-form-group">
                <label htmlFor="password" className="mg-v2-label">비밀번호 *</label>
                <div className="mg-v2-password-wrapper">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    id="password" 
                    name="password" 
                    className={`mg-v2-input ${errors.password ? 'error' : ''}`}
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
                <label htmlFor="confirmPassword" className="mg-v2-label">비밀번호 확인 *</label>
                <div className="mg-v2-password-wrapper">
                  <input 
                    type={showConfirmPassword ? "text" : "password"} 
                    id="confirmPassword" 
                    name="confirmPassword" 
                    className={`mg-v2-input ${errors.confirmPassword ? 'error' : ''}`}
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
                <label htmlFor="phone" className="mg-v2-label">휴대폰 번호 *</label>
                <input 
                  type="tel" 
                  id="phone" 
                  name="phone" 
                  className={`mg-v2-input ${errors.phone ? 'error' : ''}`}
                  placeholder="010-0000-0000" 
                  value={formData.phone}
                  onChange={handleInputChange}
                  required 
                  maxLength="13"
                />
                {errors.phone && <span className="mg-v2-error-text">{errors.phone}</span>}
              </div>
              
              <div className="mg-v2-form-group">
                <label htmlFor="gender" className="mg-v2-label">성별</label>
                <select 
                  id="gender" 
                  name="gender" 
                  className="mg-v2-select"
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
        
            <div className="mg-v2-form-group">
              <label htmlFor="branchCode" className="mg-v2-label">지점 선택 *</label>
              {isLoadingBranches ? (
                <div className="mg-v2-input" style={{ color: 'var(--mg-text-secondary)' }}>
                  지점 목록을 불러오는 중입니다...
                </div>
              ) : (
                <select
                  id="branchCode"
                  name="branchCode"
                  className={`mg-v2-select ${errors.branchCode ? 'error' : ''}`}
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
              {errors.branchCode && <span className="mg-v2-error-text">{errors.branchCode}</span>}
            </div>
            
            <div className="mg-v2-form-group">
              <label htmlFor="birthDate" className="mg-v2-label">생년월일</label>
              <input 
                type="date" 
                id="birthDate" 
                name="birthDate" 
                className="mg-v2-input"
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
            {errors.agreeTerms && <span className="mg-v2-error-text" style={{marginTop: '-20px', marginBottom: '20px'}}>{errors.agreeTerms}</span>}
            
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
            {errors.agreePrivacy && <span className="mg-v2-error-text" style={{marginTop: '-20px', marginBottom: '20px'}}>{errors.agreePrivacy}</span>}
            
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
