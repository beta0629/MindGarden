/**
 * 커버 햄버거 메뉴 — 스케줄/회기/결제/회기 고르기/로그아웃
 *
 * @author CoreSolution
 * @since 2026-10-29
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { Link, useLocation } from 'react-router-dom';
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
import '../../../common/coverChapter/CoverChapterMotion.css';
import './CoverMenuDrawer.css';

const MENU_LINKS = Object.freeze([
  { id: 'schedule', label: CLIENT_COVER_MENU_SCHEDULE, to: CLIENT_DASHBOARD_ROUTES.SCHEDULE },
  { id: 'sessions', label: CLIENT_COVER_MENU_SESSIONS, to: CLIENT_DASHBOARD_ROUTES.SESSION_MANAGEMENT },
  { id: 'payment', label: CLIENT_COVER_MENU_PAYMENT, to: CLIENT_DASHBOARD_ROUTES.PAYMENT_HISTORY },
  { id: 'shop', label: CLIENT_COVER_MENU_SHOP, to: CLIENT_SHOP_ROUTES.CATALOG }
]);

const DRAWER_PHASE = Object.freeze({ OPEN: 'open', CLOSING: 'closing', CLOSED: 'closed' });
const FOCUSABLE_SELECTOR = 'a[href], button:not([disabled])';
const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

const prefersReducedMotion = () => (
  typeof window !== 'undefined'
  && typeof window.matchMedia === 'function'
  && window.matchMedia(REDUCED_MOTION_QUERY).matches
);

/** 닫힘 애니메이션 길이(토큰 --mg-v2-motion-dur-fast 계산값) — 리터럴 없이 computed style에서 읽음 */
const readAnimationMs = (el) => {
  if (!el || typeof window === 'undefined' || typeof window.getComputedStyle !== 'function') {
    return 0;
  }
  const raw = String(window.getComputedStyle(el).animationDuration || '').split(',')[0].trim();
  const n = parseFloat(raw);
  if (!Number.isFinite(n)) {
    return 0;
  }
  return raw.endsWith('ms') ? n : n * 1000;
};

/**
 * @param {object} props
 * @param {boolean} props.isOpen
 * @param {() => void} props.onClose
 * @param {() => void} [props.onLogout]
 * @param {string} [props.logoutLabel]
 * @param {Array<{id:string,label:string,to:string}>} [props.items] - 서브페이지: 역할별 메뉴 IA(CLIENT_WEB_NAV). 생략 시 커버 홈 기본(독 중복 제외)
 * @param {string} [props.activeId] - aria-current 대상 id
 */
const CoverMenuDrawer = ({
  isOpen,
  onClose,
  onLogout,
  logoutLabel = CLIENT_COVER_MENU_LOGOUT,
  items,
  activeId
}) => {
  const { pathname } = useLocation();
  const links = Array.isArray(items) && items.length > 0 ? items : MENU_LINKS;
  const isCurrent = (item) => (activeId ? item.id === activeId : pathname === item.to);
  const [phase, setPhase] = useState(isOpen ? DRAWER_PHASE.OPEN : DRAWER_PHASE.CLOSED);
  const panelRef = useRef(null);
  const returnFocusRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      if (typeof document !== 'undefined') {
        returnFocusRef.current = document.activeElement;
      }
      setPhase(DRAWER_PHASE.OPEN);
      return;
    }
    setPhase((prev) => {
      if (prev === DRAWER_PHASE.CLOSED) {
        return prev;
      }
      return prefersReducedMotion() ? DRAWER_PHASE.CLOSED : DRAWER_PHASE.CLOSING;
    });
  }, [isOpen]);

  useEffect(() => {
    if (phase === DRAWER_PHASE.OPEN) {
      const first = panelRef.current?.querySelector(FOCUSABLE_SELECTOR);
      if (first && typeof first.focus === 'function') {
        first.focus();
      }
      return undefined;
    }
    if (phase === DRAWER_PHASE.CLOSED) {
      const target = returnFocusRef.current;
      returnFocusRef.current = null;
      if (target && typeof target.focus === 'function' && target.isConnected) {
        target.focus();
      }
      return undefined;
    }
    /* CLOSING: animationend가 오지 않는 환경(jsdom 등) 대비 — 계산된 duration 후 언마운트 */
    const fallbackMs = readAnimationMs(panelRef.current);
    const timer = setTimeout(() => setPhase(DRAWER_PHASE.CLOSED), fallbackMs);
    return () => clearTimeout(timer);
  }, [phase]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') {
      onClose();
      return;
    }
    if (e.key !== 'Tab' || !panelRef.current) {
      return;
    }
    const nodes = Array.from(panelRef.current.querySelectorAll(FOCUSABLE_SELECTOR));
    if (nodes.length === 0) {
      return;
    }
    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }, [onClose]);

  useEffect(() => {
    if (phase !== DRAWER_PHASE.OPEN) {
      return undefined;
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [phase, handleKeyDown]);

  const handlePanelAnimationEnd = (e) => {
    if (e.target === e.currentTarget && phase === DRAWER_PHASE.CLOSING) {
      setPhase(DRAWER_PHASE.CLOSED);
    }
  };

  if (phase === DRAWER_PHASE.CLOSED && !isOpen) {
    return null;
  }

  return (
    <div
      className="client-cover__menu"
      data-testid={CLIENT_COVER_MENU_TEST_ID}
      data-state={phase === DRAWER_PHASE.CLOSING ? DRAWER_PHASE.CLOSING : DRAWER_PHASE.OPEN}
    >
      <button
        type="button"
        className="client-cover__menu-backdrop"
        aria-label={CLIENT_COVER_MENU_CLOSE_ARIA}
        onClick={onClose}
      />
      <aside
        ref={panelRef}
        className="client-cover__menu-panel"
        role="dialog"
        aria-modal="true"
        aria-label={CLIENT_COVER_MENU_ARIA}
        onAnimationEnd={handlePanelAnimationEnd}
      >
        <ul className="client-cover__menu-list">
          {links.map((item) => (
            <li key={item.id}>
              <Link
                className="client-cover__menu-link"
                to={item.to}
                aria-current={isCurrent(item) ? 'page' : undefined}
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
  logoutLabel: PropTypes.string,
  items: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    to: PropTypes.string.isRequired
  })),
  activeId: PropTypes.string
};

export default CoverMenuDrawer;
