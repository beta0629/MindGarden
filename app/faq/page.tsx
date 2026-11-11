import Image from 'next/image';
import Link from 'next/link';
import { SiteShell } from '@/components/layout/SiteShell';
import { BookingCta } from '@/components/ui/BookingCta';
import { FaqList } from '@/components/ui/FaqList';
import { faqItems } from '@/lib/content/subpages';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: '자주 묻는 질문',
  description: '예약·진행·비용에 대한 확인된 안내입니다.',
  path: '/faq',
});

export default function FaqPage() {
  return (
    <SiteShell>
      <section className="container page-hero">
        <h1>자주 묻는 질문</h1>
        <p className="muted">예약·진행·비용에 대한 확인된 안내입니다.</p>
        <Image
          src="/images/faq-flowers-c64-4x1.jpg"
          alt=""
          width={1440}
          height={360}
          sizes="100vw"
        />
      </section>
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container prose">
          <FaqList items={faqItems} />
          <p style={{ marginTop: '1.5rem' }}>
            <Link className="text-link" href="/guide">
              이용 안내
            </Link>
            {' · '}
            <Link className="text-link" href="/location">
              오시는 길
            </Link>
            {' · '}
            <Link className="text-link" href="/contact">
              문의
            </Link>
          </p>
          <BookingCta />
        </div>
      </section>
    </SiteShell>
  );
}
