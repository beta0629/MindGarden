"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Header from "../../../components/Header";
import Button from "../../../components/Button";
import { TRINITY_CONSTANTS } from "../../../constants/trinity";
import { COMPONENT_CSS } from "../../../constants/css-variables";
import { createPaymentMethod, createSubscription, createOnboardingRequest, type OnboardingCreateRequest } from "../../../utils/api";
import { getDefaultRiskLevel } from "../../../utils/commonCodeUtils";

export default function OnboardingCallbackPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<"success" | "fail" | "processing" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [defaultRiskLevel, setDefaultRiskLevel] = useState<string>("LOW"); // 기본 위험도

  // URL 파라미터 추출
  const statusParam = searchParams.get("status");
  const paymentType = searchParams.get("type") || "register"; // "register" (카드 등록) 또는 "pay" (즉시 결제)
  const authKey = searchParams.get("authKey") || searchParams.get("paymentKey"); // 토스페이먼츠에서 받은 billingKey 또는 paymentKey
  const paymentKey = searchParams.get("paymentKey"); // 즉시 결제 시 paymentKey
  const orderId = searchParams.get("orderId"); // 즉시 결제 시 orderId
  const customerKey = searchParams.get("customerKey");
  const tenantName = searchParams.get("tenantName");
  const contactEmail = searchParams.get("contactEmail");
  const errorCode = searchParams.get("code") || searchParams.get("errorCode"); // 토스페이먼츠는 'code' 파라미터 사용
  const errorMessage = searchParams.get("message") || searchParams.get("errorMessage"); // 토스페이먼츠는 'message' 파라미터 사용
  
  // 디버깅: 모든 URL 파라미터 로그
  useEffect(() => {
    console.log("[OnboardingCallback] URL 파라미터:", {
      status: statusParam,
      authKey,
      customerKey,
      tenantName,
      contactEmail,
      errorCode,
      errorMessage,
      allParams: Object.fromEntries(searchParams.entries()),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusParam, authKey, customerKey, tenantName, contactEmail, errorCode, errorMessage]);

  // 기본 위험도 로드 (컴포넌트 마운트 시)
  useEffect(() => {
    const loadDefaultRiskLevel = async () => {
      try {
        const riskLevel = await getDefaultRiskLevel();
        setDefaultRiskLevel(riskLevel);
      } catch (err) {
        console.error("기본 위험도 로드 실패:", err);
        // 기본값 "LOW" 유지
      }
    };
    loadDefaultRiskLevel();
  }, []);

  // 팝업 창인 경우 부모 창으로 메시지 전송
  useEffect(() => {
    if (typeof window !== "undefined" && window.opener) {
      // 팝업 창에서 실행 중인 경우
      if (statusParam === "success" && authKey && customerKey) {
        window.opener.postMessage(
          {
            type: "TOSS_PAYMENT_SUCCESS",
            authKey,
            customerKey,
          },
          window.location.origin
        );
        // 메시지 전송 후 창 닫기
        setTimeout(() => {
          window.close();
        }, 100);
      } else if (statusParam === "fail") {
        const errorMsg = errorMessage || errorCode || "카드 등록에 실패했습니다.";
        window.opener.postMessage(
          {
            type: "TOSS_PAYMENT_FAIL",
            error: errorMsg,
          },
          window.location.origin
        );
        // 메시지 전송 후 창 닫기
        setTimeout(() => {
          window.close();
        }, 100);
      }
    }
  }, [statusParam, authKey, customerKey, errorCode, errorMessage]);

  useEffect(() => {
    const processCallback = async () => {
      if (!statusParam) {
        setError("상태 정보가 없습니다.");
        setStatus("fail");
        setLoading(false);
        return;
      }

      if (statusParam === "fail") {
        // 실패 처리
        setStatus("fail");
        let errorMsg = "카드 등록에 실패했습니다.";
        
        if (errorMessage) {
          errorMsg = errorMessage;
          
          // "Invalid card number" 오류에 대한 안내 추가
          if (errorMessage.includes("Invalid card number") || errorMessage.includes("카드번호")) {
            errorMsg = `${errorMessage}\n\n💡 테스트 환경 입력 정보:\n• 개인/법인: 개인\n• 카드번호: 실제 카드번호 사용 가능 (테스트 환경에서는 실제 결제 발생하지 않음)\n  또는 테스트 카드: 4111-1111-1111-1111 (VISA)\n• 유효기간: 실제 카드 유효기간 또는 12/25 (MM/YY 형식)\n• 주민등록번호 앞 7자리: 실제 주민등록번호 또는 9001011 (1990년 1월 1일, 남성)\n• CVC: 실제 CVC 또는 123 (카드 뒷면 3자리)\n• 비밀번호: 실제 카드 비밀번호 앞 2자리 또는 123456\n\n⚠️ 테스트 환경에서는 실제 결제가 발생하지 않습니다.`;
          }
          
          // "지원하지 않는 카드종류" 오류에 대한 안내 추가
          if (errorMessage.includes("지원하지 않는 카드종류") || errorMessage.includes("NOT_SUPPORTED_CARD_TYPE")) {
            errorMsg = `${errorMessage}\n\n💡 해결 방법:\n• 실제 카드번호를 사용해보세요 (테스트 환경에서는 실제 결제 발생하지 않음)\n• 카드번호 첫 4자리로 카드사가 자동 인식됩니다\n• 다른 테스트 카드 번호를 시도해보세요 (예: 5555-5555-5555-4444)\n• 상점 설정에서 카드 타입이 활성화되어 있는지 확인하세요\n\n⚠️ 토스페이먼츠 테스트 환경에서는 특정 카드 타입만 지원할 수 있습니다.`;
          }
        } else if (errorCode) {
          // 토스페이먼츠 오류 코드에 따른 메시지 매핑
          const errorMessages: Record<string, string> = {
            "USER_CANCEL": "사용자가 카드 등록을 취소했습니다.",
            "INVALID_CARD": "유효하지 않은 카드 정보입니다.\n\n💡 테스트 환경 입력 정보:\n• 개인/법인: 개인\n• 카드번호: 실제 카드번호 사용 가능 (테스트 환경에서는 실제 결제 발생하지 않음)\n  또는 테스트 카드: 4111-1111-1111-1111 (VISA)\n• 유효기간: 실제 카드 유효기간 또는 12/25 (MM/YY 형식)\n• 주민등록번호 앞 7자리: 실제 주민등록번호 또는 9001011 (1990년 1월 1일, 남성)\n• CVC: 실제 CVC 또는 123 (카드 뒷면 3자리)\n• 비밀번호: 실제 카드 비밀번호 앞 2자리 또는 123456\n\n⚠️ 테스트 환경에서는 실제 결제가 발생하지 않습니다.",
            "CARD_REGISTRATION_FAILED": "카드 등록에 실패했습니다.",
            "NETWORK_ERROR": "네트워크 오류가 발생했습니다. 다시 시도해주세요.",
            "INVALID_CARD_NUMBER": "카드 번호가 올바르지 않습니다.\n\n💡 테스트 환경 입력 정보:\n• 개인/법인: 개인\n• 카드번호: 실제 카드번호 사용 가능 (테스트 환경에서는 실제 결제 발생하지 않음)\n  또는 테스트 카드: 4111-1111-1111-1111 (VISA)\n• 유효기간: 실제 카드 유효기간 또는 12/25 (MM/YY 형식)\n• 주민등록번호 앞 7자리: 실제 주민등록번호 또는 9001011 (1990년 1월 1일, 남성)\n• CVC: 실제 CVC 또는 123 (카드 뒷면 3자리)\n• 비밀번호: 실제 카드 비밀번호 앞 2자리 또는 123456\n\n⚠️ 테스트 환경에서는 실제 결제가 발생하지 않습니다.",
            "NOT_SUPPORTED_CARD_TYPE": "해당 상점에서 지원하지 않는 카드 종류입니다.\n\n💡 해결 방법:\n• 실제 카드번호를 사용해보세요 (테스트 환경에서는 실제 결제 발생하지 않음)\n• 다른 테스트 카드 번호를 시도해보세요 (예: 5555-5555-5555-4444)\n• 상점 설정에서 카드 타입이 활성화되어 있는지 확인하세요\n\n⚠️ 토스페이먼츠 테스트 환경에서는 특정 카드 타입만 지원할 수 있습니다.",
          };
          errorMsg = errorMessages[errorCode] || `오류 코드: ${errorCode}`;
        }
        
        console.error("[OnboardingCallback] 카드 등록 실패:", {
          errorCode,
          errorMessage,
          allParams: Object.fromEntries(searchParams.entries()),
        });
        
        setError(errorMsg);
        setLoading(false);
        return;
      }

      if (statusParam === "success") {
        // 성공 처리
        if (!customerKey || !tenantName || !contactEmail) {
          setError("필수 정보가 누락되었습니다.");
          setStatus("fail");
          setLoading(false);
          return;
        }

        // 결제 타입에 따른 검증
        if (paymentType === "register" && !authKey) {
          setError("카드 등록 정보가 누락되었습니다.");
          setStatus("fail");
          setLoading(false);
          return;
        }

        if (paymentType === "pay" && (!paymentKey || !orderId)) {
          setError("결제 정보가 누락되었습니다.");
          setStatus("fail");
          setLoading(false);
          return;
        }

        try {
          setStatus("processing");

          // 2. 세션 스토리지에서 폼 데이터 가져오기
          const savedFormData = sessionStorage.getItem('onboarding_form_data');
          let formData: any = {};
          if (savedFormData) {
            try {
              formData = JSON.parse(savedFormData);
              console.log("[OnboardingCallback] 세션 스토리지에서 폼 데이터 로드:", formData);
              sessionStorage.removeItem('onboarding_form_data'); // 사용 후 삭제
            } catch (e) {
              console.error("세션 스토리지 데이터 파싱 실패:", e);
            }
          } else {
            console.warn("[OnboardingCallback] 세션 스토리지에 폼 데이터가 없습니다. URL 파라미터만 사용합니다.");
          }

          // URL 파라미터에서 폼 데이터 보완
          const finalTenantName = formData.tenantName || (tenantName ? decodeURIComponent(tenantName) : "");
          const finalContactEmail = formData.contactEmail || (contactEmail ? decodeURIComponent(contactEmail) : "");
          
          if (!finalTenantName || !finalContactEmail) {
            const errorMsg = `필수 정보가 누락되었습니다. tenantName: ${finalTenantName ? '있음' : '없음'}, contactEmail: ${finalContactEmail ? '있음' : '없음'}`;
            console.error("[OnboardingCallback]", errorMsg, { formData, tenantName, contactEmail });
            setError(errorMsg);
            setStatus("fail");
            setLoading(false);
            return;
          }

          let paymentMethodId: string | undefined = undefined;

          // 1. 결제 타입에 따른 처리
          if (paymentType === "register") {
            // 카드 등록: 결제 수단 등록
            console.log("[OnboardingCallback] 카드 등록 처리 시작...", { authKey });
            const paymentMethod = await createPaymentMethod({
              paymentMethodToken: authKey!, // 토스페이먼츠 billingKey
              pgProvider: TRINITY_CONSTANTS.PAYMENT.DEFAULT_PG_PROVIDER as "TOSS" | "STRIPE" | "OTHER",
            });
            paymentMethodId = paymentMethod.paymentMethodId;
            console.log("[OnboardingCallback] 결제 수단 등록 완료:", paymentMethodId);
          } else if (paymentType === "pay") {
            // 즉시 결제: 결제 완료 처리 (결제 수단 등록 없이)
            // TODO: 실제 결제 완료 처리는 백엔드에서 webhook으로 처리
            // 여기서는 온보딩 요청만 생성
            console.log("[OnboardingCallback] 즉시 결제 완료:", {
              paymentKey,
              orderId,
              amount: formData.amount,
            });
          }

          // 3. 온보딩 요청 생성
          const request: OnboardingCreateRequest = {
            tenantId: null,
            tenantName: finalTenantName,
            requestedBy: finalContactEmail,
            riskLevel: defaultRiskLevel as "LOW" | "MEDIUM" | "HIGH", // 공통 코드에서 동적으로 가져온 값
            businessType: formData.businessType || "",
            adminPassword: formData.adminPassword || "", // 관리자 계정 비밀번호 (checklistJson에 포함)
            checklistJson: JSON.stringify({
              contactPhone: formData.contactPhone || "",
              planId: formData.planId || "",
              adminPassword: formData.adminPassword || "", // 관리자 계정 비밀번호 (승인 시 사용)
              paymentMethodId,
              customerKey,
              paymentType, // "register" 또는 "pay"
              paymentKey: paymentType === "pay" ? paymentKey : undefined,
              orderId: paymentType === "pay" ? orderId : undefined,
              amount: paymentType === "pay" ? formData.amount : undefined,
              dashboardTemplates: formData.dashboardTemplates || {}, // 대시보드 템플릿 설정
            }),
          };

          console.log("[OnboardingCallback] 온보딩 요청 생성 시작...", {
            fullRequest: JSON.stringify(request, null, 2),
            tenantName: request.tenantName,
            tenantNameLength: request.tenantName?.length,
            requestedBy: request.requestedBy,
            requestedByLength: request.requestedBy?.length,
            riskLevel: request.riskLevel,
            businessType: request.businessType,
            checklistJsonLength: request.checklistJson?.length,
            paymentMethodId,
          });

          const onboardingRequest = await createOnboardingRequest(request);
          
          console.log("[OnboardingCallback] ✅ 온보딩 요청 생성 완료:", onboardingRequest);

          setStatus("success");
          
          // 성공 시 온보딩 페이지로 리다이렉트
          setTimeout(() => {
            const redirectUrl = paymentType === "register" 
              ? '/onboarding?paymentMethodRegistered=true'
              : '/onboarding?paymentCompleted=true';
            router.push(redirectUrl);
          }, 2000);
        } catch (err) {
          console.error("[OnboardingCallback] 온보딩 요청 처리 실패:", err);
          console.error("[OnboardingCallback] 에러 상세:", {
            message: err instanceof Error ? err.message : String(err),
            stack: err instanceof Error ? err.stack : undefined,
            error: err,
          });
          const errorMsg = err instanceof Error ? err.message : "온보딩 요청 처리 중 오류가 발생했습니다.";
          setError(errorMsg);
          setStatus("fail");
        } finally {
          setLoading(false);
        }
      }
    };

    processCallback();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusParam, authKey, customerKey, tenantName, contactEmail, errorCode, errorMessage, paymentType, paymentKey, orderId]);

  return (
    <div className="trinity-onboarding">
      <Header />
      <div className={COMPONENT_CSS.ONBOARDING.CONTAINER}>
        <div className={COMPONENT_CSS.ONBOARDING.FORM}>
          {status === "processing" && (
            <div className={COMPONENT_CSS.ONBOARDING.STEP}>
              <h2 className="trinity-onboarding__step-title">처리 중...</h2>
              <p className={COMPONENT_CSS.ONBOARDING.MESSAGE}>
                카드 등록 정보를 처리하고 있습니다. 잠시만 기다려주세요.
              </p>
            </div>
          )}

          {status === "success" && (
            <div className={COMPONENT_CSS.ONBOARDING.STEP}>
              <h2 className="trinity-onboarding__step-title">
                {paymentType === "register" ? "✅ 카드 등록 완료" : "✅ 결제 완료"}
              </h2>
              <p className={COMPONENT_CSS.ONBOARDING.MESSAGE}>
                {paymentType === "register" 
                  ? "카드 등록이 완료되었습니다. 매월 자동으로 결제됩니다."
                  : "결제가 완료되었습니다."}
                <br />
                온보딩 요청이 접수되었으며, 승인 후 서비스 이용이 가능합니다.
              </p>
              <div className="trinity-onboarding__buttons">
                <Button
                  type="button"
                  onClick={() => router.push("/")}
                  variant="primary"
                  fullWidth
                >
                  홈으로 돌아가기
                </Button>
              </div>
            </div>
          )}

          {status === "fail" && (
            <div className={COMPONENT_CSS.ONBOARDING.STEP}>
              <h2 className="trinity-onboarding__step-title">
                {paymentType === "register" ? "❌ 카드 등록 실패" : "❌ 결제 실패"}
              </h2>
              {error && (
                <div className={`${COMPONENT_CSS.ONBOARDING.MESSAGE} ${COMPONENT_CSS.ONBOARDING.MESSAGE_ERROR}`} style={{ whiteSpace: 'pre-line', lineHeight: '1.6' }}>
                  {error}
                </div>
              )}
              <div className="trinity-onboarding__buttons">
                <Button
                  type="button"
                  onClick={() => router.push("/onboarding")}
                  variant="primary"
                  fullWidth
                >
                  다시 시도하기
                </Button>
                <Button
                  type="button"
                  onClick={() => router.push("/")}
                  variant="secondary"
                  fullWidth
                >
                  홈으로 돌아가기
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

