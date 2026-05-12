/**
 * ConsultantAppShell — 상담사 전용 레이아웃 (Template)
 *
 * 바텀 네비게이션 5탭(홈|스케줄|내담자|일지|더보기) + AppTopBar 조합.
 * 반응형: 모바일/태블릿 → 바텀 네비, 데스크톱 → 좌측 사이드바.
 * 상담사 테마 색상 적용.
 *
 * @author MindGarden
 * @since 2026-05-12
 */

import React, { useMemo } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Home, Calendar, Users, FileText, MoreHorizontal
} from 'lucide-react';
import AppTopBar from './AppTopBar';
import BottomNavigation from './BottomNavigation';
import { useNotification } from '../../contexts/NotificationContext';
import './ConsultantAppShell.css';

const CONSULTANT_NAV_ITEMS = [
  { icon: 'Home', label: '홈', path: '/consultant/renewal/dashboard', badge: 0 },
  { icon: 'Calendar', label: '스케줄', path: '/consultant/renewal/schedule', badge: 0 },
  { icon: 'Users', label: '내담자', path: '/consultant/renewal/clients', badge: 0 },
  { icon: 'FileText', label: '일지', path: '/consultant/renewal/consultation-records', badge: 0 },
  { icon: 'MoreHorizontal', label: '더보기', path: '/consultant/more', badge: 0 },
];

const SIDEBAR_ICON_MAP = { Home, Calendar, Users, FileText, MoreHorizontal };

const TITLE_MAP = {
  '/consultant/renewal/dashboard': 'MindGarden',
  '/consultant/renewal/schedule': '스케줄',
  '/consultant/renewal/clients': '내담자',
  '/consultant/renewal/consultation-records': '일지',
};

const ConsultantAppShell = ({ title = '', showBack = false, onBack, children }) => {
  const { unreadCount } = useNotification();
  const location = useLocation();
  const navigate = useNavigate();

  const currentTitle = useMemo(() => {
    if (title) return title;
    return TITLE_MAP[location.pathname] || 'MindGarden';
  }, [title, location.pathname]);

  const isHome = location.pathname === '/consultant/renewal/dashboard'
    || location.pathname === '/consultant/renewal';

  return (
    <div className="mg-app-shell mg-app-shell--consultant">
      {/* 데스크톱 사이드바 */}
      <aside className="mg-app-shell__sidebar" aria-label="메인 네비게이션">
        <div className="mg-app-shell__sidebar-logo">
          <span className="mg-app-shell__sidebar-logo-text">MindGarden</span>
        </div>
        <nav className="mg-app-shell__sidebar-nav">
          {CONSULTANT_NAV_ITEMS.map((item) => {
            const Icon = SIDEBAR_ICON_MAP[item.icon] || Home;
            const isActive = location.pathname === item.path
              || location.pathname.startsWith(item.path + '/');
            return (
              <a
                key={item.path}
                href={item.path}
                className={`mg-app-shell__sidebar-item ${isActive ? 'mg-app-shell__sidebar-item--active' : ''}`}
                onClick={(e) => {
                  e.preventDefault();
                  navigate(item.path);
                }}
              >
                <Icon size={22} />
                <span>{item.label}</span>
              </a>
            );
          })}
        </nav>
      </aside>

      {/* 메인 영역 */}
      <div className="mg-app-shell__main">
        <AppTopBar
          title={currentTitle}
          showBack={showBack || !isHome}
          onBack={onBack}
          notificationCount={unreadCount}
          themeClass="mg-top-bar--consultant"
        />

        <main className="mg-app-shell__content">
          {children || <Outlet />}
        </main>

        {/* 모바일/태블릿 바텀 네비게이션 */}
        <BottomNavigation
          items={CONSULTANT_NAV_ITEMS}
          activeColor="var(--mg-consultant-primary)"
        />
      </div>
    </div>
  );
};

export default ConsultantAppShell;
