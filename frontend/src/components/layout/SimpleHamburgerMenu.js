import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { sessionManager } from '../../utils/sessionManager';
import ConfirmModal from '../common/ConfirmModal';
import { loadMenuStructure, transformMenuStructure, debugMenuStructure } from '../../utils/menuHelper';
import './SimpleHamburgerMenu.css';

/**
 * 동적 햄버거 메뉴 컴포넌트
 * 공통 코드 기반 권한별 메뉴 표시
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-09-14
 */
const SimpleHamburgerMenu = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const user = sessionManager.getUser();
  const [expandedItems, setExpandedItems] = useState({});
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [menuStructure, setMenuStructure] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // 메뉴 구조 로드
  useEffect(() => {
    const loadMenus = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        console.log('🍔 동적 햄버거 메뉴 로딩 시작');
        const structure = await loadMenuStructure();
        
        setMenuStructure(structure);
        console.log('✅ 동적 햄버거 메뉴 로딩 완료');
        
        // 디버깅 정보 출력 (개발 환경에서만)
        if (process.env.NODE_ENV === 'development') {
          debugMenuStructure(structure);
        }
        
      } catch (err) {
        console.error('❌ 동적 햄버거 메뉴 로딩 실패:', err);
        setError(err.message || '메뉴를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setIsLoading(false);
      }
    };
    
    if (isOpen && user) {
      loadMenus();
    }
  }, [isOpen, user]);

  console.log('🔍 isOpen 상태 체크:', { isOpen, user });
  if (!isOpen) {
    console.log('❌ 햄버거 메뉴 닫혀있음 - 렌더링 중단');
    return null;
  }
  console.log('✅ 햄버거 메뉴 열려있음 - 렌더링 계속');

  const handleMenuClick = (path) => {
    if (path && path !== '준비중') {
      navigate(path);
      onClose();
    }
  };

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    sessionManager.logout();
    navigate('/login');
    onClose();
  };

  const toggleExpanded = (itemId) => {
    setExpandedItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  // 동적 메뉴 구조 생성
  const getMenuStructure = () => {
    if (!menuStructure || isLoading || error) {
      return { mainMenus: [], subMenus: {} };
    }

    return transformMenuStructure(menuStructure);
  };

  const { mainMenus, subMenus } = getMenuStructure();

  // 로딩 상태 렌더링
  if (isLoading) {
    console.log('🔄 햄버거 메뉴 로딩 중 - 로딩 화면 표시');
    return (
      <div className="simple-hamburger-overlay">
        <div className="simple-hamburger-menu">
          <div className="simple-hamburger-header">
            <div className="user-info">
              <div className="user-name">{user?.name || '사용자'}</div>
              <div className="user-role">{user?.role || 'USER'}</div>
            </div>
            <button className="simple-hamburger-close" onClick={onClose}>
              <i className="bi bi-x"></i>
            </button>
          </div>
          
          <div className="simple-hamburger-content">
            <div className="loading-message">
              <i className="bi bi-arrow-repeat spin"></i>
              <span>메뉴를 불러오는 중...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 오류 상태 렌더링
  if (error) {
    return (
      <div className="simple-hamburger-overlay">
        <div className="simple-hamburger-menu">
          <div className="simple-hamburger-header">
            <div className="user-info">
              <div className="user-name">{user?.name || '사용자'}</div>
              <div className="user-role">{user?.role || 'USER'}</div>
            </div>
            <button className="simple-hamburger-close" onClick={onClose}>
              <i className="bi bi-x"></i>
            </button>
          </div>
          
          <div className="simple-hamburger-content">
            <div className="error-message">
              <i className="bi bi-exclamation-triangle text-warning"></i>
              <span>{error}</span>
              <button 
                className="retry-btn"
                onClick={() => window.location.reload()}
              >
                다시 시도
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  console.log('🔍 SimpleHamburgerMenu 렌더링 시작:', { isOpen, user, menuStructure });
  
  return (
    <div className="simple-hamburger-overlay" onClick={onClose}>
      <div className="simple-hamburger-menu" onClick={(e) => e.stopPropagation()}>
        {/* 헤더 영역 */}
        <div className="simple-hamburger-header">
          <div className="user-info">
            <div className="user-name">{user?.name || '사용자'}</div>
            <div className="user-role">
              {menuStructure?.roleDisplayName || user?.role || 'USER'}
            </div>
          </div>
          <button className="simple-hamburger-close" onClick={onClose}>
            <i className="bi bi-x"></i>
          </button>
        </div>

        {/* 메뉴 콘텐츠 */}
        <div className="simple-hamburger-content">
          <nav className="simple-hamburger-nav">
            {mainMenus.length === 0 ? (
              <div className="no-menu-message">
                <i className="bi bi-info-circle"></i>
                <span>사용 가능한 메뉴가 없습니다.</span>
              </div>
            ) : (
              mainMenus.map((item) => (
                <div key={item.id} className="simple-menu-group">
                  {/* 메인 메뉴 아이템 */}
                  <div
                    className={`simple-menu-item ${item.hasSubMenu ? 'has-submenu' : ''} ${expandedItems[item.id] ? 'expanded' : ''}`}
                    onClick={() => {
                      if (item.hasSubMenu) {
                        toggleExpanded(item.id);
                      } else {
                        handleMenuClick(item.path);
                      }
                    }}
                  >
                    <div className="simple-menu-item-content">
                      {item.icon && <i className={`${item.icon} simple-menu-icon`}></i>}
                      <span className="simple-menu-label">{item.label}</span>
                      {!item.path && <span className="preparing-badge">준비중</span>}
                    </div>
                    
                    {item.hasSubMenu && (
                      <i className={`bi ${expandedItems[item.id] ? 'bi-chevron-up' : 'bi-chevron-down'} simple-expand-icon`}></i>
                    )}
                  </div>

                  {/* 서브 메뉴 */}
                  {item.hasSubMenu && expandedItems[item.id] && subMenus[item.id] && (
                    <div className="simple-submenu">
                      {subMenus[item.id].map((subItem) => (
                        <div
                          key={subItem.id}
                          className="simple-submenu-item"
                          onClick={() => handleMenuClick(subItem.path)}
                        >
                          <div className="simple-submenu-item-content">
                            {subItem.icon && <i className={`${subItem.icon} simple-submenu-icon`}></i>}
                            <span className="simple-submenu-label">{subItem.label}</span>
                            {!subItem.path && <span className="preparing-badge">준비중</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </nav>
        </div>

        {/* 푸터 영역 */}
        <div className="simple-hamburger-footer">
          {console.log('🔍 푸터 영역 렌더링됨 - simple-hamburger-footer')}
          <button className="simple-logout-btn" onClick={handleLogout}>
            {console.log('🔍 로그아웃 버튼 렌더링됨 - simple-logout-btn')}
            <i className="bi bi-box-arrow-right"></i>
            <span>로그아웃</span>
          </button>
          
          {/* 메뉴 정보 (개발 환경에서만) */}
          {process.env.NODE_ENV === 'development' && menuStructure && (
            <div className="menu-debug-info">
              <small>
                총 {menuStructure.totalMenus}개 메뉴 • {menuStructure.userRole}
              </small>
            </div>
          )}
        </div>
      </div>

      {/* 로그아웃 확인 모달 */}
      {showLogoutModal && (
        <ConfirmModal
          isOpen={showLogoutModal}
          onClose={() => setShowLogoutModal(false)}
          onConfirm={confirmLogout}
          title="로그아웃"
          message="정말 로그아웃 하시겠습니까?"
          confirmText="로그아웃"
          cancelText="취소"
        />
      )}
    </div>
  );
};

export default SimpleHamburgerMenu;