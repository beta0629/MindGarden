import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CommonPageTemplate from '../common/CommonPageTemplate';
import TabletHeader from '../layout/TabletHeader';
import TabletBottomNavigation from '../layout/TabletBottomNavigation';

const TabletHomepage = () => {
  const navigate = useNavigate();
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    console.log('🏠 TabletHomepage 마운트됨');
    console.log('📍 현재 경로:', window.location.pathname);
    console.log('🔗 현재 URL:', window.location.href);
    
    // 페이지 로딩 애니메이션 시작
    const timer = setTimeout(() => {
      setIsLoaded(true);
      console.log('📱 테블릿 홈페이지 애니메이션 시작');
    }, 100);
    
    return () => {
      console.log('🏠 TabletHomepage 언마운트됨');
      clearTimeout(timer);
    };
  }, []);

  const handleLogin = () => {
    console.log('🔐 로그인 버튼 클릭됨');
    navigate('/login');
  };

  const handleRegister = () => {
    console.log('📝 회원가입 버튼 클릭됨');
    navigate('/register');
  };

  const handleHamburgerToggle = () => {
    console.log('🍔 햄버거 메뉴 토글');
    // TODO: 햄버거 메뉴 로직 구현
  };

  const handleProfileClick = () => {
    console.log('👤 프로필 클릭');
    // TODO: 프로필 페이지로 이동
  };

  return (
    <CommonPageTemplate 
      title="MindGarden - 마음의 정원을 가꾸는 상담 서비스"
      description="전문 상담사와 함께 마음의 평화를 찾아보세요. 언제 어디서나 편리하게 상담을 받을 수 있습니다."
      bodyClass="tablet-page"
    >
      <div className="tablet-homepage tablet-page">
        {/* 공통 헤더 */}
        <TabletHeader 
          user={null} 
          onHamburgerToggle={handleHamburgerToggle}
          onProfileClick={handleProfileClick}
        />
        
        <main className="tablet-main">
          <div className="tablet-container">
            <div className={`welcome-section ${isLoaded ? 'fade-in-up' : ''}`}>
              <div className="welcome-content">
                <h1 className="welcome-title">MindGarden에 오신 것을 환영합니다</h1>
                <p className="welcome-subtitle">
                  마음의 정원을 가꾸는 상담 서비스
                </p>
                <p className="welcome-description">
                  전문 상담사와 함께 마음의 평화를 찾아보세요.<br />
                  언제 어디서나 편리하게 상담을 받을 수 있습니다.
                </p>
              </div>
            </div>

            <div className={`action-section ${isLoaded ? 'fade-in-up' : ''}`} style={{ animationDelay: '0.2s' }}>
              <div className="action-cards">
                <div className="action-card login-card">
                  <div className="card-icon">🔐</div>
                  <h3 className="card-title">로그인</h3>
                  <p className="card-description">
                    기존 계정으로 로그인하여 서비스를 이용하세요
                  </p>
                  <button 
                    className="action-button primary" 
                    onClick={handleLogin}
                  >
                    로그인하기
                  </button>
                </div>

                <div className="action-card register-card">
                  <div className="card-icon">📝</div>
                  <h3 className="card-title">회원가입</h3>
                  <p className="card-description">
                    새로운 계정을 만들어 상담 서비스를 시작하세요
                  </p>
                  <button 
                    className="action-button secondary" 
                    onClick={handleRegister}
                  >
                    회원가입하기
                  </button>
                </div>
              </div>
            </div>

            <div className={`features-section ${isLoaded ? 'fade-in-up' : ''}`} style={{ animationDelay: '0.4s' }}>
              <h2 className="features-title">주요 서비스</h2>
              <div className="features-grid">
                <div className="feature-item">
                  <div className="feature-icon">🧠</div>
                  <h4>전문 상담</h4>
                  <p>경험 많은 상담사와의 1:1 상담</p>
                </div>
                <div className="feature-item">
                  <div className="feature-icon">📱</div>
                  <h4>편리한 접근</h4>
                  <p>언제 어디서나 상담 예약 및 진행</p>
                </div>
                <div className="feature-item">
                  <div className="feature-icon">🔒</div>
                  <h4>안전한 보안</h4>
                  <p>개인정보 보호 및 암호화</p>
                </div>
                <div className="feature-item">
                  <div className="feature-icon">💬</div>
                  <h4>실시간 채팅</h4>
                  <p>상담사와의 즉시 소통</p>
                </div>
              </div>
            </div>

            <div className={`info-section ${isLoaded ? 'fade-in-up' : ''}`} style={{ animationDelay: '0.6s' }}>
              <div className="info-content">
                <h3 className="info-title">상담 서비스 이용 안내</h3>
                <ul className="info-list">
                  <li>• 상담 예약은 로그인 후 가능합니다</li>
                  <li>• 상담 시간은 50분이며, 사전 예약제입니다</li>
                  <li>• 개인정보는 철저히 보호됩니다</li>
                  <li>• 상담 내용은 비밀이 보장됩니다</li>
                </ul>
              </div>
            </div>
          </div>
        </main>
        
        {/* 공통 하단 네비게이션 */}
        <TabletBottomNavigation userRole={null} />
      </div>
    </CommonPageTemplate>
  );
};

export default TabletHomepage;
