import Image from 'next/image';
import { SiteShell } from '@/components/layout/SiteShell';
import { BookingCta } from '@/components/ui/BookingCta';
import { ConfirmNeeded } from '@/components/ui/ConfirmNeeded';
import { PlaceholderMedia } from '@/components/ui/PlaceholderMedia';
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
          <h2 className="section__title">
            지도
            <ConfirmNeeded />
          </h2>
          <PlaceholderMedia label="지도 미리보기" aspectRatio="16 / 9" />
          <a
            className="text-link"
            href={`https://map.naver.com/p/entry/place/${SITE.naverPlaceId}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            네이버 지도에서 보기 ↗
          </a>
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
            <PlaceholderMedia label="건물 외관" aspectRatio="16 / 9" />
            <PlaceholderMedia label="입구·간판" aspectRatio="4 / 3" />
          </div>
          <p className="muted">
            건물 외관·거리 간판 컷은 실사 제공 후 교체합니다.
            <ConfirmNeeded />
          </p>
          <div style={{ marginTop: '1.5rem' }}>
            <BookingCta />
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
