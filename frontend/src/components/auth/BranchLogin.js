import React, { useState, useEffect } from 'react';
// import UnifiedLoading from '../../components/common/UnifiedLoading'; // 임시 비활성화
import { useNavigate } from 'react-router-dom';
import CommonPageTemplate from '../common/CommonPageTemplate';
import SimpleLayout from '../layout/SimpleLayout';
import UnifiedHeader from "../common/UnifiedHeader";
// 임시 비활성화
import { API_ENDPOINTS } from '../../constants/api';
import { useSession } from '../../contexts/SessionContext';
import { getDashboardPath, redirectToDashboardWithFallback } from '../../utils/session';
import notificationManager from '../../utils/notification';
import csrfTokenManager from '../../utils/csrfTokenManager';
import './BranchLogin.css';

/**
 * 지점별 로그인 컴포넌트
/**
 * 
/**
 * @author MindGarden
/**
 * @version 1.0.0
/**
 * @since 2025-09-12
 */
const BranchLogin = () => {
  const navigate = useNavigate();
  const { setUser, setBranch } = useSession();
  
  // === 상태 관리 ===
  const [loginType, setLoginType] = useState('HEADQUARTERS'); // HEADQUARTERS, BRANCH
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    // ⚠️ 표준화 2025-12-05: Deprecated - 브랜치 개념 제거
    branchCode: ''
  });
  const [branches, setBranches] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // === 초기 로딩 ===
  useEffect(() => {
    loadBranches();
  }, []);

  // === API 호출 함수들 ===
  
/**
   * 지점 목록 조회
   */
  const loadBranches = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.AUTH + '/branches', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('지점 목록을 불러오는데 실패했습니다.');
      }

      const data = await response.json();
      setBranches(data.branches || []);
    } catch (error) {
      console.error('지점 목록 조회 오류:', error);
      notificationManager.show('지점 목록을 불러오는데 실패했습니다.', 'error');
    }
  };

/**
   * 지점별 로그인
   */
  const handleBranchLogin = async (e) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      notificationManager.show('이메일과 비밀번호를 입력해주세요.', 'warning');
      return;
    }

    if (loginType === 'BRANCH' && !formData.branchCode) {
      notificationManager.show('지점 코드를 선택해주세요.', 'warning');
      return;
    }

    setIsLoading(true);
    try {
      const loginData = {
        email: formData.email,
        password: formData.password,
        // ⚠️ 표준화 2025-12-05: Deprecated - 브랜치 개념 제거
        branchCode: loginType === 'BRANCH' ? formData.branchCode : null,
        loginType: loginType
      };

      console.log('🏢 지점별 로그인 요청:', loginData);

      const response = await csrfTokenManager.post(API_ENDPOINTS.AUTH + '/branch-login', loginData);

      const result = await response.json();

      if (result.success) {
        console.log('✅ 지점별 로그인 성공:', result);
        
        // 세션에 사용자 정보 저장
        setUser(result.user);
        if (result.branch) {
          setBranch(result.branch);
        }
        
        // 로그인 성공 알림
        notificationManager.show('로그인에 성공했습니다.', 'success');
        
        // 공통 리다이렉션 함수 사용
        console.log('✅ 로그인 성공, 대시보드로 이동:', result.user.role);
        redirectToDashboardWithFallback(result.user.role, navigate);
      } else if (result.requiresConfirmation) {
        // 중복 로그인 확인 요청
        console.log('🔔 중복 로그인 확인 요청:', result.message);
        notificationManager.show(result.message, 'warning');
      } else {
        console.log('❌ 로그인 실패:', result.message);
        notificationManager.show(result.message, 'error');
      }
    } catch (error) {
      console.error('❌ 지점별 로그인 오류:', error);
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

  const handleLoginTypeChange = (type) => {
    setLoginType(type);
    setFormData(prev => ({
      ...prev,
      // ⚠️ 표준화 2025-12-05: Deprecated - 브랜치 개념 제거
      branchCode: ''
    }));
  };

  const togglePassword = () => {
    setShowPassword(!showPassword);
  };

  // === 렌더링 ===

  return (
    <CommonPageTemplate 
      title="지점별 로그인" 
      description="본사 또는 지점별로 로그인하세요"
      bodyClass="branch-login-page"
    >
      <UnifiedHeader />
      
      <div className="branch-login-container">
        <div className="login-card">
          <div className="login-header">
            <h2>마인드가든 로그인</h2>
            <p>본사 또는 지점별로 로그인하세요</p>
          </div>

          {/* 로그인 유형 선택 */}
          <div className="login-type-selector">
            <button
              type="button"
              className={`type-button ${loginType === 'HEADQUARTERS' ? 'active' : ''}`}
              onClick={() => handleLoginTypeChange('HEADQUARTERS')}
            >
              🏢 본사 로그인
            </button>
            <button
              type="button"
              className={`type-button ${loginType === 'BRANCH' ? 'active' : ''}`}
              onClick={() => handleLoginTypeChange('BRANCH')}
            >
              🏪 지점 로그인
            </button>
          </div>

          <form onSubmit={handleBranchLogin} className="login-form">
            {/* 지점 선택 (지점 로그인시에만 표시) */}
            {loginType === 'BRANCH' && (
              <div className="form-group">
                <label htmlFor="branchCode">지점 선택 *</label>
                <select
                  id="branchCode"
                  name="branchCode"
                  value={formData.branchCode}
                  onChange={handleInputChange}
                  className="form-select"
                  required
                >
                  <option value="">지점을 선택하세요</option>
                  {branches.map((branch) => (
                    <option key={branch.id} value={branch.branchCode}>
                      {branch.branchCode} - {branch.branchName}
                    </option>
                  ))}
                </select>
              </div>
            )}

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

          {/* 로그인 유형별 안내 */}
          <div className="login-info">
            {loginType === 'HEADQUARTERS' ? (
              <div className="info-box headquarters-info">
                <h4>🏢 본사 로그인</h4>
                <ul>
                  <li>본사 관리자만 로그인 가능합니다</li>
                  <li>전체 지점 관리 및 통계 조회</li>
                  <li>시스템 설정 및 사용자 관리</li>
                </ul>
              </div>
            ) : (
              <div className="info-box branch-info">
                <h4>🏪 지점 로그인</h4>
                <ul>
                  <li>해당 지점에 소속된 사용자만 로그인 가능</li>
                  <li>지점별 상담사/내담자 관리</li>
                  <li>지점 운영 및 통계 조회</li>
                </ul>
              </div>
            )}
          </div>

          {/* 기존 로그인 링크 */}
          <div className="login-links">
            <button
              type="button"
              className="link-button"
              onClick={() => navigate('/login')}
            >
              기존 로그인 페이지로 이동
            </button>
          </div>
        </div>
      </div>
    </CommonPageTemplate>
  );
};

export default BranchLogin;
