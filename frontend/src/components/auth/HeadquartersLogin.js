import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CommonPageTemplate from '../common/CommonPageTemplate';
import SimpleHeader from '../layout/SimpleHeader';
import { API_ENDPOINTS } from '../../constants/api';
import { useSession } from '../../contexts/SessionContext';
import { getDashboardPath } from '../../utils/session';
import notificationManager from '../../utils/notification';
import './BranchLogin.css';

/**
 * 본사 로그인 컴포넌트
 * URL: /login/headquarters
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-09-12
 */
const HeadquartersLogin = () => {
  const navigate = useNavigate();
  const { setUser, setBranch } = useSession();
  
  // === 상태 관리 ===
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [headquartersInfo, setHeadquartersInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingInfo, setIsLoadingInfo] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);

  // === 초기 로딩 ===
  useEffect(() => {
    loadHeadquartersInfo();
  }, []);

  // === API 호출 함수들 ===
  
  /**
   * 본사 정보 조회
   */
  const loadHeadquartersInfo = async () => {
    try {
      setIsLoadingInfo(true);
      setError(null);
      
      const response = await fetch(`${API_ENDPOINTS.AUTH}/headquarters`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '본사 정보를 불러오는데 실패했습니다.');
      }

      const data = await response.json();
      setHeadquartersInfo(data.headquarters);
    } catch (error) {
      console.error('본사 정보 조회 오류:', error);
      setError(error.message);
      notificationManager.show(error.message, 'error');
    } finally {
      setIsLoadingInfo(false);
    }
  };

  /**
   * 본사 로그인
   */
  const handleHeadquartersLogin = async (e) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      notificationManager.show('이메일과 비밀번호를 입력해주세요.', 'warning');
      return;
    }

    setIsLoading(true);
    try {
      const loginData = {
        email: formData.email,
        password: formData.password
      };

      console.log('🏢 본사 로그인 요청:', loginData);

      const response = await fetch(`${API_ENDPOINTS.AUTH}/headquarters/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(loginData)
      });

      const result = await response.json();

      if (result.success) {
        console.log('✅ 본사 로그인 성공:', result);
        
        // 세션에 사용자 정보 저장
        setUser(result.user);
        setBranch(null); // 본사 로그인은 지점 정보 없음
        
        // 로그인 성공 알림
        notificationManager.show('로그인에 성공했습니다.', 'success');
        
        // 역할에 따른 대시보드로 리다이렉트
        const dashboardPath = getDashboardPath(result.user.role);
        console.log('✅ 로그인 성공, 대시보드로 이동:', dashboardPath);
        navigate(dashboardPath, { replace: true });
      } else if (result.requiresConfirmation) {
        // 중복 로그인 확인 요청
        console.log('🔔 중복 로그인 확인 요청:', result.message);
        notificationManager.show(result.message, 'warning');
      } else {
        console.log('❌ 로그인 실패:', result.message);
        notificationManager.show(result.message, 'error');
      }
    } catch (error) {
      console.error('❌ 본사 로그인 오류:', error);
      notificationManager.show(`로그인 처리 중 오류가 발생했습니다: ${error.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // === 이벤트 핸들러 ===

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const togglePassword = () => {
    setShowPassword(!showPassword);
  };

  // === 로딩 상태 ===
  if (isLoadingInfo) {
    return (
      <CommonPageTemplate 
        title="본사 로그인" 
        description="본사 정보를 불러오는 중..."
        bodyClass="branch-login-page"
      >
        <SimpleHeader title="본사 로그인" />
        <div className="branch-login-container">
          <div className="login-card">
            <div className="loading-spinner">
              <div className="spinner"></div>
              <p>본사 정보를 불러오는 중...</p>
            </div>
          </div>
        </div>
      </CommonPageTemplate>
    );
  }

  // === 에러 상태 ===
  if (error) {
    return (
      <CommonPageTemplate 
        title="본사 로그인" 
        description="본사 정보를 불러올 수 없습니다"
        bodyClass="branch-login-page"
      >
        <SimpleHeader title="본사 로그인" />
        <div className="branch-login-container">
          <div className="login-card">
            <div className="error-state">
              <div className="error-icon">❌</div>
              <h3>본사 정보를 불러올 수 없습니다</h3>
              <p>{error}</p>
              <div className="error-actions">
                <button
                  type="button"
                  className="retry-button"
                  onClick={loadHeadquartersInfo}
                >
                  다시 시도
                </button>
                <button
                  type="button"
                  className="link-button"
                  onClick={() => navigate('/login')}
                >
                  메인 로그인으로 이동
                </button>
              </div>
            </div>
          </div>
        </div>
      </CommonPageTemplate>
    );
  }

  // === 렌더링 ===

  return (
    <CommonPageTemplate 
      title="본사 로그인" 
      description="본사 관리자 로그인"
      bodyClass="branch-login-page"
    >
      <SimpleHeader title="본사 로그인" />
      
      <div className="branch-login-container">
        <div className="login-card">
          {/* 본사 정보 표시 */}
          {headquartersInfo && (
            <div className="branch-info-header">
              <div className="branch-info headquarters-info">
                <h2>🏢 {headquartersInfo.name}</h2>
                <p className="branch-description">{headquartersInfo.description}</p>
                <div className="branch-stats">
                  <span className="stat-item">
                    전체 지점: {headquartersInfo.totalBranches || 0}개
                  </span>
                  <span className="stat-item">
                    활성 지점: {headquartersInfo.activeBranches || 0}개
                  </span>
                  <span className="stat-item">
                    전체 상담사: {headquartersInfo.totalConsultants || 0}명
                  </span>
                  <span className="stat-item">
                    전체 내담자: {headquartersInfo.totalClients || 0}명
                  </span>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleHeadquartersLogin} className="login-form">
            {/* 이메일 입력 */}
            <div className="form-group">
              <label htmlFor="email">이메일 *</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="form-input"
                placeholder="이메일을 입력하세요"
                required
              />
            </div>

            {/* 비밀번호 입력 */}
            <div className="form-group">
              <label htmlFor="password">비밀번호 *</label>
              <div className="password-input-group">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="비밀번호를 입력하세요"
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={togglePassword}
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            {/* 로그인 버튼 */}
            <button
              type="submit"
              className="login-button"
              disabled={isLoading}
            >
              {isLoading ? '로그인 중...' : '로그인'}
            </button>
          </form>

          {/* 본사 로그인 안내 */}
          <div className="login-info">
            <div className="info-box headquarters-info">
              <h4>🏢 본사 로그인</h4>
              <ul>
                <li>본사 관리자만 로그인 가능합니다</li>
                <li>전체 지점 관리 및 통계 조회</li>
                <li>시스템 설정 및 사용자 관리</li>
                <li>지점별 성과 모니터링</li>
              </ul>
            </div>
          </div>

          {/* 다른 로그인 옵션 */}
          <div className="login-links">
            <button
              type="button"
              className="link-button"
              onClick={() => navigate('/login/branch')}
            >
              지점 로그인
            </button>
            <button
              type="button"
              className="link-button"
              onClick={() => navigate('/login')}
            >
              메인 로그인으로 이동
            </button>
          </div>
        </div>
      </div>
    </CommonPageTemplate>
  );
};

export default HeadquartersLogin;
