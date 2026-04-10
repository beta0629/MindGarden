import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { apiPost } from '../../utils/ajax';
import notificationManager from '../../utils/notification';
import MGButton from '../common/MGButton';
import './AuthPageCommon.css';

const ForgotPassword = () => {
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
      const response = await apiPost('/api/v1/auth/password-reset/send-email', {
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
    <div className="mg-v2-auth-container">
      <div className="mg-v2-auth-hero">
        <div className="mg-v2-auth-hero-content">
          <h1 className="mg-v2-auth-hero-logo">CoreSolution</h1>
          <p className="mg-v2-auth-hero-slogan">비즈니스의 핵심을 솔루션하다</p>
        </div>
      </div>
      
      <div className="mg-v2-auth-content">
        <div className="mg-v2-auth-form-wrapper">
          {!isEmailSent ? (
            <>
              <div>
                <h2 className="mg-v2-auth-title">비밀번호 찾기</h2>
                <p className="mg-v2-auth-subtitle">
                  가입 시 사용한 이메일을 입력하면 비밀번호 재설정 링크를 보내드립니다.
                </p>
              </div>

              <form className="mg-v2-auth-form" onSubmit={handleSubmit} noValidate>
                <div className="mg-v2-form-group">
                  <label className="mg-v2-label" htmlFor="forgotEmail">
                    이메일 주소
                  </label>
                  <input
                    id="forgotEmail"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="example@email.com"
                    disabled={isLoading}
                    className="mg-v2-input"
                    autoComplete="email"
                    required
                  />
                </div>

                <MGButton
                  type="submit"
                  variant="primary"
                  className="mg-v2-button-primary"
                  disabled={isLoading || !formData.email}
                  loading={isLoading}
                  loadingText="발송 중..."
                  preventDoubleClick={false}
                >
                  재설정 링크 전송
                </MGButton>
              </form>

              <Link className="mg-v2-link-text" to="/login">
                ← 로그인 페이지로 돌아가기
              </Link>
            </>
          ) : (
            <div className="mg-v2-auth-success">
              <div className="mg-v2-auth-success-icon" aria-hidden="true">
                ✉️
              </div>
              <div>
                <h2 className="mg-v2-auth-title">이메일을 확인해주세요</h2>
                <p className="mg-v2-auth-success-message">
                  <strong>{formData.email}</strong> 주소로 비밀번호 재설정 링크를 발송했습니다.
                  <br />
                  메일함을 확인해 비밀번호 변경을 완료해주세요.
                </p>
              </div>

              <div className="mg-v2-auth-hint">
                <p>💡 <strong>안내사항</strong></p>
                <ul>
                  <li>이메일이 보이지 않으면 스팸함을 확인해주세요.</li>
                  <li>재설정 링크는 24시간 후 만료됩니다.</li>
                  <li>링크는 한 번만 사용할 수 있습니다.</li>
                </ul>
              </div>

              <div className="mg-v2-auth-success-actions">
                <MGButton
                  type="button"
                  variant="secondary"
                  className="mg-v2-button-secondary"
                  onClick={() => setIsEmailSent(false)}
                  disabled={isLoading}
                  preventDoubleClick={false}
                >
                  다른 이메일로 다시 발송
                </MGButton>
                <Link className="mg-v2-button-secondary" to="/login" style={{ textDecoration: 'none' }}>
                  로그인 페이지로 돌아가기
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
