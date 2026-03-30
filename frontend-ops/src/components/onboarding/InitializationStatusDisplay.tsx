"use client";

import { useState } from "react";
import { fetchOnboardingDetail } from "@/services/onboardingService";
import { OnboardingRequest } from "@/types/onboarding";

interface InitializationStatusDisplayProps {
  request: OnboardingRequest;
  onUpdate?: () => void;
}

interface TaskStatus {
  status: "PENDING" | "RUNNING" | "SUCCESS" | "FAILED";
  updatedAt?: string;
  errorMessage?: string;
}

interface InitializationStatus {
  commonCodes?: TaskStatus;
  roleCodes?: TaskStatus;
  permissionGroups?: TaskStatus;
}

const TASK_LABELS: Record<string, string> = {
  commonCodes: "공통코드 삽입",
  roleCodes: "역할 코드 생성",
  permissionGroups: "권한 그룹 할당",
};

export default function InitializationStatusDisplay({
  request,
  onUpdate,
}: InitializationStatusDisplayProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!request.initializationStatusJson || request.initializationStatusJson.trim() === "") {
    return (
      <div className="initialization-status-empty">
        <p>초기화 작업 상태 정보가 없습니다.</p>
      </div>
    );
  }

  let status: InitializationStatus | null = null;
  try {
    status = JSON.parse(request.initializationStatusJson);
  } catch (e) {
    return (
      <div className="initialization-status-error">
        <p>초기화 작업 상태 정보를 파싱할 수 없습니다.</p>
      </div>
    );
  }

  if (!status) {
    return (
      <div className="initialization-status-empty">
        <p>초기화 작업 상태 정보가 없습니다.</p>
      </div>
    );
  }

  const handleRetry = async (taskType: string) => {
    if (!request.id) {
      setError("요청 ID가 없습니다.");
      return;
    }

    setLoading(taskType);
    setError(null);

    try {
      const response = await fetch(
        `/api/v1/ops/onboarding/requests/${request.id}/retry-initialization`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            taskType,
            actorId: "SYSTEM", // TODO: 실제 사용자 ID 사용
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "재실행에 실패했습니다.");
      }

      // 상태 업데이트
      if (onUpdate) {
        onUpdate();
      } else {
        // 자동 새로고침
        window.location.reload();
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "재실행 중 오류가 발생했습니다."
      );
    } finally {
      setLoading(null);
    }
  };

  const getStatusBadge = (taskStatus: TaskStatus | undefined) => {
    if (!taskStatus) {
      return <span className="status-badge status-badge--pending">대기 중</span>;
    }

    switch (taskStatus.status) {
      case "SUCCESS":
        return <span className="status-badge status-badge--success">성공</span>;
      case "FAILED":
        return <span className="status-badge status-badge--failed">실패</span>;
      case "RUNNING":
        return <span className="status-badge status-badge--running">재실행 중...</span>;
      case "PENDING":
      default:
        return <span className="status-badge status-badge--pending">대기 중</span>;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      return date.toLocaleString("ko-KR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  const tasks = [
    { key: "commonCodes", label: TASK_LABELS.commonCodes, status: status.commonCodes },
    { key: "roleCodes", label: TASK_LABELS.roleCodes, status: status.roleCodes },
    {
      key: "permissionGroups",
      label: TASK_LABELS.permissionGroups,
      status: status.permissionGroups,
    },
  ];

  return (
    <div className="initialization-status-display">
      <h3>초기화 작업 상태</h3>
      {error && (
        <div className="error-message" style={{ color: "red", marginBottom: "1rem" }}>
          {error}
        </div>
      )}
      <dl className="initialization-status-list">
        {tasks.map((task) => {
          const taskStatus = task.status?.status;
          const isFailed = taskStatus === "FAILED";
          const isRunning = taskStatus === "RUNNING";
          const isLoading = loading === task.key;
          
          return (
            <div key={task.key} className="initialization-status-item">
              <dt className="initialization-status-label">{task.label}</dt>
              <dd className="initialization-status-value">
                <div className="initialization-status-row">
                  {getStatusBadge(task.status)}
                  {isFailed && (
                    <button
                      className="retry-button"
                      onClick={() => handleRetry(task.key)}
                      disabled={isLoading || isRunning}
                      style={{
                        marginLeft: "1rem",
                        padding: "0.25rem 0.75rem",
                        fontSize: "0.875rem",
                        backgroundColor: "#007bff",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: isLoading || isRunning ? "not-allowed" : "pointer",
                      }}
                    >
                      {isLoading || isRunning ? "재실행 중..." : "재실행"}
                    </button>
                  )}
              </div>
              {task.status?.errorMessage && (
                <div
                  className="error-message"
                  style={{ marginTop: "0.5rem", color: "red", fontSize: "0.875rem" }}
                >
                  오류: {task.status.errorMessage}
                </div>
              )}
              {task.status?.updatedAt && (
                <div
                  className="updated-at"
                  style={{ marginTop: "0.25rem", fontSize: "0.75rem", color: "#666" }}
                >
                  업데이트: {formatDate(task.status.updatedAt)}
                </div>
              )}
            </dd>
          </div>
          );
        })}
      </dl>
    </div>
  );
}

