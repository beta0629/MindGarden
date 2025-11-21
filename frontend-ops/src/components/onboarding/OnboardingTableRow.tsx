/**
 * 온보딩 테이블 행 컴포넌트
 * 하드코딩 금지 원칙에 따라 상수 사용
 */

import Link from "next/link";
import { OnboardingRequest } from "@/types/onboarding";
import { ONBOARDING_MESSAGES } from "@/constants/onboarding";
import { formatOnboardingDate } from "@/utils/dateUtils";
import RiskBadge from "./RiskBadge";
import StatusBadge from "./StatusBadge";

interface OnboardingTableRowProps {
  request: OnboardingRequest;
}

export default function OnboardingTableRow({ request }: OnboardingTableRowProps) {
  return (
    <tr>
      <td>
        <div className="table-primary">{request.tenantName}</div>
        <div className="table-secondary">{request.tenantId}</div>
      </td>
      <td>{request.requestedBy}</td>
      <td>
        <RiskBadge level={request.riskLevel} />
      </td>
      <td>{formatOnboardingDate(request.createdAt)}</td>
      <td>
        <StatusBadge status={request.status} />
      </td>
      <td>
        <Link
          className="ghost-button"
          href={`/onboarding/${request.id}`}
        >
          {ONBOARDING_MESSAGES.VIEW_DETAIL}
        </Link>
      </td>
    </tr>
  );
}

