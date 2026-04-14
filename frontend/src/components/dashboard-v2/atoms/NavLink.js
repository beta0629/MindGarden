/**
 * NavLink - icon + text menu link (Active/Hover/Default)
 * LNB menu rows
 *
 * @author CoreSolution
 * @since 2025-02-22
 */

import React from 'react';
import { Link, NavLink as RouterNavLink } from 'react-router-dom';
import MGButton from '../../common/MGButton';
import Icon from '../../ui/Icon/Icon';
import './NavLink.css';

/**
 * @param {Object} props
 * @param {string} [props.icon] - ICONS registry key
 */
const NavLink = ({ to, icon, children, active, className = '', asButton = false, onClick }) => {
  const baseClass = 'mg-v2-nav-link';
  const stateClass = active ? `${baseClass}--active` : '';

  const content = (
    <>
      {icon ? (
        <span className="mg-v2-nav-link__icon" aria-hidden="true">
          <Icon name={icon} size="MD" userRole="ADMIN" color="SECONDARY" />
        </span>
      ) : null}
      <span className="mg-v2-nav-link__text">{children}</span>
    </>
  );

  if (asButton) {
    return (
      <MGButton
        type="button"
        variant="outline"
        preventDoubleClick={false}
        className={`${baseClass} ${stateClass} ${className}`}
        onClick={onClick}
      >
        {content}
      </MGButton>
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
 * RouterNavLink with isActive
 * @param {Object} props
 * @param {string} [props.icon] - ICONS registry key
 */
export const NavLinkWithRouter = ({ to, icon, children, end = false, onClick }) => {
  return (
    <RouterNavLink
      to={to}
      end={end}
      onClick={onClick}
      className={({ isActive }) =>
        `mg-v2-nav-link ${isActive ? 'mg-v2-nav-link--active' : ''}`
      }
    >
      {icon ? (
        <span className="mg-v2-nav-link__icon" aria-hidden="true">
          <Icon name={icon} size="MD" userRole="ADMIN" color="SECONDARY" />
        </span>
      ) : null}
      <span className="mg-v2-nav-link__text">{children}</span>
    </RouterNavLink>
  );
};

export default NavLink;
