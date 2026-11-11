import Image from 'next/image';
import Link from 'next/link';
import { SiteShell } from '@/components/layout/SiteShell';
import { BookingCta } from '@/components/ui/BookingCta';
import { ConfirmNeeded } from '@/components/ui/ConfirmNeeded';
import { galleryCopy } from '@/lib/content/subpages';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: '센터 공간',
  description: galleryCopy.lead,
  path: '/gallery',
});

export default function GalleryPage() {
  return (
    <SiteShell>
      <section className="container page-hero">
        <h1>
          {galleryCopy.title}
          <ConfirmNeeded />
        </h1>
        <p>{galleryCopy.lead}</p>
      </section>
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="media-grid">
            {galleryCopy.items.map((item) => (
              <figure key={item.src} className="space-card">
                <Image
                  src={item.src}
                  alt={item.caption}
                  width={800}
                  height={1066}
                  sizes="(max-width: 768px) 50vw, 33vw"
                />
                <figcaption>
                  {item.caption}
                  {item.confirmNeeded ? <ConfirmNeeded /> : null}
                </figcaption>
              </figure>
            ))}
          </div>
          <div style={{ marginTop: '2rem' }} className="stack-sm">
            <BookingCta />
            <Link className="text-link" href="/location">
              오시는 길 →
            </Link>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
