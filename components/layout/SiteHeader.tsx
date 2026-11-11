'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
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

type NoticeBarProps = {
  text: string | null;
};

function NoticeBar({ text }: NoticeBarProps) {
  const [open, setOpen] = useState(Boolean(text));
  if (!text || !open) return null;
  return (
    <div className="notice-bar">
      <div className="container notice-bar__inner">
        <p style={{ margin: 0 }}>{text}</p>
        <button
          type="button"
          className="notice-bar__close"
          aria-label="공지 닫기"
          onClick={() => setOpen(false)}
        >
          ×
        </button>
      </div>
    </div>
  );
}

type SiteHeaderProps = {
  noticeText?: string | null;
};

export function SiteHeader({ noticeText = null }: SiteHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="site-header">
      <NoticeBar text={noticeText} />
      <div className="container header__inner">
        <Link className="brand" href="/" onClick={() => setMenuOpen(false)}>
          <Image
            src="/brand/logo-mark.svg"
            alt=""
            width={32}
            height={32}
            priority
          />
          <span>마인드가든</span>
        </Link>

        <nav className="nav-desktop" aria-label="본메뉴">
          {MAIN_NAV.map((item) => (
            <Link key={item.href} className="nav-link" href={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="header__utils">
          <a
            className="nav-link"
            href={SITE.bookingUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            예약
          </a>
          <a
            className="nav-link"
            href={SITE.youtubeUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            유튜브
          </a>
        </div>

        <button
          type="button"
          className="menu-toggle"
          aria-expanded={menuOpen}
          aria-controls="mobile-nav"
          onClick={() => setMenuOpen((v) => !v)}
        >
          <span className="sr-only">메뉴</span>
          {menuOpen ? (
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
          ) : (
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
          )}
        </button>
      </div>

      <div
        id="mobile-nav"
        className={`mobile-nav ${menuOpen ? 'is-open' : ''}`}
      >
        <nav aria-label="모바일 본메뉴">
          {MAIN_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMenuOpen(false)}
            >
              {item.label}
            </Link>
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
                onClick={() => setMenuOpen(false)}
              >
                {item.label}
              </a>
            ) : (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
              >
                {item.label}
              </Link>
            ),
          )}
        </div>
      </div>
    </header>
  );
}
