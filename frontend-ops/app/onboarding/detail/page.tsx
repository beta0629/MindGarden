"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

import { OnboardingDecisionForm } from "@/components/onboarding/OnboardingDecisionForm";
import { fetchOnboardingDetail } from "@/services/onboardingService";
import { OnboardingRequest } from "@/types/onboarding";
import { ONBOARDING_MESSAGES, ONBOARDING_PATHS } from "@/constants/onboarding";
import { buildOnboardingFacts, getStatusLabel } from "@/utils/onboardingUtils";
import { formatOnboardingDate } from "@/utils/dateUtils";

function OnboardingDetailPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = searchParams?.get("id");

  const [detail, setDetail] = useState<OnboardingRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDetail = async () => {
      if (!id) {
        setError(ONBOARDING_MESSAGES.MISSING_ID);
        setLoading(false);
        router.push(ONBOARDING_PATHS.LIST);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const data = await fetchOnboardingDetail(id);

        if (!data || (data.id === null && data.id === undefined)) {
          setError(ONBOARDING_MESSAGES.NOT_FOUND);
          setLoading(false);
          return;
        }

        setDetail(data);
      } catch (err) {
        console.error(`온보딩 상세 페이지 오류 (id: ${id}):`, err);

        if (err instanceof Error) {
          if ((err as { status?: number }).status === 404 || err.message.includes("404") || err.message.includes("찾을 수 없습니다")) {
            setError(ONBOARDING_MESSAGES.NOT_FOUND);
            router.push(ONBOARDING_PATHS.LIST);
            return;
          }
          if ((err as { status?: number }).status === 403 || err.message.includes("403") || err.message.includes("권한")) {
            setError(err.message || ONBOARDING_MESSAGES.ERROR_BODY);
          } else {
            setError(err.message || ONBOARDING_MESSAGES.ERROR_BODY);
          }
        } else {
          setError(ONBOARDING_MESSAGES.ERROR_BODY);
        }
      } finally {
        setLoading(false);
      }
    };

    loadDetail();
  }, [id, router]);

  if (loading) {
    return (
      <section className="ops-onboarding">
        <p className="ops-onboarding__status">{ONBOARDING_MESSAGES.LOADING_BODY}</p>
      </section>
    );
  }

  if (error || !detail) {
    return (
      <section className="ops-onboarding">
        <p className="ops-onboarding__status" role="alert">
          {error || ONBOARDING_MESSAGES.NOT_FOUND}
        </p>
        <Link href={ONBOARDING_PATHS.LIST}>{ONBOARDING_MESSAGES.BACK_TO_LIST}</Link>
      </section>
    );
  }

  const facts = buildOnboardingFacts(detail);

  return (
    <section className="ops-onboarding" aria-labelledby="ops-onboarding-detail-title">
      <p className="ops-onboarding__crumb">
        {ONBOARDING_MESSAGES.SECTION}
        {ONBOARDING_MESSAGES.META_SEPARATOR}
        {ONBOARDING_MESSAGES.PAGE_TITLE}
      </p>
      <h1 id="ops-onboarding-detail-title" className="ops-onboarding__title">
        {detail.tenantName || ONBOARDING_MESSAGES.EMPTY_VALUE}
      </h1>
      <p className="ops-onboarding__sub">
        {getStatusLabel(detail.status)}
        {ONBOARDING_MESSAGES.META_SEPARATOR}
        {formatOnboardingDate(detail.createdAt)}
      </p>
      <div className="ops-onboarding__split">
        <dl className="ops-onboarding__facts">
          {facts.map((fact) => (
            <div key={fact.id} className="ops-onboarding__fact">
              <dt>{fact.label}</dt>
              <dd>
                {fact.emphasize ? (
                  <span className="ops-onboarding__risk--high">{fact.value}</span>
                ) : (
                  fact.value
                )}
              </dd>
            </div>
          ))}
        </dl>
        <OnboardingDecisionForm
          requestId={String(detail.id)}
          initialStatus={detail.status}
          onDecided={(updated) => setDetail(updated)}
        />
      </div>
    </section>
  );
}

export default function OnboardingDetailPage() {
  return (
    <Suspense
      fallback={
        <section className="ops-onboarding">
          <p className="ops-onboarding__status">{ONBOARDING_MESSAGES.LOADING_BODY}</p>
        </section>
      }
    >
      <OnboardingDetailPageContent />
    </Suspense>
  );
}
