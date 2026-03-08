/**
 * ProfileDropdown - 프로필 메뉴 드롭다운 (Molecule)
 * 
 * @author CoreSolution
 * @since 2026-03-09
 */

import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { ChevronDown, User, Settings, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ProfileAvatar } from '../atoms';
import { sessionManager } from '../../../utils/sessionManager';
import './ProfileDropdown.css';

const ROLE_LABELS = {
  ADMIN: '관리자',
  CONSULTANT: '상담사',
  CLIENT: '내담자',
  STAFF: '사무원'
};

const ProfileDropdown = ({ onLogout }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState(null);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const currentUser = sessionManager.getUser();
    setUser(currentUser);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
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

  const handleMenuClick = (action) => {
    setIsOpen(false);
    
    if (action === 'mypage') {
      navigate('/mypage');
    } else if (action === 'settings') {
      navigate('/settings');
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
  const roleLabel = ROLE_LABELS[userRole] || userRole;

  return (
    <div className="mg-v2-profile-dropdown" ref={dropdownRef}>
      <button
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

      {isOpen && (
        <>
          <button 
            className="mg-v2-dropdown-overlay" 
            onClick={() => setIsOpen(false)}
            type="button"
            aria-label="드롭다운 닫기"
          />
          <div className="mg-v2-dropdown-panel mg-v2-profile-dropdown__panel" role="menu">
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
        </>
      )}
    </div>
  );
};

ProfileDropdown.propTypes = {
  onLogout: PropTypes.func
};

export default ProfileDropdown;
