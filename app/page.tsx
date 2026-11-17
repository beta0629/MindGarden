import Image from 'next/image';
import Link from 'next/link';
import { HeroSection } from '@/components/home/HeroSection';
import { BenchScene, BookingScene, GateScene } from '@/components/home/v37';
import { SiteShell } from '@/components/layout/SiteShell';
import { BookingCta } from '@/components/ui/BookingCta';
import { ConfirmNeeded } from '@/components/ui/ConfirmNeeded';
import {
  clinicOsClient,
  getActiveEventProduct,
  resolveProductDisplayPrice,
} from '@/lib/clinic-os/client';
import type { ConsultationProduct } from '@/lib/clinic-os/types';
import { homeCopy } from '@/lib/content/home';
import { formatWon } from '@/lib/format';
import { getLatestBlogPosts, getLatestVideos } from '@/lib/feeds';
import { buildMetadata } from '@/lib/seo';
import { SITE } from '@/lib/site';

export const revalidate = 300;

export const metadata = buildMetadata({
  title: SITE.name,
  description:
    '마음이 쉬어 가는 정원 같은 상담센터. 인천 연수구 심리상담센터 마인드가든.',
  path: '/',
});

type PriceCardView = {
  key: string;
  title: string;
  amount: number;
  note: string;
  struckThrough: number | null;
  fromLive: boolean;
};

function buildPriceCards(products: ConsultationProduct[]): PriceCardView[] {
  const used = new Set<string>();
  return homeCopy.pricing.cards.map((guide) => {
    const match = products.find((product) => {
      if (used.has(product.skuCode)) return false;
      return guide.match.some((re) => re.test(product.name));
    });
    if (!match) {
      return {
        key: guide.key,
        title: guide.title,
        amount: guide.amount,
        note: guide.note,
        struckThrough: null,
        fromLive: false,
      };
    }
    used.add(match.skuCode);
    const view = resolveProductDisplayPrice(match);
    const note =
      guide.key === 'event' && match.eventStartDate && match.eventEndDate
        ? `${match.eventStartDate.replace(/-/g, '.')} – ${match.eventEndDate.slice(5).replace(/-/g, '.')}`
        : guide.note;
    return {
      key: guide.key,
      title: match.name || guide.title,
      amount: view.amount,
      note,
      struckThrough: view.struckThroughPrice,
      fromLive: true,
    };
  });
}

export default async function HomePage() {
  const [products, homepage, videos, posts] = await Promise.all([
    clinicOsClient.getConsultationProducts(),
    clinicOsClient.getHomepageContent(),
    getLatestVideos(4),
    getLatestBlogPosts(3),
  ]);

  const eventProduct = getActiveEventProduct(products);
  const priceCards = buildPriceCards(products);
  if (eventProduct) {
    const eventView = resolveProductDisplayPrice(eventProduct);
    const eventIdx = priceCards.findIndex((c) => c.key === 'event');
    if (eventIdx >= 0) {
      priceCards[eventIdx] = {
        key: 'event',
        title: eventProduct.name,
        amount: eventView.amount,
        note:
          eventProduct.eventStartDate && eventProduct.eventEndDate
            ? `${eventProduct.eventStartDate.replace(/-/g, '.')} – ${eventProduct.eventEndDate.slice(5).replace(/-/g, '.')}`
            : homeCopy.pricing.cards[3].note,
        struckThrough: eventView.struckThroughPrice,
        fromLive: true,
      };
    }
  }

  const homeReviews = homepage.reviews.slice(0, 3);
  const noticeBanner = homepage.banners.find((b) => {
    const title = b.title.trim();
    if (!title) return false;
    if (title === '공지 자리' || title.includes('배너 슬롯')) return false;
    return title.includes('공지');
  });

  const featuredReadings = [
    ...videos.map((v) => ({
      kind: 'video' as const,
      key: v.id,
      title: v.title,
      href: v.url,
      thumb: v.thumb,
      external: true,
    })),
    ...posts.map((p) => ({
      kind: 'blog' as const,
      key: p.url,
      title: p.title,
      href: p.url,
      thumb: p.thumb,
      external: true,
    })),
  ].slice(0, 4);

  const listReadings = posts.slice(0, 3);

  return (
    <SiteShell noticeText={noticeBanner?.title ?? null}>
      <HeroSection />

      {/* 1. 상담 분야 */}
      <section className="section home-areas" data-reveal>
        <div className="container home-areas__layout">
          <header className="home-areas__intro">
            <p className="section__eyebrow">{homeCopy.areas.eyebrow}</p>
            <h2 className="section__title">{homeCopy.areas.title}</h2>
            <p className="section__lead">{homeCopy.areas.lead}</p>
            <Link className="text-link" href={homeCopy.areas.moreHref}>
              {homeCopy.areas.moreLabel}
              <span aria-hidden="true"> →</span>
            </Link>
          </header>
          <div className="home-areas__grid" data-reveal-stagger>
            {homeCopy.areas.homeCards.map((card) => (
              <Link
                key={card.title}
                className="home-area-card"
                href={card.href}
                data-reveal
              >
                <Image src={card.icon} alt="" width={48} height={48} />
                <h3>{card.title}</h3>
                <p>{card.line}</p>
              </Link>
            ))}
            <Link
              className="home-area-card home-area-card--accent"
              href={homeCopy.areas.firstVisit.href}
              data-reveal
            >
              <h3>{homeCopy.areas.firstVisit.title}</h3>
              <p>{homeCopy.areas.firstVisit.body}</p>
              <span className="home-area-card__cta">
                {homeCopy.areas.firstVisit.cta}
                <span aria-hidden="true"> →</span>
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* 2. 공간 / Gate */}
      <section className="section section--sand home-spaces" data-reveal>
        <div className="container home-spaces__layout">
          <div className="home-spaces__copy">
            <p className="section__eyebrow">{homeCopy.spaces.eyebrow}</p>
            <h2 className="section__title">{homeCopy.spaces.title}</h2>
            <p className="section__lead">{homeCopy.spaces.lead}</p>
            <Link className="text-link" href={homeCopy.spaces.moreHref}>
              {homeCopy.spaces.moreLabel}
              <span aria-hidden="true"> →</span>
            </Link>
          </div>
          <div className="home-spaces__scene">
            <GateScene />
          </div>
          <div className="home-spaces__thumbs">
            {homeCopy.spaces.thumbs.map((thumb) => (
              <figure key={thumb.src} className="home-spaces__thumb">
                <Image
                  src={thumb.src}
                  alt={thumb.caption}
                  width={480}
                  height={640}
                  sizes="(max-width: 767px) 42vw, 12rem"
                />
                <figcaption>{thumb.caption}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* 3. 전문가 */}
      <section className="section home-experts" data-reveal>
        <div className="container">
          <header className="home-section-head">
            <div>
              <p className="section__eyebrow">{homeCopy.experts.eyebrow}</p>
              <h2 className="section__title">{homeCopy.experts.title}</h2>
              <p className="section__lead">{homeCopy.experts.lead}</p>
            </div>
            <Link className="text-link" href={homeCopy.experts.moreHref}>
              {homeCopy.experts.moreLabel}
              <span aria-hidden="true"> →</span>
            </Link>
          </header>
          <div className="home-experts__grid" data-reveal-stagger>
            <article className="home-expert-card" data-reveal>
              <div className="home-expert-card__media">
                <Image
                  src={homeCopy.experts.primary.photo}
                  alt=""
                  width={312}
                  height={312}
                  sizes="(max-width: 767px) 45vw, 16rem"
                />
              </div>
              <p className="home-expert-card__label">
                {homeCopy.experts.primary.name}
                <span aria-hidden="true"> · </span>
                {homeCopy.experts.primary.role}
              </p>
            </article>
            {Array.from({ length: homeCopy.experts.emptySlots }).map((_, i) => (
              <article
                key={`expert-empty-${i}`}
                className="home-expert-card home-expert-card--empty"
                data-reveal
              >
                <div
                  className="home-expert-card__media home-expert-card__media--watermark"
                  aria-hidden="true"
                >
                  <img src="/brand/logo.svg" alt="" width={72} height={72} />
                </div>
                <p className="home-expert-card__label">
                  {homeCopy.experts.emptyLabel}
                  <ConfirmNeeded />
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Dark stats band */}
      <section className="section home-stats" aria-label="센터 현황" data-reveal>
        <div className="container">
          <div className="home-stats__band">
            {homeCopy.stats.items.map((item) => (
              <div className="home-stats__item" key={item.label}>
                <p className="home-stats__value">[확인 필요]</p>
                <p className="home-stats__label">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. 후기 / Bench */}
      <section className="section home-reviews" data-reveal>
        <div className="container">
          <header className="home-reviews__header">
            <div>
              <p className="section__eyebrow">{homeCopy.reviews.eyebrow}</p>
              <h2 className="section__title">{homeCopy.reviews.title}</h2>
              <Link className="text-link" href={homeCopy.reviews.moreHref}>
                {homeCopy.reviews.moreLabel}
                <span aria-hidden="true"> →</span>
              </Link>
            </div>
            <div className="home-reviews__scene">
              <BenchScene />
            </div>
          </header>
          <div className="home-reviews__grid" data-reveal-stagger>
            {homeReviews.length > 0
              ? homeReviews.map((review, index) => (
                  <article
                    key={`${review.publishedAt}-${review.displayName ?? 'anon'}-${review.body.slice(0, 12)}`}
                    className={`home-review-card${
                      homeReviews.length >= 3 && index === 1
                        ? ' home-review-card--accent'
                        : ''
                    }`}
                    data-reveal
                  >
                    <p>{review.body}</p>
                    <p className="home-review-card__meta">
                      {review.displayName || '익명'} ·{' '}
                      {review.publishedAt.slice(0, 10)}
                    </p>
                  </article>
                ))
              : homeCopy.reviews.examples.map((review, index) => (
                  <article
                    key={review.meta}
                    className={`home-review-card${
                      index === 1 ? ' home-review-card--accent' : ''
                    }`}
                    data-reveal
                  >
                    <p>{review.body}</p>
                    <p className="home-review-card__meta">{review.meta}</p>
                  </article>
                ))}
          </div>
        </div>
      </section>

      {/* 6. 비용 */}
      <section className="section section--sand home-pricing" data-reveal>
        <div className="container">
          <header className="home-section-head home-section-head--stack">
            <p className="section__eyebrow">{homeCopy.pricing.eyebrow}</p>
            <h2 className="section__title">{homeCopy.pricing.title}</h2>
          </header>
          <div className="home-pricing__grid" data-reveal-stagger>
            {priceCards.map((card) => (
              <article className="home-price-card" key={card.key} data-reveal>
                <h3>{card.title}</h3>
                <p className="home-price-card__amount">
                  {card.struckThrough != null ? (
                    <s className="price-cell__struck">
                      {formatWon(card.struckThrough)}
                    </s>
                  ) : null}{' '}
                  {formatWon(card.amount)}
                </p>
                <p className="home-price-card__note">{card.note}</p>
              </article>
            ))}
          </div>
          <p className="home-pricing__more">
            <Link className="text-link" href={homeCopy.pricing.moreHref}>
              {homeCopy.pricing.moreLabel}
              <span aria-hidden="true"> →</span>
            </Link>
          </p>
        </div>
      </section>

      {/* 7. 읽을거리 */}
      <section className="section home-readings" data-reveal>
        <div className="container">
          <header className="home-section-head">
            <div>
              <p className="section__eyebrow">{homeCopy.readings.eyebrow}</p>
              <h2 className="section__title">{homeCopy.readings.title}</h2>
            </div>
            <a
              className="text-link"
              href={SITE.blogUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              {homeCopy.readings.moreLabel}
              <span aria-hidden="true"> →</span>
            </a>
          </header>

          {featuredReadings.length === 0 && listReadings.length === 0 ? (
            <p className="muted">표시할 소식이 없습니다. 잠시 후 다시 확인해 주세요.</p>
          ) : (
            <>
              <div className="home-readings__featured" data-reveal-stagger>
                {featuredReadings.map((item) => (
                  <a
                    key={item.key}
                    className="home-reading-feature"
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-reveal
                  >
                    <span className="home-reading-feature__media">
                      {item.thumb ? (
                        <Image
                          src={item.thumb}
                          alt=""
                          fill
                          sizes="(max-width: 767px) 45vw, 22vw"
                          style={{ objectFit: 'cover' }}
                        />
                      ) : (
                        <span className="home-reading-feature__fallback">
                          <img
                            src="/brand/logo.svg"
                            alt=""
                            width={48}
                            height={48}
                          />
                        </span>
                      )}
                      {item.kind === 'video' ? (
                        <span className="home-reading-feature__play" aria-hidden="true">
                          ▶
                        </span>
                      ) : null}
                    </span>
                    <strong>{item.title}</strong>
                  </a>
                ))}
              </div>
              {listReadings.length > 0 ? (
                <div className="home-readings__list">
                  {listReadings.map((post) => (
                    <a
                      key={`list-${post.url}`}
                      className="home-reading-row"
                      href={post.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {post.thumb ? (
                        <Image
                          src={post.thumb}
                          alt=""
                          width={96}
                          height={72}
                        />
                      ) : (
                        <span className="blog-thumb-fallback" aria-hidden="true">
                          <img
                            src="/brand/logo.svg"
                            alt=""
                            width={40}
                            height={40}
                          />
                        </span>
                      )}
                      <span>
                        <strong>{post.title}</strong>
                        {post.date ? (
                          <time dateTime={post.date}>{post.date}</time>
                        ) : null}
                      </span>
                    </a>
                  ))}
                </div>
              ) : null}
            </>
          )}
        </div>
      </section>

      {/* 8. 예약 — butterfly RIGHT of CTA; no inquiry form */}
      <section className="section section--sand home-booking" id="contact" data-reveal>
        <div className="container home-booking__layout">
          <div className="home-booking__main">
            <p className="section__eyebrow">{homeCopy.booking.eyebrow}</p>
            <h2 className="section__title">{homeCopy.booking.title}</h2>
            <p className="section__lead">{homeCopy.booking.body}</p>

            <div className="home-booking__cta-row">
              <div className="home-booking__primary">
                <div className="home-booking__actions">
                  <BookingCta label={homeCopy.booking.primaryCta} />
                  <a className="home-booking__phone" href={`tel:${SITE.phoneTel}`}>
                    <Image
                      src="/icons/contact-phone.svg"
                      alt=""
                      width={20}
                      height={20}
                    />
                    <span>
                      {homeCopy.booking.phoneLabel}: {SITE.phoneDisplay}
                    </span>
                  </a>
                </div>
                <div className="home-booking__scene" aria-hidden="true">
                  <BookingScene />
                </div>
              </div>
              <p className="home-booking__contact-link">
                <Link className="text-link" href={homeCopy.booking.contactHref}>
                  {homeCopy.booking.contactLinkLabel}
                  <span aria-hidden="true"> →</span>
                </Link>
              </p>
            </div>
          </div>

          <aside className="home-booking__visit" aria-label={homeCopy.booking.visitTitle}>
            <h3>{homeCopy.booking.visitTitle}</h3>
            <dl className="home-booking__facts">
              <div>
                <dt>주소</dt>
                <dd>
                  {SITE.address}
                  <span className="muted"> ({SITE.addressLandmark})</span>
                </dd>
              </div>
              <div>
                <dt>운영 시간</dt>
                <dd>{SITE.hours}</dd>
              </div>
              <div>
                <dt>전화</dt>
                <dd>
                  <a href={`tel:${SITE.phoneTel}`}>{SITE.phoneDisplay}</a>
                </dd>
              </div>
            </dl>
            <p>
              <Link className="text-link" href="/location">
                오시는 길 안내
                <span aria-hidden="true"> →</span>
              </Link>
            </p>
          </aside>
        </div>
      </section>
    </SiteShell>
  );
}
