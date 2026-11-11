import Image from 'next/image';
import Link from 'next/link';
import { SiteShell } from '@/components/layout/SiteShell';
import { BookingCta } from '@/components/ui/BookingCta';
import { ConfirmNeeded } from '@/components/ui/ConfirmNeeded';
import { aboutCopy } from '@/lib/content/subpages';
import { buildMetadata } from '@/lib/seo';
import { SITE } from '@/lib/site';

export const metadata = buildMetadata({
  title: '센터 소개',
  description: aboutCopy.lead,
  path: '/about',
});

export default function AboutPage() {
  return (
    <SiteShell>
      <section className="container page-hero">
        <h1>
          {aboutCopy.title}
          <ConfirmNeeded />
        </h1>
        <p>{aboutCopy.lead}</p>
        <p className="muted">
          {aboutCopy.support}
          <ConfirmNeeded />
        </p>
        <BookingCta showHint />
        <div style={{ marginTop: '1.5rem' }}>
          <Image
            src="/images/about-hero-lobby-c148-16x9.jpg"
            alt="센터 로비"
            width={1440}
            height={810}
            sizes="100vw"
            priority
          />
        </div>
      </section>

      <section className="section section--sand">
        <div className="container">
          <h2 className="section__title">
            가치
            <ConfirmNeeded />
          </h2>
          <p className="section__lead">{aboutCopy.valuesLead}</p>
          <div className="card-grid" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(14rem,1fr))' }}>
            {aboutCopy.values.map((value) => (
              <article key={value.title} className="area-card" style={{ display: 'block' }}>
                <h3>{value.title}</h3>
                <p>{value.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
            <div>
              <h2 className="section__title">센터 공간</h2>
              <p className="section__lead">마인드가든의 공간을 소개합니다.</p>
            </div>
            <Link className="text-link" href="/gallery">
              공간 더 보기 →
            </Link>
          </div>
          <div className="space-grid">
            <figure className="space-card space-card--wide">
              <Image
                src="/images/about-space-sandplay-c145-16x9.jpg"
                alt="모래놀이실"
                width={1440}
                height={810}
              />
              <figcaption>모래놀이실</figcaption>
            </figure>
            <figure className="space-card">
              <Image
                src="/images/about-space-play-c171-4x3.jpg"
                alt="놀이 공간"
                width={800}
                height={600}
              />
              <figcaption>놀이 공간</figcaption>
            </figure>
            <figure className="space-card">
              <Image
                src="/images/about-space-waiting-c154-4x3.jpg"
                alt="대기 공간"
                width={800}
                height={600}
              />
              <figcaption>
                대기 공간
                <ConfirmNeeded />
              </figcaption>
            </figure>
          </div>
        </div>
      </section>

      <section className="section section--sand">
        <div className="container counselor counselor--text-only">
          <div>
            <h2 className="section__title">상담사</h2>
            <h3 style={{ fontFamily: 'var(--font-sans)' }}>김선희</h3>
            <p className="muted">마인드가든심리상담센터 대표원장</p>
            <p>주의·정서·관계, 아동·청소년과 부부·가족 상담을 안내합니다.</p>
            <Link className="btn btn--ghost" href="/counselors">
              자세히 보기 →
            </Link>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <h2 className="section__title">상담 분야</h2>
          <div className="area-list">
            {aboutCopy.areas.map((item) => (
              <Link
                key={item.slug}
                className="area-card"
                href={`/counseling/${item.slug}`}
              >
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.line}</p>
                </div>
                <Image src={item.icon} alt="" width={72} height={72} />
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section section--sand">
        <div className="container stack-md">
          <h2 className="section__title">상담 예약·문의</h2>
          <p>예약은 네이버 플레이스에서 받아 드립니다.</p>
          <BookingCta />
          <p>
            <Link className="text-link" href="/contact">
              문의하기
            </Link>
            {' · '}
            <Link className="text-link" href="/guide">
              이용 안내
            </Link>
          </p>
          <p>
            <a href={`tel:${SITE.phoneTel}`}>{SITE.phoneDisplay}</a>
          </p>
          <p className="muted">{SITE.hours}</p>
        </div>
      </section>
    </SiteShell>
  );
}
