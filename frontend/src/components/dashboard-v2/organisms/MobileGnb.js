/**
 * MobileGnb - GNB 56px: 햄버거 | 로고 | 알림/프로필
 * RESPONSIVE_LAYOUT_SPEC: 모바일 헤더 56px
 *
 * @author CoreSolution
 * @since 2025-02-22
 */

import React from 'react';
import { NavLink } from 'react-router-dom';
import { Menu, Bell, User } from 'lucide-react';
import { NavIcon } from '../atoms';
import { ADMIN_ROUTES } from '../../../constants/adminRoutes';
import './MobileGnb.css';

const DEFAULT_LOGO_LABEL = '코어솔류션';

const MobileGnb = ({
  logoLabel = DEFAULT_LOGO_LABEL,
  logoUrl,
  onMenuClick,
  onBellClick,
  onProfileClick
}) => {
  return (
    <header className="mg-v2-mobile-gnb" role="banner">
      <NavIcon icon={Menu} label="메뉴" onClick={onMenuClick} className="mg-v2-mobile-gnb__menu" />
      <NavLink to={ADMIN_ROUTES.DASHBOARD} className="mg-v2-mobile-gnb__logo">
        {logoUrl ? (
          <img src={logoUrl} alt={logoLabel} className="mg-v2-mobile-gnb__logo-img" />
        ) : (
          <span className="mg-v2-mobile-gnb__logo-text">{logoLabel}</span>
        )}
      </NavLink>
      <div className="mg-v2-mobile-gnb__actions">
        <NavIcon icon={Bell} label="알림" onClick={onBellClick} />
        <NavIcon icon={User} label="프로필" onClick={onProfileClick} />
      </div>
    </header>
  );
};

export default MobileGnb;
