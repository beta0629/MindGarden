import Image from 'next/image';
import Link from 'next/link';
import { SiteShell } from '@/components/layout/SiteShell';
import { BookingCta } from '@/components/ui/BookingCta';
import { ConfirmNeeded } from '@/components/ui/ConfirmNeeded';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  clinicOsClient,
  getActiveFirstMindWalk,
} from '@/lib/clinic-os/client';
import { eventCopy } from '@/lib/content/subpages';
import { formatKstDateRange, formatWon } from '@/lib/format';
import { buildMetadata } from '@/lib/seo';

export const revalidate = 300;

export const metadata = buildMetadata({
  title: '이벤트',
  description: '첫 마음산책 이벤트 안내',
  path: '/event',
});

export default async function EventPage() {
  const products = await clinicOsClient.getConsultationProducts();
  const eventProduct = getActiveFirstMindWalk(products);

  if (!eventProduct) {
    return (
      <SiteShell>
        <section className="container page-hero">
          <h1>{eventCopy.offTitle}</h1>
          <EmptyState kind="event" title={eventCopy.offTitle} body={eventCopy.offBody}>
            <BookingCta />
            <p>
              <Link className="text-link" href="/guide">
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
          {formatWon(eventProduct.eventPrice!)}
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
            <li>{formatWon(eventProduct.eventPrice!)}</li>
            {eventProduct.eventStartDate && eventProduct.eventEndDate ? (
              <li>
                {formatKstDateRange(
                  eventProduct.eventStartDate,
                  eventProduct.eventEndDate,
                )}{' '}
                (관리자가 설정한 기간, 서버 시각 기준)
              </li>
            ) : null}
          </ul>
          <p>
            <Link className="text-link" href="/guide">
              비용 전체 보기 →
            </Link>
          </p>
          <BookingCta />
        </div>
      </section>
    </SiteShell>
  );
}
