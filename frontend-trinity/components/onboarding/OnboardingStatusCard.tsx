"use client";

import { type OnboardingRequest } from "../../utils/api";
import Button from "../Button";
import { COMPONENT_CSS } from "../../constants/css-variables";

interface OnboardingStatusCardProps {
  request: OnboardingRequest;
  onViewDetail?: (id: string) => void; // id는 UUID 문자열
  formatDate: (dateString: string) => string;
  getStatusLabel: (status: string) => { label: string; color: string };
}

/**
 * 온보딩 요청 카드 컴포넌트 (Presentational)
 * 
 * @author Trinity Team
 * @version 1.0.0
 * @since 2025-12-09
 */
export default function OnboardingStatusCard({
  request,
  onViewDetail,
  formatDate,
  getStatusLabel
}: OnboardingStatusCardProps) {
  const statusInfo = getStatusLabel(request.status);

  return (
    <div className="trinity-onboarding-status-card">
      <div className="trinity-onboarding-status-card__header">
        <div className="trinity-onboarding-status-card__header-content">
          <h3 className="trinity-onboarding-status-card__title">
            {request.tenantName}
          </h3>
          {request.id && (
            <p className="trinity-onboarding-status-card__subtitle">
              신청 번호: {request.id}
            </p>
          )}
        </div>
        <span
          className="trinity-onboarding-status-card__badge"
          style={{
            backgroundColor: statusInfo.color + "20",
            color: statusInfo.color,
          }}
        >
          {statusInfo.label}
        </span>
      </div>

      <div className="trinity-onboarding-status-card__body">
        <div className="trinity-onboarding-status-card__info-list">
          <div className="trinity-onboarding-status-card__info-item">
            <span className="trinity-onboarding-status-card__info-label">신청일:</span>
            <span className="trinity-onboarding-status-card__info-value">
              {formatDate(request.createdAt)}
            </span>
          </div>
          {request.decisionAt && (
            <div className="trinity-onboarding-status-card__info-item">
              <span className="trinity-onboarding-status-card__info-label">
                {request.status === "APPROVED" ? "승인" : "거부"}일:
              </span>
              <span className="trinity-onboarding-status-card__info-value">
                {formatDate(request.decisionAt)}
              </span>
            </div>
          )}
          {request.decisionNote && (
            <div className="trinity-onboarding-status-card__info-item">
              <span className="trinity-onboarding-status-card__info-label">처리 메모:</span>
              <span className="trinity-onboarding-status-card__info-value">
                {request.decisionNote}
              </span>
            </div>
          )}
        </div>

        {request.status === "APPROVED" && (
          <div className="trinity-onboarding-status-card__approved-box">
            <div className="trinity-onboarding-status-card__approved-title">
              ✅ 승인 완료
            </div>
            <a
              href={`http://localhost:3001/login?email=${encodeURIComponent(request.requestedBy)}&redirect=/tenant/profile`}
              target="_blank"
              rel="noopener noreferrer"
              className="trinity-onboarding-status-card__login-link"
              onClick={(e) => e.stopPropagation()}
            >
              로그인하기
            </a>
          </div>
        )}
      </div>

      {onViewDetail && request.id && (
        <div className="trinity-onboarding-status-card__footer">
          <Button
            variant="primary"
            size="small"
            onClick={() => {
              // id가 문자열인지 확인하고 전달
              const idString = typeof request.id === 'string' ? request.id : String(request.id);
              if (idString && idString !== 'undefined' && idString !== 'null') {
                onViewDetail(idString);
              } else {
                console.error('Invalid request ID:', request.id);
              }
            }}
            fullWidth
          >
            상세보기
          </Button>
        </div>
      )}
    </div>
  );
}

