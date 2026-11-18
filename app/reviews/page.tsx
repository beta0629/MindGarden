import Image from 'next/image';
import Link from 'next/link';
import { SiteShell } from '@/components/layout/SiteShell';
import { BookingCta } from '@/components/ui/BookingCta';
import { ConfirmNeeded } from '@/components/ui/ConfirmNeeded';
import { EmptyState } from '@/components/ui/EmptyState';
import { clinicOsClient } from '@/lib/clinic-os/client';
import { reviewsCopy } from '@/lib/content/subpages';
import { buildMetadata } from '@/lib/seo';

export const revalidate = 300;

export const metadata = buildMetadata({
  title: '이용 후기',
  description: reviewsCopy.lead,
  path: '/reviews',
});

export default async function ReviewsPage() {
  const homepage = await clinicOsClient.getHomepageContent();
  const reviews = homepage.reviews;

  return (
    <SiteShell>
      <section className="container page-hero">
        <h1>
          {reviewsCopy.title}
          <ConfirmNeeded />
        </h1>
        <p>{reviewsCopy.lead}</p>
        <Image
          src="/images/reviews-band-flowers-c147-6x1.jpg"
          alt=""
          width={1440}
          height={240}
          sizes="100vw"
        />
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container prose">
          {reviews.length === 0 ? (
            <EmptyState kind="reviews" title={reviewsCopy.empty} />
          ) : (
            <div className="stack-md">
              {reviews.map((review) => (
                <article
                  key={`${review.publishedAt}-${review.displayName ?? 'anon'}-${review.body.slice(0, 12)}`}
                  style={{
                    borderBottom: '1px solid var(--line)',
                    paddingBottom: '1rem',
                  }}
                >
                  <p style={{ marginBottom: '0.35rem' }}>{review.body}</p>
                  <p className="muted" style={{ margin: 0, fontSize: '0.875rem' }}>
                    {review.displayName || '익명'} ·{' '}
                    {review.publishedAt.slice(0, 10)}
                  </p>
                </article>
              ))}
            </div>
          )}

          <h2 style={{ marginTop: '2rem' }}>작성·운영 안내</h2>
          <p>{reviewsCopy.policy}</p>
          <p className="muted">
            후기 운영정책 원고 자리
            <ConfirmNeeded />
          </p>
          <p>
            <Link className="text-link" href="/contact">
              문의하기 →
            </Link>
          </p>
          <BookingCta />
        </div>
      </section>
    </SiteShell>
  );
}
