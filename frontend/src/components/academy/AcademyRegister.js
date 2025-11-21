/**
 * 학원 시스템 테넌트별 회원가입 컴포넌트
 * CSS와 비즈니스 로직 분리, 인라인 스타일 금지, 상수 사용
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-19
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import SimpleLayout from '../layout/SimpleLayout';
import Card from '../ui/Card/Card';
import MGButton from '../common/MGButton';
import { ACADEMY_API } from '../../constants/academy';
import { API_BASE_URL } from '../../constants/api';
import notificationManager from '../../utils/notification';
import { kakaoLogin, naverLogin, googleLogin } from '../../utils/socialLogin';
import './Academy.css';

const AcademyRegister = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tenantId = searchParams.get('tenantId');
  
  const [formData, setFormData] = useState({
    name: '',
    nickname: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    gender: '',
    birthDate: '',
    branchCode: '',
    agreeTerms: false,
    agreePrivacy: false
  });
  
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // 브랜치 목록 로드
  useEffect(() => {
    const loadBranches = async () => {
      try {
        setLoading(true);
        const params = tenantId ? `?tenantId=${tenantId}` : '';
        const response = await fetch(`${API_BASE_URL}${ACADEMY_API.BRANCH_LIST}${params}`, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        const data = await response.json();
        
        if (data.success) {
          setBranches(data.data || []);
        } else {
          setBranches([]);
        }
      } catch (error) {
        console.error('브랜치 목록 로드 실패:', error);
        setBranches([]);
      } finally {
        setLoading(false);
      }
    };

    if (tenantId) {
      loadBranches();
    }
  }, [tenantId]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // 에러 메시지 제거
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = '이름을 입력해주세요.';
    }

    if (!formData.email.trim()) {
      newErrors.email = '이메일을 입력해주세요.';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = '올바른 이메일 형식을 입력해주세요.';
    }

    if (!formData.password) {
      newErrors.password = '비밀번호를 입력해주세요.';
    } else if (formData.password.length < 8) {
      newErrors.password = '비밀번호는 8자 이상이어야 합니다.';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = '비밀번호 확인을 입력해주세요.';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = '비밀번호가 일치하지 않습니다.';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = '전화번호를 입력해주세요.';
    }

    if (!formData.agreeTerms) {
      newErrors.agreeTerms = '이용약관에 동의해주세요.';
    }

    if (!formData.agreePrivacy) {
      newErrors.agreePrivacy = '개인정보처리방침에 동의해주세요.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    if (!tenantId) {
      notificationManager.error('테넌트 정보가 없습니다.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/academy/registration/register?tenantId=${tenantId}`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        notificationManager.success('회원가입이 완료되었습니다.');
        navigate('/login', { 
          state: { 
            message: '회원가입이 완료되었습니다. 로그인해주세요.',
            email: formData.email 
          } 
        });
      } else {
        notificationManager.error(data.message || '회원가입에 실패했습니다.');
      }
    } catch (error) {
      console.error('회원가입 실패:', error);
      notificationManager.error('회원가입 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // SNS 로그인 핸들러 (테넌트 정보 포함)
  const handleSocialLogin = async (provider) => {
    if (!tenantId) {
      notificationManager.error('테넌트 정보가 없습니다.');
      return;
    }

    // 테넌트 정보를 sessionStorage에 저장하여 OAuth2 콜백에서 사용
    sessionStorage.setItem('academy_tenant_id', tenantId);
    sessionStorage.setItem('academy_signup_mode', 'true');

    try {
      switch (provider) {
        case 'kakao':
          await kakaoLogin();
          break;
        case 'naver':
          await naverLogin();
          break;
        case 'google':
          await googleLogin();
          break;
        default:
          notificationManager.error('지원하지 않는 소셜 로그인입니다.');
      }
    } catch (error) {
      console.error('SNS 로그인 실패:', error);
      notificationManager.error('SNS 로그인 중 오류가 발생했습니다.');
    }
  };

  return (
    <SimpleLayout>
      <div className="academy-register">
        <Card>
          <Card.Header>
            <h2>학원 회원가입</h2>
          </Card.Header>
          <Card.Body>
            {!tenantId && (
              <div className="academy-error">
                <p>테넌트 정보가 없습니다. 올바른 링크로 접속해주세요.</p>
              </div>
            )}
            
            {tenantId && (
              <>
                {/* SNS 간편 회원가입 */}
                <div className="academy-social-signup">
                  <h3 className="academy-social-signup-title">간편 회원가입</h3>
                  <p className="academy-social-signup-description">
                    SNS 계정으로 간편하게 가입하세요
                  </p>
                  <div className="academy-social-buttons">
                    <MGButton
                      type="button"
                      variant="outline"
                      onClick={() => handleSocialLogin('kakao')}
                      disabled={loading}
                      className="academy-social-button academy-social-button-kakao"
                    >
                      <span className="academy-social-icon">카카오</span>
                      카카오로 가입
                    </MGButton>
                    <MGButton
                      type="button"
                      variant="outline"
                      onClick={() => handleSocialLogin('naver')}
                      disabled={loading}
                      className="academy-social-button academy-social-button-naver"
                    >
                      <span className="academy-social-icon">네이버</span>
                      네이버로 가입
                    </MGButton>
                    <MGButton
                      type="button"
                      variant="outline"
                      onClick={() => handleSocialLogin('google')}
                      disabled={loading}
                      className="academy-social-button academy-social-button-google"
                    >
                      <span className="academy-social-icon">구글</span>
                      구글로 가입
                    </MGButton>
                  </div>
                  <div className="academy-social-divider">
                    <span>또는</span>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="academy-form">
                {/* 기본 정보 */}
                <div className="academy-form-row">
                  <div className="academy-form-group">
                    <label className="academy-form-label">이름 *</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="academy-form-input"
                      required
                    />
                    {errors.name && <span className="academy-form-error">{errors.name}</span>}
                  </div>
                  <div className="academy-form-group">
                    <label className="academy-form-label">닉네임</label>
                    <input
                      type="text"
                      name="nickname"
                      value={formData.nickname}
                      onChange={handleInputChange}
                      className="academy-form-input"
                    />
                  </div>
                </div>

                <div className="academy-form-row">
                  <div className="academy-form-group">
                    <label className="academy-form-label">이메일 *</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="academy-form-input"
                      required
                    />
                    {errors.email && <span className="academy-form-error">{errors.email}</span>}
                  </div>
                  <div className="academy-form-group">
                    <label className="academy-form-label">전화번호 *</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="academy-form-input"
                      placeholder="010-1234-5678"
                      required
                    />
                    {errors.phone && <span className="academy-form-error">{errors.phone}</span>}
                  </div>
                </div>

                <div className="academy-form-row">
                  <div className="academy-form-group">
                    <label className="academy-form-label">비밀번호 *</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        className="academy-form-input"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer' }}
                      >
                        {showPassword ? '👁️' : '👁️‍🗨️'}
                      </button>
                    </div>
                    {errors.password && <span className="academy-form-error">{errors.password}</span>}
                  </div>
                  <div className="academy-form-group">
                    <label className="academy-form-label">비밀번호 확인 *</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        className="academy-form-input"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer' }}
                      >
                        {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                      </button>
                    </div>
                    {errors.confirmPassword && <span className="academy-form-error">{errors.confirmPassword}</span>}
                  </div>
                </div>

                {/* 브랜치 선택 */}
                {branches.length > 0 && (
                  <div className="academy-form-group">
                    <label className="academy-form-label">지점 선택</label>
                    <select
                      name="branchCode"
                      value={formData.branchCode}
                      onChange={handleInputChange}
                      className="academy-form-select"
                    >
                      <option value="">지점을 선택하세요 (선택사항)</option>
                      {branches.map(branch => (
                        <option key={branch.id} value={branch.branchCode}>
                          {branch.branchName} ({branch.branchCode})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* 약관 동의 */}
                <div className="academy-form-group">
                  <label className="academy-form-label">
                    <input
                      type="checkbox"
                      name="agreeTerms"
                      checked={formData.agreeTerms}
                      onChange={handleInputChange}
                    />
                    이용약관에 동의합니다 *
                  </label>
                  {errors.agreeTerms && <span className="academy-form-error">{errors.agreeTerms}</span>}
                </div>

                <div className="academy-form-group">
                  <label className="academy-form-label">
                    <input
                      type="checkbox"
                      name="agreePrivacy"
                      checked={formData.agreePrivacy}
                      onChange={handleInputChange}
                    />
                    개인정보처리방침에 동의합니다 *
                  </label>
                  {errors.agreePrivacy && <span className="academy-form-error">{errors.agreePrivacy}</span>}
                </div>

                {/* 액션 버튼 */}
                <div className="academy-form-actions">
                  <MGButton
                    type="button"
                    variant="outline"
                    onClick={() => navigate('/login')}
                    disabled={loading}
                  >
                    취소
                  </MGButton>
                  <MGButton
                    type="submit"
                    variant="primary"
                    loading={loading}
                    disabled={loading}
                  >
                    회원가입
                  </MGButton>
                </div>
              </form>
              </>
            )}
          </Card.Body>
        </Card>
      </div>
    </SimpleLayout>
  );
};

export default AcademyRegister;

