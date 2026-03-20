/**
 * ProfileDropdown - 프로필 메뉴 드롭다운 (Molecule)
 * Portal + position:fixed 로 전역 overflow/transform 영향 없음
 *
 * @author CoreSolution
 * @since 2026-03-09
 */

import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import { ChevronDown, User, Settings, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ProfileAvatar } from '../atoms';
import { useSession } from '../../../contexts/SessionContext';
import { ADMIN_ROUTES } from '../../../constants/adminRoutes';
import { normalizeRoleForQuickActions } from '../../../constants/gnbQuickActions';
import { useDropdownPosition } from '../hooks/useDropdownPosition';
import '../styles/dropdown-common.css';
import './ProfileDropdown.css';

const ROLE_LABELS = {
  ADMIN: '관리자',
  CONSULTANT: '상담사',
  CLIENT: '내담자',
  STAFF: '사무원'
};

const ProfileDropdown = ({ onLogout }) => {
  const { user } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const triggerRef = useRef(null);
  const panelRef = useRef(null);
  const navigate = useNavigate();
  const panelStyle = useDropdownPosition(triggerRef, panelRef, isOpen);

  useEffect(() => {
    const handleClickOutside = (event) => {
      const target = event.target;
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

  const resolveMypagePath = (role) => {
    const r = normalizeRoleForQuickActions(role);
    if (r === 'CLIENT') return '/client/mypage';
    if (r === 'CONSULTANT') return '/consultant/mypage';
    if (r === 'STAFF' || r === 'ADMIN') return '/admin/mypage';
    return '/client/mypage';
  };

  /** LNB·App.js와 맞춤: 관리자/스태프는 시스템 설정, 내담자는 클라이언트 설정, 상담사 전용 설정 라우트 없음 → 마이페이지 */
  const resolveSettingsPath = (role) => {
    const r = normalizeRoleForQuickActions(role);
    if (r === 'CLIENT') return '/client/settings';
    if (r === 'CONSULTANT') return '/consultant/mypage';
    if (r === 'STAFF' || r === 'ADMIN') return ADMIN_ROUTES.SYSTEM_CONFIG;
    return '/client/settings';
  };

  const handleMenuClick = (action) => {
    setIsOpen(false);
    const role = user?.role;

    if (action === 'mypage') {
      navigate(resolveMypagePath(role));
    } else if (action === 'settings') {
      navigate(resolveSettingsPath(role));
    } else if (action === 'logout' && onLogout) {
      onLogout();
    }
  };

  if (!user) {
    return null;
  }

  const userName = user.name || user.username || '사용자';
  const userEmail = user.email || '';
  const userRole = user.role || '';
  const roleKey = normalizeRoleForQuickActions(userRole);
  const roleLabel = ROLE_LABELS[roleKey] || userRole;

  return (
    <div className="mg-v2-profile-dropdown" ref={dropdownRef}>
      <button
        ref={triggerRef}
        className="mg-v2-profile-trigger"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        type="button"
      >
        <ProfileAvatar name={userName} imageUrl={user.profileImageUrl} size="small" />
        <span className="mg-v2-profile-trigger__name">{userName}</span>
        <ChevronDown size={16} className="mg-v2-profile-trigger__icon" />
      </button>

      {isOpen && ReactDOM.createPortal(
        <>
          <button
            className="mg-v2-dropdown-overlay"
            onClick={() => setIsOpen(false)}
            type="button"
            aria-label="드롭다운 닫기"
          />
          <div
            ref={panelRef}
            className="mg-v2-dropdown-panel mg-v2-profile-dropdown__panel"
            role="menu"
            style={panelStyle}
          >
            <div className="mg-v2-profile-dropdown__header">
              <ProfileAvatar name={userName} imageUrl={user.profileImageUrl} size="medium" />
              <div className="mg-v2-profile-dropdown__info">
                <div className="mg-v2-profile-dropdown__name">{userName}</div>
                {userEmail && (
                  <div className="mg-v2-profile-dropdown__email">{userEmail}</div>
                )}
                {roleLabel && (
                  <span className={`mg-v2-badge mg-v2-badge-role mg-v2-badge-role--${(roleKey || userRole).toLowerCase()}`}>
                    {roleLabel}
                  </span>
                )}
              </div>
            </div>

            <div className="mg-v2-profile-dropdown__menu">
              <button
                className="mg-v2-profile-menu-item"
                onClick={() => handleMenuClick('mypage')}
                type="button"
              >
                <User size={18} />
                <span>내 정보</span>
              </button>
              <button
                className="mg-v2-profile-menu-item"
                onClick={() => handleMenuClick('settings')}
                type="button"
              >
                <Settings size={18} />
                <span>설정</span>
              </button>
              <button
                className="mg-v2-profile-menu-item mg-v2-profile-menu-item--danger"
                onClick={() => handleMenuClick('logout')}
                type="button"
              >
                <LogOut size={18} />
                <span>로그아웃</span>
              </button>
            </div>
          </div>
        </>,
        document.body
      )}
    </div>
  );
};

ProfileDropdown.propTypes = {
  onLogout: PropTypes.func
};

export default ProfileDropdown;
