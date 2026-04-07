import Image from 'next/image';
import Link from 'next/link';

/** 메인 히어로 아래: /screening 간이 체크리스트 허브로 이어지는 이미지 링크 (상단 DB 배너와 별도) */
export default function HomeScreeningPromo() {
  return (
    <section className="home-screening-promo" aria-label="주제별 간이 체크리스트 바로가기">
      <div className="home-screening-promo-inner">
        <Link href="/screening" className="home-screening-promo-link">
          <Image
            src="/assets/images/programs/adhd-testing.png"
            width={1200}
            height={400}
            alt="마인드가든 9가지 심리 간이 체크리스트 시작하기"
            className="home-screening-promo-img"
            priority
            sizes="(max-width: 768px) 100vw, min(1200px, 100vw)"
          />
        </Link>
      </div>
    </section>
  );
}
