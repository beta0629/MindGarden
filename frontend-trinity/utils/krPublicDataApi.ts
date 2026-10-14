/**
 * 온보딩이 쓰는 공개 공공데이터 API. 키는 서버에만 있다.
 */

import { KR_PUBLIC_DATA_PATHS } from '../content/krPublicData';
import { apiGet, apiPost } from './api';

export interface KrPublicDataCapabilities {
  businessLookupEnabled: boolean;
  addressSearchEnabled: boolean;
}

export interface AddressItem {
  roadAddress: string;
  zipCode: string;
}

export interface BusinessVerificationResult {
  authenticityMatch?: boolean | null;
  businessStatus?: string | null;
  taxType?: string | null;
  checkedAt?: string | null;
  overallStatus?: string | null;
  verificationStatus?: string | null;
  resultCode?: string | null;
  suspendedWarning?: boolean | null;
}

interface AddressSearchResult {
  enabled: boolean;
  items?: AddressItem[];
}

export async function fetchPublicCapabilities(): Promise<KrPublicDataCapabilities> {
  return apiGet<KrPublicDataCapabilities>(KR_PUBLIC_DATA_PATHS.CAPABILITIES);
}

export async function searchPublicAddresses(keyword: string): Promise<AddressItem[]> {
  const query = `${KR_PUBLIC_DATA_PATHS.ADDRESSES}?keyword=${encodeURIComponent(keyword)}`;
  const result = await apiGet<AddressSearchResult>(query);
  return result?.items ?? [];
}

export async function lookupPublicBusinessRegistration(payload: {
  businessRegistrationNumber: string;
  openingDate: string;
  representativeName: string;
}): Promise<BusinessVerificationResult> {
  return apiPost<BusinessVerificationResult>(KR_PUBLIC_DATA_PATHS.LOOKUP, payload);
}
