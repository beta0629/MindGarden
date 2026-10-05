/**
 * 온보딩 심사 화면 문구·상태 라벨.
 * 화면 컴포넌트에 문구를 직접 두지 않는다.
 *
 * @author CoreSolution
 * @version 1.1.0
 */

import type { OnboardingStatus } from "@/types/shared";

/**
 * 온보딩 상태 라벨 — 신청 심사 화면 문구
 */
export const ONBOARDING_STATUS_LABELS: Record<OnboardingStatus, string> = {
  PENDING: "대기",
  IN_REVIEW: "검토 중",
  APPROVED: "승인",
  REJECTED: "반려",
  ON_HOLD: "보류"
};

/**
 * 리스크 레벨 라벨
 */
export const RISK_LEVEL_LABELS = {
  LOW: "낮음",
  MEDIUM: "보통",
  HIGH: "높음"
} as const;

export type OnboardingRiskLevel = keyof typeof RISK_LEVEL_LABELS;

/**
 * 목록 집계 필터. ALL 은 상태 코드가 아니다.
 */
export const ONBOARDING_LIST_FILTER = {
  ALL: "ALL"
} as const;

export type OnboardingListFilter =
  | typeof ONBOARDING_LIST_FILTER.ALL
  | OnboardingStatus;

/** 집계 칸 순서: 전체 · 대기 · 검토 중 · 보류 · 승인 · 반려 */
export const ONBOARDING_LIST_FILTERS: readonly OnboardingListFilter[] = [
  ONBOARDING_LIST_FILTER.ALL,
  "PENDING",
  "IN_REVIEW",
  "ON_HOLD",
  "APPROVED",
  "REJECTED"
];

/** 결정 버튼 순서. 대기는 결정 값이 아니므로 포함하지 않는다. */
export const ONBOARDING_DECISION_OPTIONS: readonly OnboardingStatus[] = [
  "APPROVED",
  "IN_REVIEW",
  "ON_HOLD",
  "REJECTED"
];

export const ONBOARDING_PATHS = {
  LIST: "/onboarding",
  DETAIL: "/onboarding/detail"
} as const;

/**
 * 목록 API page size. 표시 건수가 아니다.
 */
export const ONBOARDING_LIST_PAGE_SIZE = 100;

export const ONBOARDING_MESSAGES = {
  SECTION: "테넌트",
  PAGE_TITLE: "신청 심사",
  PAGE_DESCRIPTION: "들어온 신청을 골라 결정합니다.",
  FILTER_ALL: "전체",
  NO_REQUESTS: "등록된 신청이 없습니다.",
  NO_REQUESTS_BY_STATUS: (statusLabel: string) =>
    `${statusLabel} 상태의 신청이 없습니다.`,
  VIEW_ALL: "전체 보기",
  VIEW_DETAIL: "보기",
  EMPTY_VALUE: "-",
  EMPTY_DATE: "-",
  META_SEPARATOR: " · ",
  MEMO: "메모",
  SAVE: "결정 저장",
  SAVING: "저장 중...",
  SAVE_SUCCESS: "결정을 저장했습니다.",
  SAVE_FAILED: "결정을 저장하지 못했습니다. 다시 시도해주세요.",
  LOGIN_REQUIRED: "로그인이 필요합니다. 다시 로그인해주세요.",
  PASSWORD_NOTE: "비밀번호는 신청 화면에만 있습니다.",
  DECISION_GROUP: "결정",
  LOADING_TITLE: "로딩 중...",
  LOADING_BODY: "데이터를 불러오는 중입니다...",
  ERROR_TITLE: "오류 발생",
  ERROR_BODY: "데이터를 불러오는데 실패했습니다.",
  MISSING_ID: "ID가 없습니다.",
  NOT_FOUND: "요청 정보를 찾을 수 없습니다.",
  BACK_TO_LIST: "목록으로 돌아가기",
  STATUS_FILTER_DESCRIPTION: (statusLabel: string, count: number) =>
    `상태: ${statusLabel} (${count}건)`,
  TOTAL_DESCRIPTION: (count: number) =>
    `온보딩 요청을 검토하고 상세 화면에서 결정을 진행하세요. (전체 ${count}건)`
} as const;

export const ONBOARDING_FACT_LABELS = {
  BUSINESS_TYPE: "업종",
  SCALE: "규모",
  TENANT_ID: "테넌트 ID",
  DOMAIN: "도메인",
  PHONE: "대표 전화",
  REPRESENTATIVE_EMAIL: "대표 이메일",
  ADMIN: "관리자",
  LOGIN_EMAIL: "로그인 이메일",
  RISK: "위험도"
} as const;

/**
 * 신청 체크리스트에 실릴 수 있는 규모 코드 → 표시 문구.
 * 이미 문장으로 저장된 값은 그대로 보여 준다.
 */
export const ONBOARDING_STAFF_SIZE_LABELS: Record<string, string> = {
  "1-10": "상담사 1–10명",
  "11-50": "상담사 11–50명",
  "51-200": "상담사 51–200명",
  "201+": "상담사 201명 이상",
  "1": "1인",
  "2-5": "2~5인",
  "6-10": "6~10인",
  "11+": "11인 이상"
};

/** checklist JSON 에서 화면으로 읽지 않는 비밀 키 */
export const ONBOARDING_SECRET_KEYS = [
  "password",
  "passwordConfirm",
  "adminPassword",
  "admin_password"
] as const;

export const ONBOARDING_TABLE_COLUMNS = {
  TENANT: "테넌트",
  REQUESTER: "요청자",
  RISK: "리스크",
  REQUEST_DATE: "요청 일시",
  STATUS: "상태",
  DETAIL: "상세"
} as const;

export const DATE_FORMAT_OPTIONS: Intl.DateTimeFormatOptions = {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23"
};

export const LOCALE = "ko-KR" as const;

export const ONBOARDING_TIME_ZONE = "Asia/Seoul" as const;

export const ONBOARDING_DATE_SEPARATOR = "." as const;
