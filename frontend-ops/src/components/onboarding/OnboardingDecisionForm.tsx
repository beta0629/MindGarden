"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";

import { decideOnboarding, retryOnboardingApproval } from "@/services/onboardingClient";
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
        } else if (updated.status === "REJECTED") {
          notificationManager.success("❌ 거부됨: 온보딩 요청이 거부되었습니다.");
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
    const loginUrl = process.env.NEXT_PUBLIC_CORE_SOLUTION_URL || "http://localhost:3000";
    window.open(`${loginUrl}/login`, "_blank");
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      notificationManager.success(`${label}이(가) 클립보드에 복사되었습니다.`);
    }).catch(() => {
      notificationManager.error("복사에 실패했습니다.");
    });
  };

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

