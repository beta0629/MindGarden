/**
 * ClientAppShell — 내담자 전용 레이아웃 (Template)
 *
 * 바텀 네비게이션 5탭(홈|예약|내 상담|웰니스|더보기) + AppTopBar 조합.
 * 레거시 AppShell 라우트용 바텀 네비 유지. 데스크톱 사이드바/LNB 없음(v4 헤더 정책).
 * 내담자 테마 색상(코랄) 적용.
 *
 * @author MindGarden
 * @since 2026-05-12
 */

import React from 'react';
import { Outlet } from 'react-router-dom';
import AppTopBar from './AppTopBar';
import BottomNavigation from './BottomNavigation';
import { useNotification } from '../../contexts/NotificationContext';
import './ConsultantAppShell.css';
import './ClientAppShell.css';

const CLIENT_NAV_ITEMS = [
  { icon: 'Home', label: '홈', path: '/client', badge: 0 },
  { icon: 'Calendar', label: '예약', path: '/client/booking', badge: 0 },
  { icon: 'Bookmark', label: '내 상담', path: '/client/consultations', badge: 0 },
  { icon: 'Heart', label: '웰니스', path: '/client/wellness-hub', badge: 0 },
  { icon: 'MoreHorizontal', label: '더보기', path: '/client/more', badge: 0 }
];

const ClientAppShell = ({ title = '', showBack = false, onBack, children }) => {
  const { unreadCount } = useNotification();

  return (
    <div className="mg-app-shell mg-app-shell--client">
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

        {/* 모바일/태블릿 바텀 네비게이션 — 레거시 AppShell 라우트용 */}
        <BottomNavigation
          items={CLIENT_NAV_ITEMS}
          activeColor="var(--mg-client-primary)"
        />
      </div>
    </div>
  );
};

export default ClientAppShell;
