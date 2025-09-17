import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CommonPageTemplate from '../common/CommonPageTemplate';
import SimpleHeader from '../layout/SimpleHeader';
import TabletBottomNavigation from '../layout/TabletBottomNavigation';
import { HOMEPAGE_CONSTANTS } from '../../constants/css-variables';
import { useSession } from '../../contexts/SessionContext';
import notificationManager from '../../utils/notification';

const TabletHomepage = () => {
  const navigate = useNavigate();
  const { user, logout } = useSession();
  const [isLoaded, setIsLoaded] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

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
    const { MESSAGES } = HOMEPAGE_CONSTANTS;
    console.log('🍔 햄버거 메뉴 토글');
    
    setIsMenuOpen(prev => {
      const newState = !prev;
      notificationManager.info(newState ? MESSAGES.MENU_OPENED : MESSAGES.MENU_CLOSED);
      return newState;
    });
  };

  const handleProfileClick = () => {
    const { MESSAGES } = HOMEPAGE_CONSTANTS;
    console.log('👤 프로필 클릭');
    
    if (user) {
      // 로그인된 사용자: 프로필 메뉴 토글
      setIsProfileMenuOpen(prev => {
        const newState = !prev;
        notificationManager.info(newState ? MESSAGES.PROFILE_OPENED : MESSAGES.PROFILE_CLOSED);
        return newState;
      });
    } else {
      // 로그인되지 않은 사용자: 로그인 페이지로 이동
      navigate('/login');
    }
  };

  const handleMenuClick = (menuItem) => {
    const { MENU_ITEMS } = HOMEPAGE_CONSTANTS;
    console.log('메뉴 클릭:', menuItem);
    
    setIsMenuOpen(false);
    
    switch (menuItem) {
      case MENU_ITEMS.HOME:
        navigate('/');
        break;
      case MENU_ITEMS.LOGIN:
        navigate('/login');
        break;
      case MENU_ITEMS.REGISTER:
        navigate('/register');
        break;
      case MENU_ITEMS.ABOUT:
        navigate('/about');
        break;
      case MENU_ITEMS.SERVICES:
        navigate('/services');
        break;
      case MENU_ITEMS.CONTACT:
        navigate('/contact');
        break;
      default:
        console.log('알 수 없는 메뉴 항목:', menuItem);
    }
  };

  const handleProfileMenuClick = async (menuItem) => {
    const { PROFILE_MENU_ITEMS, MESSAGES } = HOMEPAGE_CONSTANTS;
    console.log('프로필 메뉴 클릭:', menuItem);
    
    setIsProfileMenuOpen(false);
    
    switch (menuItem) {
      case PROFILE_MENU_ITEMS.DASHBOARD:
        // 사용자 역할에 따른 대시보드로 이동
        const dashboardPath = user?.role ? `/${user.role.toLowerCase()}/dashboard` : '/dashboard';
        navigate(dashboardPath);
        break;
      case PROFILE_MENU_ITEMS.PROFILE:
        navigate('/mypage');
        break;
      case PROFILE_MENU_ITEMS.SETTINGS:
        navigate('/settings');
        break;
      case PROFILE_MENU_ITEMS.LOGOUT:
        try {
          await logout();
          notificationManager.success(MESSAGES.LOGOUT_SUCCESS);
          navigate('/');
        } catch (error) {
          console.error('로그아웃 실패:', error);
          notificationManager.error(MESSAGES.LOGOUT_ERROR);
        }
        break;
      default:
        console.log('알 수 없는 프로필 메뉴 항목:', menuItem);
    }
  };

  const handleOverlayClick = () => {
    setIsMenuOpen(false);
    setIsProfileMenuOpen(false);
  };

  return (
    <CommonPageTemplate 
      title="MindGarden - 마음의 정원을 가꾸는 상담 서비스"
      description="전문 상담사와 함께 마음의 평화를 찾아보세요. 언제 어디서나 편리하게 상담을 받을 수 있습니다."
      bodyClass="tablet-page"
    >
      <div className="tablet-homepage tablet-page">
        {/* 공통 헤더 */}
        <SimpleHeader 
          onHamburgerToggle={handleHamburgerToggle}
          onProfileClick={handleProfileClick}
        />
        
        {/* 햄버거 메뉴 */}
        {isMenuOpen && (
          <div className="hamburger-menu-overlay" onClick={handleOverlayClick}>
            <div className="hamburger-menu" onClick={(e) => e.stopPropagation()}>
              <div className="hamburger-menu-header">
                <h3>메뉴</h3>
                <button 
                  className="hamburger-menu-close"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <i className="bi bi-x"></i>
                </button>
              </div>
              <div className="hamburger-menu-content">
                <button 
                  className="hamburger-menu-item"
                  onClick={() => handleMenuClick(HOMEPAGE_CONSTANTS.MENU_ITEMS.HOME)}
                >
                  <i className="bi bi-house"></i>
                  홈
                </button>
                <button 
                  className="hamburger-menu-item"
                  onClick={() => handleMenuClick(HOMEPAGE_CONSTANTS.MENU_ITEMS.ABOUT)}
                >
                  <i className="bi bi-info-circle"></i>
                  소개
                </button>
                <button 
                  className="hamburger-menu-item"
                  onClick={() => handleMenuClick(HOMEPAGE_CONSTANTS.MENU_ITEMS.SERVICES)}
                >
                  <i className="bi bi-heart"></i>
                  서비스
                </button>
                <button 
                  className="hamburger-menu-item"
                  onClick={() => handleMenuClick(HOMEPAGE_CONSTANTS.MENU_ITEMS.CONTACT)}
                >
                  <i className="bi bi-telephone"></i>
                  문의
                </button>
                {!user && (
                  <>
                    <button 
                      className="hamburger-menu-item"
                      onClick={() => handleMenuClick(HOMEPAGE_CONSTANTS.MENU_ITEMS.LOGIN)}
                    >
                      <i className="bi bi-box-arrow-in-right"></i>
                      로그인
                    </button>
                    <button 
                      className="hamburger-menu-item"
                      onClick={() => handleMenuClick(HOMEPAGE_CONSTANTS.MENU_ITEMS.REGISTER)}
                    >
                      <i className="bi bi-person-plus"></i>
                      회원가입
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* 프로필 메뉴 */}
        {isProfileMenuOpen && user && (
          <div className="profile-menu-overlay" onClick={handleOverlayClick}>
            <div className="profile-menu" onClick={(e) => e.stopPropagation()}>
              <div className="profile-menu-header">
                <div className="profile-menu-user">
                  <div className="profile-menu-avatar">
                    {user.profileImageUrl ? (
                      <img src={user.profileImageUrl} alt={user.name} />
                    ) : (
                      <i className="bi bi-person-circle"></i>
                    )}
                  </div>
                  <div className="profile-menu-info">
                    <h4>{user.name}</h4>
                    <p>{user.email}</p>
                  </div>
                </div>
                <button 
                  className="profile-menu-close"
                  onClick={() => setIsProfileMenuOpen(false)}
                >
                  <i className="bi bi-x"></i>
                </button>
              </div>
              <div className="profile-menu-content">
                <button 
                  className="profile-menu-item"
                  onClick={() => handleProfileMenuClick(HOMEPAGE_CONSTANTS.PROFILE_MENU_ITEMS.DASHBOARD)}
                >
                  <i className="bi bi-speedometer2"></i>
                  대시보드
                </button>
                <button 
                  className="profile-menu-item"
                  onClick={() => handleProfileMenuClick(HOMEPAGE_CONSTANTS.PROFILE_MENU_ITEMS.PROFILE)}
                >
                  <i className="bi bi-person"></i>
                  프로필
                </button>
                <button 
                  className="profile-menu-item"
                  onClick={() => handleProfileMenuClick(HOMEPAGE_CONSTANTS.PROFILE_MENU_ITEMS.SETTINGS)}
                >
                  <i className="bi bi-gear"></i>
                  설정
                </button>
                <button 
                  className="profile-menu-item profile-menu-logout"
                  onClick={() => handleProfileMenuClick(HOMEPAGE_CONSTANTS.PROFILE_MENU_ITEMS.LOGOUT)}
                >
                  <i className="bi bi-box-arrow-right"></i>
                  로그아웃
                </button>
              </div>
            </div>
          </div>
        )}
        
        <main className="tablet-main">
          <div className="tablet-container">
            <div style={{
              textAlign: 'center',
              padding: '80px 20px 60px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              borderRadius: '0 0 40px 40px',
              marginBottom: '60px',
              position: 'relative',
              overflow: 'hidden',
              opacity: isLoaded ? 1 : 0,
              transform: isLoaded ? 'translateY(0)' : 'translateY(30px)',
              transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
            }}>
              {/* 배경 장식 */}
              <div style={{
                position: 'absolute',
                top: '-50%',
                right: '-20%',
                width: '300px',
                height: '300px',
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '50%',
                filter: 'blur(100px)'
              }} />
              <div style={{
                position: 'absolute',
                bottom: '-30%',
                left: '-10%',
                width: '200px',
                height: '200px',
                background: 'rgba(255, 255, 255, 0.08)',
                borderRadius: '50%',
                filter: 'blur(80px)'
              }} />
              
              <div style={{ position: 'relative', zIndex: 2 }}>
                <div style={{
                  display: 'inline-block',
                  padding: '8px 24px',
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  borderRadius: '50px',
                  marginBottom: '24px',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.3)'
                }}>
                  <span style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: 'rgba(255, 255, 255, 0.95)',
                    fontFamily: "'Noto Sans KR', 'Malgun Gothic', '맑은 고딕', sans-serif"
                  }}>
                    🌿 전문 심리상담 플랫폼
                  </span>
                </div>
                
                <h1 style={{
                  fontSize: '48px',
                  fontWeight: '700',
                  marginBottom: '20px',
                  lineHeight: '1.2',
                  background: 'linear-gradient(135deg, #ffffff 0%, #f8f9ff 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  fontFamily: "'Noto Sans KR', 'Malgun Gothic', '맑은 고딕', sans-serif"
                }}>
                  마음의 평화를<br />찾아가는 여정
                </h1>
                
                <p style={{
                  fontSize: '20px',
                  lineHeight: '1.6',
                  marginBottom: '40px',
                  color: 'rgba(255, 255, 255, 0.9)',
                  maxWidth: '600px',
                  margin: '0 auto 40px',
                  fontFamily: "'Noto Sans KR', 'Malgun Gothic', '맑은 고딕', sans-serif"
                }}>
                  전문 상담사와 함께 안전하고 편안한 환경에서<br />
                  당신만의 속도로 마음을 돌보세요
                </p>
              </div>
            </div>


            <div style={{
              padding: '80px 20px',
              background: '#ffffff',
              opacity: isLoaded ? 1 : 0,
              transform: isLoaded ? 'translateY(0)' : 'translateY(30px)',
              transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
              transitionDelay: '0.4s'
            }}>
              <div style={{
                textAlign: 'center',
                marginBottom: '60px'
              }}>
                <h2 style={{
                  fontSize: '36px',
                  fontWeight: '700',
                  color: '#2d3748',
                  marginBottom: '16px',
                  fontFamily: "'Noto Sans KR', 'Malgun Gothic', '맑은 고딕', sans-serif"
                }}>
                  전문적이고 안전한 상담 서비스
                </h2>
                <p style={{
                  fontSize: '18px',
                  color: '#718096',
                  lineHeight: '1.6',
                  fontFamily: "'Noto Sans KR', 'Malgun Gothic', '맑은 고딕', sans-serif"
                }}>
                  당신의 마음 건강을 위한 체계적인 관리 시스템
                </p>
              </div>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '32px',
                maxWidth: '1200px',
                margin: '0 auto'
              }}>
                <div style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  padding: '40px 32px',
                  borderRadius: '20px',
                  color: 'white',
                  textAlign: 'center',
                  boxShadow: '0 20px 40px rgba(102, 126, 234, 0.3)',
                  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-8px)';
                  e.currentTarget.style.boxShadow = '0 30px 60px rgba(102, 126, 234, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 20px 40px rgba(102, 126, 234, 0.3)';
                }}
                >
                  <div style={{
                    width: '64px',
                    height: '64px',
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    borderRadius: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '28px',
                    margin: '0 auto 24px',
                    backdropFilter: 'blur(10px)'
                  }}>
                    🧠
                  </div>
                  <h4 style={{
                    fontSize: '20px',
                    fontWeight: '600',
                    marginBottom: '12px',
                    fontFamily: "'Noto Sans KR', 'Malgun Gothic', '맑은 고딕', sans-serif"
                  }}>
                    전문 상담
                  </h4>
                  <p style={{
                    fontSize: '16px',
                    lineHeight: '1.5',
                    color: 'rgba(255, 255, 255, 0.9)',
                    fontFamily: "'Noto Sans KR', 'Malgun Gothic', '맑은 고딕', sans-serif"
                  }}>
                    경험 많은 상담사와의 1:1 상담
                  </p>
                </div>

                <div style={{
                  background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                  padding: '40px 32px',
                  borderRadius: '20px',
                  color: 'white',
                  textAlign: 'center',
                  boxShadow: '0 20px 40px rgba(240, 147, 251, 0.3)',
                  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-8px)';
                  e.currentTarget.style.boxShadow = '0 30px 60px rgba(240, 147, 251, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 20px 40px rgba(240, 147, 251, 0.3)';
                }}
                >
                  <div style={{
                    width: '64px',
                    height: '64px',
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    borderRadius: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '28px',
                    margin: '0 auto 24px',
                    backdropFilter: 'blur(10px)'
                  }}>
                    📱
                  </div>
                  <h4 style={{
                    fontSize: '20px',
                    fontWeight: '600',
                    marginBottom: '12px',
                    fontFamily: "'Noto Sans KR', 'Malgun Gothic', '맑은 고딕', sans-serif"
                  }}>
                    편리한 접근
                  </h4>
                  <p style={{
                    fontSize: '16px',
                    lineHeight: '1.5',
                    color: 'rgba(255, 255, 255, 0.9)',
                    fontFamily: "'Noto Sans KR', 'Malgun Gothic', '맑은 고딕', sans-serif"
                  }}>
                    언제 어디서나 상담 예약 및 진행
                  </p>
                </div>

                <div style={{
                  background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                  padding: '40px 32px',
                  borderRadius: '20px',
                  color: 'white',
                  textAlign: 'center',
                  boxShadow: '0 20px 40px rgba(79, 172, 254, 0.3)',
                  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-8px)';
                  e.currentTarget.style.boxShadow = '0 30px 60px rgba(79, 172, 254, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 20px 40px rgba(79, 172, 254, 0.3)';
                }}
                >
                  <div style={{
                    width: '64px',
                    height: '64px',
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    borderRadius: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '28px',
                    margin: '0 auto 24px',
                    backdropFilter: 'blur(10px)'
                  }}>
                    🔒
                  </div>
                  <h4 style={{
                    fontSize: '20px',
                    fontWeight: '600',
                    marginBottom: '12px',
                    fontFamily: "'Noto Sans KR', 'Malgun Gothic', '맑은 고딕', sans-serif"
                  }}>
                    안전한 보안
                  </h4>
                  <p style={{
                    fontSize: '16px',
                    lineHeight: '1.5',
                    color: 'rgba(255, 255, 255, 0.9)',
                    fontFamily: "'Noto Sans KR', 'Malgun Gothic', '맑은 고딕', sans-serif"
                  }}>
                    개인정보 보호 및 암호화
                  </p>
                </div>

                <div style={{
                  background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
                  padding: '40px 32px',
                  borderRadius: '20px',
                  color: 'white',
                  textAlign: 'center',
                  boxShadow: '0 20px 40px rgba(250, 112, 154, 0.3)',
                  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-8px)';
                  e.currentTarget.style.boxShadow = '0 30px 60px rgba(250, 112, 154, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 20px 40px rgba(250, 112, 154, 0.3)';
                }}
                >
                  <div style={{
                    width: '64px',
                    height: '64px',
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    borderRadius: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '28px',
                    margin: '0 auto 24px',
                    backdropFilter: 'blur(10px)'
                  }}>
                    💬
                  </div>
                  <h4 style={{
                    fontSize: '20px',
                    fontWeight: '600',
                    marginBottom: '12px',
                    fontFamily: "'Noto Sans KR', 'Malgun Gothic', '맑은 고딕', sans-serif"
                  }}>
                    실시간 채팅
                  </h4>
                  <p style={{
                    fontSize: '16px',
                    lineHeight: '1.5',
                    color: 'rgba(255, 255, 255, 0.9)',
                    fontFamily: "'Noto Sans KR', 'Malgun Gothic', '맑은 고딕', sans-serif"
                  }}>
                    상담사와의 즉시 소통
                  </p>
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
