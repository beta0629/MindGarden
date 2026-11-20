import { HeroSection } from '@/components/home/HeroSection';
import { BenchScene, BookingScene, GateScene } from '@/components/home/v37';
import { SiteShell } from '@/components/layout/SiteShell';
import { BookingCta } from '@/components/ui/BookingCta';
import { BusinessHours } from '@/components/ui/BusinessHours';
import { YoutubeThumbPlay } from '@/components/ui/YoutubeThumbPlay';
import {
  clinicOsClient,
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
};

type PriceCardGuide = (typeof homeCopy.pricing.cards)[number];

/** Today in KST as YYYY-MM-DD (event window is defined in Korea time). */
function todayKst(): string {
  return new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Seoul' });
}

function isCardActive(guide: PriceCardGuide, today: string): boolean {
  if ('dateStart' in guide && today < guide.dateStart) return false;
  if ('dateEnd' in guide && today > guide.dateEnd) return false;
  return true;
}

/**
 * Display title/note always come from approved copy. Live Clinic-OS data may only
 * refine the amount, and only through an explicit skuCode mapping (never by name).
 */
function buildPriceCards(products: ConsultationProduct[]): PriceCardView[] {
  const today = todayKst();
  return homeCopy.pricing.cards
    .filter((guide) => isCardActive(guide, today))
    .map((guide) => {
      const live = products.find(
        (product) =>
          guide.skuCodes.includes(product.skuCode) &&
          !product.name.includes('치료'),
      );
      const view = live ? resolveProductDisplayPrice(live) : null;
      return {
        key: guide.key,
        title: guide.title,
        amount: view?.amount ?? guide.amount,
        note: guide.note,
        struckThrough: view?.struckThroughPrice ?? null,
      };
    });
}

const HAS_LIVE_PRICE_SKUS = homeCopy.pricing.cards.some(
  (card) => card.skuCodes.length > 0,
);

export default async function HomePage() {
  const [products, homepage, videos, posts] = await Promise.all([
    HAS_LIVE_PRICE_SKUS
      ? clinicOsClient.getConsultationProducts()
      : Promise.resolve<ConsultationProduct[]>([]),
    clinicOsClient.getHomepageContent(),
    getLatestVideos(4),
    getLatestBlogPosts(3),
  ]);

  const priceCards = buildPriceCards(products);

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
    <SiteShell noticeText={noticeBanner?.title ?? null} deferChrome>
      <HeroSection />

      {/* 1. 상담 분야 */}
      <section className="section home-areas" data-reveal>
        <div className="container home-areas__layout">
          <header className="home-areas__intro">
            <p className="section__eyebrow">{homeCopy.areas.eyebrow}</p>
            <h2 className="section__title">{homeCopy.areas.title}</h2>
            <p className="section__lead">{homeCopy.areas.lead}</p>
            <a className="text-link" href={homeCopy.areas.moreHref}>
              {homeCopy.areas.moreLabel}
              <span aria-hidden="true"> →</span>
            </a>
          </header>
          <div className="home-areas__grid" data-reveal-stagger>
            {homeCopy.areas.homeCards.map((card) => (
              <a
                key={card.title}
                className="home-area-card"
                href={card.href}
                data-reveal
              >
                <img src={card.icon} alt="" width={48} height={48} loading="lazy" decoding="async" />
                <h3>{card.title}</h3>
                <p>{card.line}</p>
              </a>
            ))}
            <a
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
            </a>
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
            <a className="text-link" href={homeCopy.spaces.moreHref}>
              {homeCopy.spaces.moreLabel}
              <span aria-hidden="true"> →</span>
            </a>
          </div>
          <div className="home-spaces__scene">
            <GateScene />
          </div>
          <div className="home-spaces__thumbs">
            {homeCopy.spaces.thumbs.map((thumb) => (
              <figure key={thumb.src} className="home-spaces__thumb">
                <img
                  src={thumb.src}
                  alt={thumb.caption}
                  width={480}
                  height={640}
                  loading="lazy"
                  decoding="async"
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
            </div>
          </header>
          <article className="home-expert-profile" data-reveal>
            <div className="home-expert-profile__media">
              <img
                src={homeCopy.experts.primary.photo}
                alt=""
                width={156}
                height={156}
                loading="lazy"
                decoding="async"
              />
            </div>
            <div className="home-expert-profile__body">
              <h3 className="home-expert-profile__name">
                {homeCopy.experts.primary.name}
              </h3>
              <p className="home-expert-profile__role">
                {homeCopy.experts.primary.role}
              </p>
              <p className="home-expert-profile__lead">
                {homeCopy.experts.lead}
              </p>
            </div>
          </article>
        </div>
      </section>

      {/* 4. Dark stats band — hidden until numbers are confirmed (homeCopy.stats.enabled) */}
      {homeCopy.stats.enabled ? (
        <section className="section home-stats" aria-label="센터 현황" data-reveal>
          <div className="container">
            <div className="home-stats__band">
              {homeCopy.stats.items.map((item) => (
                <div className="home-stats__item" key={item.label}>
                  <p className="home-stats__value">{item.value}</p>
                  <p className="home-stats__label">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* 5. 후기 / Bench */}
      <section
        className={`section home-reviews${
          homeReviews.length === 0 ? ' home-reviews--empty' : ''
        }`}
        data-reveal
      >
        <div className="container">
          <header className="home-reviews__header">
            <div>
              <p className="section__eyebrow">{homeCopy.reviews.eyebrow}</p>
              <h2 className="section__title">{homeCopy.reviews.title}</h2>
              {homeReviews.length > 0 ? (
                <a className="text-link" href={homeCopy.reviews.moreHref}>
                  {homeCopy.reviews.moreLabel}
                  <span aria-hidden="true"> →</span>
                </a>
              ) : null}
            </div>
            <div className="home-reviews__scene">
              <BenchScene />
            </div>
          </header>
          {homeReviews.length > 0 ? (
            <div className="home-reviews__grid" data-reveal-stagger>
              {homeReviews.map((review, index) => (
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
              ))}
            </div>
          ) : null}
        </div>
      </section>

      {/* 6. 비용 */}
      <section className="section section--sand home-pricing" data-reveal>
        <div className="container">
          <header className="home-section-head home-section-head--stack">
            <p className="section__eyebrow">{homeCopy.pricing.eyebrow}</p>
            <h2 className="section__title">{homeCopy.pricing.title}</h2>
          </header>
          <div
            className={`home-pricing__grid${
              priceCards.length < 4 ? ' home-pricing__grid--compact' : ''
            }`}
            data-reveal-stagger
          >
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
                {card.note ? (
                  <p className="home-price-card__note">{card.note}</p>
                ) : null}
              </article>
            ))}
          </div>
          <p className="home-pricing__more">
            <a className="text-link" href={homeCopy.pricing.moreHref}>
              {homeCopy.pricing.moreLabel}
              <span aria-hidden="true"> →</span>
            </a>
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
                {featuredReadings.map((item) =>
                  item.kind === 'video' && item.thumb ? (
                    <YoutubeThumbPlay
                      key={item.key}
                      variant="feature"
                      url={item.href}
                      title={item.title}
                      thumb={item.thumb}
                      reveal
                    />
                  ) : (
                    <a
                      key={item.key}
                      className={`home-reading-feature${
                        item.thumb ? '' : ' home-reading-feature--text'
                      }`}
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      data-reveal
                    >
                      {item.thumb ? (
                        <>
                          <span className="home-reading-feature__media">
                            <img
                              src={item.thumb}
                              alt=""
                              loading="lazy"
                              decoding="async"
                            />
                          </span>
                          <strong>{item.title}</strong>
                        </>
                      ) : (
                        <>
                          <span className="home-reading-feature__kind">
                            {item.kind === 'video' ? '영상' : '칼럼'}
                          </span>
                          <strong className="home-reading-feature__headline">
                            {item.title}
                          </strong>
                        </>
                      )}
                    </a>
                  ),
                )}
              </div>
              {listReadings.length > 0 ? (
                <div className="home-readings__list">
                  {listReadings.map((post) => (
                    <a
                      key={`list-${post.url}`}
                      className={`home-reading-row${
                        post.thumb ? '' : ' home-reading-row--text'
                      }`}
                      href={post.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {post.thumb ? (
                        <img
                          src={post.thumb}
                          alt=""
                          width={96}
                          height={72}
                          loading="lazy"
                          decoding="async"
                        />
                      ) : null}
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

      {/* 8. 예약 — butterfly scene sits after all text (DOM + mobile order); no inquiry form */}
      <section className="section section--sand home-booking" id="contact" data-reveal>
        <div className="container home-booking__layout">
          <div className="home-booking__main">
            <p className="section__eyebrow">{homeCopy.booking.eyebrow}</p>
            <h2 className="section__title">{homeCopy.booking.title}</h2>
            <p className="section__lead">{homeCopy.booking.body}</p>

            <div className="home-booking__actions">
              <BookingCta label={homeCopy.booking.primaryCta} />
              <a className="home-booking__phone" href={`tel:${SITE.phoneTel}`}>
                <img
                  src="/icons/contact-phone.svg"
                  alt=""
                  width={20}
                  height={20}
                  decoding="async"
                  loading="lazy"
                  fetchPriority="low"
                />
                <span>
                  {homeCopy.booking.phoneLabel}: {SITE.phoneDisplay}
                </span>
              </a>
              <p className="home-booking__contact-link">
                <a className="text-link" href={homeCopy.booking.contactHref}>
                  {homeCopy.booking.contactLinkLabel}
                  <span aria-hidden="true"> →</span>
                </a>
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
                <dd>
                  <BusinessHours layout="stack" />
                </dd>
              </div>
            </dl>
            <p>
              <a className="text-link" href="/location">
                오시는 길 안내
                <span aria-hidden="true"> →</span>
              </a>
            </p>
          </aside>

          <div className="home-booking__scene" aria-hidden="true">
            <BookingScene />
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
