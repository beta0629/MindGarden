import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../../constants/api';
import './PasswordResetModal.css';

/**
 * 비밀번호 찾기 모달 컴포넌트
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-17
 */
const PasswordResetModal = ({ isOpen, onClose, onSuccess }) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [error, setError] = useState('');
  const [cooldown, setCooldown] = useState(0);

  // 모달이 열릴 때 상태 초기화
  useEffect(() => {
    if (isOpen) {
      setEmail('');
      setIsEmailSent(false);
      setError('');
      setCooldown(0);
    }
  }, [isOpen]);

  // 쿨다운 타이머
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => {
        setCooldown(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  // 이메일 유효성 검사
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // 비밀번호 재설정 이메일 발송
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setError('이메일을 입력해주세요.');
      return;
    }
    
    if (!validateEmail(email)) {
      setError('올바른 이메일 형식이 아닙니다.');
      return;
    }

    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ email })
      });

      const result = await response.json();
      
      if (result.success) {
        setIsEmailSent(true);
        setCooldown(900); // 15분 쿨다운
        onSuccess && onSuccess();
      } else {
        setError(result.message || '비밀번호 재설정 이메일 발송에 실패했습니다.');
      }
    } catch (error) {
      console.error('비밀번호 재설정 오류:', error);
      setError('비밀번호 재설정 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 다시 시도
  const handleRetry = () => {
    setIsEmailSent(false);
    setError('');
    setCooldown(0);
  };

  // 이메일 입력값 변경
  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    if (error) {
      setError('');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="password-reset-modal-overlay">
      <div className="password-reset-modal">
        <div className="password-reset-modal-header">
          <h3>
            <i className="bi bi-key"></i>
            비밀번호 찾기
          </h3>
          <button 
            className="close-btn" 
            onClick={onClose}
            disabled={isLoading}
          >
            <i className="bi bi-x"></i>
          </button>
        </div>

        <div className="password-reset-modal-content">
          {!isEmailSent ? (
            <form onSubmit={handleSubmit} className="password-reset-form">
              <div className="form-group">
                <label htmlFor="email">
                  <i className="bi bi-envelope"></i>
                  이메일 주소
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={handleEmailChange}
                  className={`form-control ${error ? 'is-invalid' : ''}`}
                  placeholder="가입한 이메일 주소를 입력하세요"
                  disabled={isLoading || cooldown > 0}
                />
                {error && (
                  <div className="invalid-feedback">
                    {error}
                  </div>
                )}
              </div>

              {cooldown > 0 && (
                <div className="cooldown-notice">
                  <i className="bi bi-clock"></i>
                  <span>다음 요청까지 {Math.floor(cooldown / 60)}분 {cooldown % 60}초 남았습니다.</span>
                </div>
              )}

              <div className="form-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={onClose}
                  disabled={isLoading}
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isLoading || cooldown > 0 || !email.trim()}
                >
                  {isLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      발송 중...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-send me-2"></i>
                      재설정 이메일 발송
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            <div className="email-sent-success">
              <div className="success-icon">
                <i className="bi bi-check-circle-fill"></i>
              </div>
              <h4>이메일이 발송되었습니다!</h4>
              <p>
                <strong>{email}</strong>로 비밀번호 재설정 링크를 발송했습니다.
              </p>
              <div className="email-instructions">
                <h5>다음 단계:</h5>
                <ol>
                  <li>이메일함을 확인해주세요 (스팸함도 확인해주세요)</li>
                  <li>이메일에 포함된 링크를 클릭하세요</li>
                  <li>새로운 비밀번호를 설정하세요</li>
                </ol>
              </div>
              <div className="email-actions">
                <button
                  className="btn btn-outline-primary"
                  onClick={handleRetry}
                  disabled={cooldown > 0}
                >
                  <i className="bi bi-arrow-clockwise me-2"></i>
                  다시 발송
                </button>
                <button
                  className="btn btn-primary"
                  onClick={onClose}
                >
                  <i className="bi bi-check me-2"></i>
                  확인
                </button>
              </div>
              {cooldown > 0 && (
                <div className="cooldown-notice">
                  <i className="bi bi-clock"></i>
                  <span>다시 발송까지 {Math.floor(cooldown / 60)}분 {cooldown % 60}초 남았습니다.</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PasswordResetModal;
