/**
 * MobileLogin — 모바일 최적화 소셜 로그인 화면
 *
 * 카카오·네이버 소셜 로그인 버튼 중심.
 * "다른 방법으로 로그인" 접힘 처리(ID/PW 폼 기본 숨김).
 * 기존 OAuth2Controller·SocialAuthController 연동.
 *
 * @author MindGarden
 * @since 2026-05-12
 */

import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { API_BASE_URL } from '../../constants/api';
import {
  LOGIN_HUB_SNS_PRIMARY_HINT,
  OAUTH_SOCIAL_BUTTON_KAKAO,
  OAUTH_SOCIAL_BUTTON_NAVER
} from '../../constants/loginDisplay';
import { useSession } from '../../contexts/SessionContext';
import { sessionManager } from '../../utils/sessionManager';
import './MobileLogin.css';

const TENANT_ID_KEY = 'mg_tenant_id';

const MobileLogin = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { checkSession } = useSession();
  const [showIdPw, setShowIdPw] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const tenantId = localStorage.getItem(TENANT_ID_KEY) || '';

  useEffect(() => {
    const q = new URLSearchParams(location.search);
    if (q.get('signup') === 'required' && q.get('provider')) {
      navigate(`/login?${q.toString()}`, { replace: true });
    }
  }, [location.search, navigate]);

  const handleSocialLogin = (provider) => {
    const state = encodeURIComponent(JSON.stringify({ tenantId }));
    const socialUrl = `${API_BASE_URL}/oauth2/authorization/${provider}?state=${state}`;
    globalThis.location.href = socialUrl;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const handleSubmit = async(e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      setError('아이디와 비밀번호를 입력해주세요.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(tenantId ? { 'X-Tenant-Id': tenantId } : {})
        },
        credentials: 'include',
        body: JSON.stringify({
          identifier: formData.email,
          password: formData.password
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        await checkSession();
        const user = sessionManager.getUser();
        if (user?.role === 'CONSULTANT') {
          navigate('/consultant/dashboard', { replace: true });
        } else if (user?.role === 'CLIENT') {
          navigate('/client/dashboard', { replace: true });
        } else {
          navigate('/dashboard', { replace: true });
        }
      } else {
        setError(data.message || '로그인에 실패했습니다.');
      }
    } catch (networkError) {
      console.error('[MobileLogin] 로그인 요청 실패:', networkError);
      setError('네트워크 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mg-mobile-login">
      <div className="mg-mobile-login__hero">
        <div className="mg-mobile-login__gradient-bg" />
        <div className="mg-mobile-login__logo-area">
          <h1 className="mg-mobile-login__logo">MindGarden</h1>
          <p className="mg-mobile-login__tagline">마음을 가꾸는 공간</p>
        </div>
      </div>

      <div className="mg-mobile-login__card">
        {/* 소셜 로그인 버튼 */}
        <div className="mg-mobile-login__social-group">
          <button
            className="mg-mobile-login__social-btn mg-mobile-login__social-btn--kakao"
            onClick={() => handleSocialLogin('kakao')}
            type="button"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M10 3C5.58 3 2 5.79 2 9.21c0 2.17 1.45 4.07 3.63 5.15l-.93 3.42c-.08.3.26.54.52.37l4.09-2.69c.22.02.44.03.69.03 4.42 0 8-2.79 8-6.28S14.42 3 10 3z" fill="currentColor"/>
            </svg>
            <span>{OAUTH_SOCIAL_BUTTON_KAKAO}</span>
          </button>

          <button
            className="mg-mobile-login__social-btn mg-mobile-login__social-btn--naver"
            onClick={() => handleSocialLogin('naver')}
            type="button"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M13.56 10.69L6.17 3H3v14h3.44V9.31L13.83 17H17V3h-3.44v7.69z" fill="currentColor"/>
            </svg>
            <span>{OAUTH_SOCIAL_BUTTON_NAVER}</span>
          </button>
        </div>

        <p className="mg-mobile-login__sns-hint" role="note">
          {LOGIN_HUB_SNS_PRIMARY_HINT}
        </p>

        {/* 다른 방법으로 로그인 */}
        <button
          className="mg-mobile-login__toggle"
          onClick={() => setShowIdPw(!showIdPw)}
          type="button"
        >
          <span>다른 방법으로 로그인</span>
          {showIdPw ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>

        {showIdPw && (
          <form className="mg-mobile-login__form" onSubmit={handleSubmit}>
            <div className="mg-mobile-login__field">
              <input
                type="text"
                name="email"
                placeholder="이메일 또는 아이디"
                value={formData.email}
                onChange={handleInputChange}
                className="mg-mobile-login__input"
                autoComplete="username"
              />
            </div>
            <div className="mg-mobile-login__field">
              <input
                type="password"
                name="password"
                placeholder="비밀번호"
                value={formData.password}
                onChange={handleInputChange}
                className="mg-mobile-login__input"
                autoComplete="current-password"
              />
            </div>

            {error && (
              <p className="mg-mobile-login__error" role="alert">{error}</p>
            )}

            <button
              type="submit"
              className="mg-mobile-login__submit"
              disabled={isLoading}
            >
              {isLoading ? '로그인 중...' : '로그인'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default MobileLogin;
