import { DeferredChrome } from '@/components/motion/DeferredChrome';
import { SiteFooter } from './SiteFooter';
import { SiteHeader } from './SiteHeader';

type SiteShellProps = {
  children: React.ReactNode;
  noticeText?: string | null;
  /** Homepage: defer reveal/sticky until after LCP poster boot gate. */
  deferChrome?: boolean;
};

export function SiteShell({
  children,
  noticeText = null,
  deferChrome = false,
}: SiteShellProps) {
  return (
    <>
      <a className="skip-link" href="#main">
        본문으로 건너뛰기
      </a>
      <SiteHeader noticeText={noticeText} />
      <main id="main">{children}</main>
      <SiteFooter />
      <DeferredChrome waitForHomeBoot={deferChrome} />
    </>
  );
}
