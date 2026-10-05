/**
 * Ops 신청 상세의 다시 확인. 코어 공개 엔드포인트를 호출한다.
 * Ops 로그인 토큰은 코어 세션이 아니므로 이 경로는 IP 한도가 있는 공개 API 다.
 */

import { KR_PUBLIC_DATA_PUBLIC_LOOKUP } from "@/content/krPublicData";

export interface BusinessLookupResult {
  authenticityMatch?: boolean | null;
  businessStatus?: string | null;
  taxType?: string | null;
  checkedAt?: string | null;
  overallStatus?: string | null;
}

export async function recheckBusinessRegistration(payload: {
  businessRegistrationNumber: string;
  openingDate: string;
  representativeName: string;
}): Promise<BusinessLookupResult> {
  const coreApiBaseUrl =
    (typeof window !== "undefined" && (window as { __CORE_API_BASE_URL__?: string }).__CORE_API_BASE_URL__) ||
    process.env.NEXT_PUBLIC_CORE_API_BASE_URL;
  if (!coreApiBaseUrl) {
    throw new Error("core api base missing");
  }
  const response = await fetch(`${coreApiBaseUrl}${KR_PUBLIC_DATA_PUBLIC_LOOKUP}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json"
    },
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    throw new Error("lookup failed");
  }
  const json = (await response.json()) as { data?: BusinessLookupResult } & BusinessLookupResult;
  return json.data || json;
}
