'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { SITE } from '@/lib/site';

const MAIN_NAV = [
  { href: '/about', label: '센터소개' },
  { href: '/counseling', label: '상담 프로그램' },
  { href: '/counselors', label: '전문가' },
  { href: '/blog', label: '칼럼/영상' },
  { href: '/contact', label: '문의' },
] as const;

const UTIL_NAV = [
  { href: '/location', label: '오시는 길' },
  { href: '/guide', label: '운영 안내' },
  { href: SITE.bookingUrl, label: '네이버 플레이스', external: true },
  { href: SITE.youtubeUrl, label: '유튜브', external: true },
] as const;

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Mobile menu toggle + sheet. Plain &lt;a&gt; links — deferred from first paint
 * via MobileNavLazy so App Router / menu JS never contends with LCP.
 */
export function MobileNav() {
  const [menuOpen, setMenuOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const restoreFocusRef = useRef(false);

  const closeMenu = useCallback((restoreFocus = false) => {
    restoreFocusRef.current = restoreFocus;
    setMenuOpen(false);
  }, []);

  useEffect(() => {
    if (!menuOpen) {
      if (restoreFocusRef.current) {
        toggleRef.current?.focus();
      } else {
        toggleRef.current?.blur();
      }
      restoreFocusRef.current = false;
      return;
    }

    const { body } = document;
    const prevOverflow = body.style.overflow;
    body.style.overflow = 'hidden';
    closeRef.current?.focus({ preventScroll: true });

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeMenu(true);
        return;
      }
      if (event.key !== 'Tab') return;
      const nodes = sheetRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
      if (!nodes || nodes.length === 0) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      const active = document.activeElement;
      if (event.shiftKey && (active === first || !sheetRef.current?.contains(active))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (active === last || !sheetRef.current?.contains(active))) {
        event.preventDefault();
        first.focus();
      }
    };

    const desktop = window.matchMedia('(min-width: 1024px)');
    const onViewport = () => {
      if (desktop.matches) closeMenu();
    };

    document.addEventListener('keydown', onKeyDown);
    desktop.addEventListener('change', onViewport);
    return () => {
      body.style.overflow = prevOverflow;
      document.removeEventListener('keydown', onKeyDown);
      desktop.removeEventListener('change', onViewport);
    };
  }, [menuOpen, closeMenu]);

  return (
    <>
      <button
        ref={toggleRef}
        type="button"
        className="menu-toggle"
        aria-expanded={menuOpen}
        aria-controls="mobile-nav"
        aria-haspopup="dialog"
        onClick={() => setMenuOpen(true)}
      >
        <span className="sr-only">메뉴 열기</span>
        <svg
          aria-hidden="true"
          className="menu-toggle__icon"
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
        >
          <path
            d="M4 6h12M4 10h12M4 14h12"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
          />
        </svg>
      </button>

      <div
        id="mobile-nav"
        className={`mobile-nav ${menuOpen ? 'is-open' : ''}`}
        hidden={!menuOpen}
      >
        <button
          type="button"
          className="mobile-nav__scrim"
          tabIndex={-1}
          aria-label="메뉴 닫기"
          onClick={() => closeMenu()}
        />
        <div
          ref={sheetRef}
          className="mobile-nav__sheet"
          role="dialog"
          aria-modal="true"
          aria-label="메뉴"
        >
          <div className="mobile-nav__bar">
            <span className="mobile-nav__title">메뉴</span>
            <button
              ref={closeRef}
              type="button"
              className="menu-toggle mobile-nav__close"
              onClick={(event) => closeMenu(event.detail === 0)}
            >
              <span className="sr-only">메뉴 닫기</span>
              <svg
                aria-hidden="true"
                className="menu-toggle__icon"
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
              >
                <path
                  d="M5 5l10 10M15 5L5 15"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
          <nav aria-label="모바일 본메뉴">
            {MAIN_NAV.map((item) => (
              <a key={item.href} href={item.href} onClick={() => closeMenu()}>
                {item.label}
              </a>
            ))}
          </nav>
          <div className="mobile-nav__group">
            <div className="mobile-nav__label">바로가기</div>
            {UTIL_NAV.map((item) =>
              'external' in item && item.external ? (
                <a
                  key={item.href}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => closeMenu()}
                >
                  {item.label}
                </a>
              ) : (
                <a key={item.href} href={item.href} onClick={() => closeMenu()}>
                  {item.label}
                </a>
              ),
            )}
          </div>
        </div>
      </div>
    </>
  );
}
