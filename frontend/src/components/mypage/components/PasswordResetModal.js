import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../../constants/api';
import UnifiedModal from '../../common/modals/UnifiedModal';
import MGButton from '../../common/MGButton';

const PasswordResetModal = ({ isOpen, onClose, onSuccess }) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [error, setError] = useState('');
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setEmail('');
      setIsEmailSent(false);
      setError('');
      setCooldown(0);
    }
  }, [isOpen]);

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => {
        setCooldown((prev) => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const validateEmail = (value) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  };

  const handleSubmit = async(e) => {
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
      const response = await fetch(`${API_BASE_URL}/api/password/reset/request`, {
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
        setCooldown(900);
        onSuccess?.();
      } else {
        setError(result.message || '비밀번호 재설정 이메일 발송에 실패했습니다.');
      }
    } catch (err) {
      console.error('비밀번호 재설정 오류:', err);
      setError('비밀번호 재설정 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    setIsEmailSent(false);
    setError('');
    setCooldown(0);
  };

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    if (error) setError('');
  };

  if (!isOpen) return null;

  return (
    <UnifiedModal
      isOpen={isOpen}
      onClose={onClose}
      title="비밀번호 찾기"
      size="medium"
      backdropClick
      showCloseButton
      loading={isLoading}
    >
      {!isEmailSent ? (
        <form onSubmit={handleSubmit} className="mg-mypage-password-form">
          <div className="mg-mypage-password-form__group">
            <label className="mg-mypage-password-form__label" htmlFor="mypage-reset-email">
              이메일 주소
            </label>
            <input
              type="email"
              id="mypage-reset-email"
              className="mg-mypage-password-form__input"
              value={email}
              onChange={handleEmailChange}
              placeholder="가입한 이메일 주소"
              disabled={isLoading || cooldown > 0}
              autoComplete="email"
            />
            {error ? <p className="mg-mypage-password-form__error">{error}</p> : null}
          </div>
          {cooldown > 0 ? (
            <p className="mg-mypage-cooldown">
              다음 요청까지 {Math.floor(cooldown / 60)}분 {cooldown % 60}초 남았습니다.
            </p>
          ) : null}
          <div className="mg-mypage-password-form__actions">
            <MGButton
              type="button"
              className="mg-v2-button mg-v2-button--outline"
              onClick={onClose}
              disabled={isLoading}
              variant="outline"
              preventDoubleClick={false}
            >
              취소
            </MGButton>
            <MGButton
              type="submit"
              className="mg-v2-button mg-v2-button--primary"
              disabled={isLoading || cooldown > 0 || !email.trim()}
              loading={isLoading}
              loadingText="발송 중..."
              variant="primary"
            >
              재설정 이메일 발송
            </MGButton>
          </div>
        </form>
      ) : (
        <div className="mg-mypage-password-reset__success">
          <div className="mg-mypage-password-reset__success-icon" aria-hidden="true">
            ✓
          </div>
          <h3 className="mg-mypage__section-title">이메일이 발송되었습니다</h3>
          <p className="mg-mypage__section-description">
            <strong>{email}</strong>로 비밀번호 재설정 링크를 발송했습니다.
          </p>
          <ol className="mg-mypage-password-reset__steps">
            <li>이메일함을 확인해주세요 (스팸함 포함)</li>
            <li>메일의 링크로 새 비밀번호를 설정하세요</li>
          </ol>
          <div className="mg-mypage-password-form__actions mg-mypage-password-form__actions--center">
            <MGButton
              type="button"
              className="mg-v2-button mg-v2-button--outline"
              onClick={handleRetry}
              disabled={cooldown > 0}
              variant="outline"
              preventDoubleClick={false}
            >
              다시 발송
            </MGButton>
            <MGButton
              type="button"
              className="mg-v2-button mg-v2-button--primary"
              onClick={onClose}
              variant="primary"
            >
              확인
            </MGButton>
          </div>
          {cooldown > 0 ? (
            <p className="mg-mypage-cooldown">
              다시 발송까지 {Math.floor(cooldown / 60)}분 {cooldown % 60}초 남았습니다.
            </p>
          ) : null}
        </div>
      )}
    </UnifiedModal>
  );
};

export default PasswordResetModal;
