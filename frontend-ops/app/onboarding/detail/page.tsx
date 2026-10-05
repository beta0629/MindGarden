"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

import { OnboardingDecisionForm } from "@/components/onboarding/OnboardingDecisionForm";
import { fetchAllOnboarding, fetchOnboardingDetail } from "@/services/onboardingService";
import { OnboardingRequest } from "@/types/onboarding";
import { ONBOARDING_MESSAGES, ONBOARDING_PATHS } from "@/constants/onboarding";
import { KR_PUBLIC_DATA_COPY } from "@/content/krPublicData";
import { recheckBusinessRegistration, type BusinessLookupResult } from "@/services/krPublicDataApi";
import { buildOnboardingFacts, getStatusLabel, readOnboardingChecklist } from "@/utils/onboardingUtils";
import { formatOnboardingDate } from "@/utils/dateUtils";
import { onboardingListCache } from "@/utils/onboardingListCache";
import { applyRefreshedOnboardingViews } from "@/utils/onboardingViewRefresh";

function coreApiBaseConfigured(): boolean {
  if (typeof window !== "undefined" && (window as { __CORE_API_BASE_URL__?: string }).__CORE_API_BASE_URL__) {
    return true;
  }
  return Boolean(process.env.NEXT_PUBLIC_CORE_API_BASE_URL);
}

function merchantLegalFields(checklistJson?: string | null): {
  businessRegistrationNumber: string;
  openingDate: string;
  representativeName: string;
} | null {
  const checklist = readOnboardingChecklist(checklistJson);
  const raw = checklist.merchantLegal;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return null;
  }
  const legal = raw as Record<string, unknown>;
  const businessRegistrationNumber = typeof legal.businessRegistrationNumber === "string"
    ? legal.businessRegistrationNumber.trim()
    : "";
  const openingDate = typeof legal.openingDate === "string" ? legal.openingDate.trim() : "";
  const representativeName = typeof legal.representativeName === "string"
    ? legal.representativeName.trim()
    : "";
  if (!businessRegistrationNumber || !openingDate || !representativeName) {
    return null;
  }
  return { businessRegistrationNumber, openingDate, representativeName };
}

function OnboardingRecheck({ checklistJson }: { checklistJson?: string | null }) {
  const fields = merchantLegalFields(checklistJson);
  const [pending, setPending] = useState(false);
  const [live, setLive] = useState<BusinessLookupResult | null>(null);
  const [failed, setFailed] = useState(false);

  if (!coreApiBaseConfigured() || !fields) {
    return null;
  }

  const onRecheck = async () => {
    setPending(true);
    setFailed(false);
    try {
      const result = await recheckBusinessRegistration(fields);
      setLive(result);
    } catch {
      setFailed(true);
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="ops-onboarding__recheck">
      <p className="ops-onboarding__note">{KR_PUBLIC_DATA_COPY.PRIVACY_NOTICE}</p>
      <button type="button" className="ops-onboarding__primary" disabled={pending} onClick={onRecheck}>
        {KR_PUBLIC_DATA_COPY.RECHECK}
      </button>
      {failed ? (
        <p className="ops-onboarding__save-error" role="alert">
          {KR_PUBLIC_DATA_COPY.RECHECK_FAILED}
        </p>
      ) : null}
      {live ? (
        <dl className="ops-onboarding__facts">
          <div className="ops-onboarding__fact">
            <dt>{KR_PUBLIC_DATA_COPY.MATCH}</dt>
            <dd>{live.overallStatus || KR_PUBLIC_DATA_COPY.UNCONFIRMED}</dd>
          </div>
          <div className="ops-onboarding__fact">
            <dt>{KR_PUBLIC_DATA_COPY.STATUS}</dt>
            <dd>{live.businessStatus || KR_PUBLIC_DATA_COPY.UNCONFIRMED}</dd>
          </div>
          <div className="ops-onboarding__fact">
            <dt>{KR_PUBLIC_DATA_COPY.TAX}</dt>
            <dd>{live.taxType || KR_PUBLIC_DATA_COPY.UNCONFIRMED}</dd>
          </div>
          <div className="ops-onboarding__fact">
            <dt>{KR_PUBLIC_DATA_COPY.CHECKED_AT}</dt>
            <dd>{live.checkedAt || KR_PUBLIC_DATA_COPY.UNCONFIRMED}</dd>
          </div>
        </dl>
      ) : null}
    </div>
  );
}

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

  const refreshAfterDecision = useCallback(async () => {
    if (!id) {
      return;
    }
    await applyRefreshedOnboardingViews({
      fetchDetail: () => fetchOnboardingDetail(id),
      fetchList: () => fetchAllOnboarding(),
      detailFailureMessage: ONBOARDING_MESSAGES.ERROR_BODY,
      listFailureMessage: ONBOARDING_MESSAGES.ERROR_BODY,
      applyDetail: (next) => {
        setDetail(next);
        setError(null);
      },
      applyList: (rows) => {
        onboardingListCache.publish(rows);
      }
    });
  }, [id]);

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
        <div className="ops-onboarding__detail-side">
          <OnboardingRecheck checklistJson={detail.checklistJson} />
          <OnboardingDecisionForm
            requestId={String(detail.id)}
            initialStatus={detail.status}
            onDecided={(updated) => setDetail(updated)}
            onRefresh={refreshAfterDecision}
          />
        </div>
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
