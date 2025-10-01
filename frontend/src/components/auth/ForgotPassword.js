import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import CommonPageTemplate from '../common/CommonPageTemplate';
import SimpleHeader from '../layout/SimpleHeader';
import { apiPost } from '../../utils/ajax';
import notificationManager from '../../utils/notification';
import ENV from '../../constants/environment';
import './AuthPageCommon.css';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.email) {
      notificationManager.error('이메일을 입력해주세요.');
      return;
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      notificationManager.error('올바른 이메일 형식을 입력해주세요.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await apiPost('/api/password-reset/send-email', {
        email: formData.email
      });

      if (response.success) {
        setIsEmailSent(true);
        notificationManager.success('비밀번호 재설정 링크를 이메일로 발송했습니다.');
      } else {
        notificationManager.error(response.message || '이메일 발송에 실패했습니다.');
      }
    } catch (error) {
      console.error('비밀번호 재설정 이메일 발송 실패:', error);
      notificationManager.error('일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <CommonPageTemplate 
      title="비밀번호 찾기 - 마인드가든"
      description="마인드가든 비밀번호를 재설정하세요"
      bodyClass="tablet-page"
    >
      <div className="tablet-page">
        <SimpleHeader />
        
        <main className="tablet-main">
          <div className="tablet-container">
            <div className="forgot-password-form-container">
              {!isEmailSent ? (
                <>
                  {/* 헤더 */}
                  <div className="forgot-password-header">
                    <div className="forgot-password-icon">
                      🔑
                    </div>
                    <h1 className="forgot-password-title">
                      비밀번호 찾기
                    </h1>
                    <p className="forgot-password-description">
                      가입하신 이메일 주소를 입력하시면<br />
                      비밀번호 재설정 링크를 발송해드립니다
                    </p>
                  </div>

                  {/* 폼 */}
                  <form onSubmit={handleSubmit}>
                    <div className="forgot-password-form-group">
                      <label className="forgot-password-label">
                        이메일 주소
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="example@email.com"
                        disabled={isLoading}
                        style={{
                          width: '100%',
                          padding: '16px',
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
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading || !formData.email}
                      style={{
                        width: '100%',
                        padding: '16px',
                        fontSize: 'var(--font-size-base)',
                        fontWeight: '600',
                        color: 'white',
                        background: isLoading || !formData.email 
                          ? '#cbd5e0' 
                          : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        border: 'none',
                        borderRadius: '12px',
                        cursor: isLoading || !formData.email ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s ease',
                        fontFamily: "'Noto Sans KR', 'Malgun Gothic', '맑은 고딕', sans-serif"
                      }}
                      onMouseEnter={(e) => {
                        if (!isLoading && formData.email) {
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
                          발송 중...
                        </div>
                      ) : (
                        '비밀번호 재설정 링크 발송'
                      )}
                    </button>
                  </form>

                  {/* 하단 링크 */}
                  <div style={{
                    textAlign: 'center',
                    marginTop: '32px',
                    paddingTop: '24px',
                    borderTop: '1px solid #e2e8f0'
                  }}>
                    <Link
                      to="/login"
                      style={{
                        color: '#667eea',
                        textDecoration: 'none',
                        fontSize: 'var(--font-size-sm)',
                        fontWeight: '500',
                        transition: 'color 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.color = '#5a67d8';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.color = '#667eea';
                      }}
                    >
                      ← 로그인 페이지로 돌아가기
                    </Link>
                  </div>
                </>
              ) : (
                /* 이메일 발송 완료 화면 */
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
                    ✉️
                  </div>
                  
                  <h1 style={{
                    fontSize: 'var(--font-size-xxl)',
                    fontWeight: '700',
                    color: '#2d3748',
                    marginBottom: '16px'
                  }}>
                    이메일을 확인해주세요
                  </h1>
                  
                  <p style={{
                    fontSize: 'var(--font-size-base)',
                    color: '#718096',
                    lineHeight: '1.6',
                    marginBottom: '32px'
                  }}>
                    <strong style={{ color: '#2d3748' }}>{formData.email}</strong><br />
                    위 이메일 주소로 비밀번호 재설정 링크를 발송했습니다.<br />
                    이메일을 확인하여 비밀번호를 재설정해주세요.
                  </p>

                  <div style={{
                    backgroundColor: '#f7fafc',
                    padding: '20px',
                    borderRadius: '12px',
                    marginBottom: '32px',
                    border: '1px solid #e2e8f0'
                  }}>
                    <p style={{
                      fontSize: 'var(--font-size-sm)',
                      color: '#4a5568',
                      lineHeight: '1.5',
                      margin: 0
                    }}>
                      💡 <strong>안내사항</strong><br />
                      • 이메일이 오지 않았다면 스팸함을 확인해주세요<br />
                      • 링크는 24시간 후에 만료됩니다<br />
                      • 링크는 한 번만 사용 가능합니다
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: '12px', flexDirection: 'column' }}>
                    <button
                      onClick={() => setIsEmailSent(false)}
                      style={{
                        width: '100%',
                        padding: '12px',
                        fontSize: 'var(--font-size-sm)',
                        fontWeight: '500',
                        color: '#667eea',
                        background: 'transparent',
                        border: '2px solid #667eea',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        fontFamily: "'Noto Sans KR', 'Malgun Gothic', '맑은 고딕', sans-serif"
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = '#667eea';
                        e.target.style.color = 'white';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = 'transparent';
                        e.target.style.color = '#667eea';
                      }}
                    >
                      다른 이메일로 다시 발송
                    </button>
                    
                    <Link
                      to="/login"
                      style={{
                        display: 'block',
                        width: '100%',
                        padding: '12px',
                        fontSize: 'var(--font-size-sm)',
                        fontWeight: '500',
                        color: '#718096',
                        textDecoration: 'none',
                        textAlign: 'center',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        transition: 'all 0.2s ease',
                        fontFamily: "'Noto Sans KR', 'Malgun Gothic', '맑은 고딕', sans-serif"
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = '#f7fafc';
                        e.target.style.borderColor = '#cbd5e0';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = 'transparent';
                        e.target.style.borderColor = '#e2e8f0';
                      }}
                    >
                      로그인 페이지로 돌아가기
                    </Link>
                  </div>
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

export default ForgotPassword;
