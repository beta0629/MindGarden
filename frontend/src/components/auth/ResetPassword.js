import React, { useState, useEffect } from 'react';
// import UnifiedLoading from '../../components/common/UnifiedLoading'; // 임시 비활성화
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { apiPost, apiGet } from '../../utils/ajax';
import notificationManager from '../../utils/notification';
import MGButton from '../common/MGButton';
import './AuthPageCommon.css';

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [isPasswordReset, setIsPasswordReset] = useState(false);

  // 토큰 검증
  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        notificationManager.error('유효하지 않은 접근입니다.');
        navigate('/login');
        return;
      }

      try {
        setIsValidating(true);
        const response = await apiGet(
          `/api/v1/auth/password-reset/validate-token?token=${encodeURIComponent(token)}`
        );
        
        if (!response.success || !response.valid) {
          notificationManager.error('토큰이 만료되었거나 유효하지 않습니다.');
          navigate('/forgot-password');
        }
      } catch (error) {
        console.error('토큰 검증 실패:', error);
        notificationManager.error('토큰 검증 중 오류가 발생했습니다.');
        navigate('/forgot-password');
      } finally {
        setIsValidating(false);
      }
    };

    validateToken();
  }, [token, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validatePassword = (password) => {
    if (password.length < 8) {
      return '비밀번호는 8자 이상이어야 합니다.';
    }
    if (password.length > 100) {
      return '비밀번호는 100자 이하여야 합니다.';
    }
    if (!/(?=.*[a-zA-Z])(?=.*\d)/.test(password)) {
      return '비밀번호는 영문과 숫자를 포함해야 합니다.';
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.newPassword || !formData.confirmPassword) {
      notificationManager.error('모든 필드를 입력해주세요.');
      return;
    }

    // 비밀번호 유효성 검사
    const passwordError = validatePassword(formData.newPassword);
    if (passwordError) {
      notificationManager.error(passwordError);
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      notificationManager.error('비밀번호가 일치하지 않습니다.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await apiPost('/api/v1/auth/password-reset/reset', {
        token: token,
        newPassword: formData.newPassword,
        confirmPassword: formData.confirmPassword
      });

      if (response.success) {
        setIsPasswordReset(true);
        notificationManager.success('비밀번호가 성공적으로 변경되었습니다.');
      } else {
        notificationManager.error(response.message || '비밀번호 재설정에 실패했습니다.');
      }
    } catch (error) {
      console.error('비밀번호 재설정 실패:', error);
      notificationManager.error('비밀번호 재설정 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 토큰 검증 중 로딩 화면
  if (isValidating) {
    return (
      <div className="mg-v2-auth-container">
        <div className="mg-v2-auth-hero">
          <div className="mg-v2-auth-hero-content">
            <h1 className="mg-v2-auth-hero-logo">CoreSolution</h1>
            <p className="mg-v2-auth-hero-slogan">비즈니스의 핵심을 솔루션하다</p>
          </div>
        </div>
        <div className="mg-v2-auth-content">
          <div className="mg-v2-auth-form-wrapper" style={{ alignItems: 'center', textAlign: 'center' }}>
            <span className="mg-v2-spinner" style={{ width: '40px', height: '40px', borderTopColor: 'var(--mg-primary-color)', borderRightColor: 'var(--mg-primary-color)', borderBottomColor: 'var(--mg-primary-color)' }}></span>
            <p className="mg-v2-auth-subtitle" style={{ marginTop: '16px' }}>
              토큰을 검증하고 있습니다...
            </p>
          </div>
        </div>
      </div>
    );
  }

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
          {!isPasswordReset ? (
            <>
              <div>
                <h2 className="mg-v2-auth-title">새 비밀번호 설정</h2>
                <p className="mg-v2-auth-subtitle">안전한 새 비밀번호를 설정해주세요</p>
              </div>

              <form onSubmit={handleSubmit} className="mg-v2-auth-form">
                <div className="mg-v2-form-group">
                  <label className="mg-v2-label" htmlFor="newPassword">새 비밀번호</label>
                  <div className="mg-v2-password-wrapper">
                    <input
                      id="newPassword"
                      type={showPassword ? 'text' : 'password'}
                      name="newPassword"
                      value={formData.newPassword}
                      onChange={handleInputChange}
                      placeholder="영문, 숫자 포함 8자 이상"
                      className="mg-v2-input"
                      disabled={isLoading}
                    />
                    <MGButton
                      type="button"
                      variant="outline"
                      size="small"
                      className="mg-v2-password-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                      preventDoubleClick={false}
                    >
                      {showPassword ? '👁️' : '👁️‍🗨️'}
                    </MGButton>
                  </div>
                </div>

                <div className="mg-v2-form-group">
                  <label className="mg-v2-label" htmlFor="confirmPassword">비밀번호 확인</label>
                  <div className="mg-v2-password-wrapper">
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      placeholder="비밀번호를 다시 입력해주세요"
                      className="mg-v2-input"
                      disabled={isLoading}
                    />
                    <MGButton
                      type="button"
                      variant="outline"
                      size="small"
                      className="mg-v2-password-toggle"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      preventDoubleClick={false}
                    >
                      {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                    </MGButton>
                  </div>
                </div>

                <div className="mg-v2-auth-hint" style={{ marginBottom: '24px' }}>
                  <p>💡 <strong>비밀번호 요구사항</strong></p>
                  <ul>
                    <li>8자 이상 100자 이하</li>
                    <li>영문과 숫자 포함</li>
                    <li>특수문자 사용 권장</li>
                  </ul>
                </div>

                <MGButton
                  type="submit"
                  variant="primary"
                  className="mg-v2-button-primary"
                  disabled={isLoading || !formData.newPassword || !formData.confirmPassword}
                  loading={isLoading}
                  loadingText="변경 중..."
                  preventDoubleClick={false}
                >
                  비밀번호 변경
                </MGButton>
              </form>
            </>
          ) : (
            <div className="mg-v2-auth-success">
              <div className="mg-v2-auth-success-icon">
                ✅
              </div>
              
              <div>
                <h2 className="mg-v2-auth-title">비밀번호 변경 완료</h2>
                <p className="mg-v2-auth-success-message">
                  비밀번호가 성공적으로 변경되었습니다.<br />
                  새 비밀번호로 로그인해주세요.
                </p>
              </div>

              <div className="mg-v2-auth-success-actions">
                <Link to="/login" className="mg-v2-button-primary" style={{ textDecoration: 'none' }}>
                  로그인 페이지로 이동
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
