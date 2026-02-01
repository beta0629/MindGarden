import type { Metadata } from 'next';
import './globals.css';
import PopupBannerProvider from '@/components/PopupBannerProvider';

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
      <body>
        <PopupBannerProvider />
        {children}
      </body>
    </html>
  );
}

