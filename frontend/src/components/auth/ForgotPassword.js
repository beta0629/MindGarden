import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import CommonPageTemplate from '../common/CommonPageTemplate';
import { apiPost } from '../../utils/ajax';
import notificationManager from '../../utils/notification';
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
      <div className="mg-auth-page">
        <main className="mg-auth-section">
          <div className="mg-auth-card">
            {!isEmailSent ? (
              <>
                <div className="mg-auth-header">
                  <div className="mg-auth-icon" aria-hidden="true">
                    🔑
                  </div>
                  <h1 className="mg-auth-title">비밀번호 찾기</h1>
                  <p className="mg-auth-description">
                    가입하신 이메일 주소를 입력하시면<br />
                    비밀번호 재설정 링크를 발송해드립니다.
                  </p>
                </div>

                <form className="mg-auth-form" onSubmit={handleSubmit} noValidate>
                  <div className="mg-auth-form-group">
                    <label className="mg-auth-label" htmlFor="forgotEmail">
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
                      className="mg-auth-input"
                      autoComplete="email"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="mg-auth-primary-btn"
                    disabled={isLoading || !formData.email}
                  >
                    {isLoading ? (
                      <span className="mg-auth-btn-content">
                        <span className="mg-auth-spinner" aria-hidden="true" />
                        <span>발송 중...</span>
                      </span>
                    ) : (
                      '비밀번호 재설정 링크 발송'
                    )}
                  </button>
                </form>

                <div className="mg-auth-footer">
                  <Link className="mg-auth-link" to="/login">
                    ← 로그인 페이지로 돌아가기
                  </Link>
                </div>
              </>
            ) : (
              <div className="mg-auth-success">
                <div className="mg-auth-success-icon" aria-hidden="true">
                  ✉️
                </div>
                <h2 className="mg-auth-title">이메일을 확인해주세요</h2>
                <p className="mg-auth-success-message">
                  <strong>{formData.email}</strong> 주소로 비밀번호 재설정 링크를 발송했습니다.
                  <br />
                  메일함을 확인해 비밀번호 변경을 완료해주세요.
                </p>

                <div className="mg-auth-hint">
                  <p>
                    💡 <strong>안내사항</strong>
                  </p>
                  <ul>
                    <li>이메일이 보이지 않으면 스팸함을 확인해주세요.</li>
                    <li>재설정 링크는 24시간 후 만료됩니다.</li>
                    <li>링크는 한 번만 사용할 수 있습니다.</li>
                  </ul>
                </div>

                <div className="mg-auth-success-actions">
                  <button
                    type="button"
                    className="mg-auth-secondary-btn"
                    onClick={() => setIsEmailSent(false)}
                    disabled={isLoading}
                  >
                    다른 이메일로 다시 발송
                  </button>
                  <Link className="mg-auth-outline-btn" to="/login">
                    로그인 페이지로 돌아가기
                  </Link>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </CommonPageTemplate>
  );
};

export default ForgotPassword;
