"use client";

import { useEffect, useState } from "react";
import { FeatureFlagCreateForm } from "@/components/feature-flags/FeatureFlagCreateForm";
import { FeatureFlagTable } from "@/components/feature-flags/FeatureFlagTable";
import { fetchFeatureFlags } from "@/services/featureFlagService";
import { FeatureFlag } from "@/types/featureFlag";

export default function FeatureFlagsPage() {
  const [featureFlags, setFeatureFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchFeatureFlags();
        setFeatureFlags(data);
      } catch (err) {
        console.error("Feature Flag 데이터 로드 실패:", err);
        setError(err instanceof Error ? err.message : "데이터를 불러오는데 실패했습니다.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
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

  if (error) {
    return (
      <section className="panel">
        <header className="panel__header">
          <h1>오류 발생</h1>
        </header>
        <div className="error-message">
          <p>{error}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="panel">
      <header className="panel__header">
        <h1>Feature Flag 관리</h1>
        <p>운영 환경 배포 없이 기능 노출을 제어합니다.</p>
      </header>
      <FeatureFlagTable featureFlags={featureFlags} />
      <FeatureFlagCreateForm />
    </section>
  );
}
