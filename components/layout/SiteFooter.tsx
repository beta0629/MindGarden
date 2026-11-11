import Link from 'next/link';
import { SITE } from '@/lib/site';

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container site-footer__grid">
        <div>
          <strong>{SITE.name}</strong>
          <div className="site-footer__meta" style={{ marginTop: '0.75rem' }}>
            <span>대표 {SITE.representative}</span>
            <span>{SITE.address}</span>
            <a href={`tel:${SITE.phoneTel}`}>{SITE.phoneDisplay}</a>
            <span>{SITE.hours}</span>
            <span>사업자등록번호 {SITE.businessNumber}</span>
            <span>통신판매업 {SITE.mailOrderNumber}</span>
          </div>
        </div>

        <nav aria-label="푸터 메뉴" className="stack-sm">
          <Link href="/about">센터소개</Link>
          <Link href="/counseling">상담 프로그램</Link>
          <Link href="/counselors">전문가</Link>
          <Link href="/guide">이용 안내</Link>
          <Link href="/location">오시는 길</Link>
          <Link href="/faq">자주 묻는 질문</Link>
          <Link href="/contact">문의</Link>
        </nav>

        <div className="stack-sm">
          <a href={SITE.bookingUrl} target="_blank" rel="noopener noreferrer">
            네이버 플레이스 예약
          </a>
          <a href={SITE.youtubeUrl} target="_blank" rel="noopener noreferrer">
            YouTube
          </a>
          <a href={SITE.blogUrl} target="_blank" rel="noopener noreferrer">
            Blog
          </a>
        </div>
      </div>

      <div className="container site-footer__legal">
        <Link href="/privacy">개인정보처리방침</Link>
        <Link href="/terms">이용약관</Link>
        <span>© {new Date().getFullYear()} {SITE.name}</span>
      </div>
    </footer>
  );
}
