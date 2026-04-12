import type { Metadata } from 'next';
import './globals.css';
import PopupBannerProvider from '@/components/PopupBannerProvider';
import ConsultationBottomSheet from '@/components/ConsultationBottomSheet';

export const metadata: Metadata = {
  title: '마인드가든 심리상담센터',
  description: '마인드가든 심리상담센터와 함께, 새로운 희망이 시작되는 곳',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@300;400;600;700&display=swap"
          rel="stylesheet"
        />
        <link
          rel="stylesheet"
          crossOrigin="anonymous"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css"
        />
      </head>
      <body>
        <PopupBannerProvider />
        {children}
        <ConsultationBottomSheet />
      </body>
    </html>
  );
}

