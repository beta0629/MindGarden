import type { Metadata, Viewport } from 'next';
import { buildMetadata, localBusinessJsonLd } from '@/lib/seo';
import { SITE } from '@/lib/site';
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = localBusinessJsonLd();
  return (
    <html lang="ko">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
