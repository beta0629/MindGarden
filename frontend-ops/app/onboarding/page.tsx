import { fetchAllOnboarding } from "@/services/onboardingService";
import { OnboardingStatus } from "@/types/shared";
import { OnboardingRequest } from "@/types/onboarding";
import OnboardingPageHeader from "@/components/onboarding/OnboardingPageHeader";
import OnboardingTable from "@/components/onboarding/OnboardingTable";

interface OnboardingPageProps {
  searchParams: { status?: string };
}

export default async function OnboardingPage({ searchParams }: OnboardingPageProps) {
  const statusFilter = searchParams?.status as OnboardingStatus | undefined;
  
  // 상태 필터가 있으면 서버에서 필터링된 데이터 조회, 없으면 전체 조회
  // 404 오류 등은 fetchAllOnboarding 내부에서 처리되어 빈 배열 반환
  let allRequests: OnboardingRequest[] = [];
  
  try {
    const result = await fetchAllOnboarding(statusFilter);
    // 배열인지 확인하고, 배열이 아니면 빈 배열로 처리
    allRequests = Array.isArray(result) ? result : [];
  } catch (error) {
    // 예상치 못한 오류인 경우에만 로깅하고 빈 배열 사용
    console.error("온보딩 페이지 데이터 로드 실패:", error);
    allRequests = [];
  }

  return (
    <section className="panel">
      <OnboardingPageHeader 
        statusFilter={statusFilter} 
        requestCount={allRequests.length} 
      />
      <OnboardingTable 
        requests={allRequests} 
        statusFilter={statusFilter} 
      />
    </section>
  );
}

