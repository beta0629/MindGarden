/**
 * 온보딩 관련 상수
 * 하드코딩 금지 원칙에 따라 모든 상수값을 여기에 정의
 * 
 * @author CoreSolution
 * @version 1.0.0
 */

import { OnboardingStatus } from "@/types/shared";

/**
 * 온보딩 상태 라벨 맵
 */
export const ONBOARDING_STATUS_LABELS: Record<OnboardingStatus, string> = {
  PENDING: "대기 중",
  IN_REVIEW: "검토 중",
  APPROVED: "승인됨",
  REJECTED: "거부됨",
  ON_HOLD: "보류"
};

/**
 * 리스크 레벨 라벨 맵
 */
export const RISK_LEVEL_LABELS = {
  LOW: "LOW",
  MEDIUM: "MEDIUM",
  HIGH: "HIGH"
} as const;

/**
 * 온보딩 페이지 메시지
 */
export const ONBOARDING_MESSAGES = {
  PAGE_TITLE: "테넌트 온보딩 심사",
  PAGE_DESCRIPTION: "온보딩 요청을 검토하고 상세 화면에서 결정을 진행하세요.",
  STATUS_FILTER_DESCRIPTION: (statusLabel: string, count: number) => 
    `상태: ${statusLabel} (${count}건)`,
  TOTAL_DESCRIPTION: (count: number) => 
    `온보딩 요청을 검토하고 상세 화면에서 결정을 진행하세요. (전체 ${count}건)`,
  NO_REQUESTS: "등록된 온보딩 요청이 없습니다.",
  NO_REQUESTS_BY_STATUS: (statusLabel: string) => 
    `${statusLabel} 상태의 온보딩 요청이 없습니다.`,
  VIEW_ALL: "전체 보기",
  VIEW_DETAIL: "보기",
  EMPTY_DATE: "-"
} as const;

/**
 * 테이블 컬럼 라벨
 */
export const ONBOARDING_TABLE_COLUMNS = {
  TENANT: "테넌트",
  REQUESTER: "요청자",
  RISK: "리스크",
  REQUEST_DATE: "요청 일시",
  STATUS: "상태",
  DETAIL: "상세"
} as const;

/**
 * 날짜 포맷 옵션
 */
export const DATE_FORMAT_OPTIONS: Intl.DateTimeFormatOptions = {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit"
};

/**
 * 로케일 설정
 */
export const LOCALE = "ko-KR" as const;

