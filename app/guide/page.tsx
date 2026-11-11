import Image from 'next/image';
import Link from 'next/link';
import { SiteShell } from '@/components/layout/SiteShell';
import { BookingCta } from '@/components/ui/BookingCta';
import { ConfirmNeeded } from '@/components/ui/ConfirmNeeded';
import {
  clinicOsClient,
  getActiveFirstMindWalk,
} from '@/lib/clinic-os/client';
import { guideCopy } from '@/lib/content/subpages';
import { formatKstDateRange, formatWon } from '@/lib/format';
import { buildMetadata } from '@/lib/seo';
import { SITE } from '@/lib/site';

export const revalidate = 300;

export const metadata = buildMetadata({
  title: '이용 안내',
  description: guideCopy.lead,
  path: '/guide',
});

export default async function GuidePage() {
  const products = await clinicOsClient.getConsultationProducts();
  const eventProduct = getActiveFirstMindWalk(products);

  return (
    <SiteShell>
      <section className="container page-hero">
        <h1>
          {guideCopy.title}
          <ConfirmNeeded />
        </h1>
        <p>{guideCopy.lead}</p>
        <BookingCta showHint />
        <div style={{ marginTop: '1.25rem' }}>
          <Image
            src="/images/guide-hero-lounge-c152-16x9.jpg"
            alt="센터 대기 공간"
            width={1440}
            height={810}
            sizes="100vw"
          />
        </div>
      </section>

      <section className="section">
        <div className="container">
          <h2 className="section__title">상담 절차</h2>
          <div className="process-grid" style={{ marginTop: '1.25rem' }}>
            {guideCopy.steps.map((step) => (
              <article key={step.title} className="process-item" style={{ textAlign: 'left' }}>
                <Image src={step.icon} alt="" width={64} height={64} />
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </article>
            ))}
          </div>
          <p className="muted" style={{ marginTop: '1rem' }}>
            {guideCopy.disclaimer}
          </p>
          <p>
            <Link className="text-link" href="/location">
              오시는 길
            </Link>
            {' · '}
            <Link className="text-link" href="/contact">
              문의하기
            </Link>
          </p>
        </div>
      </section>

      <section className="section section--sand">
        <div className="container">
          <h2 className="section__title">운영 시간</h2>
          <p>{SITE.hours}</p>
          <p>
            대표번호{' '}
            <a href={`tel:${SITE.phoneTel}`}>{SITE.phoneDisplay}</a>
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <h2 className="section__title">
            상담 비용
            <ConfirmNeeded />
          </h2>
          <p>{guideCopy.pricesLead}</p>
          <table className="price-table">
            <thead>
              <tr>
                <th>항목명</th>
                <th>금액</th>
              </tr>
            </thead>
            <tbody>
              {guideCopy.fixedPrices.map((row) => (
                <tr key={row.name}>
                  <td>{row.name}</td>
                  <td>{row.amount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="section section--sand">
        <div className="container stack-md">
          <h2 className="section__title">이벤트 가격</h2>
          {eventProduct ? (
            <>
              <p>
                {eventProduct.name} {formatWon(eventProduct.eventPrice!)}
              </p>
              {eventProduct.eventStartDate && eventProduct.eventEndDate ? (
                <p className="muted">
                  기간:{' '}
                  {formatKstDateRange(
                    eventProduct.eventStartDate,
                    eventProduct.eventEndDate,
                  )}
                </p>
              ) : null}
              <p>
                <Link className="text-link" href="/event">
                  이벤트 자세히 →
                </Link>
              </p>
              <BookingCta />
            </>
          ) : (
            <p>{guideCopy.offEventLine}</p>
          )}
        </div>
      </section>
    </SiteShell>
  );
}
