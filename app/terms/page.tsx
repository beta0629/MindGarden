import { SiteShell } from '@/components/layout/SiteShell';
import { ConfirmNeeded } from '@/components/ui/ConfirmNeeded';
import { legalPlaceholder } from '@/lib/content/subpages';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: '이용약관',
  description: '마인드가든심리상담센터 이용약관',
  path: '/terms',
});

export default function TermsPage() {
  return (
    <SiteShell>
      <section className="container page-hero">
        <h1>이용약관</h1>
      </section>
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container prose">
          <p>
            {legalPlaceholder}
            <ConfirmNeeded />
          </p>
        </div>
      </section>
    </SiteShell>
  );
}
