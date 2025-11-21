/**
 * 온보딩 테이블 컴포넌트
 * 하드코딩 금지 원칙에 따라 상수 사용
 */

import { OnboardingRequest } from "@/types/onboarding";
import { OnboardingStatus } from "@/types/shared";
import { ONBOARDING_TABLE_COLUMNS, ONBOARDING_MESSAGES } from "@/constants/onboarding";
import { getStatusLabel } from "@/utils/onboardingUtils";
import OnboardingTableRow from "./OnboardingTableRow";

interface OnboardingTableProps {
  requests: OnboardingRequest[];
  statusFilter?: OnboardingStatus;
}

export default function OnboardingTable({ requests, statusFilter }: OnboardingTableProps) {
  // requests가 배열이 아닌 경우 빈 배열로 처리
  const safeRequests = Array.isArray(requests) ? requests : [];
  
  return (
    <div className="table-wrapper">
      <table className="data-table">
        <thead>
          <tr>
            <th>{ONBOARDING_TABLE_COLUMNS.TENANT}</th>
            <th>{ONBOARDING_TABLE_COLUMNS.REQUESTER}</th>
            <th>{ONBOARDING_TABLE_COLUMNS.RISK}</th>
            <th>{ONBOARDING_TABLE_COLUMNS.REQUEST_DATE}</th>
            <th>{ONBOARDING_TABLE_COLUMNS.STATUS}</th>
            <th>{ONBOARDING_TABLE_COLUMNS.DETAIL}</th>
          </tr>
        </thead>
        <tbody>
          {safeRequests.length === 0 ? (
            <tr>
              <td colSpan={6} className="data-table__empty">
                {statusFilter 
                  ? ONBOARDING_MESSAGES.NO_REQUESTS_BY_STATUS(getStatusLabel(statusFilter))
                  : ONBOARDING_MESSAGES.NO_REQUESTS
                }
              </td>
            </tr>
          ) : (
            safeRequests.map((request) => (
              <OnboardingTableRow key={request.id} request={request} />
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

