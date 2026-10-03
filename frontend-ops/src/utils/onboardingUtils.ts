/**
 * 온보딩 심사 화면용 표시 값.
 * 건수는 목록 데이터에서 계산한다. 비밀번호 키는 읽지 않는다.
 */

import {
  ONBOARDING_DECISION_OPTIONS,
  ONBOARDING_FACT_LABELS,
  ONBOARDING_LIST_FILTER,
  ONBOARDING_LIST_FILTERS,
  ONBOARDING_MESSAGES,
  ONBOARDING_SECRET_KEYS,
  ONBOARDING_STAFF_SIZE_LABELS,
  ONBOARDING_STATUS_LABELS,
  RISK_LEVEL_LABELS,
  type OnboardingListFilter,
  type OnboardingRiskLevel
} from "@/constants/onboarding";
import { OnboardingRequest } from "@/types/onboarding";
import { OnboardingStatus } from "@/types/shared";

const SECRET_KEY_SET = new Set<string>(ONBOARDING_SECRET_KEYS);

export function getStatusLabel(status: OnboardingStatus): string {
  return ONBOARDING_STATUS_LABELS[status] || status;
}

export function getListFilterLabel(filter: OnboardingListFilter): string {
  if (filter === ONBOARDING_LIST_FILTER.ALL) {
    return ONBOARDING_MESSAGES.FILTER_ALL;
  }
  return getStatusLabel(filter);
}

export function isOnboardingListFilter(value: string | null | undefined): value is OnboardingListFilter {
  if (!value) {
    return false;
  }
  return (ONBOARDING_LIST_FILTERS as readonly string[]).includes(value);
}

/**
 * 대기 건은 결정 버튼이 없으므로 승인부터 고른다.
 * 이미 결정된 상태는 그 버튼을 선택한다.
 */
export function resolveInitialDecision(status: OnboardingStatus): OnboardingStatus {
  if ((ONBOARDING_DECISION_OPTIONS as readonly string[]).includes(status)) {
    return status;
  }
  return "APPROVED";
}

export function countOnboardingFilters(
  requests: OnboardingRequest[]
): Record<OnboardingListFilter, number> {
  const counts = ONBOARDING_LIST_FILTERS.reduce((acc, filter) => {
    acc[filter] = 0;
    return acc;
  }, {} as Record<OnboardingListFilter, number>);

  const safeRequests = Array.isArray(requests) ? requests : [];
  counts[ONBOARDING_LIST_FILTER.ALL] = safeRequests.length;

  for (const request of safeRequests) {
    const status = request?.status;
    if (status && status in counts) {
      counts[status] += 1;
    }
  }

  return counts;
}

function asText(value: unknown): string {
  if (typeof value === "string") {
    return value.trim();
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }
  return "";
}

export function readOnboardingChecklist(
  checklistJson?: string | null
): Record<string, unknown> {
  if (!checklistJson || !checklistJson.trim()) {
    return {};
  }
  try {
    const parsed = JSON.parse(checklistJson) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }
    const source = parsed as Record<string, unknown>;
    const safe: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(source)) {
      if (SECRET_KEY_SET.has(key)) {
        continue;
      }
      safe[key] = value;
    }
    return safe;
  } catch {
    return {};
  }
}

function firstText(...values: unknown[]): string {
  for (const value of values) {
    const text = asText(value);
    if (text) {
      return text;
    }
  }
  return "";
}

function looksLikeEmail(value: string): boolean {
  return value.includes("@");
}

export function formatStaffSize(value: string): string {
  if (!value) {
    return ONBOARDING_MESSAGES.EMPTY_VALUE;
  }
  return ONBOARDING_STAFF_SIZE_LABELS[value] || value;
}

export function getRiskLabel(level?: string | null): string {
  if (!level) {
    return ONBOARDING_MESSAGES.EMPTY_VALUE;
  }
  const key = level.toUpperCase() as OnboardingRiskLevel;
  return RISK_LEVEL_LABELS[key] || level;
}

export function isHighRisk(level?: string | null): boolean {
  return (level || "").toUpperCase() === "HIGH";
}

export function getRequesterDisplayName(request: OnboardingRequest): string {
  const checklist = readOnboardingChecklist(request.checklistJson);
  const named = firstText(
    checklist.adminName,
    request.representativeName
  );
  if (named) {
    return named;
  }
  const requestedBy = asText(request.requestedBy);
  if (requestedBy && !looksLikeEmail(requestedBy)) {
    return requestedBy;
  }
  return requestedBy || ONBOARDING_MESSAGES.EMPTY_VALUE;
}

export interface OnboardingFact {
  id: string;
  label: string;
  value: string;
  emphasize: boolean;
}

export function buildOnboardingFacts(request: OnboardingRequest): OnboardingFact[] {
  const checklist = readOnboardingChecklist(request.checklistJson);
  const requestedBy = asText(request.requestedBy);
  const adminName = firstText(checklist.adminName, request.representativeName);
  const loginEmail = firstText(
    checklist.adminEmail,
    looksLikeEmail(requestedBy) ? requestedBy : ""
  );
  const scale = formatStaffSize(
    firstText(checklist.staffSize, checklist.scale, checklist.organizationSize)
  );

  return [
    {
      id: "businessType",
      label: ONBOARDING_FACT_LABELS.BUSINESS_TYPE,
      value: firstText(request.businessType, checklist.businessType) || ONBOARDING_MESSAGES.EMPTY_VALUE,
      emphasize: false
    },
    {
      id: "scale",
      label: ONBOARDING_FACT_LABELS.SCALE,
      value: scale,
      emphasize: false
    },
    {
      id: "domain",
      label: ONBOARDING_FACT_LABELS.DOMAIN,
      value: firstText(request.subdomain, checklist.domain, checklist.subdomain) || ONBOARDING_MESSAGES.EMPTY_VALUE,
      emphasize: false
    },
    {
      id: "phone",
      label: ONBOARDING_FACT_LABELS.PHONE,
      value: firstText(request.businessLandline, checklist.phone, checklist.contactPhone) || ONBOARDING_MESSAGES.EMPTY_VALUE,
      emphasize: false
    },
    {
      id: "representativeEmail",
      label: ONBOARDING_FACT_LABELS.REPRESENTATIVE_EMAIL,
      value: firstText(checklist.email, checklist.representativeEmail) || ONBOARDING_MESSAGES.EMPTY_VALUE,
      emphasize: false
    },
    {
      id: "admin",
      label: ONBOARDING_FACT_LABELS.ADMIN,
      value: adminName || (!looksLikeEmail(requestedBy) ? requestedBy : "") || ONBOARDING_MESSAGES.EMPTY_VALUE,
      emphasize: false
    },
    {
      id: "loginEmail",
      label: ONBOARDING_FACT_LABELS.LOGIN_EMAIL,
      value: loginEmail || ONBOARDING_MESSAGES.EMPTY_VALUE,
      emphasize: false
    },
    {
      id: "risk",
      label: ONBOARDING_FACT_LABELS.RISK,
      value: getRiskLabel(request.riskLevel),
      emphasize: isHighRisk(request.riskLevel)
    }
  ];
}
