"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchDashboardMetrics } from "@/services/dashboardService";
import { DashboardMetrics } from "@/types/dashboard";

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadMetrics = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchDashboardMetrics();
        setMetrics(data);
      } catch (err) {
        console.error("대시보드 메트릭 로드 실패:", err);
        setError(err instanceof Error ? err.message : "데이터를 불러오는데 실패했습니다.");
      } finally {
        setLoading(false);
      }
    };

    loadMetrics();
  }, []);

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

  if (error || !metrics) {
    return (
      <section className="panel">
        <header className="panel__header">
          <h1>오류 발생</h1>
        </header>
        <div className="error-message">
          <p>{error || "데이터를 불러올 수 없습니다."}</p>
        </div>
      </section>
    );
  }

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
          href="/onboarding?status=PENDING"
        />
        <MetricCard
          label="활성 온보딩"
          value={metrics.activeOnboarding}
          description="승인되어 활성화된 테넌트 수"
          href="/onboarding?status=APPROVED"
        />
        {metrics.onHoldOnboarding > 0 && (
          <MetricCard
            label="보류 중 온보딩"
            value={metrics.onHoldOnboarding}
            description="자동 승인 시도했으나 프로시저 실패로 보류된 테넌트 수"
            href="/onboarding?status=ON_HOLD"
          />
        )}
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
  description,
  href
}: {
  label: string;
  value: number;
  description: string;
  href?: string;
}) {
  const cardContent = (
    <>
      <span className="metric-card__label">{label}</span>
      <strong className="metric-card__value">
        {value.toLocaleString("ko-KR")}
      </strong>
      <p className="metric-card__description">{description}</p>
    </>
  );

  if (href) {
    return (
      <Link href={href} className="metric-card metric-card--clickable">
        {cardContent}
      </Link>
    );
  }

  return (
    <article className="metric-card">
      {cardContent}
    </article>
  );
}
