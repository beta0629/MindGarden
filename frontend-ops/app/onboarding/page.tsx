"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { fetchAllOnboarding } from "@/services/onboardingService";
import { OnboardingRequest } from "@/types/onboarding";
import { OnboardingStatus } from "@/types/shared";
import { ONBOARDING_MESSAGES, ONBOARDING_PATHS, type OnboardingListFilter } from "@/constants/onboarding";
import { isOnboardingListFilter } from "@/utils/onboardingUtils";
import { onboardingListCache } from "@/utils/onboardingListCache";
import OnboardingCardList from "@/components/onboarding/OnboardingCardList";

function OnboardingPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const statusParam = searchParams?.get("status");
  const statusFilter = isOnboardingListFilter(statusParam) && statusParam !== "ALL"
    ? (statusParam as OnboardingStatus)
    : undefined;

  const cachedRequests = onboardingListCache.read();
  const [allRequests, setAllRequests] = useState<OnboardingRequest[]>(cachedRequests ?? []);
  const [loading, setLoading] = useState(cachedRequests === null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const unsubscribe = onboardingListCache.subscribe((rows) => {
      if (!active) {
        return;
      }
      setAllRequests(rows);
      setError(null);
      setLoading(false);
    });

    const loadData = async () => {
      const hasCache = onboardingListCache.read() !== null;
      if (!hasCache) {
        setLoading(true);
      }
      setError(null);
      try {
        const result = await fetchAllOnboarding();
        if (!active) {
          return;
        }
        const rows = Array.isArray(result) ? result : [];
        onboardingListCache.publish(rows);
      } catch (err) {
        if (!active) {
          return;
        }
        console.error("온보딩 페이지 데이터 로드 실패:", err);
        if (onboardingListCache.read() === null) {
          setError(err instanceof Error ? err.message : ONBOARDING_MESSAGES.ERROR_BODY);
          setAllRequests([]);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void loadData();
    return () => {
      active = false;
      unsubscribe();
    };
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
