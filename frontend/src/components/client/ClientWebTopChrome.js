/**
 * ClientWebTopChrome — shared presentational header (tenant/brand + nav + logout)
 * Used by lobby · shop · cart · checkout · suite faces. No LNB/sidebar.
 *
 * Right meta order (header SSOT): {userName} · avatar · 로그아웃
 * Profile (userName/avatar) → /client/settings (not a nav tab)
 *
 * @author CoreSolution
 * @since 2026-09-17
 */

import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import SafeText from '../common/SafeText';
import { CLIENT_DASHBOARD_ROUTES } from '../../constants/clientDashboardRoutes';
import {
  CLIENT_WEB_LOGIN,
  CLIENT_WEB_LOGOUT,
  CLIENT_WEB_NAV,
  CLIENT_WEB_PROFILE_LINK_TEST_ID,
  CLIENT_WEB_SETTINGS_ARIA,
  CLIENT_WEB_TOP_CHROME_TEST_ID,
  CLIENT_WEB_TOP_NAV_TEST_ID
} from '../../constants/clientWebChromeConstants';
import butterflyLogo from '../../assets/images/auth/deprecated-mindgarden/core-logo-butterfly.png';
import { toDisplayString } from '../../utils/safeDisplay';
import './ClientWebTopChrome.css';

/**
 * @param {string|undefined} name
 * @returns {string}
 */
function resolveNameInitial(name) {
  const s = toDisplayString(name, '').trim();
  return s ? s.charAt(0) : '·';
}

/**
 * @param {object} props
 * @param {string} [props.activeNavId]
 * @returns {import('react').ReactNode}
 */
function renderDefaultNav(activeNavId) {
  return (
    <nav
      className="client-web-topchrome__nav"
      aria-label="주요"
      data-testid={CLIENT_WEB_TOP_NAV_TEST_ID}
    >
      {CLIENT_WEB_NAV.map((item) => {
        const isOn = item.id === activeNavId;
        return (
          <Link
            key={item.id}
            to={item.path}
            className={`client-web-topchrome__nav-link${isOn ? ' client-web-topchrome__nav-link--on' : ''}`}
            aria-current={isOn ? 'page' : undefined}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

/**
 * @param {object} props
 * @param {string} [props.brandWord]
 * @param {string} [props.brandCenter]
 * @param {() => void} [props.onLogout]
 * @param {string} [props.logoutLabel]
 * @param {string} [props.userName]
 * @param {string} [props.activeNavId] - CLIENT_WEB_NAV id (home|schedule|sessions|shop|payment)
 * @param {import('react').ReactNode} [props.nav] - optional override; omit for shared CLIENT_WEB_NAV
 * @param {import('react').ReactNode} [props.endMeta]
 * @param {number|null|undefined} [props.cartBadgeQty] - shop cart qty badge (omit/null → hide)
 * @param {string} [props.cartHref]
 * @param {string} [props.loginHref] - guest login CTA path
 * @param {string} [props.loginLabel]
 * @param {string} [props.settingsHref]
 * @param {string} [props.className]
 */
const ClientWebTopChrome = ({
  brandWord = '',
  brandCenter = '',
  onLogout,
  logoutLabel = CLIENT_WEB_LOGOUT,
  userName,
  activeNavId,
  nav,
  endMeta = null,
  cartBadgeQty = null,
  cartHref,
  loginHref = '/login',
  loginLabel = CLIENT_WEB_LOGIN,
  settingsHref = CLIENT_DASHBOARD_ROUTES.SETTINGS,
  className = ''
}) => {
  const word = typeof brandWord === 'string' ? brandWord.trim() : '';
  const center = typeof brandCenter === 'string' ? brandCenter.trim() : '';
  const showSep = Boolean(word && center);
  const label = typeof logoutLabel === 'string' && logoutLabel.trim()
    ? logoutLabel.trim()
    : CLIENT_WEB_LOGOUT;
  const showUserMeta = Boolean(userName);
  const initial = resolveNameInitial(userName);
  const rootClass = [
    'client-web-topchrome',
    className
  ].filter(Boolean).join(' ');
  const resolvedNav = nav !== undefined ? nav : renderDefaultNav(activeNavId);
  const showCartBadge = cartBadgeQty != null
    && Number.isFinite(Number(cartBadgeQty))
    && typeof cartHref === 'string'
    && cartHref.length > 0;
  const cartQtyDisplay = showCartBadge
    ? Math.max(0, Math.floor(Number(cartBadgeQty)))
    : 0;

  return (
    <header
      className={rootClass}
      data-testid={CLIENT_WEB_TOP_CHROME_TEST_ID}
    >
      <Link
        className="client-web-topchrome__brand"
        to={CLIENT_DASHBOARD_ROUTES.DASHBOARD}
      >
        <img
          className="client-web-topchrome__brand-mark"
          src={butterflyLogo}
          alt=""
          width={28}
          height={21}
        />
        {word ? (
          <span className="client-web-topchrome__brand-word">
            <SafeText fallback="">{word}</SafeText>
          </span>
        ) : null}
        {showSep ? (
          <span className="client-web-topchrome__brand-sep" aria-hidden="true">·</span>
        ) : null}
        {center ? (
          <span className="client-web-topchrome__brand-center">
            <SafeText fallback="">{center}</SafeText>
          </span>
        ) : null}
      </Link>

      {resolvedNav}

      <div className="client-web-topchrome__end">
        {showCartBadge ? (
          <Link
            className="client-web-topchrome__cart"
            to={cartHref}
            data-testid="client-shop-cart-badge"
            aria-label={`장바구니 ${cartQtyDisplay}개`}
          >
            <span className="client-web-topchrome__cart-label">장바구니</span>
            <span className="client-web-topchrome__cart-qty">{cartQtyDisplay}</span>
          </Link>
        ) : null}
        {endMeta}
        {showUserMeta ? (
          <Link
            className="client-web-topchrome__profile"
            to={settingsHref}
            data-testid={CLIENT_WEB_PROFILE_LINK_TEST_ID}
            aria-label={CLIENT_WEB_SETTINGS_ARIA}
          >
            <span className="client-web-topchrome__user-name">
              <SafeText>{userName}</SafeText>
            </span>
            <div className="client-web-topchrome__avatar" aria-hidden="true">
              <SafeText fallback="·">{initial}</SafeText>
            </div>
          </Link>
        ) : null}
        {!showUserMeta && loginHref ? (
          <Link
            className="client-web-topchrome__login"
            to={loginHref}
          >
            {loginLabel}
          </Link>
        ) : null}
        {showUserMeta && typeof onLogout === 'function' ? (
          <button
            type="button"
            className="client-web-topchrome__logout"
            onClick={onLogout}
            aria-label={label}
          >
            {label}
          </button>
        ) : null}
      </div>
    </header>
  );
};

ClientWebTopChrome.propTypes = {
  brandWord: PropTypes.string,
  brandCenter: PropTypes.string,
  onLogout: PropTypes.func,
  logoutLabel: PropTypes.string,
  userName: PropTypes.string,
  activeNavId: PropTypes.string,
  nav: PropTypes.node,
  endMeta: PropTypes.node,
  cartBadgeQty: PropTypes.number,
  cartHref: PropTypes.string,
  loginHref: PropTypes.string,
  loginLabel: PropTypes.string,
  settingsHref: PropTypes.string,
  className: PropTypes.string
};

export default ClientWebTopChrome;
