/**
 * 코어 테넌트 화면이 쓰는 인증 공공데이터 API.
 */

import StandardizedApi from './standardizedApi';
import { KR_PUBLIC_DATA_PATHS } from '../content/krPublicData';

export async function fetchKrPublicDataCapabilities() {
  return StandardizedApi.get(KR_PUBLIC_DATA_PATHS.CAPABILITIES);
}

export async function searchKrAddresses(keyword) {
  const result = await StandardizedApi.get(KR_PUBLIC_DATA_PATHS.ADDRESSES, { keyword });
  return result?.items || [];
}

export async function lookupBusinessRegistration(payload) {
  return StandardizedApi.post(KR_PUBLIC_DATA_PATHS.LOOKUP, payload);
}
