import Link from "next/link";
import { notFound } from "next/navigation";

import { OnboardingDecisionForm } from "@/components/onboarding/OnboardingDecisionForm";
import ChecklistDisplay from "@/components/onboarding/ChecklistDisplay";
import { fetchOnboardingDetail } from "@/services/onboardingService";

interface Props {
  params: { id: string };
}

export default async function OnboardingDetailPage({ params }: Props) {
  try {
    console.log("[OnboardingDetailPage] 상세 페이지 로드:", { id: params.id });
    const detail = await fetchOnboardingDetail(params.id);
    
    // 데이터가 없거나 필수 필드가 없는 경우
    if (!detail || (detail.id === null && detail.id === undefined)) {
      console.warn(`온보딩 상세 데이터가 비어있습니다 (id: ${params.id})`);
      notFound();
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
          requestId={detail.id}
          initialStatus={detail.status}
        />
      </section>
    );
  } catch (error) {
    console.error(`온보딩 상세 페이지 오류 (id: ${params.id}):`, error);
    
    if (error instanceof Error) {
      // 404 Not Found 처리
      if ((error as any).status === 404 || error.message.includes("404") || error.message.includes("찾을 수 없습니다")) {
        notFound();
      }
      // 403 Forbidden (권한 없음) 처리
      if ((error as any).status === 403 || error.message.includes("403") || error.message.includes("권한")) {
        return (
          <section className="panel">
            <header className="panel__header">
              <h1>접근 권한 없음</h1>
            </header>
            <div className="error-message">
              <p>{error.message || "접근 권한이 없습니다."}</p>
              <Link className="ghost-button" href="/onboarding">
                목록으로 돌아가기
              </Link>
            </div>
          </section>
        );
      }
    }
    
    // 예상치 못한 오류인 경우 에러 페이지 표시
    return (
      <section className="panel">
        <header className="panel__header">
          <h1>오류 발생</h1>
        </header>
        <div className="error-message">
          <p>{error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다."}</p>
          <Link className="ghost-button" href="/onboarding">
            목록으로 돌아가기
          </Link>
        </div>
      </section>
    );
  }
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

