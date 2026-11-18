import { HomeBootProgress } from '@/components/home/HomeBootProgress';
import { RevealBoot } from '@/components/motion/Reveal';
import { SiteFooter } from './SiteFooter';
import { SiteHeader } from './SiteHeader';
import { StickyBookingBar } from './StickyBookingBar';

type SiteShellProps = {
  children: React.ReactNode;
  noticeText?: string | null;
};

export function SiteShell({ children, noticeText = null }: SiteShellProps) {
  return (
    <>
      <a className="skip-link" href="#main">
        본문으로 건너뛰기
      </a>
      {/* Homepage `/` only — session-once cream/green boot bar (no LCP text block). */}
      <HomeBootProgress />
      <SiteHeader noticeText={noticeText} />
      <main id="main">{children}</main>
      <SiteFooter />
      <StickyBookingBar />
      <RevealBoot />
    </>
  );
}
