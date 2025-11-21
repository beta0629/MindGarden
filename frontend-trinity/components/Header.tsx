"use client";

import { useState } from "react";
import Link from "next/link";
import { COMPONENT_CSS } from "../constants/css-variables";
import { TRINITY_CONSTANTS } from "../constants/trinity";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <header className={COMPONENT_CSS.HEADER.CONTAINER}>
      <div className="trinity-header__container">
        <Link href="/" className={COMPONENT_CSS.HEADER.BRAND} onClick={closeMenu}>
          <div className="trinity-header__brand-logo">
            {TRINITY_CONSTANTS.COMPANY.NAME.charAt(0)}
          </div>
          <div className="trinity-header__brand-text">
            <div className="trinity-header__brand-name">{TRINITY_CONSTANTS.COMPANY.NAME}</div>
            <div className="trinity-header__brand-subtitle">CoreSolution</div>
          </div>
        </Link>
        <button
          className="trinity-header__menu-button"
          onClick={toggleMenu}
          aria-label="메뉴 열기/닫기"
        >
          {isMenuOpen ? "✕" : "☰"}
        </button>
        <nav className={`${COMPONENT_CSS.HEADER.NAV} ${isMenuOpen ? "trinity-header__nav--mobile" : ""}`}>
          <Link href="/about" className={COMPONENT_CSS.HEADER.LINK} onClick={closeMenu}>
            회사 소개
          </Link>
          <Link href="/services" className={COMPONENT_CSS.HEADER.LINK} onClick={closeMenu}>
            서비스 소개
          </Link>
          <Link href="/#pricing" className={COMPONENT_CSS.HEADER.LINK} onClick={closeMenu}>
            가격 정보
          </Link>
          <Link href="/onboarding" className={COMPONENT_CSS.HEADER.BUTTON} onClick={closeMenu}>
            시작하기
          </Link>
        </nav>
      </div>
    </header>
  );
}

