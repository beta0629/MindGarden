/**
 * MobileGnb - GNB: 햄버거 | 로고/타이틀 | (시계) | 검색·알림·빠른작업·프로필
 * soft-sheet 관리자: Desktop GNB 기능(검색≥1024, 시계≥1280, 빠른 작업)을 헤더에 유지.
 *
 * @author CoreSolution
 * @since 2025-02-22
 */

import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { NavLink } from 'react-router-dom';
import { CurrentTimeChip, NavIcon, SearchInput } from '../atoms';
import { GnbRight, NotificationDropdown, ProfileDropdown } from '../molecules';
import { DEFAULT_GNB_LOGO_LABEL } from '../../../utils/tenantDisplayName';
import SafeText from '../../common/SafeText';
import './MobileGnb.css';

/** 역할 미전달 시 운영 랜딩(로그인 SSOT `/admin/dashboard`와 일치) */
const DEFAULT_LOGO_HOME_PATH = '/admin/dashboard';

const MobileGnb = ({
  logoLabel = DEFAULT_GNB_LOGO_LABEL,
  logoUrl,
  logoHomePath = DEFAULT_LOGO_HOME_PATH,
  logoBrandingLoading = false,
  headerTitle,
  onMenuClick,
  onLogout,
  shellTone,
  searchValue = '',
  onSearchChange,
  hideSearch = false,
  navigateQuickActionsFromLnb,
  menuExpanded = false
}) => {
  const [logoLoadFailed, setLogoLoadFailed] = useState(false);
  const isAdminShell = shellTone === 'admin';

  useEffect(() => {
    setLogoLoadFailed(false);
  }, [logoUrl]);

  const trimmedLogoLabel = (logoLabel || '').trim();
  const hasBrandName = Boolean(trimmedLogoLabel);
  const showLogoImage = Boolean(logoUrl) && !logoLoadFailed;
  const showTextFallback = !showLogoImage && !logoBrandingLoading;
  const showBrandNameBesideGraphic = hasBrandName && (showLogoImage || logoBrandingLoading);
  const resolvedLogoHome = logoHomePath || DEFAULT_LOGO_HOME_PATH;
  const pageTitle = (headerTitle || '').trim();

  const gnbClassName = [
    'mg-v2-mobile-gnb',
    isAdminShell ? 'mg-v2-mobile-gnb--admin-shell' : ''
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <header className={gnbClassName} role="banner">
      <div className="mg-v2-mobile-gnb__left">
        <NavIcon
          icon="MENU"
          label="메뉴"
          onClick={onMenuClick}
          className="mg-v2-mobile-gnb__menu"
          aria-expanded={menuExpanded ? 'true' : 'false'}
          aria-controls={isAdminShell || shellTone === 'counselor' ? 'mg-v2-soft-sheet-drawer' : undefined}
        />
        {isAdminShell && pageTitle ? (
          <span className="mg-v2-mobile-gnb__page-title">
            <SafeText>{pageTitle}</SafeText>
          </span>
        ) : (
          <NavLink to={resolvedLogoHome} className="mg-v2-mobile-gnb__logo">
            {showLogoImage ? (
              <>
                <img
                  src={logoUrl}
                  alt={trimmedLogoLabel || logoLabel}
                  className="mg-v2-mobile-gnb__logo-img"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    setLogoLoadFailed(true);
                  }}
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
        )}
      </div>
      <div className="mg-v2-mobile-gnb__center">
        <CurrentTimeChip />
      </div>
      <div className="mg-v2-mobile-gnb__actions">
        {isAdminShell && !hideSearch ? (
          <div className="mg-v2-mobile-gnb__search">
            <SearchInput value={searchValue} onChange={onSearchChange} />
          </div>
        ) : null}
        {isAdminShell ? (
          <GnbRight
            onLogout={onLogout}
            navigateQuickActionsFromLnb={navigateQuickActionsFromLnb}
          />
        ) : (
          <>
            <NotificationDropdown />
            <ProfileDropdown onLogout={onLogout} />
          </>
        )}
      </div>
    </header>
  );
};

MobileGnb.propTypes = {
  logoLabel: PropTypes.string,
  logoUrl: PropTypes.string,
  logoHomePath: PropTypes.string,
  logoBrandingLoading: PropTypes.bool,
  headerTitle: PropTypes.string,
  onMenuClick: PropTypes.func,
  onLogout: PropTypes.func,
  shellTone: PropTypes.oneOf(['admin', 'counselor']),
  searchValue: PropTypes.string,
  onSearchChange: PropTypes.func,
  hideSearch: PropTypes.bool,
  navigateQuickActionsFromLnb: PropTypes.array,
  menuExpanded: PropTypes.bool
};

export default MobileGnb;
