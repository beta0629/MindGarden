/**
 * 온보딩이 쓰는 공개 공공데이터 API. 키는 서버에만 있다.
 */

import { KR_PUBLIC_DATA_PATHS } from '../content/krPublicData';
import { apiGet } from './api';

export interface KrPublicDataCapabilities {
  businessLookupEnabled: boolean;
  addressSearchEnabled: boolean;
}

export interface AddressItem {
  roadAddress: string;
  zipCode: string;
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
