"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { toggleFeatureFlag } from "@/services/featureFlagClient";
import { FeatureFlag } from "@/types/featureFlag";
import { FeatureFlagState } from "@/types/shared";

interface Props {
  featureFlags: FeatureFlag[];
}

const STATE_OPTIONS: FeatureFlagState[] = ["DISABLED", "SHADOW", "ENABLED"];

export function FeatureFlagTable({ featureFlags }: Props) {
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

  return (
    <>
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>플래그</th>
              <th>설명</th>
              <th>상태</th>
              <th>Scope</th>
              <th>만료 시각</th>
              <th>조치</th>
            </tr>
          </thead>
          <tbody>
            {featureFlags.length === 0 ? (
              <tr>
                <td className="data-table__empty" colSpan={6}>
                  등록된 Feature Flag가 없습니다.
                </td>
              </tr>
            ) : (
              featureFlags.map((flag) => (
                <tr key={flag.id}>
                  <td>
                    <div className="table-primary">{flag.flagKey}</div>
                    <div className="table-secondary">
                      생성일 {formatDate(flag.createdAt)}
                    </div>
                  </td>
                  <td>{flag.description ?? "-"}</td>
                  <td>{flag.state}</td>
                  <td>{flag.targetScope ?? "-"}</td>
                  <td>{flag.expiresAt ? formatDate(flag.expiresAt) : "-"}</td>
                  <td>
                    <div className="flag-actions">
                      {STATE_OPTIONS.map((stateOption) => (
                        <button
                          key={stateOption}
                          type="button"
                          className={`ghost-button ${
                            flag.state === stateOption
                              ? "ghost-button--active"
                              : ""
                          }`}
                          onClick={() => handleToggle(flag.id, stateOption)}
                          disabled={isPending && updatingId === flag.id}
                        >
                          {stateOption}
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {error && <p className="form-feedback form-feedback--error">{error}</p>}
    </>
  );
}

function formatDate(value: string) {
  const date = new Date(value);
  return date.toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

