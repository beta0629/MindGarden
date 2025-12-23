"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";

import { decideOnboarding, retryOnboardingApproval, getProcessingStatus } from "@/services/onboardingClient";
import { OnboardingStatus } from "@/types/shared";
import { getOnboardingStatusCodes, CommonCode } from "@/services/commonCodeService";
import { OnboardingDecisionResponse } from "@/types/onboarding";
import MGButton from "@/components/ui/MGButton";
import notificationManager from "@/utils/notification";
import styles from "./AdminAccountInfo.module.css";

const DECISION_OPTIONS: OnboardingStatus[] = [
  "APPROVED",
  "REJECTED",
  "IN_REVIEW",
  "ON_HOLD"
];

interface Props {
  requestId: string;
  initialStatus: OnboardingStatus;
}

// 쿠키 파싱 유틸리티
function parseCookie(cookieString: string): Map<string, string> {
  const map = new Map<string, string>();
  if (!cookieString) {
    return map;
  }
  cookieString.split(";").forEach((entry) => {
    const [rawKey, ...rawValue] = entry.trim().split("=");
    if (!rawKey) {
      return;
    }
    const key = decodeURIComponent(rawKey);
    const value = decodeURIComponent(rawValue.join("="));
    map.set(key, value);
  });
  return map;
}

export function OnboardingDecisionForm({ requestId, initialStatus }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState<OnboardingStatus>(initialStatus);
  const [note, setNote] = useState("");
  const [isPending, startTransition] = useTransition();
  const [statusCodes, setStatusCodes] = useState<CommonCode[]>([]);
  const [adminAccount, setAdminAccount] = useState<OnboardingDecisionResponse["adminAccount"] | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<Record<string, any> | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [pollIntervalRef, setPollIntervalRef] = useState<NodeJS.Timeout | null>(null);

  // 공통코드에서 온보딩 상태 코드 조회
  useEffect(() => {
    getOnboardingStatusCodes().then(codes => {
      // DECISION_OPTIONS에 해당하는 코드만 필터링
      const filteredCodes = codes.filter(code => 
        DECISION_OPTIONS.includes(code.codeValue as OnboardingStatus)
      );
      setStatusCodes(filteredCodes);
    }).catch(err => {
      console.error("[OnboardingDecisionForm] 공통코드 조회 실패:", err);
      // 실패 시 빈 배열 (기본 라벨 사용)
      setStatusCodes([]);
    });
  }, []);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    event.stopPropagation();
    
    // 드롭다운에서 직접 현재 선택된 값 가져오기
    const form = event.currentTarget;
    const statusSelect = form.querySelector('select[name="status"]') as HTMLSelectElement;
    const currentSelectedStatus = (statusSelect?.value as OnboardingStatus) || status;
    
    console.log("[OnboardingDecisionForm] handleSubmit 호출됨", { 
      statusState: status, 
      selectedValue: currentSelectedStatus,
      requestId 
    });

    startTransition(async () => {
      try {
        // 쿠키에서 actorId 읽기
        const cookieString = typeof document !== "undefined" ? document.cookie ?? "" : "";
        const cookieMap = parseCookie(cookieString);
        const actorId = cookieMap.get("ops_actor_id") ?? process.env.NEXT_PUBLIC_OPS_ACTOR_ID ?? "";
        
        if (!actorId) {
          notificationManager.error("로그인이 필요합니다. 다시 로그인해주세요.");
          router.push("/auth/login");
          return;
        }
        
        // 드롭다운에서 선택된 값 사용 (state보다 우선)
        const statusToSend = currentSelectedStatus;
        console.log("[OnboardingDecisionForm] 결정 저장 요청:", { requestId, status: statusToSend, actorId, note });
        
        const response = await decideOnboarding(requestId, {
          status: statusToSend,
          actorId,
          note: note.trim().length ? note.trim() : undefined
        });
        
        const updated = response.request;
        console.log("[OnboardingDecisionForm] 결정 저장 응답:", { 
          updatedStatus: updated.status, 
          updatedId: updated.id,
          hasAdminAccount: !!response.adminAccount
        });
        
        // 상태 업데이트
        setStatus(updated.status);
        
        // 관리자 계정 정보 저장 (승인 완료 시)
        if (response.adminAccount) {
          setAdminAccount(response.adminAccount);
        }
        
        // 승인 요청 시 처리 현황 폴링 시작
        if (statusToSend === "APPROVED") {
          setIsPolling(true);
          startPolling();
        }
        
        // 공통 알림 표시
        if (updated.status === "APPROVED") {
          if (response.adminAccount) {
            notificationManager.success("✅ 승인 완료: 테넌트가 생성되었고 관리자 계정이 자동 생성되었습니다. 아래 계정 정보로 로그인할 수 있습니다.");
          } else {
            notificationManager.success("✅ 승인 완료: 테넌트가 생성되었고 관리자 계정이 자동 생성되었습니다.");
          }
        } else if (updated.status === "ON_HOLD") {
          const errorMsg = updated.decisionNote ? updated.decisionNote.split("\n").pop() : "테넌트 생성 중 오류가 발생했습니다.";
          notificationManager.error(`⚠️ 보류됨: ${errorMsg}`);
          setIsPolling(false);
        } else if (updated.status === "REJECTED") {
          notificationManager.success("❌ 거부됨: 온보딩 요청이 거부되었습니다.");
          setIsPolling(false);
        } else {
          notificationManager.success("결정이 저장되었습니다.");
        }
        
        // 페이지 새로고침은 사용자가 수동으로 하도록 함 (로그 확인을 위해)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "결정 처리 중 오류가 발생했습니다.";
        notificationManager.error(errorMessage);
      }
    });
  };

  const handleRetry = () => {
    startTransition(async () => {
      try {
        const updated = await retryOnboardingApproval(requestId, note.trim().length ? note.trim() : undefined);
        // 재시도 후 업데이트된 상태 확인 및 공통 알림 표시
        if (updated.status === "APPROVED") {
          notificationManager.success("재시도 성공: 프로시저가 성공적으로 실행되었습니다. 상태가 APPROVED로 변경되었습니다.");
          // 재시도 성공 시에도 관리자 계정 정보를 다시 조회해야 하지만, 
          // retryOnboardingApproval은 OnboardingRequest만 반환하므로 여기서는 처리하지 않음
        } else if (updated.status === "ON_HOLD") {
          const errorMsg = updated.decisionNote ? "\n오류 내용: " + updated.decisionNote.split("\n").pop() : "";
          notificationManager.error(`재시도 실패: 프로시저 실행 중 오류가 발생했습니다. 상태가 ON_HOLD로 유지되었습니다.${errorMsg}`);
        } else {
          notificationManager.success(`재시도 완료: 상태가 ${updated.status}로 변경되었습니다.`);
        }
        // 상태 업데이트
        setStatus(updated.status);
        // 페이지 새로고침은 사용자가 수동으로 하도록 함 (로그 확인을 위해)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "재시도 처리 중 오류가 발생했습니다.";
        notificationManager.error(errorMessage);
      }
    });
  };

  const handleLogin = () => {
    if (!adminAccount) return;
    
    // CoreSolution 로그인 페이지로 이동 (이메일과 비밀번호를 쿼리 파라미터로 전달하지 않음 - 보안상 위험)
    // 대신 계정 정보를 표시하고 사용자가 직접 입력하도록 함
    const loginUrl = process.env.NEXT_PUBLIC_CORE_SOLUTION_URL;
    
    if (!loginUrl) {
      console.error("[OnboardingDecisionForm] NEXT_PUBLIC_CORE_SOLUTION_URL 환경 변수가 설정되지 않았습니다.");
      alert("CoreSolution URL이 설정되지 않았습니다. 관리자에게 문의하세요.");
      return;
    }
    
    window.open(`${loginUrl}/login`, "_blank");
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      notificationManager.success(`${label}이(가) 클립보드에 복사되었습니다.`);
    }).catch(() => {
      notificationManager.error("복사에 실패했습니다.");
    });
  };

  // 처리 현황 폴링
  const startPolling = () => {
    // 기존 폴링이 있으면 중지
    if (pollIntervalRef) {
      clearInterval(pollIntervalRef);
    }
    
    // 즉시 한 번 조회
    getProcessingStatus(requestId).then(status => {
      setProcessingStatus(status);
      console.log("[OnboardingDecisionForm] 초기 처리 상태:", status);
    }).catch(err => {
      console.error("[OnboardingDecisionForm] 초기 처리 상태 조회 실패:", err);
    });
    
    const pollInterval = setInterval(async () => {
      try {
        const status = await getProcessingStatus(requestId);
        console.log("[OnboardingDecisionForm] 처리 상태 업데이트:", status);
        setProcessingStatus(status);
        
        // 완료 또는 실패 시 폴링 중지
        if (status.progress === 100 || status.COMPLETE?.status === "SUCCESS" || status.COMPLETE?.status === "FAILED") {
          clearInterval(pollInterval);
          setIsPolling(false);
          setPollIntervalRef(null);
        }
      } catch (err) {
        console.error("[OnboardingDecisionForm] 처리 상태 조회 실패:", err);
      }
    }, 1000); // 1초마다 조회
    
    setPollIntervalRef(pollInterval);
    
    // 60초 후 자동 중지 (타임아웃)
    setTimeout(() => {
      clearInterval(pollInterval);
      setIsPolling(false);
      setPollIntervalRef(null);
    }, 60000);
  };

  // 컴포넌트 언마운트 시 폴링 중지
  useEffect(() => {
    return () => {
      if (pollIntervalRef) {
        clearInterval(pollIntervalRef);
      }
      setIsPolling(false);
    };
  }, [pollIntervalRef]);
  
  // 승인 상태일 때 자동으로 폴링 시작 (초기 로드 시 및 상태 변경 시)
  useEffect(() => {
    if (status === "APPROVED" && !isPolling && !pollIntervalRef) {
      console.log("[OnboardingDecisionForm] 승인 상태 감지, 폴링 시작", { status, isPolling, pollIntervalRef });
      setIsPolling(true);
      startPolling();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, initialStatus]);
  
  // 컴포넌트 마운트 시 승인 상태면 즉시 상태 조회
  useEffect(() => {
    if (initialStatus === "APPROVED" && !processingStatus) {
      console.log("[OnboardingDecisionForm] 초기 로드 시 승인 상태 감지, 즉시 상태 조회");
      getProcessingStatus(requestId).then(status => {
        console.log("[OnboardingDecisionForm] 초기 처리 상태 조회 결과:", status);
        setProcessingStatus(status);
        if (status && Object.keys(status).length > 0) {
          setIsPolling(true);
          startPolling();
        }
      }).catch(err => {
        console.error("[OnboardingDecisionForm] 초기 처리 상태 조회 실패:", err);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <form className="form-card" onSubmit={handleSubmit}>
        <h2>결정 기록</h2>
        <div className="form-grid">
          <label className="form-field">
            <span>상태</span>
            <select
              name="status"
              value={status}
              onChange={(event) => {
                const newStatus = event.target.value as OnboardingStatus;
                console.log("[OnboardingDecisionForm] 상태 변경:", { oldStatus: status, newStatus, eventTargetValue: event.target.value });
                setStatus(newStatus);
              }}
              disabled={isPending}
            >
              {DECISION_OPTIONS.map((option) => {
                // 공통코드에서 한글 이름 조회
                const code = statusCodes.find(c => c.codeValue === option);
                const label = code?.koreanName || option;
                return (
                  <option key={option} value={option}>
                    {label}
                  </option>
                );
              })}
            </select>
          </label>
          <label className="form-field form-field--full">
            <span>결정 메모</span>
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="필요 시 심사 코멘트를 남겨주세요."
              rows={3}
              disabled={isPending}
            />
          </label>
        </div>
        <div className="form-footer">
          <div className="ops-form-actions">
            <MGButton
              type="submit"
              variant="primary"
              loading={isPending}
              loadingText="저장 중..."
              preventDoubleClick={true}
              clickDelay={1000}
            >
              결정 저장
            </MGButton>
            {initialStatus === "ON_HOLD" && (
              <MGButton
                type="button"
                variant="success"
                onClick={handleRetry}
                loading={isPending}
                loadingText="재시도 중..."
                preventDoubleClick={true}
                clickDelay={2000}
              >
                프로시저 재시도
              </MGButton>
            )}
          </div>
        </div>
      </form>

      {/* 실시간 처리 현황 표시 */}
      {status === "APPROVED" && (
        <div className="form-card" style={{ marginTop: "1rem" }}>
          <h2>🔄 실시간 처리 현황</h2>
          {processingStatus ? (
            <div style={{ marginTop: "1rem" }}>
              {/* 진행률 표시 */}
              {processingStatus.progress !== undefined && (
                <div style={{ marginBottom: "1rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                    <span>전체 진행률</span>
                    <span>{processingStatus.progress}%</span>
                  </div>
                  <div style={{ 
                    width: "100%", 
                    height: "20px", 
                    backgroundColor: "#e0e0e0", 
                    borderRadius: "4px",
                    overflow: "hidden"
                  }}>
                    <div style={{ 
                      width: `${processingStatus.progress}%`, 
                      height: "100%", 
                      backgroundColor: processingStatus.progress === 100 ? "#4caf50" : "#2196f3",
                      transition: "width 0.3s ease"
                    }} />
                  </div>
                </div>
              )}
              
              {/* 단계별 상태 표시 */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {[
                  { key: "PROCEDURE_START", label: "프로시저 실행 시작" },
                  { key: "TENANT_CREATE", label: "테넌트 생성/활성화" },
                  { key: "ROLE_APPLY", label: "역할 템플릿 적용" },
                  { key: "ADMIN_CREATE", label: "관리자 계정 생성" },
                  { key: "DASHBOARD_CREATE", label: "대시보드 생성" },
                  { key: "COMPLETE", label: "완료" }
                ].map((step) => {
                  const stepData = processingStatus[step.key] as any;
                  if (!stepData) return null;
                  
                  const statusIcon = stepData.status === "SUCCESS" ? "✅" 
                    : stepData.status === "FAILED" ? "❌" 
                    : stepData.status === "IN_PROGRESS" ? "🔄" 
                    : "⏳";
                  
                  return (
                    <div key={step.key} style={{ 
                      padding: "0.75rem", 
                      backgroundColor: stepData.status === "SUCCESS" ? "#e8f5e9" 
                        : stepData.status === "FAILED" ? "#ffebee" 
                        : stepData.status === "IN_PROGRESS" ? "#e3f2fd" 
                        : "#f5f5f5",
                      borderRadius: "4px",
                      border: `1px solid ${stepData.status === "SUCCESS" ? "#4caf50" 
                        : stepData.status === "FAILED" ? "#f44336" 
                        : stepData.status === "IN_PROGRESS" ? "#2196f3" 
                        : "#9e9e9e"}`
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <span>{statusIcon}</span>
                        <strong>{step.label}</strong>
                        <span style={{ marginLeft: "auto", fontSize: "0.875rem", color: "#666" }}>
                          {stepData.status}
                        </span>
                      </div>
                      {stepData.message && (
                        <div style={{ marginTop: "0.5rem", fontSize: "0.875rem", color: "#666" }}>
                          {stepData.message}
                        </div>
                      )}
                      {stepData.updatedAt && (
                        <div style={{ marginTop: "0.25rem", fontSize: "0.75rem", color: "#999" }}>
                          {new Date(stepData.updatedAt).toLocaleString("ko-KR")}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              
              {isPolling && (
                <div style={{ marginTop: "1rem", textAlign: "center", color: "#666", fontSize: "0.875rem" }}>
                  🔄 실시간 업데이트 중...
                </div>
              )}
            </div>
          ) : (
            <div style={{ marginTop: "1rem", padding: "1rem", textAlign: "center", color: "#666", fontSize: "0.875rem", backgroundColor: "#f5f5f5", borderRadius: "4px" }}>
              {isPolling ? (
                <div>
                  <div style={{ marginBottom: "0.5rem" }}>🔄 처리 상태 조회 중...</div>
                  <div style={{ fontSize: "0.75rem", color: "#999" }}>백엔드에서 처리 상태를 가져오는 중입니다.</div>
                </div>
              ) : (
                <div>
                  <div style={{ marginBottom: "0.5rem" }}>⏳ 처리 상태 정보가 없습니다.</div>
                  <div style={{ fontSize: "0.75rem", color: "#999" }}>처리 상태가 업데이트되면 자동으로 표시됩니다.</div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 관리자 계정 정보 표시 (승인 완료 시) */}
      {adminAccount && status === "APPROVED" && (
        <div className={`form-card ${styles.adminAccountCard}`}>
          <h2 className={styles.adminAccountCard__title}>✅ 생성된 관리자 계정 정보</h2>
          <div className={styles.adminAccountCard__content}>
            <div className={styles.adminAccountCard__field}>
              <div className={styles.adminAccountCard__row}>
                <strong className={styles.adminAccountCard__label}>이메일:</strong>
                <code className={styles.adminAccountCard__value}>
                  {adminAccount.email}
                </code>
                <button
                  type="button"
                  onClick={() => copyToClipboard(adminAccount.email, "이메일")}
                  className={styles.adminAccountCard__button}
                >
                  복사
                </button>
              </div>
              <div className={styles.adminAccountCard__row}>
                <strong className={styles.adminAccountCard__label}>비밀번호:</strong>
                <code className={styles.adminAccountCard__value}>
                  {showPassword ? adminAccount.password : "••••••••••"}
                </code>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={styles.adminAccountCard__button}
                >
                  {showPassword ? "숨기기" : "보기"}
                </button>
                <button
                  type="button"
                  onClick={() => copyToClipboard(adminAccount.password, "비밀번호")}
                  className={styles.adminAccountCard__button}
                >
                  복사
                </button>
              </div>
              <div className={styles.adminAccountCard__row}>
                <strong className={styles.adminAccountCard__label}>테넌트 ID:</strong>
                <code className={styles.adminAccountCard__value}>
                  {adminAccount.tenantId}
                </code>
                <button
                  type="button"
                  onClick={() => copyToClipboard(adminAccount.tenantId, "테넌트 ID")}
                  className={styles.adminAccountCard__button}
                >
                  복사
                </button>
              </div>
              <div className={styles.adminAccountCard__row}>
                <strong className={styles.adminAccountCard__label}>테넌트명:</strong>
                <span className={styles.adminAccountCard__valueText}>{adminAccount.tenantName}</span>
              </div>
            </div>
            <div className={styles.adminAccountCard__footer}>
              <p className={styles.adminAccountCard__footerText}>
                💡 위 계정 정보로 CoreSolution에 로그인할 수 있습니다.
              </p>
              <MGButton
                type="button"
                variant="primary"
                onClick={handleLogin}
                className={styles.adminAccountCard__loginButton}
                fullWidth={true}
              >
                🔐 CoreSolution 로그인 페이지로 이동
              </MGButton>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

