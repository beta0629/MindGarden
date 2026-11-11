import Image from 'next/image';
import Link from 'next/link';
import { SiteShell } from '@/components/layout/SiteShell';
import { BookingCta } from '@/components/ui/BookingCta';
import { ConfirmNeeded } from '@/components/ui/ConfirmNeeded';
import { homeCopy } from '@/lib/content/home';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: '상담 분야',
  description: homeCopy.areas.lead,
  path: '/counseling',
});

export default function CounselingIndexPage() {
  return (
    <SiteShell>
      <section className="container page-hero">
        <h1>
          상담 분야
          <ConfirmNeeded />
        </h1>
        <p>{homeCopy.areas.lead}</p>
      </section>
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container area-list">
          {homeCopy.areas.items.map((item) => (
            <Link
              key={item.slug}
              className="area-card"
              href={`/counseling/${item.slug}`}
            >
              <div>
                <h2 style={{ fontFamily: 'var(--font-sans)', fontSize: '1.2rem' }}>
                  {item.title}
                </h2>
                <p>{item.line}</p>
                <span className="text-link">자세히 보기 →</span>
              </div>
              <Image src={item.icon} alt="" width={96} height={96} />
            </Link>
          ))}
        </div>
        <div className="container" style={{ marginTop: '2rem' }}>
          <BookingCta />
        </div>
      </section>
    </SiteShell>
  );
}
