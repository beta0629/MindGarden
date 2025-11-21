"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

import { OnboardingDecisionForm } from "@/components/onboarding/OnboardingDecisionForm";
import ChecklistDisplay from "@/components/onboarding/ChecklistDisplay";
import { fetchOnboardingDetail } from "@/services/onboardingService";
import { OnboardingRequest } from "@/types/onboarding";

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
        setError("ID가 없습니다.");
        setLoading(false);
        router.push("/onboarding");
        return;
      }

      try {
        setLoading(true);
        setError(null);
        console.log("[OnboardingDetailPage] 상세 페이지 로드:", { id });
        const data = await fetchOnboardingDetail(id);
        
        // 데이터가 없거나 필수 필드가 없는 경우
        if (!data || (data.id === null && data.id === undefined)) {
          console.warn(`온보딩 상세 데이터가 비어있습니다 (id: ${id})`);
          setError("데이터를 찾을 수 없습니다.");
          setLoading(false);
          return;
        }
        
        setDetail(data);
      } catch (err) {
        console.error(`온보딩 상세 페이지 오류 (id: ${id}):`, err);
        
        if (err instanceof Error) {
          // 404 Not Found 처리
          if ((err as any).status === 404 || err.message.includes("404") || err.message.includes("찾을 수 없습니다")) {
            setError("요청을 찾을 수 없습니다.");
            router.push("/onboarding");
            return;
          }
          // 403 Forbidden (권한 없음) 처리
          else if ((err as any).status === 403 || err.message.includes("403") || err.message.includes("권한")) {
            setError(err.message || "접근 권한이 없습니다.");
          } else {
            setError(err.message || "알 수 없는 오류가 발생했습니다.");
          }
        } else {
          setError("알 수 없는 오류가 발생했습니다.");
        }
      } finally {
        setLoading(false);
      }
    };

    loadDetail();
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
          <p>요청 정보를 찾을 수 없습니다.</p>
          <Link className="ghost-button" href="/onboarding">
            목록으로 돌아가기
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="panel">
      <header className="panel__header panel__header--split">
        <div>
          <h1>{detail.tenantName || "이름 없음"}</h1>
          <p>테넌트 ID: {detail.tenantId || "-"}</p>
        </div>
        <Link className="ghost-button" href="/onboarding">
          목록으로
        </Link>
      </header>

      <div className="detail-grid">
        <div className="detail-grid__section">
          <h2>요청 정보</h2>
          <dl className="detail-grid__list">
            <div>
              <dt>요청자</dt>
              <dd>{detail.requestedBy || "-"}</dd>
            </div>
            <div>
              <dt>리스크 레벨</dt>
              <dd>
                <span
                  className={`risk-badge risk-badge--${(detail.riskLevel || "LOW").toLowerCase()}`}
                >
                  {detail.riskLevel || "LOW"}
                </span>
              </dd>
            </div>
            <div>
              <dt>요청 시각</dt>
              <dd>{formatDate(detail.createdAt)}</dd>
            </div>
            <div>
              <dt>현재 상태</dt>
              <dd>
                <span className={`status-badge status-badge--${(detail.status || "PENDING").toLowerCase()}`}>
                  {detail.status || "PENDING"}
                </span>
              </dd>
            </div>
            {detail.decisionNote && (
              <div>
                <dt>결정 메모</dt>
                <dd>
                  <pre className="decision-note">{detail.decisionNote}</pre>
                </dd>
              </div>
            )}
          </dl>
        </div>
        <div className="detail-grid__section">
          <h2>체크리스트</h2>
          <ChecklistDisplay checklistJson={detail.checklistJson} />
        </div>
      </div>

      <OnboardingDecisionForm
        requestId={String(detail.id)}
        initialStatus={detail.status}
      />
    </section>
  );
}

function formatDate(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  return date.toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

export default function OnboardingDetailPage() {
  return (
    <Suspense fallback={
      <section className="panel">
        <header className="panel__header">
          <h1>로딩 중...</h1>
        </header>
        <div className="loading-message">
          <p>데이터를 불러오는 중입니다...</p>
        </div>
      </section>
    }>
      <OnboardingDetailPageContent />
    </Suspense>
  );
}
