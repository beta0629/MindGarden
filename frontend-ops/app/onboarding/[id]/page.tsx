import { OnboardingDetailPageClient } from "./OnboardingDetailPageClient";

// output: export 모드에서 동적 라우트를 사용하려면 generateStaticParams()가 필요
export async function generateStaticParams() {
  // 빈 배열 반환 - 실제 페이지는 클라이언트 사이드에서 동적으로 처리
  // output: export 모드에서는 모든 동적 경로를 미리 정의해야 하지만,
  // 실제로는 클라이언트 사이드 라우팅으로 처리
  return [];
}

export default function OnboardingDetailPage() {
  return <OnboardingDetailPageClient />;
}
