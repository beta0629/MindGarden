/**
 * ProfileDropdown - 프로필 메뉴 드롭다운 (Molecule)
 * 테넌트 헤더 클러스터: TenantHeaderCluster (identity + chevron 트리거)
 * 테마 전환 행(useDarkMode) + HeaderMenuRow flush menu
 *
 * @author CoreSolution
 * @since 2026-03-09
 */

import { useState, useEffect, useRef, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { ProfileAvatar, HeaderMenuRow } from '../atoms';
import TenantHeaderCluster from './TenantHeaderCluster';
import { useSession } from '../../../contexts/SessionContext';
import { useDarkMode, DARK_MODE_VALUES } from '../../../contexts/DarkModeContext';
import { useBranding } from '../../../hooks/useBranding';
import { getCustomLogoSrc } from '../../../utils/brandingUtils';
import { getTenantGnbLabel, DEFAULT_GNB_LOGO_LABEL } from '../../../utils/tenantDisplayName';
import { useDropdownPosition } from '../hooks/useDropdownPosition';
import {
  getMypagePathForRole,
  getSettingsPathForRole,
  shouldShowProfileDropdownSettings
} from '../../../utils/roleMypageSettingsPaths';
import SafeText from '../../common/SafeText';
import SessionRemainingLabel from '../../common/SessionRemainingLabel';
import { SESSION_REMAINING_DISPLAY } from '../../../constants/session';
import { ICONS, ICON_SIZES } from '../../../constants/icons';
import GnbDropdownPortal from './GnbDropdownPortal';
import './ProfileDropdown.css';

const PROFILE_DROPDOWN_PANEL_ID = 'mg-v2-profile-dropdown-panel';
const THEME_LABEL = '화면 테마';
const THEME_LIGHT_LABEL = '라이트';
const THEME_DARK_LABEL = '다크';

const ROLE_LABELS = {
  ADMIN: '관리자',
  CONSULTANT: '상담사',
  CLIENT: '내담자',
  STAFF: '사무원'
};

const ProfileDropdown = ({ onLogout }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const triggerRef = useRef(null);
  const panelRef = useRef(null);
  const navigate = useNavigate();
  const panelStyle = useDropdownPosition(triggerRef, panelRef, isOpen);
  const { user } = useSession();
  const { brandingInfo } = useBranding({ autoLoad: Boolean(user) });
  const { resolved, setMode } = useDarkMode();

  const userName = useMemo(() => {
    if (!user) {
      return '사용자';
    }
    const label = getTenantGnbLabel(user, brandingInfo);
    if (label === DEFAULT_GNB_LOGO_LABEL) {
      return user.name || user.username || '사용자';
    }
    return label;
  }, [user, brandingInfo]);

  const avatarImageUrl = useMemo(() => {
    if (!user) {
      return undefined;
    }
    const raw = user.profileImageUrl;
    if (typeof raw === 'string' && raw.trim() !== '') {
      return raw.trim();
    }
    return getCustomLogoSrc(brandingInfo?.logo);
  }, [user, brandingInfo]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      const { target } = event;
      if (
        dropdownRef.current && !dropdownRef.current.contains(target) &&
        panelRef.current && !panelRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  const handleMenuClick = (action) => {
    setIsOpen(false);

    if (action === 'mypage') {
      const to = getMypagePathForRole(user?.role);
      navigate(to || '/mypage');
    } else if (action === 'settings') {
      const to = getSettingsPathForRole(user?.role);
      navigate(to || '/settings');
    } else if (action === 'logout' && onLogout) {
      onLogout();
    }
  };

  if (!user) {
    return null;
  }

  const userEmail = user.email || '';
  const userRole = user.role || '';
  const roleLabel = ROLE_LABELS[userRole] || userRole;
  const showSettingsItem = shouldShowProfileDropdownSettings(userRole);
  const isDark = resolved === DARK_MODE_VALUES.DARK;
  const ThemeIcon = isDark ? ICONS.MOON : ICONS.SUN;

  return (
    <div className="mg-v2-profile-dropdown" ref={dropdownRef}>
      <TenantHeaderCluster
        userName={userName}
        avatarImageUrl={avatarImageUrl}
        isOpen={isOpen}
        onToggle={() => setIsOpen(!isOpen)}
        triggerRef={triggerRef}
        panelId={PROFILE_DROPDOWN_PANEL_ID}
      />

      <GnbDropdownPortal
        isOpen={isOpen}
        onRequestClose={() => setIsOpen(false)}
        panelRef={panelRef}
        panelStyle={panelStyle}
        panelClassName="mg-v2-dropdown-panel mg-v2-profile-dropdown__panel"
        panelRole="menu"
        panelId={PROFILE_DROPDOWN_PANEL_ID}
      >
        <div className="mg-v2-profile-dropdown__header">
          <ProfileAvatar name={userName} imageUrl={avatarImageUrl} size="medium" />
          <div className="mg-v2-profile-dropdown__info">
            <div className="mg-v2-profile-dropdown__name">
              <SafeText fallback="사용자">{userName}</SafeText>
            </div>
            <SessionRemainingLabel
              className={`${SESSION_REMAINING_DISPLAY.CLASS_NAME}--gnb-dropdown`}
            />
            {userEmail && (
              <div className="mg-v2-profile-dropdown__email">
                <SafeText fallback="">{userEmail}</SafeText>
              </div>
            )}
            {roleLabel && (
              <span className={`mg-v2-badge mg-v2-badge-role mg-v2-badge-role--${userRole.toLowerCase()}`}>
                <SafeText fallback="">{roleLabel}</SafeText>
              </span>
            )}
          </div>
        </div>

        <div className="mg-v2-profile-dropdown__menu">
          <HeaderMenuRow
            className="mg-v2-profile-menu-item"
            onClick={() => handleMenuClick('mypage')}
          >
            <span>내 정보</span>
          </HeaderMenuRow>

          <div className="mg-v2-profile-theme-row" role="none">
            <div className="mg-v2-profile-theme-row__label">
              {ThemeIcon ? (
                <span className="mg-v2-profile-theme-row__icon" aria-hidden="true">
                  <ThemeIcon size={ICON_SIZES.MD} strokeWidth={2} />
                </span>
              ) : null}
              <span>{THEME_LABEL}</span>
            </div>
            <div
              className="mg-v2-theme-switch"
              role="group"
              aria-label={THEME_LABEL}
            >
              <button
                type="button"
                className={`mg-v2-theme-switch__btn${!isDark ? ' mg-v2-theme-switch__btn--active' : ''}`}
                aria-pressed={!isDark}
                onClick={() => setMode(DARK_MODE_VALUES.LIGHT)}
              >
                {THEME_LIGHT_LABEL}
              </button>
              <button
                type="button"
                className={`mg-v2-theme-switch__btn${isDark ? ' mg-v2-theme-switch__btn--active' : ''}`}
                aria-pressed={isDark}
                onClick={() => setMode(DARK_MODE_VALUES.DARK)}
              >
                {THEME_DARK_LABEL}
              </button>
            </div>
          </div>

          {showSettingsItem && (
            <HeaderMenuRow
              className="mg-v2-profile-menu-item"
              onClick={() => handleMenuClick('settings')}
            >
              <span>설정</span>
            </HeaderMenuRow>
          )}
          <HeaderMenuRow
            className="mg-v2-profile-menu-item"
            danger
            onClick={() => handleMenuClick('logout')}
          >
            <span>로그아웃</span>
          </HeaderMenuRow>
        </div>
      </GnbDropdownPortal>
    </div>
  );
};

ProfileDropdown.propTypes = {
  onLogout: PropTypes.func
};

export default ProfileDropdown;
