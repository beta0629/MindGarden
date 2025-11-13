import Link from "next/link";
import { notFound } from "next/navigation";

import { OnboardingDecisionForm } from "@/components/onboarding/OnboardingDecisionForm";
import { fetchOnboardingDetail } from "@/services/onboardingService";

interface Props {
  params: { id: string };
}

export default async function OnboardingDetailPage({ params }: Props) {
  try {
    const detail = await fetchOnboardingDetail(params.id);
    return (
      <section className="panel">
        <header className="panel__header panel__header--split">
          <div>
            <h1>{detail.tenantName}</h1>
            <p>테넌트 ID: {detail.tenantId}</p>
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
                <dd>{detail.requestedBy}</dd>
              </div>
              <div>
                <dt>리스크 레벨</dt>
                <dd>
                  <span
                    className={`risk-badge risk-badge--${detail.riskLevel.toLowerCase()}`}
                  >
                    {detail.riskLevel}
                  </span>
                </dd>
              </div>
              <div>
                <dt>요청 시각</dt>
                <dd>{formatDate(detail.createdAt)}</dd>
              </div>
              <div>
                <dt>현재 상태</dt>
                <dd>{detail.status}</dd>
              </div>
            </dl>
          </div>
          <div className="detail-grid__section">
            <h2>체크리스트</h2>
            <pre className="detail-grid__pre">
              {detail.checklistJson ?? "등록된 체크리스트가 없습니다."}
            </pre>
          </div>
        </div>

        <OnboardingDecisionForm
          requestId={detail.id}
          initialStatus={detail.status}
        />
      </section>
    );
  } catch (error) {
    if (error instanceof Error && error.message.includes("404")) {
      notFound();
    }
    throw error;
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

