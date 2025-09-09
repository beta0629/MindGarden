import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { sessionManager } from '../../utils/sessionManager';
import ConfirmModal from '../common/ConfirmModal';
import { 
  COMMON_MENU_ITEMS, 
  ADMIN_MENU_ITEMS, 
  SUPER_ADMIN_MENU_ITEMS,
  CONSULTANT_MENU_ITEMS, 
  CLIENT_MENU_ITEMS,
  USER_ROLES 
} from '../../constants/menu';
import './SimpleHamburgerMenu.css';

/**
 * 트리 구조 햄버거 메뉴 컴포넌트
 * 사용자 역할에 따른 계층적 메뉴 표시
 */
const SimpleHamburgerMenu = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const user = sessionManager.getUser();
  const [expandedItems, setExpandedItems] = useState({});
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  if (!isOpen) return null;

  const handleMenuClick = (path) => {
    if (path) {
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

  // 상수 기반 메뉴 구조 생성
  const getMenuStructure = () => {
    if (!user) return { mainMenus: [], subMenus: {} };

    // 공통 메뉴 (동적 경로 설정)
    const commonMainMenus = [
      { ...COMMON_MENU_ITEMS.DASHBOARD, path: `/${user.role.toLowerCase()}/dashboard` },
      { ...COMMON_MENU_ITEMS.MYPAGE, path: `/${user.role.toLowerCase()}/mypage` },
      COMMON_MENU_ITEMS.CONSULTATION_HISTORY,
      COMMON_MENU_ITEMS.CONSULTATION_REPORT
    ];

    // 역할별 메뉴 구조
    const roleMenuConfig = {
      [USER_ROLES.ADMIN]: {
        mainMenus: [
          ...commonMainMenus,
          ADMIN_MENU_ITEMS.MAIN.ADMIN,
          ADMIN_MENU_ITEMS.MAIN.USERS,
          ADMIN_MENU_ITEMS.MAIN.SYSTEM
        ],
        subMenus: ADMIN_MENU_ITEMS.SUB
      },
      [USER_ROLES.SUPER_ADMIN]: {
        mainMenus: [
          ...commonMainMenus,
          SUPER_ADMIN_MENU_ITEMS.MAIN.ADMIN,
          SUPER_ADMIN_MENU_ITEMS.MAIN.USERS,
          SUPER_ADMIN_MENU_ITEMS.MAIN.SYSTEM,
          SUPER_ADMIN_MENU_ITEMS.MAIN.FINANCE
        ],
        subMenus: SUPER_ADMIN_MENU_ITEMS.SUB
      },
      [USER_ROLES.CONSULTANT]: {
        mainMenus: [
          ...commonMainMenus,
          CONSULTANT_MENU_ITEMS.MAIN.SCHEDULE,
          CONSULTANT_MENU_ITEMS.MAIN.CONSULTATION
        ],
        subMenus: CONSULTANT_MENU_ITEMS.SUB
      },
      [USER_ROLES.CLIENT]: {
        mainMenus: [
          ...commonMainMenus,
          CLIENT_MENU_ITEMS.MAIN.MESSAGES
        ],
        subMenus: CLIENT_MENU_ITEMS.SUB
      }
    };

    return roleMenuConfig[user.role] || { mainMenus: commonMainMenus, subMenus: {} };
  };

  const { mainMenus, subMenus } = getMenuStructure();

  // 메인메뉴 렌더링
  const renderMainMenu = (menu) => {
    const hasSubMenus = subMenus[menu.id] && subMenus[menu.id].length > 0;
    const isExpanded = expandedItems[menu.id];

    return (
      <div key={menu.id}>
        <button
          className={`simple-hamburger-main-item ${hasSubMenus ? 'simple-hamburger-parent' : ''}`}
          onClick={() => {
            if (hasSubMenus) {
              toggleExpanded(menu.id);
            } else {
              handleMenuClick(menu.path);
            }
          }}
        >
          <i className={`bi ${menu.icon}`}></i>
          <span>{menu.label}</span>
          {hasSubMenus && (
            <i className={`bi ${isExpanded ? 'bi-chevron-down' : 'bi-chevron-right'} simple-hamburger-arrow`}></i>
          )}
        </button>
        
        {hasSubMenus && isExpanded && (
          <div className="simple-hamburger-submenu">
            {subMenus[menu.id].map(subMenu => (
              <button
                key={subMenu.id}
                className="simple-hamburger-sub-item"
                onClick={() => handleMenuClick(subMenu.path)}
              >
                <i className={`bi ${subMenu.icon}`}></i>
                <span>{subMenu.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="simple-hamburger-overlay" onClick={onClose}>
      <div className="simple-hamburger-menu" onClick={(e) => e.stopPropagation()}>
        <div className="simple-hamburger-header">
          <h3>메뉴</h3>
          <button className="simple-hamburger-close" onClick={onClose}>
            <i className="bi bi-x"></i>
          </button>
        </div>
        
        <div className="simple-hamburger-content">
          {/* 메인메뉴 렌더링 */}
          {mainMenus.map(menu => renderMainMenu(menu))}
          
          <div className="simple-hamburger-divider"></div>
          
          {/* 로그아웃 버튼 */}
          <button
            className="simple-hamburger-item simple-hamburger-logout"
            onClick={handleLogout}
          >
            <i className="bi bi-box-arrow-right"></i>
            <span>로그아웃</span>
          </button>
        </div>
      </div>
      
      {/* 로그아웃 확인 모달 */}
      <ConfirmModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={confirmLogout}
        title="로그아웃"
        message="로그아웃 하시겠습니까?"
        confirmText="로그아웃"
        cancelText="취소"
        type="danger"
      />
    </div>
  );
};

export default SimpleHamburgerMenu;
