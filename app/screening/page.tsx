import Link from 'next/link';
import { SiteShell } from '@/components/layout/SiteShell';
import { BookingCta } from '@/components/ui/BookingCta';
import { ConfirmNeeded } from '@/components/ui/ConfirmNeeded';
import { screeningCopy } from '@/lib/content/subpages';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: '주제별 간이 점검',
  description: screeningCopy.lead,
  path: '/screening',
});

export default function ScreeningPage() {
  return (
    <SiteShell>
      <section className="container page-hero">
        <h1>
          {screeningCopy.title}
          <ConfirmNeeded />
        </h1>
        <p>{screeningCopy.lead}</p>
        <p
          style={{
            background: 'var(--sand)',
            padding: '1rem',
            border: '1px solid var(--line)',
          }}
        >
          {screeningCopy.disclaimer}
        </p>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container card-grid">
          {screeningCopy.topics.map((topic) => (
            <article key={topic.slug} className="area-card" style={{ display: 'block' }}>
              <h2 style={{ fontFamily: 'var(--font-sans)', fontSize: '1.1rem' }}>
                {topic.title}
                {screeningCopy.topicTitleConfirmNeeded ? <ConfirmNeeded /> : null}
              </h2>
              <p>{topic.desc}</p>
              <p className="muted" style={{ marginBottom: '0.75rem' }}>
                문항·결과 자리 (참고용, 진단명 단정 없음)
                <ConfirmNeeded />
              </p>
              <Link className="btn btn--ghost" href="/contact">
                문의하기
              </Link>
            </article>
          ))}
        </div>
        <div className="container" style={{ marginTop: '2rem' }}>
          <BookingCta showHint />
        </div>
      </section>
    </SiteShell>
  );
}
