"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { fetchAllOnboarding } from "@/services/onboardingService";
import { OnboardingStatus } from "@/types/shared";
import { OnboardingRequest } from "@/types/onboarding";
import OnboardingPageHeader from "@/components/onboarding/OnboardingPageHeader";
import OnboardingTable from "@/components/onboarding/OnboardingTable";

export default function OnboardingPage() {
  const searchParams = useSearchParams();
  const statusFilter = (searchParams?.get("status") || undefined) as OnboardingStatus | undefined;
  
  const [allRequests, setAllRequests] = useState<OnboardingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await fetchAllOnboarding(statusFilter);
        // 배열인지 확인하고, 배열이 아니면 빈 배열로 처리
        setAllRequests(Array.isArray(result) ? result : []);
      } catch (err) {
        // 예상치 못한 오류인 경우에만 로깅하고 빈 배열 사용
        console.error("온보딩 페이지 데이터 로드 실패:", err);
        setError(err instanceof Error ? err.message : "데이터를 불러오는데 실패했습니다.");
        setAllRequests([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [statusFilter]);

  if (loading) {
    return (
      <section className="panel">
        <header className="panel__header">
          <h1>로딩 중...</h1>
        </header>
        <div className="loading-message">
          <p>데이터를 불러오는 중입니다...</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="panel">
        <header className="panel__header">
          <h1>오류 발생</h1>
        </header>
        <div className="error-message">
          <p>{error}</p>
        </div>
      </section>
    );
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
