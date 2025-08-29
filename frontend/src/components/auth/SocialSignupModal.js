import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatPhoneNumber, isValidEmail, isValidPassword } from '../../utils/common';
import { userAPI } from '../../utils/ajax';
import '../../styles/auth/social-signup-modal.css';

const SocialSignupModal = ({ 
  isOpen, 
  onClose, 
  socialUser, // SNS에서 받아온 사용자 정보
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

  // SNS 사용자 정보로 폼 초기화
  useEffect(() => {
    console.log('🔍 SocialSignupModal useEffect 실행:', { socialUser, isOpen });
    
    if (socialUser && isOpen) {
      console.log('👤 SNS 사용자 정보로 폼 초기화:', {
        email: socialUser.email,
        name: socialUser.name,
        nickname: socialUser.nickname
      });
      
      // SNS 정보를 최대한 활용하여 사용자 입력 최소화
      setFormData(prev => ({
        ...prev,
        email: socialUser.email || '',
        name: socialUser.name || '', // SNS에서 받은 이름 자동 입력
        nickname: socialUser.nickname || '', // SNS에서 받은 닉네임 자동 입력
        password: '',
        confirmPassword: '',
        phone: ''
      }));
      
      console.log('✅ 폼 데이터 업데이트 완료');
    } else {
      console.log('❌ socialUser가 null이거나 모달이 닫혀있음');
    }
  }, [socialUser, isOpen]);

  // 휴대폰 번호 자동 하이픈 처리
  const handlePhoneChange = (e) => {
    const value = e.target.value;
    const cleaned = value.replace(/\D/g, '');
    
    if (cleaned.length <= 13) {
      const formatted = formatPhoneNumber(cleaned);
      setFormData(prev => ({
        ...prev,
        phone: formatted
      }));
      
      // 에러 메시지 제거
      if (errors.phone) {
        setErrors(prev => ({
          ...prev,
          phone: ''
        }));
      }
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

  // 폼 유효성 검사
  const validateForm = () => {
    const newErrors = {};

    // 이메일 검사 (SNS에서 받아온 값이므로 수정 불가)
    if (!formData.email || !isValidEmail(formData.email)) {
      newErrors.email = '올바른 이메일 형식이 아닙니다.';
    }

    // 이름 검사
    if (!formData.name.trim()) {
      newErrors.name = '이름을 입력해주세요.';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = '이름은 2자 이상 입력해주세요.';
    }

    // 닉네임 검사
    if (!formData.nickname.trim()) {
      newErrors.nickname = '닉네임을 입력해주세요.';
    } else if (formData.nickname.trim().length < 2) {
      newErrors.nickname = '닉네임은 2자 이상 입력해주세요.';
    }

    // 비밀번호 검사
    if (!formData.password) {
      newErrors.password = '비밀번호를 입력해주세요.';
    } else if (formData.password.length < 8) {
      newErrors.password = '비밀번호는 8자 이상 입력해주세요.';
    } else if (!isValidPassword(formData.password)) {
      newErrors.password = '비밀번호는 영문, 숫자, 특수문자를 포함해야 합니다.';
    }

    // 비밀번호 확인 검사
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = '비밀번호 확인을 입력해주세요.';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = '비밀번호가 일치하지 않습니다.';
    }

    // 휴대폰 번호 검사
    if (!formData.phone.trim()) {
      newErrors.phone = '휴대폰 번호를 입력해주세요.';
    } else if (formData.phone.replace(/\D/g, '').length !== 11) {
      newErrors.phone = '휴대폰 번호는 11자리여야 합니다.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 회원가입 제출
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrors({});
    
    try {
      // API 호출 데이터 준비
      const signupData = {
        provider: socialUser.provider,
        providerUserId: socialUser.providerUserId,
        providerUsername: socialUser.name || socialUser.nickname,
        email: formData.email,
        name: formData.name,
        nickname: formData.nickname,
        password: formData.password,
        phone: formData.phone,
        providerProfileImage: socialUser.profileImageUrl
      };
      
      const response = await userAPI.socialSignup(signupData);
      
      if (response.success) {
        // 회원가입 성공
        onSignupSuccess(response);
        onClose();
      } else {
        // 회원가입 실패
        setErrors({ submit: response.message || '회원가입에 실패했습니다.' });
      }
    } catch (error) {
      console.error('간편 회원가입 오류:', error);
      setErrors({ 
        submit: error.response?.data?.message || '회원가입 처리 중 오류가 발생했습니다.' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  console.log('🔍 SocialSignupModal 렌더링:', { isOpen, socialUser });
  
  if (!isOpen) {
    console.log('❌ 모달이 닫혀있음 - isOpen:', isOpen);
    return null;
  }
  
  console.log('✅ 모달 렌더링 진행 - isOpen:', isOpen);
  console.log('📊 현재 폼 데이터:', formData);
  console.log('👤 SNS 사용자 정보:', socialUser);

  return (
    <>
      {/* 오버레이 */}
      <div className="modal-overlay" onClick={() => {
        onClose();
        navigate('/login');
      }}></div>
      
      {/* 모달 */}
      <div className="social-signup-modal">
        <div className="modal-header">
          <h2 className="modal-title">
            <i className="bi bi-person-plus"></i>
            간편 회원가입
          </h2>
          <button className="modal-close" onClick={() => {
            onClose();
            navigate('/login');
          }}>
            <i className="bi bi-x-lg"></i>
          </button>
        </div>
        
        <div className="modal-body">
          <div className="social-info">
            <div className="social-provider">
              <span className="provider-icon">
                <i className={`bi bi-${socialUser?.provider === 'KAKAO' ? 'chat-dots-fill' : 'chat-square-fill'}`} 
                   style={{ color: socialUser?.provider === 'KAKAO' ? '#FEE500' : '#03C75A' }}></i>
              </span>
              <span className="provider-name">
                {socialUser?.provider === 'KAKAO' ? '카카오' : '네이버'} 계정으로 가입
              </span>
            </div>
            <p className="social-description">소셜 계정 정보로 간편하게 가입하세요</p>
          </div>
          
          <form onSubmit={handleSubmit} className="social-signup-form">
            <div className="form-group">
              <label htmlFor="socialName" className="form-label">이름 *</label>
              <input
                type="text"
                id="socialName"
                name="name"
                className={`form-input ${errors.name ? 'error' : ''}`}
                value={formData.name}
                onChange={handleInputChange}
                required
                placeholder="이름을 입력하세요"
              />
              {errors.name && <span className="error-message">{errors.name}</span>}
            </div>
            
            <div className="form-group">
              <label htmlFor="socialNickname" className="form-label">닉네임 *</label>
              <input
                type="text"
                id="socialNickname"
                name="nickname"
                className={`form-input ${errors.nickname ? 'error' : ''}`}
                value={formData.nickname}
                onChange={handleInputChange}
                required
                placeholder="닉네임을 입력하세요"
              />
              {errors.nickname && <span className="error-message">{errors.nickname}</span>}
            </div>
            
            <div className="form-group">
              <label htmlFor="socialEmail" className="form-label">이메일 *</label>
              <input
                type="email"
                id="socialEmail"
                name="email"
                className={`form-input ${errors.email ? 'error' : ''}`}
                value={formData.email}
                readOnly
                disabled
              />
              {errors.email && <span className="error-message">{errors.email}</span>}
              <small className="form-help">소셜 계정의 이메일이 자동으로 입력됩니다</small>
            </div>
            
            <div className="form-group">
              <label htmlFor="socialPassword" className="form-label">비밀번호 *</label>
              <div className="input-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  id="socialPassword"
                  name="password"
                  className={`form-input ${errors.password ? 'error' : ''}`}
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
                  <i className={`bi bi-${showPassword ? 'eye-slash' : 'eye'}`}></i>
                </button>
              </div>
              {errors.password && <span className="error-message">{errors.password}</span>}
              <small className="form-help">8자 이상의 안전한 비밀번호를 입력하세요</small>
            </div>
            
            <div className="form-group">
              <label htmlFor="socialPasswordConfirm" className="form-label">비밀번호 확인 *</label>
              <div className="input-wrapper">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  id="socialPasswordConfirm"
                  name="confirmPassword"
                  className={`form-input ${errors.confirmPassword ? 'error' : ''}`}
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
                  <i className={`bi bi-${showConfirmPassword ? 'eye-slash' : 'eye'}`}></i>
                </button>
              </div>
              {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
              <small className="form-help">비밀번호를 한 번 더 입력하세요</small>
            </div>
            
            <div className="form-group">
              <label htmlFor="socialPhone" className="form-label">휴대폰 번호 *</label>
              <input
                type="tel"
                id="socialPhone"
                name="phone"
                className={`form-input ${errors.phone ? 'error' : ''}`}
                value={formData.phone}
                onChange={handlePhoneChange}
                required
                maxLength="13"
                placeholder="010-0000-0000"
              />
              {errors.phone && <span className="error-message">{errors.phone}</span>}
              <small className="form-help">숫자만 입력하면 자동으로 하이픈이 추가됩니다</small>
            </div>
            
            {/* 전체 에러 메시지 */}
            {errors.submit && (
              <div className="error-summary">
                <i className="bi bi-exclamation-triangle"></i>
                <span>{errors.submit}</span>
              </div>
            )}
            
            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={() => {
                onClose();
                navigate('/login');
              }}>
                취소
              </button>
              <button type="submit" className="btn btn-primary" disabled={isLoading}>
                {isLoading ? '가입 중...' : '회원가입 완료'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default SocialSignupModal;
