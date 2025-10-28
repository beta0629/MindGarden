import React, { useState, useEffect } from 'react';
import UnifiedLoading from '../common/UnifiedLoading';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import CommonPageTemplate from '../common/CommonPageTemplate';
import UnifiedHeader from '../common/UnifiedHeader';
import SimpleLayout from '../layout/SimpleLayout';
import { apiPost, apiGet } from '../../utils/ajax';
import notificationManager from '../../utils/notification';
import ENV from '../../constants/environment';
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
  const [isTokenValid, setIsTokenValid] = useState(false);
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
        const response = await apiGet(`/api/password-reset/validate-token?token=${encodeURIComponent(token)}`);
        
        if (response.success && response.valid) {
          setIsTokenValid(true);
        } else {
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
      const response = await apiPost('/api/password-reset/reset', {
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
      <CommonPageTemplate 
        title="비밀번호 재설정 - 마인드가든"
        description="마인드가든 비밀번호를 재설정하세요"
        bodyClass="tablet-page"
      >
        <div className="tablet-page">
          <UnifiedHeader />
          <main className="tablet-main">
            <div className="tablet-container">
              <div className="reset-password-form-container">
                <div className="reset-password-icon" />
                <p className="reset-password-description">
                  토큰을 검증하고 있습니다...
                </p>
              </div>
            </div>
          </main>
        </div>
        
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </CommonPageTemplate>
    );
  }

  return (
    <CommonPageTemplate 
      title="비밀번호 재설정 - 마인드가든"
      description="마인드가든 비밀번호를 재설정하세요"
      bodyClass="tablet-page"
    >
      <div className="tablet-page">
        <UnifiedHeader />
        
        <main className="tablet-main">
          <div className="tablet-container">
            <div style={{
              maxWidth: '480px',
              margin: '80px auto',
              padding: '40px 32px',
              background: '#ffffff',
              borderRadius: '20px',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
              fontFamily: "'Noto Sans KR', 'Malgun Gothic', '맑은 고딕', sans-serif"
            }}>
              {!isPasswordReset ? (
                <>
                  {/* 헤더 */}
                  <div className="mg-v2-text-center" style={{ marginBottom: '40px' }}>
                    <div style={{
                      width: '64px',
                      height: '64px',
                      backgroundColor: '#667eea',
                      borderRadius: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 'var(--font-size-xxl)',
                      margin: '0 auto 24px',
                      color: 'white'
                    }}>
                      🔒
                    </div>
                    <h1 className="mg-v2-modal-title" style={{
                      fontSize: 'var(--font-size-xxl)',
                      fontWeight: '700',
                      color: '#2d3748',
                      marginBottom: '12px'
                    }}>
                      새 비밀번호 설정
                    </h1>
                    <p className="mg-v2-text-base mg-v2-text-secondary" style={{ lineHeight: '1.5' }}>
                      안전한 새 비밀번호를 설정해주세요
                    </p>
                  </div>

                  {/* 폼 */}
                  <form onSubmit={handleSubmit}>
                    <div className="mg-v2-form-group">
                      <label className="mg-v2-form-label">
                        새 비밀번호
                      </label>
                      <div className="mg-v2-relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          name="newPassword"
                          value={formData.newPassword}
                          onChange={handleInputChange}
                          placeholder="영문, 숫자 포함 8자 이상"
                          disabled={isLoading}
                          style={{
                            width: '100%',
                            padding: '16px 50px 16px 16px',
                            fontSize: 'var(--font-size-base)',
                            border: '2px solid #e2e8f0',
                            borderRadius: '12px',
                            outline: 'none',
                            transition: 'all 0.2s ease',
                            fontFamily: "'Noto Sans KR', 'Malgun Gothic', '맑은 고딕', sans-serif",
                            backgroundColor: isLoading ? '#f7fafc' : '#ffffff'
                          }}
                          onFocus={(e) => {
                            e.target.style.borderColor = '#667eea';
                            e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                          }}
                          onBlur={(e) => {
                            e.target.style.borderColor = '#e2e8f0';
                            e.target.style.boxShadow = 'none';
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          style={{
                            position: 'absolute',
                            right: '16px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'none',
                            border: 'none',
                            color: '#718096',
                            cursor: 'pointer',
                            fontSize: 'var(--font-size-lg)'
                          }}
                        >
                          {showPassword ? '👁️' : '👁️‍🗨️'}
                        </button>
                      </div>
                    </div>

                    <div className="mg-v2-form-group">
                      <label className="mg-v2-form-label">
                        비밀번호 확인
                      </label>
                      <div className="mg-v2-relative">
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          name="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={handleInputChange}
                          placeholder="비밀번호를 다시 입력해주세요"
                          disabled={isLoading}
                          style={{
                            width: '100%',
                            padding: '16px 50px 16px 16px',
                            fontSize: 'var(--font-size-base)',
                            border: '2px solid #e2e8f0',
                            borderRadius: '12px',
                            outline: 'none',
                            transition: 'all 0.2s ease',
                            fontFamily: "'Noto Sans KR', 'Malgun Gothic', '맑은 고딕', sans-serif",
                            backgroundColor: isLoading ? '#f7fafc' : '#ffffff'
                          }}
                          onFocus={(e) => {
                            e.target.style.borderColor = '#667eea';
                            e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                          }}
                          onBlur={(e) => {
                            e.target.style.borderColor = '#e2e8f0';
                            e.target.style.boxShadow = 'none';
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          style={{
                            position: 'absolute',
                            right: '16px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'none',
                            border: 'none',
                            color: '#718096',
                            cursor: 'pointer',
                            fontSize: 'var(--font-size-lg)'
                          }}
                        >
                          {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                        </button>
                      </div>
                    </div>

                    {/* 비밀번호 안내 */}
                    <div style={{
                      backgroundColor: '#f7fafc',
                      padding: '16px',
                      borderRadius: '8px',
                      marginBottom: '24px',
                      border: '1px solid #e2e8f0'
                    }}>
                      <p style={{
                        fontSize: 'var(--font-size-xs)',
                        color: '#4a5568',
                        lineHeight: '1.4',
                        margin: 0
                      }}>
                        💡 <strong>비밀번호 요구사항</strong><br />
                        • 8자 이상 100자 이하<br />
                        • 영문과 숫자 포함<br />
                        • 특수문자 사용 권장
                      </p>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading || !formData.newPassword || !formData.confirmPassword}
                      style={{
                        width: '100%',
                        padding: '16px',
                        fontSize: 'var(--font-size-base)',
                        fontWeight: '600',
                        color: 'white',
                        background: isLoading || !formData.newPassword || !formData.confirmPassword
                          ? '#cbd5e0' 
                          : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        border: 'none',
                        borderRadius: '12px',
                        cursor: isLoading || !formData.newPassword || !formData.confirmPassword ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s ease',
                        fontFamily: "'Noto Sans KR', 'Malgun Gothic', '맑은 고딕', sans-serif"
                      }}
                      onMouseEnter={(e) => {
                        if (!isLoading && formData.newPassword && formData.confirmPassword) {
                          e.target.style.transform = 'translateY(-2px)';
                          e.target.style.boxShadow = '0 8px 25px rgba(102, 126, 234, 0.3)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.transform = 'translateY(0)';
                        e.target.style.boxShadow = 'none';
                      }}
                    >
                      {isLoading ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                          <div style={{
                            width: '16px',
                            height: '16px',
                            border: '2px solid transparent',
                            borderTop: '2px solid white',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite'
                          }} />
                          변경 중...
                        </div>
                      ) : (
                        '비밀번호 변경'
                      )}
                    </button>
                  </form>
                </>
              ) : (
                /* 비밀번호 변경 완료 화면 */
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    width: '64px',
                    height: '64px',
                    backgroundColor: '#48bb78',
                    borderRadius: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 'var(--font-size-xxl)',
                    margin: '0 auto 24px',
                    color: 'white'
                  }}>
                    ✅
                  </div>
                  
                  <h1 style={{
                    fontSize: 'var(--font-size-xxl)',
                    fontWeight: '700',
                    color: '#2d3748',
                    marginBottom: '16px'
                  }}>
                    비밀번호 변경 완료
                  </h1>
                  
                  <p style={{
                    fontSize: 'var(--font-size-base)',
                    color: '#718096',
                    lineHeight: '1.6',
                    marginBottom: '32px'
                  }}>
                    비밀번호가 성공적으로 변경되었습니다.<br />
                    새 비밀번호로 로그인해주세요.
                  </p>

                  <Link
                    to="/login"
                    style={{
                      display: 'block',
                      width: '100%',
                      padding: '16px',
                      fontSize: 'var(--font-size-base)',
                      fontWeight: '600',
                      color: 'white',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      textDecoration: 'none',
                      textAlign: 'center',
                      borderRadius: '12px',
                      transition: 'all 0.2s ease',
                      fontFamily: "'Noto Sans KR', 'Malgun Gothic', '맑은 고딕', sans-serif"
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.transform = 'translateY(-2px)';
                      e.target.style.boxShadow = '0 8px 25px rgba(102, 126, 234, 0.3)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = 'translateY(0)';
                      e.target.style.boxShadow = 'none';
                    }}
                  >
                    로그인 페이지로 이동
                  </Link>
                </div>
              )}
            </div>
          </div>
        </main>

        {/* 스피너 애니메이션 CSS */}
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </CommonPageTemplate>
  );
};

export default ResetPassword;
