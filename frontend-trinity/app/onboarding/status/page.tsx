"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Header from "../../../components/Header";
import Button from "../../../components/Button";
import { COMPONENT_CSS } from "../../../constants/css-variables";
import { getPublicOnboardingRequests, getPublicOnboardingRequest, type OnboardingRequest } from "../../../utils/api";

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
      if (requestId) {
        // ID와 이메일로 상세 조회
        const request = await getPublicOnboardingRequest(parseInt(requestId), email);
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
          <p className={COMPONENT_CSS.ONBOARDING.TEXT_SECONDARY} style={{ marginBottom: "24px" }}>
            신청 시 입력하신 이메일 주소로 신청 내역을 조회할 수 있습니다.
          </p>

          <div className={COMPONENT_CSS.ONBOARDING.FIELD}>
            <label className={COMPONENT_CSS.ONBOARDING.LABEL}>
              이메일 주소 <span style={{ color: "#f44336" }}>*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="신청 시 입력하신 이메일 주소"
              className={COMPONENT_CSS.ONBOARDING.INPUT}
              style={{ marginBottom: "12px" }}
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
              style={{ marginBottom: "16px" }}
            />
          </div>

          {error && (
            <div
              style={{
                padding: "12px",
                backgroundColor: "#ffebee",
                border: "1px solid #f44336",
                borderRadius: "4px",
                marginBottom: "16px",
                color: "#c62828",
                fontSize: "14px",
              }}
            >
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
            <div style={{ marginTop: "32px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "16px" }}>
                신청 내역 ({requests.length}건)
              </h2>
              {requests.map((request) => {
                const statusInfo = getStatusLabel(request.status);
                return (
                  <div
                    key={request.id}
                    style={{
                      padding: "16px",
                      border: "1px solid #e0e0e0",
                      borderRadius: "4px",
                      marginBottom: "12px",
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                    onClick={() => handleSearch()}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#f5f5f5";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "white";
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                      <div>
                        <strong style={{ fontSize: "16px" }}>{request.tenantName}</strong>
                        <span style={{ marginLeft: "12px", fontSize: "12px", color: "#666" }}>
                          신청 번호: {request.id}
                        </span>
                      </div>
                      <span
                        style={{
                          padding: "4px 12px",
                          borderRadius: "12px",
                          backgroundColor: statusInfo.color + "20",
                          color: statusInfo.color,
                          fontSize: "12px",
                          fontWeight: "bold",
                        }}
                      >
                        {statusInfo.label}
                      </span>
                    </div>
                    <div style={{ fontSize: "14px", color: "#666" }}>
                      신청일: {formatDate(request.createdAt)}
                      {request.decisionAt && (
                        <>
                          <br />
                          {request.status === "APPROVED" ? "승인" : "거부"}일: {formatDate(request.decisionAt)}
                        </>
                      )}
                    </div>
                    {request.decisionNote && (
                      <div style={{ marginTop: "8px", fontSize: "14px", color: "#666" }}>
                        <strong>처리 메모:</strong> {request.decisionNote}
                      </div>
                    )}
                    {request.status === "APPROVED" && (
                      <div style={{ marginTop: "12px", padding: "12px", backgroundColor: "#e8f5e9", borderRadius: "4px", border: "1px solid #4caf50" }}>
                        <div style={{ marginBottom: "8px", fontSize: "14px", fontWeight: "bold", color: "#2e7d32" }}>
                          ✅ 승인 완료
                        </div>
                        <a
                          href={`http://localhost:3001/login?email=${encodeURIComponent(request.requestedBy)}&redirect=/tenant/profile`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: "inline-block",
                            padding: "8px 16px",
                            backgroundColor: "#4caf50",
                            color: "white",
                            textDecoration: "none",
                            borderRadius: "4px",
                            fontSize: "14px",
                            fontWeight: "500",
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          로그인하기
                        </a>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* 조회 결과: 상세 */}
          {selectedRequest && (
            <div style={{ marginTop: "32px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "16px" }}>
                신청 상세 내역
              </h2>
              <div
                style={{
                  padding: "20px",
                  border: "1px solid #e0e0e0",
                  borderRadius: "4px",
                  backgroundColor: "#fafafa",
                }}
              >
                <div style={{ marginBottom: "16px" }}>
                  <strong style={{ display: "block", marginBottom: "4px", color: "#666" }}>회사명</strong>
                  <span style={{ fontSize: "16px" }}>{selectedRequest.tenantName}</span>
                </div>
                <div style={{ marginBottom: "16px" }}>
                  <strong style={{ display: "block", marginBottom: "4px", color: "#666" }}>신청 번호</strong>
                  <span style={{ fontSize: "16px" }}>{selectedRequest.id}</span>
                </div>
                <div style={{ marginBottom: "16px" }}>
                  <strong style={{ display: "block", marginBottom: "4px", color: "#666" }}>신청자 이메일</strong>
                  <span style={{ fontSize: "16px" }}>{selectedRequest.requestedBy}</span>
                </div>
                <div style={{ marginBottom: "16px" }}>
                  <strong style={{ display: "block", marginBottom: "4px", color: "#666" }}>상태</strong>
                  {(() => {
                    const statusInfo = getStatusLabel(selectedRequest.status);
                    return (
                      <span
                        style={{
                          display: "inline-block",
                          padding: "4px 12px",
                          borderRadius: "12px",
                          backgroundColor: statusInfo.color + "20",
                          color: statusInfo.color,
                          fontSize: "14px",
                          fontWeight: "bold",
                        }}
                      >
                        {statusInfo.label}
                      </span>
                    );
                  })()}
                </div>
                <div style={{ marginBottom: "16px" }}>
                  <strong style={{ display: "block", marginBottom: "4px", color: "#666" }}>신청일</strong>
                  <span style={{ fontSize: "16px" }}>{formatDate(selectedRequest.createdAt)}</span>
                </div>
                {selectedRequest.decisionAt && (
                  <div style={{ marginBottom: "16px" }}>
                    <strong style={{ display: "block", marginBottom: "4px", color: "#666" }}>
                      {selectedRequest.status === "APPROVED" ? "승인" : "거부"}일
                    </strong>
                    <span style={{ fontSize: "16px" }}>{formatDate(selectedRequest.decisionAt)}</span>
                  </div>
                )}
                {selectedRequest.decisionNote && (
                  <div style={{ marginBottom: "16px" }}>
                    <strong style={{ display: "block", marginBottom: "4px", color: "#666" }}>처리 메모</strong>
                    <div
                      style={{
                        padding: "12px",
                        backgroundColor: "white",
                        borderRadius: "4px",
                        fontSize: "14px",
                        lineHeight: "1.6",
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {selectedRequest.decisionNote}
                    </div>
                  </div>
                )}
                
                {/* 승인 완료 시 로그인 링크 표시 */}
                {selectedRequest.status === "APPROVED" && (
                  <div style={{ marginTop: "24px", padding: "16px", backgroundColor: "#e8f5e9", borderRadius: "4px", border: "1px solid #4caf50" }}>
                    <div style={{ marginBottom: "12px", fontSize: "16px", fontWeight: "bold", color: "#2e7d32" }}>
                      ✅ 승인이 완료되었습니다!
                    </div>
                    <p style={{ marginBottom: "16px", fontSize: "14px", color: "#666" }}>
                      신청 시 입력하신 이메일과 비밀번호로 로그인하여 서비스를 이용하실 수 있습니다.
                    </p>
                    <a
                      href={`http://localhost:3001/login?email=${encodeURIComponent(selectedRequest.requestedBy)}&redirect=/tenant/profile`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: "inline-block",
                        padding: "12px 24px",
                        backgroundColor: "#4caf50",
                        color: "white",
                        textDecoration: "none",
                        borderRadius: "4px",
                        fontWeight: "bold",
                        fontSize: "16px",
                        transition: "background-color 0.2s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "#45a049";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "#4caf50";
                      }}
                    >
                      로그인하기
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {requests.length === 0 && !selectedRequest && !loading && email && !error && (
            <div
              style={{
                marginTop: "32px",
                padding: "20px",
                textAlign: "center",
                color: "#666",
              }}
            >
              조회된 신청 내역이 없습니다.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

