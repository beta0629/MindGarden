/**
 * MobileGnb - GNB 56px: 햄버거 | 로고 | 알림/프로필
 * RESPONSIVE_LAYOUT_SPEC: 모바일 헤더 56px
 *
 * @author CoreSolution
 * @since 2025-02-22
 */

import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { NavLink } from 'react-router-dom';
import { NavIcon } from '../atoms';
import { NotificationDropdown, ProfileDropdown } from '../molecules';
import { ADMIN_ROUTES } from '../../../constants/adminRoutes';
import { DEFAULT_GNB_LOGO_LABEL } from '../../../utils/tenantDisplayName';
import './MobileGnb.css';

const MobileGnb = ({
  logoLabel = DEFAULT_GNB_LOGO_LABEL,
  logoUrl,
  logoBrandingLoading = false,
  onMenuClick,
  onLogout
}) => {
  const [logoLoadFailed, setLogoLoadFailed] = useState(false);

  useEffect(() => {
    setLogoLoadFailed(false);
  }, [logoUrl]);

  const trimmedLogoLabel = (logoLabel || '').trim();
  const hasBrandName = Boolean(trimmedLogoLabel);
  const showLogoImage = Boolean(logoUrl) && !logoLoadFailed;
  const showTextFallback = !showLogoImage && !logoBrandingLoading;
  const showBrandNameBesideGraphic = hasBrandName && (showLogoImage || logoBrandingLoading);

  return (
    <header className="mg-v2-mobile-gnb" role="banner">
      <NavIcon icon="MENU" label="메뉴" onClick={onMenuClick} className="mg-v2-mobile-gnb__menu" />
      <NavLink to={ADMIN_ROUTES.DASHBOARD} className="mg-v2-mobile-gnb__logo">
        {showLogoImage ? (
          <>
            <img
              src={logoUrl}
              alt={trimmedLogoLabel || logoLabel}
              className="mg-v2-mobile-gnb__logo-img"
              onError={() => setLogoLoadFailed(true)}
            />
            {showBrandNameBesideGraphic ? (
              <span className="mg-v2-mobile-gnb__brand-name">{trimmedLogoLabel}</span>
            ) : null}
          </>
        ) : logoBrandingLoading ? (
          <>
            <span
              className="mg-v2-mobile-gnb__logo-placeholder"
              aria-busy="true"
              aria-label="로고 로딩 중"
            />
            {showBrandNameBesideGraphic ? (
              <span className="mg-v2-mobile-gnb__brand-name">{trimmedLogoLabel}</span>
            ) : null}
          </>
        ) : showTextFallback && hasBrandName ? (
          <span className="mg-v2-mobile-gnb__logo-text">{trimmedLogoLabel}</span>
        ) : null}
      </NavLink>
      <div className="mg-v2-mobile-gnb__actions">
        <NotificationDropdown />
        <ProfileDropdown onLogout={onLogout} />
      </div>
    </header>
  );
};

MobileGnb.propTypes = {
  logoLabel: PropTypes.string,
  logoUrl: PropTypes.string,
  logoBrandingLoading: PropTypes.bool,
  onMenuClick: PropTypes.func,
  onLogout: PropTypes.func
};

export default MobileGnb;
