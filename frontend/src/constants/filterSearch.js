/**
 * 필터 및 검색 관련 상수 정의
 * 
 * @author Core Solution
 * @version 1.0.0
 * @since 2025-12-09
 */

// 검색 관련 상수
export const SEARCH_PLACEHOLDER = "이름, 이메일, 전화번호 또는 #태그로 검색...";
export const DEBOUNCE_DELAY = 300;
export const SEARCH_MIN_LENGTH = 2; // 최소 검색어 길이
export const HASHTAG_ENABLED = true; // 해시태그 검색 활성화

// 필터 관련 상수
export const FILTER_CHIP_CLEAR_ALL = "모두 제거";
export const FILTER_LABEL_ALL = "전체";

// 빠른 필터 옵션
export const QUICK_FILTER_OPTIONS = [
  { value: 'all', label: '전체' },
  { value: 'active', label: '활성' },
  { value: 'inactive', label: '비활성' }
];

// 필터 타입
export const FILTER_TYPES = {
  STATUS: 'status',
  CATEGORY: 'category',
  DATE_RANGE: 'dateRange',
  NUMBER_RANGE: 'numberRange'
};

