import type { Metadata } from "next";
import "./globals.css";
// TossPaymentsScript 제거 - npm 패키지(@tosspayments/tosspayments-sdk)를 사용하여 동적으로 로드

export const metadata: Metadata = {
  title: "Trinity - CoreSolution | 소상공인을 위한 통합 솔루션",
  description: "Trinity의 CoreSolution은 소상공인이 필요한 시스템을 저비용으로 활용할 수 있도록 제공하는 통합 플랫폼입니다. 대기업 수준의 ERP 시스템을 저렴한 비용으로 제공합니다.",
  keywords: "소상공인, ERP, 통합 솔루션, CoreSolution, Trinity, 재무관리, 회계시스템, 정산시스템, 권한관리",
  authors: [{ name: "Trinity" }],
  creator: "Trinity",
  publisher: "Trinity",
  openGraph: {
    title: "Trinity - CoreSolution | 소상공인을 위한 통합 솔루션",
    description: "대기업 수준의 ERP 시스템을 저렴한 비용으로 제공하는 CoreSolution 플랫폼",
    type: "website",
    siteName: "Trinity - CoreSolution",
  },
  twitter: {
    card: "summary_large_image",
    title: "Trinity - CoreSolution",
    description: "소상공인을 위한 통합 솔루션",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="antialiased">
        {/* 토스페이먼츠 SDK는 npm 패키지(@tosspayments/tosspayments-sdk)를 통해 동적으로 로드됩니다 */}
        {children}
      </body>
    </html>
  );
}
