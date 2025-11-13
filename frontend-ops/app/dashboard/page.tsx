import { fetchDashboardMetrics } from "@/services/dashboardService";

export default async function DashboardPage() {
  const metrics = await fetchDashboardMetrics();

  return (
    <section className="panel">
      <header className="panel__header">
        <h1>운영 대시보드</h1>
        <p>Phase 1 기반 KPI 스냅샷</p>
      </header>
      <div className="metric-grid">
        <MetricCard
          label="온보딩 대기"
          value={metrics.pendingOnboarding}
          description="승인 또는 심사 대기 중인 테넌트 수"
        />
        <MetricCard
          label="활성 요금제"
          value={metrics.activePlans}
          description="현재 사용 가능한 요금제"
        />
        <MetricCard
          label="활성 애드온"
          value={metrics.activeAddons}
          description="요금제에 연결 가능한 애드온"
        />
        <MetricCard
          label="활성 Feature Flag"
          value={metrics.activeFeatureFlags}
          description="실제 트래픽에 적용 중"
        />
        <MetricCard
          label="감사 로그 누적"
          value={metrics.totalAuditEvents}
          description="Ops 감사 이벤트 총계"
        />
      </div>
    </section>
  );
}

function MetricCard({
  label,
  value,
  description
}: {
  label: string;
  value: number;
  description: string;
}) {
  return (
    <article className="metric-card">
      <span className="metric-card__label">{label}</span>
      <strong className="metric-card__value">
        {value.toLocaleString("ko-KR")}
      </strong>
      <p className="metric-card__description">{description}</p>
    </article>
  );
}

