'use client';

import type { MouseEvent } from 'react';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';

export default function Navigation() {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isWhite, setIsWhite] = useState(false); // 초기값을 false로 변경하여 어두운 색상으로 시작
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const heroSection = document.querySelector('.hero-section');
      
      // 히어로 섹션이 없으면 (블로그 페이지 등) 자동으로 scrolled 상태
      if (!heroSection) {
        setIsScrolled(true);
        setIsWhite(false);
        return;
      }

      const heroRect = heroSection.getBoundingClientRect();
      const heroBottom = heroRect.bottom;
      const heroTop = heroRect.top;
      const scrolled = heroBottom < 50;
      
      // 히어로 섹션이 화면 상단에 있고 네비게이션 영역이 히어로 섹션 내부에 있을 때만 흰색 사용
      // 네비게이션은 top: 0에 있으므로, 히어로 섹션이 네비게이션 아래에 있으면 흰색 사용
      const navHeight = 80; // 네비게이션 높이 대략값
      const isNavOverHero = heroTop < navHeight && heroBottom > navHeight;
      const shouldUseWhite = isNavOverHero && !scrolled;

      setIsScrolled(scrolled);
      setIsWhite(shouldUseWhite);
    };

    // 초기 상태 확인 (약간의 지연을 두어 DOM이 완전히 로드된 후 확인)
    const timer = setTimeout(() => {
      handleScroll();
    }, 200);

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleScroll);
    
    return () => {
      clearTimeout(timer);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMenuOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // scrolled 상태에서는 CSS가 자동으로 색상을 변경하므로 인라인 스타일 제거
  const textColor = isWhite && !isScrolled ? 'var(--white)' : undefined;
  const lineColor = isWhite && !isScrolled ? 'var(--white)' : undefined;

  const [hoveredMenu, setHoveredMenu] = useState<string | null>(null);
  const closeSubmenuTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const SUBMENU_CLOSE_DELAY_MS = 250;

  const scheduleCloseSubmenu = () => {
    if (closeSubmenuTimerRef.current) clearTimeout(closeSubmenuTimerRef.current);
    closeSubmenuTimerRef.current = setTimeout(() => {
      setHoveredMenu(null);
      closeSubmenuTimerRef.current = null;
    }, SUBMENU_CLOSE_DELAY_MS);
  };

  const cancelCloseSubmenu = () => {
    if (closeSubmenuTimerRef.current) {
      clearTimeout(closeSubmenuTimerRef.current);
      closeSubmenuTimerRef.current = null;
    }
  };

  const enterSubmenu = (href: string) => {
    cancelCloseSubmenu();
    setHoveredMenu(href);
  };

  useEffect(() => {
    return () => {
      if (closeSubmenuTimerRef.current) clearTimeout(closeSubmenuTimerRef.current);
    };
  }, []);

  // 모바일 드로어에서 열린 서브메뉴 상태 관리
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);
  
  // 현재 경로가 서브메뉴 항목 중 하나인지 확인
  useEffect(() => {
    const currentSubmenu = menu.find(m => 
      m.submenu && m.submenu.some(sub => sub.href === pathname || pathname.startsWith(sub.href + '/'))
    );
    if (currentSubmenu) {
      setOpenSubmenu(currentSubmenu.href);
    } else {
      setOpenSubmenu(null);
    }
  }, [pathname]);
  
  // 서브메뉴 토글 핸들러
  const toggleSubmenu = (href: string) => {
    setOpenSubmenu(prev => prev === href ? null : href);
  };

  const menu = [
    { 
      label: '센터소개', 
      href: '#about',
      submenu: [
        { label: '가치관', href: '/values' },
        { label: '전문특화', href: '/about/mindgarden' },
        { label: '전문가', href: '/counselors' },
        { label: '센터사진 및 동영상', href: '/#gallery' }
      ]
    },
    { 
      label: '상담의 종류', 
      href: '#counseling-types',
      submenu: [
        { label: '아동.청소년ADHD', href: '#' },
        { label: '성인 ADHD', href: '#' },
        { label: '동반질환', href: '#' },
        { label: '상담과목', href: '#' }
      ]
    },
    { 
      label: '프로그램', 
      href: '#programs',
      submenu: [
        { label: '대상', href: '#' },
        { label: '증상', href: '#' },
        { label: '치료', href: '#' },
        { label: '심리검사', href: '#' }
      ]
    },
    { label: '칼럼', href: '/blog' },
    { label: '후기', href: '/reviews' },
  ];

  const onNavClick =
    (href: string) =>
    (e: MouseEvent<HTMLAnchorElement>) => {
      setIsMenuOpen(false);
      
      // 외부 링크(/)인 경우 기본 동작 사용 (Next.js Link가 처리)
      if (href.startsWith('/')) {
        return;
      }
      
      // 해시 링크인 경우
      if (href.startsWith('#')) {
        e.preventDefault();
        
        // 현재 페이지가 홈페이지가 아니면 홈페이지로 이동 후 스크롤
        if (pathname !== '/') {
          window.location.href = `/${href}`;
          return;
        }
        
        // 홈페이지에 있으면 해당 섹션으로 스크롤
        setTimeout(() => {
          const el = document.querySelector(href);
          if (el) {
            const offset = 80; // GNB 높이 고려
            const elementPosition = el.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - offset;
            
            window.scrollTo({
              top: offsetPosition,
              behavior: 'smooth'
            });
          }
        }, 100);
      }
    };

  return (
    <>
      <nav className={`gnb ${isScrolled ? 'scrolled' : ''} ${isWhite && !isScrolled ? 'white-text' : ''}`}>
        <div className="gnb-inner">
          <Link 
            className="logo" 
            href="/" 
            onClick={(e) => {
              if (pathname === '/') {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              textDecoration: 'none',
              ...(textColor ? { color: textColor } : {}),
            }}
          >
            <Image
              src="/assets/images/logo/logo_new.png"
              alt="마인드가든 심리상담센터"
              width={120}
              height={120}
              style={{
                objectFit: 'contain',
                flexShrink: 0,
                height: 'auto',
                maxHeight: '50px',
                width: 'auto',
              }}
              priority
            />
            <span style={{ 
              fontSize: '1.125rem',
              fontWeight: '700',
              whiteSpace: 'nowrap',
            }}>
              마인드가든
            </span>
          </Link>

          <div className="gnb-right">
            <ul className="gnb-menu" aria-label="Global Navigation">
              {menu.map((m) => (
                <li
                  key={m.href}
                  className={m.submenu ? 'has-submenu' : ''}
                >
                  <div
                    onMouseEnter={() => m.submenu && enterSubmenu(m.href)}
                    onMouseLeave={() => m.submenu && scheduleCloseSubmenu()}
                    style={{ display: 'contents' }}
                  >
                    {m.href.startsWith('/') ? (
                      <Link
                        href={m.href}
                        className="gnb-link"
                        style={textColor ? { color: textColor } : undefined}
                      >
                        {m.label}
                      </Link>
                    ) : (
                      <a
                        href={pathname === '/' ? m.href : `/${m.href}`}
                        onClick={onNavClick(m.href)}
                        className="gnb-link"
                        style={textColor ? { color: textColor } : undefined}
                      >
                        {m.label}
                      </a>
                    )}
                    {m.submenu && hoveredMenu === m.href && (
                      <ul
                        className="gnb-submenu"
                        onMouseEnter={() => enterSubmenu(m.href)}
                        onMouseLeave={() => scheduleCloseSubmenu()}
                      >
                        {m.submenu.map((sub) => (
                          <li key={sub.href}>
                            <Link
                              href={sub.href}
                              className="gnb-submenu-link"
                              onClick={() => setIsMenuOpen(false)}
                            >
                              {sub.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </li>
              ))}
            </ul>

            <Link
              href="/location"
              className={`gnb-cta ${isScrolled ? 'scrolled' : ''}`}
              onClick={() => setIsMenuOpen(false)}
            >
              센터 위치
            </Link>

            <button
              type="button"
              className="menu-trigger"
              aria-label="메뉴 열기"
              aria-expanded={isMenuOpen}
              onClick={() => setIsMenuOpen((v) => !v)}
            >
              <span className="line" style={lineColor ? { backgroundColor: lineColor } : undefined}></span>
              <span className="line short" style={lineColor ? { backgroundColor: lineColor } : undefined}></span>
            </button>
          </div>
        </div>
      </nav>

      {isMenuOpen && <div className="gnb-backdrop" onClick={() => setIsMenuOpen(false)} />}
      <aside className={`gnb-drawer ${isMenuOpen ? 'open' : ''}`} aria-hidden={!isMenuOpen}>
        <div className="gnb-drawer-header">
          <div className="gnb-drawer-title">메뉴</div>
          <button type="button" className="gnb-drawer-close" onClick={() => setIsMenuOpen(false)}>
            닫기
          </button>
        </div>
        <nav className="gnb-drawer-nav" aria-label="Mobile Navigation">
          {menu.map((m) => {
            const isSubmenuOpen = openSubmenu === m.href;
            const hasActiveSubmenu = m.submenu && m.submenu.some(sub => 
              sub.href === pathname || pathname.startsWith(sub.href + '/')
            );
            
            return (
              <div key={m.href}>
                {m.submenu ? (
                  // 서브메뉴가 있는 경우: 아코디언 버튼
                  <div>
                    <button
                      type="button"
                      className="gnb-drawer-link gnb-drawer-link-with-submenu"
                      onClick={() => toggleSubmenu(m.href)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        width: '100%',
                        textAlign: 'left',
                        cursor: 'pointer',
                      }}
                    >
                      <span>{m.label}</span>
                      <span style={{
                        transition: 'transform 0.3s ease',
                        transform: isSubmenuOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        fontSize: '0.8rem',
                      }}>
                        ▼
                      </span>
                    </button>
                    <div 
                      className={`gnb-drawer-submenu ${isSubmenuOpen ? 'open' : ''}`}
                      style={{
                        maxHeight: isSubmenuOpen ? '500px' : '0',
                        overflow: 'hidden',
                        transition: 'max-height 0.3s ease',
                      }}
                    >
                      {m.submenu.map((sub) => {
                        const isActive = sub.href === pathname || pathname.startsWith(sub.href + '/');
                        return (
                          <Link 
                            key={sub.href} 
                            className={`gnb-drawer-submenu-link ${isActive ? 'active' : ''}`}
                            href={sub.href}
                            onClick={() => setIsMenuOpen(false)}
                          >
                            {sub.label}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  // 서브메뉴가 없는 경우: 일반 링크
                  m.href.startsWith('/') ? (
                    <Link 
                      className="gnb-drawer-link" 
                      href={m.href}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {m.label}
                    </Link>
                  ) : (
                    <a 
                      className="gnb-drawer-link" 
                      href={pathname === '/' ? m.href : `/${m.href}`} 
                      onClick={(e) => {
                        onNavClick(m.href)(e);
                        setIsMenuOpen(false);
                      }}
                    >
                      {m.label}
                    </a>
                  )
                )}
              </div>
            );
          })}
          <Link
            className="gnb-drawer-cta"
            href="/location"
            onClick={() => setIsMenuOpen(false)}
          >
            센터 위치
          </Link>
        </nav>
      </aside>
    </>
  );
}

