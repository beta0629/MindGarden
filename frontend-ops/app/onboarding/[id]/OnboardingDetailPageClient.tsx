"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

import { OnboardingDecisionForm } from "@/components/onboarding/OnboardingDecisionForm";
import ChecklistDisplay from "@/components/onboarding/ChecklistDisplay";
import { fetchOnboardingDetail } from "@/services/onboardingService";
import { OnboardingRequest } from "@/types/onboarding";

export function OnboardingDetailPageClient() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [detail, setDetail] = useState<OnboardingRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDetail = async () => {
      try {
        setLoading(true);
        setError(null);
        const fetchedDetail = await fetchOnboardingDetail(id);
        if (!fetchedDetail || (fetchedDetail.id === null && fetchedDetail.id === undefined)) {
          router.push("/onboarding");
          return;
        }
        setDetail(fetchedDetail);
      } catch (err) {
        console.error(`온보딩 상세 페이지 오류 (id: ${id}):`, err);
        const errorMessage = err instanceof Error ? err.message : "데이터 로드 중 오류가 발생했습니다.";
        setError(errorMessage);
        
        // 404, 403 오류 처리
        if (err instanceof Error) {
          if ((err as any).status === 404 || err.message.includes("404") || err.message.includes("찾을 수 없습니다")) {
            router.push("/onboarding");
            return;
          }
          if ((err as any).status === 403 || err.message.includes("403") || err.message.includes("권한")) {
            setError(err.message || "접근 권한이 없습니다.");
          }
        }
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadDetail();
    } else {
      setError("온보딩 요청 ID가 없습니다.");
      setLoading(false);
    }
  }, [id, router]);

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
          <Link className="ghost-button" href="/onboarding">
            목록으로 돌아가기
          </Link>
        </div>
      </section>
    );
  }

  if (!detail) {
    return (
      <section className="panel">
        <header className="panel__header">
          <h1>데이터 없음</h1>
        </header>
        <div className="error-message">
          <p>데이터를 찾을 수 없습니다.</p>
          <Link className="ghost-button" href="/onboarding">
            목록으로 돌아가기
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="panel">
      <header className="panel__header">
        <h1>온보딩 요청 상세</h1>
        <p>요청 ID: {String(detail.id)}</p>
      </header>

      <div className="onboarding-detail">
        <div className="onboarding-detail__section">
          <h2>기본 정보</h2>
          <dl>
            <dt>회사명</dt>
            <dd>{detail.companyName || "N/A"}</dd>
            <dt>대표자명</dt>
            <dd>{detail.representativeName || "N/A"}</dd>
            <dt>이메일</dt>
            <dd>{detail.email || "N/A"}</dd>
            <dt>전화번호</dt>
            <dd>{detail.phoneNumber || "N/A"}</dd>
            <dt>업종</dt>
            <dd>{detail.businessType || "N/A"}</dd>
            <dt>상태</dt>
            <dd>
              <span className={`status-badge status-badge--${detail.status?.toLowerCase()}`}>
                {detail.status || "N/A"}
              </span>
            </dd>
          </dl>
        </div>

        {detail.requestedPlanId && (
          <div className="onboarding-detail__section">
            <h2>요청 요금제</h2>
            <p>요금제 ID: {detail.requestedPlanId}</p>
          </div>
        )}

        {detail.checklist && detail.checklist.length > 0 && (
          <div className="onboarding-detail__section">
            <h2>체크리스트</h2>
            <ChecklistDisplay checklist={detail.checklist} />
          </div>
        )}

        <div className="onboarding-detail__section">
          <h2>관리</h2>
          <OnboardingDecisionForm
            requestId={String(detail.id)}
            initialStatus={detail.status}
          />
        </div>
      </div>
    </section>
  );
}

