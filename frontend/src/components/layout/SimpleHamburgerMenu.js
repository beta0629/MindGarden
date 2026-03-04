import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { sessionManager } from '../../utils/sessionManager';
import { loadMenuStructure, transformMenuStructure, debugMenuStructure } from '../../utils/menuHelper';
import { hasMenuAccess, validateMenuPath, logPermissionCheck } from '../../utils/menuPermissionValidator';
import { fetchUserPermissions } from '../../utils/permissionUtils';
import CompactConfirmModal from '../common/CompactConfirmModal';
import './SimpleHamburgerMenu.css';

/**
 * 동적 햄버거 메뉴 컴포넌트
/**
 * 공통 코드 기반 권한별 메뉴 표시
/**
 * 
/**
 * @author Core Solution
/**
 * @version 1.0.0
/**
 * @since 2025-09-14
 */
const SimpleHamburgerMenu = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const user = sessionManager.getUser();
  const [expandedItems, setExpandedItems] = useState({});
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [menuStructure, setMenuStructure] = useState(null);
  const [filteredMenus, setFilteredMenus] = useState({ mainMenus: [], subMenus: {} });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // 메뉴 구조 로드 (성능 최적화: 권한 체크 병렬 처리)
  useEffect(() => {
    const loadMenus = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        console.log('🍔 동적 햄버거 메뉴 로딩 시작 (성능 최적화 버전)');
        
        // 병렬로 메뉴 구조와 사용자 권한 동시 로드
        const [structure, userPermissions] = await Promise.all([
          loadMenuStructure(),
          fetchUserPermissions()
        ]);
        
        setMenuStructure(structure);
        console.log('✅ 동적 햄버거 메뉴 로딩 완료');
        
        // 권한에 따라 메뉴 필터링 (권한 체크를 메모리에서 수행)
        const transformedStructure = transformMenuStructure(structure);
        
        // 권한 매핑 테이블 (4역할: ADMIN, STAFF, CONSULTANT, CLIENT)
        const menuGroupPermissionMap = {
          'COMMON_MENU': ['ADMIN_DASHBOARD_VIEW'],
          'ADMIN_MENU': ['ADMIN_DASHBOARD_VIEW', 'USER_MANAGE', 'CONSULTANT_MANAGE', 'CLIENT_MANAGE'],
          'ERP_MENU': ['ERP_ACCESS', 'FINANCIAL_VIEW', 'INTEGRATED_FINANCE_VIEW'],
          'CLIENT_MENU': ['CONSULTATION_RECORD_VIEW'],
          'CONSULTANT_MENU': ['CONSULTATION_RECORD_VIEW', 'SCHEDULE_MANAGE']
        };
        
        // 관리자 여부: 서버에서 받은 role 기준 (동적 권한)
        const isAdmin = user?.role === 'ADMIN';
        
        console.log('🔍 사용자 역할 및 권한 체크:', {
          role: user?.role,
          isAdmin,
          userPermissionsCount: userPermissions?.length || 0,
          userPermissions: userPermissions
        });
        
        // 모든 메뉴 그룹의 권한을 한 번에 체크 (병렬 처리)
        const menuAccessChecks = transformedStructure.mainMenus.map(menu => {
          if (!menu.menuGroup) {
            // 메뉴 그룹이 없는 경우 기본적으로 표시
            return { menu, hasAccess: true };
          }
          
          // 관리자는 모든 메뉴 접근 가능
          if (isAdmin) {
            console.log(`✅ 관리자 권한으로 메뉴 접근 허용: ${menu.label} (${menu.menuGroup})`);
            return { menu, hasAccess: true };
          }
          
          const requiredPermissions = menuGroupPermissionMap[menu.menuGroup];
          if (!requiredPermissions) {
            console.warn(`⚠️ 알 수 없는 메뉴 그룹: ${menu.menuGroup}`);
            return { menu, hasAccess: false };
          }
          
          // 필요한 권한 중 하나라도 있으면 접근 가능
          const hasAccess = requiredPermissions.some(permission => 
            userPermissions && userPermissions.includes(permission)
          );
          
          if (!hasAccess) {
            console.log(`🚫 메뉴 접근 거부: ${menu.label} (${menu.menuGroup}) - 필요한 권한: ${requiredPermissions.join(', ')}`);
          }
          
          return { menu, hasAccess };
        });
        
        const filteredMainMenus = menuAccessChecks
          .filter(({ hasAccess }) => hasAccess)
          .map(({ menu }) => menu);
        
        setFilteredMenus({ 
          mainMenus: filteredMainMenus, 
          subMenus: transformedStructure.subMenus 
        });
        
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

  // 중복 로그 제거 - 렌더링마다 출력되는 로그 제거
  if (!isOpen) {
    return null;
  }

  const handleMenuClick = async (path, menuGroup = null) => {
    if (path && path !== '준비중') {
      // 메뉴 그룹 권한 검증 (비동기)
      if (menuGroup) {
        const hasAccess = await hasMenuAccess(menuGroup);
        if (!hasAccess) {
          logPermissionCheck('메뉴 접근', menuGroup, false);
          return;
        }
      }
      
      // 메뉴 경로 유효성 검증
      if (!validateMenuPath(path)) {
        console.warn(`🚫 유효하지 않은 메뉴 경로: ${path}`);
        return;
      }
      
      logPermissionCheck('메뉴 접근', path, true);
      navigate(path);
      onClose();
    }
  };

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = async () => {
    try {
      await sessionManager.logout();
      console.log('✅ 로그아웃 완료');
    } catch (error) {
      console.error('❌ 로그아웃 실패:', error);
    } finally {
      navigate('/login');
      onClose();
    }
  };

  const toggleExpanded = (itemId) => {
    setExpandedItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  // 필터링된 메뉴 구조 사용
  const { mainMenus, subMenus } = filteredMenus;

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

  // 중복 로그 제거 - 렌더링 시작 로그 제거
  
  return (
    <div className="simple-hamburger-overlay" onClick={onClose}>
      <div className="simple-hamburger-menu" onClick={(e) => e.stopPropagation()}>
        {/* 헤더 영역 */}
        <div className="simple-hamburger-header">
          <div className="user-info">
            <div className="user-name">{user?.name || '사용자'}</div>
        <div className="user-role">
          {(() => {
            // 역할 표시명 우선순위: menuStructure > user.role 매핑 > user.role
            if (menuStructure?.roleDisplayName) {
              return menuStructure.roleDisplayName;
            }
            
            // user.role을 한국어로 매핑
            const roleDisplayMap = {
              'ADMIN': '관리자',
              'BRANCH_SUPER_ADMIN': '지점 관리자',
              'SUPER_ADMIN': '슈퍼 관리자',
              'CONSULTANT': '상담사',
              'CLIENT': '내담자'
            };
            
            return roleDisplayMap[user?.role] || user?.role || '사용자';
          })()}
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
          <button className="simple-logout-btn" onClick={handleLogout}>
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
      <CompactConfirmModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={confirmLogout}
        title="로그아웃"
        message="로그아웃하면 현재 세션이 종료됩니다."
        confirmText="로그아웃"
        cancelText="취소"
        type="danger"
      />
    </div>
  );
};

export default SimpleHamburgerMenu;// 캐시 무효화를 위한 더미 주석 Thu Sep 18 22:25:36 KST 2025
