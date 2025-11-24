/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react/forbid-dom-props */
import React, { useState } from 'react';
import { COMPONENT_CSS } from '../../constants/css-variables';
import { apiPost, ApiResponse } from '../../utils/api';

interface OnboardingLoginProps {
  onLoginSuccess: (user: any) => void;
  onSkipLogin: () => void;
}

const OnboardingLogin: React.FC<OnboardingLoginProps> = ({ onLoginSuccess, onSkipLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('이메일과 비밀번호를 모두 입력해주세요.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Trinity 로그인 API 호출
      const response = await apiPost<ApiResponse<any>>('/api/auth/login', { email, password });
      if (response.success && response.data) {
        onLoginSuccess(response.data);
      } else {
        setError(response.message || '로그인에 실패했습니다.');
      }
    } catch (err: any) {
      setError(err.message || '로그인 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={COMPONENT_CSS.ONBOARDING.STEP}>
      <h3 className="trinity-onboarding__subtitle">로그인하여 시작하기</h3>
      <p className="trinity-onboarding__description">
        로그인하면 진행 중인 온보딩을 저장하고 나중에 이어서 진행할 수 있습니다.
        <br />
        계정이 없으신 경우 &quot;로그인 없이 시작하기&quot;를 선택해주세요.
      </p>

      {error && (
        <div style={{ 
          color: '#dc3545', 
          backgroundColor: '#f8d7da', 
          padding: '10px', 
          borderRadius: '4px',
          marginBottom: '15px',
          fontSize: '14px'
        }}>
          {error}
        </div>
      )}

      <form onSubmit={handleLogin} style={{ marginTop: '20px' }}>
        <div className={COMPONENT_CSS.ONBOARDING.FIELD}>
          <label className={COMPONENT_CSS.ONBOARDING.LABEL}>이메일</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={COMPONENT_CSS.ONBOARDING.INPUT}
            placeholder="example@email.com"
            disabled={loading}
          />
        </div>

        <div className={COMPONENT_CSS.ONBOARDING.FIELD}>
          <label className={COMPONENT_CSS.ONBOARDING.LABEL}>비밀번호</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={COMPONENT_CSS.ONBOARDING.INPUT}
            placeholder="비밀번호를 입력하세요"
            disabled={loading}
          />
        </div>

        <div className="trinity-onboarding__buttons" style={{ marginTop: '30px' }}>
          <button
            type="button"
            onClick={onSkipLogin}
            className={COMPONENT_CSS.ONBOARDING.BUTTON_SECONDARY}
            disabled={loading}
          >
            로그인 없이 시작하기
          </button>
          <button
            type="submit"
            className={COMPONENT_CSS.ONBOARDING.BUTTON}
            disabled={loading}
          >
            {loading ? '로그인 중...' : '로그인하고 시작하기'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default OnboardingLogin;
