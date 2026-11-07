/**
 * Expo web NetInfo reachability 는 기본값이 페이지 origin `HEAD /` 이다.
 * Metro 번들러가 죽거나 일시 거부돼도 API 호스트는 살아 있을 수 있으므로,
 * web 에서는 API origin 을 프로브해 배너 오탐을 줄인다.
 * native 는 라이브러리 기본(generate_204)을 유지한다.
 *
 * @author MindGarden
 * @since 2026-11-07
 */
import { Platform } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { getApiBaseUrl } from '@/config/apiBaseUrl';
import {
  buildWebReachabilityUrl,
  isReachabilityHttpSuccess,
} from '@/utils/webNetInfoReachabilityPolicy';

export function configureWebNetInfoReachability(): void {
  if (Platform.OS !== 'web') {
    return;
  }

  const reachabilityUrl = buildWebReachabilityUrl(getApiBaseUrl());

  NetInfo.configure({
    reachabilityUrl,
    reachabilityMethod: 'GET',
    reachabilityHeaders: {},
    reachabilityTest: (response: Response): Promise<boolean> =>
      Promise.resolve(isReachabilityHttpSuccess(response.status)),
    // web native 모듈의 isInternetReachable 외에 JS API 프로브 사용
    useNativeReachability: false,
  });
}
