import Image from 'next/image';
import Link from 'next/link';

/** 메인 히어로 아래: /screening 체크리스트 허브로 이어지는 프로모 (상단 DB 배너와 별도) */
export default function HomeScreeningPromo() {
  return (
    <section className="home-screening-promo" aria-label="ADHD·공존질환 체크리스트 허브 바로가기">
      <div className="home-screening-promo-inner">
        <Link href="/screening" className="home-screening-promo-link">
          <span className="home-screening-promo-visual">
            <Image
              src="/assets/images/programs/screening-promo-desk.png"
              alt=""
              fill
              className="home-screening-promo-img"
              style={{ objectFit: 'cover', objectPosition: '45% center' }}
              priority
              sizes="(max-width: 768px) 100vw, min(1200px, 100vw)"
            />
            <span className="home-screening-promo-overlay" aria-hidden="true">
              <span className="home-screening-promo-kicker">마인드가든</span>
              <span className="home-screening-promo-headline">
                ADHD &amp; 공존질환
                <br />
                체크리스트
              </span>
              <span className="home-screening-promo-sub">주제별 간이 체크리스트</span>
              <span className="home-screening-promo-cta">살펴보기</span>
            </span>
            <span className="sr-only">
              ADHD 및 공존질환 주제별 간이 체크리스트 페이지로 이동
            </span>
          </span>
        </Link>
      </div>
    </section>
  );
}
