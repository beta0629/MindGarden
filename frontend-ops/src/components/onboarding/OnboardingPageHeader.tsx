/**
 * 온보딩 페이지 헤더 컴포넌트
 * 하드코딩 금지 원칙에 따라 상수 사용
 */

import Link from "next/link";
import { OnboardingStatus } from "@/types/shared";
import { ONBOARDING_MESSAGES } from "@/constants/onboarding";
import { getStatusLabel } from "@/utils/onboardingUtils";

interface OnboardingPageHeaderProps {
  statusFilter?: OnboardingStatus;
  requestCount: number;
}

export default function OnboardingPageHeader({ 
  statusFilter, 
  requestCount 
}: OnboardingPageHeaderProps) {
  return (
    <header className="panel__header">
      <h1>{ONBOARDING_MESSAGES.PAGE_TITLE}</h1>
      <p>
        {statusFilter 
          ? ONBOARDING_MESSAGES.STATUS_FILTER_DESCRIPTION(getStatusLabel(statusFilter), requestCount)
          : ONBOARDING_MESSAGES.TOTAL_DESCRIPTION(requestCount)
        }
      </p>
      {statusFilter && (
        <Link href="/onboarding" className="ghost-button panel__header-action">
          {ONBOARDING_MESSAGES.VIEW_ALL}
        </Link>
      )}
    </header>
  );
}

