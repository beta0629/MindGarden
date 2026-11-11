import type { Metadata, Viewport } from 'next';
import { buildMetadata, localBusinessJsonLd } from '@/lib/seo';
import { SITE } from '@/lib/site';
import './globals.css';

export const metadata: Metadata = buildMetadata({
  title: SITE.name,
  description:
    '아이부터 어른까지, 마음과 관계를 함께 살펴보는 심리상담센터. 인천 연수구 마인드가든.',
  path: '/',
});

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
