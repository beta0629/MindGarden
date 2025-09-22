import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getDashboardPath } from '../../utils/session';

const TabletBottomNavigation = ({ userRole }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const getNavigationItems = (role) => {
    switch (role) {
      case 'CLIENT':
        return [
          { path: getDashboardPath('CLIENT'), icon: 'bi-house', label: '홈' },
          { path: '/client/consultations', icon: 'bi-calendar-check', label: '상담' },
          { path: '/client/tasks', icon: 'bi-list-task', label: '과제' },
          { path: '/client/profile', icon: 'bi-person', label: '프로필' }
        ];
      case 'CONSULTANT':
        return [
          { path: getDashboardPath('CONSULTANT'), icon: 'bi-house', label: '홈' },
          { path: '/consultant/schedule', icon: 'bi-calendar-week', label: '일정' },
          { path: '/consultant/clients', icon: 'bi-people', label: '내담자' },
          { path: '/consultant/profile', icon: 'bi-person', label: '프로필' }
        ];
      case 'ADMIN':
        return [
          { path: getDashboardPath('ADMIN'), icon: 'bi-house', label: '홈' },
          { path: '/admin/users', icon: 'bi-people', label: '사용자' },
          { path: '/admin/system', icon: 'bi-gear', label: '설정' },
          { path: '/admin/profile', icon: 'bi-person', label: '프로필' }
        ];
      default:
        return [];
    }
  };

  const handleNavigation = (path) => {
    navigate(path);
  };

  const navigationItems = getNavigationItems(userRole);

  return (
    <nav className="tablet-bottom-nav">
      <div className="bottom-nav-content">
        {navigationItems.map((item, index) => (
          <a
            key={index}
            href="#"
            className={`bottom-nav-item ${location.pathname === item.path ? 'active' : ''}`}
            onClick={(e) => {
              e.preventDefault();
              handleNavigation(item.path);
            }}
          >
            <i className={item.icon}></i>
            <span>{item.label}</span>
          </a>
        ))}
      </div>
    </nav>
  );
};

export default TabletBottomNavigation;
