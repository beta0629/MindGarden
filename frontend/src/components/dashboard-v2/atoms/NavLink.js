/**
 * NavLink - 아이콘+텍스트 메뉴 링크 (Active/Hover/Default)
 * LNB 메뉴 항목용
 *
 * @author CoreSolution
 * @since 2025-02-22
 */

import React from 'react';
import { Link, NavLink as RouterNavLink } from 'react-router-dom';
import './NavLink.css';

const NavLink = ({ to, icon: Icon, children, active, className = '', asButton = false, onClick }) => {
  const baseClass = 'mg-v2-nav-link';
  const stateClass = active ? `${baseClass}--active` : '';

  const content = (
    <>
      {Icon && (
        <span className="mg-v2-nav-link__icon" aria-hidden="true">
          <Icon size={20} strokeWidth={1.8} />
        </span>
      )}
      <span className="mg-v2-nav-link__text">{children}</span>
    </>
  );

  if (asButton) {
    return (
      <button
        type="button"
        className={`${baseClass} ${stateClass} ${className}`}
        onClick={onClick}
      >
        {content}
      </button>
    );
  }

  return (
    <Link
      to={to}
      className={`${baseClass} ${stateClass} ${className}`}
      onClick={onClick}
    >
      {content}
    </Link>
  );
};

/**
 * RouterNavLink와 연동하여 isActive 사용 시
 */
export const NavLinkWithRouter = ({ to, icon: Icon, children, end = false, onClick }) => {
  return (
    <RouterNavLink
      to={to}
      end={end}
      onClick={onClick}
      className={({ isActive }) =>
        `mg-v2-nav-link ${isActive ? 'mg-v2-nav-link--active' : ''}`
      }
    >
      {Icon && (
        <span className="mg-v2-nav-link__icon" aria-hidden="true">
          <Icon size={20} strokeWidth={1.8} />
        </span>
      )}
      <span className="mg-v2-nav-link__text">{children}</span>
    </RouterNavLink>
  );
};

export default NavLink;
