import { BrandLockup } from '@/components/brand/BrandLockup';
import { SITE } from '@/lib/site';
import { HeaderStickyHeight } from './HeaderStickyHeight';
import { MobileNavLazy } from './MobileNavLazy';
import { NoticeBar } from './NoticeBar';

const MAIN_NAV = [
  { href: '/about', label: '센터소개' },
  { href: '/counseling', label: '상담 프로그램' },
  { href: '/counselors', label: '전문가' },
  { href: '/blog', label: '칼럼/영상' },
  { href: '/contact', label: '문의' },
] as const;

type SiteHeaderProps = {
  noticeText?: string | null;
};

/**
 * Server Component header — desktop nav uses plain &lt;a&gt; so the App Router
 * client chunk stays off the LCP critical path. Mobile sheet is deferred.
 */
export function SiteHeader({ noticeText = null }: SiteHeaderProps) {
  return (
    <header id="site-header" className="site-header">
      <HeaderStickyHeight />
      <NoticeBar text={noticeText} />
      <div className="container header__inner">
        <BrandLockup />

        <nav className="nav-desktop" aria-label="본메뉴">
          {MAIN_NAV.map((item) => (
            <a key={item.href} className="nav-link" href={item.href}>
              {item.label}
            </a>
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

        <MobileNavLazy />
      </div>
    </header>
  );
}
