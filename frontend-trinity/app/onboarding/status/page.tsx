"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Header from "../../../components/Header";
import Button from "../../../components/Button";
import OnboardingStatusCard from "../../../components/onboarding/OnboardingStatusCard";
import { COMPONENT_CSS } from "../../../constants/css-variables";
import { TRINITY_CONSTANTS } from "../../../constants/trinity";
import {
  getPublicOnboardingRequests,
  getPublicOnboardingRequest,
  type OnboardingRequest,
  type PublicOnboardingContactQuery,
} from "../../../utils/api";
import {
  formatPhoneDisplay,
  isValidKoreanMobileDigits,
  normalizeKoreanMobileDigits,
  validatePhoneFormat,
} from "../../../utils/phoneUtils";
import "../../../styles/components/onboarding-status.css";

const { MESSAGES } = TRINITY_CONSTANTS;

function buildContactQuery(phone: string, email: string): PublicOnboardingContactQuery {
  const query: PublicOnboardingContactQuery = {};
  const phoneDigits = normalizeKoreanMobileDigits(phone);
  if (phoneDigits) {
    query.phone = phoneDigits;
  }
  const trimmedEmail = email.trim();
  if (trimmedEmail) {
    query.email = trimmedEmail;
  }
  return query;
}

function hasContactInput(phone: string, email: string): boolean {
  const phoneDigits = normalizeKoreanMobileDigits(phone);
  return Boolean(phoneDigits || email.trim());
}

export default function OnboardingStatusPage() {
  const searchParams = useSearchParams();
  const initialPhone = searchParams.get("phone") || "";
  const initialEmail = searchParams.get("email") || "";
  const [phone, setPhone] = useState(
    initialPhone ? formatPhoneDisplay(initialPhone) : ""
  );
  const [email, setEmail] = useState(initialEmail);
  const [requestId, setRequestId] = useState(searchParams.get("id") || "");
  const [requests, setRequests] = useState<OnboardingRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<OnboardingRequest | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  const validateContact = (): PublicOnboardingContactQuery | null => {
    const phoneDigits = normalizeKoreanMobileDigits(phone);
    const trimmedEmail = email.trim();

    if (!phoneDigits && !trimmedEmail) {
      setError(MESSAGES.STATUS_LOOKUP_CONTACT_REQUIRED);
      return null;
    }

    if (phone.trim() && !isValidKoreanMobileDigits(phoneDigits)) {
      const phoneValidation = validatePhoneFormat(phone);
      setError(phoneValidation.error || MESSAGES.ERROR_PHONE_INVALID);
      return null;
    }

    return buildContactQuery(phone, email);
  };

  const handleSearch = async () => {
    const contactQuery = validateContact();
    if (!contactQuery) {
      return;
    }

    setLoading(true);
    setError(null);
    setSelectedRequest(null);
    setSearched(true);

    try {
      if (requestId && requestId.trim()) {
        const request = await getPublicOnboardingRequest(requestId.trim(), contactQuery);
        setSelectedRequest(request);
        setRequests([]);
      } else {
        const results = await getPublicOnboardingRequests(contactQuery);
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
      PENDING: { label: "대기 중", color: "var(--color-warning)" },
      APPROVED: { label: "승인됨", color: "var(--color-success)" },
      REJECTED: { label: "거부됨", color: "var(--color-danger)" },
      ON_HOLD: { label: "보류", color: "var(--color-secondary)" },
    };
    return statusMap[status] || { label: status, color: "var(--color-secondary)" };
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
        timeZone: "Asia/Seoul",
      });
    } catch {
      return dateString;
    }
  };

  const handlePhoneChange = (value: string) => {
    const digits = normalizeKoreanMobileDigits(value);
    setPhone(digits ? formatPhoneDisplay(digits) : value.replace(/\D/g, ""));
  };

  const canSearch = hasContactInput(phone, email);

  return (
    <div className="trinity-onboarding">
      <Header theme="dark" />
      <div className={COMPONENT_CSS.ONBOARDING.CONTAINER}>
        <div className={COMPONENT_CSS.ONBOARDING.FORM}>
          <h1 className={COMPONENT_CSS.ONBOARDING.TITLE}>온보딩 신청 상태 조회</h1>
          <p className={`${COMPONENT_CSS.ONBOARDING.TEXT_SECONDARY} trinity-onboarding-status__description`}>
            {MESSAGES.STATUS_LOOKUP_DESCRIPTION}
          </p>

          <div className={COMPONENT_CSS.ONBOARDING.FIELD}>
            <label className={COMPONENT_CSS.ONBOARDING.LABEL}>
              {MESSAGES.STATUS_LOOKUP_CONTACT_LABEL}{" "}
              <span className="trinity-onboarding-status__required">*</span>
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => handlePhoneChange(e.target.value)}
              placeholder={MESSAGES.STATUS_LOOKUP_PHONE_PLACEHOLDER}
              className={`${COMPONENT_CSS.ONBOARDING.INPUT} trinity-onboarding-status__input`}
              autoComplete="tel"
            />
          </div>

          <div className={COMPONENT_CSS.ONBOARDING.FIELD}>
            <label className={COMPONENT_CSS.ONBOARDING.LABEL}>
              이메일 (선택)
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={MESSAGES.STATUS_LOOKUP_EMAIL_PLACEHOLDER}
              className={`${COMPONENT_CSS.ONBOARDING.INPUT} trinity-onboarding-status__input`}
              autoComplete="email"
            />
          </div>

          <div className={COMPONENT_CSS.ONBOARDING.FIELD}>
            <label className={COMPONENT_CSS.ONBOARDING.LABEL}>
              {MESSAGES.STATUS_LOOKUP_REQUEST_ID_LABEL}
            </label>
            <input
              type="text"
              value={requestId}
              onChange={(e) => setRequestId(e.target.value)}
              placeholder={MESSAGES.STATUS_LOOKUP_REQUEST_ID_PLACEHOLDER}
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
            disabled={loading || !canSearch}
            variant="primary"
            fullWidth
            loading={loading}
            loadingText={MESSAGES.STATUS_LOOKUP_SEARCHING}
          >
            {MESSAGES.STATUS_LOOKUP_SEARCH}
          </Button>

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
                      setRequestId(typeof id === "string" ? id : String(id));
                      void handleSearch();
                    }}
                    formatDate={formatDate}
                    getStatusLabel={getStatusLabel}
                  />
                ))}
              </div>
            </div>
          )}

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

          {requests.length === 0 && !selectedRequest && !loading && searched && !error && (
            <div className="trinity-onboarding-status__empty">
              {MESSAGES.STATUS_LOOKUP_EMPTY}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
