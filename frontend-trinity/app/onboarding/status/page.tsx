"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Header from "../../../components/Header";
import Button from "../../../components/Button";
import OnboardingStatusCard from "../../../components/onboarding/OnboardingStatusCard";
import { COMPONENT_CSS } from "../../../constants/css-variables";
import { getPublicOnboardingRequests, getPublicOnboardingRequest, type OnboardingRequest } from "../../../utils/api";
import "../../../styles/components/onboarding-status.css";

export default function OnboardingStatusPage() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState(searchParams.get("email") || "");
  const [requestId, setRequestId] = useState(searchParams.get("id") || "");
  const [requests, setRequests] = useState<OnboardingRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<OnboardingRequest | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!email || !email.trim()) {
      setError("이메일을 입력해주세요.");
      return;
    }

    setLoading(true);
    setError(null);
    setSelectedRequest(null);

    try {
      if (requestId && requestId.trim()) {
        // ID와 이메일로 상세 조회 (ID는 UUID 문자열)
        const request = await getPublicOnboardingRequest(requestId.trim(), email);
        setSelectedRequest(request);
        setRequests([]);
      } else {
        // 이메일로 목록 조회
        const results = await getPublicOnboardingRequests(email);
        setRequests(results);
        setSelectedRequest(null);
      }
    } catch (err) {
      console.error("온보딩 요청 조회 실패:", err);
      setError(err instanceof Error ? err.message : "온보딩 요청 조회에 실패했습니다.");
      setRequests([]);
      setSelectedRequest(null);
    } finally {
      setLoading(false);
    }
  };

  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, { label: string; color: string }> = {
      PENDING: { label: "대기 중", color: "#ff9800" },
      APPROVED: { label: "승인됨", color: "#4caf50" },
      REJECTED: { label: "거부됨", color: "#f44336" },
      ON_HOLD: { label: "보류", color: "#9e9e9e" },
    };
    return statusMap[status] || { label: status, color: "#666" };
  };

  const formatDate = (dateString: string) => {
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

  return (
    <div className="trinity-onboarding">
      <Header />
      <div className={COMPONENT_CSS.ONBOARDING.CONTAINER}>
        <div className={COMPONENT_CSS.ONBOARDING.FORM}>
          <h1 className={COMPONENT_CSS.ONBOARDING.TITLE}>온보딩 신청 상태 조회</h1>
          <p className={`${COMPONENT_CSS.ONBOARDING.TEXT_SECONDARY} trinity-onboarding-status__description`}>
            신청 시 입력하신 이메일 주소로 신청 내역을 조회할 수 있습니다.
          </p>

          <div className={COMPONENT_CSS.ONBOARDING.FIELD}>
            <label className={COMPONENT_CSS.ONBOARDING.LABEL}>
              이메일 주소 <span className="trinity-onboarding-status__required">*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="신청 시 입력하신 이메일 주소"
              className={`${COMPONENT_CSS.ONBOARDING.INPUT} trinity-onboarding-status__input`}
            />
          </div>

          <div className={COMPONENT_CSS.ONBOARDING.FIELD}>
            <label className={COMPONENT_CSS.ONBOARDING.LABEL}>
              신청 번호 (선택사항)
            </label>
            <input
              type="text"
              value={requestId}
              onChange={(e) => setRequestId(e.target.value)}
              placeholder="신청 번호를 입력하면 상세 내역을 조회합니다"
              className={COMPONENT_CSS.ONBOARDING.INPUT}
            />
          </div>

          {error && (
            <div className="trinity-onboarding-status__error">
              {error}
            </div>
          )}

          <Button
            type="button"
            onClick={handleSearch}
            disabled={loading || !email.trim()}
            variant="primary"
            fullWidth
            loading={loading}
            loadingText="조회 중..."
          >
            조회하기
          </Button>

          {/* 조회 결과: 목록 */}
          {requests.length > 0 && (
            <div className="trinity-onboarding-status__results">
              <h2 className="trinity-onboarding-status__results-title">
                신청 내역 ({requests.length}건)
              </h2>
              <div className="trinity-onboarding-status__grid">
                {requests.map((request) => (
                  <OnboardingStatusCard
                    key={request.id}
                    request={request}
                    onViewDetail={(id) => {
                      // id는 UUID 문자열이므로 그대로 사용
                      setRequestId(typeof id === 'string' ? id : String(id));
                      handleSearch();
                    }}
                    formatDate={formatDate}
                    getStatusLabel={getStatusLabel}
                  />
                ))}
              </div>
            </div>
          )}

          {/* 조회 결과: 상세 */}
          {selectedRequest && (
            <div className="trinity-onboarding-status__detail">
              <h2 className="trinity-onboarding-status__detail-title">
                신청 상세 내역
              </h2>
              <OnboardingStatusCard
                request={selectedRequest}
                formatDate={formatDate}
                getStatusLabel={getStatusLabel}
              />
            </div>
          )}

          {requests.length === 0 && !selectedRequest && !loading && email && !error && (
            <div className="trinity-onboarding-status__empty">
              조회된 신청 내역이 없습니다.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

