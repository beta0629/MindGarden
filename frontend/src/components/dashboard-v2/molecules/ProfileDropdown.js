/**
 * ProfileDropdown - 프로필 메뉴 드롭다운 (Molecule)
 * Portal + position:fixed 로 전역 overflow/transform 영향 없음
 *
 * @author CoreSolution
 * @since 2026-03-09
 */

import { useState, useEffect, useRef, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { ProfileAvatar } from '../atoms';
import { useSession } from '../../../contexts/SessionContext';
import { useBranding } from '../../../hooks/useBranding';
import { getTenantGnbLabel, DEFAULT_GNB_LOGO_LABEL } from '../../../utils/tenantDisplayName';
import { useDropdownPosition } from '../hooks/useDropdownPosition';
import { getMypagePathForRole, getSettingsPathForRole } from '../../../utils/roleMypageSettingsPaths';
import MGButton from '../../common/MGButton';
import GnbDropdownPortal from './GnbDropdownPortal';
import './ProfileDropdown.css';

const PROFILE_DROPDOWN_PANEL_ID = 'mg-v2-profile-dropdown-panel';

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

  return (
    <div className="mg-v2-profile-dropdown" ref={dropdownRef}>
      <div ref={triggerRef} className="mg-v2-profile-trigger-outer">
        <MGButton
          type="button"
          variant="outline"
          preventDoubleClick={false}
          className="mg-v2-profile-trigger"
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          aria-haspopup="menu"
          aria-controls={PROFILE_DROPDOWN_PANEL_ID}
        >
          <ProfileAvatar name={userName} imageUrl={user.profileImageUrl} size="small" />
          <span className="mg-v2-profile-trigger__name">{userName}</span>
          <span className="mg-v2-profile-trigger__caret" aria-hidden="true">▼</span>
        </MGButton>
      </div>

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
          <ProfileAvatar name={userName} imageUrl={user.profileImageUrl} size="medium" />
          <div className="mg-v2-profile-dropdown__info">
            <div className="mg-v2-profile-dropdown__name">{userName}</div>
            {userEmail && (
              <div className="mg-v2-profile-dropdown__email">{userEmail}</div>
            )}
            {roleLabel && (
              <span className={`mg-v2-badge mg-v2-badge-role mg-v2-badge-role--${userRole.toLowerCase()}`}>
                {roleLabel}
              </span>
            )}
          </div>
        </div>

        <div className="mg-v2-profile-dropdown__menu">
          <MGButton
            type="button"
            variant="outline"
            preventDoubleClick={false}
            className="mg-v2-profile-menu-item"
            onClick={() => handleMenuClick('mypage')}
          >
            <span>내 정보</span>
          </MGButton>
          <MGButton
            type="button"
            variant="outline"
            preventDoubleClick={false}
            className="mg-v2-profile-menu-item"
            onClick={() => handleMenuClick('settings')}
          >
            <span>설정</span>
          </MGButton>
          <MGButton
            type="button"
            variant="outline"
            preventDoubleClick={false}
            className="mg-v2-profile-menu-item mg-v2-profile-menu-item--danger"
            onClick={() => handleMenuClick('logout')}
          >
            <span>로그아웃</span>
          </MGButton>
        </div>
      </GnbDropdownPortal>
    </div>
  );
};

ProfileDropdown.propTypes = {
  onLogout: PropTypes.func
};

export default ProfileDropdown;
