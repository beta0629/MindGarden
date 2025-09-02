import React from 'react';
import { useNavigate } from 'react-router-dom';
import { TABLET_HAMBURGER_MENU_CSS } from '../../constants/css';
import './TabletHamburgerMenu.css';

const TabletHamburgerMenu = ({ isOpen, onClose, onLogout, userRole }) => {
  const navigate = useNavigate();

  const getMenuItems = (role) => {
    switch (role) {
      case 'CLIENT':
        return [
          { path: '/client/dashboard', icon: 'bi-house', label: '대시보드' },
          { path: '/client/mypage', icon: 'bi-person', label: '마이페이지' },
          { path: '/client/consultations', icon: 'bi-calendar-check', label: '상담 내역' },
          { path: '/client/appointments', icon: 'bi-calendar-plus', label: '상담 예약' },
          { path: '/client/tasks', icon: 'bi-list-task', label: '과제 관리' },
          { path: '/client/settings', icon: 'bi-gear', label: '설정' }
        ];
      case 'CONSULTANT':
        return [
          { path: '/consultant/dashboard', icon: 'bi-house', label: '대시보드' },
          { path: '/consultant/mypage', icon: 'bi-person', label: '마이페이지' },
          { path: '/consultant/schedule', icon: 'bi-calendar-week', label: '일정 관리' },
          { path: '/consultant/clients', icon: 'bi-people', label: '내담자 관리' },
          { path: '/consultant/consultations', icon: 'bi-chat-dots', label: '상담 관리' },
          { path: '/consultant/settings', icon: 'bi-gear', label: '설정' }
        ];
      case 'ADMIN':
        return [
          { path: '/admin/dashboard', icon: 'bi-house', label: '대시보드' },
          { path: '/admin/mypage', icon: 'bi-person', label: '마이페이지' },
          { path: '/admin/users', icon: 'bi-people', label: '사용자 관리' },
          { path: '/admin/consultant-comprehensive', icon: 'bi-person-badge', label: '상담사 관리' },
          { path: '/admin/client-comprehensive', icon: 'bi-person-heart', label: '내담자 관리' },
          { path: '/admin/sessions', icon: 'bi-calendar-check', label: '회기 관리' },
          { path: '/admin/system', icon: 'bi-gear-wide-connected', label: '시스템 설정' }
        ];
      default:
        return [];
    }
  };

  const handleMenuClick = (path) => {
    navigate(path);
    onClose();
  };

  return (
    <div className={`${TABLET_HAMBURGER_MENU_CSS.CONTAINER} ${isOpen ? 'show' : ''}`}>
        <div className={TABLET_HAMBURGER_MENU_CSS.HEADER}>
          <h3 className={TABLET_HAMBURGER_MENU_CSS.TITLE}>메뉴</h3>
          <button className={TABLET_HAMBURGER_MENU_CSS.CLOSE_BUTTON} onClick={onClose}>
            ✕
          </button>
        </div>
        
        <nav className={TABLET_HAMBURGER_MENU_CSS.NAV}>
          <ul className={TABLET_HAMBURGER_MENU_CSS.NAV_LIST}>
            {getMenuItems(userRole).map((item, index) => (
              <li key={index} className={TABLET_HAMBURGER_MENU_CSS.NAV_ITEM}>
                <a 
                  href="#" 
                  className={TABLET_HAMBURGER_MENU_CSS.NAV_LINK}
                  onClick={(e) => {
                    e.preventDefault();
                    handleMenuClick(item.path);
                  }}
                >
                  <i className={`${item.icon} ${TABLET_HAMBURGER_MENU_CSS.NAV_ICON}`}></i>
                  {item.label}
                </a>
              </li>
            ))}
            <li className={`${TABLET_HAMBURGER_MENU_CSS.NAV_ITEM} logout-item`}>
              <a 
                href="#" 
                className={`${TABLET_HAMBURGER_MENU_CSS.NAV_LINK} ${TABLET_HAMBURGER_MENU_CSS.LOGOUT_BUTTON}`}
                onClick={(e) => {
                  e.preventDefault();
                  onLogout();
                }}
              >
                <i className={`bi bi-box-arrow-right ${TABLET_HAMBURGER_MENU_CSS.NAV_ICON}`}></i>
                로그아웃
              </a>
            </li>
          </ul>
        </nav>
    </div>
  );
};

export default TabletHamburgerMenu;
