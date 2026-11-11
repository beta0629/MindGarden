import Image from 'next/image';
import Link from 'next/link';
import { InquiryForm } from '@/components/inquiry/InquiryForm';
import { SiteShell } from '@/components/layout/SiteShell';
import { BookingCta } from '@/components/ui/BookingCta';
import { ConfirmNeeded } from '@/components/ui/ConfirmNeeded';
import { contactCopy } from '@/lib/content/subpages';
import { buildMetadata } from '@/lib/seo';
import { SITE } from '@/lib/site';

export const metadata = buildMetadata({
  title: '상담 문의',
  description: contactCopy.body,
  path: '/contact',
});

export default function ContactPage() {
  return (
    <SiteShell>
      <section className="container page-hero">
        <h1>
          {contactCopy.title}
          <ConfirmNeeded />
        </h1>
        <p>{contactCopy.body}</p>
        <BookingCta showHint />
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container booking-layout">
          <div className="stack-md">
            <div>
              <h2 className="section__title">전화·운영</h2>
              <p>
                <a href={`tel:${SITE.phoneTel}`}>{SITE.phoneDisplay}</a>
              </p>
              <p className="muted">{SITE.hours}</p>
            </div>
            <Image
              src="/images/contact-corner-c161-4x3.jpg"
              alt="센터 공간"
              width={900}
              height={675}
            />
            <div>
              <h2 className="section__title">오시는 길</h2>
              <p>
                {SITE.address}, {SITE.addressLandmark}
              </p>
              <Link className="text-link" href="/location">
                지도 보기 →
              </Link>
            </div>
          </div>
          <div>
            <h2 className="section__title">문의 폼</h2>
            <InquiryForm />
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
