/**
 * 기능 코드를 한글로 변환하는 유틸리티
 */

import { TRINITY_CONSTANTS } from '../constants/trinity';

/**
 * 기능 코드 배열을 한글 이름 배열로 변환
 * @param features 기능 코드 배열 (예: ['CONSULTATION', 'APPOINTMENT'])
 * @returns 한글 이름 배열 (예: ['상담 관리', '예약 관리'])
 */
export function convertFeaturesToKorean(features: string[]): string[] {
  return features.map((feature: string) => {
    // 기능 코드 매핑에 있으면 한글로 변환
    const koreanName = TRINITY_CONSTANTS.FEATURE_NAMES[feature as keyof typeof TRINITY_CONSTANTS.FEATURE_NAMES];
    if (koreanName) {
      return koreanName;
    }
    // 매핑에 없으면 원본 반환 (이미 한글이거나 알 수 없는 코드)
    return feature;
  });
}

/**
 * features_json을 파싱하고 한글로 변환
 * @param featuresJson JSON 문자열 또는 배열
 * @returns 한글 이름 배열
 */
export function parseAndConvertFeatures(featuresJson: string | string[] | undefined): string[] {
  if (!featuresJson) {
    return [];
  }
  
  try {
    let features: string[] = [];
    
    if (typeof featuresJson === 'string') {
      const parsed = JSON.parse(featuresJson);
      if (Array.isArray(parsed)) {
        features = parsed;
      } else {
        return [];
      }
    } else if (Array.isArray(featuresJson)) {
      features = featuresJson;
    } else {
      return [];
    }
    
    return convertFeaturesToKorean(features);
  } catch (err) {
    console.warn("features 파싱 실패:", err);
    return [];
  }
}

