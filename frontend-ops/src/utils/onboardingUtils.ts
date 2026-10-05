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
import { KR_PUBLIC_DATA_COPY } from "@/content/krPublicData";
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

/**
 * PersonalDataEncryptionUtil 암호문 구분.
 * 이 표식이 남은 값은 화면에 내지 않는다.
 */
const CONTACT_EMAIL_CIPHERTEXT_DELIMITER = "::";

export interface OnboardingDisplay {
  tenantId: string;
  tenantName: string;
  subdomain: string;
  contactEmail: string;
}

export interface OnboardingAdminAccountSummary {
  email?: string | null;
  tenantId?: string | null;
  tenantName?: string | null;
}

function isDisplayableContactEmail(value: string): boolean {
  if (!value || value.includes(CONTACT_EMAIL_CIPHERTEXT_DELIMITER)) {
    return false;
  }
  return looksLikeEmail(value);
}

function firstDisplayableEmail(...values: unknown[]): string {
  for (const value of values) {
    const text = asText(value).toLowerCase();
    if (isDisplayableContactEmail(text)) {
      return text;
    }
  }
  return "";
}

/**
 * 목록 카드·상세·승인 응답이 같이 쓰는 테넌트·로그인 이메일 매핑.
 * 이메일은 checklist contactEmail 만 읽고 adminEmail·requestedBy 는 쓰지 않는다.
 */
export function mapOnboardingDisplay(request: OnboardingRequest): OnboardingDisplay {
  const checklist = readOnboardingChecklist(request.checklistJson);
  return {
    tenantId: asText(request.tenantId),
    tenantName: asText(request.tenantName),
    subdomain: firstText(request.subdomain, checklist.domain, checklist.subdomain),
    contactEmail: firstDisplayableEmail(request.contactEmail, checklist.contactEmail)
  };
}

/**
 * 승인 응답의 request·adminAccount 를 상세에 반영한다.
 * 목록 전체를 다시 받지 않고 이 결과만 상세 상태에 넣는다.
 */
export function applyOnboardingDecisionResponse(
  request: OnboardingRequest,
  adminAccount?: OnboardingAdminAccountSummary | null
): OnboardingRequest {
  const merged: OnboardingRequest = {
    ...request,
    tenantId: firstText(request.tenantId, adminAccount?.tenantId) || null,
    tenantName: firstText(request.tenantName, adminAccount?.tenantName) || request.tenantName
  };
  const display = mapOnboardingDisplay(merged);
  const contactEmail = firstDisplayableEmail(display.contactEmail, adminAccount?.email);
  return {
    ...merged,
    tenantId: display.tenantId || null,
    tenantName: display.tenantName,
    subdomain: display.subdomain || null,
    contactEmail: contactEmail || null
  };
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
  const display = mapOnboardingDisplay(request);
  const requestedBy = asText(request.requestedBy);
  const adminName = firstText(checklist.adminName, request.representativeName);
  const scale = formatStaffSize(
    firstText(checklist.staffSize, checklist.scale, checklist.organizationSize)
  );
  const contactEmail = display.contactEmail || ONBOARDING_MESSAGES.EMPTY_VALUE;

  const facts: OnboardingFact[] = [
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
    }
  ];

  if (request.status === "APPROVED") {
    facts.push({
      id: "tenantId",
      label: ONBOARDING_FACT_LABELS.TENANT_ID,
      value: display.tenantId || ONBOARDING_MESSAGES.EMPTY_VALUE,
      emphasize: false
    });
  }

  facts.push(
    {
      id: "domain",
      label: ONBOARDING_FACT_LABELS.DOMAIN,
      value: display.subdomain || ONBOARDING_MESSAGES.EMPTY_VALUE,
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
      value: contactEmail,
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
      value: contactEmail,
      emphasize: false
    },
    {
      id: "risk",
      label: ONBOARDING_FACT_LABELS.RISK,
      value: getRiskLabel(request.riskLevel),
      emphasize: isHighRisk(request.riskLevel)
    },
    ...buildMerchantLegalFacts(checklist)
  );
  return facts;
}

function merchantLegalOf(checklist: Record<string, unknown>): Record<string, unknown> {
  const raw = checklist.merchantLegal;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return {};
  }
  return raw as Record<string, unknown>;
}

export function buildMerchantLegalFacts(checklist: Record<string, unknown>): OnboardingFact[] {
  const legal = merchantLegalOf(checklist);
  const verificationRaw = legal.businessVerification;
  const verification =
    verificationRaw && typeof verificationRaw === "object" && !Array.isArray(verificationRaw)
      ? (verificationRaw as Record<string, unknown>)
      : {};
  const empty = ONBOARDING_MESSAGES.EMPTY_VALUE;
  return [
    {
      id: "businessRegistrationNumber",
      label: KR_PUBLIC_DATA_COPY.BIZ_NUMBER,
      value: firstText(legal.businessRegistrationNumber) || empty,
      emphasize: false
    },
    {
      id: "representativeName",
      label: KR_PUBLIC_DATA_COPY.REPRESENTATIVE,
      value: firstText(legal.representativeName) || empty,
      emphasize: false
    },
    {
      id: "openingDate",
      label: KR_PUBLIC_DATA_COPY.OPENING_DATE,
      value: firstText(legal.openingDate) || empty,
      emphasize: false
    },
    {
      id: "verificationMatch",
      label: KR_PUBLIC_DATA_COPY.MATCH,
      value: firstText(verification.overallStatus) || KR_PUBLIC_DATA_COPY.UNCONFIRMED,
      emphasize: false
    },
    {
      id: "verificationStatus",
      label: KR_PUBLIC_DATA_COPY.STATUS,
      value: firstText(verification.businessStatus) || KR_PUBLIC_DATA_COPY.UNCONFIRMED,
      emphasize: false
    },
    {
      id: "verificationTax",
      label: KR_PUBLIC_DATA_COPY.TAX,
      value: firstText(verification.taxType) || KR_PUBLIC_DATA_COPY.UNCONFIRMED,
      emphasize: false
    },
    {
      id: "verificationCheckedAt",
      label: KR_PUBLIC_DATA_COPY.CHECKED_AT,
      value: firstText(verification.checkedAt) || KR_PUBLIC_DATA_COPY.UNCONFIRMED,
      emphasize: false
    }
  ];
}
