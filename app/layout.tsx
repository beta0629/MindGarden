import type { Metadata, Viewport } from 'next';
import { buildMetadata, localBusinessJsonLd } from '@/lib/seo';
import { SITE } from '@/lib/site';
import './pretendard-critical.css';
import './globals.css';

const baseMetadata = buildMetadata({
  title: SITE.name,
  description:
    '아이부터 어른까지, 마음과 관계를 함께 살펴보는 심리상담센터. 인천 연수구 마인드가든.',
  path: '/',
});

export const metadata: Metadata = {
  ...baseMetadata,
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon.png', type: 'image/png', sizes: '32x32' },
      { url: '/brand/logo.svg', type: 'image/svg+xml' },
    ],
    apple: [{ url: '/brand/apple-touch-icon.png', sizes: '180x180' }],
  },
  openGraph: {
    ...baseMetadata.openGraph,
    images: [
      {
        url: '/brand/og-default.png',
        width: 1200,
        height: 630,
        alt: SITE.name,
      },
    ],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#F5F0E6',
};

/** Latin + frequent Hangul — preload keeps CLS down (font-display:swap). */
const PRELOAD_FONT_SLICES = [91, 90] as const;

const HERO_POSTER_SIZES = '(max-width: 1023px) 100vw, 60vw';
const HERO_POSTER_SRCSET_AVIF =
  '/assets/hero/hero-poster-640.avif 640w, /assets/hero/hero-poster-1080.avif 1080w, /assets/hero/hero-poster-1620.avif 1620w';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = localBusinessJsonLd();
  return (
    <html lang="ko">
      <head>
        {/* LCP candidate first — before font preloads — under LH mobile simulate. */}
        <link
          rel="preload"
          as="image"
          href="/assets/hero/hero-poster-640.avif"
          {...({
            imageSrcSet: HERO_POSTER_SRCSET_AVIF,
            imageSizes: HERO_POSTER_SIZES,
          } as React.LinkHTMLAttributes<HTMLLinkElement>)}
          fetchPriority="high"
        />
        {PRELOAD_FONT_SLICES.map((slice) => (
          <link
            key={slice}
            rel="preload"
            as="font"
            type="font/woff2"
            href={`/fonts/pretendard/PretendardVariable.subset.${slice}.woff2`}
            crossOrigin="anonymous"
            fetchPriority="low"
          />
        ))}
        {/* Remaining unicode-range faces — print→all so parse/download stay off LCP. */}
        <link
          rel="stylesheet"
          href="/fonts/pretendard-rest.css"
          media="print"
          // Applied immediately after parse via the classic script below.
          data-mg-font-rest=""
        />
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){function go(){var l=document.querySelector('link[data-mg-font-rest]');if(l)l.media='all';}if(document.readyState==='complete')go();else window.addEventListener('load',go);})();",
          }}
        />
        <noscript>
          <link rel="stylesheet" href="/fonts/pretendard-rest.css" />
        </noscript>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
