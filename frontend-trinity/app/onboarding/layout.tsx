import { Suspense } from "react";

/**
 * 온보딩 페이지 레이아웃
 * useSearchParams를 사용하는 컴포넌트를 Suspense로 감싸기
 */
export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '18px',
        color: '#666'
      }}>
        페이지 로딩 중...
      </div>
    }>
      {children}
    </Suspense>
  );
}

