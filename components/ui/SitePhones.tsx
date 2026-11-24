import { SITE } from '@/lib/site';

type SitePhonesProps = {
  /** Optional prefix, e.g. 「상담문의:」 from operating-rules 6-2. */
  label?: string;
};

/**
 * Public contact pair: landline + mobile, with tel links.
 * Wording follows 상담문의: 032-724-8501 / 010-4285-8570.
 */
export function SitePhones({ label }: SitePhonesProps) {
  return (
    <>
      {label ? `${label} ` : null}
      <a href={`tel:${SITE.phoneTel}`}>{SITE.phoneDisplay}</a>
      {' / '}
      <a href={`tel:${SITE.phoneMobileTel}`}>{SITE.phoneMobileDisplay}</a>
    </>
  );
}
