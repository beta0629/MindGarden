/**
 * 커버 햄버거 메뉴 — 스케줄/회기/결제/회기 고르기/로그아웃
 *
 * @author CoreSolution
 * @since 2026-10-29
 */

import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { CLIENT_DASHBOARD_ROUTES } from '../../../../constants/clientDashboardRoutes';
import { CLIENT_SHOP_ROUTES } from '../../../../constants/clientShopConstants';
import {
  CLIENT_COVER_MENU_ARIA,
  CLIENT_COVER_MENU_CLOSE_ARIA,
  CLIENT_COVER_MENU_LOGOUT,
  CLIENT_COVER_MENU_PAYMENT,
  CLIENT_COVER_MENU_SCHEDULE,
  CLIENT_COVER_MENU_SESSIONS,
  CLIENT_COVER_MENU_SHOP,
  CLIENT_COVER_MENU_TEST_ID
} from '../constants';

const MENU_LINKS = Object.freeze([
  { id: 'schedule', label: CLIENT_COVER_MENU_SCHEDULE, to: CLIENT_DASHBOARD_ROUTES.SCHEDULE },
  { id: 'sessions', label: CLIENT_COVER_MENU_SESSIONS, to: CLIENT_DASHBOARD_ROUTES.SESSION_MANAGEMENT },
  { id: 'payment', label: CLIENT_COVER_MENU_PAYMENT, to: CLIENT_DASHBOARD_ROUTES.PAYMENT_HISTORY },
  { id: 'shop', label: CLIENT_COVER_MENU_SHOP, to: CLIENT_SHOP_ROUTES.CATALOG }
]);

/**
 * @param {object} props
 * @param {boolean} props.isOpen
 * @param {() => void} props.onClose
 * @param {() => void} [props.onLogout]
 * @param {string} [props.logoutLabel]
 */
const CoverMenuDrawer = ({
  isOpen,
  onClose,
  onLogout,
  logoutLabel = CLIENT_COVER_MENU_LOGOUT
}) => {
  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }
    const onKey = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="client-cover__menu" data-testid={CLIENT_COVER_MENU_TEST_ID}>
      <button
        type="button"
        className="client-cover__menu-backdrop"
        aria-label={CLIENT_COVER_MENU_CLOSE_ARIA}
        onClick={onClose}
      />
      <aside className="client-cover__menu-panel" role="dialog" aria-label={CLIENT_COVER_MENU_ARIA}>
        <ul className="client-cover__menu-list">
          {MENU_LINKS.map((item) => (
            <li key={item.id}>
              <Link
                className="client-cover__menu-link"
                to={item.to}
                onClick={onClose}
              >
                {item.label}
              </Link>
            </li>
          ))}
          {onLogout ? (
            <li>
              <button
                type="button"
                className="client-cover__menu-link client-cover__menu-link--btn"
                onClick={() => {
                  onClose();
                  onLogout();
                }}
              >
                {logoutLabel}
              </button>
            </li>
          ) : null}
        </ul>
      </aside>
    </div>
  );
};

CoverMenuDrawer.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onLogout: PropTypes.func,
  logoutLabel: PropTypes.string
};

export default CoverMenuDrawer;
