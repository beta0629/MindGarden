import React from 'react';
import { useNavigate } from 'react-router-dom';

const TabletHamburgerMenu = ({ isOpen, onClose, onLogout, userRole }) => {
  const navigate = useNavigate();

  const getMenuItems = (role) => {
    switch (role) {
      case 'CLIENT':
        return [
          { path: '/client/dashboard', icon: 'bi-house', label: '대시보드' },
          { path: '/client/profile', icon: 'bi-person', label: '프로필 편집' },
          { path: '/client/consultations', icon: 'bi-calendar-check', label: '상담 내역' },
          { path: '/client/appointments', icon: 'bi-calendar-plus', label: '상담 예약' },
          { path: '/client/tasks', icon: 'bi-list-task', label: '과제 관리' },
          { path: '/client/settings', icon: 'bi-gear', label: '설정' }
        ];
      case 'CONSULTANT':
        return [
          { path: '/consultant/dashboard', icon: 'bi-house', label: '대시보드' },
          { path: '/consultant/profile', icon: 'bi-person', label: '프로필 편집' },
          { path: '/consultant/schedule', icon: 'bi-calendar-week', label: '일정 관리' },
          { path: '/consultant/clients', icon: 'bi-people', label: '내담자 관리' },
          { path: '/consultant/consultations', icon: 'bi-chat-dots', label: '상담 관리' },
          { path: '/consultant/settings', icon: 'bi-gear', label: '설정' }
        ];
      case 'ADMIN':
        return [
          { path: '/admin/dashboard', icon: 'bi-house', label: '대시보드' },
          { path: '/admin/profile', icon: 'bi-person', label: '프로필 편집' },
          { path: '/admin/users', icon: 'bi-people', label: '사용자 관리' },
          { path: '/admin/consultants', icon: 'bi-person-badge', label: '상담사 관리' },
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

  if (!isOpen) return null;

  return (
    <>
      <div className="hamburger-overlay" onClick={onClose}></div>
      <div className="tablet-hamburger-menu show">
        <div className="hamburger-header">
          <h3>메뉴</h3>
          <button className="close-btn" onClick={onClose}>
            ✕
          </button>
        </div>
        
        <nav className="hamburger-nav">
          <ul>
            {getMenuItems(userRole).map((item, index) => (
              <li key={index}>
                <a 
                  href="#" 
                  onClick={(e) => {
                    e.preventDefault();
                    handleMenuClick(item.path);
                  }}
                >
                  <i className={item.icon}></i>
                  {item.label}
                </a>
              </li>
            ))}
            <li className="logout-item">
              <a href="#" onClick={(e) => {
                e.preventDefault();
                onLogout();
              }}>
                <i className="bi bi-box-arrow-right"></i>
                로그아웃
              </a>
            </li>
          </ul>
        </nav>
      </div>
    </>
  );
};

export default TabletHamburgerMenu;
