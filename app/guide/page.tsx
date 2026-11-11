import Image from 'next/image';
import Link from 'next/link';
import { SiteShell } from '@/components/layout/SiteShell';
import { BookingCta } from '@/components/ui/BookingCta';
import { ConfirmNeeded } from '@/components/ui/ConfirmNeeded';
import { EmptyState } from '@/components/ui/EmptyState';
import { ProductPriceList } from '@/components/ui/ProductPriceList';
import {
  clinicOsClient,
  getActiveEventProduct,
  resolveProductDisplayPrice,
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
  const eventProduct = getActiveEventProduct(products);
  const eventPrice = eventProduct
    ? resolveProductDisplayPrice(eventProduct)
    : null;

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
              <article
                key={step.title}
                className="process-item"
                style={{ textAlign: 'left' }}
              >
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

      <section className="section" id="pricing">
        <div className="container">
          <h2 className="section__title">
            상담 비용
            <ConfirmNeeded />
          </h2>
          <ProductPriceList products={products} />
        </div>
      </section>

      <section className="section section--sand">
        <div className="container stack-md">
          <h2 className="section__title">이벤트 가격</h2>
          {eventProduct && eventPrice ? (
            <>
              <p>
                {eventProduct.name}{' '}
                {eventPrice.struckThroughPrice != null ? (
                  <>
                    <s className="price-cell__struck">
                      {formatWon(eventPrice.struckThroughPrice)}
                    </s>{' '}
                  </>
                ) : null}
                <strong>{formatWon(eventPrice.amount)}</strong>
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
            <EmptyState
              kind="event"
              title="지금은 진행 중인 이벤트가 없습니다"
              body={guideCopy.offEventLine}
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
            </EmptyState>
          )}
        </div>
      </section>
    </SiteShell>
  );
}
