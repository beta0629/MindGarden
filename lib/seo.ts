import type { Metadata } from 'next';
import { getSiteUrl, isSiteIndexable, SITE } from './site';

type PageSeo = {
  title: string;
  description: string;
  path?: string;
};

export function buildMetadata({
  title,
  description,
  path = '',
}: PageSeo): Metadata {
  const siteUrl = getSiteUrl();
  const url = `${siteUrl}${path}`;
  const fullTitle =
    title === SITE.name ? title : `${title} | ${SITE.shortName}`;

  return {
    title: fullTitle,
    description,
    alternates: { canonical: url },
    robots: isSiteIndexable()
      ? { index: true, follow: true }
      : { index: false, follow: false },
    openGraph: {
      type: 'website',
      locale: 'ko_KR',
      url,
      siteName: SITE.name,
      title: fullTitle,
      description,
      images: [
        {
          url: `${siteUrl}/brand/og-default.png`,
          width: 1200,
          height: 630,
          alt: SITE.name,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
    },
  };
}

export function localBusinessJsonLd() {
  const siteUrl = getSiteUrl();
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: SITE.name,
    image: `${siteUrl}/brand/logo.png`,
    url: siteUrl,
    telephone: SITE.phoneDisplay,
    address: {
      '@type': 'PostalAddress',
      streetAddress: '해돋이로120번길 23 아크리아2 2층 204호',
      addressLocality: '연수구',
      addressRegion: '인천',
      addressCountry: 'KR',
    },
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        opens: '10:00',
        closes: '20:00',
      },
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: 'Saturday',
        opens: '10:00',
        closes: '17:00',
      },
    ],
  };
}
