"use client";

import Link from "next/link";
import { OnboardingRequest } from "@/types/onboarding";
import { OnboardingStatus } from "@/types/shared";
import {
  ONBOARDING_LIST_FILTER,
  ONBOARDING_LIST_FILTERS,
  ONBOARDING_MESSAGES,
  ONBOARDING_PATHS,
  type OnboardingListFilter
} from "@/constants/onboarding";
import {
  countOnboardingFilters,
  getListFilterLabel,
  getRequesterDisplayName,
  getRiskLabel,
  getStatusLabel,
  isHighRisk,
  mapOnboardingDisplay
} from "@/utils/onboardingUtils";
import { formatOnboardingDate } from "@/utils/dateUtils";

interface OnboardingCardListProps {
  requests: OnboardingRequest[];
  statusFilter?: OnboardingStatus;
  onFilter: (filter: OnboardingListFilter) => void;
}

export default function OnboardingCardList({
  requests,
  statusFilter,
  onFilter
}: OnboardingCardListProps) {
  const safeRequests = Array.isArray(requests) ? requests : [];
  const counts = countOnboardingFilters(safeRequests);
  const activeFilter: OnboardingListFilter = statusFilter || ONBOARDING_LIST_FILTER.ALL;
  const visibleRequests = statusFilter
    ? safeRequests.filter((request) => request.status === statusFilter)
    : safeRequests;

  return (
    <>
      <div className="ops-onboarding__stats" role="group" aria-label={ONBOARDING_MESSAGES.FILTER_ALL}>
        {ONBOARDING_LIST_FILTERS.map((filter) => {
          const selected = filter === activeFilter;
          const label = getListFilterLabel(filter);
          return (
            <button
              key={filter}
              type="button"
              className={
                selected
                  ? "ops-onboarding__stat ops-onboarding__stat--on"
                  : "ops-onboarding__stat"
              }
              aria-pressed={selected}
              onClick={() => onFilter(filter)}
            >
              <b className="ops-onboarding__stat-value">{counts[filter]}</b>
              <span className="ops-onboarding__stat-label">{label}</span>
            </button>
          );
        })}
      </div>
      {visibleRequests.length === 0 ? (
        <p className="ops-onboarding__empty">
          {statusFilter
            ? ONBOARDING_MESSAGES.NO_REQUESTS_BY_STATUS(getStatusLabel(statusFilter))
            : ONBOARDING_MESSAGES.NO_REQUESTS}
        </p>
      ) : (
        <ul className="ops-onboarding__cards">
          {visibleRequests.map((request) => {
            const display = mapOnboardingDisplay(request);
            const riskLabel = getRiskLabel(request.riskLevel);
            const highRisk = isHighRisk(request.riskLevel);
            return (
              <li key={request.id}>
                <Link
                  className="ops-onboarding__card"
                  href={`${ONBOARDING_PATHS.DETAIL}?id=${encodeURIComponent(String(request.id))}`}
                >
                  <strong className="ops-onboarding__card-title">
                    {display.tenantName || ONBOARDING_MESSAGES.EMPTY_VALUE}
                  </strong>
                  <span className="ops-onboarding__card-status">
                    {getStatusLabel(request.status)}
                  </span>
                  <span className="ops-onboarding__card-meta">
                    {getRequesterDisplayName(request)}
                    {ONBOARDING_MESSAGES.META_SEPARATOR}
                    {highRisk ? (
                      <span className="ops-onboarding__risk--high">{riskLabel}</span>
                    ) : (
                      riskLabel
                    )}
                    {ONBOARDING_MESSAGES.META_SEPARATOR}
                    {formatOnboardingDate(request.createdAt)}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
