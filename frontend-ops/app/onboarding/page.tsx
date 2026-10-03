"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { fetchAllOnboarding } from "@/services/onboardingService";
import { OnboardingRequest } from "@/types/onboarding";
import { OnboardingStatus } from "@/types/shared";
import { ONBOARDING_MESSAGES, ONBOARDING_PATHS, type OnboardingListFilter } from "@/constants/onboarding";
import { isOnboardingListFilter } from "@/utils/onboardingUtils";
import OnboardingCardList from "@/components/onboarding/OnboardingCardList";

function OnboardingPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const statusParam = searchParams?.get("status");
  const statusFilter = isOnboardingListFilter(statusParam) && statusParam !== "ALL"
    ? (statusParam as OnboardingStatus)
    : undefined;

  const [allRequests, setAllRequests] = useState<OnboardingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await fetchAllOnboarding();
        setAllRequests(Array.isArray(result) ? result : []);
      } catch (err) {
        console.error("온보딩 페이지 데이터 로드 실패:", err);
        setError(err instanceof Error ? err.message : ONBOARDING_MESSAGES.ERROR_BODY);
        setAllRequests([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const applyFilter = (filter: OnboardingListFilter) => {
    if (filter === "ALL") {
      router.replace(ONBOARDING_PATHS.LIST);
      return;
    }
    router.replace(`${ONBOARDING_PATHS.LIST}?status=${encodeURIComponent(filter)}`);
  };

  return (
    <section className="ops-onboarding" aria-labelledby="ops-onboarding-title">
      <p className="ops-onboarding__crumb">{ONBOARDING_MESSAGES.SECTION}</p>
      <h1 id="ops-onboarding-title" className="ops-onboarding__title">
        {ONBOARDING_MESSAGES.PAGE_TITLE}
      </h1>
      <p className="ops-onboarding__sub">{ONBOARDING_MESSAGES.PAGE_DESCRIPTION}</p>
      {loading ? (
        <p className="ops-onboarding__status">{ONBOARDING_MESSAGES.LOADING_BODY}</p>
      ) : error ? (
        <p className="ops-onboarding__status" role="alert">{error}</p>
      ) : (
        <OnboardingCardList
          requests={allRequests}
          statusFilter={statusFilter}
          onFilter={applyFilter}
        />
      )}
    </section>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense
      fallback={
        <section className="ops-onboarding">
          <p className="ops-onboarding__status">{ONBOARDING_MESSAGES.LOADING_BODY}</p>
        </section>
      }
    >
      <OnboardingPageContent />
    </Suspense>
  );
}
