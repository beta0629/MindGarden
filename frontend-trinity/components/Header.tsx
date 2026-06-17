"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import TrinityLogo from "./TrinityLogo";
import { V2Button } from "./ui/V2Button";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMenu = () => setIsMenuOpen(false);

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-slate-900/90 backdrop-blur-md border-b border-slate-800 shadow-sm py-3" : "bg-transparent py-5"}`}>
      <div className="container mx-auto px-4 md:px-6 flex items-center justify-between">
        <Link href="/" className="flex-shrink-0 z-50" onClick={closeMenu}>
          <TrinityLogo variant="inverse" className="h-8 w-auto" />
        </Link>
        
        {/* Mobile menu button */}
        <button
          className="md:hidden text-slate-300 hover:text-white focus:outline-none z-50"
          onClick={toggleMenu}
          aria-label="메뉴 열기/닫기"
        >
          {isMenuOpen ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
          )}
        </button>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          <Link href="#about" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">회사 소개</Link>
          <Link href="#services" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">서비스</Link>
          <Link href="#pricing" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">요금제</Link>
          <div className="h-4 w-px bg-slate-700"></div>
          <Link href="/onboarding/status" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">신청 조회</Link>
          <V2Button href="/onboarding" size="sm" className="bg-blue-600 hover:bg-blue-500 text-white border-transparent">무료로 시작하기</V2Button>
        </nav>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="absolute top-full left-0 w-full bg-slate-900 border-b border-slate-800 shadow-lg py-4 px-4 flex flex-col gap-4 md:hidden">
            <Link href="#about" className="block py-2 text-base font-medium text-slate-300 hover:text-white" onClick={closeMenu}>회사 소개</Link>
            <Link href="#services" className="block py-2 text-base font-medium text-slate-300 hover:text-white" onClick={closeMenu}>서비스</Link>
            <Link href="#pricing" className="block py-2 text-base font-medium text-slate-300 hover:text-white" onClick={closeMenu}>요금제</Link>
            <Link href="/onboarding/status" className="block py-2 text-base font-medium text-slate-300 hover:text-white" onClick={closeMenu}>신청 조회</Link>
            <V2Button href="/onboarding" fullWidth size="md" className="mt-2 bg-blue-600 hover:bg-blue-500 text-white border-transparent">무료로 시작하기</V2Button>
          </div>
        )}
      </div>
    </header>
  );
}
