import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '마인드 가든 | ADHD 전문 상담소',
  description: 'ADHD 전문 상담과 함께, 새로운 희망이 시작되는 곳',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}

