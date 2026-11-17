import Image from 'next/image';
import Link from 'next/link';
import { HeroSection } from '@/components/home/HeroSection';
import { BenchScene, BookingScene, GateScene } from '@/components/home/v37';
import { InquiryForm } from '@/components/inquiry/InquiryForm';
import { SiteShell } from '@/components/layout/SiteShell';
import { BookingCta } from '@/components/ui/BookingCta';
import { ConfirmNeeded } from '@/components/ui/ConfirmNeeded';
import { DividerSprig } from '@/components/ui/DividerSprig';
import { EmptyState } from '@/components/ui/EmptyState';
import { FaqList } from '@/components/ui/FaqList';
import { MapLinkCard } from '@/components/ui/MapLinkCard';
import { ResponsiveImage } from '@/components/ui/ResponsiveImage';
import {
  clinicOsClient,
  getActiveEventProduct,
  resolveProductDisplayPrice,
} from '@/lib/clinic-os/client';
import { homeCopy } from '@/lib/content/home';
import { reviewsCopy } from '@/lib/content/subpages';
import { formatKstDateRange, formatWon } from '@/lib/format';
import { getLatestBlogPosts, getLatestVideos } from '@/lib/feeds';
import { buildMetadata } from '@/lib/seo';
import { SITE } from '@/lib/site';

export const revalidate = 300;

export const metadata = buildMetadata({
  title: SITE.name,
  description:
    '나를 소중히 돌보고 가꾸는 시간, 당신의 마음이 정원이 되는 곳. 인천 연수구 심리상담센터 마인드가든.',
  path: '/',
});

export default async function HomePage() {
  const [products, homepage, videos, posts] = await Promise.all([
    clinicOsClient.getConsultationProducts(),
    clinicOsClient.getHomepageContent(),
    getLatestVideos(3),
    getLatestBlogPosts(3),
  ]);

  const eventProduct = getActiveEventProduct(products);
  const eventPrice = eventProduct
    ? resolveProductDisplayPrice(eventProduct)
    : null;
  const homeReviews = homepage.reviews.slice(0, 3);
  const noticeBanner = homepage.banners.find((b) => {
    const title = b.title.trim();
    if (!title) return false;
    if (title === '공지 자리' || title.includes('배너 슬롯')) return false;
    return title.includes('공지');
  });

  return (
    <SiteShell noticeText={noticeBanner?.title ?? null}>
      <HeroSection />

      <section className="section" data-reveal>
        <div className="container">
          <div className="section__eyebrow">01</div>
          <h2 className="section__title">
            {homeCopy.areas.title}
            {homeCopy.areas.titleConfirmNeeded ? <ConfirmNeeded /> : null}
          </h2>
          <p className="section__lead">{homeCopy.areas.lead}</p>
          <div className="area-list" data-reveal-stagger>
            {homeCopy.areas.items.map((item) => (
              <Link
                key={item.slug}
                className="area-card"
                href={`/counseling/${item.slug}`}
                data-reveal
              >
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.line}</p>
                </div>
                <Image src={item.icon} alt="" width={96} height={96} />
              </Link>
            ))}
          </div>
        </div>
      </section>

      <DividerSprig />

      <section className="section section--sand" data-reveal>
        <div className="container">
          <div className="section__eyebrow">02</div>
          <h2 className="section__title">
            {homeCopy.process.title}
            {homeCopy.process.confirmNeeded ? <ConfirmNeeded /> : null}
          </h2>
          <div
            className="process-grid"
            style={{ marginTop: '1.5rem' }}
            data-reveal-stagger
          >
            {homeCopy.process.steps.map((step) => (
              <div className="process-item" key={step.title} data-reveal>
                <Image src={step.icon} alt="" width={72} height={72} />
                <h3>{step.title}</h3>
                <p>{step.line}</p>
              </div>
            ))}
          </div>
          <p style={{ marginTop: '1.25rem' }}>
            <Link className="text-link" href="/guide">
              {homeCopy.process.guideLinkLabel} →
            </Link>
          </p>
        </div>
      </section>

      <section className="section" data-reveal>
        <div className="container counselor counselor--text-only">
          <div>
            <div className="section__eyebrow">03</div>
            <h2 className="section__title">
              {homeCopy.counselor.title}
              {homeCopy.counselor.confirmNeeded ? <ConfirmNeeded /> : null}
            </h2>
            <h3 style={{ fontFamily: 'var(--font-sans)', fontSize: '1.5rem' }}>
              {homeCopy.counselor.name}
            </h3>
            <p className="muted">{homeCopy.counselor.role}</p>
            {homeCopy.counselor.lines.map((line) => (
              <p key={line}>{line}</p>
            ))}
            <Link className="btn btn--ghost" href="/counselors">
              자세히 보기 →
            </Link>
          </div>
        </div>
      </section>

      <DividerSprig />

      {eventProduct ? (
        <section className="section" style={{ paddingTop: 0 }}>
          <div className="container">
            <div className="event-banner">
              <div>
                <div className="section__eyebrow">이벤트</div>
                <h2 className="section__title" style={{ fontSize: '1.5rem' }}>
                  {eventProduct.name}{' '}
                  {eventPrice?.struckThroughPrice != null ? (
                    <s className="price-cell__struck">
                      {formatWon(eventPrice.struckThroughPrice)}
                    </s>
                  ) : null}{' '}
                  {eventPrice ? formatWon(eventPrice.amount) : null}
                </h2>
                {eventProduct.eventStartDate && eventProduct.eventEndDate ? (
                  <p className="muted">
                    {formatKstDateRange(
                      eventProduct.eventStartDate,
                      eventProduct.eventEndDate,
                    )}
                  </p>
                ) : null}
                <BookingCta />
              </div>
              <figure className="event-banner__media">
                <ResponsiveImage
                  baseName="banner-flowers-c64-3x2"
                  widths={[640, 1050]}
                  width={1050}
                  height={700}
                  alt="센터 로비 꽃"
                  sizes="(max-width: 768px) 100vw, min(42vw, 1050px)"
                  fallbackSrc="/images/banner-flowers-c64-3x2.jpg"
                />
              </figure>
            </div>
          </div>
        </section>
      ) : (
        <section className="section" style={{ paddingTop: 0 }}>
          <div className="container">
            <EmptyState
              kind="event"
              title="지금은 진행 중인 이벤트가 없습니다"
              body={homeCopy.booking.offEventLine}
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
              <Link className="text-link" href="/guide#pricing">
                이용 안내 →
              </Link>
            </EmptyState>
          </div>
        </section>
      )}

      <section className="section section--sand" data-reveal>
        <div className="container spaces-with-gate">
          <div className="spaces-with-gate__intro">
            <div>
              <div className="section__eyebrow">04</div>
              <h2 className="section__title">{homeCopy.spaces.title}</h2>
              <p className="section__lead">{homeCopy.spaces.lead}</p>
            </div>
            <Link className="text-link" href="/gallery">
              공간 더 보기 →
            </Link>
          </div>
          <div className="spaces-with-gate__stage">
            <div className="spaces-with-gate__thumbs">
              <div className="space-grid" data-reveal-stagger>
                {homeCopy.spaces.items.map((item) => {
                  const baseName = item.src
                    .replace('/images/', '')
                    .replace(/\.(jpg|jpeg|png|webp)$/i, '');
                  return (
                    <figure
                      key={item.caption + item.src}
                      className={`space-card ${item.wide ? 'space-card--wide' : ''}`}
                      data-reveal
                    >
                      <ResponsiveImage
                        baseName={baseName}
                        widths={[640, 1050]}
                        width={1050}
                        height={item.wide ? 591 : 788}
                        alt={item.caption}
                        sizes={
                          item.wide
                            ? '(max-width: 768px) 100vw, min(52vw, 640px)'
                            : '(max-width: 768px) 50vw, min(26vw, 480px)'
                        }
                        fallbackSrc={item.src}
                      />
                      <figcaption>
                        {item.caption}
                        {item.confirmNeeded ? <ConfirmNeeded /> : null}
                      </figcaption>
                    </figure>
                  );
                })}
              </div>
            </div>
            <div className="spaces-with-gate__scene">
              <GateScene />
            </div>
          </div>
        </div>
      </section>

      <DividerSprig />

      <section className="section" data-reveal>
        <div className="container reviews-with-bench">
          <div className="reviews-with-bench__header">
            <div>
              <div className="section__eyebrow">05</div>
              <h2 className="section__title">{reviewsCopy.title}</h2>
              <p className="section__lead">{reviewsCopy.lead}</p>
              <p style={{ marginTop: '0.75rem' }}>
                <Link className="text-link" href="/reviews">
                  이용 후기 더 보기 →
                </Link>
              </p>
            </div>
            <div className="reviews-with-bench__scene">
              <BenchScene />
            </div>
          </div>
          {homeReviews.length > 0 ? (
            <div className="reviews-home-grid" data-reveal-stagger>
              {homeReviews.map((review, index) => (
                <article
                  key={`${review.publishedAt}-${review.displayName ?? 'anon'}-${review.body.slice(0, 12)}`}
                  className={`reviews-home-card${
                    homeReviews.length >= 3 && index === 1
                      ? ' reviews-home-card--accent'
                      : ''
                  }`}
                  data-reveal
                >
                  <p style={{ marginBottom: '0.35rem' }}>{review.body}</p>
                  <p className="muted" style={{ margin: 0, fontSize: '0.875rem' }}>
                    {review.displayName || '익명'} ·{' '}
                    {review.publishedAt.slice(0, 10)}
                  </p>
                </article>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      <DividerSprig />

      <section className="section" data-reveal>
        <div className="container">
          <div className="section__eyebrow">06</div>
          <h2 className="section__title">{homeCopy.news.title}</h2>
          <p className="section__lead">{homeCopy.news.lead}</p>
          {videos.length === 0 && posts.length === 0 ? (
            <EmptyState
              kind="generic"
              title="표시할 소식이 없습니다"
              body="잠시 후 다시 확인해 주세요."
            />
          ) : (
            <div className="news-desktop">
              <div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '0.75rem',
                  }}
                >
                  <h3 style={{ fontFamily: 'var(--font-sans)', margin: 0 }}>
                    영상
                  </h3>
                  <a
                    className="text-link"
                    href={SITE.youtubeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    채널에서 더 보기
                  </a>
                </div>
                <div className="news-row">
                  {videos.map((video) => (
                    <a
                      key={video.id}
                      className="news-card"
                      href={video.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <div className="news-card__media">
                        <Image
                          src={video.thumb}
                          alt=""
                          fill
                          sizes="280px"
                          style={{ objectFit: 'cover' }}
                        />
                        <span className="news-card__play" aria-hidden="true">
                          ▶
                        </span>
                      </div>
                      <strong>{video.title}</strong>
                    </a>
                  ))}
                </div>
              </div>
              <div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '0.75rem',
                  }}
                >
                  <h3 style={{ fontFamily: 'var(--font-sans)', margin: 0 }}>
                    블로그
                  </h3>
                  <a
                    className="text-link"
                    href={SITE.blogUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    블로그 전체 보기
                  </a>
                </div>
                <div className="blog-list">
                  {posts.map((post) => (
                    <a
                      key={post.url}
                      className="blog-item"
                      href={post.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {post.thumb ? (
                        <Image
                          src={post.thumb}
                          alt=""
                          width={88}
                          height={66}
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
                      <div>
                        <strong>{post.title}</strong>
                        <time dateTime={post.date}>{post.date}</time>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="section section--sand" id="contact" data-reveal>
        <div className="container booking-layout">
          <div>
            <div className="section__eyebrow">07</div>
            <h2 className="section__title">{homeCopy.booking.title}</h2>
            <p>{homeCopy.booking.body}</p>
            <p className="muted">{homeCopy.booking.support}</p>
            <div className="booking-cta-with-scene">
              <div className="booking-cta-with-scene__scene">
                <BookingScene />
              </div>
              <div className="booking-cta-with-scene__cta">
                <BookingCta showHint />
              </div>
            </div>
            <p style={{ marginTop: '1rem' }}>{SITE.hours}</p>
            {eventProduct && eventPrice ? (
              <p>
                {eventProduct.name}{' '}
                {eventPrice.struckThroughPrice != null ? (
                  <s className="price-cell__struck">
                    {formatWon(eventPrice.struckThroughPrice)}
                  </s>
                ) : null}{' '}
                {formatWon(eventPrice.amount)}.
                {eventProduct.eventStartDate && eventProduct.eventEndDate
                  ? ` ${formatKstDateRange(
                      eventProduct.eventStartDate,
                      eventProduct.eventEndDate,
                    )}.`
                  : null}
              </p>
            ) : (
              <p>{homeCopy.booking.offEventLine}</p>
            )}
            <div style={{ marginTop: '1.5rem' }}>
              <h3 style={{ fontFamily: 'var(--font-sans)' }}>오시는 길</h3>
              <p>
                {SITE.address}, {SITE.addressLandmark}
              </p>
              <MapLinkCard />
              <p>
                <Link className="text-link" href="/location">
                  오시는 길 안내 →
                </Link>
                {' · '}
                <a href={`tel:${SITE.phoneTel}`}>{SITE.phoneDisplay}</a>
              </p>
            </div>
            <div style={{ marginTop: '1.5rem' }}>
              <h3 style={{ fontFamily: 'var(--font-sans)' }}>자주 묻는 질문</h3>
              <FaqList items={homeCopy.faqHome} />
              <p>
                <Link className="text-link" href="/faq">
                  질문 더 보기 →
                </Link>
              </p>
            </div>
          </div>
          <div>
            <h3 style={{ fontFamily: 'var(--font-sans)' }}>문의 폼</h3>
            <InquiryForm collapsedOnMobile />
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
