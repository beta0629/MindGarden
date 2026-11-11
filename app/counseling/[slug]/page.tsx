import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { SiteShell } from '@/components/layout/SiteShell';
import { BookingCta } from '@/components/ui/BookingCta';
import { ConfirmNeeded } from '@/components/ui/ConfirmNeeded';
import {
  counselingDetails,
  type CounselingSlug,
} from '@/lib/content/subpages';
import { buildMetadata } from '@/lib/seo';

const SLUGS = Object.keys(counselingDetails) as CounselingSlug[];

export function generateStaticParams() {
  return SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = counselingDetails[slug as CounselingSlug];
  if (!page) return {};
  return buildMetadata({
    title: page.title,
    description: page.body.slice(0, 120),
    path: `/counseling/${slug}`,
  });
}

export default async function CounselingDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = counselingDetails[slug as CounselingSlug];
  if (!page) notFound();

  return (
    <SiteShell>
      <section className="container page-hero">
        <div className="split" style={{ alignItems: 'center' }}>
          <Image src={page.icon} alt="" width={120} height={120} />
          <div>
            <h1>
              {page.title}
              <ConfirmNeeded />
            </h1>
            <p>{page.body}</p>
          </div>
        </div>
        <div style={{ marginTop: '1.5rem' }}>
          <Image
            src={page.image}
            alt=""
            width={1200}
            height={900}
            sizes="(max-width: 768px) 100vw, 720px"
          />
        </div>
      </section>

      <section className="section section--sand">
        <div className="container prose">
          <h2>이런 분께</h2>
          <p>{page.forWhom}</p>
          <h2>진행 안내</h2>
          <p>첫 상담은 1시간, 보통 회기는 50분입니다.</p>
          <p>
            <Link className="text-link" href="/guide">
              이용 안내 →
            </Link>
          </p>
          <p className="muted">
            이 안내는 교육 목적이며, 개인에 대한 의학적 판단을 의미하지 않습니다.
            센터는 의료기관이 아니며, 약물 처방은 의료진의 영역입니다.
          </p>
          <BookingCta showHint />
        </div>
      </section>
    </SiteShell>
  );
}
