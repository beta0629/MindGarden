import Image from 'next/image';
import { SiteShell } from '@/components/layout/SiteShell';
import { BookingCta } from '@/components/ui/BookingCta';
import { ConfirmNeeded } from '@/components/ui/ConfirmNeeded';
import { MapLinkCard } from '@/components/ui/MapLinkCard';
import { locationCopy } from '@/lib/content/subpages';
import { buildMetadata } from '@/lib/seo';
import { SITE } from '@/lib/site';

export const metadata = buildMetadata({
  title: '오시는 길',
  description: `${SITE.address}, ${SITE.addressLandmark}`,
  path: '/location',
});

export default function LocationPage() {
  return (
    <SiteShell>
      <section className="container page-hero">
        <h1>{locationCopy.title}</h1>
        <p>{SITE.address}</p>
        <p className="muted">{SITE.addressLandmark}</p>
        <p>{SITE.hours}</p>
        <p>
          <a href={`tel:${SITE.phoneTel}`}>{SITE.phoneDisplay}</a>
        </p>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container stack-md">
          <h2 className="section__title">지도</h2>
          <MapLinkCard />
        </div>
      </section>

      <section className="section section--sand">
        <div className="container">
          <h2 className="section__title">교통</h2>
          <div className="card-grid" style={{ marginTop: '1rem' }}>
            {locationCopy.transit.map((item) => (
              <article key={item.body} className="area-card">
                <Image src={item.icon} alt="" width={48} height={48} />
                <div>
                  <h3 style={{ fontFamily: 'var(--font-sans)' }}>{item.label}</h3>
                  <p>{item.body}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <h2 className="section__title">주차</h2>
          <p>
            <Image
              src="/icons/loc-parking.svg"
              alt=""
              width={48}
              height={48}
              style={{ marginBottom: '0.75rem' }}
            />
            {locationCopy.parking}
          </p>
        </div>
      </section>

      <section className="section section--sand">
        <div className="container">
          <h2 className="section__title">
            건물·입구
            <ConfirmNeeded />
          </h2>
          <div className="media-grid">
            <figure>
              <Image
                src="/images/location-lobby-c148-16x9.jpg"
                alt="센터 로비"
                width={960}
                height={540}
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </figure>
            <figure>
              <Image
                src="/images/location-entrance-c149-4x3.jpg"
                alt="센터 입구"
                width={800}
                height={600}
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </figure>
          </div>
          <div style={{ marginTop: '1.5rem' }}>
            <BookingCta />
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
