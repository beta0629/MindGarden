import Image from 'next/image';
import Link from 'next/link';
import { SiteShell } from '@/components/layout/SiteShell';
import { BookingCta } from '@/components/ui/BookingCta';
import { ConfirmNeeded } from '@/components/ui/ConfirmNeeded';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  clinicOsClient,
  getActiveEventProduct,
  resolveProductDisplayPrice,
} from '@/lib/clinic-os/client';
import { eventCopy } from '@/lib/content/subpages';
import { formatKstDateRange, formatWon } from '@/lib/format';
import { buildMetadata } from '@/lib/seo';
import { SITE } from '@/lib/site';

export const revalidate = 300;

export const metadata = buildMetadata({
  title: '이벤트',
  description: '첫 마음산책 이벤트 안내',
  path: '/event',
});

export default async function EventPage() {
  const products = await clinicOsClient.getConsultationProducts();
  const eventProduct = getActiveEventProduct(products);
  const eventPrice = eventProduct
    ? resolveProductDisplayPrice(eventProduct)
    : null;

  if (!eventProduct || !eventPrice) {
    return (
      <SiteShell>
        <section className="container page-hero">
          <h1>{eventCopy.offTitle}</h1>
          <EmptyState
            kind="event"
            title={eventCopy.offTitle}
            body={eventCopy.offBody}
          >
            <p>
              <a href={`tel:${SITE.phoneTel}`}>{SITE.phoneDisplay}</a>
              {' · '}
              <a
                className="text-link"
                href={SITE.bookingUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                네이버 플레이스 예약 ↗
              </a>
            </p>
            <BookingCta />
            <p>
              <Link className="text-link" href="/guide#pricing">
                이용 안내 →
              </Link>
            </p>
          </EmptyState>
        </section>
      </SiteShell>
    );
  }

  return (
    <SiteShell>
      <section className="container page-hero">
        <h1>
          {eventCopy.title}
          <ConfirmNeeded />
        </h1>
        <p>{eventCopy.line}</p>
        <p style={{ fontSize: '1.5rem', fontWeight: 700 }}>
          {eventPrice.struckThroughPrice != null ? (
            <>
              <s className="price-cell__struck">
                {formatWon(eventPrice.struckThroughPrice)}
              </s>{' '}
            </>
          ) : null}
          {formatWon(eventPrice.amount)}
        </p>
        {eventProduct.eventStartDate && eventProduct.eventEndDate ? (
          <p className="muted">
            {formatKstDateRange(
              eventProduct.eventStartDate,
              eventProduct.eventEndDate,
            )}
          </p>
        ) : null}
        <BookingCta showHint />
        <figure className="event-banner__media" style={{ marginTop: '1.25rem' }}>
          <Image
            src="/images/banner-flowers-c64-3x2.jpg"
            alt="센터 로비 꽃"
            width={1440}
            height={960}
            sizes="100vw"
            priority
          />
        </figure>
      </section>

      <section className="section section--sand">
        <div className="container prose">
          <h2>구성 안내</h2>
          <ul>
            <li>{eventProduct.name}</li>
            <li>
              {eventPrice.struckThroughPrice != null ? (
                <>
                  <s className="price-cell__struck">
                    {formatWon(eventPrice.struckThroughPrice)}
                  </s>{' '}
                </>
              ) : null}
              {formatWon(eventPrice.amount)}
            </li>
            {eventProduct.eventStartDate && eventProduct.eventEndDate ? (
              <li>
                {formatKstDateRange(
                  eventProduct.eventStartDate,
                  eventProduct.eventEndDate,
                )}{' '}
                (안내된 기간에만 적용)
              </li>
            ) : null}
            {eventProduct.sessionMinutes != null ? (
              <li>{eventProduct.sessionMinutes}분</li>
            ) : null}
          </ul>
          <p>
            <Link className="text-link" href="/guide#pricing">
              비용 전체 보기 →
            </Link>
          </p>
          <BookingCta />
        </div>
      </section>
    </SiteShell>
  );
}
