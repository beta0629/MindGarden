/**
 * DesktopGnb - GNB 64px: 로고 | 검색 | 우측 아이콘 그룹
 * RESPONSIVE_LAYOUT_SPEC: 데스크톱 헤더 64px
 *
 * @author CoreSolution
 * @since 2025-02-22
 */

import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { NavLink } from 'react-router-dom';
import { GnbRight } from '../molecules';
import { ADMIN_ROUTES } from '../../../constants/adminRoutes';
import { DEFAULT_GNB_LOGO_LABEL } from '../../../utils/tenantDisplayName';
import './DesktopGnb.css';

const DesktopGnb = ({
  logoLabel = DEFAULT_GNB_LOGO_LABEL,
  logoUrl,
  logoBrandingLoading = false,
  searchValue = '',
  onSearchChange,
  onLogout,
  onModalAction,
  navigateQuickActionsFromLnb
}) => {
  const [logoLoadFailed, setLogoLoadFailed] = useState(false);

  useEffect(() => {
    setLogoLoadFailed(false);
  }, [logoUrl]);

  const showLogoImage = Boolean(logoUrl) && !logoLoadFailed;
  const showTextFallback = !showLogoImage && !logoBrandingLoading;

  return (
    <header className="mg-v2-desktop-gnb" role="banner">
      <NavLink to={ADMIN_ROUTES.DASHBOARD} className="mg-v2-desktop-gnb__logo">
        {showLogoImage ? (
          <img
            src={logoUrl}
            alt={logoLabel}
            className="mg-v2-desktop-gnb__logo-img"
            onError={() => setLogoLoadFailed(true)}
          />
        ) : logoBrandingLoading ? (
          <span
            className="mg-v2-desktop-gnb__logo-placeholder"
            aria-busy="true"
            aria-label="로고 로딩 중"
          />
        ) : (
          showTextFallback ? (
            <span className="mg-v2-desktop-gnb__logo-text">{logoLabel}</span>
          ) : null
        )}
      </NavLink>
      <div className="mg-v2-desktop-gnb__center">
        <GnbRight
          searchValue={searchValue}
          onSearchChange={onSearchChange}
          onLogout={onLogout}
          onModalAction={onModalAction}
          navigateQuickActionsFromLnb={navigateQuickActionsFromLnb}
        />
      </div>
    </header>
  );
};

DesktopGnb.propTypes = {
  logoLabel: PropTypes.string,
  logoUrl: PropTypes.string,
  logoBrandingLoading: PropTypes.bool,
  searchValue: PropTypes.string,
  onSearchChange: PropTypes.func,
  onLogout: PropTypes.func,
  onModalAction: PropTypes.func,
  navigateQuickActionsFromLnb: PropTypes.array
};

export default DesktopGnb;
