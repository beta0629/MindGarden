/**
 * BottomNavigation — 공통 바텀 네비게이션 (Molecule)
 *
 * 상담사·내담자 전용 AppShell에서 사용하는 모바일 퍼스트 바텀 네비게이션.
 * Props로 items와 activeColor를 받아 역할별 테마에 대응.
 *
 * @author MindGarden
 * @since 2026-05-12
 */

import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Home, Calendar, Users, FileText, MoreHorizontal,
  Bookmark, Heart
} from 'lucide-react';
import './BottomNavigation.css';

const ICON_MAP = {
  Home,
  Calendar,
  Users,
  FileText,
  MoreHorizontal,
  Bookmark,
  Heart,
};

const ICON_SIZE = 24;

const BottomNavigation = ({ items = [], activeColor = 'var(--mg-consultant-primary)' }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => {
    if (path === location.pathname) return true;
    return location.pathname.startsWith(path + '/');
  };

  const handleNavClick = (e, path) => {
    e.preventDefault();
    navigate(path);
  };

  return (
    <nav className="mg-bottom-nav" aria-label="메인 네비게이션">
      {items.map((item) => {
        const IconComponent = ICON_MAP[item.icon] || Home;
        const active = isActive(item.path);

        return (
          <a
            key={item.path}
            href={item.path}
            className={`mg-bottom-nav__item ${active ? 'mg-bottom-nav__item--active' : ''}`}
            style={active ? { '--nav-active-color': activeColor } : undefined}
            onClick={(e) => handleNavClick(e, item.path)}
            aria-current={active ? 'page' : undefined}
          >
            <span className="mg-bottom-nav__icon">
              <IconComponent size={ICON_SIZE} />
              {item.badge > 0 && (
                <span className="mg-bottom-nav__badge" aria-label={`알림 ${item.badge}건`}>
                  {item.badge > 99 ? '99+' : item.badge}
                </span>
              )}
              {item.dot && !item.badge && (
                <span className="mg-bottom-nav__dot" aria-label="새 알림" />
              )}
            </span>
            <span className="mg-bottom-nav__label">{item.label}</span>
          </a>
        );
      })}
    </nav>
  );
};

export default BottomNavigation;
