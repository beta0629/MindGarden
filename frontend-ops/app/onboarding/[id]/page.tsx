import { OnboardingDetailPageClient } from "./OnboardingDetailPageClient";

// output: export 모드에서 동적 라우트를 사용하려면 generateStaticParams()가 필요
// 하지만 클라이언트 컴포넌트와 함께 사용할 수 없으므로 서버 컴포넌트 래퍼 사용
export async function generateStaticParams(): Promise<{ id: string }[]> {
  // 빈 배열 반환 - 실제 페이지는 클라이언트 사이드에서 동적으로 처리
  return [];
}

export default function OnboardingDetailPage() {
  return <OnboardingDetailPageClient />;
}
