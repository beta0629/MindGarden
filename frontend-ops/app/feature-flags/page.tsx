import { FeatureFlagCreateForm } from "@/components/feature-flags/FeatureFlagCreateForm";
import { FeatureFlagTable } from "@/components/feature-flags/FeatureFlagTable";
import { fetchFeatureFlags } from "@/services/featureFlagService";

export default async function FeatureFlagsPage() {
  const featureFlags = await fetchFeatureFlags();

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

