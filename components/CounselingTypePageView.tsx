import { Fragment } from 'react';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import type { CounselingPageData, CounselingSlug } from '@/lib/counseling-type-pages';
import {
  COUNSELING_TYPE_IMAGE_PLAN,
  counselingTypeImageSrc,
} from '@/lib/counseling-type-page-images';
import ValuesSectionVisual from '@/components/ValuesSectionVisual';
import CounselingNotebookBlocks from '@/components/CounselingNotebookBlocks';

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
              <ValuesSectionVisual
                variant="hero"
                image={{
                  src: counselingTypeImageSrc(data.slug, plan.hero.file, plan.hero.remoteSrc),
                  alt: plan.hero.alt,
                  width: 1600,
                  height: 900,
                }}
                priority
              />
            )}

            <div className="counseling-type-stack">
              {data.sections.map((section) => {
                const slot = plan?.beforeSection.find((s) => s.sectionId === section.id);
                const variant = section.variant || 'split';

                return (
                  <Fragment key={section.id}>
                    {slot && (
                      <ValuesSectionVisual
                        variant={variant}
                        image={{
                          src: counselingTypeImageSrc(data.slug, slot.file, slot.remoteSrc),
                          alt: slot.alt,
                          width: 1600,
                          height: 1067,
                        }}
                      />
                    )}
                    <article
                      id={section.id}
                      className={
                        section.notebookBlocks && section.notebookBlocks.length > 0
                          ? 'counseling-type-card counseling-type-card--notebook value-section-card'
                          : 'counseling-type-card value-section-card'
                      }
                    >
                      <h2 className="counseling-type-card-title">{section.title}</h2>
                      <div className="counseling-type-card-body">
                        {section.notebookBlocks && section.notebookBlocks.length > 0 ? (
                          <CounselingNotebookBlocks blocks={section.notebookBlocks} />
                        ) : (
                          section.paragraphs.map((p, i) => (
                            <p key={i}>{p}</p>
                          ))
                        )}
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
          </section>
        </div>
      </div>

      <Footer />
    </main>
  );
}
