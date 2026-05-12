/**
 * ClientAppShell — 내담자 전용 레이아웃 (Template)
 *
 * 바텀 네비게이션 5탭(홈|예약|내 상담|웰니스|더보기) + AppTopBar 조합.
 * 반응형: 모바일/태블릿 → 바텀 네비, 데스크톱 → 좌측 사이드바.
 * 내담자 테마 색상(코랄) 적용.
 *
 * @author MindGarden
 * @since 2026-05-12
 */

import React from 'react';
import { Outlet } from 'react-router-dom';
import {
  Home, Calendar, Bookmark, Heart, MoreHorizontal
} from 'lucide-react';
import AppTopBar from './AppTopBar';
import BottomNavigation from './BottomNavigation';
import { useNotification } from '../../contexts/NotificationContext';
import './ClientAppShell.css';

const CLIENT_NAV_ITEMS = [
  { icon: 'Home', label: '홈', path: '/client', badge: 0 },
  { icon: 'Calendar', label: '예약', path: '/client/booking', badge: 0 },
  { icon: 'Bookmark', label: '내 상담', path: '/client/consultations', badge: 0 },
  { icon: 'Heart', label: '웰니스', path: '/client/wellness-hub', badge: 0 },
  { icon: 'MoreHorizontal', label: '더보기', path: '/client/more', badge: 0 },
];

const SIDEBAR_ICON_MAP = { Home, Calendar, Bookmark, Heart, MoreHorizontal };

const ClientAppShell = ({ title = '', showBack = false, onBack, children }) => {
  const { unreadCount } = useNotification();

  return (
    <div className="mg-app-shell mg-app-shell--client">
      {/* 데스크톱 사이드바 */}
      <aside className="mg-app-shell__sidebar" aria-label="메인 네비게이션">
        <div className="mg-app-shell__sidebar-logo">
          <span className="mg-app-shell__sidebar-logo-text">MindGarden</span>
        </div>
        <nav className="mg-app-shell__sidebar-nav">
          {CLIENT_NAV_ITEMS.map((item) => {
            const Icon = SIDEBAR_ICON_MAP[item.icon] || Home;
            return (
              <a
                key={item.path}
                href={item.path}
                className="mg-app-shell__sidebar-item"
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
          title={title}
          showBack={showBack}
          onBack={onBack}
          notificationCount={unreadCount}
          themeClass="mg-top-bar--client"
        />

        <main className="mg-app-shell__content">
          {children || <Outlet />}
        </main>

        {/* 모바일/태블릿 바텀 네비게이션 */}
        <BottomNavigation
          items={CLIENT_NAV_ITEMS}
          activeColor="var(--mg-client-primary)"
        />
      </div>
    </div>
  );
};

export default ClientAppShell;
