/**
 * Feature Flag 카드 리스트 컴포넌트
 * 테이블 형태 대신 카드 형태로 표시
 */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleFeatureFlag } from "@/services/featureFlagClient";
import { FeatureFlag } from "@/types/featureFlag";
import { FeatureFlagState } from "@/types/shared";
import OpsCard from "@/components/ui/OpsCard";
import MGButton from "@/components/ui/MGButton";
import styles from "./FeatureFlagCardList.module.css";

interface FeatureFlagCardListProps {
  featureFlags: FeatureFlag[];
}

const STATE_OPTIONS: FeatureFlagState[] = ["DISABLED", "SHADOW", "ENABLED"];

export function FeatureFlagCardList({ featureFlags }: FeatureFlagCardListProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleToggle = (flagId: string, nextState: FeatureFlagState) => {
    setError(null);
    setUpdatingId(flagId);

    startTransition(async () => {
      try {
        await toggleFeatureFlag(flagId, nextState);
        router.refresh();
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Feature Flag 변경에 실패했습니다."
        );
      } finally {
        setUpdatingId(null);
      }
    });
  };

  function formatDate(value: string) {
    const date = new Date(value);
    return date.toLocaleString("ko-KR", {
      timeZone: "Asia/Seoul",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  if (featureFlags.length === 0) {
    return (
      <div className={styles.emptyMessage}>
        등록된 Feature Flag가 없습니다.
      </div>
    );
  }

  return (
    <>
      <div className={styles.cardGrid}>
        {featureFlags.map((flag) => (
          <OpsCard key={flag.id} className={styles.featureFlagCard}>
            <div className={styles.cardHeader}>
              <div>
                <h3 className={styles.cardTitle}>{flag.flagKey}</h3>
                <p className={styles.cardSubtitle}>
                  생성일 {formatDate(flag.createdAt)}
                </p>
              </div>
              <span className={`${styles.stateBadge} ${styles[`stateBadge--${flag.state.toLowerCase()}`]}`}>
                {flag.state}
              </span>
            </div>
            
            <div className={styles.cardContent}>
              <div className={styles.cardMeta}>
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>설명</span>
                  <span className={styles.metaValue}>{flag.description ?? "-"}</span>
                </div>
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>Scope</span>
                  <span className={styles.metaValue}>{flag.targetScope ?? "-"}</span>
                </div>
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>만료 시각</span>
                  <span className={styles.metaValue}>
                    {flag.expiresAt ? formatDate(flag.expiresAt) : "-"}
                  </span>
                </div>
              </div>
            </div>
            
            <div className={styles.cardActions}>
              {STATE_OPTIONS.map((stateOption) => (
                <MGButton
                  key={stateOption}
                  type="button"
                  variant={flag.state === stateOption ? "primary" : "outline"}
                  size="small"
                  onClick={() => handleToggle(flag.id, stateOption)}
                  loading={isPending && updatingId === flag.id}
                  loadingText="변경 중..."
                  preventDoubleClick={true}
                  clickDelay={1000}
                >
                  {stateOption}
                </MGButton>
              ))}
            </div>
          </OpsCard>
        ))}
      </div>
      {error && <p className={styles.errorMessage}>{error}</p>}
    </>
  );
}

