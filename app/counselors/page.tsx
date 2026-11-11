import Link from 'next/link';
import { SiteShell } from '@/components/layout/SiteShell';
import { BookingCta } from '@/components/ui/BookingCta';
import { ConfirmNeeded } from '@/components/ui/ConfirmNeeded';
import { PlaceholderMedia } from '@/components/ui/PlaceholderMedia';
import { counselorsCopy } from '@/lib/content/subpages';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: '상담사 소개',
  description: counselorsCopy.intro,
  path: '/counselors',
});

export default function CounselorsPage() {
  return (
    <SiteShell>
      <section className="container page-hero">
        <div className="counselor">
          <PlaceholderMedia label="김선희 대표원장 사진" aspectRatio="3 / 4" />
          <div>
            <h1>
              {counselorsCopy.title}
              <ConfirmNeeded />
            </h1>
            <h2 style={{ fontFamily: 'var(--font-sans)', fontSize: '1.75rem' }}>
              {counselorsCopy.name}
            </h2>
            <p className="muted">{counselorsCopy.role}</p>
            <p>{counselorsCopy.highlight}</p>
            <p>
              {counselorsCopy.educationLine}
              <ConfirmNeeded />
            </p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container prose stack-md">
          <p>{counselorsCopy.intro}</p>

          <div>
            <h2>
              학력
              <ConfirmNeeded />
            </h2>
            <p>{counselorsCopy.education}</p>
          </div>

          <div>
            <h2>전문자격</h2>
            <ul>
              {counselorsCopy.credentials.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>

          <div>
            <h2>강의 및 상담 경력</h2>
            <ul>
              {counselorsCopy.career.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>

          <div>
            <h2>교육 수료 및 이수</h2>
            <p>{counselorsCopy.training}</p>
          </div>

          <div>
            <h2>상담 분야 목록</h2>
            <p>{counselorsCopy.areas}</p>
            <p>
              <Link className="text-link" href="/counseling">
                상담 분야 보기 →
              </Link>
            </p>
          </div>

          <BookingCta showHint />
        </div>
      </section>
    </SiteShell>
  );
}
