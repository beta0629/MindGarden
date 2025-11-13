import Link from "next/link";

import { fetchPendingOnboarding } from "@/services/onboardingService";

export default async function OnboardingPage() {
  const pendingRequests = await fetchPendingOnboarding();

  return (
    <section className="panel">
      <header className="panel__header">
        <h1>테넌트 온보딩 심사</h1>
        <p>승인 대기 중인 요청을 검토하고 상세 화면에서 결정을 진행하세요.</p>
      </header>

      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>테넌트</th>
              <th>요청자</th>
              <th>리스크</th>
              <th>요청 일시</th>
              <th>상태</th>
              <th>상세</th>
            </tr>
          </thead>
          <tbody>
            {pendingRequests.length === 0 ? (
              <tr>
                <td colSpan={6} className="data-table__empty">
                  현재 대기 중인 온보딩 요청이 없습니다.
                </td>
              </tr>
            ) : (
              pendingRequests.map((request) => (
                <tr key={request.id}>
                  <td>
                    <div className="table-primary">{request.tenantName}</div>
                    <div className="table-secondary">{request.tenantId}</div>
                  </td>
                  <td>{request.requestedBy}</td>
                  <td>
                    <RiskBadge level={request.riskLevel} />
                  </td>
                  <td>{formatDate(request.createdAt)}</td>
                  <td>{request.status}</td>
                  <td>
                    <Link
                      className="ghost-button"
                      href={`/onboarding/${request.id}`}
                    >
                      보기
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function RiskBadge({ level }: { level: "LOW" | "MEDIUM" | "HIGH" }) {
  const labelMap = {
    LOW: "LOW",
    MEDIUM: "MEDIUM",
    HIGH: "HIGH"
  } as const;
  return <span className={`risk-badge risk-badge--${level.toLowerCase()}`}>{labelMap[level]}</span>;
}

function formatDate(value?: string | null) {
  if (!value) {
    return "-";
  }
  const date = new Date(value);
  return date.toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

