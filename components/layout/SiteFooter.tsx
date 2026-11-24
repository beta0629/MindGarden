import { BrandLockup } from '@/components/brand/BrandLockup';
import { SITE } from '@/lib/site';
import { BusinessHours } from '@/components/ui/BusinessHours';
import { SitePhones } from '@/components/ui/SitePhones';

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container site-footer__grid">
        <div>
          <BrandLockup href="/" />
          <div className="site-footer__meta" style={{ marginTop: '0.75rem' }}>
            <span>대표 {SITE.representative}</span>
            <span>{SITE.address}</span>
            <span><SitePhones label="상담문의:" /></span>
            <span>
              <BusinessHours layout="stack" />
            </span>
            <span>사업자등록번호 {SITE.businessNumber}</span>
            <span>통신판매업 {SITE.mailOrderNumber}</span>
          </div>
        </div>

        <nav aria-label="푸터 메뉴" className="stack-sm">
          <a href="/about">센터소개</a>
          <a href="/counseling">상담 프로그램</a>
          <a href="/counselors">전문가</a>
          <a href="/guide">이용 안내</a>
          <a href="/location">오시는 길</a>
          <a href="/faq">자주 묻는 질문</a>
          <a href="/contact">문의</a>
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
        <a href="/privacy">개인정보처리방침</a>
        <a href="/terms">이용약관</a>
        <span>
          © {new Date().getFullYear()} {SITE.name}
        </span>
      </div>
    </footer>
  );
}
