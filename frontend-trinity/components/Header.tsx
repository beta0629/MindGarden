"use client";

import { useState } from "react";
import Link from "next/link";
import { COMPONENT_CSS } from "../constants/css-variables";
import TrinityLogo from "./TrinityLogo";

interface HeaderProps {
  theme?: "light" | "dark";
}

export default function Header({ theme = "light" }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  // theme에 따라 텍스트 색상 클래스 추가
  const textClass = theme === "dark" ? "text-white" : "text-slate-900";
  const hoverClass = theme === "dark" ? "hover:text-slate-300" : "hover:text-blue-600";
  
  return (
    <header className={`${COMPONENT_CSS.HEADER.CONTAINER} ${theme === "dark" ? "bg-transparent" : "bg-white"} w-full z-50`}>
      <div className="trinity-header__container max-w-[1200px] mx-auto px-4 md:px-6 py-4 flex items-center justify-between relative">
        <Link href="/" className={COMPONENT_CSS.HEADER.BRAND} onClick={closeMenu}>
          <TrinityLogo variant={theme === "dark" ? "inverse" : "primary"} className="trinity-header__brand-logo h-8 md:h-10 w-auto" />
        </Link>
        <button
          className={`md:hidden flex items-center justify-center w-10 h-10 ${textClass}`}
          onClick={toggleMenu}
          aria-label="메뉴 열기/닫기"
        >
          {isMenuOpen ? "✕" : "☰"}
        </button>
        <nav className={`${COMPONENT_CSS.HEADER.NAV} ${isMenuOpen ? `absolute top-full left-0 right-0 ${theme === "dark" ? "bg-slate-900" : "bg-white"} p-4 flex flex-col gap-4 shadow-lg` : "hidden md:flex items-center gap-8"}`}>
          <Link href="/about" className={`${COMPONENT_CSS.HEADER.LINK} ${textClass} ${hoverClass} transition-colors`} onClick={closeMenu}>
            회사 소개
          </Link>
          <Link href="/services" className={`${COMPONENT_CSS.HEADER.LINK} ${textClass} ${hoverClass} transition-colors`} onClick={closeMenu}>
            서비스 소개
          </Link>
          <Link href="/#pricing" className={`${COMPONENT_CSS.HEADER.LINK} ${textClass} ${hoverClass} transition-colors`} onClick={closeMenu}>
            가격 정보
          </Link>
          <Link href="/onboarding/status" className={`${COMPONENT_CSS.HEADER.LINK} ${textClass} ${hoverClass} transition-colors`} onClick={closeMenu}>
            신청 상태 조회
          </Link>
          <Link href="/onboarding" className={`${COMPONENT_CSS.HEADER.BUTTON} bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-xl font-semibold transition-colors`} onClick={closeMenu}>
            시작하기
          </Link>
        </nav>
      </div>
    </header>
  );
}

