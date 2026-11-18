import { SiteShell } from '@/components/layout/SiteShell';
import { ConfirmNeeded } from '@/components/ui/ConfirmNeeded';
import { legalPlaceholder } from '@/lib/content/subpages';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: '개인정보처리방침',
  description: '마인드가든심리상담센터 개인정보처리방침',
  path: '/privacy',
});

export default function PrivacyPage() {
  return (
    <SiteShell>
      <section className="container page-hero">
        <h1>개인정보처리방침</h1>
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
