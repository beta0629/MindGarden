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
import { DEFAULT_GNB_LOGO_LABEL } from '../../../utils/tenantDisplayName';
import './DesktopGnb.css';

/** 역할 미전달 시 운영 랜딩(레거시 /admin/dashboard 하드코딩 제거) */
const DEFAULT_LOGO_HOME_PATH = '/erp/dashboard';

const DesktopGnb = ({
  logoLabel = DEFAULT_GNB_LOGO_LABEL,
  logoUrl,
  logoHomePath = DEFAULT_LOGO_HOME_PATH,
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

  const trimmedLogoLabel = (logoLabel || '').trim();
  const hasBrandName = Boolean(trimmedLogoLabel);
  const showLogoImage = Boolean(logoUrl) && !logoLoadFailed;
  const showTextFallback = !showLogoImage && !logoBrandingLoading;
  const showBrandNameBesideGraphic = hasBrandName && (showLogoImage || logoBrandingLoading);
  const resolvedLogoHome = logoHomePath || DEFAULT_LOGO_HOME_PATH;

  return (
    <header className="mg-v2-desktop-gnb" role="banner">
      <NavLink to={resolvedLogoHome} className="mg-v2-desktop-gnb__logo">
        {showLogoImage ? (
          <>
            <img
              src={logoUrl}
              alt={trimmedLogoLabel || logoLabel}
              className="mg-v2-desktop-gnb__logo-img"
              onError={(e) => {
                e.currentTarget.onerror = null;
                setLogoLoadFailed(true);
              }}
            />
            {showBrandNameBesideGraphic ? (
              <span className="mg-v2-desktop-gnb__brand-name">{trimmedLogoLabel}</span>
            ) : null}
          </>
        ) : logoBrandingLoading ? (
          <>
            <span
              className="mg-v2-desktop-gnb__logo-placeholder"
              aria-busy="true"
              aria-label="로고 로딩 중"
            />
            {showBrandNameBesideGraphic ? (
              <span className="mg-v2-desktop-gnb__brand-name">{trimmedLogoLabel}</span>
            ) : null}
          </>
        ) : showTextFallback && hasBrandName ? (
          <span className="mg-v2-desktop-gnb__logo-text">{trimmedLogoLabel}</span>
        ) : null}
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
  logoHomePath: PropTypes.string,
  logoBrandingLoading: PropTypes.bool,
  searchValue: PropTypes.string,
  onSearchChange: PropTypes.func,
  onLogout: PropTypes.func,
  onModalAction: PropTypes.func,
  navigateQuickActionsFromLnb: PropTypes.array
};

export default DesktopGnb;
