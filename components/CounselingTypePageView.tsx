import { Fragment } from 'react';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import type { CounselingPageData, CounselingSlug } from '@/lib/counseling-type-pages';
import {
  COUNSELING_TYPE_IMAGE_PLAN,
  counselingTypeImageSrc,
} from '@/lib/counseling-type-page-images';

function CounselingTypePageImage({
  slug,
  file,
  alt,
  variant,
  priority,
}: {
  slug: string;
  file: string;
  alt: string;
  variant: 'hero' | 'section';
  priority?: boolean;
}) {
  const src = counselingTypeImageSrc(slug, file);
  const ratioClass =
    variant === 'hero' ? 'counseling-type-visual-frame--16-9' : 'counseling-type-visual-frame--3-2';

  return (
    <figure className={`counseling-type-visual counseling-type-visual--${variant}`}>
      <div className={`counseling-type-visual-frame ${ratioClass}`}>
        {/* eslint-disable-next-line @next/next/no-img-element -- HomeSectionVisual과 동일: 직접 로드 */}
        <img
          src={src}
          alt={alt}
          width={1600}
          height={variant === 'hero' ? 900 : 1067}
          className="counseling-type-visual-img"
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          fetchPriority={priority ? 'high' : undefined}
        />
      </div>
    </figure>
  );
}

export default function CounselingTypePageView({
  data,
}: {
  data: CounselingPageData;
}) {
  const plan = COUNSELING_TYPE_IMAGE_PLAN[data.slug as CounselingSlug];

  return (
    <main id="top">
      <Navigation />

      <div className="content-shell">
        <div className="content-main">
          <section className="content-section counseling-type-page">
            <header className="counseling-type-hero">
              <h1 className="counseling-type-h1">{data.h1}</h1>
              <p className="counseling-type-lead">{data.lead}</p>
            </header>

            {plan && (
              <CounselingTypePageImage
                slug={data.slug}
                file={plan.hero.file}
                alt={plan.hero.alt}
                variant="hero"
                priority
              />
            )}

            <div className="counseling-type-stack">
              {data.sections.map((section) => {
                const slot = plan?.beforeSection.find((s) => s.sectionId === section.id);

                return (
                  <Fragment key={section.id}>
                    {slot && (
                      <CounselingTypePageImage
                        slug={data.slug}
                        file={slot.file}
                        alt={slot.alt}
                        variant="section"
                      />
                    )}
                    <article
                      id={section.id}
                      className="counseling-type-card value-section-card"
                    >
                      <h2 className="counseling-type-card-title">{section.title}</h2>
                      <div className="counseling-type-card-body">
                        {section.paragraphs.map((p, i) => (
                          <p key={i}>{p}</p>
                        ))}
                        {section.internalLinks && section.internalLinks.length > 0 && (
                          <div className="counseling-type-links">
                            {section.internalLinks.map((l) => (
                              <Link key={l.href} href={l.href}>
                                {l.label}
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    </article>
                  </Fragment>
                );
              })}
            </div>

            <aside className="counseling-type-cta" aria-labelledby="counseling-cta-heading">
              <h2 id="counseling-cta-heading" className="counseling-type-cta-title">
                {data.ctaTitle}
              </h2>
              {data.ctaLines.map((line, i) => (
                <p key={i}>{line}</p>
              ))}
            </aside>
          </section>
        </div>
      </div>

      <Footer />
    </main>
  );
}
